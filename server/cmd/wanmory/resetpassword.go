package main

import (
	"bufio"
	"context"
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/term"

	"github.com/wanmory/wanmory/server/internal/auth"
	"github.com/wanmory/wanmory/server/internal/config"
	"github.com/wanmory/wanmory/server/internal/db"
)

// resetPassword 是 `wanmory reset-password [名字]`：忘了密码（连唯一的管理员也忘了）时，在运行相册的机器上重置。
// 不带名字时先列出所有账号（名字、是不是管理员、什么时候建的、最近一次登录），输入序号选一个；带名字时直接改那个人。
// 新密码输两遍（不显示在屏幕上），改好后这个人在所有设备上的登录都失效，两步验证也关掉（手机丢了也能靠这个进来）。
// 只有能在这台机器上运行程序的人（例如 `docker compose exec server wanmory reset-password`）才能用，网页上没有这个入口
func resetPassword(ctx context.Context, args []string) error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}
	conn, err := db.Open(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer conn.Close()

	accounts, err := listAccounts(ctx, conn)
	if err != nil {
		return err
	}
	if len(accounts) == 0 {
		fmt.Println("还没有账号。用浏览器打开相册，第一次打开时会让你建管理员。")
		return nil
	}

	in := bufio.NewReader(os.Stdin)
	var target *account
	if name := strings.TrimSpace(strings.Join(args, " ")); name != "" {
		for i := range accounts {
			if strings.EqualFold(accounts[i].name, name) {
				target = &accounts[i]
				break
			}
		}
		if target == nil {
			fmt.Printf("没有叫「%s」的账号。\n\n", name)
		}
	}
	if target == nil {
		fmt.Println("这台相册上的账号：")
		for i, a := range accounts {
			fmt.Printf("  %d. %s\n", i+1, a.describe())
		}
		fmt.Print("重置哪一个的密码？输入序号（直接回车退出）：")
		line, _ := in.ReadString('\n')
		line = strings.TrimSpace(line)
		if line == "" {
			fmt.Println("没有改任何账号。")
			return nil
		}
		n, err := strconv.Atoi(line)
		if err != nil || n < 1 || n > len(accounts) {
			return fmt.Errorf("序号要是 1 到 %d", len(accounts))
		}
		target = &accounts[n-1]
	}

	password, err := askPassword(in, "新密码：")
	if err != nil {
		return err
	}
	again, err := askPassword(in, "再输一遍：")
	if err != nil {
		return err
	}
	if password != again {
		return errors.New("两次输入的密码不一样，没有改。再运行一次吧")
	}
	// keep 为空：这个人所有设备上的登录都失效，要用新密码重新登录
	if err := auth.NewService(conn).ResetPassword(ctx, target.id, password); err != nil {
		return err
	}
	fmt.Printf("已重置「%s」的密码，请用新密码登录（所有设备上的登录都已退出，两步验证也已关闭，需要的话登录后重新开启）。\n", target.name)
	return nil
}

type account struct {
	id        uuid.UUID
	name      string
	admin     bool
	created   time.Time
	lastLogin *time.Time // 还有效的登录里最近的一次；都退出或过期了时没有
}

func (a account) describe() string {
	role := "      "
	if a.admin {
		role = "管理员"
	}
	last := "最近没有登录"
	if a.lastLogin != nil {
		last = "最近登录 " + a.lastLogin.Local().Format("2006-01-02")
	}
	return fmt.Sprintf("%s %s   %s 创建   %s", pad(a.name, 12), role, a.created.Local().Format("2006-01-02"), last)
}

// pad 在名字后面补空格到 width 个半角宽（中文算两个），几行的列对得齐
func pad(s string, width int) string {
	w := 0
	for _, r := range s {
		if r >= 0x2E80 {
			w += 2
		} else {
			w++
		}
	}
	if w >= width {
		return s
	}
	return s + strings.Repeat(" ", width-w)
}

func listAccounts(ctx context.Context, conn *sql.DB) ([]account, error) {
	rows, err := conn.QueryContext(ctx, `
		SELECT u.id, u.name, u.is_admin, u.created_at, max(s.created_at)
		FROM users u LEFT JOIN sessions s ON s.user_id = u.id
		GROUP BY u.id ORDER BY u.is_admin DESC, u.created_at`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var list []account
	for rows.Next() {
		var a account
		var last sql.NullTime
		if err := rows.Scan(&a.id, &a.name, &a.admin, &a.created, &last); err != nil {
			return nil, err
		}
		if last.Valid {
			a.lastLogin = &last.Time
		}
		list = append(list, a)
	}
	return list, rows.Err()
}

// askPassword 读一行密码：在终端里输入时不显示；从管道送进来（脚本）时照常读一行
func askPassword(in *bufio.Reader, prompt string) (string, error) {
	fmt.Print(prompt)
	if fd := int(os.Stdin.Fd()); term.IsTerminal(fd) {
		b, err := term.ReadPassword(fd)
		fmt.Println()
		return string(b), err
	}
	line, err := in.ReadString('\n')
	if err != nil && line == "" {
		return "", errors.New("没有读到密码")
	}
	return strings.TrimRight(line, "\r\n"), nil
}
