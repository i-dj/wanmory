-- 相册的主人和私有 / 共享：私有相册只有建它的人看得到（管理员也看不到），共享相册家里人都能看、都能往里放照片，
-- 只有建它的人（主人不在了时是管理员）能改名、删除、改私有。新建的相册默认私有；已有的相册都算管理员建的、共享的。
-- hide_mine：私有相册里主人自己传的照片同时「隐藏」（别人的图库里看不到），以后放进来的也自动隐藏。
-- assets.hidden_via 记下照片是因为哪个相册被隐藏的：改回共享、关掉这个选项、从相册里移出时，只取消这些的隐藏，
-- 在别处自己隐藏的不动。相册删了时照片还是隐藏着（留在「已隐藏」里），只是不再记是哪个相册
-- +goose Up
ALTER TABLE albums
  ADD COLUMN owner_id  UUID REFERENCES users (id) ON DELETE SET NULL,
  ADD COLUMN private   BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN hide_mine BOOLEAN NOT NULL DEFAULT false;
UPDATE albums SET owner_id = (SELECT id FROM users WHERE is_admin ORDER BY created_at LIMIT 1);
ALTER TABLE assets ADD COLUMN hidden_via UUID REFERENCES albums (id) ON DELETE SET NULL;
CREATE INDEX assets_hidden_via_idx ON assets (hidden_via) WHERE hidden_via IS NOT NULL;

-- +goose Down
ALTER TABLE assets DROP COLUMN hidden_via;
ALTER TABLE albums DROP COLUMN owner_id, DROP COLUMN private, DROP COLUMN hide_mine;
