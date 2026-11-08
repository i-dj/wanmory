package ai

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
	"github.com/wanmory/wanmory/server/internal/settings"
)

// SettingEndpoint 是网页设置里选的 AI 服务地址（见 Endpoint），存在 settings 表里。
// 不在设置项登记表里，令牌不会从 /api/settings 读出去
const SettingEndpoint = "ai.endpoint"

// Endpoint 是用哪个 AI 服务：builtin 是内置的（和相册一起用 Docker Compose 启动的容器，地址是 WANMORY_ML_URL，
// 只在 Docker 内部网络里，只有后端能连）；remote 是单独启动的（这台电脑上直接跑的 Python，或者家里另一台带显卡的电脑），
// 要填地址，最好也设令牌（AI 服务的 WANMORY_ML_TOKEN）。两个可以同时开着，设置里选用哪个
type Endpoint struct {
	Mode  string `json:"mode"` // builtin / remote（以前存的 local 当 builtin）
	URL   string `json:"url"`
	Token string `json:"token,omitempty"`
}

// Admin 是网页设置里「AI 服务」那一块的接口：换地址、选 GPU 还是 CPU、下载模型。
// 这些都转给 AI 服务（见 ml/wanmory_ml/app.py 的 /config、/models、/stats），后端只记地址
// SettingTier 是设置里选的档位（quality / balanced / lite），决定人脸和语义搜索用哪个模型（见 Tiers）。
// 没选过时用启动时的 WANMORY_FACE_MODEL、WANMORY_CLIP_MODEL
const SettingTier = "ai.tier"

// Tier 是一档的模型组合
type Tier struct {
	Face string `json:"face"`
	Clip string `json:"clip"`
}

// Tiers：高精度适合 Apple 芯片 Mac、NVIDIA 显卡；均衡适合 Intel i5 级别的 NAS；轻量适合 N100、树莓派 5
var Tiers = map[string]Tier{
	"quality":  {Face: "antelopev2", Clip: "chinese-clip-vit-h-14"},
	"balanced": {Face: "antelopev2", Clip: "chinese-clip-vit-l-14"},
	"lite":     {Face: "buffalo_l", Clip: "chinese-clip-vit-b-16"},
}

// Switcher 换模型：人脸、语义搜索的服务换成新模型，给要重新处理的照片排上任务
type Switcher func(ctx context.Context, t Tier) error

// Reprocess 是换了模型后重新处理到哪了：face、clip → 算完多少张、一共多少张
type Reprocess func(ctx context.Context) (map[string][2]int, error)

type Admin struct {
	mu         sync.Mutex
	inUse      Tier // 后端现在用的模型
	switcher   Switcher
	reprocess  Reprocess
	client     *Client
	store      *settings.Store
	localURL   string // 本机的地址
	localToken string // 本机的令牌（环境变量里的，一般为空）
	parallel   atomic.Int32 // AI 服务同时算几张照片（它按显卡、核数、内存自动定，设置里能改），没问到时是 1
}

// NewAdmin：faceModel、clipModel 是启动时环境变量里的模型，设置里没选过档位时用
func NewAdmin(client *Client, store *settings.Store, localURL, localToken, faceModel, clipModel string) *Admin {
	a := &Admin{client: client, store: store, localURL: localURL, localToken: localToken,
		inUse: Tier{Face: faceModel, Clip: clipModel}}
	a.parallel.Store(1)
	return a
}

// MaxConcurrency 是给 AI 服务同时发请求数的上限（AI 任务的 worker 开这么多路）
const MaxConcurrency = 4

// Concurrency 是现在同时给 AI 服务发几个请求：它同时算几张就发几张，再多一张在路上（传图片的时候它在算上一张）
func (a *Admin) Concurrency() int {
	return min(MaxConcurrency, int(a.parallel.Load())+1)
}

// Watch 每分钟问一次 AI 服务同时算几张（换了 AI 服务、设置里改了都跟上），直到 ctx 结束
func (a *Admin) Watch(ctx context.Context) {
	for {
		cctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		var cfg json.RawMessage
		if err := a.client.Call(cctx, http.MethodGet, "/config", nil, &cfg); err == nil {
			a.noteConfig(cfg)
		}
		cancel()
		select {
		case <-ctx.Done():
			return
		case <-time.After(time.Minute):
		}
	}
}

// noteConfig 从 AI 服务的 /config 里记下同时算几张（parallel 是设置的，0 是自动，用 parallel_auto）
func (a *Admin) noteConfig(raw json.RawMessage) {
	var c struct {
		Parallel     int `json:"parallel"`
		ParallelAuto int `json:"parallel_auto"`
	}
	if json.Unmarshal(raw, &c) != nil {
		return
	}
	n := c.Parallel
	if n <= 0 {
		n = c.ParallelAuto
	}
	a.parallel.Store(int32(max(1, n))) // 旧版本的 AI 服务没有这两个：1
}

