package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/wanmory/wanmory/server/internal/ai"
	"github.com/wanmory/wanmory/server/internal/assets"
	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/clip"
	"github.com/wanmory/wanmory/server/internal/config"
	"github.com/wanmory/wanmory/server/internal/db"
	"github.com/wanmory/wanmory/server/internal/faces"
	"github.com/wanmory/wanmory/server/internal/geo"
	"github.com/wanmory/wanmory/server/internal/jobs"
	"github.com/wanmory/wanmory/server/internal/settings"
	"github.com/wanmory/wanmory/server/internal/storage"
	"github.com/wanmory/wanmory/server/internal/webui"
)

// 本机 worker 的名字，写进 jobs.locked_by。
const localWorkerName = "local"

// aiWorkerName 是把任务交给 AI 服务的 worker；aiConcurrency 是同时给它发几个请求，
// 多了 AI 服务也是排队算，只会让单个请求超时
const (
	aiWorkerName  = "ai"
	aiConcurrency = 2
)

func main() {
	// Docker 的健康检查用：镜像里没有 curl，直接用程序自己请求 /api/health
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		if err := healthcheck(); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		return
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// wanmory purge：删除所有照片和相关数据
	if len(os.Args) > 1 && os.Args[1] == "purge" {
		if err := purge(ctx, os.Args[2:]); err != nil {
			log.Fatal(err)
		}
		return
	}

	if err := run(ctx); err != nil {
		log.Fatal(err)
	}
}

