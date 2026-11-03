-- 家庭账号：一个管理员（第一次打开时建）加几个家庭成员，用名字和密码登录。
-- 登录后发一个随机令牌放在 cookie 里，库里只存它的 SHA-256；过期或退出登录就删掉。
-- 照片记下是谁传的（uploaded_by）、谁隐藏的（hidden_by）：隐藏的照片只有隐藏它的人在「已隐藏」里看得到，
-- 别人哪里都看不到。已有的照片在建管理员时都算管理员传的、管理员隐藏的。见 internal/auth
-- +goose Up
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,       -- pbkdf2-sha256$迭代次数$盐$哈希（都是 base64）
  is_admin      BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_name_idx ON users (lower(name));

CREATE TABLE sessions (
  token_hash BYTEA PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user_idx ON sessions (user_id);

ALTER TABLE assets ADD COLUMN uploaded_by UUID REFERENCES users (id) ON DELETE SET NULL;
ALTER TABLE assets ADD COLUMN hidden_by UUID REFERENCES users (id) ON DELETE SET NULL;

-- +goose Down
ALTER TABLE assets DROP COLUMN hidden_by;
ALTER TABLE assets DROP COLUMN uploaded_by;
DROP TABLE sessions;
DROP TABLE users;
