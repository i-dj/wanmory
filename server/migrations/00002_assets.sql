-- 媒体文件：照片、视频、音频。一行对应磁盘上的一个原始文件。

-- +goose Up
CREATE TABLE assets (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  original_path  TEXT NOT NULL UNIQUE,         -- 原始文件的绝对路径
  file_size      BIGINT NOT NULL,              -- 字节
  file_mtime     TIMESTAMPTZ NOT NULL,         -- 文件修改时间，用来判断重新扫描时文件是否变了
  checksum       BYTEA NOT NULL,               -- 文件内容的 SHA-1，用来查重
  mime_type      TEXT NOT NULL,
  width          INT,
  height         INT,
  duration_ms    INT,                          -- 视频、音频的时长
  taken_at       TIMESTAMPTZ,                  -- 拍摄时间（EXIF），没有就为空
  latitude       DOUBLE PRECISION,
  longitude      DOUBLE PRECISION,
  exif           JSONB NOT NULL DEFAULT '{}',  -- ExifTool 读出的原始元数据
  thumbnail_path TEXT,                         -- 小缩略图，用于网格
  preview_path   TEXT,                         -- 1440 像素预览图，用于大图和发给 AI 服务
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ                   -- 放进回收站的时间
);

CREATE INDEX assets_checksum_idx ON assets (checksum);
-- 时间线排序：没有拍摄时间的按文件修改时间
CREATE INDEX assets_timeline_idx ON assets ((COALESCE(taken_at, file_mtime)) DESC, id DESC) WHERE deleted_at IS NULL;

-- 语义搜索向量。同一张照片可以同时有新旧两个模型的向量，换模型重算完成前搜索继续用旧的。
-- 向量列不写死维度，不同模型的维度不同（ViT-H/14 是 1024，ViT-L/14 是 768，ViT-B/16 是 512）。
CREATE TABLE clip_embeddings (
  asset_id   UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  model_id   TEXT NOT NULL,                    -- 例如 'chinese-clip-vit-h-14'
  embedding  vector NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (asset_id, model_id)
);

-- 默认模型的向量索引。换成别的模型时为它另建一个同样的部分索引。
-- 查询必须写成 embedding::vector(1024) <=> ... 并带上 model_id 条件，才会用到索引。
CREATE INDEX clip_embeddings_vit_h_14_idx ON clip_embeddings
  USING hnsw ((embedding::vector(1024)) vector_cosine_ops)
  WHERE model_id = 'chinese-clip-vit-h-14';

-- +goose Down
DROP TABLE clip_embeddings;
DROP TABLE assets;
