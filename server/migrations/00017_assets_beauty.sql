-- +goose Up
-- 照片好不好看（0–1，CLIP 和「构图漂亮的好照片」「模糊杂乱的随手拍」这些描述比出来的），
-- 相册、人物页把好看的放大显示用；还没算过是 NULL
ALTER TABLE assets ADD COLUMN beauty REAL;

-- +goose Down
ALTER TABLE assets DROP COLUMN beauty;
