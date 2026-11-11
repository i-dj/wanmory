// Package netaccess 管局域网里用什么网址打开相册：访问域名（默认 wanmory.local，必须 .local 结尾），
// 由 mdns 包在局域网里报这个名字，Mac、iPhone、Windows 不用设置路由器就能用它打开；也可以一直用 IP 打开
package netaccess

import (
	"context"
	"errors"
	"net"
	"net/http"
	"os"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

// SettingDomain 是设置里的访问域名（登记在 cmd/wanmory/settings.go）
const (
	SettingDomain = "net.domain"
	DefaultDomain = "wanmory.local"
	pollEvery     = 5 * time.Second
)

// Settings 读现在的访问域名（没设过是默认值）
type Settings func(ctx context.Context) string

type Service struct {
	settings Settings
	httpPort string // 浏览器里用的端口（Docker 里映射成别的端口时不一样），80 时网址里不写

	mu     sync.RWMutex
	domain string
}

// New 准备好。httpAddr 是相册监听的地址（算网址里的端口）
func New(httpAddr string, settings Settings) *Service {
	return &Service{
		settings: settings,
		httpPort: envOr("WANMORY_HTTP_PUBLIC_PORT", portOf(httpAddr)),
		domain:   InitialDomain(),
	}
}

// Domain 是现在的访问域名（几秒前从设置里读的）
func (s *Service) Domain() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.domain
}

// Run 隔几秒从设置里读一次访问域名（改了设置几秒内生效，mdns 跟着报新名字），直到 ctx 结束
func (s *Service) Run(ctx context.Context) {
	for {
		d := s.settings(ctx)
		s.mu.Lock()
		s.domain = d
		s.mu.Unlock()
		select {
		case <-ctx.Done():
			return
		case <-time.After(pollEvery):
		}
	}
}

// url 是浏览器里打开的网址：http://wanmory.local:8080（端口是 80 时不写）
func (s *Service) url(domain string) string {
	if s.httpPort == "" || s.httpPort == "80" {
		return "http://" + domain
	}
	return "http://" + net.JoinHostPort(domain, s.httpPort)
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/net", s.status)
	mux.HandleFunc("GET /api/net/mdns", s.mdnsName)
}

// PublicPaths 是不用登录也能用的：Docker 里单独跑的 mdns 小服务问现在报哪个名字
var PublicPaths = []string{"/api/net/mdns"}

// status：GET /api/net，设置页显示用：{"domain", "url"}
func (s *Service) status(w http.ResponseWriter, r *http.Request) {
	d := s.Domain()
	httpx.JSON(w, http.StatusOK, map[string]string{"domain": d, "url": s.url(d)})
}

// mdnsName：GET /api/net/mdns，{"name": "wanmory.local"}；Docker 里单独跑的 mdns 小服务隔一会儿问一次
func (s *Service) mdnsName(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]string{"name": s.Domain()})
}

var label = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$`)

// InitialDomain 是没在网页设置里改过时用的访问域名：环境变量 WANMORY_DOMAIN（安装脚本按用户输入写进 .env），
// 没设或不合法时是 wanmory.local。网页「系统设置 → 访问域名」里改过以后以设置为准
func InitialDomain() string {
	if v := os.Getenv("WANMORY_DOMAIN"); v != "" {
		if d, err := CheckDomain(v); err == nil {
			return d
		}
	}
	return DefaultDomain
}

// CheckDomain 检查并整理设置里填的访问域名：小写，去掉 http:// 和结尾的 /、端口；必须 .local 结尾（mdns 只报 .local 的名字）
func CheckDomain(v string) (string, error) {
	v = strings.ToLower(strings.TrimSpace(v))
	v = strings.TrimPrefix(strings.TrimPrefix(v, "https://"), "http://")
	v = strings.TrimSuffix(strings.SplitN(v, "/", 2)[0], ".")
	if h, _, err := net.SplitHostPort(v); err == nil {
		v = h
	}
	name, ok := strings.CutSuffix(v, ".local")
	if !ok || name == "" {
		return "", errors.New("必须以 .local 结尾，例如 wanmory.local")
	}
	for _, part := range strings.Split(name, ".") {
		if !label.MatchString(part) {
			return "", errors.New("只能用字母、数字和减号，例如 wanmory.local")
		}
	}
	return v, nil
}

func portOf(addr string) string {
	if _, p, err := net.SplitHostPort(addr); err == nil {
		return p
	}
	return ""
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
