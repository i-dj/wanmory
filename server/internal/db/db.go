// Package db 负责连接 PostgreSQL 和执行数据库迁移。
package db

import (
	"context"
	"database/sql"
	"fmt"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/wanmory/wanmory/server/migrations"
)

// Open 连接数据库，并确认连得上。
func Open(ctx context.Context, url string) (*sql.DB, error) {
	conn, err := sql.Open("pgx", url)
	if err != nil {
		return nil, err
	}
	if err := conn.PingContext(ctx); err != nil {
		conn.Close()
		return nil, fmt.Errorf("连接数据库失败: %w", err)
	}
	return conn, nil
}

// Migrate 执行 migrations 目录里所有还没执行过的迁移。
func Migrate(ctx context.Context, conn *sql.DB) error {
	provider, err := goose.NewProvider(goose.DialectPostgres, conn, migrations.FS)
	if err != nil {
		return err
	}
	results, err := provider.Up(ctx)
	for _, r := range results {
		fmt.Printf("migration %s (%s)\n", r.Source.Path, r.Duration)
	}
	return err
}
