package assets

import (
	"cmp"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// 用户在大图信息栏里改的字段，记在 assets.edited 里
const (
	EditTakenAt  = "taken_at"
	EditLocation = "location"
)

const maxDescription = 2000 // 说明最多这么多个字
const maxPlaceName = 200    // 用户选的地名最多这么多个字

// LocalTime 是拍摄地的钟表时间加时区，例如 {"local": "2026-10-27T13:01:23", "offset": "-04:00"}。
type LocalTime struct {
	Local  string `json:"local"`
	Offset string `json:"offset"`
}

// Time 换算成绝对时间
func (t LocalTime) Time() (time.Time, error) {
	o, err := time.Parse("-07:00", t.Offset)
	if err != nil {
		return time.Time{}, fmt.Errorf("时区格式不对：%q", t.Offset)
	}
	_, secs := o.Zone()
	v, err := time.ParseInLocation("2006-01-02T15:04:05", t.Local, time.FixedZone(t.Offset, secs))
	if err != nil {
		return time.Time{}, fmt.Errorf("时间格式不对：%q", t.Local)
	}
	return v, nil
}

type Location struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	Name      string  `json:"name,omitempty"` // 用户从搜索结果里选的地名，存进 place_name；在地图上点的没有
}

func (l Location) valid() bool {
	return l.Latitude >= -90 && l.Latitude <= 90 && l.Longitude >= -180 && l.Longitude <= 180
}

// InfoPatch 是信息栏里的修改，为空的不改。
type InfoPatch struct {
	Description    *string
	TakenAt        *LocalTime
	Location       *Location
	RemoveLocation bool     // 去掉位置
	Reset          []string // 还原成文件里的：EditTakenAt、EditLocation
}

// Original 是文件里记录的拍摄时间和位置，从 exif 列重新解析。用户改过以后，信息栏用它对照、还原。
type Original struct {
	TakenAt       *time.Time `json:"-"`
	TakenAtLocal  *string    `json:"taken_at_local"`
	TakenAtOffset *string    `json:"taken_at_offset"`
	Latitude      *float64   `json:"latitude"`
	Longitude     *float64   `json:"longitude"`
}

func (s *Store) Original(ctx context.Context, id uuid.UUID) (Original, error) {
	var raw []byte
	err := s.db.QueryRowContext(ctx, `SELECT exif FROM assets WHERE id = $1`, id).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return Original{}, ErrNotFound
	}
	if err != nil {
		return Original{}, err
	}
	var tags map[string]any
	if err := json.Unmarshal(raw, &tags); err != nil {
		return Original{}, err
	}
	m, err := parseMetadata(tags)
	if err != nil {
		return Original{}, err
	}
	o := Original{TakenAt: m.TakenAt, Latitude: m.Latitude, Longitude: m.Longitude}
	if v, ok := firstString(tags, "OffsetTimeOriginal", "OffsetTime"); ok {
		o.TakenAtOffset = &v
	}
	o.TakenAtLocal = localClock(o.TakenAt, o.TakenAtOffset)
	return o, nil
}

// UpdateInfo 保存信息栏里的修改。删除了的照片不能改。
// ShiftTaken 把几张照片的拍摄时间都往后挪 shift 秒（负数往前），照片之间的间隔不变；offset 不为空时时区都改成它。
// 没有拍摄时间的按文件修改时间挪。记进 edited，可以还原
func (s *Store) ShiftTaken(ctx context.Context, ids []uuid.UUID, shift int64, offset *string) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE assets SET taken_at = COALESCE(taken_at, file_mtime) + make_interval(secs => $2),
			taken_offset = COALESCE($3, taken_offset),
			edited = array_append(array_remove(edited, $4), $4), updated_at = now()
		WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`, uuidStrings(ids), shift, offset, EditTakenAt)
	return err
}

func (s *Store) UpdateInfo(ctx context.Context, id uuid.UUID, p InfoPatch) error {
	var orig Original
	if len(p.Reset) > 0 {
		var err error
		if orig, err = s.Original(ctx, id); err != nil {
			return err
		}
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	set := func(assignments string, args ...any) error {
		res, err := tx.ExecContext(ctx, `UPDATE assets SET `+assignments+`, updated_at = now()
			WHERE id = $1 AND deleted_at IS NULL`, append([]any{id}, args...)...)
		if err != nil {
			return err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return ErrNotFound
		}
		return nil
	}
	// mark 把字段记进 edited（已经有了不重复加），unmark 去掉
	const mark = `edited = array_append(array_remove(edited, $%d), $%[1]d)`
	const unmark = `edited = array_remove(edited, $%d)`

	if p.Description != nil {
		if err := set(`description = $2`, *p.Description); err != nil {
			return err
		}
	}
	if slices.Contains(p.Reset, EditTakenAt) {
		if err := set(`taken_at = $2, taken_offset = NULL, `+fmt.Sprintf(unmark, 3), orig.TakenAt, EditTakenAt); err != nil {
			return err
		}
	} else if p.TakenAt != nil {
		t, err := p.TakenAt.Time()
		if err != nil {
			return err
		}
		if err := set(`taken_at = $2, taken_offset = $3, `+fmt.Sprintf(mark, 4), t, p.TakenAt.Offset, EditTakenAt); err != nil {
			return err
		}
	}
	if slices.Contains(p.Reset, EditLocation) {
		if err := set(`latitude = $2, longitude = $3, place_name = NULL, `+fmt.Sprintf(unmark, 4),
			orig.Latitude, orig.Longitude, EditLocation); err != nil {
			return err
		}
	} else if p.RemoveLocation {
		if err := set(`latitude = NULL, longitude = NULL, place_name = NULL, `+fmt.Sprintf(mark, 2), EditLocation); err != nil {
			return err
		}
	} else if p.Location != nil {
		if err := set(`latitude = $2, longitude = $3, place_name = NULLIF($5, ''), `+fmt.Sprintf(mark, 4),
			p.Location.Latitude, p.Location.Longitude, EditLocation, strings.TrimSpace(p.Location.Name)); err != nil {
			return err
		}
	}
	return tx.Commit()
}

// PersonIn 是照片里认出来、起了名字的一个人：Face 是他在这张照片里的那张脸（信息栏的小头像），
// Birthday 是 2024-05-01，没设置是 nil（网页按它和拍摄时间算当时多大）
type PersonIn struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Birthday *string   `json:"birthday"`
	Face     uuid.UUID `json:"face"`
}

// PeopleIn 是照片里起了名字的人，按在照片里从左到右排
func (s *Store) PeopleIn(ctx context.Context, id uuid.UUID) ([]PersonIn, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT DISTINCT ON (p.id) p.id, p.name, to_char(p.birthday, 'YYYY-MM-DD'), f.id, f.box_x
		FROM faces f JOIN people p ON p.id = f.person_id
		WHERE f.asset_id = $1 AND p.name <> ''
		ORDER BY p.id, f.box_w DESC`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	type row struct {
		PersonIn
		x float64
	}
	var list []row
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.ID, &r.Name, &r.Birthday, &r.Face, &r.x); err != nil {
			return nil, err
		}
		list = append(list, r)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	slices.SortFunc(list, func(a, b row) int { return cmp.Compare(a.x, b.x) })
	out := make([]PersonIn, len(list))
	for i, r := range list {
		out[i] = r.PersonIn
	}
	return out, nil
}

