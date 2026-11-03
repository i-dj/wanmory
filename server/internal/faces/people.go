package faces

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"image"
	"image/jpeg"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/assets"
	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

const (
	faceThumbSize = 256 // 人脸小图的边长
	faceMargin    = 1.6 // 小图比人脸框大这么多倍，带上一点头发和下巴
	portraitSize  = 600 // 竖的封面（人物列表上用）的长边，屏幕上一张卡片 300 像素左右宽，两倍清楚
	portraitWidth = 2.6 // 竖封面比人脸框宽这么多倍，带上头发、肩膀
	portraitEyes  = 0.4 // 人脸中心在竖封面从上往下的这个位置
	maxNameLength = 40
)

// Person 是一个人物。Cover 是封面用的那张脸：拍得最好的一张（见 coverFace）
type Person struct {
	ID        uuid.UUID  `json:"id"`
	Name      string     `json:"name"`
	Faces     int        `json:"faces"`
	Assets    int        `json:"assets"` // 有他（她）的照片几张（隐藏、删除了的不算）
	Cover     *uuid.UUID `json:"cover"`
	Birthday  *string    `json:"birthday"` // 2024-05-01，没设置是 null
	CreatedAt time.Time  `json:"created_at"`
}

// coverFace 是人物 p 封面用的那张脸：拍得最好的一张。好脸优先，再按几样打分相乘：
//   - 清楚：拉普拉斯方差（blur）取对数，1500 以上算满分（一般 45–1600，中位数 370 左右）；
//   - 正脸：转头程度（yaw）0 是满分，0.35 以上算侧脸，接近 0 分；
//   - 够大：人脸框宽占照片的 25% 以上算满分（预览图 1440 像素，脸太小放大成封面就糊了）；
//   - 竖封面装得下：脸离照片边上太近（左右各放不下 0.6 张脸宽、上面放不下半张脸高、下面放不下一张脸高）打七折；
//   - 封面里没挤着别人：旁边（竖封面的范围里）有别人的脸打五折，单人照优先；
//   - 检测的把握（score）。
//
// 想再挑表情（笑没笑、眼睛睁没睁）要另外的模型，先不做。
// u 是看的人（SQL 参数，例如 $1）：只从他看得到的照片里挑，见 visibleTo
func coverFace(u string) string {
	return `(SELECT f2.id FROM faces f2 JOIN assets a2 ON a2.id = f2.asset_id
	WHERE f2.person_id = p.id AND ` + visibleTo("a2", u) + `
	ORDER BY f2.good DESC,
		f2.score
		* LEAST(ln(GREATEST(f2.blur, 1)) / ln(1500), 1)
		* GREATEST(0.05, 1 - abs(f2.yaw) / 0.35)
		* LEAST(f2.box_w / 0.25, 1)
		* CASE WHEN f2.box_x >= 0.6 * f2.box_w AND f2.box_x + 1.6 * f2.box_w <= 1
			AND f2.box_y >= 0.5 * f2.box_h AND f2.box_y + 2 * f2.box_h <= 1 THEN 1 ELSE 0.7 END
		* CASE WHEN EXISTS (SELECT 1 FROM faces f3 WHERE f3.asset_id = f2.asset_id AND f3.id <> f2.id
			AND f3.box_w > 0.4 * f2.box_w
			AND abs((f3.box_x + f3.box_w / 2) - (f2.box_x + f2.box_w / 2)) < 1.4 * f2.box_w) THEN 0.5 ELSE 1 END
		DESC LIMIT 1)`
}

// visibleTo 是「照片 a 看的人 u 看得到」：没删除，而且没隐藏、或者是他自己隐藏的。
// 人物是全家共用的（名字、合并大家都看得到），但照片数、封面、人物页按各人看得到的照片算：
// 只出现在 A 隐藏的照片里的人，只有 A 的人物页里有
func visibleTo(a, u string) string {
	return a + `.deleted_at IS NULL AND (NOT ` + a + `.hidden OR ` + a + `.hidden_by = ` + u + `)`
}

const dateLayout = "2006-01-02"

// dateString 把 DATE 列转成 2024-05-01，NULL 是 nil
func dateString(t sql.NullTime) *string {
	if !t.Valid {
		return nil
	}
	v := t.Time.Format(dateLayout)
	return &v
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/people", s.listPeople)
	mux.HandleFunc("PATCH /api/people/{id}", s.updatePerson)
	mux.HandleFunc("POST /api/people/merge", s.mergePeople)
	mux.HandleFunc("POST /api/people/{id}/move", s.moveFaces)
	mux.HandleFunc("GET /api/people/{id}/profile", s.profile)
	mux.HandleFunc("GET /api/faces/status", s.status)
	mux.HandleFunc("GET /api/faces/{id}/thumbnail", s.faceThumbnail)
}

