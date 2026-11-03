package assets

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestParseExifTime(t *testing.T) {
	cst := time.FixedZone("", 8*3600)
	tests := []struct {
		in   string
		want time.Time
		ok   bool
	}{
		{"2024:05:01 18:30:00+08:00", time.Date(2024, 5, 1, 18, 30, 0, 0, cst), true},
		{"2024:05:01 18:30:00.123+08:00", time.Date(2024, 5, 1, 18, 30, 0, 123e6, cst), true},
		{"2024:05:01 18:30:00Z", time.Date(2024, 5, 1, 18, 30, 0, 0, time.UTC), true},
		{"2024:05:01 18:30:00", time.Date(2024, 5, 1, 18, 30, 0, 0, time.Local), true},

		// 美图秀秀写的上午/下午
		{"2025:06:24 10:03:07上午+08:00", time.Date(2025, 6, 24, 10, 3, 7, 0, cst), true},
		{"2025:06:24 10:03:07.905上午+08:00", time.Date(2025, 6, 24, 10, 3, 7, 905e6, cst), true},
		{"2025:06:24 03:04:05下午+08:00", time.Date(2025, 6, 24, 15, 4, 5, 0, cst), true},
		{"2025:06:24 12:30:00上午+08:00", time.Date(2025, 6, 24, 0, 30, 0, 0, cst), true},
		{"2025:06:24 12:30:00下午+08:00", time.Date(2025, 6, 24, 12, 30, 0, 0, cst), true},
		{"2025:06:24 10:03:07上午", time.Date(2025, 6, 24, 10, 3, 7, 0, time.Local), true},

		// 英文 AM/PM，带不带空格、大小写都可以
		{"2025:06:24 03:04:05 PM+08:00", time.Date(2025, 6, 24, 15, 4, 5, 0, cst), true},
		{"2025:06:24 03:04:05pm", time.Date(2025, 6, 24, 15, 4, 5, 0, time.Local), true},
		{"2025:06:24 12:04:05 AM", time.Date(2025, 6, 24, 0, 4, 5, 0, time.Local), true},

		{"0000:00:00 00:00:00", time.Time{}, false},
		{"", time.Time{}, false},
		{"not a date", time.Time{}, false},
	}
	for _, tt := range tests {
		got, ok := parseExifTime(tt.in)
		if ok != tt.ok || (ok && !got.Equal(tt.want)) {
			t.Errorf("parseExifTime(%q) = %v, %v; want %v, %v", tt.in, got, ok, tt.want, tt.ok)
		}
	}
}

// takenAt 用的是 IMG_3880.HEIC（美图秀秀编辑过）里的真实标签。
func TestTakenAtMeituHEIC(t *testing.T) {
	tags := map[string]any{
		"DateTimeOriginal":       "2025:06:24 10:03:07上午",
		"SubSecDateTimeOriginal": "2025:06:24 10:03:07.905上午+08:00",
		"OffsetTimeOriginal":     "+08:00",
		"CreateDate":             "2025:06:24 10:03:07上午",
	}
	got := takenAt(tags)
	want := time.Date(2025, 6, 24, 10, 3, 7, 905e6, time.FixedZone("", 8*3600))
	if got == nil || !got.Equal(want) {
		t.Fatalf("takenAt = %v, want %v", got, want)
	}
}

func TestLocalClock(t *testing.T) {
	taken := time.Date(2025, 6, 24, 2, 3, 7, 0, time.UTC) // 北京时间 10:03:07
	offset := "+08:00"
	if got := localClock(&taken, &offset); got == nil || *got != "2025-06-24T10:03:07" {
		t.Errorf("localClock with +08:00 = %v, want 2025-06-24T10:03:07", got)
	}
	// 没有时区记录时按服务器时区换回原始时间
	local := time.Date(2024, 5, 1, 18, 30, 0, 0, time.Local)
	if got := localClock(&local, nil); got == nil || *got != "2024-05-01T18:30:00" {
		t.Errorf("localClock without offset = %v, want 2024-05-01T18:30:00", got)
	}
	if localClock(nil, &offset) != nil {
		t.Error("localClock(nil) should be nil")
	}
}

func TestCursorRoundTrip(t *testing.T) {
	want := Cursor{Time: time.Date(2025, 6, 24, 2, 3, 7, 905_123_000, time.UTC), ID: uuid.MustParse("1895b552-1384-478d-85fc-474a6a874683")}
	got, err := ParseCursor(want.Encode())
	if err != nil {
		t.Fatal(err)
	}
	if !got.Time.Equal(want.Time) || got.ID != want.ID {
		t.Errorf("ParseCursor(Encode()) = %+v, want %+v", got, want)
	}
	if _, err := ParseCursor("不是游标"); err == nil {
		t.Error("错误的游标应该报错")
	}
}

func TestTimelinePriority(t *testing.T) {
	newer := timelinePriority(time.Date(2026, 10, 1, 0, 0, 0, 0, time.UTC))
	older := timelinePriority(time.Date(2019, 5, 1, 0, 0, 0, 0, time.UTC))
	if newer <= older {
		t.Errorf("新照片优先级 %d 应该高于旧照片 %d", newer, older)
	}
	if newer >= metadataPriority {
		t.Errorf("缩略图优先级 %d 不能超过读元数据 %d", newer, metadataPriority)
	}
	if p := timelinePriority(time.Date(1960, 1, 1, 0, 0, 0, 0, time.UTC)); p != 0 {
		t.Errorf("1970 年以前的照片优先级应该是 0，实际 %d", p)
	}
}
