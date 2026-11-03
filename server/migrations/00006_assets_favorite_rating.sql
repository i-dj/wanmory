-- 收藏和星级（网页上鼠标悬停时可以修改）。

-- +goose Up
ALTER TABLE assets
  ADD COLUMN favorite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN rating   SMALLINT NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5);

-- +goose Down
ALTER TABLE assets DROP COLUMN favorite, DROP COLUMN rating;
