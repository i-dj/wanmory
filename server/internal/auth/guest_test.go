package auth

import (
	"net/http/httptest"
	"testing"
)

func TestGuestAllowed(t *testing.T) {
	cases := []struct {
		method, target string
		want           bool
	}{
		{"GET", "/api/assets?limit=1", true},
		{"GET", "/api/assets/0b1e/thumbnail", true},
		{"GET", "/api/albums", true},
		{"GET", "/api/people/0b1e/profile", true},
		{"GET", "/api/users", true},
		{"GET", "/api/assets?view=deleted", false}, // 最近删除
		{"GET", "/api/albums/0b1e/privacy", false}, // 相册的私有设置
		{"GET", "/api/settings", false},
		{"GET", "/api/storage/dirs", false}, // 服务器上的目录
		{"GET", "/api/ai/status", false},
		{"PATCH", "/api/assets/0b1e", false}, // 改东西一律不行
		{"POST", "/api/albums", false},
		{"DELETE", "/api/assets/0b1e", false},
	}
	for _, c := range cases {
		if got := guestAllowed(httptest.NewRequest(c.method, c.target, nil)); got != c.want {
			t.Errorf("%s %s：访客能用 = %v，应该是 %v", c.method, c.target, got, c.want)
		}
	}
}
