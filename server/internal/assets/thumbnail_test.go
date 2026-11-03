package assets

import (
	"context"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

// imageSize 用 vipsheader 读出图片的宽高。
func imageSize(t *testing.T, path string) string {
	t.Helper()
	out, err := exec.Command("vipsheader", "-f", "width", path).Output()
	if err != nil {
		t.Fatal(err)
	}
	h, err := exec.Command("vipsheader", "-f", "height", path).Output()
	if err != nil {
		t.Fatal(err)
	}
	return strings.TrimSpace(string(out)) + "x" + strings.TrimSpace(string(h))
}

// 普通 JPEG 解码这条兜底路径：经过 .v 临时文件后，EXIF 方向仍然生效。
func TestPlainJPEGDerivativesKeepsOrientation(t *testing.T) {
	for _, tool := range []string{"vips", "vipsthumbnail", "vipsheader", "exiftool"} {
		if _, err := exec.LookPath(tool); err != nil {
			t.Skipf("没有安装 %s", tool)
		}
	}
	dir := t.TempDir()
	src := filepath.Join(dir, "rotated.jpg")
	// 存储方向是横的 2000×1500，Orientation=6 表示要顺时针转 90 度显示，转正后应该是竖的
	if out, err := exec.Command("vips", "black", src, "2000", "1500", "--bands", "3").CombinedOutput(); err != nil {
		t.Fatalf("生成测试图失败: %v: %s", err, out)
	}
	if out, err := exec.Command("exiftool", "-q", "-overwrite_original", "-Orientation#=6", src).CombinedOutput(); err != nil {
		t.Fatalf("写入方向失败: %v: %s", err, out)
	}

	thumb := filepath.Join(dir, "thumb.webp")
	preview := filepath.Join(dir, "preview.jpeg")
	if err := plainJPEGDerivatives(context.Background(), src, thumb, preview); err != nil {
		t.Fatal(err)
	}
	if got := imageSize(t, preview); got != "1080x1440" {
		t.Errorf("预览图 %s，应该是转正后的 1080x1440", got)
	}
	if got := imageSize(t, thumb); got != "360x480" {
		t.Errorf("缩略图 %s，应该是 360x480", got)
	}
}
