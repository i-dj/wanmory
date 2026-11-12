package storage

import (
	"encoding/json"
	"errors"
	"io/fs"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

type Handler struct {
	roots Roots
}

func NewHandler(roots Roots) *Handler {
	return &Handler{roots: roots}
}

func (h *Handler) Routes(mux *http.ServeMux) {
	// 浏览、新建服务器上的目录（选上传目录用）：只有管理员
	mux.HandleFunc("GET /api/storage/dirs", auth.AdminOnly(h.listDirs))
	mux.HandleFunc("POST /api/storage/dirs", auth.AdminOnly(h.createDir))
}

type dirEntry struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

type dirListing struct {
	Path   string     `json:"path"`   // 空字符串表示根目录列表
	Parent *string    `json:"parent"` // 上一级；为空表示已经在根目录列表
	Dirs   []dirEntry `json:"dirs"`
}

// listDirs 列出 path 下的子目录（不含隐藏目录）；不带 path 时列出所有根目录。
func (h *Handler) listDirs(w http.ResponseWriter, r *http.Request) {
	p := r.URL.Query().Get("path")
	if p == "" {
		list := dirListing{Dirs: []dirEntry{}}
		for _, root := range h.roots {
			list.Dirs = append(list.Dirs, dirEntry{Name: root, Path: root})
		}
		httpx.JSON(w, http.StatusOK, list)
		return
	}

	real, ok := h.resolve(w, p)
	if !ok {
		return
	}
	entries, err := os.ReadDir(real)
	if err != nil {
		writeFSError(w, err)
		return
	}

	list := dirListing{Path: real, Dirs: []dirEntry{}}
	parent := ""
	if !h.roots.IsRoot(real) {
		parent = filepath.Dir(real)
	}
	list.Parent = &parent
	for _, e := range entries {
		if e.IsDir() && !strings.HasPrefix(e.Name(), ".") {
			list.Dirs = append(list.Dirs, dirEntry{Name: e.Name(), Path: filepath.Join(real, e.Name())})
		}
	}
	httpx.JSON(w, http.StatusOK, list)
}

// createDir 在 parent 下新建名为 name 的文件夹。
func (h *Handler) createDir(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Parent string `json:"parent"`
		Name   string `json:"name"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	name := strings.TrimSpace(req.Name)
	if name == "" || name == "." || name == ".." || strings.ContainsAny(name, `/\`) || len(name) > 255 {
		httpx.Error(w, http.StatusBadRequest, "文件夹名称不合法")
		return
	}

	parent, ok := h.resolve(w, req.Parent)
	if !ok {
		return
	}
	dir := filepath.Join(parent, name)
	if err := os.Mkdir(dir, 0o755); err != nil {
		if errors.Is(err, fs.ErrExist) {
			httpx.Error(w, http.StatusConflict, "已经有同名的文件夹")
			return
		}
		writeFSError(w, err)
		return
	}
	httpx.JSON(w, http.StatusCreated, dirEntry{Name: name, Path: dir})
}

func (h *Handler) resolve(w http.ResponseWriter, p string) (string, bool) {
	real, err := h.roots.Resolve(p)
	if errors.Is(err, ErrOutside) {
		httpx.Error(w, http.StatusForbidden, err.Error())
		return "", false
	}
	if err != nil {
		writeFSError(w, err)
		return "", false
	}
	return real, true
}

func writeFSError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, fs.ErrNotExist):
		httpx.Error(w, http.StatusNotFound, "目录不存在")
	case errors.Is(err, fs.ErrPermission):
		httpx.Error(w, http.StatusForbidden, "没有权限访问这个目录")
	default:
		httpx.InternalError(w, err)
	}
}
