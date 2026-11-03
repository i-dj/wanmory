// Package clip 是看照片内容的几件事，都把预览图发给 AI 服务（见 ml/）：
//
//   - clip 任务：算 CLIP 向量（Chinese-CLIP），存进 clip_embeddings；
//   - ocr 任务：认出照片里的字，存进 assets.ocr_text；
//   - 搜索（Search）：搜索词同时按字搜（照片里有这些字）和按意思搜（CLIP 向量离得近），见 search.go；
//   - 分类（tags）：照片和一组中文描述（「手机屏幕截图」「身份证」「一桌饭菜」……）比，再结合认出来的字，
//     见 tags.go。向量或文字有了变化就重算一次。
package clip

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/ai"
	"github.com/wanmory/wanmory/server/internal/assets"
	"github.com/wanmory/wanmory/server/internal/jobs"
)

// 各个模型的向量维度。数据库里 H/14 有向量索引（见 00002 迁移），别的模型照样能用，只是搜索时整表比
var dims = map[string]int{
	"chinese-clip-vit-h-14": 1024,
	"chinese-clip-vit-l-14": 768,
	"chinese-clip-vit-b-16": 512,
}

const (
	ocrModel         = "pp-ocrv6-small" // 和 AI 服务的 ocr.MODEL_ID 一致
	unavailablePause = 30 * time.Second
)

type Service struct {
	db          *sql.DB
	ai          *ai.Client
	modelMu     sync.RWMutex
	model       string // 新算的向量用哪个模型；设置里换了档位时改（SetModel）
	dim         int
	labelsMu    sync.Mutex
	labels      [][]float32 // 分类描述的向量，第一次用时向 AI 服务要（见 tags.go）
	labelsModel string      // labels 是哪个模型算的
	queriesMu   sync.Mutex
	queries     map[string][]float32 // 搜过的词的向量（键是「模型 + 词」），同一个词翻页时不用再问 AI 服务
	// AI 服务说模型还没准备好（或者连不上）之后，这段时间里的任务不再发图片过去，直接排到后面
	notBefore atomic.Int64
}

func NewService(db *sql.DB, client *ai.Client, model string) (*Service, error) {
	dim, ok := dims[model]
	if !ok {
		return nil, fmt.Errorf("不认识的 CLIP 模型 %q", model)
	}
	return &Service{db: db, ai: client, model: model, dim: dim, queries: map[string][]float32{}}, nil
}

// current 是现在新算的向量用的模型和维度
func (s *Service) current() (string, int) {
	s.modelMu.RLock()
	defer s.modelMu.RUnlock()
	return s.model, s.dim
}

func (s *Service) Model() string {
	m, _ := s.current()
	return m
}

// SetModel 换模型（设置里换了档位）：之后的 clip 任务用新模型算，Backfill 给还没有新模型向量的照片排上任务。
// 换的过程中搜索继续用旧模型，新模型的向量追上来了再换（见 searchModel）
func (s *Service) SetModel(model string) error {
	dim, ok := dims[model]
	if !ok {
		return fmt.Errorf("不认识的 CLIP 模型 %q", model)
	}
	s.modelMu.Lock()
	s.model, s.dim = model, dim
	s.modelMu.Unlock()
	return nil
}

// Progress 是现在的模型算了多少张、一共多少张（要算的照片）
func (s *Service) Progress(ctx context.Context) (done, total int, err error) {
	err = s.db.QueryRowContext(ctx, `
		SELECT count(*) FILTER (WHERE EXISTS (SELECT 1 FROM clip_embeddings e WHERE e.asset_id = a.id AND e.model_id = $1)),
		       count(*)
		FROM assets a WHERE a.preview_path IS NOT NULL AND a.deleted_at IS NULL AND a.type <> 'audio'`,
		s.Model()).Scan(&done, &total)
	return done, total, err
}

// RegisterJobs 把 clip、ocr 任务交给 w（和人脸用同一个 AI worker，AI 服务连不上时一起暂停）
func (s *Service) RegisterJobs(w *jobs.Worker) {
	w.Register(assets.JobClip, s.runClip)
	w.Register(assets.JobOCR, s.runOCR)
}

