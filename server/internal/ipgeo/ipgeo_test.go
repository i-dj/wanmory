package ipgeo

import "testing"

func TestFormat(t *testing.T) {
	cases := map[string]string{
		"中国|广东省|深圳市|电信|CN":                         "广东 深圳 · 电信",
		"中国|北京市|北京市|联通|CN":                         "北京 · 联通",
		"中国|新疆维吾尔自治区|乌鲁木齐市|移动|CN":                  "新疆 乌鲁木齐 · 移动",
		"United States|California|0|Google LLC|US": "美国 California · Google LLC",
		"Australia|Queensland|Brisbane|0|AU":       "澳大利亚 Queensland Brisbane",
		"Reserved|Reserved|Reserved|0|0":           "",
	}
	for in, want := range cases {
		if got := format(in); got != want {
			t.Errorf("format(%q) = %q，应该是 %q", in, got, want)
		}
	}
}

func TestLookupLocal(t *testing.T) {
	if got := Lookup("127.0.0.1"); got != "本机" {
		t.Errorf("127.0.0.1 = %q", got)
	}
	if got := Lookup("192.168.1.5"); got != "局域网" {
		t.Errorf("192.168.1.5 = %q", got)
	}
}
