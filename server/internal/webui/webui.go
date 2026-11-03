// Package webui 把前端打包结果（web/dist）嵌进 Go 程序，由后端直接提供网页，部署时不需要 Node。
//
// make web 会把 web/dist 复制到这里的 dist/，然后再编译 Go。dist/ 里只有 .gitkeep 时，
// 程序照样能编译和运行，只是访问网页会提示先构建前端。
package webui

import (
	"embed"
	"io/fs"
	"net/http"
	"path"
	"strings"
)

//go:embed all:dist
var embedded embed.FS

// Handler 提供前端页面。找不到的路径一律返回 index.html，交给前端路由处理；
// /api/ 开头的路径不会走到这里（没匹配上的 API 返回 404）。
func Handler() http.Handler {
	dist, err := fs.Sub(embedded, "dist")
	if err != nil {
		panic(err)
	}
	index, err := fs.ReadFile(dist, "index.html")
	if err != nil {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			http.Error(w, "前端还没有构建：先运行 make web，再重新编译后端", http.StatusServiceUnavailable)
		})
	}
	files := http.FileServerFS(dist)

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}

		name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if name != "" && name != "index.html" {
			if st, err := fs.Stat(dist, name); err == nil && !st.IsDir() {
				// Vite 打包出来的 assets/ 文件名带内容哈希，内容变了文件名就变，可以永久缓存
				if strings.HasPrefix(name, "assets/") {
					w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
				}
				files.ServeHTTP(w, r)
				return
			}
		}

		// index.html 不缓存，这样前端更新后刷新页面就能拿到新版本
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.Write(index)
	})
}
