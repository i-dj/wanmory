package mdns

import (
	"net"
	"testing"

	"golang.org/x/net/dns/dnsmessage"
)

func query(t *testing.T, name string, typ dnsmessage.Type) []byte {
	b := dnsmessage.NewBuilder(nil, dnsmessage.Header{})
	_ = b.StartQuestions()
	if err := b.Question(dnsmessage.Question{Name: dnsmessage.MustNewName(name), Type: typ, Class: dnsmessage.ClassINET}); err != nil {
		t.Fatal(err)
	}
	out, err := b.Finish()
	if err != nil {
		t.Fatal(err)
	}
	return out
}

func TestAnswer(t *testing.T) {
	ips := []net.IP{net.IPv4(192, 168, 1, 20)}
	reply, _ := answer(query(t, "Wanmory.local.", dnsmessage.TypeA), "wanmory.local.", ips)
	if reply == nil {
		t.Fatal("问 wanmory.local 的 A 记录应该有回答")
	}
	var p dnsmessage.Parser
	if _, err := p.Start(reply); err != nil {
		t.Fatal(err)
	}
	_ = p.SkipAllQuestions()
	h, err := p.AnswerHeader()
	if err != nil {
		t.Fatal(err)
	}
	a, err := p.AResource()
	if err != nil || h.Name.String() != "wanmory.local." || net.IP(a.A[:]).String() != "192.168.1.20" {
		t.Fatalf("回答不对：%v %v %v", h.Name, a.A, err)
	}
	if r, _ := answer(query(t, "other.local.", dnsmessage.TypeA), "wanmory.local.", ips); r != nil {
		t.Error("别的名字不应该回答")
	}
	if wanted("photos.example.com") != "" || wanted("Wanmory.Local") != "wanmory.local." {
		t.Error("wanted 只认 .local")
	}
}
