package assets

import "testing"

func TestUniqueName(t *testing.T) {
	used := map[string]bool{}
	got := []string{
		uniqueName(used, "IMG_0001.jpg"),
		uniqueName(used, "IMG_0001.jpg"),
		uniqueName(used, "img_0001.JPG"), // 大小写不同在 Windows、macOS 上也是同一个文件
		uniqueName(used, "IMG_0002.jpg"),
	}
	want := []string{"IMG_0001.jpg", "IMG_0001 (1).jpg", "img_0001 (2).JPG", "IMG_0002.jpg"}
	for i := range want {
		if got[i] != want[i] {
			t.Errorf("第 %d 个: 得到 %q，应该是 %q", i, got[i], want[i])
		}
	}
}
