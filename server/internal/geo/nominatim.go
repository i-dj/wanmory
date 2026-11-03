// Package geo 给照片的拍摄地点配上城市名：按坐标问 OpenStreetMap 的 Nominatim，结果存在 geo_places 表里，
// 照片列表直接带出来（见 assets 的 assetColumns），网页鼠标移上去马上就能显示。
// 后台慢慢把已有照片的城市都查好；网页遇到还没查的，调 POST /api/assets/{id}/place 当场查一次。
// 设置里关了「在线地图」时都不查，不把坐标发出去。
package geo

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"
)

const (
	nominatimURL = "https://nominatim.openstreetmap.org/reverse"
	// Nominatim 的使用规定：每秒最多 1 次请求，要带能认出是哪个程序的 User-Agent
	minInterval = 1100 * time.Millisecond
	userAgent   = "Wanmory/0.1 (self-hosted home media server; https://github.com/wanmory/wanmory)"
)

// Place 是一个地方所在的城市、省（州）、国家。都是简体中文，没有中文名的是当地文字或英文
type Place struct {
	City    string `json:"city"`
	State   string `json:"state,omitempty"`
	Country string `json:"country,omitempty"`
}

// Client 问 Nominatim，所有请求排队，间隔至少 minInterval
type Client struct {
	http *http.Client
	mu   sync.Mutex
	last time.Time
}

func NewClient() *Client {
	return &Client{http: &http.Client{Timeout: 15 * time.Second}}
}

type nominatimPlace struct {
	Name        string            `json:"name"`
	DisplayName string            `json:"display_name"`
	Address     map[string]string `json:"address"`
	Error       string            `json:"error"`
}

// Lookup 返回坐标所在的城市；那里没有城市（海上）时返回 nil, nil
func (c *Client) Lookup(ctx context.Context, lat, lon float64) (*Place, error) {
	p, err := c.reverse(ctx, lat, lon, 10)
	if err != nil || p == nil {
		return nil, err
	}
	place := placeOf(p)
	// 中国的数据里区常常写在 city 上（「宝安区」），粗一级再问一次，能拿到上面的市（「深圳市」）
	if strings.HasSuffix(place.City, "区") && p.Address["country_code"] == "cn" {
		if up, err := c.reverse(ctx, lat, lon, 8); err == nil && up != nil {
			if city := first(up.Address["city"]); city != "" && !strings.HasSuffix(city, "区") {
				place.City = city
			}
		}
	}
	if place.City == "" {
		return nil, nil
	}
	return place, nil
}

// reverse 问一次 Nominatim。zoom 是要多细：10 是城市，8 是更大一级
func (c *Client) reverse(ctx context.Context, lat, lon float64, zoom int) (*nominatimPlace, error) {
	if err := c.wait(ctx); err != nil {
		return nil, err
	}
	q := url.Values{
		"format": {"jsonv2"},
		"zoom":   {fmt.Sprint(zoom)},
		"lat":    {fmt.Sprintf("%.5f", lat)},
		"lon":    {fmt.Sprintf("%.5f", lon)},
		// 要简体：OSM 里很多地方的 name:zh 是繁体，name:zh-Hans 才是简体
		"accept-language": {"zh-Hans,zh-CN,zh,en"},
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, nominatimURL+"?"+q.Encode(), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	res, err := c.http.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("nominatim 返回 %s", res.Status)
	}
	var p nominatimPlace
	if err := json.NewDecoder(res.Body).Decode(&p); err != nil {
		return nil, err
	}
	if p.Error != "" { // 「Unable to geocode」：海上之类的地方
		return nil, nil
	}
	return &p, nil
}

// wait 排队：离上一次请求不到 minInterval 就等一等
func (c *Client) wait(ctx context.Context) error {
	c.mu.Lock()
	at := c.last.Add(minInterval)
	now := time.Now()
	if at.Before(now) {
		at = now
	}
	c.last = at
	c.mu.Unlock()
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(time.Until(at)):
		return nil
	}
}

// placeOf 从 Nominatim 的地址里取城市（没有城市时依次用镇、村、街区、县、州）、省（州）、国家，和网页 lib/geo.ts 的一样
func placeOf(p *nominatimPlace) *Place {
	a := p.Address
	pick := func(keys ...string) string {
		for _, k := range keys {
			if v := first(a[k]); v != "" {
				return v
			}
		}
		return ""
	}
	return &Place{
		City:    pick("city", "town", "village", "suburb", "hamlet", "municipality", "county", "state"),
		State:   pick("state", "province", "region"),
		Country: pick("country"),
	}
}

// first：有的中文名写了好几种，用分号隔开（「橙县;橙縣;橘郡」），只要第一个
func first(s string) string {
	name, _, _ := strings.Cut(s, ";")
	return strings.TrimSpace(name)
}
