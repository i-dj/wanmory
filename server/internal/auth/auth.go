// Package auth 是家庭账号：第一次打开时建管理员，管理员在设置里加家庭成员，大家用名字和密码登录。
// 登录后发一个随机令牌放在 HttpOnly cookie 里（库里只存它的哈希），之后所有 /api 请求都要带着它；
// 没登录的请求一律 401，只有登录、建管理员、查登录状态这几个接口例外。
// 这是「家里人之间」的保护：能接触服务器硬盘的人还是能直接看到照片文件。
package auth

import (
	"context"
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

const (
	CookieName     = "wanmory_session"
	sessionTTL     = 90 * 24 * time.Hour // 登录一次记住 90 天，自己的电脑、手机不用老是输密码
	shortTTL       = 12 * time.Hour      // 没勾「记住登录状态」（别人的电脑）：关了浏览器就退出，服务器上也最多留 12 小时
	pbkdf2Iter     = 600_000             // OWASP 2023 给 PBKDF2-SHA256 的建议值
	minPassword    = 4                   // 家用，不强求复杂；太短就没意义了
	maxName        = 20
	errorNameTaken = "这个名字已经有人用了"
)

var (
	ErrBadLogin     = errors.New("名字或密码不对")
	ErrSetupDone    = errors.New("已经有管理员了")
	ErrNotFound     = errors.New("没有这个人")
	ErrLastAdmin    = errors.New("不能删除唯一的管理员")
	ErrNameTaken    = errors.New(errorNameTaken)
	ErrWeakPassword = fmt.Errorf("密码至少 %d 位", minPassword)
	ErrBadName      = fmt.Errorf("名字要 1 到 %d 个字", maxName)
)

// User 是一个家庭成员
type User struct {
	ID      uuid.UUID  `json:"id"`
	Name    string     `json:"name"`
	IsAdmin bool       `json:"is_admin"`
	Avatar  *uuid.UUID `json:"avatar"` // 头像用的照片；没选是 null，网页显示名字的第一个字
	// AvatarStyle 是另外两种头像：'cartoon:fox' 卡通头像，'file:<时间>' 上传裁好的图片（GET /api/users/{id}/avatar）。
	// 不为空时比 Avatar 优先
	AvatarStyle string    `json:"avatar_style"`
	CreatedAt   time.Time `json:"created_at"`
}

type Service struct {
	db        *sql.DB
	avatarDir string // 上传的头像存在哪（SetAvatarDir），见 avatar.go
	// guest 是访客模式开着没有（设置里的 auth.guest）：开着时没登录的人也能只读浏览，见 Middleware
	guest func(ctx context.Context) bool
}

// SettingGuest 是设置里的「访客浏览」（on / off，默认 on），见 SetGuest
const SettingGuest = "auth.guest"

// SetGuest 接上「访客模式开着没有」，没接时访客模式关着
func (s *Service) SetGuest(enabled func(ctx context.Context) bool) { s.guest = enabled }

func (s *Service) guestOn(ctx context.Context) bool { return s.guest != nil && s.guest(ctx) }

func NewService(db *sql.DB) *Service {
	return &Service{db: db}
}

// SetupNeeded：还一个账号都没有，第一次打开要先建管理员
func (s *Service) SetupNeeded(ctx context.Context) (bool, error) {
	var n int
	err := s.db.QueryRowContext(ctx, `SELECT count(*) FROM users`).Scan(&n)
	return n == 0, err
}

// Setup 建第一个账号（管理员）。已有的照片都算管理员传的；隐藏了的都算管理员隐藏的（以前的「已隐藏」原样留给管理员）
func (s *Service) Setup(ctx context.Context, name, password string) (*User, error) {
	name, err := checkUser(name, password)
	if err != nil {
		return nil, err
	}
	hash, err := hashPassword(password)
	if err != nil {
		return nil, err
	}
	tx, err := s.db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelSerializable})
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()
	var n int
	if err := tx.QueryRowContext(ctx, `SELECT count(*) FROM users`).Scan(&n); err != nil {
		return nil, err
	}
	if n > 0 {
		return nil, ErrSetupDone
	}
	u := &User{Name: name, IsAdmin: true}
	if err := tx.QueryRowContext(ctx, `
		INSERT INTO users (name, password_hash, is_admin) VALUES ($1, $2, true) RETURNING id, created_at`,
		name, hash).Scan(&u.ID, &u.CreatedAt); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `
		UPDATE assets SET uploaded_by = COALESCE(uploaded_by, $1),
		                  hidden_by = CASE WHEN hidden THEN COALESCE(hidden_by, $1) END`, u.ID); err != nil {
		return nil, err
	}
	if _, err := tx.ExecContext(ctx, `UPDATE albums SET owner_id = $1 WHERE owner_id IS NULL`, u.ID); err != nil {
		return nil, err
	}
	return u, tx.Commit()
}

