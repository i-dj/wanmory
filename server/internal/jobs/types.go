package jobs

import (
	"context"
	"database/sql"
	"encoding/json"

	"github.com/google/uuid"
)

// Job 是被 worker 领取到的一个任务。
type Job struct {
	ID          int64
	Type        string
	AssetID     *uuid.UUID
	Payload     json.RawMessage
	Attempts    int // 包括这一次在内，已经尝试的次数
	MaxAttempts int
}

// NewJob 描述要加入队列的任务。
type NewJob struct {
	Type     string
	AssetID  *uuid.UUID // 和照片无关的任务为空
	Payload  any        // 会被序列化成 JSON，为空时存 {}
	Priority int        // 数字越大越优先
}

// HandlerFunc 处理一个任务；返回错误时任务会按退避时间重试，次数用完后标记为 failed。
type HandlerFunc func(ctx context.Context, job *Job) error

// Execer 可以是 *sql.DB，也可以是 *sql.Tx，方便和业务数据在同一个事务里入队。
type Execer interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}
