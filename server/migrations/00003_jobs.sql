-- 任务队列，用表实现，不需要 Redis。
-- 领取任务：SELECT ... WHERE status = 'pending' AND run_after <= now()
--           ORDER BY priority DESC, run_after FOR UPDATE SKIP LOCKED LIMIT n

-- +goose Up
CREATE TABLE jobs (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type         TEXT NOT NULL,                  -- 'metadata'、'thumbnail'、'clip' 等
  asset_id     UUID REFERENCES assets (id) ON DELETE CASCADE,  -- 和照片无关的任务为空
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'running', 'done', 'failed')),
  priority     INT NOT NULL DEFAULT 0,         -- 数字越大越优先
  attempts     INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 3,
  run_after    TIMESTAMPTZ NOT NULL DEFAULT now(),  -- 失败重试时往后推
  locked_by    TEXT,                           -- 领取者：本地 worker 或远程工作节点
  locked_until TIMESTAMPTZ,                    -- 租期，过期没交回就退回队列
  last_error   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ
);

-- 领取任务用
CREATE INDEX jobs_pending_idx ON jobs (priority DESC, run_after) WHERE status = 'pending';
-- 回收租期过期的任务用
CREATE INDEX jobs_running_idx ON jobs (locked_until) WHERE status = 'running';
-- 同一张照片的同一类任务，同时只能有一个在排队或运行
CREATE UNIQUE INDEX jobs_active_uniq ON jobs (type, asset_id) WHERE status IN ('pending', 'running');

-- +goose Down
DROP TABLE jobs;
