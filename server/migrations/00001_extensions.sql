-- 扩展。init.sql 在开发库第一次初始化时也会建，这里再写一遍，保证部署环境不依赖 init.sql。

-- +goose Up
CREATE EXTENSION IF NOT EXISTS vector;     -- 向量
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- 模糊搜索（OCR 文字、中文）
CREATE EXTENSION IF NOT EXISTS unaccent;   -- 去掉重音符号，方便搜外文

-- +goose Down
-- 扩展可能被其他对象依赖，回滚时不删除。
SELECT 1;
