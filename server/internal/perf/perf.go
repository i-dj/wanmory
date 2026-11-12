// Package perf 是「设置 → 性能」：后台处理用多少 CPU、AI 什么时候跑。
//
// 默认值按这台机器的核数和内存自动算，网页上可以改：
//   - 同时处理几个任务（读元数据、生成缩略图），见 DefaultWorkers；
//   - AI 处理时机：空闲时（默认，有人在上传、正在生成缩略图时先停，上传的照片先出缩略图）、随时、只在夜里。
//
// AI 服务那边每个模型用几个线程在 AI 服务上设置（见 ml/wanmory_ml/runtime.py），不在这里。
package perf

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
	"github.com/wanmory/wanmory/server/internal/settings"
)

// SettingKey 存在 settings 表里，值是 Settings
const SettingKey = "perf"

// uploadQuiet：最后一次收到上传的数据之后多久才算上传完了
const uploadQuiet = 30 * time.Second

// Settings 是网页上能改的
type Settings struct {
	Schedule   string `json:"schedule"`    // idle / always / night
	NightStart int    `json:"night_start"` // 夜间时段，几点开始（0–23）
	NightEnd   int    `json:"night_end"`   // 几点结束；比开始小表示跨过零点
	Workers    int    `json:"workers"`     // 同时处理几个任务，0 是自动
}

var defaults = Settings{Schedule: "idle", NightStart: 1, NightEnd: 7}

type Service struct {
	store       *settings.Store
	cpus        int
	memory      int64
	auto        int // 同时处理几个任务的自动值
	mu          sync.RWMutex
	cur         Settings
	lastUpload  atomic.Int64 // 最后一次成功收到上传数据，unix 纳秒
	uploading   atomic.Int32 // 正在传的上传请求
	localActive func() int
	blocker     func() string // AI 根本跑不了的原因（例如模型还没下载），空串表示没有；任何时段都先看它
	now         func() time.Time
}

// New：envWorkers 是环境变量 WANMORY_WORKERS（没设是 0），设了就当自动值
func New(store *settings.Store, envWorkers int) *Service {
	s := &Service{store: store, cpus: CPUs(), memory: Memory(), cur: defaults, now: time.Now}
	s.auto = DefaultWorkers(s.cpus, s.memory)
	if envWorkers > 0 {
		s.auto = envWorkers
	}
	return s
}

// Load 读出设置；启动时调用
func (s *Service) Load(ctx context.Context) error {
	v, err := settings.GetOr(ctx, s.store, SettingKey, defaults)
	if err != nil {
		return err
	}
	s.mu.Lock()
	s.cur = normalize(v)
	s.mu.Unlock()
	return nil
}

// MaxWorkers 是本机 worker 最多开几路（设置页上能选到的最大值）
func (s *Service) MaxWorkers() int {
	return max(s.cpus, s.auto)
}

// Workers 是现在同时处理几个任务
func (s *Service) Workers() int {
	s.mu.RLock()
	n := s.cur.Workers
	s.mu.RUnlock()
	if n <= 0 {
		return s.auto
	}
	return min(n, s.MaxWorkers())
}

// SetBlocker 接上「AI 根本跑不了」的原因（例如这一档的模型还没下载）：返回非空时 AI 任务一律不领，
// 设置成「一直运行」也一样；任务图标上显示这个原因。必须在 worker 开始前调用
func (s *Service) SetBlocker(f func() string) {
	s.blocker = f
}

// SetLocalActive 接上本机 worker 正在处理几个任务（生成缩略图时 AI 先停）
func (s *Service) SetLocalActive(f func() int) {
	s.localActive = f
}

// Track 包住整个网站：真的在传数据的上传请求（新建、传分片，而且成功了）进行中和结束时记下时间。
// 问进度（HEAD）、取消、被拒绝或出错的请求不算，免得一个反复重试失败的上传让 AI 一直停着
func (s *Service) Track(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		upload := (strings.HasPrefix(r.URL.Path, "/api/uploads/") && (r.Method == http.MethodPost || r.Method == http.MethodPatch)) ||
			(r.Method == http.MethodPost && r.URL.Path == "/api/assets")
		if !upload {
			next.ServeHTTP(w, r)
			return
		}
		s.uploading.Add(1)
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		defer func() {
			s.uploading.Add(-1)
			if rec.status < 300 {
				s.lastUpload.Store(s.now().UnixNano())
			}
		}()
		next.ServeHTTP(rec, r)
	})
}

// statusRecorder 记下回答的状态码；Unwrap 让 http.ResponseController（tus 用它 Flush、设超时）还能找到原来的
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

func (r *statusRecorder) Flush() {
	if f, ok := r.ResponseWriter.(http.Flusher); ok {
		f.Flush()
	}
}

