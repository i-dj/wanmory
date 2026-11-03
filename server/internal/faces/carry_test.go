package faces

import (
	"testing"

	"github.com/google/uuid"
)

func TestPlacedTake(t *testing.T) {
	a, b := uuid.New(), uuid.New()
	old := placed{
		{box: [4]float64{0.10, 0.10, 0.20, 0.20}, person: a},
		{box: [4]float64{0.60, 0.10, 0.20, 0.20}, person: b},
	}
	// 新模型找到的框和原来的差一点，还是同一张脸
	if p, ok := old.take([4]float64{0.11, 0.12, 0.19, 0.20}); !ok || p != a {
		t.Fatalf("第一张脸应该沿用 a，得到 %v %v", p, ok)
	}
	// 同一张原来的脸不能给两次
	if _, ok := old.take([4]float64{0.10, 0.10, 0.20, 0.20}); ok {
		t.Fatal("a 已经用过了，不该再给")
	}
	// 不重合的新脸不沿用
	if _, ok := old.take([4]float64{0.40, 0.60, 0.10, 0.10}); ok {
		t.Fatal("没重合的脸不该沿用人物")
	}
	if p, ok := old.take([4]float64{0.62, 0.11, 0.18, 0.19}); !ok || p != b {
		t.Fatalf("第二张脸应该沿用 b，得到 %v %v", p, ok)
	}
}
