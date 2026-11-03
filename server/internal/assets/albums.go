package assets

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"slices"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/ai"
	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

var (
	ErrAlbumNotFound = errors.New("相册不存在")
	ErrAlbumSynced   = errors.New("这个智能相册按条件自动同步，不能手动添加或移除照片")
	ErrAlbumNotOwner = errors.New("只有建这个相册的人能改它")
)

// albumVisible 是「user（参数 $n）看得到相册 al」的条件：自己建的；或者共享的，而且没限定成员（全家都能看）或限定的成员里有他
func albumVisible(u string) string {
	return `(al.owner_id = ` + u + ` OR (NOT al.private AND (
		NOT EXISTS (SELECT 1 FROM album_members m WHERE m.album_id = al.id) OR
		EXISTS (SELECT 1 FROM album_members m WHERE m.album_id = al.id AND m.user_id = ` + u + `))))`
}

const maxAlbumName = 100 // 相册名最多多少个字

// Album 是一个相册。Count 和 Cover 只算没隐藏、没删除的照片（自己的私有相册还算上自己隐藏的），和相册里看到的一致。
// 智能相册（Kind 是 smart）带着条件 Rules；AutoSync 为 true 时照片按条件现查，不存在 album_assets 里。
// Private 的只有主人（Owner）看得到；HideMine 是主人自己传的照片同时隐藏，见 migrations/00023_albums_private.sql
type Album struct {
	Owner     *uuid.UUID  `json:"owner"`
	OwnerName string      `json:"owner_name"`
	Private   bool        `json:"private"`
	HideMine  bool        `json:"hide_mine"`
	Members   []uuid.UUID `json:"members"` // 共享相册只给这几个人看（不含主人）；空的是全家都能看
	ID        uuid.UUID   `json:"id"`
	Name      string      `json:"name"`
	Kind      string      `json:"kind"` // normal 或 smart
	Rules     *SmartRules `json:"rules"`
	AutoSync  bool        `json:"auto_sync"`
	Count     int         `json:"count"`
	Cover     *uuid.UUID  `json:"cover"`     // 封面：用户选的那张；没选（或选的不在了）时是相册里最新一张有缩略图的照片，都没有时为空
	CoverSet  bool        `json:"cover_set"` // 封面是用户选的（网页上可以「恢复默认封面」）
	CreatedAt time.Time   `json:"created_at"`
}

// synced 是按条件现查的智能相册
func (a *Album) synced() bool { return a.Kind == "smart" && a.AutoSync && a.Rules != nil }

// albumCondition 是「在某个相册里」的条件，照片列表按相册筛选时用
const albumCondition = `id IN (SELECT asset_id FROM album_assets WHERE album_id = $%d)`

// Albums 是 user 看得到的相册：共享的，加上他自己的私有相册
func (s *Store) Albums(ctx context.Context, user uuid.UUID) ([]Album, error) {
	return s.queryAlbums(ctx, user, ``)
}

// Album 是一个相册；user 看不到（别人的私有相册）时和不存在一样
func (s *Store) Album(ctx context.Context, user, id uuid.UUID) (*Album, error) {
	list, err := s.queryAlbums(ctx, user, `al.id = $1`, id)
	if err != nil {
		return nil, err
	}
	if len(list) == 0 {
		return nil, ErrAlbumNotFound
	}
	return &list[0], nil
}

