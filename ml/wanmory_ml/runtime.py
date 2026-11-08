"""AI 服务的运行设置，在网页设置里改，存在模型目录的 runtime.json 里，重启后还在。

device：用 GPU 还是 CPU 算
  auto：有显卡（NVIDIA CUDA、Apple 芯片的 MPS / CoreML、Intel 核显 OpenVINO）就用，没有用 CPU；
  gpu：同 auto，只是网页上显示用户明确选了 GPU（没有显卡时还是 CPU）；
  cpu：只用 CPU，显卡留给别的程序，或者显卡出问题时用。
  改了之后已经加载的模型会卸掉，下次用到时按新的设置重新加载。
source：模型从哪下载（语义搜索的模型在 Hugging Face 上，见 models.py）
  auto：连得上 huggingface.co 就从那下，连不上（国内常见）用镜像 hf-mirror.com；
  huggingface：只从 huggingface.co 下；
  mirror：只从 hf-mirror.com 下。
parallel：同时算几张照片（人脸、语义、文字各算各的），0 是自动：有显卡 3；只有 CPU 时按核数和内存，
  12 核 16 GB 以上 3、8 核 8 GB 以上 2，再小（树莓派、N100）1，一张一张算，不互相抢 CPU 和内存。
threads：用 CPU 算时每个模型用几个线程，0 是自动：核数减一（给相册程序留一个核），再按同时算几个平分。
  改了 threads、parallel、device 之后已经加载的模型会卸掉，下次用到时按新的设置重新加载。

核数、内存按容器的限制算（docker compose 里的 cpus、mem_limit），没有限制时是整台机器的。
"""

from __future__ import annotations

import json
import logging
import os
import threading
from pathlib import Path

from .models import MODEL_DIR

log = logging.getLogger(__name__)

DEVICES = ("auto", "gpu", "cpu")
SOURCES = ("auto", "huggingface", "mirror")
_path = MODEL_DIR / "runtime.json"
_lock = threading.Lock()
_settings: dict | None = None


def _load() -> dict:
    global _settings
    if _settings is None:
        try:
            _settings = json.loads(_path.read_text())
        except (OSError, ValueError):
            _settings = {}
        if _settings.get("device") not in DEVICES:
            _settings["device"] = "auto"
        if _settings.get("source") not in SOURCES:
            _settings["source"] = "auto"
        for key in ("threads", "parallel"):
            t = _settings.get(key)
            if not isinstance(t, int) or isinstance(t, bool) or t < 0:
                _settings[key] = 0
    return _settings


def _set(key: str, value, allowed: tuple[str, ...] | None) -> None:
    if allowed is not None and value not in allowed:
        raise ValueError(f"{key} 应该是 {', '.join(allowed)} 之一")
    with _lock:
        s = _load()
        s[key] = value
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        _path.write_text(json.dumps(s))
    log.info("%s 改成 %s", key, value)


def device_pref() -> str:
    with _lock:
        return _load()["device"]


def set_device_pref(device: str) -> None:
    _set("device", device, DEVICES)


def source_pref() -> str:
    with _lock:
        return _load()["source"]


def set_source_pref(source: str) -> None:
    _set("source", source, SOURCES)


def cpu_only() -> bool:
    return device_pref() == "cpu"


def threads_pref() -> int:
    """设置里的线程数，0 是自动"""
    with _lock:
        return _load()["threads"]


def set_threads_pref(n: int) -> None:
    if not isinstance(n, int) or isinstance(n, bool) or n < 0 or n > cpu_count():
        raise ValueError(f"threads 应该是 0（自动）到 {cpu_count()} 之间的整数")
    _set("threads", n, None)


MAX_PARALLEL = 3
GB = 1 << 30

# 有没有能用的显卡，app.py 启动后接上（要看 PyTorch、ONNX Runtime 的加速后端，放在那边）
gpu_usable = lambda: False  # noqa: E731


def parallel_pref() -> int:
    with _lock:
        return _load()["parallel"]


def set_parallel_pref(n: int) -> None:
    if not isinstance(n, int) or isinstance(n, bool) or n < 0 or n > MAX_PARALLEL:
        raise ValueError(f"parallel 应该是 0（自动）到 {MAX_PARALLEL} 之间的整数")
    _set("parallel", n, None)


def auto_parallel() -> int:
    """自动同时算几个：有显卡 3；只有 CPU 时看核数和内存"""
    if not cpu_only() and gpu_usable():
        return MAX_PARALLEL
    cpus, mem = cpu_count(), memory()["total"] or 0
    if cpus >= 12 and mem >= 16 * GB:
        return 3
    if cpus >= 8 and mem >= 8 * GB:
        return 2
    return 1


def parallel() -> int:
    return parallel_pref() or auto_parallel()


def auto_threads() -> int:
    """自动的线程数：核数减一（至少 1），同时算几个就平分"""
    return max(1, (cpu_count() - 1) // parallel())


def threads() -> int:
    """现在用的线程数"""
    return threads_pref() or auto_threads()


def session_options():
    """ONNX Runtime 的会话设置：一个模型最多用 threads() 个线程（默认会用满所有核，几个模型一起算时线程互相抢）"""
    import onnxruntime as ort

    opts = ort.SessionOptions()
    opts.intra_op_num_threads = threads()
    opts.inter_op_num_threads = 1
    return opts


def _read(path: str) -> str | None:
    try:
        return Path(path).read_text().strip()
    except OSError:
        return None


def cpu_count() -> int:
    """能用几个核：取 CPU 亲和性和 cgroup 的 cpu.max（docker 的 cpus 限制）里小的那个"""
    try:
        n = len(os.sched_getaffinity(0))
    except AttributeError:  # macOS 没有
        n = os.cpu_count() or 1
    quota = (_read("/sys/fs/cgroup/cpu.max") or "max").split()
    if quota and quota[0] != "max":
        try:
            period = int(quota[1]) if len(quota) > 1 else 100000
            n = min(n, max(1, -(-int(quota[0]) // period)))  # 向上取整：cpus 1.5 算 2 个
        except ValueError:
            pass
    return max(1, n)


def memory() -> dict:
    """内存（字节）：total 是能用的总量，available 是现在还空着的。容器有 mem_limit 时按限制算"""
    total = available = 0
    for line in (_read("/proc/meminfo") or "").splitlines():
        key, _, rest = line.partition(":")
        if key in ("MemTotal", "MemAvailable"):
            value = int(rest.split()[0]) * 1024
            if key == "MemTotal":
                total = value
            else:
                available = value
    if not total:  # macOS
        try:
            total = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
        except (ValueError, OSError, AttributeError):
            pass
    limit = _read("/sys/fs/cgroup/memory.max")
    if limit and limit != "max":
        try:
            lim = int(limit)
            used = int(_read("/sys/fs/cgroup/memory.current") or 0)
            if not total or lim < total:
                total = lim
                available = max(0, lim - used) if not available else min(available, max(0, lim - used))
        except ValueError:
            pass
    return {"total": total, "available": available or None}