// Models 是现在该用的模型：设置里选了档位就是那一档的，不然是启动时的。人脸、语义搜索的服务用它启动
func (a *Admin) Models(ctx context.Context) (Tier, error) {
	tier, err := settings.GetOr(ctx, a.store, SettingTier, "")
	a.mu.Lock()
	defer a.mu.Unlock()
	if t, ok := Tiers[tier]; ok && err == nil {
		a.inUse = t
	}
	return a.inUse, err
}

// OnSwitch 接上换档位时要做的事（人脸、语义搜索的服务建好之后）
func (a *Admin) OnSwitch(s Switcher, r Reprocess) {
	a.switcher, a.reprocess = s, r
}

func (a *Admin) models() Tier {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.inUse
}

// tierOf 是一组模型对应哪一档，对不上任何一档时是 custom（环境变量里配的别的组合）
func tierOf(t Tier) string {
	for name, m := range Tiers {
		if m == t {
			return name
		}
	}
	return "custom"
}

// Load 读出设置里的地址，让 client 连过去；启动时调用
func (a *Admin) Load(ctx context.Context) error {
	ep, err := a.endpoint(ctx)
	if err != nil {
		return err
	}
	a.apply(ep)
	return nil
}

func (a *Admin) endpoint(ctx context.Context) (Endpoint, error) {
	ep, err := settings.GetOr(ctx, a.store, SettingEndpoint, Endpoint{Mode: "builtin"})
	if ep.Mode != "remote" {
		ep.Mode = "builtin"
	}
	return ep, err
}

// apply 之后的请求都发到 ep
func (a *Admin) apply(ep Endpoint) {
	if ep.Mode == "remote" {
		a.client.SetEndpoint(ep.URL, ep.Token)
	} else {
		a.client.SetEndpoint(a.localURL, a.localToken)
	}
}

// Routes：
//
//	GET  /api/ai/status                 地址、连上了没有、版本、用 GPU 还是 CPU、模型（下载了没有、下载进度、现在用的哪个）、最近的耗时
//	PUT  /api/ai/endpoint               {"mode": "builtin"} 或 {"mode": "remote", "url": "http://192.168.1.20:3003", "token": "..."}（管理员）
//	PUT  /api/ai/device                 {"device": "auto" | "gpu" | "cpu"}（管理员）
//	PUT  /api/ai/threads                {"threads": 2} 用 CPU 算时每个模型几个线程，0 是自动（核数减一）（管理员）
//	PUT  /api/ai/parallel               {"parallel": 2} 同时算几张照片，0 是自动（管理员）
//	PUT  /api/ai/source                 {"source": "auto" | "huggingface" | "mirror"} 模型从哪下载（管理员）
//	PUT  /api/ai/tier                   {"tier": "quality" | "balanced" | "lite"} 换档位，所有照片按新模型重新处理（管理员）
//	POST /api/ai/models/{id}/download   在 AI 服务上下载模型（管理员）
func (a *Admin) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/ai/status", a.status)
	mux.HandleFunc("PUT /api/ai/endpoint", admin(a.setEndpoint))
	mux.HandleFunc("PUT /api/ai/device", admin(a.setDevice))
	mux.HandleFunc("PUT /api/ai/tier", admin(a.setTier))
	mux.HandleFunc("PUT /api/ai/source", admin(a.setSource))
	mux.HandleFunc("PUT /api/ai/threads", admin(a.setThreads))
	mux.HandleFunc("PUT /api/ai/parallel", admin(a.setParallel))
	mux.HandleFunc("POST /api/ai/models/{id}/download", admin(a.download))
}

func admin(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if u := auth.UserFrom(r.Context()); u == nil || !u.IsAdmin {
			httpx.Error(w, http.StatusForbidden, "只有管理员能改 AI 服务的设置")
			return
		}
		h(w, r)
	}
}

func (a *Admin) status(w http.ResponseWriter, r *http.Request) {
	ep, err := a.endpoint(r.Context())
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	resp := map[string]any{
		"endpoint": map[string]any{
			"mode": ep.Mode, "url": a.client.URL(), "builtin_url": a.localURL, "remote_url": ep.URL, "has_token": ep.Token != "",
		},
		// 两个都看一下在不在（不管现在用的是哪个），设置页上两个选项旁边都能显示
		"services":  a.probe(r.Context(), ep),
		"connected": false,
		"in_use":    a.models(),
		"tier":      tierOf(a.models()),
	}
	if a.reprocess != nil {
		if p, err := a.reprocess(r.Context()); err == nil {
			resp["reprocess"] = p
		}
	}
	// AI 服务连不上时别让设置页一直转圈
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	health, err := a.client.Health(ctx)
	if err != nil {
		resp["error"] = err.Error()
		httpx.JSON(w, http.StatusOK, resp)
		return
	}
	resp["connected"] = true
	resp["health"] = health
	var config, models, stats json.RawMessage
	for path, dst := range map[string]*json.RawMessage{"/config": &config, "/models": &models, "/stats": &stats} {
		if err := a.client.Call(ctx, http.MethodGet, path, nil, dst); err != nil {
			// 旧版本的 AI 服务没有这几个接口：照样显示连上了，只是不能选 GPU、下载
			resp["error"] = "AI 服务版本太旧，更新后才能在这里设置：" + err.Error()
		}
	}
	resp["config"], resp["models"], resp["stats"] = config, models, stats
	if config != nil {
		a.noteConfig(config)
	}
	httpx.JSON(w, http.StatusOK, resp)
}

