-- 人物的生日：设置了就能在「成长」里按年龄（几个月、几岁）看照片，没设置按年份
-- +goose Up
ALTER TABLE people ADD COLUMN birthday DATE;

-- +goose Down
ALTER TABLE people DROP COLUMN birthday;
