-- 设置：键值表，值是 JSON，以后加新选项不用改表结构。

-- +goose Up
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,      -- 例如 'ai.preset'、'ai.models'、'ai.tasks'
  value      JSONB NOT NULL,        -- 例如 '"quality"'、'{"face.embed": "adaface-ir101"}'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID                   -- 哪个管理员改的；users 表建好后再加外键
);

-- +goose Down
DROP TABLE settings;
