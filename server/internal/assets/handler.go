package assets

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/auth"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

// storeError：搜索要用的 AI 服务没准备好时回 503 和原因，网页上直接显示；其他是内部错误
func storeError(w http.ResponseWriter, err error) {
	if errors.Is(err, ErrSearchUnavailable) {
		httpx.Error(w, http.StatusServiceUnavailable, ErrSearchUnavailable.Error())
		return
	}
	httpx.InternalError(w, err)
}

// summary 返回一个分类的概要：GET /api/assets/summary，筛选参数和 list 一样。
func (s *Service) summary(w http.ResponseWriter, r *http.Request) {
	f, err := ParseFilter(r.URL.Query())
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	f.User = auth.UserID(r.Context())
	sum, err := s.store.Summary(r.Context(), f)
	if err != nil {
		storeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, sum)
}

// dates 按年、月或日统计照片数，给网页的日历用：GET /api/assets/dates?unit=year|month|day&tz=Asia/Shanghai，
// 分类筛选参数和 list 一样（from / to 不起作用，日历要显示整个分类）。返回 [{date, count}]，从新到旧。
func (s *Service) dates(w http.ResponseWriter, r *http.Request) {
	f, err := ParseFilter(r.URL.Query())
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	f.User = auth.UserID(r.Context())
	f.From, f.To = nil, nil
	tz := r.URL.Query().Get("tz")
	if tz == "" {
		tz = "UTC"
	}
	// 先在 Go 里检查时区名，不认识的直接报 400，不让它变成数据库错误（"Local" 数据库不认识）
	if _, err := time.LoadLocation(tz); err != nil || tz == "Local" {
		httpx.Error(w, http.StatusBadRequest, "不认识的时区: "+tz)
		return
	}
	unit := DateUnit(r.URL.Query().Get("unit"))
	if _, ok := dateFormats[unit]; !ok {
		httpx.Error(w, http.StatusBadRequest, "unit 应该是 year、month 或 day")
		return
	}
	list, err := s.store.DateCounts(r.Context(), f, unit, tz)
	if err != nil {
		storeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

// changeOverlap 是增量刷新时往回多看的时间。updated_at 记的是事务开始的时间，
// 一个事务开始得早、提交得晚，它的修改可能落在上次的 server_time 之前，往回多看一点就不会漏，重复的网页会去重。
const changeOverlap = 5 * time.Second

// list 分页返回照片：GET /api/assets?limit=200&cursor=...，
// 筛选参数 view=recent（按上传时间）、favorite=true、rating=1..5。
// 返回 {items, next_cursor, server_time}；next_cursor 为空表示没有更多了，
// server_time 给之后的 GET /api/assets/changes?since=... 用。
func (s *Service) list(w http.ResponseWriter, r *http.Request) {
	limit := queryInt(r, "limit", 200, 1, 1000)
	f, err := ParseFilter(r.URL.Query())
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	f.User = auth.UserID(r.Context())
	var after *Cursor
	if v := r.URL.Query().Get("cursor"); v != "" {
		c, err := ParseCursor(v)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, "cursor 格式不对")
			return
		}
		after = &c
	}
	now, err := s.store.Now(r.Context())
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	list, next, err := s.store.Page(r.Context(), f, after, limit)
	if err != nil {
		storeError(w, err)
		return
	}
	resp := map[string]any{"items": list, "next_cursor": nil, "server_time": now.Add(-changeOverlap)}
	if next != nil {
		resp["next_cursor"] = next.Encode()
	}
	httpx.JSON(w, http.StatusOK, resp)
}

// changes 返回 since 之后新增或变化过的照片：GET /api/assets/changes?since=<上次的 server_time>
// 带 album=<相册 ID> 时只返回这个相册里的（看相册时用，新放进相册的照片也算变化）。
// 返回 {items, server_time, more}；more 为 true 表示变化太多没返回完，网页应该重新加载列表。
func (s *Service) changes(w http.ResponseWriter, r *http.Request) {
	since, err := time.Parse(time.RFC3339Nano, r.URL.Query().Get("since"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "since 应该是 RFC 3339 时间")
		return
	}
	var album *uuid.UUID
	if v := r.URL.Query().Get("album"); v != "" {
		id, err := uuid.Parse(v)
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, "album 应该是相册 ID")
			return
		}
		album = &id
	}
	now, err := s.store.Now(r.Context())
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	const max = 1000
	list, err := s.store.ChangedSince(r.Context(), auth.UserID(r.Context()), since, album, max+1)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	more := len(list) > max
	if more {
		list = list[:max]
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"items": list, "server_time": now.Add(-changeOverlap), "more": more})
}

