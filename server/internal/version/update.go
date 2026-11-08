package version

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// 多久向 GitHub 问一次有没有新版本（没登录的 GitHub 接口一小时只能问 60 次）；点「检查更新」时最快一分钟一次
const (
	cacheFor   = 6 * time.Hour
	minRefresh = time.Minute
)

// Release 是 GitHub 上发布的一个版本：说明是发布时从 CHANGELOG.md 里摘出来的那一段（Markdown）
type Release struct {
	Version     string    `json:"version"`
	Name        string    `json:"name"`
	Notes       string    `json:"notes"`
	URL         string    `json:"url"`
	PublishedAt time.Time `json:"published_at"`
}

// Updates 查 GitHub 上有没有比自己新的版本。repo 是 owner/name，空的时候不检查（WANMORY_UPDATE_REPO=""）
type Updates struct {
	repo    string
	client  *http.Client
	mu      sync.Mutex
	list    []Release
	checked time.Time
	err     error
}

func NewUpdates(repo string) *Updates {
	return &Updates{repo: repo, client: &http.Client{Timeout: 10 * time.Second}}
}

// Routes：
//
//	GET /api/version          {"version": "0.2.1"}，访客也能看（菜单顶上显示）
//	GET /api/system/update    现在的版本、GitHub 上比它新的版本和说明；?refresh=1 马上去问（登录后才能看）
func (u *Updates) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/version", func(w http.ResponseWriter, r *http.Request) {
		httpx.JSON(w, http.StatusOK, map[string]string{"version": Version})
	})
	mux.HandleFunc("GET /api/system/update", u.status)
}

func (u *Updates) status(w http.ResponseWriter, r *http.Request) {
	if auth.UserFrom(r.Context()) == nil {
		httpx.Error(w, http.StatusUnauthorized, "请先登录")
		return
	}
	resp := map[string]any{"current": Version, "repo": u.repo, "releases": []Release{}, "update_available": false}
	if u.repo == "" {
		resp["error"] = "没有开检查更新（WANMORY_UPDATE_REPO 是空的）"
		httpx.JSON(w, http.StatusOK, resp)
		return
	}
	list, checked, err := u.get(r.Context(), r.URL.Query().Get("refresh") == "1")
	if err != nil {
		resp["error"] = "连不上 GitHub，检查不了更新：" + err.Error()
	}
	if !checked.IsZero() {
		resp["checked_at"] = checked
	}
	if len(list) > 0 {
		resp["latest"] = list[0]
	}
	// 比现在新的那几版，新的在前：跳了好几版时每一版的说明都看得到
	newer := []Release{}
	for _, rel := range list {
		if Newer(rel.Version, Version) {
			newer = append(newer, rel)
		}
	}
	resp["releases"] = newer
	resp["update_available"] = len(newer) > 0 && Version != "dev"
	httpx.JSON(w, http.StatusOK, resp)
}

// get 返回缓存的版本列表，过期了（或者要刷新、离上次超过一分钟）再去 GitHub 问
func (u *Updates) get(ctx context.Context, refresh bool) ([]Release, time.Time, error) {
	u.mu.Lock()
	defer u.mu.Unlock()
	age := time.Since(u.checked)
	if !u.checked.IsZero() && age < cacheFor && (!refresh || age < minRefresh) {
		return u.list, u.checked, u.err
	}
	list, err := u.fetch(ctx)
	u.checked = time.Now()
	u.err = err
	if err == nil {
		u.list = list
	}
	return u.list, u.checked, err
}

func (u *Updates) fetch(ctx context.Context) ([]Release, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		"https://api.github.com/repos/"+u.repo+"/releases?per_page=20", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "wanmory/"+Version)
	res, err := u.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GitHub 回答 %d", res.StatusCode)
	}
	var raw []struct {
		TagName     string    `json:"tag_name"`
		Name        string    `json:"name"`
		Body        string    `json:"body"`
		HTMLURL     string    `json:"html_url"`
		Draft       bool      `json:"draft"`
		Prerelease  bool      `json:"prerelease"`
		PublishedAt time.Time `json:"published_at"`
	}
	if err := json.NewDecoder(res.Body).Decode(&raw); err != nil {
		return nil, err
	}
	list := []Release{}
	for _, r := range raw {
		v := strings.TrimPrefix(r.TagName, "v")
		if r.Draft || r.Prerelease {
			continue
		}
		if _, ok := parse(v); !ok {
			continue
		}
		list = append(list, Release{Version: v, Name: r.Name, Notes: r.Body, URL: r.HTMLURL, PublishedAt: r.PublishedAt})
	}
	// 按版本号排，新的在前（GitHub 按发布时间排，补发旧版本时会乱）
	for i := 1; i < len(list); i++ {
		for j := i; j > 0 && Newer(list[j].Version, list[j-1].Version); j-- {
			list[j], list[j-1] = list[j-1], list[j]
		}
	}
	return list, nil
}
