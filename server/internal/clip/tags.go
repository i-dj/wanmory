package clip

import (
	"context"
	"database/sql"
	"errors"
	"math"
	"strings"
	"unicode"

	"github.com/google/uuid"
)

// Category 是一个自动分类：Key 存在 assets.tags 里，Label 是网页上的名字，Prompts 是用来比的中文描述
type Category struct {
	Key     string
	Label   string
	Prompts []string
}

// categories 改了（加分类、改描述、改规则）要把 categoriesVersion 加一，启动时会把旧版算的分类重算一遍
var categories = []Category{
	{"screenshot", "截图", []string{"手机屏幕截图", "电脑屏幕截图", "聊天记录截图", "手机应用界面截图", "网页截图"}},
	{"id", "证件", []string{"身份证", "护照", "驾驶证", "银行卡", "绿卡", "签证", "社保卡", "手里拿着的证件卡片"}},
	{"document", "文档", []string{"一页文档", "纸质文件", "收据", "发票", "表格", "书本的一页", "合同", "户型图", "手写的字条"}},
	{"food", "美食", []string{"美食", "一盘菜", "一桌饭菜", "一碗面", "蛋糕", "甜点", "饮料"}},
	{"pet", "动物", []string{"一只猫", "一只狗", "宠物", "一只鸟", "动物园里的动物", "野生动物", "水族馆里的鱼"}},
	{"scenery", "风景", []string{"风景", "海边", "大山", "日落", "湖", "森林", "城市夜景"}},
	{"plant", "植物", []string{"一朵花", "一束鲜花", "盆栽", "花海", "花园里的花草", "树叶特写"}},
}

// background 是不属于任何分类的普通照片：普通照片会落到它们身上，不会硬被分进某一类
var background = []string{
	"一个人的照片", "小孩", "婴儿", "家庭合影", "自拍", "朋友聚会", "室内", "街道", "汽车", "建筑", "玩具", "游乐园",
	"商店", "运动", "游泳池", "人像", "全身照", "站在户外的人", "两个人的合影", "抱着孩子的大人",
	"药盒", "商品包装", "招牌", "黑板", "婴儿车里的婴儿", "寺庙", "红包",
}

// goodLooks、badLooks 用来打「好不好看」的分（assets.beauty）：照片和这两组描述比，像好看那组的概率。
// 相册、人物页把分高的放大显示
// 不好看那组只放明显拍坏了、不值得看的（糊、黑、误拍、截图、文件）；景点前的合影、生活照都算好看，
// 不然一家人在城堡前的合影会被当成「随手拍」
var goodLooks = []string{
	"一张清晰好看的照片", "一家人开心的合影", "旅行时在景点前拍的照片", "漂亮的人像照片", "风景优美的照片", "可爱的宝宝照片",
}
var badLooks = []string{
	"一张模糊不清的照片", "昏暗看不清的照片", "不小心拍到的地板或者口袋", "手机屏幕截图", "文件、票据的照片", "拍歪了的照片",
}

const (
	categoriesVersion = "6"
	logitScale        = 100.0 // CLIP 的温度：相似度乘它再做 softmax
	minProb           = 0.6   // 一类的几个描述概率加起来超过这个才算
	sureProb          = 0.9   // 证件没认出证件上的字时，看起来要非常像才算
	minDocumentChars  = 30    // 文档至少认出这么多字（照片里有块招牌、黑板不算文档）
)

// idWords 是证件上会印的字（认出来的字去掉空白、转小写后比）
var idWords = []string{
	"身份证", "公民身份", "驾驶证", "驾驶执照", "护照", "签证", "居住证", "社会保障", "港澳", "通行证",
	"passport", "visa", "driverlicense", "driver'slicense", "driverslicense", "drivinglicense", "permanentresident",
	"identification", "idcard", "residentcard",
}

func Categories() []Category { return categories }

func (s *Service) version(model string) string {
	return model + "/" + ocrModel + "/" + categoriesVersion
}

