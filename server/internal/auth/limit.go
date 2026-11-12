package auth

import (
	"fmt"
	"net"
	"net/http"
	"runtime"
	"strings"
	"sync"
	"time"
)

// 登录防猜密码：放到公网上以后，有人会不停地试密码。
//   - 同一个 IP 15 分钟里输错 10 次、同一个名字 15 分钟里输错 20 次，就先不让试，回答 429「请几分钟后再试」，
//     也不再算密码哈希（每算一次要几百毫秒 CPU，被人刷登录接口时不会把机器跑满）。登录成功清掉这个 IP 和名字的记录。
//     名字的上限高一些：别人故意输错也只能让这个名字暂时登不上 15 分钟，不会一直锁死
//   - 同时算密码哈希的最多 hashSlots 个，多出来的排队
const (
	failWindow  = 15 * time.Minute
	maxIPFails  = 10
	maxNameFail = 20
)

type limiter struct {
	mu    sync.Mutex
	fails map[string][]time.Time // "ip:1.2.3.4" / "name:wang" → 输错的时间
}

var logins = &limiter{fails: map[string][]time.Time{}}

// hashSlots 限制同时算密码哈希的个数（至少 1 个，最多一半的 CPU）
var hashSlots = make(chan struct{}, max(1, runtime.NumCPU()/2))

func (l *limiter) recent(key string, now time.Time) []time.Time {
	list := l.fails[key]
	i := 0
	for i < len(list) && now.Sub(list[i]) > failWindow {
		i++
	}
	if i == len(list) {
		delete(l.fails, key)
		return nil
	}
	list = list[i:]
	l.fails[key] = list
	return list
}

// blocked 这个 IP、名字现在能不能再试；不能时返回还要等多久
func (l *limiter) blocked(ip, name string) (time.Duration, bool) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	wait := time.Duration(0)
	for key, limit := range map[string]int{"ip:" + ip: maxIPFails, "name:" + strings.ToLower(name): maxNameFail} {
		if list := l.recent(key, now); len(list) >= limit {
			wait = max(wait, failWindow-now.Sub(list[len(list)-limit]))
		}
	}
	return wait, wait > 0
}

func (l *limiter) fail(ip, name string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	now := time.Now()
	for _, key := range []string{"ip:" + ip, "name:" + strings.ToLower(name)} {
		l.fails[key] = append(l.recent(key, now), now)
	}
	// 被人换着 IP、名字刷：记录太多时把过期的清掉
	if len(l.fails) > 10000 {
		for key := range l.fails {
			l.recent(key, now)
		}
	}
}

func (l *limiter) succeed(ip, name string) {
	l.mu.Lock()
	defer l.mu.Unlock()
	delete(l.fails, "ip:"+ip)
	delete(l.fails, "name:"+strings.ToLower(name))
}

func waitMessage(d time.Duration) string {
	return fmt.Sprintf("密码输错的次数太多了，请 %d 分钟后再试", max(1, int(d.Round(time.Minute).Minutes())))
}

// clientIP 是请求从哪来的。请求直接来自公网地址时就用它（伪造不了）；来自本机或局域网（前面有反向代理）时，
// 才看代理加上的 X-Real-IP / X-Forwarded-For（取最后一个，是离我们最近的代理写的，前面的可能是客户端自己编的）
func clientIP(r *http.Request) string {
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		host = r.RemoteAddr
	}
	if ip := net.ParseIP(host); ip != nil && (ip.IsLoopback() || ip.IsPrivate()) {
		if v := strings.TrimSpace(r.Header.Get("X-Real-IP")); net.ParseIP(v) != nil {
			return v
		}
		if f := r.Header.Get("X-Forwarded-For"); f != "" {
			parts := strings.Split(f, ",")
			if v := strings.TrimSpace(parts[len(parts)-1]); net.ParseIP(v) != nil {
				return v
			}
		}
	}
	return host
}
