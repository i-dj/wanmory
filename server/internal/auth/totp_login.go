package auth

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"strconv"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// 登录的第二步：密码对了、这个人开着两步验证时，先不发登录 cookie，给一张 5 分钟有效的「登录票」，
// 网页接着让输验证码（或备用码），带着票 POST /api/auth/login/totp。一张票最多试 5 次；
// 输错的验证码和输错的密码一样算进 IP、名字的次数里（见 limit.go），所以知道密码也没法一直猜验证码

const (
	ticketTTL   = 5 * time.Minute
	ticketTries = 5
)

type loginTicket struct {
	user     uuid.UUID
	name     string
	remember bool
	expires  time.Time
	tries    int
}

var tickets = struct {
	sync.Mutex
	m map[string]*loginTicket
}{m: map[string]*loginTicket{}}

func newTicket(u *User, remember bool) (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	id := base64.RawURLEncoding.EncodeToString(b)
	tickets.Lock()
	defer tickets.Unlock()
	now := time.Now()
	for k, t := range tickets.m { // 顺手清掉过期的
		if now.After(t.expires) {
			delete(tickets.m, k)
		}
	}
	tickets.m[id] = &loginTicket{user: u.ID, name: u.Name, remember: remember, expires: now.Add(ticketTTL)}
	return id, nil
}

// takeTicket 取出票（过期的当作没有）；用完、试满次数时删掉
func takeTicket(id string) (*loginTicket, bool) {
	tickets.Lock()
	defer tickets.Unlock()
	t, ok := tickets.m[id]
	if !ok || time.Now().After(t.expires) {
		delete(tickets.m, id)
		return nil, false
	}
	return t, true
}

func dropTicket(id string) {
	tickets.Lock()
	defer tickets.Unlock()
	delete(tickets.m, id)
}

// loginTOTP：POST /api/auth/login/totp，请求体 {"ticket": "...", "code": "123456"}（code 也可以是备用码）。
// 对了就和普通登录一样发 cookie，回答 {"user": ...}
func (s *Service) loginTOTP(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Ticket string `json:"ticket"`
		Code   string `json:"code"`
	}
	if !decode(w, r, &req) {
		return
	}
	t, ok := takeTicket(req.Ticket)
	if !ok {
		httpx.Error(w, http.StatusUnauthorized, "登录已经过期，请重新输入名字和密码")
		return
	}
	ip := clientIP(r)
	if wait, blocked := logins.blocked(ip, t.name); blocked {
		dropTicket(req.Ticket)
		w.Header().Set("Retry-After", strconv.Itoa(int(wait.Seconds())+1))
		httpx.Error(w, http.StatusTooManyRequests, waitMessage(wait))
		return
	}
	err := s.checkSecondFactor(r.Context(), t.user, req.Code)
	if errors.Is(err, ErrBadCode) {
		logins.fail(ip, t.name)
		s.noteLogin(r.Context(), r, t.name, false)
		tickets.Lock()
		t.tries++
		if t.tries >= ticketTries {
			delete(tickets.m, req.Ticket)
		}
		tickets.Unlock()
		httpx.Error(w, http.StatusUnauthorized, ErrBadCode.Error())
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	dropTicket(req.Ticket)
	ttl := sessionTTL
	if !t.remember {
		ttl = shortTTL
	}
	token, err := s.newSession(r.Context(), t.user, ttl)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	u, err := s.UserBySession(r.Context(), token)
	if err != nil || u == nil {
		httpx.InternalError(w, errors.Join(err, errors.New("刚建的会话找不到")))
		return
	}
	logins.succeed(ip, t.name)
	s.noteLogin(r.Context(), r, u.Name, true)
	log.Printf("auth: 「%s」用两步验证登录", u.Name)
	s.issueCookie(w, r, token, t.remember)
	httpx.JSON(w, http.StatusOK, map[string]any{"user": u})
}

// totpRoutes：自己的两步验证。开启分两步（setup 拿密钥和二维码，enable 输对一次验证码），关掉要输登录密码
func (s *Service) totpRoutes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/auth/login/totp", s.loginTOTP)
	mux.HandleFunc("POST /api/auth/totp/setup", s.totpSetup)
	mux.HandleFunc("POST /api/auth/totp/enable", s.totpEnable)
	mux.HandleFunc("POST /api/auth/totp/disable", s.totpDisable)
}

func (s *Service) totpSetup(w http.ResponseWriter, r *http.Request) {
	u := UserFrom(r.Context())
	if u == nil {
		httpx.Error(w, http.StatusUnauthorized, "还没登录")
		return
	}
	secret, uri, err := s.StartTOTP(r.Context(), u)
	if errors.Is(err, ErrTOTPOn) {
		httpx.Error(w, http.StatusConflict, err.Error())
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]string{"secret": secret, "uri": uri})
}

func (s *Service) totpEnable(w http.ResponseWriter, r *http.Request) {
	u := UserFrom(r.Context())
	if u == nil {
		httpx.Error(w, http.StatusUnauthorized, "还没登录")
		return
	}
	var req struct {
		Code string `json:"code"`
	}
	if !decode(w, r, &req) {
		return
	}
	codes, err := s.EnableTOTP(r.Context(), u.ID, req.Code)
	switch {
	case errors.Is(err, ErrBadCode), errors.Is(err, ErrTOTPOff):
		httpx.Error(w, http.StatusBadRequest, err.Error())
	case errors.Is(err, ErrTOTPOn):
		httpx.Error(w, http.StatusConflict, err.Error())
	case err != nil:
		httpx.InternalError(w, err)
	default:
		log.Printf("auth: 「%s」开启了两步验证", u.Name)
		httpx.JSON(w, http.StatusOK, map[string]any{"recovery_codes": codes})
	}
}

func (s *Service) totpDisable(w http.ResponseWriter, r *http.Request) {
	u := UserFrom(r.Context())
	if u == nil {
		httpx.Error(w, http.StatusUnauthorized, "还没登录")
		return
	}
	var req struct {
		Password string `json:"password"`
	}
	if !decode(w, r, &req) {
		return
	}
	err := s.DisableTOTP(r.Context(), u.ID, req.Password)
	if errors.Is(err, ErrBadLogin) {
		httpx.Error(w, http.StatusBadRequest, "密码不对")
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	log.Printf("auth: 「%s」关掉了两步验证", u.Name)
	w.WriteHeader(http.StatusNoContent)
}
