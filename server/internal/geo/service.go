package geo

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
	"github.com/wanmory/wanmory/server/internal/httpx"
)

// KeyExpr 是照片在 geo_places 里对应哪一行：坐标四舍五入到 0.01 度（约 1 公里），例如 '41.88,-87.63'。
// 在 assets 表的查询里用（列名不带表名）
const KeyExpr = `(round(latitude::numeric, 2) || ',' || round(longitude::numeric, 2))`

// hasPlace 是有可用坐标的照片（0,0 多半是没定位的手机写的，不算）
const hasPlace = `latitude IS NOT NULL AND longitude IS NOT NULL AND NOT (latitude = 0 AND longitude = 0)`

const (
	batchSize    = 20              // 后台每轮查几个地方
	idleInterval = time.Minute     // 都查完了（或者在线地图关着）隔多久再看有没有新照片
	retryAfter   = 5 * time.Minute // 连不上 Nominatim 时隔多久再试
)

// Service 查城市、存进 geo_places。enabled 是设置里的「在线地图」开没开，每次查之前读，改了设置马上生效
type Service struct {
	db      *sql.DB
	client  *Client
	enabled func(ctx context.Context) bool
}

func NewService(db *sql.DB, enabled func(ctx context.Context) bool) *Service {
	return &Service{db: db, client: NewClient(), enabled: enabled}
}

func (s *Service) Routes(mux *http.ServeMux) {
	mux.HandleFunc("POST /api/assets/{id}/place", s.place)
}

// Run 在后台把还没查过城市的地方一个个查好，最近拍的先查。按 Nominatim 的规定每秒最多问一次，
// 几百个地方要几分钟；查好一个，那里的照片 updated_at 更新，打开着的网页增量刷新就拿到了
func (s *Service) Run(ctx context.Context) {
	for {
		wait := idleInterval
		if s.enabled(ctx) {
			n, err := s.fill(ctx)
			switch {
			case ctx.Err() != nil:
				return
			case err != nil:
				log.Printf("geo: 查城市失败，%s后再试: %v", retryAfter, err)
				wait = retryAfter
			case n == batchSize:
				wait = 0 // 还有没查的，接着查
			default:
				// 新地方都查完了，给以前只存了中文的地方补英文写法和国家代码
				m, err := s.fillEnglish(ctx)
				switch {
				case ctx.Err() != nil:
					return
				case err != nil:
					log.Printf("geo: 补英文地名失败，%s后再试: %v", retryAfter, err)
					wait = retryAfter
				case m == batchSize:
					wait = 0
				}
			}
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(wait):
		}
	}
}

// fill 查一批还没查过的地方，返回查了几个
func (s *Service) fill(ctx context.Context) (int, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT `+KeyExpr+`, round(latitude::numeric, 2)::float8, round(longitude::numeric, 2)::float8
		FROM assets
		WHERE `+hasPlace+` AND deleted_at IS NULL
		  AND NOT EXISTS (SELECT 1 FROM geo_places g WHERE g.key = `+KeyExpr+`)
		GROUP BY 1, 2, 3
		ORDER BY max(COALESCE(taken_at, file_mtime)) DESC
		LIMIT $1`, batchSize)
	if err != nil {
		return 0, err
	}
	type spot struct {
		key      string
		lat, lon float64
	}
	var todo []spot
	for rows.Next() {
		var p spot
		if err := rows.Scan(&p.key, &p.lat, &p.lon); err != nil {
			rows.Close()
			return 0, err
		}
		todo = append(todo, p)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, err
	}
	for i, p := range todo {
		place, err := s.client.Lookup(ctx, p.lat, p.lon)
		if err != nil {
			return i, err
		}
		if err := s.save(ctx, p.key, place); err != nil {
			return i, err
		}
	}
	return len(todo), nil
}

// save 存一个地方的城市（place 为 nil 是那里没有城市），再把那里的照片标成变过，网页增量刷新时带上城市
func (s *Service) save(ctx context.Context, key string, place *Place) error {
	var city, state, country, cityEn, stateEn, code *string
	if place != nil {
		city, state, country = &place.City, nullIfEmpty(place.State), nullIfEmpty(place.Country)
		cityEn, stateEn, code = nullIfEmpty(place.CityEn), nullIfEmpty(place.StateEn), &place.CountryCode
	}
	if _, err := s.db.ExecContext(ctx, `
		INSERT INTO geo_places (key, city, state, country, city_en, state_en, country_code) VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (key) DO NOTHING`, key, city, state, country, cityEn, stateEn, code); err != nil {
		return err
	}
	if place == nil {
		return nil
	}
	return s.touch(ctx, key)
}

// touch 把这个地方的照片标成变过，打开着的网页增量刷新时带上新的地名
func (s *Service) touch(ctx context.Context, key string) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE assets SET updated_at = now() WHERE `+hasPlace+` AND deleted_at IS NULL AND `+KeyExpr+` = $1`, key)
	return err
}