// probe 同时看内置和远程的 AI 服务在不在：在的话是版本号，不在是空的
func (a *Admin) probe(ctx context.Context, ep Endpoint) map[string]any {
	type result struct {
		name    string
		version string
	}
	check := func(name, base, token string, out chan<- result) {
		if base == "" {
			out <- result{name: name}
			return
		}
		cctx, cancel := context.WithTimeout(ctx, 2*time.Second)
		defer cancel()
		h, err := NewClient(base, token).Health(cctx)
		if err != nil {
			out <- result{name: name}
			return
		}
		out <- result{name, h.Version}
	}
	out := make(chan result, 2)
	go check("builtin", a.localURL, a.localToken, out)
	go check("remote", ep.URL, ep.Token, out)
	res := map[string]any{}
	for range 2 {
		r := <-out
		res[r.name] = map[string]any{"up": r.version != "", "version": r.version}
	}
	return res
}

func (a *Admin) setEndpoint(w http.ResponseWriter, r *http.Request) {
	var req Endpoint
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<14)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	switch req.Mode {
	case "builtin", "local":
		// 远程的地址、令牌留着，切回来不用再填，也能一直看着它在不在
		old, _ := a.endpoint(r.Context())
		req = Endpoint{Mode: "builtin", URL: old.URL, Token: old.Token}
	case "remote":
		req.URL = strings.TrimRight(strings.TrimSpace(req.URL), "/")
		if u, err := url.Parse(req.URL); err != nil || (u.Scheme != "http" && u.Scheme != "https") || u.Host == "" {
			httpx.Error(w, http.StatusBadRequest, "地址要像 http://192.168.1.20:3003 这样")
			return
		}
		if req.Token == "" { // 没填令牌：沿用原来的（网页上不显示已经存的令牌）
			if old, err := a.endpoint(r.Context()); err == nil && old.Mode == "remote" {
				req.Token = old.Token
			}
		}
	default:
		httpx.Error(w, http.StatusBadRequest, "mode 应该是 builtin 或 remote")
		return
	}
	if err := a.store.Set(r.Context(), SettingEndpoint, req, nil); err != nil {
		httpx.InternalError(w, err)
		return
	}
	a.apply(req)
	a.status(w, r)
}

func (a *Admin) setDevice(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Device string `json:"device"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if !a.forward(w, r, http.MethodPut, "/config", req) {
		return
	}
	a.status(w, r)
}

func (a *Admin) setSource(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Source string `json:"source"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if !a.forward(w, r, http.MethodPut, "/config", req) {
		return
	}
	a.status(w, r)
}

func (a *Admin) setThreads(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Threads *int `json:"threads"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&req); err != nil || req.Threads == nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if !a.forward(w, r, http.MethodPut, "/config", req) {
		return
	}
	a.status(w, r)
}

func (a *Admin) setParallel(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Parallel *int `json:"parallel"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&req); err != nil || req.Parallel == nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if !a.forward(w, r, http.MethodPut, "/config", req) {
		return
	}
	a.status(w, r)
}

func (a *Admin) setTier(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Tier string `json:"tier"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	t, ok := Tiers[req.Tier]
	if !ok {
		httpx.Error(w, http.StatusBadRequest, "tier 应该是 quality、balanced 或 lite")
		return
	}
	if a.switcher == nil {
		httpx.Error(w, http.StatusServiceUnavailable, "还没准备好，稍后再试")
		return
	}
	if err := a.store.Set(r.Context(), SettingTier, req.Tier, nil); err != nil {
		httpx.InternalError(w, err)
		return
	}
	if t != a.models() {
		if err := a.switcher(r.Context(), t); err != nil {
			httpx.InternalError(w, err)
			return
		}
		a.mu.Lock()
		a.inUse = t
		a.mu.Unlock()
		// 先在 AI 服务上开始下载新模型（已经有的跳过），不等第一个任务来了才下
		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()
		for _, m := range []string{t.Face, t.Clip} {
			_ = a.client.Call(ctx, http.MethodPost, "/models/"+url.PathEscape(m)+"/download", nil, nil)
		}
	}
	a.status(w, r)
}

func (a *Admin) download(w http.ResponseWriter, r *http.Request) {
	if !a.forward(w, r, http.MethodPost, "/models/"+url.PathEscape(r.PathValue("id"))+"/download", nil) {
		return
	}
	a.status(w, r)
}

// forward 把请求转给 AI 服务，出错时回答网页（连不上是 502），成功返回 true
func (a *Admin) forward(w http.ResponseWriter, r *http.Request, method, path string, body any) bool {
	ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
	defer cancel()
	var out json.RawMessage
	err := a.client.Call(ctx, method, path, body, &out)
	if errors.Is(err, ErrUnavailable) {
		httpx.Error(w, http.StatusBadGateway, "连不上 AI 服务："+err.Error())
		return false
	}
	if err != nil {
		httpx.Error(w, http.StatusBadGateway, err.Error())
		return false
	}
	return true
}
