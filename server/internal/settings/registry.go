package settings

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"slices"
)

// Kind 决定网页上用什么控件修改这个设置。
type Kind string

const (
	KindPath   Kind = "path"   // 服务器上的目录，弹出目录选择框
	KindChoice Kind = "choice" // 几个选项里选一个
)

type Choice struct {
	Value string `json:"value"`
	Label string `json:"label"`
	Hint  string `json:"hint,omitempty"`
}

// Def 描述一个可以在网页上修改的设置项。没有登记的 key 不能通过接口修改。
type Def struct {
	Key         string
	Label       string
	Description string
	Kind        Kind
	Default     any      // 没有设置过时的值
	Choices     []Choice // KindChoice 的可选值

	// Validate 检查并规范化新值（例如把路径转成绝对路径），返回要保存的值。可以为空。
	Validate func(ctx context.Context, raw json.RawMessage) (any, error)
}

// ErrInvalid 表示设置值不合法，错误信息可以直接显示给用户。
var ErrInvalid = errors.New("设置值不合法")

type Registry struct {
	defs []Def
}

func NewRegistry() *Registry {
	return &Registry{}
}

// Register 登记设置项，网页上按登记顺序显示。
func (r *Registry) Register(d Def) {
	r.defs = append(r.defs, d)
}

func (r *Registry) Lookup(key string) (Def, bool) {
	i := slices.IndexFunc(r.defs, func(d Def) bool { return d.Key == key })
	if i < 0 {
		return Def{}, false
	}
	return r.defs[i], true
}

// normalize 校验新值：选项类型必须是可选值之一，再交给 Def.Validate。
func (d Def) normalize(ctx context.Context, raw json.RawMessage) (any, error) {
	if d.Kind == KindChoice {
		var v string
		if err := json.Unmarshal(raw, &v); err != nil {
			return nil, fmt.Errorf("%w：应该是字符串", ErrInvalid)
		}
		if !slices.ContainsFunc(d.Choices, func(c Choice) bool { return c.Value == v }) {
			return nil, fmt.Errorf("%w：%q 不是可选值", ErrInvalid, v)
		}
	}
	if d.Validate != nil {
		return d.Validate(ctx, raw)
	}
	return raw, nil
}
