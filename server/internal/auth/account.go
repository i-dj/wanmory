package auth

import (
	"context"
	"crypto/sha256"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/wanmory/wanmory/server/internal/httpx"
	"github.com/wanmory/wanmory/server/internal/ipgeo"
)

// 「我的账号」页用的接口（只管自己的账号）：
//
//	GET    /api/auth/account    我的名字、角色、加入时间，我传了几张照片、隐藏了几张，在哪些设备上登录着
//	PUT    /api/auth/name       {"name": "..."} 改自己的名字（登录用的也是它）
//	DELETE /api/auth/sessions   退出别的设备上的登录（这台留着）

// Device 是一处登录：什么时候登录的、到什么时候过期、浏览器的 User-Agent、最近一次从哪个 IP 什么时候用的，
// current 是不是现在这台
type Device struct {
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt time.Time  `json:"expires_at"`
	UserAgent string     `json:"user_agent"`
	IP        string     `json:"ip"`
	LastSeen  *time.Time `json:"last_seen"`
	Current   bool       `json:"current"`
	Location  string     `json:"location"` // IP 大概在哪（ipgeo），查不到是空的
}

func (s *Service) accountRoutes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/auth/account", s.account)
	mux.HandleFunc("PUT /api/auth/name", s.rename)
	mux.HandleFunc("DELETE /api/auth/sessions", s.logoutOthers)
}

// noteDevice 记下这处登录是什么设备（浏览器）、从哪个 IP、什么时候用的。登录时记一次；之后每个请求都会调，
// 但同一个会话 5 分钟内只写一次数据库（touched 记着上次写的时间）。以前登录、没记设备的，下次用到时补上
func (s *Service) noteDevice(ctx context.Context, token string, r *http.Request) {
	if last, ok := touched.Load(token); ok && time.Since(last.(time.Time)) < touchEvery {
		return
	}
	touched.Store(token, time.Now())
	ua := r.UserAgent()
	if len(ua) > 400 {
		ua = ua[:400]
	}
	sum := sha256.Sum256([]byte(token))
	_, _ = s.db.ExecContext(ctx, `
		UPDATE sessions SET user_agent = CASE WHEN $2 <> '' THEN $2 ELSE user_agent END, ip = $3, last_seen = now()
		WHERE token_hash = $1`, sum[:], ua, clientIP(r))
}

const touchEvery = 5 * time.Minute

var touched sync.Map // 会话令牌 → 上次写最近使用时间的时候

// clientIP 是请求从哪来的：前面有反向代理时看它转过来的 X-Forwarded-For / X-Real-IP（只用来显示，不做判断）
func clientIP(r *http.Request) string {
	if f := r.Header.Get("X-Forwarded-For"); f != "" {
		return strings.TrimSpace(strings.Split(f, ",")[0])
	}
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return strings.TrimSpace(ip)
	}
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil {
		return host
	}
	return r.RemoteAddr
}

func currentToken(r *http.Request) string {
	if c, err := r.Cookie(CookieName); err == nil {
		return c.Value
	}
	return ""
}

func (s *Service) account(w http.ResponseWriter, r *http.Request) {
	u := UserFrom(r.Context())
	if u == nil {
		httpx.Error(w, http.StatusUnauthorized, "还没登录")
		return
	}
	ctx := r.Context()
	resp := map[string]any{"user": u}
	var uploaded, hidden int
	if err := s.db.QueryRowContext(ctx, `
		SELECT count(*) FILTER (WHERE uploaded_by = $1 AND deleted_at IS NULL),
		       count(*) FILTER (WHERE hidden_by = $1 AND hidden AND deleted_at IS NULL)
		FROM assets`, u.ID).Scan(&uploaded, &hidden); err != nil {
		httpx.InternalError(w, err)
		return
	}
	resp["uploaded"], resp["hidden"] = uploaded, hidden

	sum := sha256.Sum256([]byte(currentToken(r)))
	rows, err := s.db.QueryContext(ctx, `
		SELECT created_at, expires_at, user_agent, ip, last_seen, token_hash = $2 FROM sessions
		WHERE user_id = $1 AND expires_at > now() ORDER BY token_hash = $2 DESC, coalesce(last_seen, created_at) DESC`, u.ID, sum[:])
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer rows.Close()
	devices := []Device{}
	for rows.Next() {
		var d Device
		if err := rows.Scan(&d.CreatedAt, &d.ExpiresAt, &d.UserAgent, &d.IP, &d.LastSeen, &d.Current); err != nil {
			httpx.InternalError(w, err)
			return
		}
		d.Location = ipgeo.Lookup(d.IP)
		devices = append(devices, d)
	}
	if err := rows.Err(); err != nil {
		httpx.InternalError(w, err)
		return
	}
	resp["devices"] = devices
	httpx.JSON(w, http.StatusOK, resp)
}

func (s *Service) rename(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name string `json:"name"`
	}
	if !decode(w, r, &req) {
		return
	}
	u := UserFrom(r.Context())
	name := strings.TrimSpace(req.Name)
	if n := len([]rune(name)); n == 0 || n > maxName {
		s.fail(w, ErrBadName)
		return
	}
	_, err := s.db.ExecContext(r.Context(), `UPDATE users SET name = $2 WHERE id = $1`, u.ID, name)
	if err != nil && strings.Contains(err.Error(), "users_name_idx") {
		err = ErrNameTaken
	}
	if s.fail(w, err) {
		return
	}
	updated := *u
	updated.Name = name
	httpx.JSON(w, http.StatusOK, map[string]any{"user": updated})
}

func (s *Service) logoutOthers(w http.ResponseWriter, r *http.Request) {
	u := UserFrom(r.Context())
	sum := sha256.Sum256([]byte(currentToken(r)))
	if _, err := s.db.ExecContext(r.Context(), `DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2`, u.ID, sum[:]); err != nil {
		httpx.InternalError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
