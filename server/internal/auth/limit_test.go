package auth

import (
	"net/http/httptest"
	"testing"
	"time"
)

func TestLimiter(t *testing.T) {
	l := &limiter{fails: map[string][]time.Time{}}
	for i := 0; i < maxIPFails-1; i++ {
		l.fail("1.2.3.4", "wang")
	}
	if _, b := l.blocked("1.2.3.4", "wang"); b {
		t.Fatal("还没到上限就拦了")
	}
	l.fail("1.2.3.4", "wang")
	if wait, b := l.blocked("1.2.3.4", "someone"); !b || wait <= 0 || wait > failWindow {
		t.Fatalf("同一个 IP 输错 %d 次应该拦住：wait=%v blocked=%v", maxIPFails, wait, b)
	}
	if _, b := l.blocked("5.6.7.8", "wang"); b {
		t.Fatal("别的 IP 试同一个名字，名字还没到上限，不该拦")
	}
	l.succeed("1.2.3.4", "wang")
	if _, b := l.blocked("1.2.3.4", "wang"); b {
		t.Fatal("登录成功后应该清掉记录")
	}
	// 过期的不算
	l.fails["ip:9.9.9.9"] = make([]time.Time, maxIPFails)
	for i := range l.fails["ip:9.9.9.9"] {
		l.fails["ip:9.9.9.9"][i] = time.Now().Add(-failWindow - time.Minute)
	}
	if _, b := l.blocked("9.9.9.9", "x"); b {
		t.Fatal("15 分钟前的错误不该算")
	}
}

func TestClientIP(t *testing.T) {
	r := httptest.NewRequest("GET", "/", nil)
	r.RemoteAddr = "203.0.113.5:1234"
	r.Header.Set("X-Forwarded-For", "10.0.0.1")
	if got := clientIP(r); got != "203.0.113.5" {
		t.Fatalf("直接来自公网的请求不该信 X-Forwarded-For：%q", got)
	}
	r.RemoteAddr = "127.0.0.1:1234" // 本机的反向代理
	r.Header.Set("X-Forwarded-For", "6.6.6.6, 198.51.100.7")
	if got := clientIP(r); got != "198.51.100.7" {
		t.Fatalf("反向代理后面应该取最后一个：%q", got)
	}
}
