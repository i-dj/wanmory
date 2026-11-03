-- 智能相册：按条件筛选照片。rules 是条件（JSON，格式见 internal/assets/smart.go）。
-- auto_sync 为 true 时照片列表每次按条件现查，以后上传的符合条件的照片自动出现；
-- 为 false 时只在建好（或改条件）的那一刻把符合条件的照片放进 album_assets，之后和普通相册一样。

-- +goose Up
ALTER TABLE albums
  ADD COLUMN kind      TEXT NOT NULL DEFAULT 'normal' CHECK (kind IN ('normal', 'smart')),
  ADD COLUMN rules     JSONB,
  ADD COLUMN auto_sync BOOLEAN NOT NULL DEFAULT false;

-- +goose Down
ALTER TABLE albums DROP COLUMN kind, DROP COLUMN rules, DROP COLUMN auto_sync;
