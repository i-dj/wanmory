package exiftool

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"testing"
	"time"
)

// newSample 用 exiftool 自己生成一个带拍摄时间的小 JPEG（文件名带中文，确认路径编码没问题）。
func newSample(t *testing.T) string {
	t.Helper()
	if _, err := exec.LookPath("exiftool"); err != nil {
		t.Skip("没有安装 exiftool")
	}
	// 最小的合法 JPEG（1×1 像素）
	jpeg := []byte{0xFF, 0xD8, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12, 0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20, 0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29, 0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32, 0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x09, 0xFF, 0xC4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0x2A, 0x9F, 0xFF, 0xD9}
	path := filepath.Join(t.TempDir(), "测试 照片.jpg")
	if err := os.WriteFile(path, jpeg, 0o644); err != nil {
		t.Fatal(err)
	}
	out, err := exec.Command("exiftool", "-q", "-overwrite_original", "-DateTimeOriginal=2024:05:01 18:30:00", path).CombinedOutput()
	if err != nil {
		t.Fatalf("写入测试 EXIF 失败: %v: %s", err, out)
	}
	return path
}

func readDate(t *testing.T, out []byte) string {
	t.Helper()
	var list []map[string]any
	if err := json.Unmarshal(out, &list); err != nil || len(list) != 1 {
		t.Fatalf("输出不是一条 JSON: %v: %s", err, out)
	}
	s, _ := list[0]["DateTimeOriginal"].(string)
	return s
}

func TestPoolReadsRepeatedlyAndConcurrently(t *testing.T) {
	path := newSample(t)
	pool := NewPool(3, "-json", "-n")
	defer pool.Close()

	var wg sync.WaitGroup
	for range 20 {
		wg.Go(func() {
			out, err := pool.Run(context.Background(), path)
			if err != nil {
				t.Error(err)
				return
			}
			if got := readDate(t, out); got != "2024:05:01 18:30:00" {
				t.Errorf("DateTimeOriginal = %q", got)
			}
		})
	}
	wg.Wait()
	if n := len(pool.slots); n > 3 {
		t.Errorf("启动了 %d 个进程，超过上限 3", n)
	}
}

func TestPoolReportsMissingFile(t *testing.T) {
	path := newSample(t)
	pool := NewPool(1, "-json", "-n")
	defer pool.Close()

	_, err := pool.Run(context.Background(), filepath.Join(t.TempDir(), "不存在.jpg"))
	if err == nil || !strings.Contains(err.Error(), "File not found") {
		t.Fatalf("err = %v, want File not found", err)
	}
	// 出错后同一个进程还能继续用
	if _, err := pool.Run(context.Background(), path); err != nil {
		t.Fatal(err)
	}
}

func TestPoolRecoversAfterCancel(t *testing.T) {
	path := newSample(t)
	pool := NewPool(1, "-json", "-n")
	defer pool.Close()

	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := pool.Run(ctx, path); err == nil {
		t.Fatal("取消的 context 应该返回错误")
	}
	// 被取消的进程会被丢掉，下次重新启动一个
	ctx2, cancel2 := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel2()
	out, err := pool.Run(ctx2, path)
	if err != nil {
		t.Fatal(err)
	}
	if got := readDate(t, out); got != "2024:05:01 18:30:00" {
		t.Errorf("DateTimeOriginal = %q", got)
	}
}
