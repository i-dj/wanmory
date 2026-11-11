// Package mdns 在局域网里报自己的名字（mDNS，也叫 Bonjour）：有人问「wanmory.local 在哪」时，回答这台机器的 IP。
// Mac、iPhone、iPad、Windows 10 以后都会这样问，不用改路由器就能用名字打开相册；部分安卓手机不支持。
//
// 只回答 .local 结尾的名字（别的名字要在路由器的 DNS 里设）。和系统自己的 mDNS（macOS 的 mDNSResponder、
// 树莓派的 avahi）共用 5353 端口，各回答各的名字，互不影响。
// 在 Docker 里要用主机网络（network_mode: host）才收得到局域网的组播，见 docker-compose.yml 里的 mdns 服务
package mdns

import (
	"context"
	"log"
	"net"
	"strings"
	"time"

	"golang.org/x/net/dns/dnsmessage"
	"golang.org/x/net/ipv4"
)

const ttl = 120 // 秒：别人记住这个回答多久

var group = &net.UDPAddr{IP: net.IPv4(224, 0, 0, 251), Port: 5353}

// Run 一直回答对 name() 的询问，直到 ctx 结束。name 每次收到询问时都会调，所以改了名字马上生效；
// 返回空字符串或不是 .local 结尾时不回答
func Run(ctx context.Context, name func() string) error {
	c, err := net.ListenUDP("udp4", &net.UDPAddr{IP: net.IPv4zero, Port: 5353})
	if err != nil {
		// 端口被不让共用的程序占着时退回 ListenMulticastUDP（它会设 SO_REUSEADDR / SO_REUSEPORT）
		c, err = net.ListenMulticastUDP("udp4", nil, group)
		if err != nil {
			return err
		}
	}
	defer c.Close()
	p := ipv4.NewPacketConn(c)
	_ = p.SetControlMessage(ipv4.FlagInterface, true) // 知道询问是从哪块网卡来的，回答那块网卡的 IP
	_ = p.SetMulticastLoopback(true)                  // 本机上的浏览器也能问到
	joined := joinAll(p)
	log.Printf("mdns: 在 %d 块网卡上回答局域网里对 %s 的询问", joined, name())

	go func() {
		<-ctx.Done()
		c.Close()
	}()
	go announce(ctx, p, name)

	buf := make([]byte, 9000)
	for {
		n, cm, src, err := p.ReadFrom(buf)
		if err != nil {
			if ctx.Err() != nil {
				return nil
			}
			return err
		}
		host := wanted(name())
		if host == "" {
			continue
		}
		var ifi *net.Interface
		if cm != nil && cm.IfIndex > 0 {
			ifi, _ = net.InterfaceByIndex(cm.IfIndex)
		}
		reply, unicast := answer(buf[:n], host, addrsOf(ifi))
		if reply == nil {
			continue
		}
		dst := net.Addr(group)
		if unicast {
			dst = src
		}
		_, _ = p.WriteTo(reply, &ipv4.ControlMessage{IfIndex: indexOf(ifi)}, dst)
	}
}

// wanted 把设置里的名字整理成 DNS 里的写法（小写、结尾带点）；不是 .local 的返回空
func wanted(name string) string {
	name = strings.ToLower(strings.TrimSuffix(strings.TrimSpace(name), "."))
	if !strings.HasSuffix(name, ".local") {
		return ""
	}
	return name + "."
}

// answer 看询问里有没有问 host 的 A 记录（IPv4 地址），有就做好回答。unicast 是询问要求单独回给它（QU 位）
func answer(msg []byte, host string, ips []net.IP) (reply []byte, unicast bool) {
	var p dnsmessage.Parser
	h, err := p.Start(msg)
	if err != nil || h.Response || len(ips) == 0 {
		return nil, false
	}
	asked := false
	for {
		q, err := p.Question()
		if err != nil {
			break
		}
		if !strings.EqualFold(q.Name.String(), host) {
			continue
		}
		if q.Type == dnsmessage.TypeA || q.Type == dnsmessage.TypeALL {
			asked = true
			unicast = unicast || q.Class&(1<<15) != 0
		}
	}
	if !asked {
		return nil, false
	}
	return build(host, ips), unicast
}

// build 做一条回答：host 对应的每个 IPv4 地址各一条 A 记录，带「刷新缓存」位（这个名字只有我们在回答）
func build(host string, ips []net.IP) []byte {
	b := dnsmessage.NewBuilder(nil, dnsmessage.Header{Response: true, Authoritative: true})
	b.EnableCompression()
	_ = b.StartAnswers()
	name := dnsmessage.MustNewName(host)
	for _, ip := range ips {
		v4 := ip.To4()
		if v4 == nil {
			continue
		}
		_ = b.AResource(dnsmessage.ResourceHeader{
			Name:  name,
			Type:  dnsmessage.TypeA,
			Class: dnsmessage.ClassINET | 1<<15, // 最高位：刷新缓存
			TTL:   ttl,
		}, dnsmessage.AResource{A: [4]byte(v4)})
	}
	out, err := b.Finish()
	if err != nil {
		return nil
	}
	return out
}

// announce 启动时、名字变了时主动在每块网卡上报一次自己的地址，别人缓存里旧的回答马上更新
func announce(ctx context.Context, p *ipv4.PacketConn, name func() string) {
	last := ""
	t := time.NewTicker(15 * time.Second)
	defer t.Stop()
	for {
		host := wanted(name())
		if host != "" && host != last {
			for _, ifi := range multicastInterfaces() {
				if msg := build(host, addrsOf(&ifi)); msg != nil {
					_, _ = p.WriteTo(msg, &ipv4.ControlMessage{IfIndex: ifi.Index}, group)
				}
			}
			log.Printf("mdns: 局域网里可以用 %s 打开相册", strings.TrimSuffix(host, "."))
		}
		last = host
		select {
		case <-ctx.Done():
			return
		case <-t.C:
		}
	}
}

// joinAll 在每块能收组播的网卡上加入 mDNS 组，返回加入了几块
func joinAll(p *ipv4.PacketConn) int {
	n := 0
	for _, ifi := range multicastInterfaces() {
		if err := p.JoinGroup(&ifi, group); err == nil {
			n++
		}
	}
	return n
}

// multicastInterfaces 是开着、能收发组播、不是回环、有 IPv4 地址的网卡（Docker 的虚拟网卡也会算进来，不碍事）
func multicastInterfaces() []net.Interface {
	list, _ := net.Interfaces()
	var out []net.Interface
	for _, ifi := range list {
		if ifi.Flags&net.FlagUp == 0 || ifi.Flags&net.FlagMulticast == 0 || ifi.Flags&net.FlagLoopback != 0 {
			continue
		}
		if len(addrsOf(&ifi)) > 0 {
			out = append(out, ifi)
		}
	}
	return out
}

// addrsOf 是网卡的 IPv4 地址；ifi 为空（不知道询问从哪来）时是所有网卡的
func addrsOf(ifi *net.Interface) []net.IP {
	var addrs []net.Addr
	if ifi != nil {
		addrs, _ = ifi.Addrs()
	} else {
		addrs, _ = net.InterfaceAddrs()
	}
	var out []net.IP
	for _, a := range addrs {
		if n, ok := a.(*net.IPNet); ok && n.IP.To4() != nil && !n.IP.IsLoopback() && !n.IP.IsLinkLocalUnicast() {
			out = append(out, n.IP.To4())
		}
	}
	return out
}

func indexOf(ifi *net.Interface) int {
	if ifi == nil {
		return 0
	}
	return ifi.Index
}
