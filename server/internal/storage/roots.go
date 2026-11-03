// Package storage 让网页浏览和选择服务器上的目录，只限于 WANMORY_STORAGE_ROOTS 指定的范围内。
package storage

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

var ErrOutside = errors.New("不在允许的目录范围内")

// Roots 是允许浏览的根目录，都是已经解析过符号链接的绝对路径。
type Roots []string

// Resolve 把路径转成绝对路径并解析符号链接，确认它在某个根目录里面，返回解析后的路径。
// 解析符号链接是为了防止用一个指向范围外的链接绕过检查。
func (r Roots) Resolve(p string) (string, error) {
	if !filepath.IsAbs(p) {
		return "", fmt.Errorf("%w：需要绝对路径", ErrOutside)
	}
	real, err := filepath.EvalSymlinks(filepath.Clean(p))
	if err != nil {
		return "", err
	}
	for _, root := range r {
		if within(root, real) {
			return real, nil
		}
	}
	return "", ErrOutside
}

// IsRoot 判断解析后的路径是不是某个根目录本身。
func (r Roots) IsRoot(p string) bool {
	for _, root := range r {
		if root == p {
			return true
		}
	}
	return false
}

// CheckWritableDir 确认路径在范围内、是目录、能写入文件，返回解析后的路径。
func (r Roots) CheckWritableDir(p string) (string, error) {
	real, err := r.Resolve(p)
	if err != nil {
		return "", err
	}
	st, err := os.Stat(real)
	if err != nil {
		return "", err
	}
	if !st.IsDir() {
		return "", errors.New("不是目录")
	}
	f, err := os.CreateTemp(real, ".wanmory-write-test-*")
	if err != nil {
		return "", errors.New("这个目录不能写入")
	}
	f.Close()
	os.Remove(f.Name())
	return real, nil
}

func within(root, p string) bool {
	rel, err := filepath.Rel(root, p)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(filepath.Separator))
}
