// Package faces 是人脸识别：把照片的预览图发给 AI 服务找人脸、算特征（见 ai 包），存进 faces 表，
// 再按长相把人脸归到人物（people）里；用户给人物起名。
//
// 归类是增量的，每张照片处理完就归一次，不用等全部算完：
//   - 够清楚、够正、够大的「好脸」，在别的照片里找最像的人脸（余弦距离 < maxDistance）。
//     其中有已经归了人物的，就归到票数最多的那个人；都还没归人物、但像的加上自己够 minFaces 张，就新建一个人物把它们放进去；
//   - 模糊、侧脸、太小的脸不新建人物，只有和某个人的脸很像（< weakDistance）时才跟着归进去。
//
// 几个 face 任务可能同时在跑，归类在一个数据库事务里、拿着同一把咨询锁做，不会把一个人建成两个。
//
// 换人脸模型（设置里换档位，见 SetModel）后每张照片重新找一遍脸。新找到的脸和这张照片里原来的脸位置重合的，
// 直接沿用原来的人物（名字、合并、手动挪过的都留着），不用重新归类；只有原来没找到的脸才按上面的办法归。
package faces

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/ai"
	"github.com/wanmory/wanmory/server/internal/assets"
	"github.com/wanmory/wanmory/server/internal/jobs"
)

const (
	maxDistance  = 0.55 // 两张好脸的余弦距离小于这个算像（相似度 > 0.45）
	weakDistance = 0.45 // 模糊、侧脸要更像才归进去
	minFaces     = 2    // 至少在这么多张照片里出现（像的好脸）才新建一个人物，只出现一次的路人不建
	neighbors    = 24   // 每张脸找多少个最像的

	// 好脸的标准（按 1440 像素的预览图）
	goodScore = 0.7
	goodSize  = 48 // 人脸框短边至少这么多像素
	goodYaw   = 0.5
	goodBlur  = 60

	healthInterval = 15 * time.Second
	clusterLockKey = 0x6661636573 // 归类用的咨询锁（"faces"）
)

type Service struct {
	db        *sql.DB
	ai        *ai.Client
	model     atomic.Value // 用哪个人脸模型（string），例如 antelopev2；设置里换了档位时改（SetModel）
	thumbsDir string       // 人脸小图缓存在 <thumbsDir>/faces 下
	healthy   atomic.Bool
}

func NewService(db *sql.DB, client *ai.Client, model, thumbsDir string) *Service {
	s := &Service{db: db, ai: client, thumbsDir: thumbsDir}
	s.model.Store(model)
	return s
}

func (s *Service) Model() string { return s.model.Load().(string) }

// SetModel 换人脸模型：之后的 face 任务用新模型，Backfill 给还不是这个模型找的照片排上任务
func (s *Service) SetModel(model string) { s.model.Store(model) }

// Progress 是现在的模型找过了多少张、一共多少张（要找的照片）
func (s *Service) Progress(ctx context.Context) (done, total int, err error) {
	err = s.db.QueryRowContext(ctx, `
		SELECT count(*) FILTER (WHERE face_model = $1), count(*)
		FROM assets WHERE preview_path IS NOT NULL AND deleted_at IS NULL AND type <> 'audio'`,
		s.Model()).Scan(&done, &total)
	return done, total, err
}

// RegisterJobs 把 face 任务交给 w。AI 服务连不上时 w 暂停领取，恢复后接着做
func (s *Service) RegisterJobs(w *jobs.Worker) {
	w.Register(assets.JobFace, s.runFace)
	w.SetReady(s.healthy.Load)
}

// Watch 定时检查 AI 服务在不在，直到 ctx 结束；状态变化时打一行日志
func (s *Service) Watch(ctx context.Context) {
	check := func() {
		cctx, cancel := context.WithTimeout(ctx, 5*time.Second)
		defer cancel()
		h, err := s.ai.Health(cctx)
		ok := err == nil && h.Status == "ok"
		if was := s.healthy.Swap(ok); was != ok {
			if ok {
				log.Printf("faces: AI 服务已连接（%s，加速 %s）", s.ai.URL(), strings.Join(h.Providers, ", "))
			} else {
				log.Printf("faces: AI 服务连不上（%s），人脸识别先暂停: %v", s.ai.URL(), err)
			}
		}
	}
	check()
	t := time.NewTicker(healthInterval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			check()
		}
	}
}

