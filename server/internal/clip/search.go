package clip

import (
	"context"
	"database/sql"
	"fmt"
	"math"
	"strings"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/geo"
)

const (
	searchCandidates = 400  // 按意思搜时先取最像的这么多张
	maxTextMatches   = 2000 // 按字搜最多这么多张
	searchSpread     = 0.05 // 只要和最像的那张差不多像的（相似度差在这以内）
	searchFloor      = 0.15 // 相似度再低就不算（Chinese-CLIP 图文相似度一般在 0.1–0.3 之间）
	// 最像的那张都没到这个分，就是图库里根本没有对得上的（搜「大米」最像的才 0.179），一张也不给，
	// 不然上面几条都是相对的，最像的再不像，跟它差不多的几十张也会被当成结果。
	// 按 ViT-H/14 在实际图库上量的：真有的东西（游泳池、海边、婴儿、火锅、雪山……）最像的都在 0.215 以上
	searchMinBest = 0.20
	// 还要明显比这个搜索词和图库里一般照片的相似度高：高出平均值这么多个标准差。
	// 不同的词「噪声」差得很多（「生日蛋糕」和普通照片 0.11 左右，「过户登记价格」0.17），固定的分数线不行
	searchSigmas = 2.0
	// 照片里有这些字、或者在这个地方拍的照片时，这个词多半是在找字（证件、文件、截图）或地点，按意思搜的部分要求更严，只留非常像的
	searchSigmasText = 3.5
)

// Search 找和 text 对得上的照片：照片里认出了这些字的（每个词都要有，不分大小写、不管空格）在前，
// 再是在这个地方拍的（城市、省州、国家，见 searchPlace），最后加上意思上最像的（CLIP）。
// 只返回明显对得上的，搜「海边」不会把整个图库都搜出来
func (s *Service) Search(ctx context.Context, text string) ([]uuid.UUID, error) {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, nil
	}
	byText, err := s.searchText(ctx, text)
	if err != nil {
		return nil, err
	}
	byPlace, err := s.searchPlace(ctx, text)
	if err != nil {
		return nil, err
	}
	// 字或者地点对上了，这个词多半就是在找它们，按意思搜的部分要求更严
	byMeaning, err := s.searchMeaning(ctx, text, len(byText) > 0 || len(byPlace) > 0)
	if err != nil {
		return nil, err
	}
	seen := map[uuid.UUID]bool{}
	var ids []uuid.UUID
	for _, list := range [][]uuid.UUID{byText, byPlace, byMeaning} {
		for _, id := range list {
			if !seen[id] {
				seen[id] = true
				ids = append(ids, id)
			}
		}
	}
	return ids, nil
}

// placeAliases 是常说的简称，搜的时候换成地址里的写法（Nominatim 给的是全称：加利福尼亚州、佛罗里达州……）
var placeAliases = map[string]string{
	"加州": "加利福尼亚", "佛州": "佛罗里达", "德州": "得克萨斯", "麻州": "马萨诸塞", "宾州": "宾夕法尼亚",
	"华州": "华盛顿州", "俄州": "俄勒冈", "纽约州": "纽约",
}

