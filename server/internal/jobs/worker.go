package jobs

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"runtime/debug"
	"sync"
	"sync/atomic"
	"time"
)

const (
	pollInterval    = time.Second      // 队列空的时候多久再查一次
	reapInterval    = 30 * time.Second // 多久回收一次租期过期的任务
	defaultLease    = 10 * time.Minute // 领取任务的租期，也是单个任务的超时时间
	baseRetryDelay  = 30 * time.Second // 第 n 次失败后等待 n² × 30 秒再重试
	retryLaterDelay = 15 * time.Second // ErrRetryLater 的任务多久后再试
)

// ErrRetryLater 由处理函数返回（可以包在别的错误里），表示暂时做不了、和任务本身无关（例如 AI 服务连不上）：
// 任务退回队列稍后再做，不消耗重试次数
var ErrRetryLater = errors.New("稍后再试")

// Worker 从队列领取任务并交给注册的处理函数。只领取自己注册过的任务类型，
// 其他类型（例如交给 AI 服务的任务）留给别的 worker。
type Worker struct {
	db          *sql.DB
	name        string
	concurrency int
	lease       time.Duration
	handlers    map[string]HandlerFunc
	ready       []func() bool
	limit       func() int
	active      atomic.Int32
}

// NewWorker 创建 worker。name 写进 jobs.locked_by，同一个名字只能有一个进程在用；
// 启动时会把这个名字上次没做完的任务退回队列。
func NewWorker(db *sql.DB, name string, concurrency int) *Worker {
	return &Worker{
		db:          db,
		name:        name,
		concurrency: concurrency,
		lease:       defaultLease,
		handlers:    map[string]HandlerFunc{},
	}
}

// Register 注册某类任务的处理函数，必须在 Run 之前调用。
func (w *Worker) Register(jobType string, h HandlerFunc) {
	w.handlers[jobType] = h
}

// SetReady 加一个开关：返回 false 时暂停领取任务（例如 AI 服务连不上、有人在上传照片），等它恢复再接着领，
// 不会把任务一个个领出来失败、白白用掉重试次数。可以加多个，全都是 true 才领。必须在 Run 之前调用。
func (w *Worker) SetReady(ready func() bool) {
	w.ready = append(w.ready, ready)
}

// SetLimit 让同时处理的任务数可以在运行中调整（设置页上改）：limit 返回 1 到 concurrency 之间的数，
// 多出来的那几路先歇着。必须在 Run 之前调用。
func (w *Worker) SetLimit(limit func() int) {
	w.limit = limit
}

// Active 是现在正在处理的任务数
func (w *Worker) Active() int {
	return int(w.active.Load())
}

func (w *Worker) isReady() bool {
	for _, r := range w.ready {
		if !r() {
			return false
		}
	}
	return true
}

// Run 开始处理任务，直到 ctx 被取消；返回前会等正在处理的任务做完。
func (w *Worker) Run(ctx context.Context) {
	types := make([]string, 0, len(w.handlers))
	for t := range w.handlers {
		types = append(types, t)
	}

	if err := w.releaseOwn(ctx); err != nil {
		log.Printf("jobs: 退回上次未完成的任务失败: %v", err)
	}

	var wg sync.WaitGroup
	for i := range w.concurrency {
		wg.Go(func() { w.loop(ctx, i, types) })
	}
	wg.Go(func() { w.reapLoop(ctx) })
	wg.Wait()
}

func (w *Worker) loop(ctx context.Context, slot int, types []string) {
	for ctx.Err() == nil {
		if (w.limit != nil && slot >= w.limit()) || !w.isReady() {
			select {
			case <-ctx.Done():
			case <-time.After(pollInterval):
			}
			continue
		}
		job, err := w.claim(ctx, types)
		if err != nil && ctx.Err() == nil {
			log.Printf("jobs: 领取任务失败: %v", err)
		}
		if job == nil {
			select {
			case <-ctx.Done():
			case <-time.After(pollInterval):
			}
			continue
		}
		w.active.Add(1)
		w.execute(job)
		w.active.Add(-1)
	}
}

// claim 领取一个可以执行的任务；队列里没有时返回 nil。
func (w *Worker) claim(ctx context.Context, types []string) (*Job, error) {
	var j Job
	var payload []byte
	err := w.db.QueryRowContext(ctx, `
		UPDATE jobs SET status = 'running', attempts = attempts + 1,
		       locked_by = $1, locked_until = now() + make_interval(secs => $2), updated_at = now()
		WHERE id = (
			SELECT id FROM jobs
			WHERE status = 'pending' AND run_after <= now() AND type = ANY($3)
			ORDER BY priority DESC, run_after
			FOR UPDATE SKIP LOCKED
			LIMIT 1
		)
		RETURNING id, type, asset_id, payload, attempts, max_attempts`,
		w.name, w.lease.Seconds(), types,
	).Scan(&j.ID, &j.Type, &j.AssetID, &payload, &j.Attempts, &j.MaxAttempts)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	j.Payload = payload
	return &j, nil
}

