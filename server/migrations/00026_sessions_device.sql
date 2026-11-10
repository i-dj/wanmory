-- +goose Up
-- 登录时记下是什么设备（浏览器的 User-Agent），「我的账号」里列出在哪些设备上登录着，可以退出别的设备
ALTER TABLE sessions ADD COLUMN user_agent TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE sessions DROP COLUMN user_agent;
