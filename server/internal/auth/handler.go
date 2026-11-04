package auth

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// Routes 登录相关的接口：
//
//	GET    /api/auth/state     还要不要建管理员、现在是谁登录着（没登录时 user 是 null）
//	POST   /api/auth/setup     第一次打开时建管理员，建好直接登录
//	POST   /api/auth/login     {"name", "password"} 登录
//	POST   /api/auth/logout    退出登录
//	PUT    /api/auth/password  {"old", "new"} 改自己的密码
//	PUT    /api/auth/avatar    {"asset_id"} 用一张照片当自己的头像（null 是不用照片）
//	GET    /api/users          家庭成员列表
//	POST   /api/users          {"name", "password"} 加家庭成员（管理员）
//	DELETE /api/users/{id}     删家庭成员（管理员）
//	PUT    /api/users/{id}/password  {"password"} 给别人重置密码（管理员）
func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/auth/state", s.state)
	mux.HandleFunc("POST /api/auth/setup", s.setup)
	mux.HandleFunc("POST /api/auth/login", s.login)
	mux.HandleFunc("POST /api/auth/logout", s.logout)
	mux.HandleFunc("PUT /api/auth/password", s.changePassword)
	mux.HandleFunc("PUT /api/auth/avatar", s.setAvatar)
	mux.HandleFunc("GET /api/users", s.listUsers)
	mux.HandleFunc("POST /api/users", s.admin(s.addUser))
	mux.HandleFunc("DELETE /api/users/{id}", s.admin(s.deleteUser))
	mux.HandleFunc("PUT /api/users/{id}/password", s.admin(s.resetPassword))
}

// public 是不用登录也能访问的接口
var public = map[string]bool{
	"/api/health":     true,
	"/api/auth/state": true,
	"/api/auth/setup": true,
	"/api/auth/login": true,
}

// guestPaths 是访客（没登录、访客模式开着）能读的接口，只有 GET。读服务器目录、设置、AI 服务、相册的私有设置、
// 「最近删除」都不在里面；改东西的接口一个都不给（回答 403「访客只能浏览」）。
// 访客在别的地方和「谁都不是」一样：看不到任何人隐藏的照片、私有相册，只给部分成员看的共享相册也看不到
var guestPaths = []string{
	"/api/assets", "/api/assets/changes", "/api/assets/dates", "/api/assets/points", "/api/assets/stats",
	"/api/assets/summary", "/api/albums", "/api/albums/values", "/api/people", "/api/faces/status",
	"/api/search/options", "/api/users",
}

// guestPrefixes 是带 ID 的：照片的缩略图、预览、原图、详情，人物页，人脸小图
var guestPrefixes = []string{"/api/assets/", "/api/people/", "/api/faces/"}

func guestAllowed(r *http.Request) bool {
	if r.Method != http.MethodGet {
		return false
	}
	if r.URL.Query().Get("view") == "deleted" { // 最近删除
		return false
	}
	p := r.URL.Path
	for _, g := range guestPaths {
		if p == g {
			return true
		}
	}
	for _, g := range guestPrefixes {
		if strings.HasPrefix(p, g) && !strings.HasSuffix(p, "/privacy") {
			return true
		}
	}
	return false
}

// Middleware 拦住没登录的 /api 请求（401）；登录了的把人放进 context。网页本身（/api 以外）不拦，
// 打开网页先显示登录页，登录后才去请求数据。访客模式开着时，没登录的人能只读浏览（见 guestPaths），
// 请求里没有人（UserFrom 是 nil）
func (s *Service) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.URL.Path, "/api/") || public[r.URL.Path] {
			if c, err := r.Cookie(CookieName); err == nil {
				if u, _ := s.UserBySession(r.Context(), c.Value); u != nil {
					r = r.WithContext(WithUser(r.Context(), u))
				}
			}
			next.ServeHTTP(w, r)
			return
		}
		c, err := r.Cookie(CookieName)
		if err != nil {
			s.guestOr401(w, r, next, "请先登录")
			return
		}
		u, err := s.UserBySession(r.Context(), c.Value)
		if err != nil {
			httpx.InternalError(w, err)
			return
		}
		if u == nil {
			s.guestOr401(w, r, next, "登录已过期，请重新登录")
			return
		}
		next.ServeHTTP(w, r.WithContext(WithUser(r.Context(), u)))
	})
}

// guestOr401：访客模式开着、是访客能读的就放行（没有人），访客想改东西回答 403；访客模式关着回答 401（网页回到登录页）
func (s *Service) guestOr401(w http.ResponseWriter, r *http.Request, next http.Handler, msg string) {
	if !s.guestOn(r.Context()) {
		httpx.Error(w, http.StatusUnauthorized, msg)
		return
	}
	if !guestAllowed(r) {
		httpx.Error(w, http.StatusForbidden, "访客只能浏览，登录后才能修改")
		return
	}
	next.ServeHTTP(w, r)
}

func (s *Service) admin(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if u := UserFrom(r.Context()); u == nil || !u.IsAdmin {
			httpx.Error(w, http.StatusForbidden, "只有管理员能管理家庭成员")
			return
		}
		h(w, r)
	}
}

