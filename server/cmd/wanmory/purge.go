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
		fmt.Println("No photos, nothing to delete.")
		return nil
	}

	fmt.Printf("Deleting %d photos and videos (originals, thumbnails and previews), %d jobs and %d embeddings.\n",
		s.Assets, s.Jobs, s.Embeddings)
	fmt.Println("Settings are kept. This cannot be undone.")

	res, err := assets.PurgeAll(ctx, conn)
	if err != nil {
		return err
	}
	fmt.Printf("Deleted %d photo records and %d files.\n", res.Assets, res.Removed)
	if res.Missing > 0 {
		fmt.Printf("%d files were not found on this machine (they may have been uploaded inside the Docker container; run purge inside the container to delete them).\n", res.Missing)
	}
	for _, f := range res.Failed {
		fmt.Printf("Could not delete: %s\n", f)
	}
	return nil
}
