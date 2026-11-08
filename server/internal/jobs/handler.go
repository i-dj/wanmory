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

type activeStat struct {
	Type    string `json:"type"`
	Pending int    `json:"pending"`
	Running int    `json:"running"`
	Done    int    `json:"done"`   // 这一批做完了几个：从还没做完的里最早排上的那个算起
	Failed  int    `json:"failed"` // 这一批里失败的
}

// active 是还有任务没做完的类型，每类排着几个、在做几个、这一批做完几个。页面顶上的任务图标用它显示进度
func (h *Handler) active(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(), `
		WITH a AS (
			SELECT type, min(created_at) AS since,
			       count(*) FILTER (WHERE status = 'pending') AS pending,
			       count(*) FILTER (WHERE status = 'running') AS running
			FROM jobs WHERE status IN ('pending', 'running') GROUP BY type
		)
		SELECT a.type, a.pending, a.running,
		       count(j.id) FILTER (WHERE j.status = 'done'),
		       count(j.id) FILTER (WHERE j.status = 'failed')
		FROM a LEFT JOIN jobs j ON j.type = a.type AND j.status IN ('done', 'failed') AND j.finished_at >= a.since
		GROUP BY a.type, a.pending, a.running
		ORDER BY a.type`)
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer rows.Close()
	list := []activeStat{}
	for rows.Next() {
		var s activeStat
		if err := rows.Scan(&s.Type, &s.Pending, &s.Running, &s.Done, &s.Failed); err != nil {
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