// Backfill 给还没找过人脸（或者是用别的模型找的）的照片排上 face 任务，启动时调一次
func (s *Service) Backfill(ctx context.Context) (int64, error) {
	res, err := s.db.ExecContext(ctx, `
		INSERT INTO jobs (type, asset_id, priority)
		SELECT $1, id, GREATEST(0, LEAST(extract(epoch FROM COALESCE(taken_at, file_mtime)) / 3600, 1073741823))::int
		FROM assets
		WHERE preview_path IS NOT NULL AND deleted_at IS NULL AND type <> 'audio'
		  AND face_model IS DISTINCT FROM $2
		ON CONFLICT (type, asset_id) WHERE status IN ('pending', 'running') DO NOTHING`,
		assets.JobFace, s.Model())
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}

// runFace 处理一张照片：把预览图发给 AI 服务，存下找到的人脸，再逐张归类
func (s *Service) runFace(ctx context.Context, job *jobs.Job) error {
	if job.AssetID == nil {
		return errors.New("face 任务缺少 asset_id")
	}
	var preview sql.NullString
	err := s.db.QueryRowContext(ctx,
		`SELECT preview_path FROM assets WHERE id = $1 AND deleted_at IS NULL`, *job.AssetID).Scan(&preview)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && !preview.Valid) {
		return nil // 照片删了，或者没有预览图（不会有人脸）
	}
	if err != nil {
		return err
	}
	image, err := os.ReadFile(preview.String)
	if err != nil {
		return err
	}

	model := s.Model()
	pred, err := s.ai.Predict(ctx, image, filepath.Base(preview.String), ai.Tasks{Face: &ai.FaceTask{Model: model}})
	if errors.Is(err, ai.ErrUnavailable) {
		s.healthy.Store(false) // 不等下次检查，马上暂停领取
		return fmt.Errorf("%w: %v", jobs.ErrRetryLater, err)
	}
	if err != nil {
		return err
	}
	if got := pred.ModelIDs["face"]; got != model {
		return fmt.Errorf("AI 服务用的人脸模型是 %q，不是 %q，结果不能用", got, model)
	}
	return s.save(ctx, *job.AssetID, model, pred)
}

// save 换掉这张照片原来的人脸，归类，记下用的模型，都在一个事务里
func (s *Service) save(ctx context.Context, assetID uuid.UUID, model string, pred *ai.Prediction) error {
	w, h := float64(pred.Image.Width), float64(pred.Image.Height)
	if w == 0 || h == 0 {
		return errors.New("AI 服务没有返回图片大小")
	}
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock($1)`, clusterLockKey); err != nil {
		return err
	}
	// 让向量索引多看一些候选，带着条件筛选时也能找满 neighbors 个
	if _, err := tx.ExecContext(ctx, `SET LOCAL hnsw.ef_search = 100`); err != nil {
		return err
	}
	// 原来的脸归了谁：删掉之前记下位置，新找到的脸位置重合的沿用（换模型、重新识别时人物不丢）
	old, err := oldPeople(ctx, tx, assetID)
	if err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DELETE FROM faces WHERE asset_id = $1`, assetID); err != nil {
		return err
	}

	for _, f := range pred.Face {
		landmarks := make([][2]float64, len(f.Landmarks))
		for i, p := range f.Landmarks {
			landmarks[i] = [2]float64{p[0] / w, p[1] / h}
		}
		lm, err := json.Marshal(landmarks)
		if err != nil {
			return err
		}
		good := f.Score >= goodScore && min(f.Box[2], f.Box[3]) >= goodSize &&
			f.Yaw >= -goodYaw && f.Yaw <= goodYaw && f.Blur >= goodBlur
		vec := vectorLiteral(f.Embedding)
		var id uuid.UUID
		err = tx.QueryRowContext(ctx, `
			INSERT INTO faces (asset_id, model_id, box_x, box_y, box_w, box_h, landmarks, score, blur, yaw, good, embedding)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::vector)
			RETURNING id`,
			assetID, model, f.Box[0]/w, f.Box[1]/h, f.Box[2]/w, f.Box[3]/h, string(lm),
			f.Score, f.Blur, f.Yaw, good, vec).Scan(&id)
		if err != nil {
			return err
		}
		box := [4]float64{f.Box[0] / w, f.Box[1] / h, f.Box[2] / w, f.Box[3] / h}
		if person, ok := old.take(box); ok {
			if _, err := tx.ExecContext(ctx, `UPDATE faces SET person_id = $2 WHERE id = $1`, id, person); err != nil {
				return err
			}
			continue
		}
		if err := s.cluster(ctx, tx, model, id, assetID, vec, good); err != nil {
			return err
		}
	}
	if _, err := tx.ExecContext(ctx, `UPDATE assets SET face_model = $2 WHERE id = $1`, assetID, model); err != nil {
		return err
	}
	return tx.Commit()
}

