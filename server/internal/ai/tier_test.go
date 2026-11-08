package ai

import (
	"encoding/json"
	"testing"
)

func TestRecommend(t *testing.T) {
	for _, c := range []struct {
		raw  string
		want string
	}{
		{`{"device":"auto","gpu":{"available":false},"memory":{"total":4000000000}}`, "lite"},      // 树莓派 4 GB
		{`{"device":"auto","gpu":{"available":false},"memory":{"total":17179869184}}`, "balanced"}, // N100 16 GB
		{`{"device":"auto","gpu":{"available":true},"memory":{"total":4000000000}}`, "quality"},    // 有显卡
		{`{"device":"cpu","gpu":{"available":true},"memory":{"total":4000000000}}`, "lite"},        // 设成只用 CPU
		{`{"device":"auto","gpu":{"available":false}}`, ""},                                        // 旧版本 AI 服务
	} {
		if got := recommendFrom(json.RawMessage(c.raw)); got != c.want {
			t.Errorf("%s → %q, want %q", c.raw, got, c.want)
		}
	}
}
