-- 隐藏照片（图库和各分类里不显示，只在「已隐藏」里看得到），以及「最近删除」。
-- 删除只是填上 deleted_at，照片可以恢复；增量刷新要把删除也告诉网页，updated_at 的索引不再排除删除的照片。

-- +goose Up
ALTER TABLE assets ADD COLUMN hidden BOOLEAN NOT NULL DEFAULT false;
DROP INDEX assets_updated_at_idx;
CREATE INDEX assets_updated_at_idx ON assets (updated_at);

-- +goose Down
DROP INDEX assets_updated_at_idx;
CREATE INDEX assets_updated_at_idx ON assets (updated_at) WHERE deleted_at IS NULL;
ALTER TABLE assets DROP COLUMN hidden;