// Regroup 把还没归到任何人的脸重新归一遍：建人物的门槛改过（例如从 3 张照片改成 2 张）以后，
// 以前没够数的脸不用重新跑 AI 就能归成人物。启动时在后台跑一次；一张一张来，每张一个事务、拿着归类锁，
// 不挡住新照片的识别。没归上的照旧留着
func (s *Service) Regroup(ctx context.Context) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, asset_id, model_id, embedding::text, good FROM faces
		WHERE person_id IS NULL AND good AND model_id = $1
		ORDER BY created_at`, s.Model())
	if err != nil {
		log.Printf("faces: 重新归类读取失败: %v", err)
		return
	}
	type face struct {
		id, asset  uuid.UUID
		model, vec string
		good       bool
	}
	var list []face
	for rows.Next() {
		var f face
		if err := rows.Scan(&f.id, &f.asset, &f.model, &f.vec, &f.good); err != nil {
			rows.Close()
			log.Printf("faces: 重新归类读取失败: %v", err)
			return
		}
		list = append(list, f)
	}
	rows.Close()
	before := 0
	_ = s.db.QueryRowContext(ctx, `SELECT count(*) FROM people`).Scan(&before)
	for _, f := range list {
		if ctx.Err() != nil {
			return
		}
		err := func() error {
			tx, err := s.db.BeginTx(ctx, nil)
			if err != nil {
				return err
			}
			defer tx.Rollback()
			if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock($1)`, clusterLockKey); err != nil {
				return err
			}
			// 拿到锁的时候可能已经被别的脸带着归进去了
			var still bool
			if err := tx.QueryRowContext(ctx, `SELECT person_id IS NULL FROM faces WHERE id = $1`, f.id).Scan(&still); err != nil || !still {
				return err
			}
			if err := s.cluster(ctx, tx, f.model, f.id, f.asset, f.vec, f.good); err != nil {
				return err
			}
			return tx.Commit()
		}()
		if err != nil && ctx.Err() == nil {
			log.Printf("faces: 重新归类 %s 失败: %v", f.id, err)
		}
	}
	after := 0
	_ = s.db.QueryRowContext(ctx, `SELECT count(*) FROM people`).Scan(&after)
	if after > before {
		log.Printf("faces: 重新归类了 %d 张没归人物的脸，新认出 %d 个人", len(list), after-before)
	}
}

