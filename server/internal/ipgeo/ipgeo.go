// Package ipgeo 按 IP 地址查大概在哪（登录日志、登录设备里显示）。用 ip2region 的离线数据，不联网：
// ip2region_v4.xdb（约 11 MB）和 ip2region_v6.xdb（约 37 MB）。Docker 镜像里带着；本机开发用 make ipdb 下载到 data/ipdb。
// 数据只按需读一小块（常驻内存的只有 v4、v6 各 512 KB 的索引），树莓派上也不占内存。没有数据文件时只认得局域网、本机
package ipgeo

import (
	"log"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/lionsoul2014/ip2region/binding/golang/service"
)

var (
	once   sync.Once
	region *service.Ip2Region
)

// dirs 是找数据文件的地方：环境变量 WANMORY_IPDB_DIR，数据目录下的 ipdb，镜像里的 /usr/share/wanmory/ipdb
func dirs() []string {
	var list []string
	if d := os.Getenv("WANMORY_IPDB_DIR"); d != "" {
		list = append(list, d)
	}
	if d := os.Getenv("WANMORY_DATA_DIR"); d != "" {
		list = append(list, filepath.Join(d, "ipdb"))
	}
	return append(list, "data/ipdb", "/usr/share/wanmory/ipdb")
}

func load() {
	for _, d := range dirs() {
		v4, v6 := filepath.Join(d, "ip2region_v4.xdb"), filepath.Join(d, "ip2region_v6.xdb")
		if !exists(v4) {
			continue
		}
		if !exists(v6) {
			v6 = ""
		}
		r, err := service.NewIp2RegionWithPath(v4, v6)
		if err != nil {
			log.Printf("ipgeo: 读 %s 里的 IP 地址库失败: %v", d, err)
			return
		}
		region = r
		return
	}
	log.Printf("ipgeo: 没找到 IP 地址库（ip2region_v4.xdb），登录日志里只显示 IP，不显示地点")
}

func exists(p string) bool {
	_, err := os.Stat(p)
	return err == nil
}

// Lookup 返回 IP 大概在哪，例如「广东 深圳 · 电信」「美国 California · Google LLC」「局域网」「本机」；查不到是空字符串
func Lookup(ip string) string {
	addr := net.ParseIP(strings.TrimSpace(ip))
	if addr == nil {
		return ""
	}
	switch {
	case addr.IsLoopback():
		return "本机"
	case addr.IsPrivate() || addr.IsLinkLocalUnicast():
		return "局域网"
	}
	once.Do(load)
	if region == nil {
		return ""
	}
	s, err := region.Search(addr.String())
	if err != nil || s == "" {
		return ""
	}
	return format(s)
}

// format 把 ip2region 的「国家|省|市|运营商|国家代码」（没有的写 0）整理成一行：
// 中国的去掉「中国」和「省」「市」字样（「广东 深圳 · 电信」，直辖市只写一次），国外的国家名换成中文
func format(s string) string {
	f := strings.Split(s, "|")
	for len(f) < 5 {
		f = append(f, "0")
	}
	val := func(x string) string {
		if x == "0" || x == "Reserved" {
			return ""
		}
		return x
	}
	country, province, city, isp, code := val(f[0]), val(f[1]), val(f[2]), val(f[3]), val(f[4])
	var parts []string
	if code == "CN" || country == "中国" {
		p := trimUnit(province)
		c := trimUnit(city)
		if p != "" {
			parts = append(parts, p)
		}
		if c != "" && c != p {
			parts = append(parts, c)
		}
		if len(parts) == 0 {
			parts = append(parts, "中国")
		}
	} else {
		if name := countryNames[code]; name != "" {
			country = name
		}
		for _, x := range []string{country, province, city} {
			if x != "" && (len(parts) == 0 || parts[len(parts)-1] != x) {
				parts = append(parts, x)
			}
		}
	}
	out := strings.Join(parts, " ")
	if isp != "" && out != "" {
		out += " · " + isp
	}
	return out
}

// trimUnit 去掉行政区名后面的「省」「市」「自治区」，「广东省」→「广东」、「深圳市」→「深圳」
func trimUnit(s string) string {
	for _, suffix := range []string{"维吾尔自治区", "壮族自治区", "回族自治区", "特别行政区", "自治区", "省", "市"} {
		if strings.HasSuffix(s, suffix) && len([]rune(s)) > len([]rune(suffix))+1 {
			return strings.TrimSuffix(s, suffix)
		}
	}
	return s
}

// countryNames 是常见国家和地区的中文名（ip2region 国外的地址是英文）
var countryNames = map[string]string{
	"US": "美国", "CA": "加拿大", "MX": "墨西哥", "BR": "巴西", "AR": "阿根廷", "GB": "英国", "FR": "法国", "DE": "德国",
	"IT": "意大利", "ES": "西班牙", "PT": "葡萄牙", "NL": "荷兰", "BE": "比利时", "CH": "瑞士", "AT": "奥地利", "SE": "瑞典",
	"NO": "挪威", "DK": "丹麦", "FI": "芬兰", "IE": "爱尔兰", "PL": "波兰", "CZ": "捷克", "RU": "俄罗斯", "UA": "乌克兰",
	"TR": "土耳其", "GR": "希腊", "JP": "日本", "KR": "韩国", "SG": "新加坡", "MY": "马来西亚", "TH": "泰国", "VN": "越南",
	"PH": "菲律宾", "ID": "印度尼西亚", "IN": "印度", "AU": "澳大利亚", "NZ": "新西兰", "AE": "阿联酋", "SA": "沙特阿拉伯",
	"IL": "以色列", "EG": "埃及", "ZA": "南非", "HK": "中国香港", "MO": "中国澳门", "TW": "中国台湾",
}
