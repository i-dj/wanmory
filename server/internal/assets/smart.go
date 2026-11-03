package assets

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
)

// 智能相册：按条件筛选照片，像 macOS「照片」的智能相簿。条件存在 albums.rules 里（JSON），
// 用的时候翻译成 SQL 的 WHERE 条件。
//
// 每条条件是「字段 + 比较方式 + 值」，例如「添加日期 在最近 30 天」「镜头 包含 85mm」。
// 值一律用字符串传，按字段的类型解析；不认识的字段、比较方式，或者值格式不对，保存时就报错。

// SmartRules 是一个智能相册的全部条件。
type SmartRules struct {
	Match string `json:"match"` // all：满足全部条件；any：满足任意一条
	Rules []Rule `json:"rules"`
	TZ    string `json:"tz"` // 按哪个时区算「哪一天」，用网页所在的时区
}

// Rule 是一条条件。Value2 只有「在范围内」用（结束日期），Unit 只有「在最近」用（day、week、month、year）。
// 文字字段可以填多个值（Values），例如镜头包含「24mm」或「55mm」：
// 包含、是、开头是、结尾是满足任一个就算；不包含、不是要一个都不满足。只填了 Value 的也认。
type Rule struct {
	Field  string   `json:"field"`
	Op     string   `json:"op"`
	Value  string   `json:"value"`
	Values []string `json:"values,omitempty"`
	Value2 string   `json:"value2,omitempty"`
	Unit   string   `json:"unit,omitempty"`
}

const maxValues = 50

// textValues 是文字条件填的值（去掉空的）
func (rule Rule) textValues() []string {
	list := rule.Values
	if len(list) == 0 {
		list = []string{rule.Value}
	}
	out := make([]string, 0, len(list))
	for _, v := range list {
		if v = strings.TrimSpace(v); v != "" {
			out = append(out, v)
		}
	}
	return out
}

const maxRules = 20

// 字段的种类，决定能用哪些比较方式、值怎么解析
type fieldKind int

const (
	kindDate   fieldKind = iota // 日期：是、不是、晚于、早于、在最近、不在最近、在范围内
	kindText                    // 文字：包含、不包含、是、不是、开头是、结尾是、为空、不为空
	kindNumber                  // 数字：是、不是、大于、小于
	kindFlag                    // 照片类型、闪光灯：是、不是
	kindAlbum                   // 在不在某个相册里：是、不是
	kindRating                  // 星级：是、不是、高于、低于
)

// numeric 把 EXIF 里的数字字符串转成数字，不是数字时为空（不会因为一张照片的怪数据让整个查询报错）
func numeric(expr string) string {
	return fmt.Sprintf(`(CASE WHEN %[1]s ~ '^-?[0-9]+(\.[0-9]+)?$' THEN (%[1]s)::float8 END)`, expr)
}

// smartFields 是每个字段对应的 SQL 表达式
var smartFields = map[string]struct {
	kind fieldKind
	expr string
}{
	"taken":    {kindDate, takenExpr},
	"added":    {kindDate, "created_at"},
	"filename": {kindText, `regexp_replace(original_path, '^.*/', '')`},
	"camera":   {kindText, `exif->>'Model'`},
	"make":     {kindText, `exif->>'Make'`},
	"lens":     {kindText, `COALESCE(exif->>'LensModel', exif->>'Lens')`},
	"aperture": {kindNumber, numeric(`exif->>'FNumber'`)},
	"focal":    {kindNumber, numeric(`exif->>'FocalLength'`)},
	"iso":      {kindNumber, numeric(`exif->>'ISO'`)},
	"shutter":  {kindNumber, numeric(`exif->>'ExposureTime'`)},
	"flash":    {kindFlag, ""},
	"photo":    {kindFlag, ""},
	"album":    {kindAlbum, ""},
	"rating":   {kindRating, "rating"},
}

// photoFlags 是「照片 是 …」可以选的类型
var photoFlags = map[string]string{
	"favorite":   `favorite`,
	"video":      `type = 'video'`,
	"raw":        `lower(original_path) ~ '\.(dng|arw|cr2|cr3|nef|nrw|orf|raf|rw2|pef|srw|3fr|iiq)$'`,
	"screenshot": `(original_path ILIKE '%screenshot%' OR original_path ILIKE '%截屏%' OR original_path ILIKE '%屏幕快照%' OR exif->>'UserComment' = 'Screenshot')`,
	"gps":        `latitude IS NOT NULL`,
	"panorama":   `(width IS NOT NULL AND height IS NOT NULL AND width >= 2 * height)`,
}

