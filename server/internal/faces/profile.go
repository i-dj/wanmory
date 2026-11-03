package faces

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

const maxCompanions = 24

// Moment 是这个人出现的一张照片：拍摄时间、地点，和照片里他（她）那张脸。
// 网页按生日把它们分成年龄段、按地点聚成去过的地方，都在网页上算
type Moment struct {
	Asset   uuid.UUID `json:"asset"`
	Face    uuid.UUID `json:"face"`
	Quality float64   `json:"quality"` // 这张脸适不适合当代表：清楚、正、大的高
	Taken   time.Time `json:"taken"`   // 拍摄时间，没有就用文件修改时间
	Dated   bool      `json:"dated"`   // 文件里记录了拍摄时间；没有的（截图、转发来的图）按年龄分段时不算
	Lat     *float64  `json:"lat"`
	Lon     *float64  `json:"lon"`
	Video   bool      `json:"video"`
	// 这张脸在预览图上的位置（占宽高的比例）和 5 个关键点（两眼、鼻尖、两嘴角），成长延时按它对齐
	Box       [4]float64      `json:"box"`
	Landmarks json.RawMessage `json:"landmarks"`
}

// Companion 是常和这个人一起出现的人：一起出现在 Shared 张照片里
type Companion struct {
	ID     uuid.UUID  `json:"id"`
	Name   string     `json:"name"`
	Cover  *uuid.UUID `json:"cover"`
	Shared int        `json:"shared"`
}

type Profile struct {
	Moments    []Moment    `json:"moments"`
	Companions []Companion `json:"companions"`
}

// profile：GET /api/people/{id}/profile，这个人的所有照片（按拍摄时间）和常一起出现的人，人物页的「成长」「足迹」「亲友」用。
// 隐藏、删除了的照片不算
func (s *Service) profile(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "人物 ID 格式不对")
		return
	}
	ctx := r.Context()
	var exists bool
	if err := s.db.QueryRowContext(ctx, `SELECT EXISTS (SELECT 1 FROM people WHERE id = $1)`, id).Scan(&exists); err != nil {
		httpx.InternalError(w, err)
		return
	}
	if !exists {
		httpx.Error(w, http.StatusNotFound, "人物不存在")
		return
	}

	p := Profile{Moments: []Moment{}, Companions: []Companion{}}
	// 一张照片里同一个人有两张脸（镜子、照片里的照片）时取更好的那张
	rows, err := s.db.QueryContext(ctx, `
		SELECT * FROM (
			SELECT DISTINCT ON (a.id) a.id, f.id,
			       (CASE WHEN f.good THEN 1 ELSE 0 END) + f.score * sqrt(f.box_w * f.box_h) * 2 - abs(f.yaw) * 0.5,
			       COALESCE(a.taken_at, a.file_mtime), a.taken_at IS NOT NULL, a.latitude, a.longitude, a.type = 'video',
			       f.box_x, f.box_y, f.box_w, f.box_h, f.landmarks
			FROM faces f JOIN assets a ON a.id = f.asset_id
			WHERE f.person_id = $1 AND `+visibleTo("a", `$2`)+`
			ORDER BY a.id, f.good DESC, f.score * f.box_w * f.box_h DESC
		) m ORDER BY 4, 1`, id, auth.UserID(r.Context()))
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer rows.Close()
	for rows.Next() {
		var m Moment
		var lat, lon sql.NullFloat64
		var landmarks []byte
		if err := rows.Scan(&m.Asset, &m.Face, &m.Quality, &m.Taken, &m.Dated, &lat, &lon, &m.Video,
			&m.Box[0], &m.Box[1], &m.Box[2], &m.Box[3], &landmarks); err != nil {
			httpx.InternalError(w, err)
			return
		}
		m.Landmarks = landmarks
		if lat.Valid && lon.Valid && (lat.Float64 != 0 || lon.Float64 != 0) {
			m.Lat, m.Lon = &lat.Float64, &lon.Float64
		}
		p.Moments = append(p.Moments, m)
	}
	if err := rows.Err(); err != nil {
		httpx.InternalError(w, err)
		return
	}

	if p.Companions, err = s.companions(r, id); err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, p)
}

// companions 是和 id 一起出现在同一张照片里最多的几个人
func (s *Service) companions(r *http.Request, id uuid.UUID) ([]Companion, error) {
	rows, err := s.db.QueryContext(r.Context(), `
		SELECT p.id, p.name, `+coverFace(`$3`)+`, count(DISTINCT me.asset_id)
		FROM faces me
		JOIN assets a ON a.id = me.asset_id AND `+visibleTo("a", `$3`)+`
		JOIN faces other ON other.asset_id = me.asset_id AND other.person_id <> me.person_id
		JOIN people p ON p.id = other.person_id
		WHERE me.person_id = $1
		GROUP BY p.id
		ORDER BY count(DISTINCT me.asset_id) DESC, p.name = '', p.created_at
		LIMIT $2`, id, maxCompanions, auth.UserID(r.Context()))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Companion{}
	for rows.Next() {
		var c Companion
		if err := rows.Scan(&c.ID, &c.Name, &c.Cover, &c.Shared); err != nil {
			return nil, err
		}
		list = append(list, c)
	}
	if err := rows.Err(); err != nil && !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	return list, nil
}
