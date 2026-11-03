// Package httpx 是 HTTP 接口共用的小工具：返回 JSON、返回错误、解析请求体。
package httpx

import (
	"encoding/json"
	"log"
	"net/http"
)

// JSON 以 JSON 格式返回 v。
func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("写入响应失败: %v", err)
	}
}

// Error 返回 {"error": msg}。
func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, map[string]string{"error": msg})
}

// InternalError 记录错误详情，只给客户端返回笼统的提示。
func InternalError(w http.ResponseWriter, err error) {
	log.Printf("内部错误: %v", err)
	Error(w, http.StatusInternalServerError, "服务器内部错误")
}
