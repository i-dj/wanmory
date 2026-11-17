package faces

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"strconv"
)

// 新建人物的门槛：同一张脸至少出现在几张照片里，才建成一个人物（系统设置里改，默认 3 张）。
// 数字小，偶尔出现的人也认得出来，但路人、重复的照片也容易单独成一个人；数字大，只留常出现的人。
//
// 门槛改了以后（以及升级后第一次启动时）按新的门槛整理一遍（ApplyMinPhotos）：
//   - 没起名字、没填生日、照片数不到门槛的人物拆掉，脸放回「没归人物」；起了名字或填了生日的都不动
//   - 没归人物的脸按新的门槛重新归一遍（Regroup），改小时以前不够数的人就认出来了
// 整理到哪个门槛记在 appliedKey 里，重启时一样就不再整理

const (
	SettingMinPhotos = "faces.min_photos"
	DefaultMinPhotos = 3
	appliedKey       = "faces.min_photos_applied"
)

type querier interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

// minPhotos 读系统设置里的门槛，没设置过或读不出来用默认的 3
func minPhotos(ctx context.Context, q querier) int {
	var raw []byte
	if err := q.QueryRowContext(ctx, `SELECT value FROM settings WHERE key = $1`, SettingMinPhotos).Scan(&raw); err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			log.Printf("faces: cannot read the minimum photos per person, using the default %d: %v", DefaultMinPhotos, err)
		}
		return DefaultMinPhotos
	}
	var s string
	if json.Unmarshal(raw, &s) != nil {
		return DefaultMinPhotos
	}
	if n, err := strconv.Atoi(s); err == nil && n >= 2 {
		return n
	}
	return DefaultMinPhotos
}

// ApplyMinPhotos 按现在的门槛整理人物（见文件开头）。force 为 false 时，已经按这个门槛整理过就不再做（启动时用）
func (s *Service) ApplyMinPhotos(ctx context.Context, force bool) {
	n := minPhotos(ctx, s.db)
	if !force {
		var raw []byte
		if err := s.db.QueryRowContext(ctx, `SELECT value FROM settings WHERE key = $1`, appliedKey).Scan(&raw); err == nil {
			var done int
			if json.Unmarshal(raw, &done) == nil && done == n {
				s.Regroup(ctx)
				return
			}
		}
	}
	removed, err := s.dissolveSmall(ctx, n)
	if err != nil {
		log.Printf("faces: applying the minimum of %d photos per person failed: %v", n, err)
		return
	}
	if removed > 0 {
		log.Printf("faces: minimum is %d photos per person; dissolved %d unnamed people below it", n, removed)
	}
	s.Regroup(ctx)
	if ctx.Err() == nil {
		if _, err := s.db.ExecContext(ctx, `
			INSERT INTO settings (key, value) VALUES ($1, to_jsonb($2::int))
			ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`, appliedKey, n); err != nil {
			log.Printf("faces: cannot record the applied minimum: %v", err)
		}
	}
}

// dissolveSmall 拆掉没起名字、没填生日、照片（没删掉的）不到 n 张的人物，返回拆了几个
func (s *Service) dissolveSmall(ctx context.Context, n int) (int64, error) {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()
	if _, err := tx.ExecContext(ctx, `SELECT pg_advisory_xact_lock($1)`, clusterLockKey); err != nil {
		return 0, err
	}
	res, err := tx.ExecContext(ctx, `
		DELETE FROM people p
		WHERE p.name = '' AND p.birthday IS NULL
		  AND (SELECT count(DISTINCT f.asset_id) FROM faces f JOIN assets a ON a.id = f.asset_id AND a.deleted_at IS NULL
		       WHERE f.person_id = p.id) < $1`, n)
	if err != nil {
		return 0, err
	}
	removed, _ := res.RowsAffected()
	return removed, tx.Commit()
}
