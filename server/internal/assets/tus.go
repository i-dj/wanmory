package assets

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/tus/tusd/v2/pkg/filestore"
	tusd "github.com/tus/tusd/v2/pkg/handler"
	"github.com/tus/tusd/v2/pkg/memorylocker"
	"github.com/wanmory/wanmory/server/internal/auth"
	"golang.org/x/exp/slog" // tusd 的 Logger 用的是这个包，不是标准库的 log/slog
)

// 分片上传用的是 tus 协议（https://tus.io）：先 POST 创建上传，再分几次 PATCH 把数据传上来，
// 网络断了就用 HEAD 问服务器收到了多少，从那里继续。网页用 tus-js-client，
// 以后的手机 App 也有现成的客户端库（TUSKit、tus-android-client）。
//
// 客户端在创建上传时通过 Upload-Metadata 带上 filename、filetype、lastModified（毫秒时间戳），
// 在相册里上传时还带上 album（相册 ID），传完直接放进相册。
// 全部收到后由 ingest 入库，响应头里返回结果：
//
//	Wanmory-Asset-Id:  照片 ID
//	Wanmory-Duplicate: true（内容和已有照片相同，返回的是已有的那张）
//
// 入库后上传记录再保留一天：客户端如果没收到最后的响应（例如正好在这时暂停或断网），
// 重新连上时 HEAD 会告诉它已经传完，并带上同样的结果头，不用从头再传。
const (
	UploadsPath = "/api/uploads/"

	// 传了一半就再也没动静的上传，超过这么久就清理掉。给手机断网、电脑睡眠留足时间。
	staleUploadAge = 7 * 24 * time.Hour
	// 已经入库的上传记录保留多久
	finishedUploadAge = 24 * time.Hour
	// 一个文件最大多少（再长的视频也够）；磁盘上至少留这么多空间，上传不能把磁盘塞满
	maxUploadBytes = 50 << 30
	keepFreeBytes  = 2 << 30
	// 入库最长用多久（大视频要读一遍算校验值）
	ingestTimeout = 10 * time.Minute
)

// finishedUpload 记在 <id>.done 里，是入库结果。
type finishedUpload struct {
	AssetID   string `json:"asset_id"`
	Duplicate bool   `json:"duplicate"`
}

// UploadHandler 返回处理分片上传的 HTTP handler。dir 是存放未传完文件的目录。
func (s *Service) UploadHandler(dir string) (http.Handler, error) {
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	composer := tusd.NewStoreComposer()
	// 包一层：收分片时顺便算校验值，传完入库不用再读一遍文件（见 tushash.go）
	s.tusStore = newHashingStore(filestore.New(dir))
	s.tusStore.UseIn(composer)
	// 内存锁：只有一个后端进程，用不着文件锁。新请求（例如暂停后继续的 HEAD）来的时候，
	// 内存锁会让还占着锁的旧请求马上停下，不用等它超时
	memorylocker.New().UseIn(composer)

	h, err := tusd.NewHandler(tusd.Config{
		BasePath:                UploadsPath,
		MaxSize:                 maxUploadBytes,
		StoreComposer:           composer,
		RespectForwardedHeaders: true, // 在反向代理（HTTPS）后面时生成正确的上传地址
		DisableDownload:         true,
		// 默认允许任何网站跨域上传；网页和接口是同一个地址，不需要跨域
		Cors:                      &tusd.CorsConfig{Disable: true},
		Logger:                    slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelWarn})),
		PreUploadCreateCallback:   s.checkUpload,
		PreFinishResponseCallback: s.finishUpload,
	})
	if err != nil {
		return nil, err
	}
	return http.StripPrefix(UploadsPath, withFinishedHeaders(dir, h)), nil
}

// withFinishedHeaders 在 HEAD 已经入库的上传时加上入库结果头，客户端据此知道传完了、是哪张照片。
// 要在 tusd 写响应的那一刻再查：HEAD 可能正在等另一个请求入库完成（tusd 的锁），
// 进来时还没有结果，等到回复时才有。
func withFinishedHeaders(dir string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := path.Base(r.URL.Path)
		if r.Method != http.MethodHead || id == "." || id == "/" {
			next.ServeHTTP(w, r)
			return
		}
		next.ServeHTTP(&finishedHeaderWriter{ResponseWriter: w, bin: filepath.Join(dir, id)}, r)
	})
}

type finishedHeaderWriter struct {
	http.ResponseWriter
	bin   string
	wrote bool
}

