package assets

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wanmory/wanmory/server/internal/jobs"
)

const (
	thumbnailSize = 480  // 网格缩略图，长边不超过 480 像素
	previewSize   = 1440 // 大图预览，也是发给 AI 服务的图，长边不超过 1440 像素
)

// runThumbnail 用 libvips 生成缩略图和预览图（视频先用 FFmpeg 截一帧），完成后加入 clip 任务。
func (s *Service) runThumbnail(ctx context.Context, job *jobs.Job) error {
	if job.AssetID == nil {
		return errors.New("thumbnail 任务缺少 asset_id")
	}
	a, err := s.store.Get(ctx, *job.AssetID)
	if errors.Is(err, ErrNotFound) {
		return nil
	}
	if err != nil {
		return err
	}

	// thumbs/ab/<id>-thumb.webp：按 ID 前两位分子目录，避免一个目录里文件太多
	id := a.ID.String()
	dir := filepath.Join(s.thumbsDir, id[:2])
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	thumb := filepath.Join(dir, id+"-thumb.webp")
	preview := filepath.Join(dir, id+"-preview.jpeg")

	if a.Type == TypeVideo {
		frame, err := ffmpegFrame(ctx, a.OriginalPath, "1", "0") // 第 1 秒；不到 1 秒的视频截第一帧
		if err != nil {
			return err
		}
		defer os.Remove(frame)
		if err := makeDerivatives(ctx, frame, thumb, preview); err != nil {
			return err
		}
	} else if err := imageDerivatives(ctx, a, thumb, preview); err != nil {
		return err
	}

	if err := s.store.SetDerivatives(ctx, a.ID, thumb, preview); err != nil {
		return err
	}
	if err := jobs.Enqueue(ctx, s.db, jobs.NewJob{Type: JobClip, AssetID: &a.ID, Priority: timelinePriority(a.SortTime)}); err != nil {
		return err
	}
	if a.Type == TypeAudio {
		return nil
	}
	if err := jobs.Enqueue(ctx, s.db, jobs.NewJob{Type: JobOCR, AssetID: &a.ID, Priority: timelinePriority(a.SortTime)}); err != nil {
		return err
	}
	return jobs.Enqueue(ctx, s.db, jobs.NewJob{Type: JobFace, AssetID: &a.ID, Priority: timelinePriority(a.SortTime)})
}

// imageDerivatives 给照片生成缩略图和预览图。libvips 直接处理失败时依次兜底：
//
//  1. JPEG 改用普通 JPEG 解码（jpegload）。libvips 8.18 起会把带 HDR 增益图的 JPEG 交给
//     libultrahdr 解码，而 iPhone 的增益图不带色彩配置，会被它拒绝；缩略图用不到增益图，
//     按普通 JPEG 读就行，颜色和方向都保留。
//  2. 再不行用 FFmpeg 转成普通 JPEG。
func imageDerivatives(ctx context.Context, a *Asset, thumb, preview string) error {
	vipsErr := makeDerivatives(ctx, a.OriginalPath, thumb, preview)
	if vipsErr == nil {
		return nil
	}

	if a.MimeType == "image/jpeg" {
		plainErr := plainJPEGDerivatives(ctx, a.OriginalPath, thumb, preview)
		if plainErr == nil {
			log.Printf("assets: %s 用 libvips 处理失败（%s），已改用普通 JPEG 解码生成缩略图",
				a.OriginalPath, oneLine(vipsErr))
			return nil
		}
		vipsErr = fmt.Errorf("%w；普通 JPEG 解码也失败: %v", vipsErr, plainErr)
	}

	converted, err := ffmpegFrame(ctx, a.OriginalPath, "") // 照片不能加 -ss，否则 FFmpeg 什么也不输出
	if err != nil {
		return fmt.Errorf("%w；FFmpeg 兜底也失败: %v", vipsErr, err)
	}
	defer os.Remove(converted)
	copyColorProfile(ctx, a.OriginalPath, converted)
	if err := makeDerivatives(ctx, converted, thumb, preview); err != nil {
		return fmt.Errorf("%w；FFmpeg 兜底后仍失败: %v", vipsErr, err)
	}
	log.Printf("assets: %s 用 libvips 处理失败（%s），已改用 FFmpeg 转换后生成缩略图",
		a.OriginalPath, oneLine(vipsErr))
	return nil
}