// execute 执行任务并写回结果。任务不跟随 Run 的 ctx 取消：关机时让正在做的任务做完。
func (w *Worker) execute(j *Job) {
	ctx, cancel := context.WithTimeout(context.Background(), w.lease)
	defer cancel()

	start := time.Now()
	err := w.safeRun(ctx, j)

	finishCtx, cancelFinish := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelFinish()
	if err == nil {
		_, err = w.db.ExecContext(finishCtx, `
			UPDATE jobs SET status = 'done', finished_at = now(), updated_at = now(),
			       locked_by = NULL, locked_until = NULL, last_error = NULL
			WHERE id = $1 AND status = 'running' AND locked_by = $2`, j.ID, w.name)
		if err != nil {
			log.Printf("jobs: 标记任务 %d 完成失败: %v", j.ID, err)
		}
		return
	}

	if errors.Is(err, ErrRetryLater) {
		// 不是任务本身的问题（例如 AI 服务暂时连不上）：退回队列稍后再做，不算一次尝试
		_, dbErr := w.db.ExecContext(finishCtx, `
			UPDATE jobs SET status = 'pending', attempts = attempts - 1,
			       run_after = now() + make_interval(secs => $3), last_error = $4,
			       updated_at = now(), locked_by = NULL, locked_until = NULL
			WHERE id = $1 AND status = 'running' AND locked_by = $2`,
			j.ID, w.name, retryLaterDelay.Seconds(), err.Error())
		if dbErr != nil {
			log.Printf("jobs: 退回任务 %d 时出错: %v", j.ID, dbErr)
		}
		return
	}

	log.Printf("jobs: %s #%d 第 %d/%d 次失败（%s）: %v",
		j.Type, j.ID, j.Attempts, j.MaxAttempts, time.Since(start).Round(time.Millisecond), err)
	retryAfter := time.Duration(j.Attempts*j.Attempts) * baseRetryDelay
	_, dbErr := w.db.ExecContext(finishCtx, `
		UPDATE jobs SET
		       status      = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
		       finished_at = CASE WHEN attempts >= max_attempts THEN now() END,
		       run_after   = now() + make_interval(secs => $3),
		       last_error  = $4, updated_at = now(), locked_by = NULL, locked_until = NULL
		WHERE id = $1 AND status = 'running' AND locked_by = $2`,
		j.ID, w.name, retryAfter.Seconds(), err.Error())
	if dbErr != nil {
		log.Printf("jobs: 标记任务 %d 失败时出错: %v", j.ID, dbErr)
	}
}

// safeRun 调用处理函数，并把 panic 转成普通错误，避免一个坏任务拖垮整个程序。
func (w *Worker) safeRun(ctx context.Context, j *Job) (err error) {
	defer func() {
		if r := recover(); r != nil {
			err = fmt.Errorf("panic: %v\n%s", r, debug.Stack())
		}
	}()
	return w.handlers[j.Type](ctx, j)
}

// releaseOwn 把上次进程退出时还挂在自己名下的任务退回队列。
func (w *Worker) releaseOwn(ctx context.Context) error {
	_, err := w.db.ExecContext(ctx, `
		UPDATE jobs SET status = 'pending', run_after = now(), updated_at = now(),
		       locked_by = NULL, locked_until = NULL
		WHERE status = 'running' AND locked_by = $1`, w.name)
	return err
}

func (w *Worker) reapLoop(ctx context.Context) {
	t := time.NewTicker(reapInterval)
	defer t.Stop()
	for {
		select {
		case <-ctx.Done():
			return
		case <-t.C:
			if err := Reap(ctx, w.db); err != nil && ctx.Err() == nil {
				log.Printf("jobs: 回收过期任务失败: %v", err)
			}
		}
	}
}

// Reap 把租期已过、却没有交回结果的任务退回队列（例如远程节点掉线）；次数用完的标记为 failed。
func Reap(ctx context.Context, db Execer) error {
	_, err := db.ExecContext(ctx, `
		UPDATE jobs SET
		       status      = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
		       finished_at = CASE WHEN attempts >= max_attempts THEN now() END,
		       last_error  = COALESCE(last_error, '租期过期，没有交回结果'),
		       run_after   = now(), updated_at = now(), locked_by = NULL, locked_until = NULL
		WHERE status = 'running' AND locked_until < now()`)
	return err
}
