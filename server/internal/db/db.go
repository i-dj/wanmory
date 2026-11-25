// Package db 负责连接 PostgreSQL 和执行数据库迁移。
package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"

	"github.com/wanmory/wanmory/server/migrations"
)

// Open 连接数据库，并确认连得上。
//
// 关掉 JIT（连接地址里自己写了 jit 的照它的）：不是管理员的人，每个查询都带着 db.Visible 那串相关子查询，
// 规划器把代价估得很高（几百万），过了 jit_above_cost 就先把查询编译成机器码，每次要 300 多毫秒，
// 而查询本身只要几毫秒。照片多的普通成员打开每个页面都慢半秒以上（连拍整理、统计、时间线都是）
func Open(ctx context.Context, url string) (*sql.DB, error) {
	cfg, err := pgx.ParseConfig(url)
	if err != nil {
		return nil, err
	}
	if _, set := cfg.RuntimeParams["jit"]; !set {
		cfg.RuntimeParams["jit"] = "off"
	}
	conn := stdlib.OpenDB(*cfg)
	if err := conn.PingContext(ctx); err != nil {
		conn.Close()
		return nil, fmt.Errorf("connecting to the database: %w", err)
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
		log.Printf("db: migration %s (%s)", r.Source.Path, r.Duration)
	}
	return err
}