func run(ctx context.Context) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	conn, err := db.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer conn.Close()
	if err := db.Migrate(ctx, conn); err != nil {
		return err
	}

	settingsStore := settings.NewStore(conn)
	roots := storage.Roots(cfg.StorageRoots)
	registry := newSettingsRegistry(cfg, roots)

	uploadDir := func(ctx context.Context) (string, error) {
		return settings.GetOr(ctx, settingsStore, assets.SettingUploadDir, cfg.UploadDir)
	}
	exif := assets.NewExifPool(cfg.Workers)
	defer exif.Close()
	assetService := assets.NewService(conn, exif, uploadDir, cfg.ThumbsDir())
	worker := jobs.NewWorker(conn, localWorkerName, cfg.Workers)
	assetService.RegisterJobs(worker)

	aiClient := ai.NewClient(cfg.MLURL, cfg.MLToken)
	// 设置里可以换成远程的 AI 服务、换档位（模型组合）
	aiAdmin := ai.NewAdmin(aiClient, settingsStore, cfg.MLURL, cfg.MLToken, cfg.FaceModel, cfg.ClipModel)
	if err := aiAdmin.Load(ctx); err != nil {
		log.Printf("读取 AI 服务地址失败，用默认的 %s: %v", cfg.MLURL, err)
	}
	models, err := aiAdmin.Models(ctx)
	if err != nil {
		log.Printf("读取 AI 档位失败，用默认的模型: %v", err)
	}
	faceService := faces.NewService(conn, aiClient, models.Face, cfg.ThumbsDir())
	aiWorker := jobs.NewWorker(conn, aiWorkerName, aiConcurrency)
	faceService.RegisterJobs(aiWorker)

	// 语义搜索和自动分类（CLIP）：和人脸用同一个 AI 服务、同一个 worker
	clipService, err := clip.NewService(conn, aiClient, models.Clip)
	if err != nil {
		return err
	}
	// 设置里换了档位：两个服务换模型，给要重新处理的照片排上任务（新模型的向量追上来之前搜索还用旧的）
	aiAdmin.OnSwitch(func(ctx context.Context, t ai.Tier) error {
		faceService.SetModel(t.Face)
		if err := clipService.SetModel(t.Clip); err != nil {
			return err
		}
		if _, err := faceService.Backfill(ctx); err != nil {
			return err
		}
		_, err := clipService.Backfill(ctx)
		log.Printf("AI 档位换成 人脸 %s、语义搜索 %s，所有照片重新处理", t.Face, t.Clip)
		return err
	}, func(ctx context.Context) (map[string][2]int, error) {
		fd, ft, err := faceService.Progress(ctx)
		if err != nil {
			return nil, err
		}
		cd, ct, err := clipService.Progress(ctx)
		return map[string][2]int{"face": {fd, ft}, "clip": {cd, ct}}, err
	})
	clipService.RegisterJobs(aiWorker)
	var categories []assets.SearchCategory
	for _, c := range clip.Categories() {
		categories = append(categories, assets.SearchCategory{Key: c.Key, Label: c.Label})
	}
	assetService.SetSearch(clipService.Search, categories, clipService.Model)
	if n, err := clipService.Backfill(ctx); err != nil {
		log.Printf("clip: 给已有照片排语义向量、文字识别任务失败: %v", err)
	} else if n > 0 {
		log.Printf("clip: 给已有照片排上了 %d 个语义向量、文字识别任务", n)
	}
	go clipService.RetagStale(ctx)
	if n, err := faceService.Backfill(ctx); err != nil {
		log.Printf("faces: 给已有照片排人脸任务失败: %v", err)
	} else if n > 0 {
		log.Printf("faces: 给 %d 张已有照片排上了人脸识别", n)
	}
	go faceService.Watch(ctx)

	// 照片拍摄地点的城市名：后台查好存进库里；设置里关了在线地图就不查
	geoService := geo.NewService(conn, func(ctx context.Context) bool {
		v, err := settings.GetOr(ctx, settingsStore, "maps.online", "on")
		return err == nil && v != "off"
	})
	go geoService.Run(ctx)
	go assetService.RunHiddenSync(ctx) // 私有智能相册「同时隐藏」跟上条件

	// 家庭账号：没登录的 /api 请求一律拦下（见 internal/auth）
	authService := auth.NewService(conn)
	authService.SetGuest(func(ctx context.Context) bool { // 访客模式：没登录也能只读浏览共享的照片
		v, err := settings.GetOr(ctx, settingsStore, auth.SettingGuest, "on")
		return err == nil && v == "on"
	})

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})
	authService.Routes(mux)
	settings.NewHandler(settingsStore, registry).Routes(mux)
	aiAdmin.Routes(mux)
	storage.NewHandler(roots).Routes(mux)
	jobs.NewHandler(conn).Routes(mux)
	assetService.Routes(mux)
	faceService.Routes(mux)
	geoService.Routes(mux)
	tusDir := filepath.Join(cfg.DataDir, "tus") // 还没传完的分片上传
	uploads, err := assetService.UploadHandler(tusDir)
	if err != nil {
		return err
	}
	mux.Handle(assets.UploadsPath, uploads)
	go assets.CleanStaleUploads(ctx, tusDir)
	mux.Handle("/", webui.Handler()) // 其他路径都是前端页面

	srv := &http.Server{Addr: cfg.Addr, Handler: authService.Middleware(mux), ReadHeaderTimeout: 10 * time.Second}

	workerDone := make(chan struct{})
	go func() {
		worker.Run(ctx)
		close(workerDone)
	}()
	aiDone := make(chan struct{})
	go func() {
		aiWorker.Run(ctx)
		close(aiDone)
	}()
	go func() {
		<-ctx.Done()
		shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		srv.Shutdown(shutdownCtx)
	}()

	log.Printf("wanmory server listening on %s，同时处理 %d 个任务，可浏览的目录 %v，AI 服务 %s",
		cfg.Addr, cfg.Workers, cfg.StorageRoots, cfg.MLURL)
	if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	log.Println("正在等待进行中的任务完成…")
	<-workerDone
	<-aiDone
	return nil
}

func healthcheck() error {
	addr := os.Getenv("WANMORY_ADDR")
	if addr == "" {
		addr = ":8080"
	}
	if strings.HasPrefix(addr, ":") {
		addr = "127.0.0.1" + addr
	}
	client := http.Client{Timeout: 3 * time.Second}
	res, err := client.Get("http://" + addr + "/api/health")
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return fmt.Errorf("健康检查返回 %d", res.StatusCode)
	}
	return nil
}
