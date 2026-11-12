package perf

import (
	"net/http"
	"net/http/httptest"
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
	if ok, why := s.aiState(); ok || why != "刚传完照片，21 秒后开始" {
		t.Fatalf("刚上传过应该停: %v %q", ok, why)
	}
	s.lastUpload.Store(now.Add(-2 * time.Minute).UnixNano())
	s.uploading.Add(1)
	if ok, why := s.aiState(); ok || why != "有照片正在上传" {
		t.Fatalf("正在上传应该停: %v %q", ok, why)
	}
	s.uploading.Add(-1)
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

func TestTrack(t *testing.T) {
	now := time.Date(2026, 11, 8, 12, 0, 0, 0, time.Local)
	s := &Service{cur: defaults, now: func() time.Time { return now }}
	for _, c := range []struct {
		method, path string
		status       int
		paused       bool
	}{
		{http.MethodHead, "/api/uploads/abc", 200, false},  // 问进度不算
		{http.MethodPatch, "/api/uploads/abc", 423, false}, // 失败的不算
		{http.MethodGet, "/api/assets", 200, false},        // 浏览不算
		{http.MethodPatch, "/api/uploads/abc", 204, true},  // 传了一片
	} {
		h := s.Track(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { w.WriteHeader(c.status) }))
		h.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(c.method, c.path, nil))
		if s.AllowAI() == c.paused {
			t.Errorf("%s %s %d 之后 AI 停着 = %v，应该是 %v", c.method, c.path, c.status, !s.AllowAI(), c.paused)
		}
	}
}

func TestAIBlocker(t *testing.T) {
	now := time.Date(2026, 11, 8, 12, 0, 0, 0, time.Local)
	s := &Service{cur: Settings{Schedule: "always"}, now: func() time.Time { return now }}
	reason := "模型没下载"
	s.SetBlocker(func() string { return reason })
	if ok, why := s.aiState(); ok || why != reason {
		t.Fatalf("模型没下载时就算一直运行也应该停: %v %q", ok, why)
	}
	reason = ""
	if !s.AllowAI() {
		t.Fatal("模型下好后应该能跑")
	}
}
