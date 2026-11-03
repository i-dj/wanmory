-- 连拍整理：一组连拍（或者同一张存了两份）看过了、选了「都保留」，就不再列出来
-- +goose Up
ALTER TABLE assets ADD COLUMN burst_reviewed BOOLEAN NOT NULL DEFAULT false;

-- +goose Down
ALTER TABLE assets DROP COLUMN burst_reviewed;
