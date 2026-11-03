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
