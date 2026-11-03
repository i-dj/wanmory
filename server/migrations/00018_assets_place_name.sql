-- +goose Up
-- 用户改位置时从搜索结果里选的地名（「丽江市」）。只存坐标的话，网页按坐标反查到的可能是更细的一级
-- （城市中心落在「古城区」里），和用户选的对不上；有它就先显示它。在地图上点的、还原、去掉位置时清空
ALTER TABLE assets ADD COLUMN place_name TEXT;

-- +goose Down
ALTER TABLE assets DROP COLUMN place_name;
