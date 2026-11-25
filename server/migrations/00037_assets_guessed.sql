-- +goose Up
-- 从照片目录的文件夹名猜出来、补上的字段：'taken_at'（拍摄时间）、'location'（位置）。照片自己没有这些信息时才猜，
-- 见 assets 包的 folderguess.go。记下来是为了让网页标出「按文件夹名推断」，以后改了猜法也知道哪些可以重新猜
ALTER TABLE assets ADD COLUMN guessed TEXT[] NOT NULL DEFAULT '{}';

-- +goose Down
ALTER TABLE assets DROP COLUMN guessed;