// searchPlace 按拍摄地点找：搜索词按空格分开，每一段都要出现在照片所在的城市、省州、国家或者用户选的地名里。
// 城市名来自 geo 包查好存在 geo_places 里的
func (s *Service) searchPlace(ctx context.Context, text string) ([]uuid.UUID, error) {
	var conds []string
	var args []any
	for _, term := range strings.Fields(text) {
		if alias, ok := placeAliases[term]; ok {
			term = alias
		}
		args = append(args, "%"+escapeLike(term)+"%")
		n := len(args)
		conds = append(conds, fmt.Sprintf(`(g.city ILIKE $%d OR g.state ILIKE $%d OR g.country ILIKE $%d OR a.place_name ILIKE $%d)`, n, n, n, n))
	}
	args = append(args, maxTextMatches)
	rows, err := s.db.QueryContext(ctx, `
		SELECT a.id FROM assets a JOIN geo_places g ON g.key = `+geo.KeyExpr+`
		WHERE a.deleted_at IS NULL AND `+strings.Join(conds, " AND ")+`
		ORDER BY COALESCE(a.taken_at, a.file_mtime) DESC
		LIMIT $`+fmt.Sprint(len(args)), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// searchText 按认出来的字找：搜索词按空格分开，每一段都要出现在照片的字里
func (s *Service) searchText(ctx context.Context, text string) ([]uuid.UUID, error) {
	var conds []string
	var args []any
	for _, term := range strings.Fields(strings.ToLower(text)) {
		args = append(args, "%"+escapeLike(term)+"%")
		conds = append(conds, fmt.Sprintf(`ocr_norm LIKE $%d`, len(args)))
	}
	args = append(args, maxTextMatches)
	rows, err := s.db.QueryContext(ctx, `
		SELECT id FROM assets WHERE deleted_at IS NULL AND `+strings.Join(conds, " AND ")+`
		LIMIT $`+fmt.Sprint(len(args)), args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			return nil, err
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// searchMeaning 按意思找（CLIP）：要和最像的那张差不多像，还要明显比一般照片像。strict 时（照片里有这些字）要求更严
func (s *Service) searchMeaning(ctx context.Context, text string, strict bool) ([]uuid.UUID, error) {
	model, dim, err := s.searchModel(ctx)
	if err != nil {
		return nil, err
	}
	vec, err := s.queryVector(ctx, model, text)
	if err != nil {
		return nil, err
	}
	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{ReadOnly: true})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	lit := vectorLiteral(vec)
	cast := fmt.Sprintf("::vector(%d)", dim)

	// 这个词和整个图库的相似度的平均值、标准差。一万张照片也就算几毫秒
	var mean, std sql.NullFloat64
	if err := tx.QueryRowContext(ctx, `
		SELECT avg(1 - (embedding`+cast+` <=> $1`+cast+`)), stddev(1 - (embedding`+cast+` <=> $1`+cast+`))
		FROM clip_embeddings WHERE model_id = $2`, lit, model).Scan(&mean, &std); err != nil {
		return nil, err
	}
	if !mean.Valid || !std.Valid {
		return nil, nil // 还没有照片算过向量
	}
	sigmas := searchSigmas
	if strict {
		sigmas = searchSigmasText
	}

	// 写成 embedding::vector(1024) <=> ... 并带上 model_id 条件，才用得上 00002 迁移建的向量索引
	if _, err := tx.ExecContext(ctx, `SET LOCAL hnsw.ef_search = 500`); err != nil {
		return nil, err
	}
	rows, err := tx.QueryContext(ctx, `
		SELECT e.asset_id, 1 - (e.embedding`+cast+` <=> $1`+cast+`)
		FROM clip_embeddings e
		WHERE e.model_id = $2
		ORDER BY e.embedding`+cast+` <=> $1`+cast+`
		LIMIT $3`, lit, model, searchCandidates)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var ids []uuid.UUID
	cutoff := math.Inf(1)
	for rows.Next() {
		var id uuid.UUID
		var sim float64
		if err := rows.Scan(&id, &sim); err != nil {
			return nil, err
		}
		if math.IsInf(cutoff, 1) { // 第一张是最像的
			if sim < searchMinBest {
				break
			}
			cutoff = math.Max(searchFloor, math.Max(mean.Float64+sigmas*std.Float64, sim-searchSpread))
		}
		if sim < cutoff {
			break
		}
		ids = append(ids, id)
	}
	return ids, rows.Err()
}

// searchModel 是搜索用哪个模型的向量：一般是现在的模型；刚换了档位、新模型的向量还没追上时，
// 用照片最多的那个旧模型（新模型算到九成就换过去），换的过程中搜索不会突然只剩一部分照片
func (s *Service) searchModel(ctx context.Context) (string, int, error) {
	current, dim := s.current()
	rows, err := s.db.QueryContext(ctx, `SELECT model_id, count(*) FROM clip_embeddings GROUP BY model_id`)
	if err != nil {
		return "", 0, err
	}
	defer rows.Close()
	counts := map[string]int{}
	best := current
	for rows.Next() {
		var m string
		var n int
		if err := rows.Scan(&m, &n); err != nil {
			return "", 0, err
		}
		if _, ok := dims[m]; !ok {
			continue
		}
		counts[m] = n
		if n > counts[best] {
			best = m
		}
	}
	if err := rows.Err(); err != nil {
		return "", 0, err
	}
	if best == current || counts[current]*10 >= counts[best]*9 {
		return current, dim, nil
	}
	return best, dims[best], nil
}

// queryVector 是搜索词用 model 算的向量，搜过的记着
func (s *Service) queryVector(ctx context.Context, model, text string) ([]float32, error) {
	key := model + "\x00" + text
	s.queriesMu.Lock()
	vec, ok := s.queries[key]
	s.queriesMu.Unlock()
	if ok {
		return vec, nil
	}
	vecs, err := s.texts(ctx, model, []string{text})
	if err != nil {
		return nil, err
	}
	s.queriesMu.Lock()
	if len(s.queries) > 500 {
		clear(s.queries)
	}
	s.queries[key] = vecs[0]
	s.queriesMu.Unlock()
	return vecs[0], nil
}

// escapeLike 让 % 和 _ 在 LIKE 里当普通字符
func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}
