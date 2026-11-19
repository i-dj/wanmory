package assets

import (
	"context"
	"net/http"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/db"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// 照片默认只有上传的人看得到，分享给别人以后别人才看得到（规则见 db.Visible）。
// 分享只能分享自己传的；别人分享给自己的不能再转分享。

// CanSee 是 user 能不能看这张照片（只看分享规则，隐藏、删除另外判断，见 visibleTo）。
func (s *Store) CanSee(ctx context.Context, a *Asset, user uuid.UUID) (bool, error) {
	if a.UploadedBy == nil || (user != uuid.Nil && *a.UploadedBy == user) {
		return true, nil
	}
	seen, err := s.VisibleIDs(ctx, []uuid.UUID{a.ID}, user)
	return seen[a.ID], err
}

// visibleOnly 去掉 ids 里现在登录的人看不到的
func (s *Service) visibleOnly(ctx context.Context, ids []uuid.UUID) ([]uuid.UUID, error) {
	if len(ids) == 0 {
		return ids, nil
	}
	seen, err := s.store.VisibleIDs(ctx, ids, auth.UserID(ctx))
	if err != nil {
		return nil, err
	}
	out := ids[:0:0]
	for _, id := range ids {
		if seen[id] {
			out = append(out, id)
		}
	}
	return out, nil
}

// IsAvatar 是这张照片是不是有成员拿来当头像（头像的缩略图全家都看得到）
func (s *Store) IsAvatar(ctx context.Context, id uuid.UUID) (bool, error) {
	var ok bool
	err := s.db.QueryRowContext(ctx, `SELECT EXISTS (SELECT 1 FROM users WHERE avatar_id = $1)`, id).Scan(&ok)
	return ok, err
}

// VisibleIDs 返回 ids 里 user 看得到的那些。
func (s *Store) VisibleIDs(ctx context.Context, ids []uuid.UUID, user uuid.UUID) (map[uuid.UUID]bool, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id FROM assets WHERE id = ANY($1::uuid[]) AND `+
		db.Visible("assets", "$2"), uuidStrings(ids), user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	seen := map[uuid.UUID]bool{}
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		seen[id] = true
	}
	return seen, rows.Err()
}

// Share 把 owner 自己传的 ids 分享给 users，返回实际分享了几张（别人传的跳过）。
func (s *Store) Share(ctx context.Context, owner uuid.UUID, ids, users []uuid.UUID) (int, error) {
	var n int
	err := s.db.QueryRowContext(ctx, `
		WITH mine AS (SELECT id FROM assets WHERE id = ANY($1::uuid[]) AND uploaded_by = $2 AND deleted_at IS NULL),
		     ins AS (
			INSERT INTO asset_shares (asset_id, user_id)
			SELECT m.id, u.id FROM mine m CROSS JOIN users u WHERE u.id = ANY($3::uuid[]) AND u.id <> $2
			ON CONFLICT DO NOTHING RETURNING 1)
		SELECT count(*) FROM mine`, uuidStrings(ids), owner, uuidStrings(users)).Scan(&n)
	return n, err
}

// Unshare 取消分享：users 为空时取消分享给所有人。只能取消自己传的。
func (s *Store) Unshare(ctx context.Context, owner uuid.UUID, ids, users []uuid.UUID) error {
	query := `DELETE FROM asset_shares s USING assets a
		WHERE s.asset_id = a.id AND a.uploaded_by = $2 AND a.id = ANY($1::uuid[])`
	args := []any{uuidStrings(ids), owner}
	if len(users) > 0 {
		args = append(args, uuidStrings(users))
		query += ` AND s.user_id = ANY($3::uuid[])`
	}
	_, err := s.db.ExecContext(ctx, query, args...)
	return err
}

// SharedWith 是 owner 的这些照片各分享给了谁：成员 ID → 分享了其中几张。
func (s *Store) SharedWith(ctx context.Context, owner uuid.UUID, ids []uuid.UUID) (map[uuid.UUID]int, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT s.user_id, count(*) FROM asset_shares s JOIN assets a ON a.id = s.asset_id
		WHERE a.uploaded_by = $2 AND a.id = ANY($1::uuid[]) GROUP BY s.user_id`, uuidStrings(ids), owner)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[uuid.UUID]int{}
	for rows.Next() {
		var id uuid.UUID
		var n int
		if err := rows.Scan(&id, &n); err != nil {
			return nil, err
		}
		out[id] = n
	}
	return out, rows.Err()
}

