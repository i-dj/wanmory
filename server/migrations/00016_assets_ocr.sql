-- 照片里认出来的字（OCR，见 internal/clip 和 ml/wanmory_ml/ocr.py），按字搜照片、判断是不是证件和文档时用。
-- ocr_norm 是去掉空白、转小写的全文，搜「过户 登记」和「过户登记」一样能搜到；trigram 索引让 LIKE '%…%' 也快
-- +goose Up
ALTER TABLE assets ADD COLUMN ocr_text TEXT;
ALTER TABLE assets ADD COLUMN ocr_model TEXT;
ALTER TABLE assets ADD COLUMN ocr_norm TEXT
  GENERATED ALWAYS AS (regexp_replace(lower(COALESCE(ocr_text, '')), '\s+', '', 'g')) STORED;
CREATE INDEX assets_ocr_norm_idx ON assets USING gin (ocr_norm gin_trgm_ops);

-- +goose Down
DROP INDEX assets_ocr_norm_idx;
ALTER TABLE assets DROP COLUMN ocr_norm;
ALTER TABLE assets DROP COLUMN ocr_model;
ALTER TABLE assets DROP COLUMN ocr_text;
