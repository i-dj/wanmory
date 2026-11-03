-- 照片拍摄地点所在的城市（网页上照片底下写的「芝加哥 / 伊利诺伊州 · 美国」），按坐标问 OpenStreetMap 的 Nominatim 得到。
-- 按坐标四舍五入到 0.01 度（约 1 公里）存一行，同一个地方拍的照片只问一次；照片改了位置自然对到别的一行，不用清。
-- city 为空表示问过了但那里没有城市（海上、荒野），不再重问。见 internal/geo
-- +goose Up
CREATE TABLE geo_places (
  key        TEXT PRIMARY KEY,        -- '41.88,-87.63'
  city       TEXT,
  state      TEXT,                    -- 省、州
  country    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- +goose Down
DROP TABLE geo_places;
