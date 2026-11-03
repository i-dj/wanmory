-- 相册封面：用户在相册上右键「修改封面」选的那张。为空时用相册里最新的一张；选的照片被删了、隐藏了也退回默认
-- +goose Up
ALTER TABLE albums ADD COLUMN cover_id UUID REFERENCES assets (id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE albums DROP COLUMN cover_id;
