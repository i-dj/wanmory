-- 用户在大图的信息栏里改的东西：说明、拍摄时间、位置。只存在数据库里，不写回原文件。
-- edited 记下改过哪些（'taken_at'、'location'），重新读元数据时这些字段不被文件里的覆盖；
-- 文件里的原始值一直在 exif 列里，信息栏可以对照着看，也可以还原。

-- +goose Up
ALTER TABLE assets
  ADD COLUMN description  TEXT NOT NULL DEFAULT '',
  ADD COLUMN taken_offset TEXT,                    -- 改拍摄时间时选的时区，例如 '-04:00'；没改过为空，用 EXIF 里的
  ADD COLUMN edited       TEXT[] NOT NULL DEFAULT '{}';

-- +goose Down
ALTER TABLE assets DROP COLUMN description, DROP COLUMN taken_offset, DROP COLUMN edited;