// listPeople：GET /api/people，起了名字的在前，其他按照片多少排
func (s *Service) listPeople(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.QueryContext(r.Context(), `
		SELECT p.id, p.name, p.birthday, p.created_at,
		       count(f.id), count(DISTINCT f.asset_id), `+coverFace(`$1`)+`
		FROM people p
		JOIN faces f ON f.person_id = p.id
		JOIN assets a ON a.id = f.asset_id AND `+visibleTo("a", `$1`)+`
		GROUP BY p.id
		ORDER BY p.name = '', count(DISTINCT f.asset_id) DESC, p.created_at`, auth.UserID(r.Context()))
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer rows.Close()
	list := []Person{}
	for rows.Next() {
		var p Person
		var birthday sql.NullTime
		if err := rows.Scan(&p.ID, &p.Name, &birthday, &p.CreatedAt, &p.Faces, &p.Assets, &p.Cover); err != nil {
			httpx.InternalError(w, err)
			return
		}
		p.Birthday = dateString(birthday)
		list = append(list, p)
	}
	if err := rows.Err(); err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}

// updatePerson：PATCH /api/people/{id}，请求体 {"name": "小宝", "birthday": "2024-05-01"}，只改给了的字段；
// 空字符串是去掉名字、去掉生日
func (s *Service) updatePerson(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "人物 ID 格式不对")
		return
	}
	var req struct {
		Name     *string `json:"name"`
		Birthday *string `json:"birthday"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4<<10)).Decode(&req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	var name *string
	if req.Name != nil {
		v := strings.TrimSpace(*req.Name)
		if utf8.RuneCountInString(v) > maxNameLength {
			httpx.Error(w, http.StatusBadRequest, "名字太长了")
			return
		}
		name = &v
	}
	var birthday sql.NullTime // 给了 birthday 时：Valid 是设置，否则是去掉
	if req.Birthday != nil && *req.Birthday != "" {
		t, err := time.Parse(dateLayout, *req.Birthday)
		if err != nil || t.After(time.Now()) {
			httpx.Error(w, http.StatusBadRequest, "生日应该是 2024-05-01 这样的、不晚于今天的日期")
			return
		}
		birthday = sql.NullTime{Time: t, Valid: true}
	}
	res, err := s.db.ExecContext(r.Context(), `
		UPDATE people SET name = COALESCE($2, name),
		       birthday = CASE WHEN $3 THEN $4::date ELSE birthday END,
		       updated_at = now()
		WHERE id = $1`, id, name, req.Birthday != nil, birthday)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		httpx.Error(w, http.StatusNotFound, "人物不存在")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// Status 是人脸识别的进度
type Status struct {
	AI      string `json:"ai"`      // AI 服务地址
	Healthy bool   `json:"healthy"` // 现在连得上
	Model   string `json:"model"`
	Pending int    `json:"pending"` // 排队、正在做的照片
	Failed  int    `json:"failed"`
	Done    int    `json:"done"` // 找过人脸的照片
	Faces   int    `json:"faces"`
	People  int    `json:"people"`
}

func (s *Service) status(w http.ResponseWriter, r *http.Request) {
	st := Status{AI: s.ai.URL(), Healthy: s.healthy.Load(), Model: s.Model()}
	err := s.db.QueryRowContext(r.Context(), `
		SELECT
		  (SELECT count(*) FROM jobs WHERE type = $1 AND status IN ('pending', 'running')),
		  (SELECT count(*) FROM jobs WHERE type = $1 AND status = 'failed'),
		  (SELECT count(*) FROM assets WHERE face_model = $2),
		  (SELECT count(*) FROM faces),
		  (SELECT count(*) FROM people)`, assets.JobFace, s.Model(),
	).Scan(&st.Pending, &st.Failed, &st.Done, &st.Faces, &st.People)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, st)
}

// faceThumbnail：GET /api/faces/{id}/thumbnail，从预览图上裁出这张脸（正方形，带一点边），缓存起来
func (s *Service) faceThumbnail(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "人脸 ID 格式不对")
		return
	}
	portrait := r.URL.Query().Get("shape") == "portrait"
	name := id.String() + ".jpeg"
	if portrait {
		name = id.String() + "-portrait.jpeg"
	}
	cache := filepath.Join(s.thumbsDir, "faces", id.String()[:2], name)
	if _, err := os.Stat(cache); err != nil {
		if err := s.cropFace(r.Context(), id, cache, portrait); errors.Is(err, sql.ErrNoRows) {
			httpx.Error(w, http.StatusNotFound, "人脸不存在")
			return
		} else if err != nil {
			httpx.InternalError(w, err)
			return
		}
	}
	w.Header().Set("Cache-Control", "private, max-age=86400")
	http.ServeFile(w, r, cache)
}

// cropFace 从预览图里裁出人脸存到 dest：方的小图（人脸周围一圈），或者 portrait 时 3:4 的竖封面（带头发和肩膀）
func (s *Service) cropFace(ctx context.Context, id uuid.UUID, dest string, portrait bool) error {
	var preview string
	var x, y, bw, bh float64
	err := s.db.QueryRowContext(ctx, `
		SELECT a.preview_path, f.box_x, f.box_y, f.box_w, f.box_h
		FROM faces f JOIN assets a ON a.id = f.asset_id WHERE f.id = $1 AND a.preview_path IS NOT NULL`, id,
	).Scan(&preview, &x, &y, &bw, &bh)
	if err != nil {
		return err
	}
	file, err := os.Open(preview)
	if err != nil {
		return err
	}
	defer file.Close()
	src, err := jpeg.Decode(file)
	if err != nil {
		return err
	}
	b := src.Bounds()
	W, H := float64(b.Dx()), float64(b.Dy())
	cx, cy := (x+bw/2)*W, (y+bh/2)*H
	var rect image.Rectangle
	size := faceThumbSize
	if portrait {
		rect = portraitRect(cx, cy, bw*W, W, H).Add(b.Min)
		size = portraitSize
	} else {
		side := max(bw*W, bh*H) * faceMargin
		rect = image.Rect(int(cx-side/2), int(cy-side/2), int(cx+side/2), int(cy+side/2)).Add(b.Min).Intersect(b)
	}

	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, shrink(src, rect, size), &jpeg.Options{Quality: 85}); err != nil {
		return err
	}
	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return err
	}
	tmp := dest + ".tmp"
	if err := os.WriteFile(tmp, buf.Bytes(), 0o644); err != nil {
		return err
	}
	return os.Rename(tmp, dest)
}

// portraitRect 是竖封面在照片（W×H 像素）里的范围：宽是脸宽的 portraitWidth 倍、宽高 3:4，人脸中心 (cx, cy)
// 在左右正中、从上往下 portraitEyes 处。超出照片时整个挪回来，还放不下就按比例缩小，始终是 3:4
func portraitRect(cx, cy, faceW, W, H float64) image.Rectangle {
	w := faceW * portraitWidth
	h := w * 4 / 3
	if s := min(1, W/w, H/h); s < 1 {
		w, h = w*s, h*s
	}
	left := min(max(cx-w/2, 0), W-w)
	top := min(max(cy-h*portraitEyes, 0), H-h)
	return image.Rect(int(left), int(top), int(left+w), int(top+h))
}

// shrink 把 src 里的 rect 缩到长边 size（只缩不放），每个目标像素取对应区域的平均色，比最近邻清楚
func shrink(src image.Image, rect image.Rectangle, size int) image.Image {
	w, h := rect.Dx(), rect.Dy()
	scale := min(1, float64(size)/float64(max(w, h)))
	dw, dh := max(1, int(float64(w)*scale)), max(1, int(float64(h)*scale))
	dst := image.NewRGBA(image.Rect(0, 0, dw, dh))
	for ty := range dh {
		y0 := rect.Min.Y + ty*h/dh
		y1 := max(y0+1, rect.Min.Y+(ty+1)*h/dh)
		for tx := range dw {
			x0 := rect.Min.X + tx*w/dw
			x1 := max(x0+1, rect.Min.X+(tx+1)*w/dw)
			var r, g, bl, n uint32
			for sy := y0; sy < y1; sy++ {
				for sx := x0; sx < x1; sx++ {
					cr, cg, cb, _ := src.At(sx, sy).RGBA()
					r, g, bl, n = r+cr>>8, g+cg>>8, bl+cb>>8, n+1
				}
			}
			i := dst.PixOffset(tx, ty)
			dst.Pix[i], dst.Pix[i+1], dst.Pix[i+2], dst.Pix[i+3] = uint8(r/n), uint8(g/n), uint8(bl/n), 255
		}
	}
	return dst
}

// mergePeople：POST /api/people/merge，请求体 {"ids": [...], "into": "<人物 ID>", "name": "小宝"}。
// ids 里的人（可以包括 into）的人脸都归到 into，其他人物删掉；name 不为空时顺便改名（几个人名字不一样时由用户选一个）
func (s *Service) mergePeople(w http.ResponseWriter, r *http.Request) {
	var req struct {
		IDs  []uuid.UUID `json:"ids"`
		Into uuid.UUID   `json:"into"`
		Name *string     `json:"name"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10)).Decode(&req); err != nil || len(req.IDs) == 0 {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if req.Name != nil && utf8.RuneCountInString(strings.TrimSpace(*req.Name)) > maxNameLength {
		httpx.Error(w, http.StatusBadRequest, "名字太长了")
		return
	}
	ids := make([]string, len(req.IDs))
	for i, id := range req.IDs {
		ids[i] = id.String()
	}
	err := s.inTx(r.Context(), func(tx *sql.Tx) error {
		var exists bool
		if err := tx.QueryRowContext(r.Context(), `SELECT EXISTS (SELECT 1 FROM people WHERE id = $1)`, req.Into).Scan(&exists); err != nil {
			return err
		}
		if !exists {
			return errNotFound
		}
		if _, err := tx.ExecContext(r.Context(),
			`UPDATE faces SET person_id = $2 WHERE person_id = ANY($1::uuid[])`, ids, req.Into); err != nil {
			return err
		}
		if _, err := tx.ExecContext(r.Context(),
			`DELETE FROM people WHERE id = ANY($1::uuid[]) AND id <> $2`, ids, req.Into); err != nil {
			return err
		}
		if req.Name != nil {
			_, err := tx.ExecContext(r.Context(), `UPDATE people SET name = $2, updated_at = now() WHERE id = $1`,
				req.Into, strings.TrimSpace(*req.Name))
			return err
		}
		return nil
	})
	if errors.Is(err, errNotFound) {
		httpx.Error(w, http.StatusNotFound, "要合并到的人物不存在")
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// moveFaces：POST /api/people/{id}/move，把这个人在某几张照片里的脸挪走，请求体 {"asset_ids": [...]} 加上去向：
//   - 什么都不带：从这个人移除（「不是这个人」），这些脸不归任何人；
//   - "to": "<人物 ID>"：移到另一个人；
//   - "new": true（可以带 "name"）：移到一个新建的人物（把认混的两个人拆开）。
//
// 自动归类只给新来的脸找人，移出去的脸不会再被自动归回这个人。挪完没有脸了的人物删掉。返回 {"moved": 几张脸, "to": 去向的人物 ID}
func (s *Service) moveFaces(w http.ResponseWriter, r *http.Request) {
	from, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "人物 ID 格式不对")
		return
	}
	var req struct {
		AssetIDs []uuid.UUID `json:"asset_ids"`
		To       *uuid.UUID  `json:"to"`
		New      bool        `json:"new"`
		Name     string      `json:"name"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 2<<20)).Decode(&req); err != nil || len(req.AssetIDs) == 0 {
		httpx.Error(w, http.StatusBadRequest, "请求格式不对")
		return
	}
	if req.To != nil && *req.To == from {
		httpx.Error(w, http.StatusBadRequest, "已经是这个人了")
		return
	}
	assetIDs := make([]string, len(req.AssetIDs))
	for i, id := range req.AssetIDs {
		assetIDs[i] = id.String()
	}
	var moved int64
	var to *uuid.UUID
	err = s.inTx(r.Context(), func(tx *sql.Tx) error {
		to = req.To
		if req.New {
			var id uuid.UUID
			if err := tx.QueryRowContext(r.Context(), `INSERT INTO people (name) VALUES ($1) RETURNING id`,
				strings.TrimSpace(req.Name)).Scan(&id); err != nil {
				return err
			}
			to = &id
		} else if to != nil {
			var exists bool
			if err := tx.QueryRowContext(r.Context(), `SELECT EXISTS (SELECT 1 FROM people WHERE id = $1)`, *to).Scan(&exists); err != nil {
				return err
			}
			if !exists {
				return errNotFound
			}
		}
		res, err := tx.ExecContext(r.Context(),
			`UPDATE faces SET person_id = $3 WHERE person_id = $1 AND asset_id = ANY($2::uuid[])`, from, assetIDs, to)
		if err != nil {
			return err
		}
		moved, _ = res.RowsAffected()
		_, err = tx.ExecContext(r.Context(),
			`DELETE FROM people p WHERE p.id = $1 AND NOT EXISTS (SELECT 1 FROM faces f WHERE f.person_id = p.id)`, from)
		return err
	})
	if errors.Is(err, errNotFound) {
		httpx.Error(w, http.StatusNotFound, "要移到的人物不存在")
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{"moved": moved, "to": to})
}

var errNotFound = errors.New("不存在")

// inTx 在一个事务里改人物和人脸，拿着和自动归类同一把锁，不会和正在归类的任务互相打架
func (s *Service) inTx(ctx context.Context, fn func(tx *sql.Tx) error) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock($1)`, clusterLockKey); err != nil {
		return err
	}
	if err := fn(tx); err != nil {
		return err
	}
	return tx.Commit()
}