// DiskUsage 是存照片的那块磁盘：总容量和还能用的空间（字节）
type DiskUsage struct {
	Total uint64 `json:"total"`
	Free  uint64 `json:"free"`
}

func (s *Service) stats(w http.ResponseWriter, r *http.Request) {
	st, err := s.store.Stats(r.Context(), auth.UserID(r.Context()))
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	resp := struct {
		Stats
		Disk *DiskUsage `json:"disk,omitempty"` // 访客、读不到时没有
	}{Stats: st}
	// 存储空间只给登录的人看（访客看不到服务器的磁盘）
	if auth.UserID(r.Context()) != uuid.Nil {
		if dir, err := s.uploadDir(r.Context()); err == nil {
			resp.Disk, _ = diskUsage(dir)
		}
	}
	httpx.JSON(w, http.StatusOK, resp)
}

// update 修改照片：PATCH /api/assets/{id}，只改带了的字段，返回修改后的照片。
// 收藏和星级 {"favorite": true, "rating": 4}；信息栏里的说明、拍摄时间、位置、还原见 infoRequest，例如
// {"description": "第一次去海边", "taken_at": {"local": "2026-10-27T13:01:23", "offset": "-04:00"},
// "location": {"latitude": 28.35, "longitude": -81.56}, "reset": ["location"]}。
func (s *Service) update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "照片 ID 格式不对")
		return
	}
	var req struct {
		Favorite *bool `json:"favorite"`
		Rating   *int  `json:"rating"`
		infoRequest
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 32<<10)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if req.Rating != nil && (*req.Rating < 0 || *req.Rating > 5) {
		httpx.Error(w, http.StatusBadRequest, "星级应该是 0 到 5")
		return
	}
	info, err := req.patch()
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	defer s.KickHiddenSync() // 收藏、星级、时间等变了，私有智能相册的「同时隐藏」可能要跟着变
	if req.Favorite != nil || req.Rating != nil {
		err = s.store.UpdateMarks(r.Context(), id, req.Favorite, req.Rating)
	}
	if err == nil && !info.empty() {
		err = s.store.UpdateInfo(r.Context(), id, info)
	}
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, err.Error())
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	s.get(w, r)
}

func (s *Service) get(w http.ResponseWriter, r *http.Request) {
	a, ok := s.loadAsset(w, r)
	if !ok {
		return
	}
	httpx.JSON(w, http.StatusOK, a)
}

type fileKind int

const (
	fileThumbnail fileKind = iota
	filePreview
	fileOriginal
)

// serveFile 返回照片的某个文件。http.ServeFile 会处理缓存头和 Range 请求，视频可以拖动进度。
func (s *Service) serveFile(kind fileKind) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		a, ok := s.loadAsset(w, r)
		if !ok {
			return
		}
		var path *string
		switch kind {
		case fileThumbnail:
			path = a.ThumbnailPath
		case filePreview:
			path = a.PreviewPath
		case fileOriginal:
			path = &a.OriginalPath
		}
		if path == nil {
			httpx.Error(w, http.StatusNotFound, "文件还没有生成")
			return
		}
		if kind != fileOriginal {
			// 缩略图和预览图生成后基本不变，让浏览器缓存一天
			w.Header().Set("Cache-Control", "private, max-age=86400")
		}
		http.ServeFile(w, r, *path)
	}
}

func (s *Service) loadAsset(w http.ResponseWriter, r *http.Request) (*Asset, bool) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "照片 ID 格式不对")
		return nil, false
	}
	a, err := s.store.Get(r.Context(), id)
	if errors.Is(err, ErrNotFound) {
		httpx.Error(w, http.StatusNotFound, err.Error())
		return nil, false
	}
	if err != nil {
		httpx.InternalError(w, err)
		return nil, false
	}
	return a, true
}

// queryInt 读取整数查询参数，没有或格式不对时用 def，并限制在 [lo, hi] 之间。
func queryInt(r *http.Request, key string, def, lo, hi int) int {
	v, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil {
		return def
	}
	return max(lo, min(v, hi))
}
