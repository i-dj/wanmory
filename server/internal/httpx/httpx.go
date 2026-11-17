// Package httpx 是 HTTP 接口共用的小工具：返回 JSON、返回错误、解析请求体。
package httpx

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
)

// JSON 以 JSON 格式返回 v。
func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("http: writing the response failed: %v", err)
	}
}

// Error 返回 {"error": msg}。
func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, map[string]string{"error": msg})
}

// InternalError 记录错误详情，只给客户端返回笼统的提示。
// 请求被取消（浏览器关了页面、切走了、换了筛选）不是错误：不记日志，客户端也收不到回答了
func InternalError(w http.ResponseWriter, err error) {
	if errors.Is(err, context.Canceled) {
		w.WriteHeader(499) // nginx 的「客户端关闭了请求」
		return
	}
	log.Printf("http: internal error: %v", err)
	Error(w, http.StatusInternalServerError, "服务器内部错误")
}
