package assets

import (
	"context"
	"math"
	"net/http"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// 相册横幅：从相册里挑一张最适合铺在顶上的照片，并告诉网页人脸在哪，裁的时候别把脸裁掉。
//
// 横幅又宽又矮（电脑上大约 4:1 以上），一张 3:2 的横图放进去只露出中间一窄条——人脸多半在上三分之一，
// 照着正中间裁，露出来的常常是胸口。所以挑的时候看这几件事，按加分从多到少：
//  1. 是不是横图：加分最多，横图放进横幅裁得最少，照片展示得最完整；竖图裁完只剩一小条
//  2. 有没有清楚的人脸、脸放不放得进横幅：所有脸（往上多留一点头发）的上下跨度，
//     要放得进横幅能露出来的那一窄条；放得进的加分，放不进的扣分
//  3. 好不好看：CLIP 算的 beauty，收藏、星级加分
//
// 裁的位置由网页按横幅实际的宽高算（见 web 的 AlbumHero），这里只给出要对准的那一点（focus，0–1）。

const (
	heroCandidates = 1000 // 最多看相册里的前这么多张，大相册不用全读
	heroBannerWide = 4.0  // 按电脑上横幅的宽高比估计露出来多少；手机上横幅没那么扁，放得进的只会更多
	heroLandscape  = 1.3  // 宽比高大这么多才算横图
)

// heroFace 是一张脸在照片里的位置，都是 0–1（相对照片显示出来的宽高）
type heroFace struct{ X, Y, W, H float64 }

// heroFocus 是横幅要对准的点（0–1），照片里没有清楚的人脸时为 nil，网页照默认的位置裁
type heroFocus struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// heroScore 给一张照片打分，越高越适合做横幅；同时返回要对准的点
func heroScore(a *Asset, faces []heroFace) (float64, *heroFocus) {
	beauty := 0.3
	if a.Beauty != nil {
		beauty = float64(*a.Beauty)
	}
	score := beauty + float64(a.Rating)*0.05
	if a.Favorite {
		score += 0.25
	}
	ratio := 1.5
	if a.Width != nil && a.Height != nil && *a.Width > 0 && *a.Height > 0 {
		ratio = float64(*a.Width) / float64(*a.Height)
	}
	if ratio >= heroLandscape {
		// 横图加分最多（比人脸能加的还多）：放进横幅裁得少，照片能完整地展示出来；越宽裁得越少，再多加一点
		score += 0.5 + 0.2*(math.Min(ratio, 2.5)-heroLandscape)
	}
	if len(faces) == 0 {
		return score, nil
	}

	// 所有脸合起来的范围；脸框只到额头，往上多留半张脸给头发，往下留一点给下巴
	top, bottom, left, right, biggest := 1.0, 0.0, 1.0, 0.0, 0.0
	for _, f := range faces {
		top = math.Min(top, f.Y-0.5*f.H)
		bottom = math.Max(bottom, f.Y+1.1*f.H)
		left = math.Min(left, f.X)
		right = math.Max(right, f.X+f.W)
		biggest = math.Max(biggest, f.W*f.H)
	}
	top, bottom = math.Max(0, top), math.Min(1, bottom)

	visible := math.Min(1, ratio/heroBannerWide) // 横幅里露出来的那一条占照片高度的多少
	fit := 1.0
	if span := bottom - top; span > visible {
		fit = visible / span
	}
	score += 0.35*fit + 0.1*math.Min(1, biggest*25) // 脸都放得进、脸不太小的最好
	if fit < 0.6 {
		score -= 0.3 * (1 - fit) // 放不进，裁出来只剩半张脸
	}
	return score, &heroFocus{X: (left + right) / 2, Y: (top + bottom) / 2}
}

// pickHeroAsset 从候选照片里挑分数最高的一张（视频不用：缩略图是第一帧，常常不好看）
func pickHeroAsset(list []*Asset, faces map[uuid.UUID][]heroFace) (*Asset, *heroFocus) {
	var best *Asset
	var bestFocus *heroFocus
	bestScore := math.Inf(-1)
	for _, a := range list {
		if a.Type != "image" || !a.HasThumbnail {
			continue
		}
		if s, focus := heroScore(a, faces[a.ID]); s > bestScore {
			best, bestFocus, bestScore = a, focus, s
		}
	}
	return best, bestFocus
}

// hero 返回相册横幅用的照片和要对准的点：GET /api/assets/hero?album=<相册 ID>，
// 返回 {asset, focus}；相册里没有能用的照片时 asset 为 null
func (s *Service) hero(w http.ResponseWriter, r *http.Request) {
	album, err := uuid.Parse(r.URL.Query().Get("album"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "album 应该是相册 ID")
		return
	}
	list, _, err := s.store.Page(r.Context(), Filter{Album: &album, User: auth.UserID(r.Context())}, nil, heroCandidates)
	if err != nil {
		storeError(w, err)
		return
	}
	faces, err := s.store.goodFaces(r.Context(), list)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	a, focus := pickHeroAsset(list, faces)
	httpx.JSON(w, http.StatusOK, map[string]any{"asset": a, "focus": focus})
}

// goodFaces 一次查出这些照片里清楚的人脸（good：够大、够清楚、不太侧），太小太糊的脸不用管裁不裁得到
func (s *Store) goodFaces(ctx context.Context, list []*Asset) (map[uuid.UUID][]heroFace, error) {
	ids := make([]uuid.UUID, 0, len(list))
	for _, a := range list {
		if a.Type == "image" {
			ids = append(ids, a.ID)
		}
	}
	out := map[uuid.UUID][]heroFace{}
	if len(ids) == 0 {
		return out, nil
	}
	rows, err := s.db.QueryContext(ctx,
		`SELECT asset_id, box_x, box_y, box_w, box_h FROM faces WHERE good AND asset_id = ANY($1::uuid[])`, uuidStrings(ids))
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var id uuid.UUID
		var f heroFace
		if err := rows.Scan(&id, &f.X, &f.Y, &f.W, &f.H); err != nil {
			return nil, err
		}
		out[id] = append(out[id], f)
	}
	return out, rows.Err()
}
