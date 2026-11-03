-- 照片的分类（截图、证件、文档、美食……），由 CLIP 向量和一组中文描述比出来（见 internal/clip）。
-- tags_version 记下是哪个模型、哪一版分类算的，换了模型或者改了分类，启动时把旧的重算
-- +goose Up
ALTER TABLE assets ADD COLUMN tags TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE assets ADD COLUMN tags_version TEXT;
CREATE INDEX assets_tags_idx ON assets USING gin (tags);

-- +goose Down
DROP INDEX assets_tags_idx;
ALTER TABLE assets DROP COLUMN tags_version;
ALTER TABLE assets DROP COLUMN tags;
