package assets

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
)

// CityFilter 是「足迹」里点开的一个城市：照片离 Own 里最近的那个中心不超过 Km 公里，而且比 Others 里的中心都近
// （每张照片归最近的城市中心）。网页按同样的规则把照片分到城市（见网页的 lib/places.ts），点进去的张数就对得上。
// Others 只带附近的城市中心，再远的不可能更近
type CityFilter struct {
	Km     float64
	Own    [][2]float64 // 纬度、经度
	Others [][2]float64
}

// parseCity 读 city 参数：「公里;纬度,经度;纬度,经度|纬度,经度;…」，竖线后面是附近别的城市的中心（可以没有）
func parseCity(v string) (*CityFilter, error) {
	bad := errors.New("city 应该是 公里;纬度,经度;…|纬度,经度;…")
	ownPart, otherPart, _ := strings.Cut(v, "|")
	fields := strings.Split(ownPart, ";")
	km, err := strconv.ParseFloat(fields[0], 64)
	if err != nil || km <= 0 || len(fields) < 2 {
		return nil, bad
	}
	c := &CityFilter{Km: km}
	if c.Own, err = parseCenters(fields[1:]); err != nil {
		return nil, bad
	}
	if otherPart != "" {
		if c.Others, err = parseCenters(strings.Split(otherPart, ";")); err != nil {
			return nil, bad
		}
	}
	if len(c.Own)+len(c.Others) > 200 {
		return nil, errors.New("city 里的中心太多了")
	}
	return c, nil
}

func parseCenters(items []string) ([][2]float64, error) {
	out := make([][2]float64, 0, len(items))
	for _, item := range items {
		latS, lonS, ok := strings.Cut(item, ",")
		lat, err1 := strconv.ParseFloat(latS, 64)
		lon, err2 := strconv.ParseFloat(lonS, 64)
		if !ok || err1 != nil || err2 != nil || lat < -90 || lat > 90 || lon < -180 || lon > 180 {
			return nil, errors.New("坐标不对")
		}
		out = append(out, [2]float64{lat, lon})
	}
	return out, nil
}

// sql 是筛选条件，参数追加到 args 里
func (c *CityFilter) sql(args *[]any) string {
	nearest := func(centers [][2]float64) string {
		parts := make([]string, len(centers))
		for i, ct := range centers {
			*args = append(*args, ct[0], ct[1])
			parts[i] = distanceSQL(len(*args)-1, len(*args))
		}
		return "LEAST(" + strings.Join(parts, ", ") + ")"
	}
	own := nearest(c.Own)
	*args = append(*args, c.Km)
	cond := fmt.Sprintf(`latitude IS NOT NULL AND longitude IS NOT NULL AND %s <= $%d`, own, len(*args))
	if len(c.Others) > 0 {
		cond += fmt.Sprintf(` AND %s < %s`, own, nearest(c.Others))
	}
	return "(" + cond + ")"
}

// distanceSQL 是照片到 ($lat, $lon) 的球面距离（公里），和网页 lib/places.ts 的 distanceKm 一样的算法
func distanceSQL(lat, lon int) string {
	return fmt.Sprintf(`12742 * asin(sqrt(power(sin(radians(latitude - $%[1]d) / 2), 2) + `+
		`cos(radians($%[1]d)) * cos(radians(latitude)) * power(sin(radians(longitude - $%[2]d) / 2), 2)))`, lat, lon)
}
