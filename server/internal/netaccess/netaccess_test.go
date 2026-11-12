package netaccess

import (
	"net/http/httptest"
	"testing"
	"time"
)

func TestCheckDomain(t *testing.T) {
	ok := map[string]string{
		"wanmory.local":                "wanmory.local",
		" HTTP://Photos.Local:8080/x ": "photos.local",
		"my-nas.home.local.":           "my-nas.home.local",
	}
	for in, want := range ok {
		if got, err := CheckDomain(in); err != nil || got != want {
			t.Errorf("CheckDomain(%q) = %q, %v，应该是 %q", in, got, err, want)
		}
	}
	for _, bad := range []string{"", "wanmory", "photos.lan", "photos.example.com", ".local", "a b.local", "-x.local", "x..local"} {
		if _, err := CheckDomain(bad); err == nil {
			t.Errorf("CheckDomain(%q) 应该报错", bad)
		}
	}
}

func TestReportedIP(t *testing.T) {
	s := &Service{docker: true, domain: DefaultDomain, httpPort: "8080"}
	ask := func(ip string) {
		s.mdnsName(httptest.NewRecorder(), httptest.NewRequest("GET", "/api/net/mdns?ip="+ip, nil))
	}
	ask("8.8.8.8") // 公网地址不收
	if got := s.lanIP(); got != "" {
		t.Fatalf("公网地址不该收：%q", got)
	}
	ask("192.168.1.20")
	if got := s.lanIP(); got != "192.168.1.20" {
		t.Fatalf("局域网地址没记下：%q", got)
	}
	if got := s.url(s.lanIP()); got != "http://192.168.1.20:8080" {
		t.Fatalf("IP 网址不对：%q", got)
	}
	s.reportedAt = s.reportedAt.Add(-3 * time.Minute) // 太久没报：不知道
	if got := s.lanIP(); got != "" {
		t.Fatalf("过期的 IP 还在：%q", got)
	}
}