// flashFired：EXIF 的 Flash 是一组位，最低位是「闪光灯闪了」
var flashFired = fmt.Sprintf(`(COALESCE(%s, 0)::int %% 2 = 1)`, numeric(`exif->>'Flash'`))

var intervalUnits = map[string]string{"day": "days", "week": "weeks", "month": "months", "year": "years"}

// Validate 检查条件都认得、值格式都对。保存和预览前调用
func (r SmartRules) Validate() error {
	if r.Match != "all" && r.Match != "any" {
		return errors.New("match 应该是 all 或 any")
	}
	if len(r.Rules) == 0 || len(r.Rules) > maxRules {
		return fmt.Errorf("要有 1 到 %d 条条件", maxRules)
	}
	if _, err := time.LoadLocation(r.TZ); err != nil || r.TZ == "" || r.TZ == "Local" {
		return errors.New("不认识的时区: " + r.TZ)
	}
	var args []any
	for _, rule := range r.Rules {
		if _, err := rule.sql(&args, r.TZ); err != nil {
			return err
		}
	}
	return nil
}

// SQL 把全部条件翻译成一个 SQL 条件（带括号），参数追加到 args。先 Validate 过才调用；
// 万一有翻译不了的条件，整个条件当作「不满足」，不会查出不该有的照片
func (r SmartRules) SQL(args *[]any) string {
	join := " AND "
	if r.Match == "any" {
		join = " OR "
	}
	parts := make([]string, 0, len(r.Rules))
	for _, rule := range r.Rules {
		s, err := rule.sql(args, r.TZ)
		if err != nil {
			return "false"
		}
		parts = append(parts, s)
	}
	if len(parts) == 0 {
		return "false"
	}
	return "(" + strings.Join(parts, join) + ")"
}

