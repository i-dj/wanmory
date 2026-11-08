// Package version 是这个程序的版本号，构建镜像时用 -ldflags "-X .../version.Version=0.2.2" 写进来，
// 本机 go run 时是 dev
package version

import (
	"strconv"
	"strings"
)

var Version = "dev"

// Newer：a 比 b 新吗。版本号是 0.2.1 这样的（前面可以带 v）；认不出的（dev）不比任何版本新
func Newer(a, b string) bool {
	pa, okA := parse(a)
	pb, okB := parse(b)
	if !okA {
		return false
	}
	if !okB {
		return true
	}
	for i := range 3 {
		if pa[i] != pb[i] {
			return pa[i] > pb[i]
		}
	}
	return false
}

func parse(v string) ([3]int, bool) {
	var out [3]int
	v = strings.TrimPrefix(strings.TrimSpace(v), "v")
	v, _, _ = strings.Cut(v, "-") // 0.3.0-rc1 按 0.3.0 算
	parts := strings.Split(v, ".")
	if len(parts) == 0 || len(parts) > 3 {
		return out, false
	}
	for i, p := range parts {
		n, err := strconv.Atoi(p)
		if err != nil || n < 0 {
			return out, false
		}
		out[i] = n
	}
	return out, true
}
