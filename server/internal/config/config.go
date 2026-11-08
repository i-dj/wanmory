// Package config 读取启动必需的配置。这些配置来自环境变量（Docker Compose 里设置），
// 其余可以在网页上修改的配置都放在数据库的 settings 表里。
package config

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
)

type Config struct {
	DatabaseURL string // DATABASE_URL
	Addr        string // WANMORY_ADDR，默认 :8080
	DataDir     string // WANMORY_DATA_DIR：缩略图等程序生成的文件，默认 ./data
	UploadDir   string // WANMORY_UPLOAD_DIR：上传目录的默认值，网页上可以改，默认 <DataDir>/upload

	// WANMORY_WORKERS：同时处理多少个任务（读元数据、生成缩略图）的默认值，没设是 0，按核数和内存自动算（见 internal/perf）。
	// 网页「设置 → 性能」里还可以改
	Workers int

	// 内置 AI 服务：和相册一起用 Docker Compose 启动的那个容器，只在 Docker 内部网络里，只有后端连它。
	// WANMORY_ML_URL 是它的地址（Docker 里是 http://ml:3003，开发时 make run 用 http://127.0.0.1:3103）、
	// WANMORY_ML_TOKEN 是它的令牌（一般不用）。单独启动的 AI 服务（远程）在网页设置里填地址。
	// WANMORY_FACE_MODEL、WANMORY_CLIP_MODEL 是设置里没选过档位时用的模型
	MLURL     string
	MLToken   string
	FaceModel string
	ClipModel string

	// WANMORY_STORAGE_ROOTS：网页上可以浏览、选择的目录范围，多个用 : 分隔，默认只有 DataDir。
	// 还没有登录功能，不能让网页随意浏览整台服务器。
	StorageRoots []string
}

// ThumbsDir 是缩略图和预览图的目录。
func (c Config) ThumbsDir() string { return filepath.Join(c.DataDir, "thumbs") }

func Load() (Config, error) {
	c := Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		Addr:        envOr("WANMORY_ADDR", ":8080"),
		DataDir:     envOr("WANMORY_DATA_DIR", "data"),
		MLURL:       envOr("WANMORY_ML_URL", "http://127.0.0.1:3003"),
		MLToken:     os.Getenv("WANMORY_ML_TOKEN"),
		FaceModel:   envOr("WANMORY_FACE_MODEL", "antelopev2"),
		ClipModel:   envOr("WANMORY_CLIP_MODEL", "chinese-clip-vit-h-14"),
	}
	if c.DatabaseURL == "" {
		return c, errors.New("DATABASE_URL 未设置")
	}
	if v := os.Getenv("WANMORY_WORKERS"); v != "" {
		n, err := strconv.Atoi(v)
		if err != nil || n < 1 {
			return c, fmt.Errorf("WANMORY_WORKERS 应该是正整数: %q", v)
		}
		c.Workers = n
	}
	c.UploadDir = envOr("WANMORY_UPLOAD_DIR", filepath.Join(c.DataDir, "upload"))

	// 路径会存进数据库，统一转成绝对路径
	var err error
	if c.DataDir, err = filepath.Abs(c.DataDir); err != nil {
		return c, err
	}
	if c.UploadDir, err = filepath.Abs(c.UploadDir); err != nil {
		return c, err
	}
	for _, dir := range []string{c.DataDir, c.UploadDir, c.ThumbsDir()} {
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return c, err
		}
	}

	roots := filepath.SplitList(os.Getenv("WANMORY_STORAGE_ROOTS"))
	if len(roots) == 0 {
		roots = []string{c.DataDir}
	}
	for _, r := range roots {
		// 解析符号链接（例如 macOS 的 /tmp → /private/tmp），后面判断路径是否在范围内才准确
		abs, err := filepath.Abs(r)
		if err != nil {
			return c, err
		}
		real, err := filepath.EvalSymlinks(abs)
		if err != nil {
			return c, fmt.Errorf("WANMORY_STORAGE_ROOTS 里的目录不可用: %w", err)
		}
		c.StorageRoots = append(c.StorageRoots, real)
	}
	return c, nil
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