// retag 按照片的向量和认出来的字重算分类。还没有向量时不算（clip 任务做完会再来）
func (s *Service) retag(ctx context.Context, id uuid.UUID) error {
	model := s.Model()
	var vecText string
	var ocr sql.NullString
	err := s.db.QueryRowContext(ctx, `
		SELECT e.embedding::text, a.ocr_text FROM assets a
		JOIN clip_embeddings e ON e.asset_id = a.id AND e.model_id = $2
		WHERE a.id = $1`, id, model).Scan(&vecText, &ocr)
	if errors.Is(err, sql.ErrNoRows) {
		return nil
	}
	if err != nil {
		return err
	}
	vec, err := parseVector(vecText)
	if err != nil {
		return err
	}
	labels, err := s.labelVectors(ctx, model)
	if err != nil {
		return err
	}
	n := len(labels) - len(goodLooks) - len(badLooks) // 前面是分类和普通照片的描述，后面是好看、不好看的
	tags := decide(probabilities(vec, labels[:n]), ocr.String)
	_, err = s.db.ExecContext(ctx,
		`UPDATE assets SET tags = $2, tags_version = $3, beauty = $4, updated_at = now() WHERE id = $1`,
		id, "{"+strings.Join(tags, ",")+"}", s.version(model), beauty(vec, labels[n:]))
	return err
}

// decide 按每一类的概率和认出来的字定分类（最多一类）：
//   - 证件：看起来像证件，还认出了证件上的字；没认出字（拍糊了、太小）时要非常像；
//   - 文档：看起来像文档，还认出了不少字（不然一块招牌、一面黑板也会算进来）；
//   - 其他：看起来像就行。
func decide(probs map[string]float64, ocr string) []string {
	best, bestProb := "", 0.0
	for _, c := range categories {
		if p := probs[c.Key]; p > bestProb {
			best, bestProb = c.Key, p
		}
	}
	if bestProb < minProb {
		return []string{}
	}
	text := normalize(ocr)
	switch best {
	case "id":
		hasWord := false
		for _, w := range idWords {
			if strings.Contains(text, w) {
				hasWord = true
				break
			}
		}
		if !hasWord && bestProb < sureProb {
			return []string{}
		}
	case "document":
		if countChars(text) < minDocumentChars {
			return []string{}
		}
	}
	return []string{best}
}

// probabilities 按和每个描述的相似度做 softmax，返回每一类的几个描述的概率之和
func probabilities(vec []float32, labels [][]float32) map[string]float64 {
	logits := make([]float64, len(labels))
	top := math.Inf(-1)
	for i, l := range labels {
		logits[i] = dot(vec, l) * logitScale
		top = math.Max(top, logits[i])
	}
	var sum float64
	for i := range logits {
		logits[i] = math.Exp(logits[i] - top)
		sum += logits[i]
	}
	probs := map[string]float64{}
	i := 0
	for _, c := range categories {
		for range c.Prompts {
			probs[c.Key] += logits[i] / sum
			i++
		}
	}
	return probs
}

// beauty 是像 goodLooks 那组的概率（labels 是 goodLooks 接 badLooks 的向量），和分类一样按相似度做 softmax
func beauty(vec []float32, labels [][]float32) float64 {
	logits := make([]float64, len(labels))
	top := math.Inf(-1)
	for i, l := range labels {
		logits[i] = dot(vec, l) * logitScale
		top = math.Max(top, logits[i])
	}
	var good, sum float64
	for i, x := range logits {
		e := math.Exp(x - top)
		sum += e
		if i < len(goodLooks) {
			good += e
		}
	}
	return good / sum
}

// labelVectors 是所有描述（categories 依次排开，再接 background、goodLooks、badLooks）的向量
func (s *Service) labelVectors(ctx context.Context, model string) ([][]float32, error) {
	s.labelsMu.Lock()
	defer s.labelsMu.Unlock()
	if s.labels != nil && s.labelsModel == model {
		return s.labels, nil
	}
	var texts []string
	for _, c := range categories {
		texts = append(texts, c.Prompts...)
	}
	texts = append(texts, background...)
	texts = append(texts, goodLooks...)
	texts = append(texts, badLooks...)
	vecs, err := s.texts(ctx, model, texts)
	if err != nil {
		return nil, err
	}
	s.labels, s.labelsModel = vecs, model
	return vecs, nil
}

// normalize 去掉空白、转小写，和数据库里的 ocr_norm 一样
func normalize(s string) string {
	return strings.Map(func(r rune) rune {
		if unicode.IsSpace(r) {
			return -1
		}
		return unicode.ToLower(r)
	}, s)
}

// countChars 数字母、数字和汉字（标点、符号不算）
func countChars(s string) int {
	n := 0
	for _, r := range s {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			n++
		}
	}
	return n
}
