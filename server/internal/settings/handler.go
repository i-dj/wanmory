package settings

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"time"

	"github.com/wanmory/wanmory/server/internal/httpx"
)

// TODO: 加上登录后，只有管理员能修改设置，并记录 updated_by。

type Handler struct {
	store    *Store
	registry *Registry
}

func NewHandler(store *Store, registry *Registry) *Handler {
	return &Handler{store: store, registry: registry}
}

func (h *Handler) Routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/settings", h.list)
	mux.HandleFunc("PUT /api/settings/{key}", h.put)
	mux.HandleFunc("DELETE /api/settings/{key}", h.reset)
}

// view 是返回给网页的一个设置项：说明、当前值、默认值。
type view struct {
	Key         string          `json:"key"`
	Label       string          `json:"label"`
	Description string          `json:"description"`
	Kind        Kind            `json:"kind"`
	Choices     []Choice        `json:"choices,omitempty"`
	Value       json.RawMessage `json:"value"`
	Default     any             `json:"default"`
	IsDefault   bool            `json:"is_default"`
	UpdatedAt   *time.Time      `json:"updated_at,omitempty"`
}

// list 返回所有登记过的设置项；没有设置过的显示默认值。
func (h *Handler) list(w http.ResponseWriter, r *http.Request) {
	saved, err := h.store.List(r.Context())
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	byKey := map[string]Setting{}
	for _, s := range saved {
		byKey[s.Key] = s
	}

	list := make([]view, 0, len(h.registry.defs))
	for _, d := range h.registry.defs {
		v := view{Key: d.Key, Label: d.Label, Description: d.Description, Kind: d.Kind,
			Choices: d.Choices, Default: d.Default}
		if s, ok := byKey[d.Key]; ok {
			v.Value = s.Value
			v.UpdatedAt = &s.UpdatedAt
		} else {
			v.IsDefault = true
			if v.Value, err = json.Marshal(d.Default); err != nil {
				httpx.InternalError(w, err)
				return
			}
		}
		list = append(list, v)
	}
	httpx.JSON(w, http.StatusOK, list)
}

// put 的请求体就是设置的值本身，例如 "balanced" 或 "/data/photos"。
func (h *Handler) put(w http.ResponseWriter, r *http.Request) {
	def, ok := h.registry.Lookup(r.PathValue("key"))
	if !ok {
		httpx.Error(w, http.StatusNotFound, "没有这个设置项")
		return
	}
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 1<<20))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "请求体太大或读取失败")
		return
	}
	if !json.Valid(body) {
		httpx.Error(w, http.StatusBadRequest, "请求体必须是合法的 JSON")
		return
	}

	value, err := def.normalize(r.Context(), body)
	if errors.Is(err, ErrInvalid) {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err != nil {
		httpx.InternalError(w, err)
		return
	}
	if err := h.store.Set(r.Context(), def.Key, value, nil); err != nil {
		httpx.InternalError(w, err)
		return
	}
	httpx.JSON(w, http.StatusOK, value)
}

// reset 删除保存的值，恢复默认。
func (h *Handler) reset(w http.ResponseWriter, r *http.Request) {
	def, ok := h.registry.Lookup(r.PathValue("key"))
	if !ok {
		httpx.Error(w, http.StatusNotFound, "没有这个设置项")
		return
	}
	if err := h.store.Delete(r.Context(), def.Key); err != nil {
		httpx.InternalError(w, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
