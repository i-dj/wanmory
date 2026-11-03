-- 网页左侧分类用的索引：「最近添加」按上传时间排序，「收藏」只看收藏的照片。

-- +goose Up
CREATE INDEX assets_added_idx ON assets (created_at DESC, id DESC) WHERE deleted_at IS NULL;
CREATE INDEX assets_favorite_idx ON assets ((COALESCE(taken_at, file_mtime)) DESC, id DESC)
  WHERE deleted_at IS NULL AND favorite;

-- +goose Down
DROP INDEX assets_added_idx;
DROP INDEX assets_favorite_idx;
