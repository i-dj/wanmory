package assets

import (
	"net/http"

	"github.com/google/uuid"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// points：GET /api/assets/points，所有带地点的照片和视频：[[id, 拍摄时间（Unix 秒，没有就用文件修改时间）, 纬度, 经度,
// 类型（0 照片、1 视频、2 动图）, 用户选的地名或 null, 谁传的（成员 ID）或 null], ...]，
// 按时间排。网页「足迹」拿它把照片标在地图上。一万张也就几百 KB，写成数组不写字段名。
// 和人物一样，自己隐藏的照片也算（只有自己的地图上有）
func (s *Service) points(w http.ResponseWriter, r *http.Request) {
	rows, err := s.db.QueryContext(r.Context(), `
		SELECT id, extract(epoch FROM `+takenExpr+`)::bigint, latitude, longitude,
		       CASE WHEN type = 'video' THEN 1 WHEN mime_type = 'image/gif' THEN 2 ELSE 0 END, place_name, uploaded_by FROM assets
		WHERE deleted_at IS NULL AND (NOT hidden OR hidden_by = $1)
		  AND latitude IS NOT NULL AND longitude IS NOT NULL AND NOT (latitude = 0 AND longitude = 0)
		ORDER BY `+takenExpr+`, id`, auth.UserID(r.Context()))
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	defer rows.Close()
	list := [][7]any{}
	for rows.Next() {
		var id string
		var t int64
		var lat, lon float64
		var kind int
		var place *string
		var uploader *uuid.UUID
		if err := rows.Scan(&id, &t, &lat, &lon, &kind, &place, &uploader); err != nil {
			httpx.InternalError(w, err)
			return
		}
		list = append(list, [7]any{id, t, lat, lon, kind, place, uploader})
	}
	if err := rows.Err(); err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, list)
}
