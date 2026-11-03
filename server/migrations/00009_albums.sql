-- 相册：用户自己建的照片集合。一张照片可以在多个相册里，删除相册不删照片。

-- +goose Up
CREATE TABLE albums (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE album_assets (
  album_id UUID NOT NULL REFERENCES albums (id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets (id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (album_id, asset_id)
);
CREATE INDEX album_assets_asset_idx ON album_assets (asset_id);

-- +goose Down
DROP TABLE album_assets;
DROP TABLE albums;
