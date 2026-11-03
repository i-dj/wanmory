package assets

import (
	"encoding/json"
	"testing"
	"time"
)

func TestLocalTime(t *testing.T) {
	got, err := LocalTime{Local: "2026-10-27T13:01:23", Offset: "-04:00"}.Time()
	if err != nil {
		t.Fatal(err)
	}
	if want := time.Date(2026, 10, 27, 17, 1, 23, 0, time.UTC); !got.Equal(want) {
		t.Errorf("got %v, want %v", got, want)
	}
	for _, bad := range []LocalTime{
		{Local: "2026-10-27 13:01", Offset: "-04:00"},
		{Local: "2026-10-27T13:01:23", Offset: "EDT"},
	} {
		if _, err := bad.Time(); err == nil {
			t.Errorf("%+v 应该报错", bad)
		}
	}
}

func TestInfoRequestPatch(t *testing.T) {
	decode := func(body string) (InfoPatch, error) {
		var req infoRequest
		if err := json.Unmarshal([]byte(body), &req); err != nil {
			t.Fatal(err)
		}
		return req.patch()
	}

	p, err := decode(`{}`)
	if err != nil || !p.empty() {
		t.Errorf("空请求: %+v, %v", p, err)
	}
	p, err = decode(`{"location": null}`)
	if err != nil || !p.RemoveLocation || p.Location != nil {
		t.Errorf("location null 应该是去掉位置: %+v, %v", p, err)
	}
	p, err = decode(`{"location": {"latitude": 28.35, "longitude": -81.56}}`)
	if err != nil || p.Location == nil || p.Location.Longitude != -81.56 {
		t.Errorf("设置位置: %+v, %v", p, err)
	}
	for _, bad := range []string{
		`{"location": {"latitude": 91, "longitude": 0}}`,
		`{"taken_at": {"local": "昨天", "offset": "+08:00"}}`,
		`{"reset": ["favorite"]}`,
	} {
		if _, err := decode(bad); err == nil {
			t.Errorf("%s 应该报错", bad)
		}
	}
}
