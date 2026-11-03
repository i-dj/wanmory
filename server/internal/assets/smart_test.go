package assets

import (
	"strings"
	"testing"
)

func TestSmartRulesValidate(t *testing.T) {
	ok := []Rule{
		{Field: "photo", Op: "is", Value: "favorite"},
		{Field: "added", Op: "in_last", Value: "30", Unit: "day"},
		{Field: "taken", Op: "in_range", Value: "2024-01-01", Value2: "2024-12-31"},
		{Field: "lens", Op: "includes", Value: "85mm"},
		{Field: "camera", Op: "empty"},
		{Field: "shutter", Op: "lt", Value: "1/125"},
		{Field: "rating", Op: "gt", Value: "3"},
		{Field: "flash", Op: "is_not", Value: "fired"},
		{Field: "album", Op: "is_not", Value: "9b1efbbd-7a24-46ca-9dea-21c0476bb750"},
	}
	for _, r := range ok {
		if err := (SmartRules{Match: "all", Rules: []Rule{r}, TZ: "Asia/Shanghai"}).Validate(); err != nil {
			t.Errorf("%+v 应该是对的: %v", r, err)
		}
	}
	bad := []Rule{
		{Field: "nope", Op: "is", Value: "x"},
		{Field: "photo", Op: "includes", Value: "favorite"},
		{Field: "photo", Op: "is", Value: "selfie"},
		{Field: "added", Op: "in_last", Value: "0", Unit: "day"},
		{Field: "added", Op: "in_last", Value: "3", Unit: "hour"},
		{Field: "taken", Op: "is", Value: "2024/01/01"},
		{Field: "lens", Op: "includes", Value: "  "},
		{Field: "iso", Op: "gt", Value: "abc"},
		{Field: "rating", Op: "is", Value: "6"},
		{Field: "album", Op: "is", Value: "not-an-id"},
	}
	for _, r := range bad {
		if err := (SmartRules{Match: "all", Rules: []Rule{r}, TZ: "Asia/Shanghai"}).Validate(); err == nil {
			t.Errorf("%+v 应该报错", r)
		}
	}
	if (SmartRules{Match: "some", Rules: ok[:1], TZ: "UTC"}).Validate() == nil {
		t.Error("match 只能是 all 或 any")
	}
	if (SmartRules{Match: "all", Rules: ok[:1], TZ: "Mars/Base"}).Validate() == nil {
		t.Error("时区要检查")
	}
}

func TestSmartRulesSQL(t *testing.T) {
	r := SmartRules{Match: "any", TZ: "UTC", Rules: []Rule{
		{Field: "photo", Op: "is", Value: "favorite"},
		{Field: "lens", Op: "includes", Value: "50%_off"},
	}}
	var args []any
	sql := r.SQL(&args)
	if !strings.Contains(sql, " OR ") || !strings.HasPrefix(sql, "(") {
		t.Errorf("any 应该用 OR 连起来: %s", sql)
	}
	if len(args) != 1 || args[0] != `%50\%\_off%` {
		t.Errorf("百分号和下划线要转义，得到 %v", args)
	}
	// 翻译不了的条件让整个相册为空，而不是查出所有照片
	if got := (SmartRules{Match: "all", Rules: []Rule{{Field: "nope"}}}).SQL(&args); got != "false" {
		t.Errorf("得到 %s", got)
	}
}

func TestSmartRulesMultipleValues(t *testing.T) {
	var args []any
	sql := SmartRules{Match: "all", TZ: "UTC", Rules: []Rule{
		{Field: "lens", Op: "includes", Values: []string{"24mm", " ", "55mm"}},
		{Field: "camera", Op: "is_not", Values: []string{"A", "B"}},
	}}.SQL(&args)
	if len(args) != 4 || !strings.Contains(sql, " OR ") || strings.Count(sql, "<>") != 2 {
		t.Errorf("包含多个值用 OR、不是多个值用 AND，空值跳过: %s %v", sql, args)
	}
	if (SmartRules{Match: "all", TZ: "UTC", Rules: []Rule{{Field: "lens", Op: "includes", Values: []string{" "}}}}).Validate() == nil {
		t.Error("全是空值应该报错")
	}
}

func TestParseNumber(t *testing.T) {
	for in, want := range map[string]float64{"1/125": 0.008, "2.8": 2.8, " 400 ": 400, "1/4s": 0.25} {
		if got, err := parseNumber(in); err != nil || got != want {
			t.Errorf("parseNumber(%q) = %v, %v", in, got, err)
		}
	}
}
