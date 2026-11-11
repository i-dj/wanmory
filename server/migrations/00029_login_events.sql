-- +goose Up
-- 登录日志：每次登录（成功的和密码不对的）记一条，系统设置里管理员能看。
-- name 是登录时填的名字（名字不存在时也记，看得出有人在乱试）；location 是当时按 IP 查到的大概位置
CREATE TABLE login_events (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID REFERENCES users (id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  ok         BOOLEAN NOT NULL,
  ip         TEXT NOT NULL DEFAULT '',
  user_agent TEXT NOT NULL DEFAULT '',
  location   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX login_events_created_idx ON login_events (created_at DESC);

-- +goose Down
DROP TABLE login_events;
