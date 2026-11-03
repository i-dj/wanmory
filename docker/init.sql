-- 只在数据库第一次初始化（pgdata 为空）时执行
CREATE EXTENSION IF NOT EXISTS vector;     -- 向量
CREATE EXTENSION IF NOT EXISTS pg_trgm;    -- 模糊搜索（OCR 文字、中文）
CREATE EXTENSION IF NOT EXISTS unaccent;   -- 去掉重音符号，方便搜外文
