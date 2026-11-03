// Package settings 读写 settings 表：键值对，值是任意 JSON。
//
// 用法：
//
//	online, err := settings.GetOr(ctx, store, "maps.online", "on")
//	err = store.Set(ctx, "maps.online", "off", &adminID)
package settings

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"

	"github.com/google/uuid"
)

type Store struct {
	db *sql.DB
}

func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

// Get 把 key 对应的值解析到 dst 里；没有这个设置时返回 ErrNotFound。
func (s *Store) Get(ctx context.Context, key string, dst any) error {
	var raw []byte
	err := s.db.QueryRowContext(ctx, `SELECT value FROM settings WHERE key = $1`, key).Scan(&raw)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	return json.Unmarshal(raw, dst)
}

// GetOr 读取设置，没有设置过时返回默认值 def。
func GetOr[T any](ctx context.Context, s *Store, key string, def T) (T, error) {
	var v T
	err := s.Get(ctx, key, &v)
	if errors.Is(err, ErrNotFound) {
		return def, nil
	}
	if err != nil {
		return def, err
	}
	return v, nil
}

// Set 写入设置，已有就覆盖。value 会被序列化成 JSON；updatedBy 为空表示系统写入。
func (s *Store) Set(ctx context.Context, key string, value any, updatedBy *uuid.UUID) error {
	raw, err := json.Marshal(value)
	if err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO settings (key, value, updated_by) VALUES ($1, $2, $3)
		ON CONFLICT (key) DO UPDATE
		SET value = EXCLUDED.value, updated_by = EXCLUDED.updated_by, updated_at = now()`,
		key, string(raw), updatedBy)
	return err
}

// Delete 删除设置，之后读取会回到默认值。
func (s *Store) Delete(ctx context.Context, key string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM settings WHERE key = $1`, key)
	return err
}

// List 返回所有设置，按 key 排序。
func (s *Store) List(ctx context.Context) ([]Setting, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT key, value, updated_at, updated_by FROM settings ORDER BY key`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []Setting{}
	for rows.Next() {
		var st Setting
		var raw []byte
		if err := rows.Scan(&st.Key, &raw, &st.UpdatedAt, &st.UpdatedBy); err != nil {
			return nil, err
		}
		st.Value = raw
		list = append(list, st)
	}
	return list, rows.Err()
}
