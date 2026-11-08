package ai

import (
	"context"
	"encoding/json"
	"log"
)

// TierAuto 是档位选「自动」（没选过档位时也是）：按 AI 服务器的硬件定，换了 AI 服务（比如从内置换成带显卡的远程）也跟着换
const TierAuto = "auto"

const gib = int64(1) << 30

// Recommend 按 AI 服务器的硬件推荐一档：有显卡（而且没设成只用 CPU）用高精度；只有 CPU 时内存不到 6 GB 用轻量
// （树莓派、N100），再大用均衡（高精度的语义搜索模型在 CPU 上一张要一两秒、还要 4 GB 内存）。
// 不知道内存（旧版本的 AI 服务）时返回空的
func Recommend(gpu bool, device string, memory int64) string {
	switch {
	case gpu && device != "cpu":
		return "quality"
	case memory <= 0:
		return ""
	case memory < 6*gib:
		return "lite"
	default:
		return "balanced"
	}
}

// hardware 是 AI 服务 /config 里和推荐档位有关的几项
type hardware struct {
	Device string `json:"device"`
	GPU    struct {
		Available bool `json:"available"`
	} `json:"gpu"`
	Memory struct {
		Total int64 `json:"total"`
	} `json:"memory"`
}

func recommendFrom(raw json.RawMessage) string {
	var h hardware
	if json.Unmarshal(raw, &h) != nil {
		return ""
	}
	return Recommend(h.GPU.Available, h.Device, h.Memory.Total)
}

// Ready 是 AI 任务能不能开始领：档位是自动时，要等问到 AI 服务的硬件、定下用哪一档才开始，
// 免得在树莓派上先按默认的高精度模型算起来，把内存撑爆
func (a *Admin) Ready() bool {
	return a.resolved.Load()
}

// autoApply：档位是自动时，按 AI 服务器的硬件换到推荐的那档（不一样才换，所有照片要重新处理）。
// 模型不自动下载（内置的 AI 服务要用户在设置里点下载）
func (a *Admin) autoApply(ctx context.Context, raw json.RawMessage) {
	a.mu.Lock()
	auto := a.auto
	a.mu.Unlock()
	if !auto || a.switcher == nil {
		return
	}
	name := recommendFrom(raw)
	t, ok := Tiers[name]
	if !ok { // 旧版本的 AI 服务说不出硬件：用现在的
		a.resolved.Store(true)
		return
	}
	a.switchMu.Lock()
	defer a.switchMu.Unlock()
	if t != a.models() {
		if err := a.switcher(ctx, t); err != nil {
			log.Printf("AI 档位自动换成 %s 失败: %v", name, err)
			return
		}
		a.mu.Lock()
		a.inUse = t
		a.mu.Unlock()
		log.Printf("AI 档位自动：按 AI 服务器的硬件用「%s」", name)
	}
	a.resolved.Store(true)
}
