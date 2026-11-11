package auth

import (
	"context"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/httpx"
	"github.com/wanmory/wanmory/server/internal/ipgeo"
)

// 登录日志：GET /api/auth/logins?limit=200（只有管理员能看），最近的在前。
// 每次登录都记一条：谁（填的名字，对得上成员时是成员现在的名字）、成功还是密码不对、什么浏览器、IP、大概在哪。
// 只留最近半年

// LoginEvent 是登录日志里的一条
type LoginEvent struct {
	Time      time.Time  `json:"time"`
	UserID    *uuid.UUID `json:"user_id"` // 名字对得上的成员；名字不存在是 null
	Name      string     `json:"name"`
	OK        bool       `json:"ok"`
	IP        string     `json:"ip"`
	UserAgent string     `json:"user_agent"`
	Location  string     `json:"location"` // 「广东 深圳 · 电信」「局域网」，查不到是空的
}

const loginKeep = 180 * 24 * time.Hour

// noteLogin 记一条登录日志（成功的 ok = true）。写不进去只打日志，不影响登录
func (s *Service) noteLogin(ctx context.Context, r *http.Request, name string, ok bool) {
	name = strings.TrimSpace(name)
	if len([]rune(name)) > 64 {
		name = string([]rune(name)[:64])
	}
	ua := r.UserAgent()
	if len(ua) > 400 {
		ua = ua[:400]
	}
	ip := clientIP(r)
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO login_events (user_id, name, ok, ip, user_agent, location)
		VALUES ((SELECT id FROM users WHERE lower(name) = lower($1)), $1, $2, $3, $4, $5)`,
		name, ok, ip, ua, ipgeo.Lookup(ip))
	if err != nil {
		log.Printf("auth: 记登录日志失败: %v", err)
		return
	}
	_, _ = s.db.ExecContext(ctx, `DELETE FROM login_events WHERE created_at < $1`, time.Now().Add(-loginKeep))
}

func (s *Service) logins(w http.ResponseWriter, r *http.Request) {
	limit := 200
	if v, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && v > 0 && v <= 1000 {
		limit = v
	}
	rows, err := s.db.QueryContext(r.Context(), `
		SELECT e.created_at, e.user_id, COALESCE(u.name, e.name), e.ok, e.ip, e.user_agent, e.location
		FROM login_events e LEFT JOIN users u ON u.id = e.user_id
		ORDER BY e.created_at DESC LIMIT $1`, limit)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer rows.Close()
	list := []LoginEvent{}
	for rows.Next() {
		var e LoginEvent
		if err := rows.Scan(&e.Time, &e.UserID, &e.Name, &e.OK, &e.IP, &e.UserAgent, &e.Location); err != nil {
			httpx.InternalError(w, err)
			return
		}
		list = append(list, e)
	}
	if err := rows.Err(); err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}