// Backfill 启动时调一次：还没有这个模型向量的照片排上 clip 任务，还没认过字的排上 ocr 任务
func (s *Service) Backfill(ctx context.Context) (int64, error) {
	var total int64
	for _, q := range []struct {
		job, missing string
		arg          string
	}{
		{assets.JobClip, `NOT EXISTS (SELECT 1 FROM clip_embeddings e WHERE e.asset_id = a.id AND e.model_id = $2)`, s.Model()},
		{assets.JobOCR, `a.ocr_model IS DISTINCT FROM $2`, ocrModel},
	} {
		res, err := s.db.ExecContext(ctx, `
			INSERT INTO jobs (type, asset_id, priority)
			SELECT $1, a.id, GREATEST(0, LEAST(extract(epoch FROM COALESCE(a.taken_at, a.file_mtime)) / 3600, 1073741823))::int
			FROM assets a
			WHERE a.preview_path IS NOT NULL AND a.deleted_at IS NULL AND a.type <> 'audio' AND `+q.missing+`
			ON CONFLICT (type, asset_id) WHERE status IN ('pending', 'running') DO NOTHING`, q.job, q.arg)
		if err != nil {
			return total, err
		}
		n, _ := res.RowsAffected()
		total += n
	}
	return total, nil
}

// preview 读照片的预览图；照片删了或者没有预览图时返回 nil
func (s *Service) preview(ctx context.Context, id uuid.UUID) ([]byte, string, error) {
	var path sql.NullString
	err := s.db.QueryRowContext(ctx,
		`SELECT preview_path FROM assets WHERE id = $1 AND deleted_at IS NULL`, id).Scan(&path)
	if errors.Is(err, sql.ErrNoRows) || (err == nil && !path.Valid) {
		return nil, "", nil
	}
	if err != nil {
		return nil, "", err
	}
	data, err := os.ReadFile(path.String)
	return data, filepath.Base(path.String), err
}

// predict 发给 AI 服务；它连不上、模型还在加载时，这个任务和之后一小会儿的任务都排到后面，不算失败
func (s *Service) predict(ctx context.Context, image []byte, name string, tasks ai.Tasks) (*ai.Prediction, error) {
	if time.Now().UnixNano() < s.notBefore.Load() {
		return nil, fmt.Errorf("%w: AI 服务还没准备好", jobs.ErrRetryLater)
	}
	pred, err := s.ai.Predict(ctx, image, name, tasks)
	if errors.Is(err, ai.ErrUnavailable) {
		s.notBefore.Store(time.Now().Add(unavailablePause).UnixNano())
		return nil, fmt.Errorf("%w: %v", jobs.ErrRetryLater, err)
	}
	return pred, err
}

