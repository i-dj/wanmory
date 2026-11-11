-- +goose Up
-- 头像的另外两种：卡通头像（'cartoon:fox'）、上传后裁好的图片（'file:<上传时间>'，文件在 data/avatars/<用户 ID>.jpg）。
-- 空字符串时照旧：选了照片用 avatar_id，没选显示名字的第一个字
ALTER TABLE users ADD COLUMN avatar_style TEXT NOT NULL DEFAULT '';

-- +goose Down
ALTER TABLE users DROP COLUMN avatar_style;