// queryAlbums 查 user 看得到的相册，cond 是另外的条件（可以为空），参数从 $1 起
func (s *Store) queryAlbums(ctx context.Context, user uuid.UUID, cond string, args ...any) ([]Album, error) {
	args = append(args, user)
	u := fmt.Sprintf(`$%d`, len(args))
	where := ` WHERE ` + albumVisible(u)
	if cond != "" {
		where += ` AND ` + cond
	}
	visible := `a.deleted_at IS NULL AND (NOT a.hidden OR (al.private AND al.owner_id = ` + u + ` AND a.hidden_by = ` + u + `))`
	rows, err := s.db.QueryContext(ctx, `
		SELECT al.id, al.name, al.kind, al.rules, al.auto_sync, al.created_at,
		       al.owner_id, COALESCE((SELECT name FROM users WHERE id = al.owner_id), ''), al.private, al.hide_mine,
		       (SELECT COALESCE(string_agg(user_id::text, ','), '') FROM album_members WHERE album_id = al.id),
		       (SELECT a.id FROM assets a WHERE a.id = al.cover_id AND `+visible+` AND a.thumbnail_path IS NOT NULL),
		       (SELECT count(*) FROM album_assets x JOIN assets a ON a.id = x.asset_id
		        WHERE x.album_id = al.id AND `+visible+`),
		       (SELECT a.id FROM album_assets x JOIN assets a ON a.id = x.asset_id
		        WHERE x.album_id = al.id AND `+visible+` AND a.thumbnail_path IS NOT NULL
		        ORDER BY `+takenExpr+` DESC, a.id DESC LIMIT 1)
		FROM albums al`+where+`
		ORDER BY al.created_at DESC`, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Album{}
	for rows.Next() {
		var a Album
		var rules []byte
		var chosen *uuid.UUID
		var members string
		if err := rows.Scan(&a.ID, &a.Name, &a.Kind, &rules, &a.AutoSync, &a.CreatedAt,
			&a.Owner, &a.OwnerName, &a.Private, &a.HideMine, &members, &chosen, &a.Count, &a.Cover); err != nil {
			return nil, err
		}
		a.Members = []uuid.UUID{}
		for _, m := range strings.Split(members, ",") {
			if id, err := uuid.Parse(m); err == nil {
				a.Members = append(a.Members, id)
			}
		}
		if chosen != nil {
			a.Cover, a.CoverSet = chosen, true
		}
		if rules != nil {
			if err := json.Unmarshal(rules, &a.Rules); err != nil {
				return nil, fmt.Errorf("相册 %s 的条件格式不对: %w", a.ID, err)
			}
		}
		list = append(list, a)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	// 自动同步的智能相册没有 album_assets，数量和封面按条件现查
	for i := range list {
		if a := &list[i]; a.synced() {
			if err := s.smartStats(ctx, a, user); err != nil {
				return nil, err
			}
		}
	}
	return list, nil
}

func (s *Store) smartStats(ctx context.Context, a *Album, user uuid.UUID) error {
	args := []any{}
	scope := scopeConditions[ScopeNormal]
	if a.Private && a.Owner != nil && *a.Owner == user { // 自己的私有相册：自己隐藏的也算
		args = append(args, user)
		scope = `deleted_at IS NULL AND (NOT hidden OR hidden_by = $1)`
	}
	where := ` WHERE ` + scope + ` AND ` + a.Rules.SQL(&args)
	if err := s.db.QueryRowContext(ctx, `SELECT count(*) FROM assets`+where, args...).Scan(&a.Count); err != nil {
		return err
	}
	if a.CoverSet {
		return nil // 用户选了封面
	}
	err := s.db.QueryRowContext(ctx, `SELECT id FROM assets`+where+` AND thumbnail_path IS NOT NULL
		ORDER BY `+takenExpr+` DESC, id DESC LIMIT 1`, args...).Scan(&a.Cover)
	if errors.Is(err, sql.ErrNoRows) {
		a.Cover = nil
		return nil
	}
	return err
}

// CountMatching 是有多少张照片符合条件，新建智能相册时实时显示「N 项符合」
func (s *Store) CountMatching(ctx context.Context, rules SmartRules) (int, error) {
	args := []any{}
	var n int
	err := s.db.QueryRowContext(ctx, `SELECT count(*) FROM assets WHERE `+scopeConditions[ScopeNormal]+
		` AND `+rules.SQL(&args), args...).Scan(&n)
	return n, err
}

// snapshot 把现在符合条件的照片放进相册（不自动同步的智能相册建好、改了条件时用），原来的先清掉
func snapshot(ctx context.Context, tx *sql.Tx, album uuid.UUID, rules SmartRules) error {
	if _, err := tx.ExecContext(ctx, `DELETE FROM album_assets WHERE album_id = $1`, album); err != nil {
		return err
	}
	args := []any{album}
	_, err := tx.ExecContext(ctx, `INSERT INTO album_assets (album_id, asset_id)
		SELECT $1, id FROM assets WHERE `+scopeConditions[ScopeNormal]+` AND `+rules.SQL(&args), args...)
	return err
}

// CreateAlbum 新建相册，owner 是建的人。普通相册同时放进 assets 里的照片（可以为空）；
// 智能相册（rules 不为空）不自动同步时，把现在符合条件的照片放进去。
func (s *Store) CreateAlbum(ctx context.Context, owner uuid.UUID, share Sharing, name string, assets []uuid.UUID, rules *SmartRules, autoSync bool) (uuid.UUID, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return uuid.Nil, err
	}
	defer tx.Rollback()
	kind, rulesJSON, err := albumKind(rules)
	if err != nil {
		return uuid.Nil, err
	}
	var id uuid.UUID
	err = tx.QueryRowContext(ctx, `INSERT INTO albums (name, kind, rules, auto_sync, owner_id, private)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
		name, kind, rulesJSON, rules != nil && autoSync, nullUUID(owner), share.Private).Scan(&id)
	if err != nil {
		return uuid.Nil, err
	}
	if err := setMembers(ctx, tx, id, owner, share); err != nil {
		return uuid.Nil, err
	}
	if rules != nil && !autoSync {
		err = snapshot(ctx, tx, id, *rules)
	} else if rules == nil {
		err = addToAlbum(ctx, tx, id, assets)
	}
	if err != nil {
		return uuid.Nil, err
	}
	return id, tx.Commit()
}

func albumKind(rules *SmartRules) (kind string, rulesJSON []byte, err error) {
	if rules == nil {
		return "normal", nil, nil
	}
	rulesJSON, err = json.Marshal(rules)
	return "smart", rulesJSON, err
}

// UpdateAlbum 改相册名；智能相册还可以改条件和是否自动同步（rules 为空时不改条件）。
// 改成不自动同步时，把现在符合条件的照片放进去；改成自动同步时，清掉存下的照片，以后按条件现查。
func (s *Store) UpdateAlbum(ctx context.Context, id uuid.UUID, name string, rules *SmartRules, autoSync *bool) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := expectRow(tx.ExecContext(ctx, `UPDATE albums SET name = $2, updated_at = now() WHERE id = $1`, id, name)); err != nil {
		return err
	}
	if rules != nil || autoSync != nil {
		var kind string
		var current []byte
		var sync bool
		if err := tx.QueryRowContext(ctx, `SELECT kind, rules, auto_sync FROM albums WHERE id = $1`, id).
			Scan(&kind, &current, &sync); err != nil {
			return err
		}
		if kind != "smart" {
			return errors.New("只有智能相册有条件")
		}
		if rules == nil {
			rules = &SmartRules{}
			if err := json.Unmarshal(current, rules); err != nil {
				return err
			}
		}
		if autoSync != nil {
			sync = *autoSync
		}
		rulesJSON, err := json.Marshal(rules)
		if err != nil {
			return err
		}
		if _, err := tx.ExecContext(ctx, `UPDATE albums SET rules = $2, auto_sync = $3 WHERE id = $1`, id, rulesJSON, sync); err != nil {
			return err
		}
		if sync {
			_, err = tx.ExecContext(ctx, `DELETE FROM album_assets WHERE album_id = $1`, id)
		} else {
			err = snapshot(ctx, tx, id, *rules)
		}
		if err != nil {
			return err
		}
	}
	return tx.Commit()
}

// albumRules 返回自动同步的智能相册的条件；普通相册、不自动同步的返回 nil
func (s *Store) albumRules(ctx context.Context, id uuid.UUID) (*SmartRules, error) {
	var kind string
	var rules []byte
	var sync bool
	err := s.db.QueryRowContext(ctx, `SELECT kind, rules, auto_sync FROM albums WHERE id = $1`, id).Scan(&kind, &rules, &sync)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrAlbumNotFound
	}
	if err != nil || kind != "smart" || !sync || rules == nil {
		return nil, err
	}
	var r SmartRules
	if err := json.Unmarshal(rules, &r); err != nil {
		return nil, err
	}
	return &r, nil
}

// resolve 把筛选条件里要先查一下的部分查好：搜索词先找出搜到的照片，智能相册换成它的条件
func (s *Store) resolve(ctx context.Context, f *Filter) error {
	if f.Query != "" && f.matches == nil {
		if s.searcher == nil {
			return ErrSearchUnavailable
		}
		ids, err := s.searcher(ctx, f.Query)
		if errors.Is(err, ai.ErrUnavailable) {
			return fmt.Errorf("%w（%v）", ErrSearchUnavailable, err)
		}
		if err != nil {
			return err
		}
		f.matches = append([]uuid.UUID{}, ids...) // 没搜到时是空的（不是 nil），不会再搜一次
	}
	return s.resolveAlbum(ctx, f)
}

// resolveAlbum：按相册筛选时，自动同步的智能相册改成按条件筛选
func (s *Store) resolveAlbum(ctx context.Context, f *Filter) error {
	if f.Album == nil {
		return nil
	}
	acc, err := s.albumAccess(ctx, *f.Album)
	if errors.Is(err, ErrAlbumNotFound) {
		return nil // 相册不存在：照常按 album_assets 筛，结果是空的
	}
	if err != nil {
		return err
	}
	if !acc.canSee(f.User) {
		f.blocked = true
		return nil
	}
	f.ownPrivate = acc.Private
	rules, err := s.albumRules(ctx, *f.Album)
	f.smart = rules
	return err
}

// albumAccess 是相册的主人和是否私有，判断谁能看、谁能改
type albumAccess struct {
	Owner    *uuid.UUID
	Private  bool
	HideMine bool
	Members  string // 共享相册限定的成员，逗号隔开；空的是全家
}

func (s *Store) albumAccess(ctx context.Context, id uuid.UUID) (albumAccess, error) {
	var a albumAccess
	err := s.db.QueryRowContext(ctx, `SELECT owner_id, private, hide_mine,
		(SELECT COALESCE(string_agg(user_id::text, ','), '') FROM album_members WHERE album_id = $1)
		FROM albums WHERE id = $1`, id).Scan(&a.Owner, &a.Private, &a.HideMine, &a.Members)
	if errors.Is(err, sql.ErrNoRows) {
		return a, ErrAlbumNotFound
	}
	return a, err
}

// Sharing 是相册给谁看：Private 只有主人；不然 Members 里的人（空的是全家，以后新加的成员也算）
type Sharing struct {
	Private bool        `json:"private"`
	Members []uuid.UUID `json:"members"`
}

// setMembers 换掉共享相册限定的成员（主人自己不用列）；私有相册清空
func setMembers(ctx context.Context, tx *sql.Tx, album, owner uuid.UUID, share Sharing) error {
	if _, err := tx.ExecContext(ctx, `DELETE FROM album_members WHERE album_id = $1`, album); err != nil {
		return err
	}
	if share.Private || len(share.Members) == 0 {
		return nil
	}
	_, err := tx.ExecContext(ctx, `INSERT INTO album_members (album_id, user_id)
		SELECT $1, id FROM users WHERE id = ANY($2::uuid[]) AND id <> $3`, album, uuidStrings(share.Members), owner)
	return err
}

func (a albumAccess) owned(user uuid.UUID) bool { return a.Owner != nil && *a.Owner == user }

// canSee：共享相册全家（或限定的那几个人）都能看，也能往里放照片、换封面；私有相册只有主人。和 albumVisible 一致
func (a albumAccess) canSee(user uuid.UUID) bool {
	if a.owned(user) {
		return true
	}
	return !a.Private && (a.Members == "" || slices.Contains(strings.Split(a.Members, ","), user.String()))
}

// canManage：改名、删除、改私有只有主人；共享相册主人不在了（或是管理员）时管理员也行
func (a albumAccess) canManage(user uuid.UUID, admin bool) bool {
	return a.owned(user) || (!a.Private && admin)
}

// CheckAlbum 检查 user 能不能看（manage 为 true 时：能不能改）这个相册。看不到的和不存在一样，返回 ErrAlbumNotFound
func (s *Store) CheckAlbum(ctx context.Context, user uuid.UUID, admin bool, id uuid.UUID, manage bool) error {
	acc, err := s.albumAccess(ctx, id)
	if err != nil {
		return err
	}
	if !acc.canSee(user) {
		return ErrAlbumNotFound
	}
	if manage && !acc.canManage(user, admin) {
		return ErrAlbumNotOwner
	}
	return nil
}

// PrivacyPreview 是改私有之前给用户看的数：相册里自己传的、别人传的（隐藏不了）、自己传的里面也在共享相册里的，
// 以及现在因为这个相册隐藏着的（改回共享时问要不要取消隐藏）
type PrivacyPreview struct {
	Mine     int `json:"mine"`
	Others   int `json:"others"`
	InShared int `json:"in_shared"`
	Hidden   int `json:"hidden"`
}

func (s *Store) AlbumPrivacyPreview(ctx context.Context, user, id uuid.UUID) (PrivacyPreview, error) {
	var p PrivacyPreview
	err := s.db.QueryRowContext(ctx, `
		SELECT count(*) FILTER (WHERE a.uploaded_by = $2 AND NOT a.hidden),
		       count(*) FILTER (WHERE a.uploaded_by IS DISTINCT FROM $2 AND NOT a.hidden),
		       count(*) FILTER (WHERE a.uploaded_by = $2 AND NOT a.hidden AND EXISTS (
		           SELECT 1 FROM album_assets y JOIN albums o ON o.id = y.album_id
		           WHERE y.asset_id = a.id AND o.id <> $1 AND NOT o.private)),
		       count(*) FILTER (WHERE a.hidden_via = $1 AND a.hidden_by = $2)
		FROM album_assets x JOIN assets a ON a.id = x.asset_id
		WHERE x.album_id = $1 AND a.deleted_at IS NULL`, id, user).Scan(&p.Mine, &p.Others, &p.InShared, &p.Hidden)
	return p, err
}

// SetAlbumPrivacy 改相册私有 / 共享（共享时给哪些人看）。hideMine 只在私有时有效：打开时把相册里 user 自己传的照片隐藏（记下是这个相册隐藏的；
// 自动同步的智能相册见 SyncSmartHidden）；
// 关掉（或改回共享）时 unhide 为 true 就取消这些照片的隐藏，否则照片还隐藏着，只是不再记是这个相册
func (s *Store) SetAlbumPrivacy(ctx context.Context, user, id uuid.UUID, share Sharing, hideMine, unhide bool) error {
	private := share.Private
	hideMine = hideMine && private
	rules, err := s.albumRules(ctx, id)
	if err != nil {
		return err
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if err := expectRow(tx.ExecContext(ctx, `UPDATE albums SET private = $2, hide_mine = $3, updated_at = now() WHERE id = $1`,
		id, private, hideMine)); err != nil {
		return err
	}
	var owner uuid.UUID
	if err := tx.QueryRowContext(ctx, `SELECT COALESCE(owner_id, $2) FROM albums WHERE id = $1`, id, user).Scan(&owner); err != nil {
		return err
	}
	if err := setMembers(ctx, tx, id, owner, share); err != nil {
		return err
	}
	if hideMine {
		_, err = tx.ExecContext(ctx, `
			UPDATE assets SET hidden = true, hidden_by = $2, hidden_via = $1, updated_at = now()
			WHERE id IN (SELECT asset_id FROM album_assets WHERE album_id = $1)
			  AND uploaded_by = $2 AND NOT hidden AND deleted_at IS NULL`, id, user)
	} else if unhide {
		_, err = tx.ExecContext(ctx, `
			UPDATE assets SET hidden = false, hidden_by = NULL, hidden_via = NULL, updated_at = now()
			WHERE hidden_via = $1 AND hidden_by = $2`, id, user)
	} else {
		_, err = tx.ExecContext(ctx, `UPDATE assets SET hidden_via = NULL WHERE hidden_via = $1`, id)
	}
	if err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	if hideMine && rules != nil { // 自动同步的智能相册不存 album_assets，按条件现查着隐藏
		return s.SyncSmartHidden(ctx)
	}
	return nil
}

// DeleteAlbum 删除相册，里面的照片不动
func (s *Store) DeleteAlbum(ctx context.Context, id uuid.UUID) error {
	return expectRow(s.db.ExecContext(ctx, `DELETE FROM albums WHERE id = $1`, id))
}

// AddToAlbum 把照片放进相册，已经在里面的跳过。自动同步的智能相册不能手动加
func (s *Store) AddToAlbum(ctx context.Context, album uuid.UUID, assets []uuid.UUID) error {
	if err := s.checkManual(ctx, album); err != nil {
		return err
	}
	if err := addToAlbum(ctx, s.db, album, assets); err != nil {
		return err
	}
	// 私有相册开着「同时隐藏」：新放进来的主人自己传的照片也隐藏
	_, err := s.db.ExecContext(ctx, `
		UPDATE assets SET hidden = true, hidden_by = al.owner_id, hidden_via = al.id, updated_at = now()
		FROM albums al
		WHERE al.id = $1 AND al.private AND al.hide_mine AND assets.id = ANY($2::uuid[])
		  AND assets.uploaded_by = al.owner_id AND NOT assets.hidden AND assets.deleted_at IS NULL`, album, uuidStrings(assets))
	return err
}

func (s *Store) checkManual(ctx context.Context, album uuid.UUID) error {
	rules, err := s.albumRules(ctx, album)
	if err != nil {
		return err
	}
	if rules != nil {
		return ErrAlbumSynced
	}
	return nil
}

func (s *Store) RemoveFromAlbum(ctx context.Context, album uuid.UUID, assets []uuid.UUID) error {
	if err := s.checkManual(ctx, album); err != nil {
		return err
	}
	if _, err := s.db.ExecContext(ctx,
		`DELETE FROM album_assets WHERE album_id = $1 AND asset_id = ANY($2::uuid[])`, album, uuidStrings(assets)); err != nil {
		return err
	}
	// 因为这个相册隐藏的照片，移出相册就回到图库
	_, err := s.db.ExecContext(ctx, `
		UPDATE assets SET hidden = false, hidden_by = NULL, hidden_via = NULL, updated_at = now()
		WHERE hidden_via = $1 AND id = ANY($2::uuid[])`, album, uuidStrings(assets))
	return err
}

type execer interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

func addToAlbum(ctx context.Context, db execer, album uuid.UUID, assets []uuid.UUID) error {
	if len(assets) == 0 {
		return nil
	}
	// 只放还存在的照片；相册不存在时外键报错，交给调用方。
	// 新放进去的照片顺便更新 updated_at，打开着这个相册的网页增量刷新时就能拿到它们
	_, err := db.ExecContext(ctx, `
		WITH added AS (
			INSERT INTO album_assets (album_id, asset_id)
			SELECT $1, id FROM assets WHERE id = ANY($2::uuid[])
			ON CONFLICT DO NOTHING
			RETURNING asset_id
		)
		UPDATE assets SET updated_at = now() WHERE id IN (SELECT asset_id FROM added)`, album, uuidStrings(assets))
	if isForeignKeyViolation(err) {
		return ErrAlbumNotFound
	}
	return err
}

func expectRow(res sql.Result, err error) error {
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrAlbumNotFound
	}
	return nil
}

func isForeignKeyViolation(err error) bool {
	return err != nil && strings.Contains(err.Error(), "SQLSTATE 23503")
}

// ---- 接口 ----

// listAlbums：GET /api/albums，从新到旧
func (s *Service) listAlbums(w http.ResponseWriter, r *http.Request) {
	list, err := s.store.Albums(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

// createAlbum：POST /api/albums，请求体 {"name": "旅行", "asset_ids": [...]}（asset_ids 可以不带），返回新相册
func (s *Service) createAlbum(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name     string      `json:"name"`
		AssetIDs []uuid.UUID `json:"asset_ids"`
		Rules    *SmartRules `json:"rules"` // 有条件就是智能相册
		AutoSync bool        `json:"auto_sync"`
		Private  *bool       `json:"private"`   // 不带时默认共享（给所有人）
		Members  []uuid.UUID `json:"members"`   // 共享时只给这几个人看；空的是全家
		HideMine bool        `json:"hide_mine"` // 私有时同时隐藏相册里我传的照片，见 SetAlbumPrivacy
	}
	if !decode(w, r, &req) {
		return
	}
	name, ok := albumName(w, req.Name)
	if !ok || !validRules(w, req.Rules) {
		return
	}
	share := Sharing{Private: req.Private != nil && *req.Private, Members: req.Members}
	if len(req.AssetIDs) > maxBatch {
		httpx.Error(w, http.StatusBadRequest, "一次放进相册的照片太多了")
		return
	}
	user := auth.UserID(r.Context())
	id, err := s.store.CreateAlbum(r.Context(), user, share, name, req.AssetIDs, req.Rules, req.AutoSync)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	if req.HideMine && share.Private {
		if err := s.store.SetAlbumPrivacy(r.Context(), user, id, share, true, false); err != nil {
			httpx.InternalError(w, err)
			return
		}
	}
	s.respondAlbum(w, r, id, http.StatusCreated)
}

// updateAlbum：PATCH /api/albums/{id}，请求体 {"name": "新名字"}；智能相册还可以带 rules、auto_sync
func (s *Service) updateAlbum(w http.ResponseWriter, r *http.Request) {
	id, ok := albumID(w, r)
	if !ok {
		return
	}
	var req struct {
		Name     string      `json:"name"`
		Rules    *SmartRules `json:"rules"`
		AutoSync *bool       `json:"auto_sync"`
	}
	if !decode(w, r, &req) {
		return
	}
	name, ok := albumName(w, req.Name)
	if !ok || !validRules(w, req.Rules) || !s.allowed(w, r, id, true) {
		return
	}
	if !albumResult(w, s.store.UpdateAlbum(r.Context(), id, name, req.Rules, req.AutoSync)) {
		return
	}
	s.respondAlbum(w, r, id, http.StatusOK)
}

// setAlbumCover：PUT /api/albums/{id}/cover，请求体 {"asset_id": "..."} 选一张照片当封面，{"asset_id": null} 恢复默认
func (s *Service) setAlbumCover(w http.ResponseWriter, r *http.Request) {
	id, ok := albumID(w, r)
	if !ok {
		return
	}
	var req struct {
		AssetID *uuid.UUID `json:"asset_id"`
	}
	if !decode(w, r, &req) || !s.allowed(w, r, id, false) {
		return
	}
	err := s.store.SetAlbumCover(r.Context(), id, req.AssetID)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusBadRequest, "选的照片不存在")
		return
	}
	if !albumResult(w, err) {
		return
	}
	s.respondAlbum(w, r, id, http.StatusOK)
}

// SetAlbumCover 设置相册封面，asset 为 nil 时恢复默认（最新一张）
func (s *Store) SetAlbumCover(ctx context.Context, id uuid.UUID, asset *uuid.UUID) error {
	err := expectRow(s.db.ExecContext(ctx, `UPDATE albums SET cover_id = $2, updated_at = now() WHERE id = $1`, id, asset))
	if isForeignKeyViolation(err) {
		return ErrNotFound
	}
	return err
}

// deleteAlbum：DELETE /api/albums/{id}，照片不删
func (s *Service) deleteAlbum(w http.ResponseWriter, r *http.Request) {
	id, ok := albumID(w, r)
	if !ok || !s.allowed(w, r, id, true) {
		return
	}
	if albumResult(w, s.store.DeleteAlbum(r.Context(), id)) {
		w.WriteHeader(http.StatusNoContent)
	}
}

// addAlbumAssets：POST /api/albums/{id}/assets，请求体 {"ids": [...]}；removeAlbumAssets：POST .../assets/remove
func (s *Service) addAlbumAssets(w http.ResponseWriter, r *http.Request) {
	s.changeAlbumAssets(w, r, s.store.AddToAlbum)
}

func (s *Service) removeAlbumAssets(w http.ResponseWriter, r *http.Request) {
	s.changeAlbumAssets(w, r, s.store.RemoveFromAlbum)
}

func (s *Service) changeAlbumAssets(w http.ResponseWriter, r *http.Request,
	change func(ctx context.Context, album uuid.UUID, assets []uuid.UUID) error) {
	id, ok := albumID(w, r)
	if !ok {
		return
	}
	var req struct {
		IDs []uuid.UUID `json:"ids"`
	}
	if !decode(w, r, &req) || !s.allowed(w, r, id, false) {
		return
	}
	if len(req.IDs) == 0 || len(req.IDs) > maxBatch {
		httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("一次要选 1 到 %d 张", maxBatch))
		return
	}
	if !albumResult(w, change(r.Context(), id, req.IDs)) {
		return
	}
	s.respondAlbum(w, r, id, http.StatusOK)
}

// allowed 检查现在登录的人能不能看（manage：能不能改）这个相册，不能时回答 404 / 403
func (s *Service) allowed(w http.ResponseWriter, r *http.Request, id uuid.UUID, manage bool) bool {
	u := auth.UserFrom(r.Context())
	if u == nil {
		httpx.Error(w, http.StatusUnauthorized, "请先登录")
		return false
	}
	return albumResult(w, s.store.CheckAlbum(r.Context(), u.ID, u.IsAdmin, id, manage))
}

// albumPrivacy：GET /api/albums/{id}/privacy，改私有之前要显示的数（见 PrivacyPreview）
func (s *Service) albumPrivacy(w http.ResponseWriter, r *http.Request) {
	id, ok := albumID(w, r)
	if !ok || !s.allowed(w, r, id, true) {
		return
	}
	p, err := s.store.AlbumPrivacyPreview(r.Context(), auth.UserID(r.Context()), id)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, p)
}

// setAlbumPrivacy：PUT /api/albums/{id}/privacy，请求体 {"private": false, "members": [...], "hide_mine": false, "unhide": true}，
// members 是共享给哪些人（空的是全家），hide_mine、unhide 见 SetAlbumPrivacy。返回改好的相册
func (s *Service) setAlbumPrivacy(w http.ResponseWriter, r *http.Request) {
	id, ok := albumID(w, r)
	if !ok {
		return
	}
	var req struct {
		Sharing
		HideMine bool `json:"hide_mine"`
		Unhide   bool `json:"unhide"`
	}
	if !decode(w, r, &req) || !s.allowed(w, r, id, true) {
		return
	}
	err := s.store.SetAlbumPrivacy(r.Context(), auth.UserID(r.Context()), id, req.Sharing, req.HideMine, req.Unhide)
	if !albumResult(w, err) {
		return
	}
	s.respondAlbum(w, r, id, http.StatusOK)
}

func (s *Service) respondAlbum(w http.ResponseWriter, r *http.Request, id uuid.UUID, status int) {
	a, err := s.store.Album(r.Context(), auth.UserID(r.Context()), id)
	if !albumResult(w, err) {
		return
	}
	httpx.JSON(w, status, a)
}

// albumResult 把相册不存在变成 404，其他错误变成 500；没有错误时返回 true
func albumResult(w http.ResponseWriter, err error) bool {
	switch {
	case err == nil:
		return true
	case errors.Is(err, ErrAlbumNotFound):
		httpx.Error(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrAlbumSynced):
		httpx.Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, ErrAlbumNotOwner):
		httpx.Error(w, http.StatusForbidden, err.Error())
	default:
		httpx.InternalError(w, err)
	}
	return false
}

func albumID(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "相册 ID 格式不对")
		return id, false
	}
	return id, true
}

func albumName(w http.ResponseWriter, raw string) (string, bool) {
	name := strings.TrimSpace(raw)
	if name == "" || utf8.RuneCountInString(name) > maxAlbumName {
		httpx.Error(w, http.StatusBadRequest, "相册名要有 1 到 100 个字")
		return "", false
	}
	return name, true
}

func decode(w http.ResponseWriter, r *http.Request, dst any) bool {
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20)).Decode(dst); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return false
	}
	return true
}

func validRules(w http.ResponseWriter, rules *SmartRules) bool {
	if rules == nil {
		return true
	}
	if err := rules.Validate(); err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return false
	}
	return true
}

// previewSmart：POST /api/albums/preview，请求体是条件，返回 {"count": 符合条件的照片数}
func (s *Service) previewSmart(w http.ResponseWriter, r *http.Request) {
	var rules SmartRules
	if !decode(w, r, &rules) || !validRules(w, &rules) {
		return
	}
	n, err := s.store.CountMatching(r.Context(), rules)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]int{"count": n})
}

// valueFields 是可以列出已有值的字段（条件里填相机型号、镜头时下拉提示）
var valueFields = map[string]bool{"camera": true, "make": true, "lens": true}

// fieldValues：GET /api/albums/values?field=camera|make|lens，返回照片里出现过的值，按字母排
func (s *Service) fieldValues(w http.ResponseWriter, r *http.Request) {
	field := r.URL.Query().Get("field")
	if !valueFields[field] {
		httpx.Error(w, http.StatusBadRequest, "field 应该是 camera、make 或 lens")
		return
	}
	expr := smartFields[field].expr
	rows, err := s.db.QueryContext(r.Context(), `SELECT DISTINCT `+expr+` AS v FROM assets
		WHERE `+scopeConditions[ScopeNormal]+` AND `+expr+` <> '' ORDER BY v LIMIT 500`)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer rows.Close()
	list := []string{}
	for rows.Next() {
		var v string
		if err := rows.Scan(&v); err != nil {
			httpx.InternalError(w, err)
			return
		}
		list = append(list, v)
	}
	httpx.JSON(w, http.StatusOK, list)
}

// nullUUID 把 uuid.Nil（没登录、没有人）存成 NULL
func nullUUID(id uuid.UUID) *uuid.UUID {
	if id == uuid.Nil {
		return nil
	}
	return &id
}

// SyncSmartHidden 让开着「同时隐藏」的私有、自动同步的智能相册跟上条件：主人自己传的、现在符合条件的照片隐藏（记下是这个相册隐藏的）；
// 因为它隐藏、现在不符合条件了的（例如取消了收藏）取消隐藏。这种相册的照片随时会因为新上传、读完元数据、改收藏星级而变，
// 所以除了改设置时，RunHiddenSync 还定时做，改收藏星级、批量修改后也马上做一次
func (s *Store) SyncSmartHidden(ctx context.Context) error {
	rows, err := s.db.QueryContext(ctx, `SELECT id, owner_id, rules FROM albums
		WHERE private AND hide_mine AND kind = 'smart' AND auto_sync AND rules IS NOT NULL AND owner_id IS NOT NULL`)
	if err != nil {
		return err
	}
	type target struct {
		id, owner uuid.UUID
		rules     SmartRules
	}
	var list []target
	for rows.Next() {
		var t target
		var raw []byte
		if err := rows.Scan(&t.id, &t.owner, &raw); err != nil {
			rows.Close()
			return err
		}
		if json.Unmarshal(raw, &t.rules) == nil {
			list = append(list, t)
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}
	for _, t := range list {
		args := []any{t.id, t.owner}
		cond := `COALESCE((` + t.rules.SQL(&args) + `), false)`
		if _, err := s.db.ExecContext(ctx, `
			UPDATE assets SET hidden = true, hidden_by = $2, hidden_via = $1, updated_at = now()
			WHERE deleted_at IS NULL AND NOT hidden AND uploaded_by = $2 AND `+cond, args...); err != nil {
			return err
		}
		if _, err := s.db.ExecContext(ctx, `
			UPDATE assets SET hidden = false, hidden_by = NULL, hidden_via = NULL, updated_at = now()
			WHERE hidden_via = $1 AND hidden_by = $2 AND NOT `+cond, args...); err != nil {
			return err
		}
	}
	return nil
}

// RunHiddenSync 在后台定时做 SyncSmartHidden，直到 ctx 结束；KickHiddenSync 让它马上做一次
func (s *Service) RunHiddenSync(ctx context.Context) {
	tick := time.NewTicker(20 * time.Second)
	defer tick.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-tick.C:
		case <-s.hiddenKick:
		}
		if err := s.store.SyncSmartHidden(ctx); err != nil && ctx.Err() == nil {
			log.Printf("assets: 同步智能相册的隐藏失败: %v", err)
		}
	}
}

// KickHiddenSync 让 RunHiddenSync 马上同步一次（已经排着一次了就不重复）
func (s *Service) KickHiddenSync() {
	select {
	case s.hiddenKick <- struct{}{}:
	default:
	}
}
