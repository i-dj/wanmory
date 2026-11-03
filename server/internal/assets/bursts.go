package assets

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"slices"
	"time"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

const (
	burstGap      = 2 * time.Second  // 同一台相机前后两张隔这么近，算同一组连拍
	similarGap    = 60 * time.Second // 隔得再久一点，但看起来几乎一样（同一个场景换个姿势补拍几张），也算一组
	similarMin    = 0.93             // 「几乎一样」：CLIP 向量的余弦相似度。同一场景接着拍 0.94–0.98，换了场景、姿势 0.7–0.89
	maxBurstGroup = 60               // 一组最多这么多张，再多的是连拍模式按住不放，照样列出但只看前面的
)

// BurstPhoto 是一组连拍里的一张。Score 越高越好：脸清楚、睁眼看镜头的优先，没有脸时看文件大小
// （同一台相机、同样设置，糊的照片细节少，压出来的文件小）
type BurstPhoto struct {
	ID    uuid.UUID `json:"id"`
	Taken time.Time `json:"taken"`
	Score float64   `json:"score"`
	Size  int64     `json:"size"`
}

// Burst 是一组连拍、同一个场景接着拍的几张（看起来几乎一样），或者同一张照片存了几份（拍摄时间一样）
type Burst struct {
	Photos    []BurstPhoto `json:"photos"` // 按拍摄时间排
	Best      uuid.UUID    `json:"best"`
	Duplicate bool         `json:"duplicate"` // 每张的拍摄时间都一样，多半是同一张存了几份
	Similar   bool         `json:"similar"`   // 有几张隔了好几秒，是按「看起来几乎一样」归到一起的，不是连拍
}

// bursts：GET /api/bursts，还没整理过的连拍，最近的在前
func (s *Service) bursts(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	// 每台相机的照片按时间排，每张和前一张比像不像（CLIP 向量；还没算向量的是 NULL，只按时间判断）。
	// 按相机分开比，中间夹着别的手机拍的照片也不会把一组断开；.jpg、.jpeg 存了两份的时间一样、几乎一模一样，自然归进同一组
	rows, err := s.db.QueryContext(ctx, `
		SELECT a.id, a.taken_at, a.file_size, COALESCE(a.exif->>'BurstUUID', ''), COALESCE(a.exif->>'Model', '') AS model,
			1 - (e.embedding <=> lag(e.embedding) OVER w)
		FROM assets a
		LEFT JOIN clip_embeddings e ON e.asset_id = a.id AND e.model_id = $1
		WHERE `+scopeConditions[ScopeNormal]+` AND a.type = 'image' AND a.taken_at IS NOT NULL AND NOT a.burst_reviewed
		WINDOW w AS (PARTITION BY COALESCE(a.exif->>'Model', '') ORDER BY a.taken_at, a.id)
		ORDER BY model, a.taken_at, a.id`, s.clipModel())
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	type row struct {
		photo        BurstPhoto
		burst, model string
		similar      sql.NullFloat64 // 和同一台相机的前一张有多像
		bySimilar    bool            // 是因为像才接在前一张后面的（隔得比 burstGap 久）
	}
	var groups [][]row
	var cur []row
	flush := func() {
		if len(cur) >= 2 {
			groups = append(groups, cur)
		}
		cur = nil
	}
	for rows.Next() {
		var x row
		if err := rows.Scan(&x.photo.ID, &x.photo.Taken, &x.photo.Size, &x.burst, &x.model, &x.similar); err != nil {
			rows.Close()
			httpx.InternalError(w, err)
			return
		}
		if n := len(cur); n > 0 {
			prev := cur[n-1]
			gap := x.photo.Taken.Sub(prev.photo.Taken)
			same := prev.model == x.model && gap <= burstGap
			if !same && prev.model == x.model && gap <= similarGap && x.similar.Valid && x.similar.Float64 >= similarMin {
				same, x.bySimilar = true, true
			}
			if x.burst != "" && x.burst == prev.burst {
				same = true // iPhone 的连拍有同一个 BurstUUID，隔得再久也是一组
			}
			if !same || n >= maxBurstGroup {
				flush()
			}
		}
		cur = append(cur, x)
	}
	flush()
	rows.Close()
	if err := rows.Err(); err != nil {
		httpx.InternalError(w, err)
		return
	}

	// 照片里的脸好不好：每张脸 1 分（好脸）+ 清晰度（最多 1 分）- 侧脸扣分，取平均
	var ids []uuid.UUID
	for _, g := range groups {
		for _, x := range g {
			ids = append(ids, x.photo.ID)
		}
	}
	faceScore := map[uuid.UUID]float64{}
	if len(ids) > 0 {
		frows, err := s.db.QueryContext(ctx, `
			SELECT asset_id, avg((CASE WHEN good THEN 1 ELSE 0 END) + least(blur, 300) / 300 - abs(yaw) * 0.5)
			FROM faces WHERE asset_id = ANY($1) GROUP BY asset_id`, ids)
		if err != nil {
			httpx.InternalError(w, err)
			return
		}
		for frows.Next() {
			var id uuid.UUID
			var v float64
			if err := frows.Scan(&id, &v); err != nil {
				frows.Close()
				httpx.InternalError(w, err)
				return
			}
			faceScore[id] = v
		}
		frows.Close()
		if err := frows.Err(); err != nil {
			httpx.InternalError(w, err)
			return
		}
	}

	list := make([]Burst, 0, len(groups))
	for _, g := range groups {
		var maxSize int64
		for _, x := range g {
			maxSize = max(maxSize, x.photo.Size)
		}
		b := Burst{Duplicate: true}
		best := -1.0
		for _, x := range g {
			p := x.photo
			p.Score = faceScore[p.ID]*2 + float64(p.Size)/float64(max(maxSize, 1))
			if p.Score > best {
				best = p.Score
				b.Best = p.ID
			}
			if !p.Taken.Equal(g[0].photo.Taken) {
				b.Duplicate = false
			}
			b.Similar = b.Similar || x.bySimilar
			b.Photos = append(b.Photos, p)
		}
		list = append(list, b)
	}
	// 最近的在前（上面是按相机分开排的）
	slices.SortFunc(list, func(a, b Burst) int { return b.Photos[0].Taken.Compare(a.Photos[0].Taken) })
	httpx.JSON(w, http.StatusOK, list)
}

// reviewBursts：POST /api/bursts/review，请求体 {"ids": [...], "trash": [...]}：ids 是整理过的一组（或几组）照片，
// 以后不再列出来；trash 是其中不要的，放进「最近删除」（还能恢复）
func (s *Service) reviewBursts(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDs   []uuid.UUID `json:"ids"`
		Trash []uuid.UUID `json:"trash"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&req); err != nil || len(req.IDs) == 0 {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	tx, err := s.db.BeginTx(r.Context(), nil)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(r.Context(),
		`UPDATE assets SET burst_reviewed = true, updated_at = now() WHERE id = ANY($1)`, req.IDs); err != nil {
		httpx.InternalError(w, err)
		return
	}
	if len(req.Trash) > 0 {
		if _, err := tx.ExecContext(r.Context(),
			`UPDATE assets SET deleted_at = now(), updated_at = now() WHERE id = ANY($1) AND deleted_at IS NULL`, req.Trash); err != nil {
			httpx.InternalError(w, err)
			return
		}
	}
	if err := tx.Commit(); err != nil {
		httpx.InternalError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
