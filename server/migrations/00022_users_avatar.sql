-- 头像：家庭成员在照片上选「设为我的头像」的那一张，侧边栏、设置里显示它的缩略图。照片删了就回到名字的第一个字
-- +goose Up
ALTER TABLE users ADD COLUMN avatar_id UUID REFERENCES assets (id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE users DROP COLUMN avatar_id;
