-- +goose Up
-- 每处登录记下最近一次从哪个 IP 用、什么时候用的（「我的账号」的登录设备里显示）
ALTER TABLE sessions ADD COLUMN ip TEXT NOT NULL DEFAULT '';
ALTER TABLE sessions ADD COLUMN last_seen TIMESTAMPTZ;

-- +goose Down
ALTER TABLE sessions DROP COLUMN last_seen;
ALTER TABLE sessions DROP COLUMN ip;
