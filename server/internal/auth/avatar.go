package auth

import (
	"bytes"
	"fmt"
	"image"
	_ "image/jpeg" // 认得 JPEG
	_ "image/png"  // 认得 PNG
	"io"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// 头像除了选一张照片（avatar_id），还可以选卡通头像，或者上传一张图片（网页上裁成正方形、缩到 512 像素再传上来）：
//
//	PUT /api/auth/avatar        {"asset_id": "..."} 用照片；{"cartoon": "fox"} 用卡通头像；{} 不要头像（显示名字的第一个字）
//	PUT /api/auth/avatar/image  请求体是裁好的 JPEG / PNG 图片
//	GET /api/users/{id}/avatar  上传的头像图片

// Cartoons 是能选的卡通头像（网页上的样子在 web/src/components/ui/cartoonAvatars.tsx，名字要一致）
var Cartoons = []string{"cat", "dog", "bear", "rabbit", "panda", "fox", "koala", "tiger", "pig", "frog", "penguin", "owl"}

const maxAvatarBytes = 3 << 20

// SetAvatarDir 设上传的头像存在哪个目录（数据目录下的 avatars）
func (s *Service) SetAvatarDir(dir string) { s.avatarDir = dir }

func (s *Service) avatarPath(id uuid.UUID) string {
	return filepath.Join(s.avatarDir, id.String()+".jpg")
}

// removeAvatarFile 换成别的头像时删掉上传过的图片（没有就算了）
func (s *Service) removeAvatarFile(id uuid.UUID) {
	if s.avatarDir != "" {
		_ = os.Remove(s.avatarPath(id))
	}
}

// setCartoon 用卡通头像
func (s *Service) setCartoon(w http.ResponseWriter, r *http.Request, u *User, name string) {
	if !slices.Contains(Cartoons, name) {
		httpx.Error(w, http.StatusBadRequest, "没有这个卡通头像")
		return
	}
	style := "cartoon:" + name
	if _, err := s.db.ExecContext(r.Context(), `UPDATE users SET avatar_style = $2, avatar_id = NULL WHERE id = $1`, u.ID, style); err != nil {
		httpx.InternalError(w, err)
		return
	}
	s.removeAvatarFile(u.ID)
	updated := *u
	updated.Avatar, updated.AvatarStyle = nil, style
	httpx.JSON(w, http.StatusOK, map[string]any{"user": updated})
}

// uploadAvatar：PUT /api/auth/avatar/image，存下裁好的头像图片（只认 JPEG、PNG，最大 3 MB）
func (s *Service) uploadAvatar(w http.ResponseWriter, r *http.Request) {
	u := UserFrom(r.Context())
	if u == nil {
		httpx.Error(w, http.StatusUnauthorized, "还没登录")
		return
	}
	data, err := io.ReadAll(http.MaxBytesReader(w, r.Body, maxAvatarBytes))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "图片太大了，最大 3 MB")
		return
	}
	cfg, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil || (format != "jpeg" && format != "png") {
		httpx.Error(w, http.StatusBadRequest, "只能用 JPEG 或 PNG 图片")
		return
	}
	if cfg.Width < 32 || cfg.Height < 32 || cfg.Width > 4096 || cfg.Height > 4096 {
		httpx.Error(w, http.StatusBadRequest, "图片尺寸不合适")
		return
	}
	if err := os.MkdirAll(s.avatarDir, 0o755); err != nil {
		httpx.InternalError(w, err)
		return
	}
	tmp := s.avatarPath(u.ID) + ".tmp"
	if err := os.WriteFile(tmp, data, 0o644); err != nil {
		httpx.InternalError(w, err)
		return
	}
	if err := os.Rename(tmp, s.avatarPath(u.ID)); err != nil {
		httpx.InternalError(w, err)
		return
	}
	style := fmt.Sprintf("file:%d", time.Now().Unix()) // 时间写进去，网页的图片地址跟着变，不会显示缓存里的旧头像
	if _, err := s.db.ExecContext(r.Context(), `UPDATE users SET avatar_style = $2, avatar_id = NULL WHERE id = $1`, u.ID, style); err != nil {
		httpx.InternalError(w, err)
		return
	}
	updated := *u
	updated.Avatar, updated.AvatarStyle = nil, style
	httpx.JSON(w, http.StatusOK, map[string]any{"user": updated})
}

// serveAvatar：GET /api/users/{id}/avatar，上传的头像图片（地址里带上传时间，可以一直缓存）
func (s *Service) serveAvatar(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "成员 ID 格式不对")
		return
	}
	var style string
	if err := s.db.QueryRowContext(r.Context(), `SELECT avatar_style FROM users WHERE id = $1`, id).Scan(&style); err != nil || !strings.HasPrefix(style, "file:") {
		httpx.Error(w, http.StatusNotFound, "没有上传头像")
		return
	}
	w.Header().Set("Cache-Control", "private, max-age=31536000, immutable")
	http.ServeFile(w, r, s.avatarPath(id))
}
