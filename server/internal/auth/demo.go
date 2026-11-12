package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

// 演示账号：官网的在线演示站给大家用同一个账号登录。这个账号可以浏览、上传、整理（收藏、星级、建相册……），
// 但不能改密码、不能退出别的设备（会把其他正在看演示的人踢掉），也不能删除任何东西（照片、相册、成员、模型……），
// 避免演示数据被改坏。例外：自己刚传上来（demoGrace 以内）的照片、刚建的相册可以删，弄错了能马上删掉。
// 拦在登录中间件里，网页之外直接调接口也一样拦。
//
// 哪个账号是演示账号：名字等于 WANMORY_DEMO_USER（不区分大小写），没设置时是 demo

const demoForbidden = "演示账号禁止此项操作"

// demoGrace 演示账号上传的照片、建的相册多久以内还能删
const demoGrace = 30 * time.Minute

func demoUserName() string {
	if v := strings.TrimSpace(os.Getenv("WANMORY_DEMO_USER")); v != "" {
		return v
	}
	return "demo"
}

// IsDemo 是不是演示账号
func IsDemo(u *User) bool {
	return u != nil && strings.EqualFold(u.Name, demoUserName())
}

var (
	singleAsset   = regexp.MustCompile(`^/api/assets/[^/]+$`)
	singleAlbum   = regexp.MustCompile(`^/api/albums/[^/]+$`)
	albumRemove   = regexp.MustCompile(`^/api/albums/[^/]+/assets/remove$`)
	userPassword  = regexp.MustCompile(`^/api/users/[^/]+/password$`)
	demoUploadDir = "/api/uploads/" // 分片上传（tus）的 DELETE 是取消上传，上传是允许的
)

// demoDelete 是演示账号要删的东西，先不拦，等查过是不是自己刚传的照片 / 刚建的相册再说
type demoDelete struct {
	assets []string // 要删的照片（放进最近删除、永久删除）
	album  string   // 要删的相册
}

// demoBlocked 判断演示账号的这个请求要不要拦。删照片、删相册的请求先不拦，返回要删的东西（见 demoDelete），
// 由 recentlyMine 看是不是自己刚传、刚建的。要看请求体时读出来后放回去，后面的处理函数照常能读
func demoBlocked(r *http.Request) (blocked bool, del demoDelete) {
	p := r.URL.Path
	switch {
	case r.Method == http.MethodDelete && singleAlbum.MatchString(p): // 删相册
		return false, demoDelete{album: strings.TrimPrefix(p, "/api/albums/")}
	case r.Method == http.MethodPut && p == "/api/auth/password": // 改密码
		return true, demoDelete{}
	case r.Method == http.MethodPut && userPassword.MatchString(p): // 给别人重置密码
		return true, demoDelete{}
	case r.Method == http.MethodDelete && p == "/api/auth/sessions": // 退出其他设备
		return true, demoDelete{}
	case r.Method == http.MethodPut && p == "/api/auth/locale": // 界面语言（大家共用这个账号，只存在各自的浏览器里）
		return true, demoDelete{}
	case r.Method == http.MethodPost && strings.HasPrefix(p, "/api/auth/totp/"): // 开启、关掉两步验证（大家共用这个账号，开了别人就登不上）
		return true, demoDelete{}
	case r.Method == http.MethodDelete && !strings.HasPrefix(p, demoUploadDir): // 删相册、成员、模型、设置……
		return true, demoDelete{}
	case r.Method == http.MethodPost && (p == "/api/bursts/review" || albumRemove.MatchString(p)):
		// 连拍整理（把其余的放进最近删除）；把照片移出相册
		return true, demoDelete{}
	case r.Method == http.MethodPost && p == "/api/assets/purge": // 永久删除：{"all": true} 一律不行，选的几张看是不是刚传的
		req := readBody(r)
		if req.All || len(req.IDs) == 0 {
			return true, demoDelete{}
		}
		return false, demoDelete{assets: req.IDs}
	case r.Method == http.MethodPost && p == "/api/assets/batch": // 带 "deleted": true 就是放进最近删除
		if req := readBody(r); req.Deleted != nil && *req.Deleted {
			if len(req.IDs) == 0 {
				return true, demoDelete{}
			}
			return false, demoDelete{assets: req.IDs}
		}
	case r.Method == http.MethodPatch && singleAsset.MatchString(p):
		if req := readBody(r); req.Deleted != nil && *req.Deleted {
			return false, demoDelete{assets: []string{strings.TrimPrefix(p, "/api/assets/")}}
		}
	}
	return false, demoDelete{}
}

type demoBody struct {
	IDs     []string `json:"ids"`
	All     bool     `json:"all"`
	Deleted *bool    `json:"deleted"`
}

// readBody 读出请求体里和删除有关的字段，读完把请求体放回去；读不懂就当什么都没带
func readBody(r *http.Request) demoBody {
	var req demoBody
	body, err := io.ReadAll(io.LimitReader(r.Body, 4<<20))
	r.Body.Close()
	r.Body = io.NopCloser(bytes.NewReader(body))
	if err == nil {
		_ = json.Unmarshal(body, &req)
	}
	return req
}

// recentlyMine 要删的是不是都是 user 自己在 demoGrace 以内传的照片、建的相册；有一样不是（或 id 不对）就是 false
func (s *Service) recentlyMine(ctx context.Context, user uuid.UUID, del demoDelete) (bool, error) {
	ids := del.assets
	if del.album != "" {
		ids = append(ids, del.album)
	}
	for _, id := range ids {
		if _, err := uuid.Parse(id); err != nil {
			return false, nil
		}
	}
	since := demoGrace.Seconds()
	var others int
	var err error
	if del.album != "" {
		err = s.db.QueryRowContext(ctx, `
			SELECT count(*) FROM albums WHERE id = $1 AND owner_id = $2 AND created_at > now() - make_interval(secs => $3)`,
			del.album, user, since).Scan(&others)
		if err != nil || others == 0 {
			return false, err
		}
	}
	err = s.db.QueryRowContext(ctx, `
		SELECT count(*) FROM unnest($1::uuid[]) AS t(id)
		WHERE NOT EXISTS (SELECT 1 FROM assets a WHERE a.id = t.id AND a.uploaded_by = $2 AND a.created_at > now() - make_interval(secs => $3))`,
		del.assets, user, since).Scan(&others)
	return err == nil && others == 0, err
}
