package geo

import "testing"

func TestPlaceOf(t *testing.T) {
	cases := []struct {
		name    string
		address map[string]string
		want    Place
	}{
		{"城市", map[string]string{"city": "芝加哥", "state": "伊利诺伊州", "country": "美国"},
			Place{City: "芝加哥", State: "伊利诺伊州", Country: "美国"}},
		{"没有城市用镇", map[string]string{"town": "斯科加", "region": "南部区", "country": "冰岛"},
			Place{City: "斯科加", State: "南部区", Country: "冰岛"}},
		{"分号隔开的几种写法只要第一个", map[string]string{"county": "橙县;橙縣;橘郡", "state": "加利福尼亚州"},
			Place{City: "橙县", State: "加利福尼亚州"}},
		{"只有州", map[string]string{"state": "佛罗里达州", "country": "美国"},
			Place{City: "佛罗里达州", State: "佛罗里达州", Country: "美国"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := *placeOf(&nominatimPlace{Address: c.address}); got != c.want {
				t.Errorf("placeOf = %+v，想要 %+v", got, c.want)
			}
		})
	}
}
