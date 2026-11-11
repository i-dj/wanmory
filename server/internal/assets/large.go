package assets

import (
	"errors"
	"io/fs"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

// largeSize 是精选轮播用的大图：长边 2560 像素。轮播在电脑上有一千多像素宽，Retina 屏上实际要两千多像素，
// 1440 的预览图放上去会糊。只有上了轮播的照片才生成（第一次要的时候），不给所有照片都生成，省空间、省时间
const largeSize = 2560

var largeMu sync.Mutex // 同一时间只生成一张，几张一起要时排队，不会把树莓派的内存撑爆

// largePath 是大图存在哪：和预览图放在一起，thumbs/ab/<id>-large.jpeg
func largePath(preview string) string {
	return strings.TrimSuffix(preview, "-preview.jpeg") + "-large.jpeg"
}

// serveLarge：GET /api/assets/{id}/large，精选轮播用的 2560 像素大图。没生成过就当场从原图生成，存下来下次直接用；
// 原图比 2560 小、视频、生成失败时退回预览图
func (s *Service) serveLarge(w http.ResponseWriter, r *http.Request) {
	a, ok := s.loadAsset(w, r)
	if !ok {
		return
	}
	if a.PreviewPath == nil {
		httpx.Error(w, http.StatusNotFound, "文件还没有生成")
		return
	}
	w.Header().Set("Cache-Control", "private, max-age=86400")
	small := a.Width != nil && a.Height != nil && max(*a.Width, *a.Height) <= previewSize
	if a.Type != TypeImage || small {
		http.ServeFile(w, r, *a.PreviewPath)
		return
	}
	dest := largePath(*a.PreviewPath)
	if _, err := os.Stat(dest); err == nil {
		http.ServeFile(w, r, dest)
		return
	}
	largeMu.Lock()
	err := s.makeLarge(r, a, dest)
	largeMu.Unlock()
	if err != nil {
		log.Printf("assets: 生成 %s 的大图失败，先用预览图: %v", a.ID, err)
		w.Header().Set("Cache-Control", "no-store") // 退回的预览图别让浏览器记成大图，下次再试
		http.ServeFile(w, r, *a.PreviewPath)
		return
	}
	http.ServeFile(w, r, dest)
}

// makeLarge 用 libvips 从原图缩到 2560（按 EXIF 方向转正），先写临时文件再改名，生成一半时别人拿不到坏文件。
// iPhone 带 HDR 增益图的 JPEG 直接读会失败，和生成缩略图时一样改用普通 JPEG 解码再试
func (s *Service) makeLarge(r *http.Request, a *Asset, dest string) error {
	if _, err := os.Stat(dest); err == nil { // 排队时别人已经生成好了
		return nil
	}
	ctx := r.Context()
	tmp := dest + ".tmp.jpeg"
	err := vipsThumbnail(ctx, a.OriginalPath, tmp, largeSize, "Q=85")
	if err != nil && a.MimeType == "image/jpeg" {
		err = withPlainJPEG(ctx, a.OriginalPath, func(plain string) error {
			return vipsThumbnail(ctx, plain, tmp, largeSize, "Q=85")
		})
	}
	if err != nil {
		os.Remove(tmp)
		return err
	}
	return os.Rename(tmp, dest)
}

// withLarge 删除照片时连大图一起删：大图存在才加进要删的文件里（大多数照片没有大图，不算「找不到的文件」）
func withLarge(files []string, preview *string) []string {
	if preview == nil {
		return files
	}
	p := largePath(*preview)
	if _, err := os.Stat(p); err == nil || !errors.Is(err, fs.ErrNotExist) {
		files = append(files, p)
	}
	return files
}
