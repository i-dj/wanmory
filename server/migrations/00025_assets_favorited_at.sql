-- 收藏的时间：「收藏」里可以按收藏日期排（最近收藏的在前）。取消收藏时清空，再收藏重新记。
-- 已经收藏着的照片不知道是什么时候收藏的，先用最后修改时间
-- +goose Up
ALTER TABLE assets ADD COLUMN favorited_at TIMESTAMPTZ;
UPDATE assets SET favorited_at = updated_at WHERE favorite;
CREATE INDEX assets_favorited_idx ON assets (favorited_at DESC, id DESC) WHERE favorite AND deleted_at IS NULL;

-- +goose Down
ALTER TABLE assets DROP COLUMN favorited_at;