// Login 核对名字（不分大小写）和密码，对了就开一个新会话（ttl 后过期），返回令牌
func (s *Service) Login(ctx context.Context, name, password string, ttl time.Duration) (*User, string, error) {
	var u User
	var hash string
	err := s.db.QueryRowContext(ctx, `
		SELECT id, name, is_admin, avatar_id, avatar_style, created_at, password_hash FROM users WHERE lower(name) = lower($1)`,
		strings.TrimSpace(name)).Scan(&u.ID, &u.Name, &u.IsAdmin, &u.Avatar, &u.AvatarStyle, &u.CreatedAt, &hash)
	if errors.Is(err, sql.ErrNoRows) {
		// 名字不存在也照样算一次哈希，回答所用的时间看不出名字有没有
		_, _ = hashPassword(password)
		return nil, "", ErrBadLogin
	}
	if err != nil {
		return nil, "", err
	}
	if !checkPassword(hash, password) {
		return nil, "", ErrBadLogin
	}
	token, err := s.newSession(ctx, u.ID, ttl)
	if err != nil {
		return nil, "", err
	}
	return &u, token, nil
}

func (s *Service) newSession(ctx context.Context, user uuid.UUID, ttl time.Duration) (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	sum := sha256.Sum256([]byte(token))
	_, err := s.db.ExecContext(ctx, `INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, $3)`,
		sum[:], user, time.Now().Add(ttl))
	return token, err
}

// UserBySession 是令牌对应的人；过期、退出了的返回 nil
func (s *Service) UserBySession(ctx context.Context, token string) (*User, error) {
	if token == "" {
		return nil, nil
	}
	sum := sha256.Sum256([]byte(token))
	var u User
	err := s.db.QueryRowContext(ctx, `
		SELECT u.id, u.name, u.is_admin, u.avatar_id, u.avatar_style, u.created_at FROM sessions s JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = $1 AND s.expires_at > now()`, sum[:]).Scan(&u.ID, &u.Name, &u.IsAdmin, &u.Avatar, &u.AvatarStyle, &u.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// Logout 删掉这个会话
func (s *Service) Logout(ctx context.Context, token string) error {
	sum := sha256.Sum256([]byte(token))
	_, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE token_hash = $1`, sum[:])
	return err
}

// Users 是所有家庭成员，管理员在前，再按加入的先后
func (s *Service) Users(ctx context.Context) ([]User, error) {
	rows, err := s.db.QueryContext(ctx, `SELECT id, name, is_admin, avatar_id, avatar_style, created_at FROM users ORDER BY is_admin DESC, created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	list := []User{}
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Name, &u.IsAdmin, &u.Avatar, &u.AvatarStyle, &u.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, u)
	}
	return list, rows.Err()
}

// AddUser 管理员加一个家庭成员
// admin 时新成员也是管理员（能管成员、改系统设置）
func (s *Service) AddUser(ctx context.Context, name, password string, admin bool) (*User, error) {
	name, err := checkUser(name, password)
	if err != nil {
		return nil, err
	}
	hash, err := hashPassword(password)
	if err != nil {
		return nil, err
	}
	u := &User{Name: name, IsAdmin: admin}
	err = s.db.QueryRowContext(ctx, `
		INSERT INTO users (name, password_hash, is_admin) VALUES ($1, $2, $3) RETURNING id, created_at`, name, hash, admin).
		Scan(&u.ID, &u.CreatedAt)
	if err != nil && strings.Contains(err.Error(), "users_name_idx") {
		return nil, ErrNameTaken
	}
	return u, err
}

// DeleteUser 删掉一个家庭成员（他传的照片留着，只是不再记是谁传的）。唯一的管理员不能删
func (s *Service) DeleteUser(ctx context.Context, id uuid.UUID) error {
	var admin bool
	err := s.db.QueryRowContext(ctx, `SELECT is_admin FROM users WHERE id = $1`, id).Scan(&admin)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	if err != nil {
		return err
	}
	if admin {
		var n int
		if err := s.db.QueryRowContext(ctx, `SELECT count(*) FROM users WHERE is_admin`).Scan(&n); err != nil {
			return err
		}
		if n <= 1 {
			return ErrLastAdmin
		}
	}
	// 他隐藏的照片取消隐藏，不然谁都看不到了；他的私有相册删掉（照片不删），共享相册留着，以后由管理员管
	if _, err := s.db.ExecContext(ctx, `UPDATE assets SET hidden = false, hidden_by = NULL, hidden_via = NULL, updated_at = now() WHERE hidden_by = $1`, id); err != nil {
		return err
	}
	if _, err := s.db.ExecContext(ctx, `DELETE FROM albums WHERE owner_id = $1 AND private`, id); err != nil {
		return err
	}
	_, err = s.db.ExecContext(ctx, `DELETE FROM users WHERE id = $1`, id)
	return err
}