func (s *Service) state(w http.ResponseWriter, r *http.Request) {
	need, err := s.SetupNeeded(r.Context())
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"setup_needed": need, "user": UserFrom(r.Context()), "guest": !need && s.guestOn(r.Context()),
	})
}

type credentials struct {
	Name     string `json:"name"`
	Password string `json:"password"`
	// Remember 是「记住登录状态」：不带或 true 时记住 90 天；false 时（别人的电脑）关了浏览器就退出
	Remember *bool `json:"remember"`
}

func (c credentials) remember() bool { return c.Remember == nil || *c.Remember }

func decode(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<16)).Decode(v); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return false
	}
	return true
}

func (s *Service) setup(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !decode(w, r, &c) {
		return
	}
	u, err := s.Setup(r.Context(), c.Name, c.Password)
	if s.fail(w, err) {
		return
	}
	log.Printf("auth: 建好了管理员「%s」", u.Name)
	s.startSession(w, r, c.Name, c.Password, true)
}

func (s *Service) login(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !decode(w, r, &c) {
		return
	}
	s.startSession(w, r, c.Name, c.Password, c.remember())
}

// startSession 登录并发 cookie。remember 时 cookie 和会话都记 90 天；不记住时 cookie 不写过期时间
// （浏览器关了就没了），服务器上的会话也只留 12 小时
func (s *Service) startSession(w http.ResponseWriter, r *http.Request, name, password string, remember bool) {
	ttl := sessionTTL
	if !remember {
		ttl = shortTTL
	}
	u, token, err := s.Login(r.Context(), name, password, ttl)
	if s.fail(w, err) {
		return
	}
	cookie := &http.Cookie{
		Name:     CookieName,
		Value:    token,
		Path:     "/",
		HttpOnly: true, // 网页里的脚本读不到，被注入了脚本也偷不走
		SameSite: http.SameSiteLaxMode,
		Secure:   r.TLS != nil,
	}
	if remember {
		cookie.Expires = time.Now().Add(sessionTTL)
	}
	http.SetCookie(w, cookie)
	httpx.JSON(w, http.StatusOK, map[string]any{"user": u})
}

func (s *Service) logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(CookieName); err == nil {
		if err := s.Logout(r.Context(), c.Value); err != nil {
			httpx.InternalError(w, err)
			return
		}
	}
	http.SetCookie(w, &http.Cookie{Name: CookieName, Value: "", Path: "/", MaxAge: -1, HttpOnly: true})
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) changePassword(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Old string `json:"old"`
		New string `json:"new"`
	}
	if !decode(w, r, &req) {
		return
	}
	u := UserFrom(r.Context())
	ok, err := s.CheckPassword(r.Context(), u.ID, req.Old)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	if !ok {
		httpx.Error(w, http.StatusBadRequest, "原来的密码不对")
		return
	}
	c, _ := r.Cookie(CookieName)
	if s.fail(w, s.SetPassword(r.Context(), u.ID, req.New, c.Value)) {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) setAvatar(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AssetID *uuid.UUID `json:"asset_id"`
	}
	if !decode(w, r, &req) {
		return
	}
	u := UserFrom(r.Context())
	if err := s.SetAvatar(r.Context(), u.ID, req.AssetID); errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusBadRequest, "这张照片不能当头像")
		return
	} else if err != nil {
		httpx.InternalError(w, err)
		return
	}
	updated := *u
	updated.Avatar = req.AssetID
	httpx.JSON(w, http.StatusOK, map[string]any{"user": updated})
}

func (s *Service) listUsers(w http.ResponseWriter, r *http.Request) {
	list, err := s.Users(r.Context())
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

func (s *Service) addUser(w http.ResponseWriter, r *http.Request) {
	var c credentials
	if !decode(w, r, &c) {
		return
	}
	u, err := s.AddUser(r.Context(), c.Name, c.Password)
	if s.fail(w, err) {
		return
	}
	httpx.JSON(w, http.StatusCreated, u)
}

func (s *Service) deleteUser(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID 格式不对")
		return
	}
	if id == UserID(r.Context()) {
		httpx.Error(w, http.StatusBadRequest, "不能删除自己")
		return
	}
	if s.fail(w, s.DeleteUser(r.Context(), id)) {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Service) resetPassword(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "ID 格式不对")
		return
	}
	var req struct {
		Password string `json:"password"`
	}
	if !decode(w, r, &req) {
		return
	}
	if s.fail(w, s.SetPassword(r.Context(), id, req.Password, "")) {
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// fail 把出错变成合适的回答；没出错返回 false
func (s *Service) fail(w http.ResponseWriter, err error) bool {
	switch {
	case err == nil:
		return false
	case errors.Is(err, ErrBadLogin):
		httpx.Error(w, http.StatusUnauthorized, err.Error())
	case errors.Is(err, ErrNotFound):
		httpx.Error(w, http.StatusNotFound, err.Error())
	case errors.Is(err, ErrSetupDone), errors.Is(err, ErrNameTaken):
		httpx.Error(w, http.StatusConflict, err.Error())
	case errors.Is(err, ErrLastAdmin), errors.Is(err, ErrWeakPassword), errors.Is(err, ErrBadName):
		httpx.Error(w, http.StatusBadRequest, err.Error())
	default:
		httpx.InternalError(w, err)
	}
	return true
}
