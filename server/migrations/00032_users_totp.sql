-- +goose Up
-- 两步验证（TOTP，手机验证器 App 里每 30 秒变一次的 6 位数）：
--   totp_secret     密钥（Base32）；开启的过程中先存着，输对一次验证码才算开启（totp_enabled）
--   totp_last_step  上次用掉的验证码是第几个 30 秒，同一个验证码不能用两次
--   totp_recovery   备用码的 SHA-256（十六进制），手机丢了时用，每个只能用一次
-- 管理员重置密码、在服务器上用命令重置密码时全部清空，要本人重新开启
ALTER TABLE users
    ADD COLUMN totp_secret TEXT NOT NULL DEFAULT '',
    ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN totp_last_step BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN totp_recovery TEXT[] NOT NULL DEFAULT '{}';

-- +goose Down
ALTER TABLE users
    DROP COLUMN totp_secret,
    DROP COLUMN totp_enabled,
    DROP COLUMN totp_last_step,
    DROP COLUMN totp_recovery;
