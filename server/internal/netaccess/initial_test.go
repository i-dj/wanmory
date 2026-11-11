package netaccess

import "testing"

func TestInitialDomain(t *testing.T) {
	for _, c := range []struct{ env, want string }{
		{"", DefaultDomain},
		{"photos.local", "photos.local"},
		{"  Photos.Local  ", "photos.local"},
		{"example.com", DefaultDomain}, // 不是 .local 结尾，不合法时用默认的
	} {
		t.Setenv("WANMORY_DOMAIN", c.env)
		if got := InitialDomain(); got != c.want {
			t.Errorf("WANMORY_DOMAIN=%q: got %q, want %q", c.env, got, c.want)
		}
	}
}
