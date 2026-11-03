// Package migrations 把 SQL 迁移脚本打包进程序，启动时自动执行。
package migrations

import "embed"

//go:embed *.sql
var FS embed.FS
