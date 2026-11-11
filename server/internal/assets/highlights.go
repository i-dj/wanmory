package assets

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// Aesthetic 返回「好照片」在 CLIP 向量空间里的方向和对应的模型（见 clip 包的 aesthetic.go）
type Aesthetic func(ctx context.Context) (vec []float32, model string, err error)

// SetAesthetic 接上给精选轮播排先后用的「好照片」方向；没接上或者 AI 服务连不上时退回用 beauty 排
func (s *Service) SetAesthetic(a Aesthetic) { s.store.aesthetic = a }

// subjectFace 是算作照片主角的人脸：认出是谁的、够清楚的，或者占画面 1% 以上的（背景里很小的路人脸不算）
const subjectFace = `(good OR person_id IS NOT NULL OR box_w * box_h > 0.01)`

// Highlights 挑出最好看的几张横图给图库顶上的轮播。
//
// 候选：照片（不要视频、动图、截图、文档、证件）、有大图、没被点过「不再精选」、beauty 不低（拍坏了的不要），
// 而且要能铺满又宽又矮的轮播画面：至少 3:2 那么宽；有人脸的照片会按人脸裁，4:3 也行（宽比高大 1.3 倍）。
// 人脸太散、铺满会切到人的，网页再拿掉（要看画面多大）。
// 排序：先看照片在「好照片」方向上的投影在整个候选里排第几（0–1 的百分位，CLIP 只适合比先后，不适合当绝对分数），
// 再给收藏的加 0.35、每颗星加 0.08：自己挑过的照片更容易上轮播。
// 同一天只留分最高的一张（不然一组连拍全占了），按分从高到低取 limit 张。
// slideshow 是给「播放精选」幻灯片挑的：竖图也要（幻灯片全屏放，不用裁），挑出来的按拍摄时间从早到晚排，像翻一本相册
func (s *Store) Highlights(ctx context.Context, f Filter, limit int, slideshow bool) ([]*Asset, error) {
	if err := s.resolve(ctx, &f); err != nil {
		return nil, err
	}
	args := []any{limit}
	art := `beauty`
	if s.aesthetic != nil {
		if vec, model, err := s.aesthetic(ctx); err == nil {
			args = append(args, vectorText(vec), model)
			art = fmt.Sprintf(`(SELECT -(e.embedding <#> $%d::vector) FROM clip_embeddings e
				WHERE e.asset_id = assets.id AND e.model_id = $%d)`, len(args)-1, len(args))
		} else {
			log.Printf("精选：拿不到好照片的方向，先按 beauty 排: %v", err)
		}
	}
	shape := `(width >= height * 1.45 OR (width >= height * 1.3 AND EXISTS (SELECT 1 FROM faces WHERE asset_id = assets.id AND ` + subjectFace + `)))`
	order := `top.best_score DESC`
	if slideshow {
		shape, order = `true`, takenExpr
	}
	query := `WITH pool AS (
		SELECT id, date_trunc('day', ` + takenExpr + `) AS day, favorite, rating, ` + art + ` AS art
		FROM assets` + f.where(&args) + `
		  AND type = 'image' AND mime_type <> 'image/gif' AND preview_path IS NOT NULL
		  AND beauty >= 0.5 AND NOT no_highlight
		  AND ` + shape + `
		  AND NOT (tags && '{screenshot,document,id}')
	), ranked AS (
		SELECT id, day, percent_rank() OVER (ORDER BY art)
		       + CASE WHEN favorite THEN 0.35 ELSE 0 END + rating * 0.08 AS score
		FROM pool WHERE art IS NOT NULL
	), best AS (
		SELECT DISTINCT ON (day) id AS best_id, score AS best_score FROM ranked ORDER BY day, score DESC
	), top AS (SELECT * FROM best ORDER BY best_score DESC LIMIT $1)
	SELECT ` + assetColumns + ` FROM assets JOIN top ON top.best_id = assets.id ORDER BY ` + order
	list, err := s.query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	return list, s.fillSubjects(ctx, list)
}

// fillSubjects 给每张照片填上主角人脸（subjectFace）合在一起的外框，网页裁图时让人脸留在画面里。没有人脸的照片不填
func (s *Store) fillSubjects(ctx context.Context, list []*Asset) error {
	if len(list) == 0 {
		return nil
	}
	ids := make([]uuid.UUID, len(list))
	byID := map[uuid.UUID]*Asset{}
	for i, a := range list {
		ids[i] = a.ID
		byID[a.ID] = a
	}
	rows, err := s.db.QueryContext(ctx, `
		SELECT asset_id, min(box_x), min(box_y), max(box_x + box_w), max(box_y + box_h) FROM faces
		WHERE asset_id = ANY($1::uuid[]) AND `+subjectFace+`
		GROUP BY asset_id`, uuidStrings(ids))
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id uuid.UUID
		var x0, y0, x1, y1 float64
		if err := rows.Scan(&id, &x0, &y0, &x1, &y1); err != nil {
			return err
		}
		if a := byID[id]; a != nil {
			a.Subject = &Box{X: x0, Y: y0, W: x1 - x0, H: y1 - y0}
		}
	}
	return rows.Err()
}

// vectorText 把向量写成 pgvector 认的文字 [0.1,0.2,…]
func vectorText(v []float32) string {
	parts := make([]string, len(v))
	for i, x := range v {
		parts[i] = strconv.FormatFloat(float64(x), 'f', -1, 32)
	}
	return "[" + strings.Join(parts, ",") + "]"
}

// highlights：GET /api/assets/highlights?limit=8，筛选参数和 list 一样（图库筛选菜单选的类型、成员）。
// 带 for=slideshow 时是播放精选用的：竖图也要，按拍摄时间排（最多 100 张）
func (s *Service) highlights(w http.ResponseWriter, r *http.Request) {
	limit := queryInt(r, "limit", 8, 1, 100)
	f, err := ParseFilter(r.URL.Query())
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	f.User = auth.UserID(r.Context())
	list, err := s.store.Highlights(r.Context(), f, limit, r.URL.Query().Get("for") == "slideshow")
	if err != nil {
		storeError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

// skipHighlight：POST /api/assets/highlights/skip，请求体 {"id": "..."}：这张以后不放进精选轮播（访客改不了，见 auth 的 guestAllowed）
func (s *Service) skipHighlight(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID uuid.UUID `json:"id"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<10)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if _, err := s.db.ExecContext(r.Context(), `UPDATE assets SET no_highlight = true WHERE id = $1`, req.ID); err != nil {
		httpx.InternalError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
