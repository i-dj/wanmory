// Package jobs 是用 PostgreSQL 表实现的任务队列。
//
// 入队：jobs.Enqueue(ctx, tx, jobs.NewJob{Type: "thumbnail", AssetID: &id})
// 处理：worker.Register("thumbnail", handler)，然后 worker.Run(ctx)
package jobs

import (
	"context"
	"encoding/json"
)

// Enqueue 把任务加入队列。同一张照片的同一类任务已经在排队或运行时，什么也不做。
func Enqueue(ctx context.Context, db Execer, j NewJob) error {
	payload := []byte("{}")
	if j.Payload != nil {
		var err error
		if payload, err = json.Marshal(j.Payload); err != nil {
			return err
		}
	}
	_, err := db.ExecContext(ctx, `
		INSERT INTO jobs (type, asset_id, payload, priority) VALUES ($1, $2, $3, $4)
		ON CONFLICT (type, asset_id) WHERE status IN ('pending', 'running') DO NOTHING`,
		j.Type, j.AssetID, string(payload), j.Priority)
	return err
}
