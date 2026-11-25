package assets

import (
	"math"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// 照片目录里的文件夹名常常写着什么时候、在哪拍的：「2023年」「2023-05 青岛」「上海之旅」「2019/07/大理」。
// 照片自己没有拍摄时间或 GPS 时（扫描的老照片、微信存下来的、去掉了信息的），按文件夹名补上，
// 记在数据库里（guessed 列标着哪些是猜的），不改照片文件：照片目录可能是只读挂载的，相册也说好了不往里面写。
//
// 时间：年、年月、年月日，越往里的文件夹越具体，例如「2023年/5月」是 2023 年 5 月。文件的修改时间正好在这段时间里时
// 用修改时间（更准），不然用这段时间的第一天中午。
// 地点：文件夹名去掉日期、「旅游」「之旅」这类字以后正好是一个（或几个挨着的）认识的地名（folderPlaces，内置的城市表，不联网），
// 用那里的坐标；人名、「家庭」「工作」这种认不出来的不管。越往里的文件夹越优先

// guessFromFolder 照片在照片目录里、自己又没有拍摄时间或 GPS 时，按文件夹名补上（填进 m，记下哪些是猜的）
func (s *Service) guessFromFolder(a *Asset, m *Metadata) {
	if m.TakenAt != nil && m.Latitude != nil {
		return
	}
	rel, ok := s.libraryRel(a.OriginalPath)
	if !ok {
		return
	}
	g := guessFromFolders(filepath.Dir(rel), a.FileMtime, time.Now())
	if m.TakenAt == nil && g.TakenAt != nil {
		m.TakenAt = g.TakenAt
		m.Guessed = append(m.Guessed, EditTakenAt)
	}
	if m.Latitude == nil && g.Latitude != nil {
		m.Latitude, m.Longitude = g.Latitude, g.Longitude
		m.Guessed = append(m.Guessed, EditLocation)
	}
}

// libraryRel 是照片目录里的文件相对照片目录的路径；不在照片目录里（上传的）返回 false
func (s *Service) libraryRel(path string) (string, bool) {
	if s.libraryDir == "" {
		return "", false
	}
	rel, err := filepath.Rel(s.libraryDir, path)
	if err != nil || rel == "." || strings.HasPrefix(rel, "..") {
		return "", false
	}
	return rel, true
}

// folderGuess 是从文件夹名猜出来的拍摄时间、地点，猜不出来的是 nil
type folderGuess struct {
	TakenAt   *time.Time
	Latitude  *float64
	Longitude *float64
	Place     string // 认出来的地名，写日志用
}

var (
	reYMD     = regexp.MustCompile(`(?:^|[^0-9])((?:19[5-9]|20[0-9])[0-9])\s*[年.\-_/]\s*([0-9]{1,2})\s*[月.\-_/]\s*([0-9]{1,2})\s*日?(?:[^0-9]|$)`)
	reYMD8    = regexp.MustCompile(`(?:^|[^0-9])((?:19[5-9]|20[0-9])[0-9])([01][0-9])([0-3][0-9])(?:[^0-9]|$)`)
	reYM      = regexp.MustCompile(`(?:^|[^0-9])((?:19[5-9]|20[0-9])[0-9])\s*[年.\-_/]\s*([0-9]{1,2})\s*月?(?:[^0-9]|$)`)
	reYM6     = regexp.MustCompile(`(?:^|[^0-9])((?:19[5-9]|20[0-9])[0-9])([01][0-9])(?:[^0-9]|$)`)
	reY       = regexp.MustCompile(`(?:^|[^0-9])((?:19[5-9]|20[0-9])[0-9])\s*年?(?:[^0-9]|$)`)
	reMonth   = regexp.MustCompile(`^\s*([0-9]{1,2})\s*月?\s*$`) // 年份文件夹里面的「05」「5月」
	reDateBit = regexp.MustCompile(`(19[5-9]|20[0-9])[0-9]\s*[年.\-_/]?\s*([0-9]{1,2}\s*[月.\-_/]?\s*([0-9]{1,2}\s*日?)?)?|[0-9]+\s*[年月日号]?`)
	// 地名前后常带的字：去掉以后再看剩下的是不是地名
	reTripWords = regexp.MustCompile(`(?i)(之旅|旅游|旅行|游玩|自驾游|自驾|出差|度假|游记|随拍|照片|相片|合影|留念|之行|行|游|玩|trip|travel|travels|vacation|holiday|holidays|tour|photos|pics)`)
	reSeparator = regexp.MustCompile(`[\s_\-.,，、·()（）\[\]【】]+`)
)

// guessFromFolders 看照片所在的文件夹（相对照片目录的路径）猜拍摄时间和地点；mtime 是文件的修改时间
func guessFromFolders(relDir string, mtime time.Time, now time.Time) folderGuess {
	var g folderGuess
	if relDir == "" || relDir == "." {
		return g
	}
	segs := strings.Split(filepath.ToSlash(relDir), "/")

	// 时间：从外往里看，里面的更具体就用里面的；里面换了年份就以里面的为准
	year, month, day := 0, 0, 0
	for _, seg := range segs {
		y, m, d := parseFolderDate(seg, now)
		switch {
		case y > 0:
			year, month, day = y, m, d
		case year > 0 && month == 0:
			if mm := reMonth.FindStringSubmatch(seg); mm != nil {
				if v, _ := strconv.Atoi(mm[1]); v >= 1 && v <= 12 {
					month = v
				}
			}
		}
	}
	if year > 0 {
		t := periodTime(year, month, day, mtime)
		g.TakenAt = &t
	}

	// 地点：从里往外，第一个认得出来的
	for i := len(segs) - 1; i >= 0; i-- {
		if p, ok := folderPlace(segs[i]); ok {
			lat, lon := p.lat, p.lon
			g.Latitude, g.Longitude, g.Place = &lat, &lon, p.name
			break
		}
	}
	return g
}

// parseFolderDate 从一个文件夹名里找年、年月或年月日（年份在 1950 年到今年之间），找不到返回 0
func parseFolderDate(seg string, now time.Time) (year, month, day int) {
	valid := func(y, m, d int) bool {
		if y < 1950 || y > now.Year() || m < 0 || m > 12 || d < 0 || d > 31 {
			return false
		}
		if d > 0 {
			t := time.Date(y, time.Month(m), d, 0, 0, 0, 0, time.UTC)
			return t.Day() == d // 2 月 30 日这种不算
		}
		return true
	}
	atoi := func(s string) int { v, _ := strconv.Atoi(s); return v }
	for _, re := range []*regexp.Regexp{reYMD, reYMD8} {
		if m := re.FindStringSubmatch(seg); m != nil {
			if y, mo, d := atoi(m[1]), atoi(m[2]), atoi(m[3]); mo >= 1 && d >= 1 && valid(y, mo, d) {
				return y, mo, d
			}
		}
	}
	for _, re := range []*regexp.Regexp{reYM, reYM6} {
		if m := re.FindStringSubmatch(seg); m != nil {
			if y, mo := atoi(m[1]), atoi(m[2]); mo >= 1 && valid(y, mo, 0) {
				return y, mo, 0
			}
		}
	}
	if m := reY.FindStringSubmatch(seg); m != nil {
		if y := atoi(m[1]); valid(y, 0, 0) {
			return y, 0, 0
		}
	}
	return 0, 0, 0
}

// periodTime 是文件夹写的那段时间（一年、一个月或一天）里的拍摄时间：修改时间在这段时间里就用它，
// 不然用第一天中午（服务器时区）
func periodTime(year, month, day int, mtime time.Time) time.Time {
	loc := time.Local
	start := time.Date(year, 1, 1, 0, 0, 0, 0, loc)
	end := start.AddDate(1, 0, 0)
	if month > 0 {
		start = time.Date(year, time.Month(month), 1, 0, 0, 0, 0, loc)
		end = start.AddDate(0, 1, 0)
	}
	if day > 0 {
		start = time.Date(year, time.Month(month), day, 0, 0, 0, 0, loc)
		end = start.AddDate(0, 0, 1)
	}
	if !mtime.Before(start) && mtime.Before(end) {
		return mtime
	}
	return start.Add(12 * time.Hour)
}

// folderPlace 看一个文件夹名是不是地名：去掉日期、「旅游」这类字和分隔符，剩下的整个是一个认识的地名才算
func folderPlace(seg string) (knownPlace, bool) {
	s := reDateBit.ReplaceAllString(seg, " ")
	s = reTripWords.ReplaceAllString(s, " ")
	s = strings.TrimSpace(reSeparator.ReplaceAllString(s, " "))
	if s == "" {
		return knownPlace{}, false
	}
	key := strings.ToLower(s)
	if p, ok := placeIndex[key]; ok {
		return p, true
	}
	// 「青岛市」「云南省」：去掉行政区划的字再试一次
	for _, suffix := range []string{"特别行政区", "自治区", "自治州", "地区", "市", "省", "县", "区", "镇"} {
		if trimmed, ok := strings.CutSuffix(key, suffix); ok && trimmed != "" {
			if p, ok := placeIndex[trimmed]; ok {
				return p, true
			}
		}
	}
	// 「杭州西湖」「Tokyo Kyoto」：整个能拆成几个认识的地名，而且都在 300 公里以内（同一个地方由大到小写），
	// 用最后一个（最具体的）；「北京上海」这种隔得远的不猜
	if parts, ok := splitPlaces(key); ok && len(parts) > 1 {
		last := parts[len(parts)-1]
		for _, p := range parts {
			if distanceKm(p.lat, p.lon, last.lat, last.lon) > 300 {
				return knownPlace{}, false
			}
		}
		return last, true
	}
	return knownPlace{}, false
}

// splitPlaces 把 s 从头到尾拆成认识的地名（每次取最长的那个，空格可有可无），拆不完返回 false
func splitPlaces(s string) ([]knownPlace, bool) {
	var out []knownPlace
	rest := []rune(strings.TrimSpace(s))
	for len(rest) > 0 {
		found := 0
		var place knownPlace
		for n := len(rest); n >= 2; n-- {
			if p, ok := placeIndex[string(rest[:n])]; ok {
				found, place = n, p
				break
			}
		}
		if found == 0 {
			return nil, false
		}
		out = append(out, place)
		rest = []rune(strings.TrimSpace(string(rest[found:])))
	}
	return out, len(out) > 0
}

// distanceKm 是两点之间的大圆距离
func distanceKm(lat1, lon1, lat2, lon2 float64) float64 {
	const r = 6371.0
	rad := math.Pi / 180
	dLat, dLon := (lat2-lat1)*rad, (lon2-lon1)*rad
	a := math.Sin(dLat/2)*math.Sin(dLat/2) + math.Cos(lat1*rad)*math.Cos(lat2*rad)*math.Sin(dLon/2)*math.Sin(dLon/2)
	return 2 * r * math.Asin(math.Sqrt(a))
}