// cluster 给一张新的脸找人物（见包注释）
func (s *Service) cluster(ctx context.Context, tx *sql.Tx, model string, faceID, assetID uuid.UUID, vec string, good bool) error {
	limit := maxDistance
	if !good {
		limit = weakDistance
	}
	// 同一张照片里的不会是同一个人，不算
	rows, err := tx.QueryContext(ctx, `
		SELECT id, person_id, embedding <=> $1::vector AS d FROM faces
		WHERE model_id = $2 AND asset_id <> $3 AND good
		ORDER BY embedding <=> $1::vector LIMIT $4`, vec, model, assetID, neighbors)
	if err != nil {
		return err
	}
	type near struct {
		id     uuid.UUID
		person uuid.NullUUID
		d      float64
	}
	var similar []near
	for rows.Next() {
		var n near
		if err := rows.Scan(&n.id, &n.person, &n.d); err != nil {
			rows.Close()
			return err
		}
		if n.d < limit {
			similar = append(similar, n)
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	// 已经有人物的：票数最多的那个，一样多时取最像的
	votes := map[uuid.UUID]int{}
	best := map[uuid.UUID]float64{}
	for _, n := range similar {
		if !n.person.Valid {
			continue
		}
		p := n.person.UUID
		votes[p]++
		if d, ok := best[p]; !ok || n.d < d {
			best[p] = n.d
		}
	}
	var person uuid.UUID
	for p, v := range votes {
		if person == uuid.Nil || v > votes[person] || (v == votes[person] && best[p] < best[person]) {
			person = p
		}
	}
	if person != uuid.Nil {
		_, err := tx.ExecContext(ctx, `UPDATE faces SET person_id = $2 WHERE id = $1`, faceID, person)
		return err
	}

	// 都还没有人物：好脸够多就新建一个，把这些像的脸一起放进去
	if !good || len(similar)+1 < minFaces {
		return nil
	}
	if err := tx.QueryRowContext(ctx, `INSERT INTO people DEFAULT VALUES RETURNING id`).Scan(&person); err != nil {
		return err
	}
	ids := []string{faceID.String()}
	for _, n := range similar {
		ids = append(ids, n.id.String())
	}
	_, err = tx.ExecContext(ctx,
		`UPDATE faces SET person_id = $2 WHERE id = ANY($1::uuid[]) AND person_id IS NULL`, ids, person)
	return err
}

// placed 是照片里原来那些归了人物的脸：位置（相对照片的 x, y, w, h）和人物
type placed []struct {
	box    [4]float64
	person uuid.UUID
}

func oldPeople(ctx context.Context, tx *sql.Tx, assetID uuid.UUID) (placed, error) {
	rows, err := tx.QueryContext(ctx,
		`SELECT box_x, box_y, box_w, box_h, person_id FROM faces WHERE asset_id = $1 AND person_id IS NOT NULL`, assetID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list placed
	for rows.Next() {
		var p struct {
			box    [4]float64
			person uuid.UUID
		}
		if err := rows.Scan(&p.box[0], &p.box[1], &p.box[2], &p.box[3], &p.person); err != nil {
			return nil, err
		}
		list = append(list, p)
	}
	return list, rows.Err()
}

// take 找和 box 重合得最多的那张原来的脸（交并比至少一半），返回它的人物，用过的不再给别的脸
func (p placed) take(box [4]float64) (uuid.UUID, bool) {
	best, bestIoU := -1, 0.5
	for i, o := range p {
		if v := iou(box, o.box); o.person != uuid.Nil && v >= bestIoU {
			best, bestIoU = i, v
		}
	}
	if best < 0 {
		return uuid.Nil, false
	}
	person := p[best].person
	p[best].person = uuid.Nil
	return person, true
}

// iou 是两个框的交并比：重叠面积 / 合起来的面积
func iou(a, b [4]float64) float64 {
	x1, y1 := max(a[0], b[0]), max(a[1], b[1])
	x2, y2 := min(a[0]+a[2], b[0]+b[2]), min(a[1]+a[3], b[1]+b[3])
	if x2 <= x1 || y2 <= y1 {
		return 0
	}
	inter := (x2 - x1) * (y2 - y1)
	return inter / (a[2]*a[3] + b[2]*b[3] - inter)
}

// vectorLiteral 把特征写成 pgvector 认的文本格式 [0.1,0.2,...]
func vectorLiteral(v []float32) string {
	var b strings.Builder
	b.Grow(len(v) * 10)
	b.WriteByte('[')
	for i, x := range v {
		if i > 0 {
			b.WriteByte(',')
		}
		b.WriteString(strconv.FormatFloat(float64(x), 'f', 6, 32))
	}
	b.WriteByte(']')
	return b.String()
}
