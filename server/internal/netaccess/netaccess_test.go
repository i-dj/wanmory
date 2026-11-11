package netaccess

import "testing"

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
