-- +goose Up
-- 手动归的分类：在「风景」「美食」这些分类里上传（拖进去）的照片记在这里。和 AI 算的 tags 分开放，
-- AI 重新分类（换模型、改分类规则）时只改 tags，不会把用户自己归的分类冲掉；按分类看照片时两边都算
ALTER TABLE assets ADD COLUMN manual_tags TEXT[] NOT NULL DEFAULT '{}';

-- +goose Down
ALTER TABLE assets DROP COLUMN manual_tags;
