-- 人脸识别：每张照片里找到的人脸（faces），以及按长相归到一起的人物（people）。
-- 人脸的位置按 1440 像素预览图算，存成占图片宽高的比例（0–1），和图片大小无关。
-- 特征是 512 维、长度为 1 的向量，两张脸的余弦距离（<=>）越小越像。

-- +goose Up
CREATE TABLE people (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT '',       -- 用户起的名字，没起是空字符串
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE faces (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id   UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  model_id   TEXT NOT NULL,                  -- 例如 'antelopev2'，不同模型的特征不能放在一起比
  box_x      REAL NOT NULL,                  -- 左上角和宽高，占图片的比例
  box_y      REAL NOT NULL,
  box_w      REAL NOT NULL,
  box_h      REAL NOT NULL,
  landmarks  JSONB NOT NULL,                 -- 5 个关键点（两眼、鼻尖、两嘴角），也是比例
  score      REAL NOT NULL,                  -- 检测的把握
  blur       REAL NOT NULL,                  -- 越小越模糊
  yaw        REAL NOT NULL,                  -- 左右转头程度，0 是正脸
  good       BOOLEAN NOT NULL,               -- 够清楚、够正、够大，能用来建立人物；不够的只在很像时跟着归进去
  embedding  vector(512) NOT NULL,
  person_id  UUID REFERENCES people (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX faces_asset_idx ON faces (asset_id);
CREATE INDEX faces_person_idx ON faces (person_id);
CREATE INDEX faces_embedding_idx ON faces USING hnsw (embedding vector_cosine_ops);

-- 这张照片用哪个模型找过人脸；换模型或者还没找过的，启动时补排 face 任务
ALTER TABLE assets ADD COLUMN face_model TEXT;

-- +goose Down
ALTER TABLE assets DROP COLUMN face_model;
DROP TABLE faces;
DROP TABLE people;