// LibraryShares 是 owner 把自己传的全部分享给了谁，和谁把全部分享给了 owner。
func (s *Store) LibraryShares(ctx context.Context, user uuid.UUID) (to, from []uuid.UUID, err error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT owner_id, user_id FROM library_shares WHERE owner_id = $1 OR user_id = $1`, user)
	if err != nil {
		return nil, nil, err
	}
	defer rows.Close()
	to, from = []uuid.UUID{}, []uuid.UUID{}
	for rows.Next() {
		var owner, member uuid.UUID
		if err := rows.Scan(&owner, &member); err != nil {
			return nil, nil, err
		}
		if owner == user {
			to = append(to, member)
		} else {
			from = append(from, owner)
		}
	}
	return to, from, rows.Err()
}

// SetLibraryShares 把 owner 传的全部（包括以后传的）分享给 users，替换原来的名单。
func (s *Store) SetLibraryShares(ctx context.Context, owner uuid.UUID, users []uuid.UUID) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `DELETE FROM library_shares WHERE owner_id = $1`, owner); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `
		INSERT INTO library_shares (owner_id, user_id)
		SELECT $1, id FROM users WHERE id = ANY($2::uuid[]) AND id <> $1`, owner, uuidStrings(users)); err != nil {
		return err
	}
	return tx.Commit()
}

// Sharer 是一个把照片分享给自己的人，和自己看得到他的几张（不算隐藏、删除的）。
type Sharer struct {
	ID    uuid.UUID `json:"id"`
	Name  string    `json:"name"`
	Count int       `json:"count"`
}

// Sharers 列出分享了照片给 user 的人（多的在前），网页按「谁分享的」筛选时用。
func (s *Store) Sharers(ctx context.Context, user uuid.UUID) ([]Sharer, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT a.uploaded_by, u.name, count(*) FROM assets a JOIN users u ON u.id = a.uploaded_by
		WHERE `+scopeConditions[ScopeNormal]+` AND a.uploaded_by <> $1 AND `+db.Visible("a", "$1")+`
		GROUP BY a.uploaded_by, u.name ORDER BY count(*) DESC, u.name`, user)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Sharer{}
	for rows.Next() {
		var sh Sharer
		if err := rows.Scan(&sh.ID, &sh.Name, &sh.Count); err != nil {
			return nil, err
		}
		list = append(list, sh)
	}
	return list, rows.Err()
}

type shareRequest struct {
	IDs   []uuid.UUID `json:"ids"`
	Users []uuid.UUID `json:"users"`
}

// share：POST /api/assets/share，{"ids": [...], "users": [...]}，把自己传的照片分享给这些人。
// 返回 {"shared": 实际分享了几张}（别人传的不能分享，跳过）
func (s *Service) share(w http.ResponseWriter, r *http.Request) {
	var req shareRequest
	if !decode(w, r, &req) {
		return
	}
	if len(req.IDs) == 0 || len(req.IDs) > maxBatch || len(req.Users) == 0 {
		httpx.Error(w, http.StatusBadRequest, "要选照片和分享给谁")
		return
	}
	n, err := s.store.Share(r.Context(), auth.UserID(r.Context()), req.IDs, req.Users)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]int{"shared": n})
}

// unshare：POST /api/assets/unshare，{"ids": [...], "users": [...]}，users 为空时取消分享给所有人
func (s *Service) unshare(w http.ResponseWriter, r *http.Request) {
	var req shareRequest
	if !decode(w, r, &req) {
		return
	}
	if len(req.IDs) == 0 || len(req.IDs) > maxBatch {
		httpx.Error(w, http.StatusBadRequest, "要选照片")
		return
	}
	if err := s.store.Unshare(r.Context(), auth.UserID(r.Context()), req.IDs, req.Users); err != nil {
		httpx.InternalError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// shares：POST /api/assets/shares，{"ids": [...]}，这些照片（自己传的）各分享给了谁：
// {"users": {"<成员 ID>": 几张}}，分享窗口打勾用
func (s *Service) shares(w http.ResponseWriter, r *http.Request) {
	var req shareRequest
	if !decode(w, r, &req) {
		return
	}
	if len(req.IDs) > maxBatch {
		httpx.Error(w, http.StatusBadRequest, "选的照片太多了")
		return
	}
	m, err := s.store.SharedWith(r.Context(), auth.UserID(r.Context()), req.IDs)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"users": m})
}

// sharing：GET /api/sharing，{"library_to": 我把全部分享给了谁, "library_from": 谁把全部分享给了我,
// "sharers": 分享了照片给我的人和几张}
func (s *Service) sharing(w http.ResponseWriter, r *http.Request) {
	user := auth.UserID(r.Context())
	to, from, err := s.store.LibraryShares(r.Context(), user)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	sharers, err := s.store.Sharers(r.Context(), user)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"library_to": to, "library_from": from, "sharers": sharers})
}

// setLibrarySharing：PUT /api/sharing/library，{"users": [...]}，把自己传的全部（包括以后传的）分享给这些人
func (s *Service) setLibrarySharing(w http.ResponseWriter, r *http.Request) {
	var req shareRequest
	if !decode(w, r, &req) {
		return
	}
	if err := s.store.SetLibraryShares(r.Context(), auth.UserID(r.Context()), req.Users); err != nil {
		httpx.InternalError(w, err)
		return
	}
	s.sharing(w, r)
}
