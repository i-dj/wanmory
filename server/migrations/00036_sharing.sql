-- 照片默认只有上传的人自己看得到。别人要看，得上传的人分享：
--   asset_shares   一张一张分享给某个人
--   library_shares 把自己传的全部（包括以后传的）分享给某个人
-- 另外，上传的人把照片放进共享相册（或者是相册主人自己的照片）也算分享给了能看这个相册的人；没有上传人的（照片目录导入的、
-- 建账号以前传的）全家都看得到。规则见 internal/db/visible.go
-- +goose Up
CREATE TABLE asset_shares (
  asset_id   UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  shared_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (asset_id, user_id)
);
CREATE INDEX asset_shares_user_idx ON asset_shares (user_id);

CREATE TABLE library_shares (
  owner_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  shared_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, user_id),
  CHECK (owner_id <> user_id)
);
CREATE INDEX library_shares_user_idx ON library_shares (user_id);

CREATE INDEX assets_uploaded_by_idx ON assets (uploaded_by);

-- 谁把照片放进相册的：上传的人自己放进共享相册才算分享（别人分享给自己的照片放进相册不会转分享出去）
ALTER TABLE album_assets ADD COLUMN added_by UUID REFERENCES users (id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE album_assets DROP COLUMN added_by;
DROP INDEX assets_uploaded_by_idx;
DROP TABLE library_shares;
DROP TABLE asset_shares;
