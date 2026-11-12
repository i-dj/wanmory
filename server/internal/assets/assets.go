// Package assets 管理照片和视频：上传入库、读取元数据、生成缩略图、提供文件访问。
package assets

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/wanmory/wanmory/server/internal/exiftool"
	"github.com/wanmory/wanmory/server/internal/jobs"
)

// SettingUploadDir 是上传目录的设置项，在网页的设置页修改。
const SettingUploadDir = "storage.upload_dir"

type Service struct {
	libraryDir string // 照片目录（挂载进来的 NAS、移动硬盘），见 library.go
	db         *sql.DB
	store      *Store
	exif       *exiftool.Pool
	uploadDir  func(ctx context.Context) (string, error) // 每次上传时读取，改了设置立即生效
	thumbsDir  string                                    // 缩略图和预览图
	categories []SearchCategory                          // 自动分类，见 SetSearch
	clipModel  func() string                             // 用哪个模型的 CLIP 向量比照片像不像（连拍整理），见 SetSearch；换档位后跟着变
	hiddenKick chan struct{}                             // 让 RunHiddenSync 马上做一次
	tusStore   *hashingStore                             // 分片上传的存储，收的时候顺便算校验值，见 tushash.go
}

// NewExifPool 创建读元数据用的 exiftool 进程池，参数和 readExif 的要求一致。
// -n 让数值保持原始数字（例如 GPS 是带正负号的小数）；QuickTimeUTC 让视频的创建时间按 UTC 解释。
func NewExifPool(size int) *exiftool.Pool {
	return exiftool.NewPool(size, "-json", "-n", "-api", "QuickTimeUTC", "-api", "LargeFileSupport=1")
}

// （照片目录见 library.go 的 SetLibraryDir）
func NewService(db *sql.DB, exif *exiftool.Pool, uploadDir func(ctx context.Context) (string, error), thumbsDir string) *Service {
	return &Service{db: db, store: NewStore(db), exif: exif, uploadDir: uploadDir, thumbsDir: thumbsDir,
		hiddenKick: make(chan struct{}, 1)}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/assets", s.upload)
	mux.HandleFunc("GET /api/assets", s.list)
	mux.HandleFunc("GET /api/assets/stats", s.stats)
	mux.HandleFunc("GET /api/assets/changes", s.changes)
	mux.HandleFunc("GET /api/assets/summary", s.summary)
	mux.HandleFunc("GET /api/assets/dates", s.dates)
	mux.HandleFunc("GET /api/assets/points", s.points)
	mux.HandleFunc("GET /api/assets/highlights", s.highlights)
	mux.HandleFunc("POST /api/assets/highlights/skip", s.skipHighlight)
	mux.HandleFunc("GET /api/bursts", s.bursts)
	mux.HandleFunc("GET /api/search/options", s.searchOptions)
	mux.HandleFunc("POST /api/bursts/review", s.reviewBursts)
	mux.HandleFunc("POST /api/assets/batch", s.batch)
	mux.HandleFunc("POST /api/assets/download", s.download)
	mux.HandleFunc("POST /api/assets/purge", s.purge)
	mux.HandleFunc("GET /api/albums", s.listAlbums)
	mux.HandleFunc("POST /api/albums", s.createAlbum)
	mux.HandleFunc("POST /api/albums/preview", s.previewSmart)
	mux.HandleFunc("GET /api/albums/values", s.fieldValues)
	mux.HandleFunc("PATCH /api/albums/{id}", s.updateAlbum)
	mux.HandleFunc("DELETE /api/albums/{id}", s.deleteAlbum)
	mux.HandleFunc("PUT /api/albums/{id}/cover", s.setAlbumCover)
	mux.HandleFunc("GET /api/albums/{id}/privacy", s.albumPrivacy)
	mux.HandleFunc("PUT /api/albums/{id}/privacy", s.setAlbumPrivacy)
	mux.HandleFunc("POST /api/albums/{id}/assets", s.addAlbumAssets)
	mux.HandleFunc("POST /api/albums/{id}/assets/remove", s.removeAlbumAssets)
	mux.HandleFunc("GET /api/assets/{id}", s.get)
	mux.HandleFunc("PATCH /api/assets/{id}", s.update)
	mux.HandleFunc("GET /api/assets/{id}/details", s.details)
	mux.HandleFunc("GET /api/assets/{id}/thumbnail", s.serveFile(fileThumbnail))
	mux.HandleFunc("GET /api/assets/{id}/preview", s.serveFile(filePreview))
	mux.HandleFunc("GET /api/assets/{id}/large", s.serveLarge)
	mux.HandleFunc("GET /api/assets/{id}/original", s.serveFile(fileOriginal))
}

// RegisterJobs 把照片相关的任务处理函数注册到 worker。clip 任务由 AI 服务处理，不在这里注册。
func (s *Service) RegisterJobs(w *jobs.Worker) {
	w.Register(JobMetadata, s.runMetadata)
	w.Register(JobThumbnail, s.runThumbnail)
}