// plainJPEGDerivatives 强制用普通 JPEG 解码器读原图，存成 libvips 自己的 .v 临时文件
// （不压缩、保留方向和色彩配置等元数据），再从它生成缩略图和预览图。
func plainJPEGDerivatives(ctx context.Context, src, thumb, preview string) error {
	f, err := os.CreateTemp("", "wanmory-plain-*.v")
	if err != nil {
		return err
	}
	f.Close()
	defer os.Remove(f.Name())

	if out, err := exec.CommandContext(ctx, "vips", "jpegload", src, f.Name()).CombinedOutput(); err != nil {
		return fmt.Errorf("vips jpegload: %v: %s", err, strings.TrimSpace(string(out)))
	}
	return makeDerivatives(ctx, f.Name(), thumb, preview)
}

// oneLine 把多行的错误信息压成一行，方便写进日志。
func oneLine(err error) string {
	return strings.Join(strings.Fields(err.Error()), " ")
}

// makeDerivatives 从 src 生成预览图，再从预览图生成缩略图。原图只解码一次，
// 缩略图从 1440 像素的预览图缩小，比从几千万像素的原图缩小快得多，画质看不出区别。
func makeDerivatives(ctx context.Context, src, thumb, preview string) error {
	if err := vipsThumbnail(ctx, src, preview, previewSize, "Q=85"); err != nil {
		return err
	}
	return vipsThumbnail(ctx, preview, thumb, thumbnailSize, "Q=80")
}

// vipsThumbnail 把 src 缩小到长边不超过 size（小图不放大），按 EXIF 方向自动旋转。
func vipsThumbnail(ctx context.Context, src, dest string, size int, opts string) error {
	cmd := exec.CommandContext(ctx, "vipsthumbnail", src,
		"--size", fmt.Sprintf("%dx%d>", size, size),
		"-o", fmt.Sprintf("%s[%s]", dest, opts))
	if out, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("vipsthumbnail: %v: %s", err, strings.TrimSpace(string(out)))
	}
	return nil
}

// ffmpegFrame 用 FFmpeg 把 path 的一帧转成 JPEG，依次尝试 seeks 里的时间点（秒，空字符串表示不跳转）。
// 视频用来截帧；照片用来兜底：FFmpeg 会按 EXIF 方向转正，输出不再带方向标签。
// 返回临时文件的路径，用完要删掉。
func ffmpegFrame(ctx context.Context, path string, seeks ...string) (string, error) {
	f, err := os.CreateTemp("", "wanmory-frame-*.jpg")
	if err != nil {
		return "", err
	}
	f.Close()

	var lastErr error
	for _, at := range seeks {
		args := []string{"-v", "error", "-y"}
		if at != "" {
			args = append(args, "-ss", at)
		}
		args = append(args, "-i", path, "-frames:v", "1", "-q:v", "2", f.Name())
		cmd := exec.CommandContext(ctx, "ffmpeg", args...)
		out, err := cmd.CombinedOutput()
		if err == nil {
			if st, statErr := os.Stat(f.Name()); statErr == nil && st.Size() > 0 {
				return f.Name(), nil
			}
			err = errors.New("没有截到画面")
		}
		lastErr = fmt.Errorf("ffmpeg: %v: %s", err, strings.TrimSpace(string(out)))
	}
	os.Remove(f.Name())
	return "", lastErr
}

// copyColorProfile 把原图的 ICC 色彩配置复制到 FFmpeg 转出来的 JPEG 上。
// FFmpeg 会丢掉它，而 iPhone 照片常用 Display P3，没有配置的话 libvips 会当成 sRGB，颜色发灰。
// 只复制色彩配置，不复制方向标签（FFmpeg 已经转正了）。复制失败不影响生成缩略图。
func copyColorProfile(ctx context.Context, src, dest string) {
	cmd := exec.CommandContext(ctx, "exiftool", "-q", "-overwrite_original",
		"-tagsFromFile", src, "-ICC_Profile", dest)
	if out, err := cmd.CombinedOutput(); err != nil {
		log.Printf("assets: 复制色彩配置失败（不影响缩略图）: %v: %s", err, strings.TrimSpace(string(out)))
	}
}
