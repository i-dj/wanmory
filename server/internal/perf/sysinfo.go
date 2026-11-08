package perf

import (
	"os"
	"runtime"
	"strconv"
	"strings"
)

// CPUs 是相册程序能用几个核。Go 的 GOMAXPROCS 已经按 CPU 亲和性和容器的 cpus 限制算好了
func CPUs() int {
	return max(1, runtime.GOMAXPROCS(0))
}

// Memory 是能用的内存总量（字节）：容器设了 mem_limit 时按限制，不然是整台机器的；读不到（macOS 开发时）是 0
func Memory() int64 {
	var total int64
	if data, err := os.ReadFile("/proc/meminfo"); err == nil {
		for line := range strings.SplitSeq(string(data), "\n") {
			if rest, ok := strings.CutPrefix(line, "MemTotal:"); ok {
				if kb, err := strconv.ParseInt(strings.Fields(rest)[0], 10, 64); err == nil {
					total = kb * 1024
				}
				break
			}
		}
	}
	if data, err := os.ReadFile("/sys/fs/cgroup/memory.max"); err == nil {
		if lim, err := strconv.ParseInt(strings.TrimSpace(string(data)), 10, 64); err == nil && (total == 0 || lim < total) {
			total = lim
		}
	}
	return total
}

// DefaultWorkers 是同时处理几个任务（读元数据、生成缩略图）的自动值：一个核一个，但每个大概要 1 GB 内存
// （大的 HEIC、RAW、视频截帧），内存少时按内存来。4 核 4 GB 的树莓派是 3 个
func DefaultWorkers(cpus int, memory int64) int {
	n := cpus
	if memory > 0 {
		n = min(n, int(memory>>30))
	}
	return max(1, n)
}