func (w *finishedHeaderWriter) WriteHeader(status int) {
	if !w.wrote {
		w.wrote = true
		if done, ok := readFinished(w.bin); ok && status == http.StatusOK {
			w.Header().Set("Wanmory-Asset-Id", done.AssetID)
			w.Header().Set("Wanmory-Duplicate", strconv.FormatBool(done.Duplicate))
		}
	}
	w.ResponseWriter.WriteHeader(status)
}

func (w *finishedHeaderWriter) Write(b []byte) (int, error) {
	if !w.wrote {
		w.WriteHeader(http.StatusOK)
	}
	return w.ResponseWriter.Write(b)
}

// Unwrap 让 http.ResponseController 能拿到底层的 ResponseWriter（tusd 用它设置读写超时）。
func (w *finishedHeaderWriter) Unwrap() http.ResponseWriter { return w.ResponseWriter }

// checkUpload 在开始上传前检查文件类型，不支持的格式在传第一个字节之前就拒绝。
func (s *Service) checkUpload(hook tusd.HookEvent) (tusd.HTTPResponse, tusd.FileInfoChanges, error) {
	name := hook.Upload.MetaData["filename"]
	if name == "" {
		return tusd.HTTPResponse{}, tusd.FileInfoChanges{},
			tusd.NewError("ERR_MISSING_FILENAME", "上传时要在 Upload-Metadata 里带上 filename", http.StatusBadRequest)
	}
	if _, err := kindOf(name); err != nil {
		return tusd.HTTPResponse{}, tusd.FileInfoChanges{},
			tusd.NewError("ERR_UNSUPPORTED_TYPE", err.Error(), http.StatusUnsupportedMediaType)
	}
	if !hook.Upload.SizeIsDeferred && !s.roomFor(hook.Context, hook.Upload.Size) {
		return tusd.HTTPResponse{}, tusd.FileInfoChanges{},
			tusd.NewError("ERR_DISK_FULL", "服务器的磁盘空间不够了", http.StatusInsufficientStorage)
	}
	return tusd.HTTPResponse{}, tusd.FileInfoChanges{}, nil
}

// roomFor 上传目录所在的磁盘放得下 size 字节，而且放完还剩 keepFreeBytes；查不到磁盘空间时不拦
func (s *Service) roomFor(ctx context.Context, size int64) bool {
	dir, err := s.uploadDir(ctx)
	if err != nil {
		return true
	}
	d, err := diskUsage(dir)
	if err != nil || d == nil || d.Total == 0 {
		return true
	}
	return size < 0 || uint64(size)+keepFreeBytes <= d.Free
}

// finishUpload 在最后一片收到后、回复客户端之前入库，这样客户端能直接拿到照片 ID。
func (s *Service) finishUpload(hook tusd.HookEvent) (tusd.HTTPResponse, error) {
	bin := hook.Upload.Storage[filestore.StorageKeyPath]
	meta := hook.Upload.MetaData

	var mtime time.Time
	if ms, err := strconv.ParseInt(meta["lastModified"], 10, 64); err == nil && ms > 0 {
		mtime = time.UnixMilli(ms)
	}

	// 数据已经全部收到，客户端这时断开（暂停、断网）也要把入库做完，所以不跟着请求取消
	ctx, cancel := context.WithTimeout(context.WithoutCancel(hook.Context), ingestTimeout)
	defer cancel()
	// 收的时候算好的校验值（重启过、出过错时没有，ingest 自己读文件算）
	var sum []byte
	var started time.Time
	if s.tusStore != nil {
		sum, started = s.tusStore.take(hook.Upload.ID, hook.Upload.Size)
	}
	saveStart := time.Now()
	a, dup, err := s.ingest(ctx, bin, meta["filename"], mtime, sum)
	logUploadTiming(meta["filename"], hook.Upload.Size, started, saveStart, sum != nil)
	if errors.Is(err, errUnsupported) {
		return tusd.HTTPResponse{}, tusd.NewError("ERR_UNSUPPORTED_TYPE", err.Error(), http.StatusUnsupportedMediaType)
	}
	if err != nil {
		log.Printf("assets: 分片上传 %s 入库失败: %v", meta["filename"], err)
		return tusd.HTTPResponse{}, tusd.NewError("ERR_INGEST", "保存照片失败", http.StatusInternalServerError)
	}

	if err := s.store.SetUploader(ctx, a.ID, auth.UserID(hook.Context)); err != nil {
		log.Printf("assets: 记录 %s 的上传者失败: %v", meta["filename"], err)
	}

	// 在相册里点「从电脑添加」上传的，顺手放进那个相册（已经存在的照片也放）
	if album, err := uuid.Parse(meta["album"]); err == nil {
		if err := s.store.CheckAlbum(ctx, auth.UserID(hook.Context), false, album, false); err != nil {
			log.Printf("assets: 不能把 %s 放进相册 %s: %v", meta["filename"], album, err)
		} else if err := s.store.AddToAlbum(ctx, album, []uuid.UUID{a.ID}); err != nil {
			log.Printf("assets: 把 %s 放进相册失败: %v", meta["filename"], err)
		}
	}

	done := finishedUpload{AssetID: a.ID.String(), Duplicate: dup}
	if err := markFinished(bin, hook.Upload.Size, done); err != nil {
		// 只影响「没收到响应后重连」这种少见情况，照片已经入库了
		log.Printf("assets: 记录分片上传 %s 的结果失败: %v", meta["filename"], err)
	}
	return tusd.HTTPResponse{Header: tusd.HTTPHeader{
		"Wanmory-Asset-Id":  done.AssetID,
		"Wanmory-Duplicate": strconv.FormatBool(done.Duplicate),
	}}, nil
}

