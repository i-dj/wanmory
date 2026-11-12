package auth

import (
	"io"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestDemoBlocked(t *testing.T) {
	cases := []struct {
		method, path, body string
		blocked            bool
		ids                []string // 删照片的请求：不直接拦，交给 recentUploads 看这几张是不是刚传的
	}{
		{"PUT", "/api/auth/password", `{"old":"a","new":"b"}`, true, nil},
		{"PUT", "/api/users/x/password", `{"password":"b"}`, true, nil},
		{"DELETE", "/api/auth/sessions", ``, true, nil},
		{"POST", "/api/auth/totp/setup", `{}`, true, nil},
		{"POST", "/api/auth/totp/disable", `{"password":"x"}`, true, nil},
		{"DELETE", "/api/albums/abc", ``, false, nil}, // 删相册交给 recentlyMine，见下面 album
		{"DELETE", "/api/albums/abc/members/x", ``, true, nil},
		{"DELETE", "/api/users/abc", ``, true, nil},
		{"POST", "/api/assets/purge", `{}`, true, nil},
		{"POST", "/api/assets/purge", `{"all":true}`, true, nil},
		{"POST", "/api/assets/purge", `{"ids":["a","b"]}`, false, []string{"a", "b"}},
		{"POST", "/api/bursts/review", `{}`, true, nil},
		{"POST", "/api/albums/abc/assets/remove", `{}`, true, nil},
		{"POST", "/api/assets/batch", `{"ids":["1"],"deleted":true}`, false, []string{"1"}},
		{"POST", "/api/assets/batch", `{"deleted":true}`, true, nil},
		{"PATCH", "/api/assets/abc", `{"deleted":true}`, false, []string{"abc"}},
		// 允许的：上传、收藏、恢复、建相册、加进相册、取消上传
		{"POST", "/api/assets/batch", `{"ids":["1"],"favorite":true}`, false, nil},
		{"POST", "/api/assets/batch", `{"ids":["1"],"deleted":false}`, false, nil},
		{"PATCH", "/api/assets/abc", `{"rating":4}`, false, nil},
		{"POST", "/api/assets", `{}`, false, nil},
		{"POST", "/api/albums", `{"name":"x"}`, false, nil},
		{"POST", "/api/albums/abc/assets", `{}`, false, nil},
		{"DELETE", "/api/uploads/abc", ``, false, nil},
		{"GET", "/api/assets", ``, false, nil},
		{"PUT", "/api/auth/avatar", `{}`, false, nil},
	}
	for _, c := range cases {
		r := httptest.NewRequest(c.method, c.path, strings.NewReader(c.body))
		got, del := demoBlocked(r)
		if got != c.blocked || strings.Join(del.assets, ",") != strings.Join(c.ids, ",") {
			t.Errorf("%s %s %s: blocked=%v ids=%v, want %v %v", c.method, c.path, c.body, got, del.assets, c.blocked, c.ids)
		}
		// 请求体读过以后要还能再读到
		if b, _ := io.ReadAll(r.Body); string(b) != c.body {
			t.Errorf("%s %s: body after check = %q, want %q", c.method, c.path, b, c.body)
		}
	}
}

func TestDemoAlbumDelete(t *testing.T) {
	blocked, del := demoBlocked(httptest.NewRequest("DELETE", "/api/albums/abc", nil))
	if blocked || del.album != "abc" || len(del.assets) != 0 {
		t.Fatalf("删相册：blocked=%v del=%+v，应该交给 recentlyMine 查相册 abc", blocked, del)
	}
}

func TestIsDemo(t *testing.T) {
	if !IsDemo(&User{Name: "Demo"}) || IsDemo(&User{Name: "demo2"}) || IsDemo(nil) {
		t.Fatal("IsDemo 判断不对")
	}
	t.Setenv("WANMORY_DEMO_USER", "guest")
	if IsDemo(&User{Name: "demo"}) || !IsDemo(&User{Name: "guest"}) {
		t.Fatal("WANMORY_DEMO_USER 没生效")
	}
}
