-- +goose Up
-- 地名的英文写法和国家代码，网页界面不是中文时用：城市、省州显示英文（没有英文名的是当地文字），
-- 国家按国家代码用浏览器自己的各国语言名字（Intl.DisplayNames）。
-- country_code 为 NULL 表示还没查英文（后台慢慢补），查过但没有代码的存空字符串
ALTER TABLE geo_places
    ADD COLUMN city_en TEXT,
    ADD COLUMN state_en TEXT,
    ADD COLUMN country_code TEXT;

-- +goose Down
ALTER TABLE geo_places
    DROP COLUMN city_en,
    DROP COLUMN state_en,
    DROP COLUMN country_code;
