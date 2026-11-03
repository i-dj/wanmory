package assets

import (
	"context"
	"crypto/sha1"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/wanmory/wanmory/server/internal/jobs"
)

// 支持上传的扩展名，以及对应的类型和 MIME。
var supportedExts = map[string]struct{ typ, mime string }{
	".jpg":  {TypeImage, "image/jpeg"},
	".jpeg": {TypeImage, "image/jpeg"},
	".png":  {TypeImage, "image/png"},
	".webp": {TypeImage, "image/webp"},
	".gif":  {TypeImage, "image/gif"},
	".heic": {TypeImage, "image/heic"},
	".heif": {TypeImage, "image/heif"},
	".tif":  {TypeImage, "image/tiff"},
	".tiff": {TypeImage, "image/tiff"},
	".dng":  {TypeImage, "image/x-adobe-dng"},
	".mp4":  {TypeVideo, "video/mp4"},
	".m4v":  {TypeVideo, "video/x-m4v"},
	".mov":  {TypeVideo, "video/quicktime"},
	".3gp":  {TypeVideo, "video/3gpp"},
	".mkv":  {TypeVideo, "video/x-matroska"},
	".avi":  {TypeVideo, "video/x-msvideo"},
}

var errUnsupported = errors.New("不支持的文件类型")

// kindOf 按扩展名判断文件类型，不支持时返回 errUnsupported。
func kindOf(name string) (struct{ typ, mime string }, error) {
	ext := strings.ToLower(filepath.Ext(name))
	kind, ok := supportedExts[ext]
	if !ok {
		if ext == "" {
			ext = "（没有扩展名）"
		}
		return kind, fmt.Errorf("%w: %s", errUnsupported, ext)
	}
	return kind, nil
}

// ingest 把已经完整收到的文件 src 放进照片库：查重、放到上传目录、写数据库、加入 metadata 任务。
// 网页的普通上传和分片上传最后都走这里。
//
// name 是原始文件名，mtime 是原始修改时间（为空时用当前时间），sum 是 SHA-1（为空时读文件计算）。
// 文件内容和已有照片完全相同时不保存，返回已有的照片和 duplicate = true。
// 不会删除 src，由调用方负责。
func (s *Service) ingest(ctx context.Context, src, name string, mtime time.Time, sum []byte) (*Asset, bool, error) {
	name = cleanFileName(name)
	kind, err := kindOf(name)
	if err != nil {
		return nil, false, err
	}
	st, err := os.Stat(src)
	if err != nil {
		return nil, false, err
	}
	if sum == nil {
		if sum, err = sha1File(src); err != nil {
			return nil, false, err
		}
	}

	if existing, err := s.store.FindByChecksum(ctx, sum); err == nil {
		return existing, true, nil
	} else if !errors.Is(err, ErrNotFound) {
		return nil, false, err
	}

	uploadDir, err := s.uploadDir(ctx)
	if err != nil {
		return nil, false, fmt.Errorf("读取上传目录设置: %w", err)
	}
	// 按上传时间分目录：upload/2026/10/IMG_0001.jpg
	now := time.Now()
	dir := filepath.Join(uploadDir, now.Format("2006"), now.Format("01"))
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, false, err
	}
	dest, err := placeUnique(src, dir, name)
	if err != nil {
		return nil, false, err
	}
	if mtime.IsZero() {
		mtime = now
	}
	if err := os.Chtimes(dest, mtime, mtime); err != nil {
		os.Remove(dest)
		return nil, false, err
	}

	a := &Asset{
		Type:         kind.typ,
		OriginalPath: dest,
		FileName:     filepath.Base(dest),
		FileSize:     st.Size(),
		FileMtime:    mtime,
		Checksum:     sum,
		MimeType:     kind.mime,
	}
	if err := s.insertWithJob(ctx, a); err != nil {
		os.Remove(dest)
		return nil, false, err
	}
	return a, false, nil
}

// insertWithJob 在同一个事务里写入照片和它的 metadata 任务，保证不会有照片入库了却没人处理。
func (s *Service) insertWithJob(ctx context.Context, a *Asset) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if err := s.store.Create(ctx, tx, a); err != nil {
		return err
	}
	if err := jobs.Enqueue(ctx, tx, jobs.NewJob{Type: JobMetadata, AssetID: &a.ID, Priority: metadataPriority}); err != nil {
		return err
	}
	return tx.Commit()
}

func sha1File(path string) ([]byte, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	h := sha1.New()
	if _, err := io.Copy(h, f); err != nil {
		return nil, err
	}
	return h.Sum(nil), nil
}

// placeUnique 把 src 放到 dir/name，重名时依次尝试 name-1、name-2……
// 同一个磁盘上用硬链接，不用复制；上传目录在另一块磁盘时（例如 NAS 上单独的照片盘）退回复制。
// 目标已存在时硬链接和 O_EXCL 创建都会失败，所以两个同名文件同时上传也不会互相覆盖。
func placeUnique(src, dir, name string) (string, error) {
	ext := filepath.Ext(name)
	base := strings.TrimSuffix(name, ext)
	for i := 0; i < 1000; i++ {
		candidate := name
		if i > 0 {
			candidate = fmt.Sprintf("%s-%d%s", base, i, ext)
		}
		dest := filepath.Join(dir, candidate)
		err := os.Link(src, dest)
		if errors.Is(err, syscall.EXDEV) {
			err = copyExclusive(src, dest)
		}
		if err == nil {
			return dest, nil
		}
		if !errors.Is(err, os.ErrExist) {
			return "", err
		}
	}
	return "", fmt.Errorf("%s 下同名文件太多: %s", dir, name)
}

// copyExclusive 复制文件，目标已存在时返回 os.ErrExist。
func copyExclusive(src, dest string) error {
	in, err := os.Open(src)
	if err != nil {
		return err
	}
	defer in.Close()
	out, err := os.OpenFile(dest, os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0o644)
	if err != nil {
		return err
	}
	if _, err := io.Copy(out, in); err != nil {
		out.Close()
		os.Remove(dest)
		return err
	}
	if err := out.Close(); err != nil {
		os.Remove(dest)
		return err
	}
	return nil
}

// cleanFileName 只保留文件名本身，去掉浏览器可能带上的路径，防止写到上传目录外面。
func cleanFileName(name string) string {
	name = filepath.Base(strings.ReplaceAll(name, `\`, "/"))
	name = strings.TrimLeft(name, ".")
	if name == "" || name == "/" {
		return "upload"
	}
	return name
}
