package auth

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"database/sql"
	"encoding/base32"
	"encoding/binary"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
)

// 两步验证（TOTP，RFC 6238）：开启时服务器生成一个密钥，用手机上的验证器 App（Google Authenticator、
// Microsoft Authenticator、2FAS、Aegis、1Password……）扫二维码记下来，之后两边各自按时间算出同一个 6 位数，
// 不用联网、不用短信。时间按 Unix 时间（和时区无关），前后各容许差一个 30 秒。
// 开启时给 10 个备用码，手机丢了时可以用其中一个代替验证码登录，每个只能用一次。
// 管理员重置密码、在服务器上用命令重置密码时两步验证一起关掉，要本人重新开启

const (
	totpStep      = 30 // 秒
	totpDigits    = 6
	totpIssuer    = "Wanmory" // 验证器 App 里显示成「Wanmory:名字」
	recoveryCount = 10
)

var (
	ErrTOTPOn      = errors.New("两步验证已经开着了")
	ErrTOTPOff     = errors.New("还没有开启两步验证")
	ErrBadCode     = errors.New("验证码不对，或者已经过期了")
	b32            = base32.StdEncoding.WithPadding(base32.NoPadding)
	recoveryLetter = "abcdefghjkmnpqrstuvwxyz23456789" // 去掉了容易看错的 0 o 1 l i
)

// totpCode 是密钥在第 step 个 30 秒的验证码（RFC 4226 的 HOTP）
func totpCode(secret []byte, step int64) string {
	var msg [8]byte
	binary.BigEndian.PutUint64(msg[:], uint64(step))
	mac := hmac.New(sha1.New, secret)
	mac.Write(msg[:])
	sum := mac.Sum(nil)
	off := sum[len(sum)-1] & 0x0f
	n := binary.BigEndian.Uint32(sum[off:off+4]) & 0x7fffffff
	return fmt.Sprintf("%0*d", totpDigits, n%1_000_000)
}

// matchTOTP 验证码对上的是第几个 30 秒（前后各容许一个）；比 last 早或一样的不算（用过的验证码不能再用）
func matchTOTP(secretB32, code string, now time.Time, last int64) (int64, bool) {
	secret, err := b32.DecodeString(secretB32)
	code = strings.ReplaceAll(strings.TrimSpace(code), " ", "")
	if err != nil || len(code) != totpDigits {
		return 0, false
	}
	cur := now.Unix() / totpStep
	for _, step := range []int64{cur, cur - 1, cur + 1} {
		if step > last && hmac.Equal([]byte(totpCode(secret, step)), []byte(code)) {
			return step, true
		}
	}
	return 0, false
}

// totpURI 是二维码里的内容，验证器 App 扫了就记下密钥、账号名和「万象 Wanmory」
func totpURI(secret, name string) string {
	label := url.PathEscape(totpIssuer + ":" + name)
	q := url.Values{"secret": {secret}, "issuer": {totpIssuer}, "algorithm": {"SHA1"}, "digits": {"6"}, "period": {"30"}}
	return "otpauth://totp/" + label + "?" + q.Encode()
}

// newRecoveryCodes 生成 10 个备用码（xxxxx-xxxxx），返回给用户看的原文和存进库里的哈希
func newRecoveryCodes() (codes, hashes []string, err error) {
	for range recoveryCount {
		b := make([]byte, 10)
		if _, err := rand.Read(b); err != nil {
			return nil, nil, err
		}
		var sb strings.Builder
		for i, x := range b {
			if i == 5 {
				sb.WriteByte('-')
			}
			sb.WriteByte(recoveryLetter[int(x)%len(recoveryLetter)])
		}
		codes = append(codes, sb.String())
		hashes = append(hashes, recoveryHash(sb.String()))
	}
	return codes, hashes, nil
}

func recoveryHash(code string) string {
	code = strings.ToLower(strings.NewReplacer("-", "", " ", "").Replace(strings.TrimSpace(code)))
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
}

// TOTPStatus 开没开两步验证、还剩几个备用码
func (s *Service) TOTPStatus(ctx context.Context, id uuid.UUID) (enabled bool, left int, err error) {
	err = s.db.QueryRowContext(ctx, `SELECT totp_enabled, cardinality(totp_recovery) FROM users WHERE id = $1`, id).
		Scan(&enabled, &left)
	return enabled, left, err
}

