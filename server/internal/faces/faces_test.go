package faces

import (
	"image"
	"image/color"
	"testing"
)

func TestVectorLiteral(t *testing.T) {
	if got := vectorLiteral([]float32{0.5, -0.25, 1}); got != "[0.500000,-0.250000,1.000000]" {
		t.Errorf("got %s", got)
	}
}

func TestShrink(t *testing.T) {
	src := image.NewRGBA(image.Rect(0, 0, 100, 50))
	for y := range 50 {
		for x := range 100 {
			src.Set(x, y, color.RGBA{R: 200, G: 100, B: 50, A: 255})
		}
	}
	dst := shrink(src, image.Rect(10, 0, 90, 40), 20)
	if b := dst.Bounds(); b.Dx() != 20 || b.Dy() != 10 {
		t.Fatalf("size %v, want 20x10", b)
	}
	if r, g, b, _ := dst.At(5, 5).RGBA(); r>>8 != 200 || g>>8 != 100 || b>>8 != 50 {
		t.Errorf("color %d %d %d", r>>8, g>>8, b>>8)
	}
}