// fillEnglish 给一批以前只存了中文的地方补英文写法和国家代码，返回补了几个
func (s *Service) fillEnglish(ctx context.Context) (int, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT key FROM geo_places WHERE city IS NOT NULL AND country_code IS NULL ORDER BY created_at DESC LIMIT $1`, batchSize)
	if err != nil {
		return 0, err
	}
	var keys []string
	for rows.Next() {
		var k string
		if err := rows.Scan(&k); err != nil {
			rows.Close()
			return 0, err
		}
		keys = append(keys, k)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return 0, err
	}
	for i, key := range keys {
		var lat, lon float64
		if _, err := fmt.Sscanf(key, "%g,%g", &lat, &lon); err != nil {
			continue
		}
		en, err := s.client.LookupEnglish(ctx, lat, lon)
		if err != nil {
			return i, err
		}
		if en == nil {
			en = &Place{} // 英文查不到城市：存空的国家代码，不再重问
		}
		if _, err := s.db.ExecContext(ctx, `
			UPDATE geo_places SET city_en = $2, state_en = $3, country_code = $4 WHERE key = $1`,
			key, nullIfEmpty(en.City), nullIfEmpty(en.State), en.CountryCode); err != nil {
			return i, err
		}
		if err := s.touch(ctx, key); err != nil {
			return i, err
		}
	}
	return len(keys), nil
}

// place：POST /api/assets/{id}/place，照片拍摄地点所在的城市。库里有就直接给，没有就当场问 Nominatim 再存进库里。
// 没有坐标、那里没有城市、在线地图关着时返回 null
func (s *Service) place(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "照片 ID 格式不对")
		return
	}
	ctx := r.Context()
	var (
		key                                         *string
		lat, lon                                    *float64
		known                                       bool
		city, state, country, cityEn, stateEn, code *string
	)
	err = s.db.QueryRowContext(ctx, `
		SELECT CASE WHEN `+hasPlace+` THEN `+KeyExpr+` END, latitude, longitude,
		       g.key IS NOT NULL, g.city, g.state, g.country, g.city_en, g.state_en, g.country_code
		FROM assets LEFT JOIN geo_places g ON g.key = `+KeyExpr+`
		WHERE id = $1`, id).Scan(&key, &lat, &lon, &known, &city, &state, &country, &cityEn, &stateEn, &code)
	if errors.Is(err, sql.ErrNoRows) {
		httpx.Error(w, http.StatusNotFound, "照片不存在")
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	switch {
	case key == nil:
		httpx.JSON(w, http.StatusOK, nil)
	case known && city == nil:
		httpx.JSON(w, http.StatusOK, nil)
	case known:
		httpx.JSON(w, http.StatusOK, Place{City: *city, State: deref(state), Country: deref(country),
			CityEn: deref(cityEn), StateEn: deref(stateEn), CountryCode: deref(code)})
	case !s.enabled(ctx):
		httpx.JSON(w, http.StatusOK, nil)
	default:
		place, err := s.client.Lookup(ctx, *lat, *lon)
		if err != nil {
			httpx.Error(w, http.StatusBadGateway, "查不到城市："+err.Error())
			return
		}
		if err := s.save(ctx, *key, place); err != nil {
			httpx.InternalError(w, err)
			return
		}
		httpx.JSON(w, http.StatusOK, place)
	}
}

func nullIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
