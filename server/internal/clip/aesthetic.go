package clip

import (
	"context"
	"math"
	"sync"
)

// artful、plain 用来给照片打「拍得好不好看」的分（图库顶上的精选轮播用）。
// 和 tags.go 里的 goodLooks / badLooks 不一样：那组只分「拍坏了」和「正常」，正常的照片几乎都是 0.99 以上，
// 挑不出最好的。这里比的是「摄影作品」和「普通生活照」：两组描述的平均向量相减得到一个方向，
// 照片向量在这个方向上投影越大，越像精心拍的好照片。只拿来排先后，不当作绝对分数
var artful = []string{
	"一张获奖的专业摄影作品", "构图精美、光线漂亮的照片", "令人惊叹的风景摄影", "专业摄影师拍的人像",
	"适合做壁纸的美丽照片", "色彩丰富、画面干净的照片", "黄金时刻的温暖光线", "有故事感的抓拍瞬间",
}
var plain = []string{
	"随手拍的普通照片", "画面杂乱的照片", "光线平淡的生活照", "手机随便拍的照片",
	"曝光不好的照片", "构图很差的照片", "拍得很普通的游客照", "没有重点的照片",
}

var aestheticCache struct {
	sync.Mutex
	model string
	vec   []float32
}

// AestheticVector 返回「好照片」的方向（artful 平均向量减 plain 平均向量，归一化）和它是哪个模型算的。
// 第一次用时向 AI 服务要描述的向量，之后记住；换了模型重新要
func (s *Service) AestheticVector(ctx context.Context) ([]float32, string, error) {
	model := s.Model()
	aestheticCache.Lock()
	defer aestheticCache.Unlock()
	if aestheticCache.model == model && aestheticCache.vec != nil {
		return aestheticCache.vec, model, nil
	}
	vecs, err := s.texts(ctx, model, append(append([]string{}, artful...), plain...))
	if err != nil {
		return nil, "", err
	}
	dir := make([]float64, len(vecs[0]))
	for i, v := range vecs {
		w := 1.0 / float64(len(artful))
		if i >= len(artful) {
			w = -1.0 / float64(len(plain))
		}
		for j, x := range v {
			dir[j] += w * float64(x)
		}
	}
	var norm float64
	for _, x := range dir {
		norm += x * x
	}
	norm = math.Sqrt(norm)
	out := make([]float32, len(dir))
	for j, x := range dir {
		out[j] = float32(x / norm)
	}
	aestheticCache.model, aestheticCache.vec = model, out
	return out, model, nil
}
