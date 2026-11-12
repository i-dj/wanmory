package auth

import (
	"strings"
	"testing"
	"time"
)

// RFC 6238 附录 B 的测试数据（SHA-1，密钥 "12345678901234567890"），取后 6 位
func TestTOTPCodeRFC(t *testing.T) {
	secret := []byte("12345678901234567890")
	for unix, want := range map[int64]string{59: "287082", 1111111109: "081804", 1234567890: "005924", 2000000000: "279037"} {
		if got := totpCode(secret, unix/totpStep); got != want {
			t.Errorf("t=%d: %s, want %s", unix, got, want)
		}
	}
}

func TestMatchTOTP(t *testing.T) {
	secret := b32.EncodeToString([]byte("12345678901234567890"))
	now := time.Unix(1111111109, 0)
	step := now.Unix() / totpStep
	if got, ok := matchTOTP(secret, "081804", now, 0); !ok || got != step {
		t.Fatalf("正确的验证码没通过：%d %v", got, ok)
	}
	if _, ok := matchTOTP(secret, "081804", now, step); ok {
		t.Fatal("用过的验证码不能再用")
	}
	if _, ok := matchTOTP(secret, " 081 804 ", now.Add(totpStep*time.Second), 0); !ok {
		t.Fatal("前后差一个 30 秒、带空格也应该通过")
	}
	if _, ok := matchTOTP(secret, "081804", now.Add(3*totpStep*time.Second), 0); ok {
		t.Fatal("差太多的不该通过")
	}
	if _, ok := matchTOTP(secret, "000000", now, 0); ok {
		t.Fatal("错的验证码通过了")
	}
}

func TestRecoveryCodes(t *testing.T) {
	codes, hashes, err := newRecoveryCodes()
	if err != nil || len(codes) != recoveryCount || len(hashes) != recoveryCount {
		t.Fatalf("备用码：%v %d %d", err, len(codes), len(hashes))
	}
	seen := map[string]bool{}
	for i, c := range codes {
		if len(c) != 11 || c[5] != '-' || seen[c] {
			t.Fatalf("备用码格式不对或重复：%q", c)
		}
		seen[c] = true
		// 大写、不带减号、前后有空格也认
		if recoveryHash(" "+strings.ToUpper(strings.ReplaceAll(c, "-", ""))+" ") != hashes[i] {
			t.Fatalf("备用码 %q 换个写法就认不出了", c)
		}
	}
}

func TestTOTPURI(t *testing.T) {
	uri := totpURI("ABC", "liao")
	if !strings.HasPrefix(uri, "otpauth://totp/Wanmory:liao?") || !strings.Contains(uri, "secret=ABC") || !strings.Contains(uri, "issuer=Wanmory&") {
		t.Fatalf("二维码内容不对：%s", uri)
	}
}
