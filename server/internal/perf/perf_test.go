package perf

import (
	"testing"
	"time"
)

func TestDefaultWorkers(t *testing.T) {
	for _, c := range []struct {
		cpus int
		mem  int64
		want int
	}{
		{4, 4_000_000_000, 3}, // 树莓派 4 GB：MemTotal 不到 4 GiB
		{4, 8 << 30, 4},
		{12, 0, 12}, // 读不到内存
		{2, 512 << 20, 1},
	} {
		if got := DefaultWorkers(c.cpus, c.mem); got != c.want {
			t.Errorf("DefaultWorkers(%d, %d) = %d, want %d", c.cpus, c.mem, got, c.want)
		}
	}
}

func TestInWindow(t *testing.T) {
	for _, c := range []struct {
		h, start, end int
		want          bool
	}{
		{3, 1, 7, true}, {7, 1, 7, false}, {0, 1, 7, false},
		{23, 22, 6, true}, {5, 22, 6, true}, {12, 22, 6, false},
		{12, 3, 3, true},
	} {
		if got := inWindow(c.h, c.start, c.end); got != c.want {
			t.Errorf("inWindow(%d, %d, %d) = %v", c.h, c.start, c.end, got)
		}
	}
}

func TestAIState(t *testing.T) {
	now := time.Date(2026, 11, 8, 12, 0, 0, 0, time.Local)
	s := &Service{cur: defaults, now: func() time.Time { return now }}
	active := 0
	s.SetLocalActive(func() int { return active })
	if !s.AllowAI() {
		t.Fatal("空闲时应该能跑")
	}
	s.lastUpload.Store(now.Add(-10 * time.Second).UnixNano())
	if ok, why := s.aiState(); ok || why != "有照片正在上传" {
		t.Fatalf("刚上传过应该停: %v %q", ok, why)
	}
	s.lastUpload.Store(now.Add(-2 * time.Minute).UnixNano())
	active = 1
	if s.AllowAI() {
		t.Fatal("生成缩略图时应该停")
	}
	s.cur.Schedule = "always"
	if !s.AllowAI() {
		t.Fatal("随时：应该能跑")
	}
	active = 0
	s.cur.Schedule = "night"
	if s.AllowAI() {
		t.Fatal("中午不在夜间时段")
	}
	now = time.Date(2026, 11, 8, 2, 0, 0, 0, time.Local)
	if !s.AllowAI() {
		t.Fatal("2 点在夜间时段")
	}
}
