package settings

import (
	"encoding/json"
	"errors"
	"time"

	"github.com/google/uuid"
)

var ErrNotFound = errors.New("设置项不存在")

// Setting 是 settings 表里的一行。
type Setting struct {
	Key       string          `json:"key"`
	Value     json.RawMessage `json:"value"`
	UpdatedAt time.Time       `json:"updated_at"`
	UpdatedBy *uuid.UUID      `json:"updated_by,omitempty"`
}
