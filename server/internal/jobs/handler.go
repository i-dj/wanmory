package jobs

import (
	"database/sql"
	"net/http"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

type Handler struct {
	db *sql.DB
}

func NewHandler(db *sql.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/jobs/stats", h.stats)
	mux.HandleFunc("GET /api/jobs/active", h.active)
}

// group 是任务图标里的一行：几类任务合在一起，按照片算（一张照片这几类都做完才算一张）
type group struct {
	Key   string   `json:"key"`
	Types []string `json:"-"`
}

var groups = []group{
	{Key: "import", Types: []string{"metadata", "thumbnail"}}, // 导入照片：读信息、生成缩略图
	{Key: "ai", Types: []string{"face", "clip", "ocr"}},       // AI 识别：人脸、内容（语义）、文字
}

type activeGroup struct {
	Key string `json:"key"`
	// Done、Remaining 是这一批（从还没做完的里最早排上的那个算起）做完、还剩几张。一张照片有好几项任务，
	// 按做完的任务比例折算成张数，进度条一项一项往前走，不用等一张的几项全做完才动
	Remaining int `json:"remaining"`
	Done      int `json:"done"`
	Failed    int `json:"failed"` // 这一批里失败的任务
	// ETA 是预计还要多少秒：按最近 10 分钟做完的速度算；做完的太少、算不准时是 null
	ETA *int `json:"eta"`
}

// active 是还有任务没做完的几组，每组还剩几张、这一批做完几张、预计还要多久。页面顶上的任务图标用它
func (h *Handler) active(w http.ResponseWriter, r *http.Request) {
	list := []activeGroup{}
	for _, g := range groups {
		var a activeGroup
		var remainingJobs, doneJobs, photos, recentDone int
		var recentSpan *float64
		err := h.db.QueryRowContext(r.Context(), `
			WITH act AS (
				SELECT min(created_at) AS since, count(*) AS jobs, count(DISTINCT asset_id) AS photos
				FROM jobs WHERE type = ANY($1) AND status IN ('pending', 'running')
			), recent AS (
				SELECT count(*) AS n, extract(epoch FROM now() - min(finished_at)) AS span
				FROM jobs WHERE type = ANY($1) AND status = 'done' AND finished_at > now() - interval '10 minutes'
			)
			SELECT act.jobs, d.jobs,
			       (SELECT count(DISTINCT asset_id) FROM jobs
			        WHERE type = ANY($1) AND (status IN ('pending', 'running') OR finished_at >= act.since)),
			       d.failed, recent.n, recent.span
			FROM act, recent, LATERAL (
				SELECT count(*) FILTER (WHERE status IN ('done', 'failed')) AS jobs,
				       count(*) FILTER (WHERE status = 'failed') AS failed
				FROM jobs WHERE type = ANY($1) AND status IN ('done', 'failed') AND finished_at >= act.since
			) d`, g.Types,
		).Scan(&remainingJobs, &doneJobs, &photos, &a.Failed, &recentDone, &recentSpan)
		if err != nil {
			httpx.InternalError(w, err)
			return
		}
		if remainingJobs == 0 {
			continue
		}
		a.Key = g.Key
		a.Done = photos * doneJobs / (doneJobs + remainingJobs)
		a.Remaining = photos - a.Done
		// 最近做完了至少 5 个、跨了 20 秒以上才估，不然刚开始时一下子估出几秒或者几天
		if recentDone >= 5 && recentSpan != nil && *recentSpan >= 20 {
			eta := int(float64(remainingJobs) * *recentSpan / float64(recentDone))
			a.ETA = &eta
		}
		list = append(list, a)
	}
	httpx.JSON(w, http.StatusOK, list)
}

type stat struct {
	Type   string `json:"type"`
	Status string `json:"status"`
	Count  int    `json:"count"`
}

// stats 按类型和状态统计任务数量，用于在页面上显示处理进度。
func (h *Handler) stats(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(),
		`SELECT type, status, count(*) FROM jobs GROUP BY type, status ORDER BY type, status`)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer rows.Close()

	list := []stat{}
	for rows.Next() {
		var s stat
		if err := rows.Scan(&s.Type, &s.Status, &s.Count); err != nil {
			httpx.InternalError(w, err)
			return
		}
		list = append(list, s)
	}
	if err := rows.Err(); err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}
