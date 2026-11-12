package assets

import (
	"context"
	"crypto/sha1"
	"errors"
	"fmt"
	"github.com/wanmory/wanmory/server/internal/auth"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

type uploadResult struct {
	FileName  string `json:"file_name"`
	Asset     *Asset `json:"asset,omitempty"`
	Duplicate bool   `json:"duplicate,omitempty"` // 同样内容的文件已经存在，返回的是已有的那张
	Error     string `json:"error,omitempty"`
}

// upload 接收 multipart 上传，字段名 file，可以一次传多个。
// 每个 file 前面可以带一个 last_modified 字段（毫秒时间戳），用来保留文件原来的修改时间。
// 文件边读边写到磁盘，不会整个读进内存。
func (s *Service) upload(w http.ResponseWriter, r *http.Request) {
	// 一次请求最多 maxUploadBytes；磁盘快满（剩不到 keepFreeBytes）时不收
	r.Body = http.MaxBytesReader(w, r.Body, maxUploadBytes)
	if !s.roomFor(r.Context(), max(r.ContentLength, 0)) {
		httpx.Error(w, http.StatusInsufficientStorage, "服务器的磁盘空间不够了")
		return
	}
	mr, err := r.MultipartReader()
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求必须是 multipart/form-data")
		return
	}

	results := []uploadResult{}
	var lastModified time.Time
	for {
		part, err := mr.NextPart()
		if err == io.EOF {
			break
		}
		if err != nil {
			httpx.Error(w, http.StatusBadRequest, "读取上传内容失败")
			return
		}

		switch {
		case part.FormName() == "last_modified":
			b, _ := io.ReadAll(io.LimitReader(part, 32))
			if ms, err := strconv.ParseInt(strings.TrimSpace(string(b)), 10, 64); err == nil && ms > 0 {
				lastModified = time.UnixMilli(ms)
			}
		case part.FormName() == "file" && part.FileName() != "":
			res := uploadResult{FileName: part.FileName()}
			res.Asset, res.Duplicate, err = s.saveUpload(r.Context(), part, lastModified)
			if err == nil && res.Asset != nil {
				_ = s.store.SetUploader(r.Context(), res.Asset.ID, auth.UserID(r.Context()))
			}
			if errors.Is(err, errUnsupported) {
				res.Error = err.Error()
			} else if err != nil {
				part.Close()
				httpx.InternalError(w, err)
				return
			}
			results = append(results, res)
			lastModified = time.Time{}
		}
		part.Close()
	}

	if len(results) == 0 {
		httpx.Error(w, http.StatusBadRequest, "没有收到文件")
		return
	}
	httpx.JSON(w, http.StatusCreated, results)
}

// saveUpload 把 multipart 里的一个文件写到临时文件（同时计算校验值），再交给 ingest 入库。
func (s *Service) saveUpload(ctx context.Context, part *multipart.Part, mtime time.Time) (*Asset, bool, error) {
	name := cleanFileName(part.FileName())
	if _, err := kindOf(name); err != nil {
		return nil, false, err
	}
	uploadDir, err := s.uploadDir(ctx)
	if err != nil {
		return nil, false, fmt.Errorf("读取上传目录设置: %w", err)
	}

	// 临时文件放在上传目录下，和最终位置在同一个磁盘，入库时可以直接硬链接过去
	tmpDir := filepath.Join(uploadDir, ".tmp")
	if err := os.MkdirAll(tmpDir, 0o755); err != nil {
		return nil, false, err
	}
	tmp, err := os.CreateTemp(tmpDir, "upload-*")
	if err != nil {
		return nil, false, err
	}
	defer os.Remove(tmp.Name()) // 入库成功时文件已经链接到最终位置，这里只删掉临时名字

	hash := sha1.New()
	_, err = io.Copy(io.MultiWriter(tmp, hash), part)
	if closeErr := tmp.Close(); err == nil {
		err = closeErr
	}
	if err != nil {
		return nil, false, fmt.Errorf("保存上传文件: %w", err)
	}
	return s.ingest(ctx, tmp.Name(), name, mtime, hash.Sum(nil))
}
