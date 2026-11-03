package faces

import "testing"

func TestPortraitRect(t *testing.T) {
	// 脸在正中，照片够大：宽 = 脸宽 × portraitWidth，3:4，脸在左右正中、上面 40% 处
	r := portraitRect(500, 500, 100, 1000, 1000)
	if r.Dx() != 260 || r.Dy() != 347 || r.Min.X != 370 || r.Min.Y != 361 {
		t.Errorf("正中 = %v", r)
	}
	// 脸贴着左上角：整个挪回照片里
	if r := portraitRect(30, 30, 100, 1000, 1000); r.Min.X != 0 || r.Min.Y != 0 || r.Dx() != 260 {
		t.Errorf("左上角 = %v", r)
	}
	// 脸很大、照片放不下：按比例缩小，还是 3:4
	r = portraitRect(500, 400, 600, 1000, 800)
	if r.Dy() != 800 || r.Dx() != 600 || r.Min.X != 200 || r.Min.Y != 0 {
		t.Errorf("放不下 = %v", r)
	}
}
