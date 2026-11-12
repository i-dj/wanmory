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
	settings   Settings
	httpPort   string // 浏览器里用的端口（Docker 里映射成别的端口时不一样），80 时网址里不写
	docker     bool   // 在 Docker 里：端口由 docker-compose 的端口映射定，相册改不了
	installDir string // Docker 安装的目录（安装脚本写进 .env 的 WANMORY_INSTALL_DIR），设置页的改端口命令要 cd 过去

	mu         sync.RWMutex
	domain     string
	reportedIP string // Docker 里 mdns 小服务（主机网络）报上来的局域网 IP，相册自己在内部网络里看不到
	reportedAt time.Time
}

// New 准备好。httpAddr 是相册监听的地址（算网址里的端口）
func New(httpAddr string, settings Settings) *Service {
	_, err := os.Stat("/.dockerenv")
	return &Service{
		settings:   settings,
		httpPort:   envOr("WANMORY_HTTP_PUBLIC_PORT", portOf(httpAddr)),
		docker:     err == nil || os.Getenv("WANMORY_HTTP_PUBLIC_PORT") != "",
		installDir: os.Getenv("WANMORY_INSTALL_DIR"),
		domain:     InitialDomain(),
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
func (s *Service) url(host string) string {
	if host == "" {
		return ""
	}
	if s.httpPort == "" || s.httpPort == "80" {
		return "http://" + host
	}
	return "http://" + net.JoinHostPort(host, s.httpPort)
}

// lanIP 是局域网里用 IP 打开相册的地址：直接跑在主机上时自己查；Docker 里用 mdns 小服务最近两分钟报上来的
func (s *Service) lanIP() string {
	if !s.docker {
		return LocalIP()
	}
	s.mu.RLock()
	defer s.mu.RUnlock()
	if time.Since(s.reportedAt) > 2*time.Minute {
		return ""
	}
	return s.reportedIP
}

// LocalIP 是这台机器在局域网里的 IP：往外连的时候用哪个地址（UDP 不真的发包），不是局域网地址时为空
func LocalIP() string {
	c, err := net.Dial("udp4", "1.1.1.1:80")
	if err != nil {
		return ""
	}
	defer c.Close()
	ip := c.LocalAddr().(*net.UDPAddr).IP
	if !ip.IsPrivate() {
		return ""
	}
	return ip.String()
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/net", s.status)
	mux.HandleFunc("GET /api/net/mdns", s.mdnsName)
}

// PublicPaths 是不用登录也能用的：Docker 里单独跑的 mdns 小服务问现在报哪个名字
var PublicPaths = []string{"/api/net/mdns"}

// status：GET /api/net，设置页显示用：域名和用它打开的网址、局域网 IP 和用它打开的网址、端口，
// 在不在 Docker 里（在的话端口要在服务器上改 .env）、Docker 安装的目录（不知道时为空）
func (s *Service) status(w http.ResponseWriter, r *http.Request) {
	d := s.Domain()
	ip := s.lanIP()
	httpx.JSON(w, http.StatusOK, map[string]any{
		"domain": d, "url": s.url(d),
		"ip": ip, "ip_url": s.url(ip),
		"port": s.httpPort, "docker": s.docker, "install_dir": s.installDir,
	})
}

// mdnsName：GET /api/net/mdns?ip=192.168.1.20，回答 {"name": "wanmory.local"}。Docker 里单独跑的 mdns 小服务
// 隔一会儿问一次，顺便报上它（主机网络）看到的局域网 IP。不用登录，所以只收局域网地址（10.x、172.16-31.x、192.168.x）
func (s *Service) mdnsName(w http.ResponseWriter, r *http.Request) {
	if ip := net.ParseIP(r.URL.Query().Get("ip")); ip != nil && ip.To4() != nil && ip.IsPrivate() {
		s.mu.Lock()
		s.reportedIP, s.reportedAt = ip.To4().String(), time.Now()
		s.mu.Unlock()
	}
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
