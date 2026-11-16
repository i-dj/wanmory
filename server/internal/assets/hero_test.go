package assets

import (
	"math"
	"testing"

	"github.com/google/uuid"
)

func heroAsset(w, h int, beauty float32) *Asset {
	return &Asset{ID: uuid.New(), Type: "image", HasThumbnail: true, Width: &w, Height: &h, Beauty: &beauty}
}

func TestHeroScore(t *testing.T) {
	// 一张人站在海报前的 3:2 照片，一个人脸在上面：放得进横幅，对准脸
	solo := heroAsset(3000, 2000, 0.5)
	_, focus := heroScore(solo, []heroFace{{X: 0.45, Y: 0.15, W: 0.1, H: 0.12}})
	if focus == nil || math.Abs(focus.X-0.5) > 1e-9 || focus.Y > 0.25 {
		t.Fatalf("focus 应该对准上面的脸，得到 %+v", focus)
	}
	// 没有脸：不给 focus，网页照默认位置裁
	if _, f := heroScore(solo, nil); f != nil {
		t.Fatalf("没有脸时 focus 应该是 nil，得到 %+v", f)
	}
}

func TestPickHeroPrefersVisibleFaces(t *testing.T) {
	// 同样好看：一张一家人上下站成好几排（横幅里放不下），一张人脸并排一行（放得下）——挑后者
	stacked := heroAsset(3000, 2000, 0.6)
	row := heroAsset(3000, 2000, 0.6)
	// 再来一张更好看一点但没有人的风景：有人脸、放得下的照片还是排在前面
	scenery := heroAsset(3000, 2000, 0.7)
	faces := map[uuid.UUID][]heroFace{
		stacked.ID: {{X: 0.4, Y: 0.1, W: 0.1, H: 0.1}, {X: 0.4, Y: 0.7, W: 0.1, H: 0.1}},
		row.ID:     {{X: 0.2, Y: 0.3, W: 0.08, H: 0.08}, {X: 0.6, Y: 0.32, W: 0.08, H: 0.08}},
	}
	got, focus := pickHeroAsset([]*Asset{stacked, scenery, row}, faces)
	if got != row {
		t.Fatalf("应该挑人脸都放得进横幅的那张")
	}
	if focus == nil || focus.Y < 0.25 || focus.Y > 0.4 {
		t.Fatalf("focus 应该在那一排脸上，得到 %+v", focus)
	}
}

func TestPickHeroPrefersLandscape(t *testing.T) {
	// 一张竖图人脸清楚、还更好看一点，一张横图没有人：横图加分最多，挑横图
	portrait := heroAsset(2000, 3000, 0.75)
	landscape := heroAsset(3000, 2000, 0.6)
	faces := map[uuid.UUID][]heroFace{portrait.ID: {{X: 0.4, Y: 0.2, W: 0.2, H: 0.12}}}
	if got, _ := pickHeroAsset([]*Asset{portrait, landscape}, faces); got != landscape {
		t.Fatalf("应该挑横图")
	}
}

func TestPickHeroSkipsVideos(t *testing.T) {
	video := heroAsset(1920, 1080, 0.9)
	video.Type = "video"
	photo := heroAsset(3000, 2000, 0.2)
	if got, _ := pickHeroAsset([]*Asset{video, photo}, nil); got != photo {
		t.Fatalf("视频不该做横幅")
	}
}