func (rule Rule) sql(args *[]any, tz string) (string, error) {
	field, ok := smartFields[rule.Field]
	if !ok {
		return "", fmt.Errorf("不认识的字段: %s", rule.Field)
	}
	arg := func(v any) string {
		*args = append(*args, v)
		return fmt.Sprintf("$%d", len(*args))
	}
	bad := func() (string, error) {
		return "", fmt.Errorf("「%s」不能用「%s」", rule.Field, rule.Op)
	}
	// negate 是「不是」：照片没有这项数据（NULL）时也算「不是」
	negate := func(cond string) string { return "NOT COALESCE(" + cond + ", false)" }

	switch field.kind {
	case kindDate:
		// 哪一天按网页的时区算；只在用到时才加参数，没用上的参数数据库认不出类型
		day := func() string { return fmt.Sprintf("(%s AT TIME ZONE %s)::date", field.expr, arg(tz)) }
		switch rule.Op {
		case "is", "is_not", "after", "before":
			d, err := parseDay(rule.Value)
			if err != nil {
				return "", err
			}
			cmp := map[string]string{"is": "=", "is_not": "<>", "after": ">", "before": "<"}[rule.Op]
			return fmt.Sprintf("%s %s %s::date", day(), cmp, arg(d)), nil
		case "in_last", "not_in_last":
			n, err := strconv.Atoi(rule.Value)
			unit, okUnit := intervalUnits[rule.Unit]
			if err != nil || n < 1 || n > 10000 || !okUnit {
				return "", errors.New("「在最近」要填一个正整数和单位（天、周、月、年）")
			}
			cond := fmt.Sprintf("%s > now() - %s::interval", field.expr, arg(fmt.Sprintf("%d %s", n, unit)))
			if rule.Op == "not_in_last" {
				return negate(cond), nil
			}
			return cond, nil
		case "in_range":
			from, err1 := parseDay(rule.Value)
			to, err2 := parseDay(rule.Value2)
			if err1 != nil || err2 != nil {
				return "", errors.New("「在范围内」要填开始和结束日期")
			}
			return fmt.Sprintf("%s BETWEEN %s::date AND %s::date", day(), arg(from), arg(to)), nil
		}
		return bad()

	case kindText:
		expr := "COALESCE(" + field.expr + ", '')"
		switch rule.Op {
		case "empty":
			return expr + " = ''", nil
		case "not_empty":
			return expr + " <> ''", nil
		}
		values := rule.textValues()
		if len(values) == 0 {
			return "", errors.New("要填写比较的文字")
		}
		if len(values) > maxValues {
			return "", fmt.Errorf("一条条件最多填 %d 个值", maxValues)
		}
		// 每个值一个比较，肯定的（包含、是……）用 OR 连，否定的（不包含、不是）用 AND 连
		one := map[string]func(v string) string{
			"includes": func(v string) string { return fmt.Sprintf("%s ILIKE %s", expr, arg("%"+escapeLike(v)+"%")) },
			"excludes": func(v string) string { return fmt.Sprintf("%s NOT ILIKE %s", expr, arg("%"+escapeLike(v)+"%")) },
			"is":       func(v string) string { return fmt.Sprintf("lower(%s) = lower(%s)", expr, arg(v)) },
			"is_not":   func(v string) string { return fmt.Sprintf("lower(%s) <> lower(%s)", expr, arg(v)) },
			"starts":   func(v string) string { return fmt.Sprintf("%s ILIKE %s", expr, arg(escapeLike(v)+"%")) },
			"ends":     func(v string) string { return fmt.Sprintf("%s ILIKE %s", expr, arg("%"+escapeLike(v))) },
		}[rule.Op]
		if one == nil {
			return bad()
		}
		join := " OR "
		if rule.Op == "excludes" || rule.Op == "is_not" {
			join = " AND "
		}
		parts := make([]string, len(values))
		for i, v := range values {
			parts[i] = one(v)
		}
		return "(" + strings.Join(parts, join) + ")", nil

	case kindNumber:
		n, err := parseNumber(rule.Value)
		if err != nil {
			return "", err
		}
		switch rule.Op {
		case "is":
			// 光圈 1.8、快门 1/125 这种存下来的是小数，差一点点也算相等
			return fmt.Sprintf("abs(%s - %s) <= %s * 0.01", field.expr, arg(n), arg(n)), nil
		case "is_not":
			return negate(fmt.Sprintf("abs(%s - %s) <= %s * 0.01", field.expr, arg(n), arg(n))), nil
		case "gt":
			return fmt.Sprintf("%s > %s", field.expr, arg(n)), nil
		case "lt":
			return fmt.Sprintf("%s < %s", field.expr, arg(n)), nil
		}
		return bad()

	case kindRating:
		n, err := strconv.Atoi(rule.Value)
		if err != nil || n < 0 || n > 5 {
			return "", errors.New("星级应该是 0 到 5")
		}
		cmp := map[string]string{"is": "=", "is_not": "<>", "gt": ">", "lt": "<"}[rule.Op]
		if cmp == "" {
			return bad()
		}
		return fmt.Sprintf("rating %s %s", cmp, arg(n)), nil

	case kindFlag:
		var cond string
		if rule.Field == "flash" {
			if rule.Value != "fired" {
				return "", errors.New("闪光灯只能选「闪光」")
			}
			cond = flashFired
		} else if cond, ok = photoFlags[rule.Value]; !ok {
			return "", fmt.Errorf("不认识的照片类型: %s", rule.Value)
		}
		switch rule.Op {
		case "is":
			return "COALESCE(" + cond + ", false)", nil
		case "is_not":
			return negate(cond), nil
		}
		return bad()

	case kindAlbum:
		id, err := uuid.Parse(rule.Value)
		if err != nil {
			return "", errors.New("要选一个相册")
		}
		cond := fmt.Sprintf(albumCondition, len(*args)+1)
		*args = append(*args, id)
		switch rule.Op {
		case "is":
			return cond, nil
		case "is_not":
			return "NOT " + cond, nil
		}
		return bad()
	}
	return bad()
}

func parseDay(s string) (string, error) {
	if _, err := time.Parse("2006-01-02", s); err != nil {
		return "", fmt.Errorf("日期格式不对: %q", s)
	}
	return s, nil
}

// parseNumber 读数字，也认快门速度的写法 1/125
func parseNumber(s string) (float64, error) {
	s = strings.TrimSpace(strings.TrimSuffix(strings.TrimSpace(s), "s"))
	if a, b, ok := strings.Cut(s, "/"); ok {
		x, err1 := strconv.ParseFloat(strings.TrimSpace(a), 64)
		y, err2 := strconv.ParseFloat(strings.TrimSpace(b), 64)
		if err1 == nil && err2 == nil && y != 0 {
			return x / y, nil
		}
	} else if f, err := strconv.ParseFloat(s, 64); err == nil {
		return f, nil
	}
	return 0, fmt.Errorf("要填一个数字（快门可以写 1/125）: %q", s)
}

// escapeLike 让用户输入的 % 和 _ 按字面匹配
func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}