// logUploadTiming 大文件（20 MB 以上）传完时记一行：多大、接收用了多久（多快）、入库用了多久，
// 上传慢的时候看日志就知道是网络慢还是服务器存得慢
func logUploadTiming(name string, size int64, started, saveStart time.Time, hashed bool) {
	if size < 20<<20 {
		return
	}
	save := time.Since(saveStart).Round(10 * time.Millisecond)
	how := "收的时候已算好校验值"
	if !hashed {
		how = "重新读文件算校验值"
	}
	if started.IsZero() {
		log.Printf("上传 %s：%.0f MB，入库 %s（%s）", name, float64(size)/1e6, save, how)
		return
	}
	recv := saveStart.Sub(started)
	log.Printf("上传 %s：%.0f MB，接收 %s（%.1f MB/s），入库 %s（%s）",
		name, float64(size)/1e6, recv.Round(100*time.Millisecond), float64(size)/1e6/max(recv.Seconds(), 0.001), save, how)
}

// markFinished 写下入库结果，并把数据文件换成同样大小的空洞文件（稀疏文件，不占磁盘）：
// 照片已经链接或复制到上传目录，tus 这份数据用不着了，但 tusd 靠数据文件的大小算已收到多少，
// 留着同样的大小，HEAD 才会回答「已经传完」。
func markFinished(bin string, size int64, done finishedUpload) error {
	data, err := json.Marshal(done)
	if err != nil {
		return err
	}
	if err := os.WriteFile(bin+".done", data, 0o644); err != nil {
		return err
	}
	if err := os.Remove(bin); err != nil {
		return err
	}
	f, err := os.Create(bin)
	if err != nil {
		return err
	}
	defer f.Close()
	return f.Truncate(size)
}

func readFinished(bin string) (finishedUpload, bool) {
	var done finishedUpload
	data, err := os.ReadFile(bin + ".done")
	if err != nil || json.Unmarshal(data, &done) != nil {
		return done, false
	}
	return done, true
}

// CleanStaleUploads 每小时清理一次过期的上传记录，直到 ctx 取消：
// 传了一半、超过 7 天没有动静的，以及已经入库超过一天的。
func CleanStaleUploads(ctx context.Context, dir string) {
	t := time.NewTicker(time.Hour)
	defer t.Stop()
	for {
		cleanStaleUploads(dir, time.Now())
		select {
		case <-ctx.Done():
			return
		case <-t.C:
		}
	}
}

// cleanStaleUploads 清理过期的上传。tus 每个上传是 <id>（数据）和 <id>.info（描述）两个文件，
// 入库后多一个 <id>.done。没入库的按数据文件的修改时间（最后一次收到数据）算，入库的按 .done 的时间算。
func cleanStaleUploads(dir string, now time.Time) {
	infos, err := filepath.Glob(filepath.Join(dir, "*.info"))
	if err != nil {
		return
	}
	for _, info := range infos {
		bin := strings.TrimSuffix(info, ".info")
		if done := modTime(bin + ".done"); !done.IsZero() {
			if done.Before(now.Add(-finishedUploadAge)) {
				removeTusUpload(bin)
			}
			continue
		}
		last := modTime(bin)
		if last.IsZero() {
			last = modTime(info)
		}
		if !last.IsZero() && last.Before(now.Add(-staleUploadAge)) {
			removeTusUpload(bin)
			log.Printf("assets: 清理了一个超过 %v 没有完成的上传: %s", staleUploadAge, filepath.Base(bin))
		}
	}
}

func removeTusUpload(bin string) {
	os.Remove(bin)
	os.Remove(bin + ".info")
	os.Remove(bin + ".done")
}

func modTime(path string) time.Time {
	st, err := os.Stat(path)
	if err != nil {
		return time.Time{}
	}
	return st.ModTime()
}
