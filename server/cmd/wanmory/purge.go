package main

import (
	"context"
	"fmt"

	"github.com/wanmory/wanmory/server/internal/assets"
	"github.com/wanmory/wanmory/server/internal/config"
	"github.com/wanmory/wanmory/server/internal/db"
)

// purge 是 `wanmory purge` 子命令：删除所有上传的照片和相关数据，设置保留。
// 先显示要删除的数量，输入 yes 才执行；加 --yes 跳过确认。
func purge(ctx context.Context, args []string) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	conn, err := db.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer conn.Close()

	s, err := assets.Summarize(ctx, conn)
	if err != nil {
		return err
	}
	if s.Assets == 0 && s.Jobs == 0 {
		fmt.Println("没有照片，不需要删除。")
		return nil
	}

	fmt.Printf("将删除 %d 个照片和视频（含原始文件、缩略图、预览图）、%d 个任务、%d 条语义向量。\n",
		s.Assets, s.Jobs, s.Embeddings)
	fmt.Println("设置不受影响。删除后无法恢复。")

	res, err := assets.PurgeAll(ctx, conn)
	if err != nil {
		return err
	}
	fmt.Printf("已删除 %d 个照片记录，删除文件 %d 个。\n", res.Assets, res.Removed)
	if res.Missing > 0 {
		fmt.Printf("%d 个文件在本机找不到（可能是在 Docker 容器里上传的，在容器里运行 purge 才能删到）。\n", res.Missing)
	}
	for _, f := range res.Failed {
		fmt.Printf("删除失败：%s\n", f)
	}
	return nil
}