// SetPassword 改密码，并让这个人在别的设备上的登录都失效（keep 是要保留的当前会话）
func (s *Service) SetPassword(ctx context.Context, id uuid.UUID, password, keep string) error {
	if len([]rune(password)) < minPassword {
		return ErrWeakPassword
	}
	hash, err := hashPassword(password)
	if err != nil {
		return err
	}
	res, err := s.db.ExecContext(ctx, `UPDATE users SET password_hash = $2 WHERE id = $1`, id, hash)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	sum := sha256.Sum256([]byte(keep))
	_, err = s.db.ExecContext(ctx, `DELETE FROM sessions WHERE user_id = $1 AND token_hash <> $2`, id, sum[:])
	return err
}

// SetAvatar 换头像（asset 为 nil 时不用照片，显示名字的第一个字）。只能用自己看得到的照片：
// 别人隐藏的照片不行（ErrNotFound）
func (s *Service) SetAvatar(ctx context.Context, id uuid.UUID, asset *uuid.UUID) error {
	if asset != nil {
		var ok bool
		if err := s.db.QueryRowContext(ctx, `
			SELECT EXISTS (SELECT 1 FROM assets WHERE id = $1 AND deleted_at IS NULL AND thumbnail_path IS NOT NULL
			               AND (NOT hidden OR hidden_by = $2))`, *asset, id).Scan(&ok); err != nil {
			return err
		}
		if !ok {
			return ErrNotFound
		}
	}
	_, err := s.db.ExecContext(ctx, `UPDATE users SET avatar_id = $2, avatar_style = '' WHERE id = $1`, id, asset)
	if err == nil {
		s.removeAvatarFile(id)
	}
	return err
}

// CheckPassword 核对某个人的密码（改密码时先验证旧密码）
func (s *Service) CheckPassword(ctx context.Context, id uuid.UUID, password string) (bool, error) {
	var hash string
	if err := s.db.QueryRowContext(ctx, `SELECT password_hash FROM users WHERE id = $1`, id).Scan(&hash); err != nil {
		return false, err
	}
	return checkPassword(hash, password), nil
}

func checkUser(name, password string) (string, error) {
	name = strings.TrimSpace(name)
	if n := len([]rune(name)); n == 0 || n > maxName {
		return "", ErrBadName
	}
	if len([]rune(password)) < minPassword {
		return "", ErrWeakPassword
	}
	return name, nil
}

func hashPassword(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	key, err := pbkdf2.Key(sha256.New, password, salt, pbkdf2Iter, 32)
	if err != nil {
		return "", err
	}
	enc := base64.RawStdEncoding
	return fmt.Sprintf("pbkdf2-sha256$%d$%s$%s", pbkdf2Iter, enc.EncodeToString(salt), enc.EncodeToString(key)), nil
}

func checkPassword(stored, password string) bool {
	parts := strings.Split(stored, "$")
	if len(parts) != 4 || parts[0] != "pbkdf2-sha256" {
		return false
	}
	iter, err := strconv.Atoi(parts[1])
	enc := base64.RawStdEncoding
	salt, err1 := enc.DecodeString(parts[2])
	want, err2 := enc.DecodeString(parts[3])
	if err != nil || err1 != nil || err2 != nil {
		return false
	}
	got, err := pbkdf2.Key(sha256.New, password, salt, iter, len(want))
	return err == nil && subtle.ConstantTimeCompare(got, want) == 1
}

type ctxKey struct{}

// WithUser 把登录的人放进 context，后面的处理函数用 UserFrom 取
func WithUser(ctx context.Context, u *User) context.Context {
	return context.WithValue(ctx, ctxKey{}, u)
}

// UserFrom 是这个请求是谁发的；没登录（不该发生，中间件已经拦了）时是 nil
func UserFrom(ctx context.Context) *User {
	u, _ := ctx.Value(ctxKey{}).(*User)
	return u
}

// UserID 是这个请求是谁发的，没登录时是 uuid.Nil
func UserID(ctx context.Context) uuid.UUID {
	if u := UserFrom(ctx); u != nil {
		return u.ID
	}
	return uuid.Nil
}
