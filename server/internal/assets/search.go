package assets

import (
	"context"
	"net/http"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

// SearchCategory 是一个自动分类（截图、证件……），键存在 assets.tags 里（见 clip 包）
type SearchCategory struct {
	Key   string `json:"key"`
	Label string `json:"label"`
}

// SetSearch 接上按意思搜照片的功能、自动分类的列表和 CLIP 模型（clip 包提供；没接时搜索词不起作用，
// 连拍整理只按拍摄时间分组）
func (s *Service) SetSearch(searcher Searcher, categories []SearchCategory, clipModel func() string) {
	s.store.searcher = searcher
	s.categories = categories
	s.clipModel = clipModel
}

// Option 是搜索框里一个可以选的筛选值和有多少张
type Option struct {
	Value string `json:"value"`
	Label string `json:"label,omitempty"`
	Count int    `json:"count"`
}

// searchOptions：GET /api/search/options，搜索框里能选的筛选：分类、相机、镜头（只列有照片的，多的在前）。
// 人物另有 /api/people
func (s *Service) searchOptions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	resp := map[string][]Option{"categories": {}, "cameras": {}, "lenses": {}}
	for _, c := range s.categories {
		f := Filter{Tag: c.Key}
		var n int
		args := []any{}
		if err := s.db.QueryRowContext(ctx, `SELECT count(*) FROM assets`+f.where(&args), args...).Scan(&n); err != nil {
			httpx.InternalError(w, err)
			return
		}
		if n > 0 {
			resp["categories"] = append(resp["categories"], Option{Value: c.Key, Label: c.Label, Count: n})
		}
	}
	for key, field := range map[string]string{"cameras": "camera", "lenses": "lens"} {
		list, err := s.countBy(ctx, smartFields[field].expr)
		if err != nil {
			httpx.InternalError(w, err)
			return
		}
		resp[key] = list
	}
	httpx.JSON(w, http.StatusOK, resp)
}

// countBy 按 expr 的值数照片（平时能看见的），多的在前，最多 50 个
func (s *Service) countBy(ctx context.Context, expr string) ([]Option, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT `+expr+` AS v, count(*) FROM assets
		WHERE `+scopeConditions[ScopeNormal]+` AND `+expr+` IS NOT NULL AND `+expr+` <> ''
		GROUP BY v ORDER BY count(*) DESC, v LIMIT 50`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []Option{}
	for rows.Next() {
		var o Option
		if err := rows.Scan(&o.Value, &o.Count); err != nil {
			return nil, err
		}
		list = append(list, o)
	}
	return list, rows.Err()
}