// AlbumsOf 是这张照片在哪些相册里：手动放进去的，加上条件符合的自动同步智能相册
func (s *Store) AlbumsOf(ctx context.Context, user, id uuid.UUID) ([]uuid.UUID, error) {
	ids := []uuid.UUID{}
	rows, err := s.db.QueryContext(ctx, `
		SELECT al.id FROM album_assets x JOIN albums al ON al.id = x.album_id
		WHERE x.asset_id = $1 AND NOT (al.kind = 'smart' AND al.auto_sync AND al.rules IS NOT NULL)
		  AND `+albumVisible(`$2`), id, user)
	if err != nil {
		return nil, err
	}
	for rows.Next() {
		var a uuid.UUID
		if err := rows.Scan(&a); err != nil {
			rows.Close()
			return nil, err
		}
		ids = append(ids, a)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	albums, err := s.queryAlbums(ctx, user, `al.kind = 'smart' AND al.auto_sync AND al.rules IS NOT NULL`)
	if err != nil {
		return nil, err
	}
	for _, al := range albums {
		args := []any{id}
		var in bool
		err := s.db.QueryRowContext(ctx, `SELECT EXISTS (SELECT 1 FROM assets WHERE id = $1 AND `+
			scopeConditions[ScopeNormal]+` AND `+al.Rules.SQL(&args)+`)`, args...).Scan(&in)
		if err != nil {
			return nil, err
		}
		if in {
			ids = append(ids, al.ID)
		}
	}
	return ids, nil
}

// details 是信息栏要的额外信息：GET /api/assets/{id}/details，返回照片在哪些相册里，以及文件里原始的拍摄时间和位置
func (s *Service) details(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "照片 ID 格式不对")
		return
	}
	orig, err := s.store.Original(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, err.Error())
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	albums, err := s.store.AlbumsOf(r.Context(), auth.UserID(r.Context()), id)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	people, err := s.store.PeopleIn(r.Context(), id)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"albums": albums, "original": orig, "people": people})
}

// infoRequest 是 PATCH /api/assets/{id} 里信息栏的那部分。location 为 null 表示去掉位置，不带表示不改。
type infoRequest struct {
	Description *string         `json:"description"`
	TakenAt     *LocalTime      `json:"taken_at"`
	Location    json.RawMessage `json:"location"`
	Reset       []string        `json:"reset"`
}

// patch 检查请求，转成 InfoPatch
func (req infoRequest) patch() (InfoPatch, error) {
	p := InfoPatch{Description: req.Description, TakenAt: req.TakenAt}
	if p.Description != nil && len([]rune(*p.Description)) > maxDescription {
		return p, fmt.Errorf("说明最多 %d 个字", maxDescription)
	}
	if p.TakenAt != nil {
		if _, err := p.TakenAt.Time(); err != nil {
			return p, err
		}
	}
	if len(req.Location) > 0 {
		if string(req.Location) == "null" {
			p.RemoveLocation = true
		} else {
			var l Location
			if err := json.Unmarshal(req.Location, &l); err != nil || !l.valid() {
				return p, errors.New("位置格式不对，纬度应该在 -90 到 90 之间，经度在 -180 到 180 之间")
			}
			if len([]rune(l.Name)) > maxPlaceName {
				return p, fmt.Errorf("地名最多 %d 个字", maxPlaceName)
			}
			p.Location = &l
		}
	}
	for _, f := range req.Reset {
		if f != EditTakenAt && f != EditLocation {
			return p, fmt.Errorf("不能还原 %q", f)
		}
	}
	p.Reset = req.Reset
	return p, nil
}

func (p InfoPatch) empty() bool {
	return p.Description == nil && p.TakenAt == nil && p.Location == nil && !p.RemoveLocation && len(p.Reset) == 0
}
