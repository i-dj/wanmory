-- +goose Up
-- 界面语言：自己在「我的账号」里选的（'en'、'zh-CN'、'ja' ……）；空字符串是跟着浏览器
ALTER TABLE users ADD COLUMN locale TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE users DROP COLUMN locale;