// runClip 处理一张照片：预览图发给 AI 服务算向量，存下来，再重算分类
func (s *Service) runClip(ctx context.Context, job *jobs.Job) error {
	if job.AssetID == nil {
		return errors.New("clip 任务缺少 asset_id")
	}
	image, name, err := s.preview(ctx, *job.AssetID)
	if err != nil || image == nil {
		return err
	}
	model, dim := s.current()
	pred, err := s.predict(ctx, image, name, ai.Tasks{Clip: &ai.ClipTask{Model: model}})
	if err != nil {
		return err
	}
	if got := pred.ModelIDs["clip"]; got != model || pred.Clip == nil || len(pred.Clip.Embedding) != dim {
		return fmt.Errorf("AI 服务返回的 CLIP 向量不对（模型 %q）", got)
	}
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO clip_embeddings (asset_id, model_id, embedding) VALUES ($1, $2, $3::vector)
		ON CONFLICT (asset_id, model_id) DO UPDATE SET embedding = EXCLUDED.embedding, created_at = now()`,
		*job.AssetID, model, vectorLiteral(pred.Clip.Embedding)); err != nil {
		return err
	}
	return s.retryLater(s.retag(ctx, *job.AssetID))
}

// runOCR 认出照片里的字存下来，再重算分类（证件、文档要看字）
func (s *Service) runOCR(ctx context.Context, job *jobs.Job) error {
	if job.AssetID == nil {
		return errors.New("ocr 任务缺少 asset_id")
	}
	image, name, err := s.preview(ctx, *job.AssetID)
	if err != nil || image == nil {
		return err
	}
	pred, err := s.predict(ctx, image, name, ai.Tasks{OCR: &ai.OCRTask{}})
	if err != nil {
		return err
	}
	if got := pred.ModelIDs["ocr"]; got != ocrModel || pred.OCR == nil {
		return fmt.Errorf("AI 服务返回的文字识别结果不对（模型 %q）", got)
	}
	if _, err := s.db.ExecContext(ctx,
		`UPDATE assets SET ocr_text = NULLIF($2, ''), ocr_model = $3, updated_at = now() WHERE id = $1`,
		*job.AssetID, pred.OCR.Text, ocrModel); err != nil {
		return err
	}
	return s.retryLater(s.retag(ctx, *job.AssetID))
}

// retryLater：重算分类时 AI 服务没准备好（要算描述的向量），任务过一会儿再做
func (s *Service) retryLater(err error) error {
	if errors.Is(err, ai.ErrUnavailable) {
		return fmt.Errorf("%w: %v", jobs.ErrRetryLater, err)
	}
	return err
}

// RetagStale 给分类不是当前版本算的照片重算分类（改了分类规则之后）。要 AI 服务算描述的向量，
// 连不上、模型还在加载时每隔一会儿再试，直到做完或者 ctx 结束
func (s *Service) RetagStale(ctx context.Context) {
	for {
		done, err := s.retagStale(ctx)
		if err != nil && !errors.Is(err, ai.ErrUnavailable) {
			log.Printf("clip: 重算分类失败: %v", err)
			return
		}
		if done {
			return
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(unavailablePause):
		}
	}
}

func (s *Service) retagStale(ctx context.Context) (bool, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT a.id FROM assets a JOIN clip_embeddings e ON e.asset_id = a.id AND e.model_id = $1
		WHERE a.tags_version IS DISTINCT FROM $2`, s.Model(), s.version(s.Model()))
	if err != nil {
		return true, err
	}
	var ids []uuid.UUID
	for rows.Next() {
		var id uuid.UUID
		if err := rows.Scan(&id); err != nil {
			rows.Close()
			return true, err
		}
		ids = append(ids, id)
	}
	rows.Close()
	for _, id := range ids {
		if err := s.retag(ctx, id); err != nil {
			return false, err
		}
	}
	if len(ids) > 0 {
		log.Printf("clip: 重算了 %d 张照片的分类", len(ids))
	}
	return true, nil
}

// texts 让 AI 服务用 model 算几段文字的向量
func (s *Service) texts(ctx context.Context, model string, texts []string) ([][]float32, error) {
	pred, err := s.ai.Predict(ctx, nil, "", ai.Tasks{ClipText: &ai.ClipTextTask{Model: model, Texts: texts}})
	if err != nil {
		return nil, err
	}
	if pred.ModelIDs["clip"] != model || pred.ClipText == nil || len(pred.ClipText.Embeddings) != len(texts) {
		return nil, fmt.Errorf("AI 服务返回的文字向量不对（模型 %q）", pred.ModelIDs["clip"])
	}
	return pred.ClipText.Embeddings, nil
}

func dot(a, b []float32) float64 {
	var s float64
	for i := range a {
		s += float64(a[i]) * float64(b[i])
	}
	return s
}

// vectorLiteral 把向量写成 pgvector 认的文本格式 [0.1,0.2,...]
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

// parseVector 读 pgvector 的文本格式
func parseVector(s string) ([]float32, error) {
	s = strings.TrimSuffix(strings.TrimPrefix(strings.TrimSpace(s), "["), "]")
	parts := strings.Split(s, ",")
	v := make([]float32, len(parts))
	for i, p := range parts {
		f, err := strconv.ParseFloat(p, 32)
		if err != nil {
			return nil, err
		}
		v[i] = float32(f)
	}
	return v, nil
}
