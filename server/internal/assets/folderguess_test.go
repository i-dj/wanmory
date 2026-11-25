package assets

import (
	"testing"
	"time"
)

func TestGuessFromFolders(t *testing.T) {
	now := time.Date(2026, 11, 25, 0, 0, 0, 0, time.Local)
	mtime := time.Date(2024, 3, 3, 9, 0, 0, 0, time.Local) // 文件修改时间，不在下面大多数文件夹的时间里
	day := func(y, m, d int) string {
		return time.Date(y, time.Month(m), d, 12, 0, 0, 0, time.Local).Format(time.RFC3339)
	}
	cases := []struct {
		dir   string
		taken string // RFC3339，空是猜不出时间
		place string // 空是猜不出地点
	}{
		{"2023年", day(2023, 1, 1), ""},
		{"2023年/青岛", day(2023, 1, 1), "青岛"},
		{"上海", "", "上海"},
		{"王亮", "", ""}, // 人名不是地名
		{"家庭照片/王亮的生日", "", ""},
		{"2019/07/大理", day(2019, 7, 1), "大理"}, // 年份文件夹里的月份文件夹
		{"2023年5月 青岛之旅", day(2023, 5, 1), "青岛"},
		{"2023-05-12 杭州西湖", day(2023, 5, 12), "西湖"}, // 同一个地方由大到小，用小的
		{"北京上海", "", ""},                            // 两个隔得远的城市，不猜
		{"Tokyo Kyoto", "", ""},                     // 相距 370 公里，不猜
		{"20230512_Qingdao", day(2023, 5, 12), "青岛"},
		{"2018.10 Tokyo trip", day(2018, 10, 1), "东京"},
		{"New York 2015", day(2015, 1, 1), "纽约"},
		{"云南省", "", "云南"},
		{"青岛市", "", "青岛"},
		{"Fuji", "", ""}, // 相机牌子，不是富士山
		{"DCIM/100APPLE", "", ""},
		{"2030年", "", ""},                         // 还没到的年份不算
		{"2023-02-30", day(2023, 2, 1), ""},       // 没有 2 月 30 日，退回年月
		{"2024年", mtime.Format(time.RFC3339), ""}, // 修改时间在这一年里，用修改时间
		{"2015年/2016年/北京", day(2016, 1, 1), "北京"}, // 里面的年份为准
	}
	for _, c := range cases {
		g := guessFromFolders(c.dir, mtime, now)
		got := ""
		if g.TakenAt != nil {
			got = g.TakenAt.Format(time.RFC3339)
		}
		if got != c.taken {
			t.Errorf("%q: taken = %q, want %q", c.dir, got, c.taken)
		}
		if g.Place != c.place {
			t.Errorf("%q: place = %q, want %q", c.dir, g.Place, c.place)
		}
		if (g.Latitude != nil) != (c.place != "") {
			t.Errorf("%q: coordinates set = %v", c.dir, g.Latitude != nil)
		}
	}
}
