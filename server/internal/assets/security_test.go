package assets

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/auth"
)

func TestSafeType(t *testing.T) {
	for in, want := range map[string]string{
		"image/jpeg":       "image/jpeg",
		"video/x-matroska": "video/x-matroska",
		"text/html":        "application/octet-stream",
		"":                 "application/octet-stream",
	} {
		if got := safeType(in); got != want {
			t.Errorf("safeType(%q) = %q, want %q", in, got, want)
		}
	}
}

func TestVisibleTo(t *testing.T) {
	me, other := uuid.New(), uuid.New()
	now := time.Now()
	hiddenByOther := &Asset{Hidden: true, HiddenBy: &other}
	hiddenByMe := &Asset{Hidden: true, HiddenBy: &me}
	deleted := &Asset{DeletedAt: &now}
	user := &auth.User{ID: me}
	admin := &auth.User{ID: uuid.New(), IsAdmin: true}
	cases := []struct {
		name string
		a    *Asset
		u    *auth.User
		want bool
	}{
		{"普通照片，访客", &Asset{}, nil, true},
		{"别人隐藏的，成员", hiddenByOther, user, false},
		{"别人隐藏的，管理员", hiddenByOther, admin, false},
		{"别人隐藏的，访客", hiddenByOther, nil, false},
		{"自己隐藏的", hiddenByMe, user, true},
		{"最近删除，成员", deleted, user, true},
		{"最近删除，访客", deleted, nil, false},
	}
	for _, c := range cases {
		if got := visibleTo(c.a, c.u); got != c.want {
			t.Errorf("%s: visibleTo = %v, want %v", c.name, got, c.want)
		}
	}
}
