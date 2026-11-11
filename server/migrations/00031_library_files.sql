-- +goose Up
-- 照片目录（挂载进来的 NAS、移动硬盘……）里扫到过的文件：路径记一次，以后不再重复导入。
-- asset_id 是导入成的照片；和已有照片内容一样（重复）的、在相册里永久删除了的是 NULL，同样不再导入
CREATE TABLE library_files (
  path     TEXT PRIMARY KEY,
  asset_id UUID REFERENCES assets (id) ON DELETE SET NULL,
  seen_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE library_files;