// StartTOTP 开始开启：生成新密钥先存着（还没开启），返回密钥和二维码内容。已经开着时报 ErrTOTPOn
func (s *Service) StartTOTP(ctx context.Context, u *User) (secret, uri string, err error) {
	raw := make([]byte, 20)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}
	secret = b32.EncodeToString(raw)
	res, err := s.db.ExecContext(ctx, `UPDATE users SET totp_secret = $2 WHERE id = $1 AND NOT totp_enabled`, u.ID, secret)
	if err != nil {
		return "", "", err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return "", "", ErrTOTPOn
	}
	return secret, totpURI(secret, u.Name), nil
}

// EnableTOTP 输对一次验证码才真的开启，返回 10 个备用码（只给这一次）
func (s *Service) EnableTOTP(ctx context.Context, id uuid.UUID, code string) ([]string, error) {
	var secret string
	var enabled bool
	if err := s.db.QueryRowContext(ctx, `SELECT totp_secret, totp_enabled FROM users WHERE id = $1`, id).
		Scan(&secret, &enabled); err != nil {
		return nil, err
	}
	if enabled {
		return nil, ErrTOTPOn
	}
	if secret == "" {
		return nil, ErrTOTPOff
	}
	step, ok := matchTOTP(secret, code, time.Now(), 0)
	if !ok {
		return nil, ErrBadCode
	}
	codes, hashes, err := newRecoveryCodes()
	if err != nil {
		return nil, err
	}
	_, err = s.db.ExecContext(ctx, `
		UPDATE users SET totp_enabled = true, totp_last_step = $2, totp_recovery = $3 WHERE id = $1`,
		id, step, hashes)
	return codes, err
}

// DisableTOTP 本人关掉两步验证，要输对登录密码
func (s *Service) DisableTOTP(ctx context.Context, id uuid.UUID, password string) error {
	var hash string
	if err := s.db.QueryRowContext(ctx, `SELECT password_hash FROM users WHERE id = $1`, id).Scan(&hash); err != nil {
		return err
	}
	if !checkPassword(hash, password) {
		return ErrBadLogin
	}
	return s.ClearTOTP(ctx, id)
}

// ClearTOTP 关掉两步验证（密钥、备用码都清掉）
func (s *Service) ClearTOTP(ctx context.Context, id uuid.UUID) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE users SET totp_secret = '', totp_enabled = false, totp_last_step = 0, totp_recovery = '{}' WHERE id = $1`, id)
	return err
}

// ResetPassword 是管理员（或服务器上的命令）给别人重置密码：改密码、所有设备上的登录失效，两步验证也关掉，要本人重新开启
func (s *Service) ResetPassword(ctx context.Context, id uuid.UUID, password string) error {
	if err := s.SetPassword(ctx, id, password, ""); err != nil {
		return err
	}
	return s.ClearTOTP(ctx, id)
}

// totpEnabled 这个人开没开两步验证
func (s *Service) totpEnabled(ctx context.Context, id uuid.UUID) (bool, error) {
	var on bool
	err := s.db.QueryRowContext(ctx, `SELECT totp_enabled FROM users WHERE id = $1`, id).Scan(&on)
	if errors.Is(err, sql.ErrNoRows) {
		return false, nil
	}
	return on, err
}

// checkSecondFactor 登录第二步：6 位验证码，或者一个备用码（用掉就删）
func (s *Service) checkSecondFactor(ctx context.Context, id uuid.UUID, code string) error {
	code = strings.TrimSpace(code)
	if len(strings.NewReplacer("-", "", " ", "").Replace(code)) > totpDigits {
		res, err := s.db.ExecContext(ctx, `
			UPDATE users SET totp_recovery = array_remove(totp_recovery, $2)
			WHERE id = $1 AND totp_enabled AND $2 = ANY(totp_recovery)`, id, recoveryHash(code))
		if err != nil {
			return err
		}
		if n, _ := res.RowsAffected(); n == 0 {
			return ErrBadCode
		}
		return nil
	}
	var secret string
	var last int64
	if err := s.db.QueryRowContext(ctx, `SELECT totp_secret, totp_last_step FROM users WHERE id = $1 AND totp_enabled`, id).
		Scan(&secret, &last); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrBadCode
		}
		return err
	}
	step, ok := matchTOTP(secret, code, time.Now(), last)
	if !ok {
		return ErrBadCode
	}
	// 记下用掉的是第几个 30 秒；两个请求同时拿同一个验证码来，只有一个能成功
	res, err := s.db.ExecContext(ctx, `UPDATE users SET totp_last_step = $2 WHERE id = $1 AND totp_last_step < $2`, id, step)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrBadCode
	}
	return nil
}