func (r *statusRecorder) Unwrap() http.ResponseWriter { return r.ResponseWriter }

// AllowAI 是 AI 任务现在能不能领；不能时 reason 说为什么（设置页上显示）
func (s *Service) AllowAI() bool {
	ok, _ := s.aiState()
	return ok
}

func (s *Service) aiState() (bool, string) {
	s.mu.RLock()
	cur := s.cur
	s.mu.RUnlock()
	if s.blocker != nil {
		if reason := s.blocker(); reason != "" {
			return false, reason
		}
	}
	if cur.Schedule == "always" {
		return true, ""
	}
	now := s.now()
	if cur.Schedule == "night" && !inWindow(now.Hour(), cur.NightStart, cur.NightEnd) {
		return false, fmt.Sprintf("等到 %d:00 再处理", cur.NightStart)
	}
	if s.uploading.Load() > 0 {
		return false, "有照片正在上传"
	}
	if d := now.Sub(time.Unix(0, s.lastUpload.Load())); d >= 0 && d < uploadQuiet {
		return false, fmt.Sprintf("刚传完照片，%d 秒后开始", int((uploadQuiet-d).Seconds())+1)
	}
	if s.localActive != nil && s.localActive() > 0 {
		return false, "正在生成缩略图"
	}
	return true, ""
}

// inWindow：h 在不在 [start, end) 里，end 比 start 小时跨过零点；两个一样表示全天
func inWindow(h, start, end int) bool {
	switch {
	case start == end:
		return true
	case start < end:
		return h >= start && h < end
	default:
		return h >= start || h < end
	}
}

func normalize(v Settings) Settings {
	if v.Schedule != "always" && v.Schedule != "night" {
		v.Schedule = "idle"
	}
	if v.NightStart < 0 || v.NightStart > 23 {
		v.NightStart = defaults.NightStart
	}
	if v.NightEnd < 0 || v.NightEnd > 23 {
		v.NightEnd = defaults.NightEnd
	}
	v.Workers = max(0, v.Workers)
	return v
}

// Routes：
//
//	GET /api/perf  设置、自动值、这台机器的核数和内存、AI 现在停着没有（为什么）
//	PUT /api/perf  {"schedule": "night", "night_start": 1, "night_end": 7, "workers": 0}（管理员），只改给了的
func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/perf", s.get)
	mux.HandleFunc("PUT /api/perf", s.put)
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	s.mu.RLock()
	cur := s.cur
	s.mu.RUnlock()
	ok, reason := s.aiState()
	httpx.JSON(w, http.StatusOK, map[string]any{
		"settings":     cur,
		"workers":      s.Workers(),
		"workers_auto": s.auto,
		"workers_max":  s.MaxWorkers(),
		"cpus":         s.cpus,
		"memory":       s.memory,
		"ai_running":   ok,
		"ai_paused":    reason,
	})
}

func (s *Service) put(w http.ResponseWriter, r *http.Request) {
	if u := auth.UserFrom(r.Context()); u == nil || !u.IsAdmin {
		httpx.Error(w, http.StatusForbidden, "只有管理员能改性能设置")
		return
	}
	var req struct {
		Schedule   *string `json:"schedule"`
		NightStart *int    `json:"night_start"`
		NightEnd   *int    `json:"night_end"`
		Workers    *int    `json:"workers"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	s.mu.RLock()
	next := s.cur
	s.mu.RUnlock()
	if req.Schedule != nil {
		if *req.Schedule != "idle" && *req.Schedule != "always" && *req.Schedule != "night" {
			httpx.Error(w, http.StatusBadRequest, "schedule 应该是 idle、always 或 night")
			return
		}
		next.Schedule = *req.Schedule
	}
	for _, h := range []struct {
		v   *int
		dst *int
	}{{req.NightStart, &next.NightStart}, {req.NightEnd, &next.NightEnd}} {
		if h.v == nil {
			continue
		}
		if *h.v < 0 || *h.v > 23 {
			httpx.Error(w, http.StatusBadRequest, "时间应该是 0 到 23 点")
			return
		}
		*h.dst = *h.v
	}
	if req.Workers != nil {
		if *req.Workers < 0 || *req.Workers > s.MaxWorkers() {
			httpx.Error(w, http.StatusBadRequest, fmt.Sprintf("同时处理的任务数应该是 0（自动）到 %d", s.MaxWorkers()))
			return
		}
		next.Workers = *req.Workers
	}
	u := auth.UserFrom(r.Context())
	if err := s.store.Set(r.Context(), SettingKey, next, &u.ID); err != nil {
		httpx.InternalError(w, err)
		return
	}
	s.mu.Lock()
	s.cur = next
	s.mu.Unlock()
	s.get(w, r)
}
