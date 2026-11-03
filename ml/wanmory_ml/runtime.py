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
"""

from __future__ import annotations

import json
import logging
import threading

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
    return _settings


def _set(key: str, value: str, allowed: tuple[str, ...]) -> None:
    if value not in allowed:
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
