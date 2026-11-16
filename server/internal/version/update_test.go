package version

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestTranslations(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte(`{"v0.4.9":{"en":["Album banners","Download albums"],"ja":["横幅","ダウンロード"]}}`))
	}))
	defer srv.Close()
	u := NewUpdates("i-dj/wanmory")
	u.notes = srv.URL
	tr, err := u.translations(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if got := tr["v0.4.9"]["ja"]; len(got) != 2 || got[1] != "ダウンロード" {
		t.Fatalf("译文不对：%v", tr)
	}

	// 官网出错时返回错误，调用方照样显示中文原文
	bad := httptest.NewServer(http.NotFoundHandler())
	defer bad.Close()
	u.notes = bad.URL
	if _, err := u.translations(context.Background()); err == nil {
		t.Fatal("官网 404 时应该返回错误")
	}
}
