package auth

import "testing"

func TestPasswordHash(t *testing.T) {
	h, err := hashPassword("秘密1234")
	if err != nil {
		t.Fatal(err)
	}
	if !checkPassword(h, "秘密1234") {
		t.Error("正确的密码没通过")
	}
	if checkPassword(h, "秘密1235") {
		t.Error("错的密码通过了")
	}
	if checkPassword("pbkdf2-sha256$1$bad", "x") || checkPassword("", "") {
		t.Error("格式不对的哈希不该通过")
	}
	h2, _ := hashPassword("秘密1234")
	if h == h2 {
		t.Error("同一个密码两次哈希应该不一样（盐是随机的）")
	}
}

func TestCheckUser(t *testing.T) {
	if _, err := checkUser("  ", "1234"); err != ErrBadName {
		t.Errorf("空名字应该报 ErrBadName，得到 %v", err)
	}
	if _, err := checkUser("小明", "123"); err != ErrWeakPassword {
		t.Errorf("太短的密码应该报 ErrWeakPassword，得到 %v", err)
	}
	if name, err := checkUser(" 小明 ", "1234"); err != nil || name != "小明" {
		t.Errorf("checkUser = %q, %v", name, err)
	}
}
