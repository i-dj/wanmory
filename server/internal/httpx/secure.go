package httpx

import (
	"net/http"
	"strings"
)

// SecureHeaders 给所有回答加上安全相关的头：
//   - X-Content-Type-Options: nosniff：浏览器不去「猜」文件类型，按服务器说的来；
//   - 不让别的网站把相册嵌进自己的页面（X-Frame-Options、frame-ancestors），防止骗人点按钮；
//   - Referrer-Policy: same-origin：点开外面的链接时不把相册的网址带过去；
//   - /api/ 下的回答（照片、视频、头像、JSON）加 CSP sandbox：就算有人上传了伪装成照片的网页、被直接打开，
//     里面的脚本也不会运行，拿不到登录状态
func SecureHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "SAMEORIGIN")
		h.Set("Referrer-Policy", "same-origin")
		if strings.HasPrefix(r.URL.Path, "/api/") {
			h.Set("Content-Security-Policy", "sandbox; default-src 'none'; img-src 'self'; media-src 'self'; frame-ancestors 'self'")
		} else {
			h.Set("Content-Security-Policy", "frame-ancestors 'self'")
		}
		next.ServeHTTP(w, r)
	})
}
