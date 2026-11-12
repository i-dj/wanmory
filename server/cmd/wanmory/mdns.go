package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"sync/atomic"
	"time"

	"github.com/wanmory/wanmory/server/internal/mdns"
	"github.com/wanmory/wanmory/server/internal/netaccess"
)

// runMDNS 是 wanmory mdns：Docker 里单独跑的小服务（主机网络，收得到局域网的组播），
// 隔一会儿问相册程序现在的访问域名（WANMORY_URL，默认 http://127.0.0.1:8080），在局域网里报这个名字，
// 问的时候报上这台机器的局域网 IP。
// 相册程序本身在 Docker 的内部网络里，收不到局域网的组播，所以分开跑
func runMDNS(ctx context.Context) error {
	base := os.Getenv("WANMORY_URL")
	if base == "" {
		base = "http://127.0.0.1:8080"
	}
	var name atomic.Value
	name.Store(netaccess.InitialDomain())
	refresh := func() {
		client := http.Client{Timeout: 3 * time.Second}
		// 顺便报上这台机器的局域网 IP：相册在 Docker 内部网络里看不到，设置页要显示用 IP 打开的网址
		res, err := client.Get(base + "/api/net/mdns?ip=" + url.QueryEscape(netaccess.LocalIP()))
		if err != nil {
			return
		}
		defer res.Body.Close()
		var body struct {
			Name string `json:"name"`
		}
		if json.NewDecoder(res.Body).Decode(&body) == nil && body.Name != "" {
			name.Store(body.Name)
		}
	}
	refresh()
	go func() {
		t := time.NewTicker(10 * time.Second)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				refresh()
			}
		}
	}()
	return mdns.Run(ctx, func() string { return name.Load().(string) })
}
