package auth

import (
	"net/http/httptest"
	"testing"
)

func TestCurrentToken(t *testing.T) {
	cases := []struct {
		name, header, cookie, want string
	}{
		{"none", "", "", ""},
		{"cookie", "", "c1", "c1"},
		{"bearer", "Bearer b1", "", "b1"},
		{"bearer wins", "bearer b2", "c2", "b2"},
		{"other scheme", "Basic xyz", "c3", "c3"},
	}
	for _, c := range cases {
		r := httptest.NewRequest("GET", "/api/assets", nil)
		if c.header != "" {
			r.Header.Set("Authorization", c.header)
		}
		if c.cookie != "" {
			r.Header.Set("Cookie", CookieName+"="+c.cookie)
		}
		if got := currentToken(r); got != c.want {
			t.Errorf("%s: got %q, want %q", c.name, got, c.want)
		}
	}
}

func TestLoginResponse(t *testing.T) {
	u := &User{Name: "a"}
	if _, ok := loginResponse(u, "t", false)["token"]; ok {
		t.Error("token returned to a web client")
	}
	if loginResponse(u, "t", true)["token"] != "t" {
		t.Error("token missing for the app")
	}
}
