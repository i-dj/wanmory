-- +goose Up
-- 在图库顶上的精选轮播里点了「不再精选」的照片，以后不放进轮播
ALTER TABLE assets ADD COLUMN no_highlight BOOLEAN NOT NULL DEFAULT false;

-- +goose Down
ALTER TABLE assets DROP COLUMN no_highlight;
