-- 网页增量刷新用：查「某个时间之后新增或变化过的照片」。

-- +goose Up
CREATE INDEX assets_updated_at_idx ON assets (updated_at) WHERE deleted_at IS NULL;

-- +goose Down
DROP INDEX assets_updated_at_idx;
