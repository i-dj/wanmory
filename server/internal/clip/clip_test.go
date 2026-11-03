package clip

import (
	"slices"
	"testing"
)

// unit 是第 i 维为 1 的向量
func unit(dim, i int) []float32 {
	v := make([]float32, dim)
	v[i] = 1
	return v
}

// labelsAndFirst 是每个描述一个方向的向量，和每一类第一个描述的下标
func labelsAndFirst() ([][]float32, map[string]int) {
	n := len(background)
	for _, c := range categories {
		n += len(c.Prompts)
	}
	labels := make([][]float32, n)
	for i := range labels {
		labels[i] = unit(n, i)
	}
	first := map[string]int{}
	i := 0
	for _, c := range categories {
		first[c.Key] = i
		i += len(c.Prompts)
	}
	return labels, first
}

func TestDecide(t *testing.T) {
	labels, first := labelsAndFirst()
	n := len(labels)
	tag := func(key, ocr string) []string {
		return decide(probabilities(unit(n, first[key]), labels), ocr)
	}
	for _, key := range []string{"screenshot", "food", "pet", "scenery"} {
		if got := tag(key, ""); !slices.Equal(got, []string{key}) {
			t.Errorf("正对着 %s 的描述，分类是 %v", key, got)
		}
	}
	// 正对着证件的描述、概率接近 1：没有字也算；文档没有字不算
	if got := tag("id", ""); !slices.Equal(got, []string{"id"}) {
		t.Errorf("非常像证件，分类是 %v", got)
	}
	if got := tag("document", "STARBUCKS"); len(got) != 0 {
		t.Errorf("字太少不该算文档，得到 %v", got)
	}
	if got := tag("document", "过户登记价格确认书 买方 卖方 车辆识别代号 成交价格 本人确认以上信息真实有效"); !slices.Equal(got, []string{"document"}) {
		t.Errorf("认出很多字应该算文档，得到 %v", got)
	}
	if got := decide(probabilities(unit(n, n-1), labels), ""); len(got) != 0 {
		t.Errorf("普通照片不该有分类，得到 %v", got)
	}
}

func TestDecideIDNeedsWords(t *testing.T) {
	// 一半像证件、一半像普通照片：要认出证件上的字才算证件
	probs := map[string]float64{"id": 0.7}
	if got := decide(probs, "药盒 每日三次"); len(got) != 0 {
		t.Errorf("没有证件上的字不该算证件，得到 %v", got)
	}
	if got := decide(probs, "中华人民共和国 居民身份证"); !slices.Equal(got, []string{"id"}) {
		t.Errorf("认出身份证的字应该算证件，得到 %v", got)
	}
	if got := decide(probs, "WASHINGTON DRIVER LICENSE"); !slices.Equal(got, []string{"id"}) {
		t.Errorf("认出驾照的字应该算证件，得到 %v", got)
	}
}

func TestParseVector(t *testing.T) {
	v, err := parseVector("[0.5,-0.25,1]")
	if err != nil || !slices.Equal(v, []float32{0.5, -0.25, 1}) {
		t.Fatalf("parseVector = %v, %v", v, err)
	}
	if got := vectorLiteral(v); got != "[0.500000,-0.250000,1.000000]" {
		t.Errorf("vectorLiteral = %s", got)
	}
	if got := escapeLike(`50%_off`); got != `50\%\_off` {
		t.Errorf("escapeLike = %s", got)
	}
}
