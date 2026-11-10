"""模型文件的下载和缓存。

模型不放进代码仓库和镜像，第一次用到时从官方地址下载到缓存目录（WANMORY_MODEL_DIR，默认 ~/.cache/wanmory/models），
之后直接用。也可以在网页的设置里先点「下载」（见 app.py 的 /models/{id}/download），下载进度在 progress() 里。
下载先写到临时文件，完整下载、解压成功后才放到正式位置，中途断掉不会留下坏文件。
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import logging
import os
import shutil
import tempfile
import threading
import time
import urllib.request
import zipfile
from pathlib import Path
from typing import Callable

log = logging.getLogger(__name__)

MODEL_DIR = Path(os.environ.get("WANMORY_MODEL_DIR", Path.home() / ".cache" / "wanmory" / "models"))

# WANMORY_AUTO_DOWNLOAD=0 时（Docker 里的内置 AI 服务）用到没下载的模型不自动下载，回答「还没下载」，
# 要用户在相册的设置里点下载（模型几百 MB 到几 GB，不能悄悄下）
AUTO_DOWNLOAD = os.environ.get("WANMORY_AUTO_DOWNLOAD", "1") != "0"


class ModelMissing(Exception):
    """模型还没下载，又不让自动下载"""


def storage() -> dict:
    """模型存在哪：dir 是目录；mounted 是不是挂载进容器的目录（容器重建后还在），不在 Linux 容器里时是 None"""
    mounted = None
    try:
        points = {line.split()[4] for line in Path("/proc/self/mountinfo").read_text().splitlines()}
        mounted = any(str(p) in points for p in (MODEL_DIR, *MODEL_DIR.parents) if str(p) != "/")
    except OSError:
        pass
    return {"dir": str(MODEL_DIR), "mounted": mounted}

# InsightFace 的模型包。许可：仅限非商业用途（见 README 的「模型许可」）
INSIGHTFACE_PACKS = {
    "antelopev2": "https://github.com/deepinsight/insightface/releases/download/v0.7/antelopev2.zip",
    "buffalo_l": "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip",
}

# Chinese-CLIP：模型 ID → Hugging Face 上的仓库；向量维度：H/14 是 1024，L/14 是 768，B/16 是 512
CLIP_REPOS = {
    "chinese-clip-vit-h-14": "OFA-Sys/chinese-clip-vit-huge-patch14",
    "chinese-clip-vit-l-14": "OFA-Sys/chinese-clip-vit-large-patch14",
    "chinese-clip-vit-b-16": "OFA-Sys/chinese-clip-vit-base-patch16",
}

# CATALOG 是网页设置里列出的模型：大小是下载的大概大小（MB），下载时以实际的为准
CATALOG = [
    {"id": "antelopev2", "kind": "face", "label": "人脸识别 · 高精度", "size_mb": 344},
    {"id": "buffalo_l", "kind": "face", "label": "人脸识别 · 标准", "size_mb": 281},
    {"id": "chinese-clip-vit-h-14", "kind": "clip", "label": "语义搜索 · 高精度（H/14）", "size_mb": 3900},
    {"id": "chinese-clip-vit-l-14", "kind": "clip", "label": "语义搜索 · 均衡（L/14）", "size_mb": 1630},
    {"id": "chinese-clip-vit-b-16", "kind": "clip", "label": "语义搜索 · 轻量（B/16）", "size_mb": 750},
]

# 下载进度：模型 ID → {"state": downloading / done / error, "done": 已下载字节, "total": 总字节, "error": 出错信息}
_progress: dict[str, dict] = {}
_progress_lock = threading.Lock()
_download_locks: dict[str, threading.Lock] = {name: threading.Lock() for name in [*INSIGHTFACE_PACKS, *CLIP_REPOS]}


def progress(name: str) -> dict | None:
    with _progress_lock:
        p = _progress.get(name)
        return dict(p) if p else None


def _report(name: str, **fields) -> None:
    with _progress_lock:
        _progress.setdefault(name, {"state": "downloading", "done": 0, "total": 0, "error": ""}).update(fields)


def downloaded(name: str) -> bool:
    if name in INSIGHTFACE_PACKS:
        target = MODEL_DIR / name
        return target.is_dir() and any(target.glob("*.onnx"))
    if name in CLIP_REPOS:
        # ONNX 版就能用；装了 PyTorch 时原版也能用
        return has_onnx(name) or (has_torch() and has_hf(name))
    raise KeyError(name)


def start_download(name: str, original: bool = False) -> None:
    """在后台下载模型（已经在下载就不重复），进度看 progress(name)。
    语义搜索默认下 ONNX 版；original 时下原版（装了 PyTorch、有显卡，用 PyTorch 跑更快）"""
    if name not in _download_locks:
        raise KeyError(name)
    if downloaded(name):
        return
    p = progress(name)
    if p and p["state"] == "downloading":
        return
    _report(name, state="downloading", done=0, total=0, error="")

    def run() -> None:
        try:
            if name in INSIGHTFACE_PACKS:
                insightface_pack(name, download=True)
            elif original:
                hf_model(name, CLIP_REPOS[name], download=True)
            else:
                onnx_model(name, download=True)
        except Exception as e:  # 网络断了、磁盘满了：记下来给网页看，可以再点一次重试（重试时重新选下载源）
            log.exception("下载模型 %s 失败", name)
            forget_endpoint()
            _report(name, state="error", error=str(e))

    threading.Thread(target=run, daemon=True).start()


def delete(name: str) -> None:
    """删掉下载过的模型文件（ONNX 版、原版都删），只是腾出磁盘，用到时再下载。正在下载时不能删"""
    if name not in _download_locks:
        raise KeyError(name)
    if not _download_locks[name].acquire(blocking=False):
        raise RuntimeError("正在下载，下载完才能删")
    try:
        for d in (MODEL_DIR / name, onnx_dir(name)):
            if d.exists():
                shutil.rmtree(d)
        with _progress_lock:
            _progress.pop(name, None)
        log.info("删掉了模型 %s", name)
    finally:
        _download_locks[name].release()


def insightface_pack(name: str, download: bool = AUTO_DOWNLOAD) -> Path:
    """返回解压好的 InsightFace 模型包目录，没有就先下载（download 为 False 时抛 ModelMissing）"""
    target = MODEL_DIR / name
    with _download_locks[name]:
        if downloaded(name):
            return target
        if not download:
            raise ModelMissing(name)
        url = INSIGHTFACE_PACKS[name]
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        log.info("下载模型 %s：%s", name, url)
        _report(name, state="downloading", error="")
        with tempfile.TemporaryDirectory(dir=MODEL_DIR) as tmp:
            archive = Path(tmp) / f"{name}.zip"
            _download(url, archive, lambda done, size: _report(name, done=done, total=size))
            unpacked = Path(tmp) / "unpacked"
            with zipfile.ZipFile(archive) as z:
                z.extractall(unpacked)
            # 有的包里多套了一层同名目录
            onnx = next(unpacked.rglob("*.onnx"), None)
            if onnx is None:
                raise RuntimeError(f"模型包 {name} 里没有 .onnx 文件")
            if target.exists():
                shutil.rmtree(target)
            shutil.move(str(onnx.parent), target)
        _report(name, state="done")
        log.info("模型 %s 已就绪：%s", name, target)
        return target


def _download(url: str, dest: Path, on_progress: Callable[[int, int], None], start: int = 0) -> None:
    """下载到 dest，每 1 MB 报一次进度（start 是之前的文件已经下载了多少，累加着报）"""
    with urllib.request.urlopen(url, timeout=60) as resp, open(dest, "wb") as out:
        size = int(resp.headers.get("Content-Length") or 0)
        done = 0
        last = 0
        while chunk := resp.read(1 << 20):
            out.write(chunk)
            done += len(chunk)
            on_progress(start + done, size)
            if size and done - last >= size // 10:
                last = done
                log.info("  %s %d%%（%d / %d MB）", dest.name, done * 100 // size, done >> 20, size >> 20)


# 语义搜索的 ONNX 版（见 clip_onnx.py，scripts/export_clip_onnx.py 导出）放在 <模型目录>/<模型>-onnx/，
# meta.json 里列着其他文件和它们的大小、SHA-256。从 Hugging Face 上的 ONNX_REPO 下载（<模型>/meta.json，再按 files 一个个下）。
# huggingface.co 和国内镜像 hf-mirror.com 自动选：两个同时试，连得上的里面用快的（见 endpoint()）。
# WANMORY_ONNX_URL 可以换成别的地址（<地址>/<模型>/<文件>），例如自己局域网里放的
ONNX_REPO = os.environ.get("WANMORY_ONNX_REPO", "i-dj/chinese-clip-onnx")
ONNX_URL = os.environ.get("WANMORY_ONNX_URL", "").rstrip("/")
HF_ENDPOINTS = ("https://huggingface.co", "https://hf-mirror.com")
PROBE_BYTES = 256 << 10  # 测速时每个源下载多少
_endpoint_cache: tuple[float, str] | None = None
_endpoint_lock = threading.Lock()


def _probe(base: str) -> float | None:
    """从 base 下一小段模型文件，返回用了几秒；连不上、出错返回 None"""
    url = f"{base}/{ONNX_REPO}/resolve/main/chinese-clip-vit-b-16/meta.json"
    start = time.monotonic()
    try:
        with urllib.request.urlopen(url, timeout=6) as resp:
            meta = json.loads(resp.read())
        # 再按 Range 下一段大文件，看真实的下载速度（meta.json 太小，只能看出延迟）
        big = max(meta.get("sizes", {}).items(), key=lambda kv: kv[1], default=(None, 0))[0]
        if big:
            req = urllib.request.Request(
                f"{base}/{ONNX_REPO}/resolve/main/chinese-clip-vit-b-16/{big}",
                headers={"Range": f"bytes=0-{PROBE_BYTES - 1}"},
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                while resp.read(1 << 16):
                    pass
    except (OSError, ValueError):
        return None
    return time.monotonic() - start


def endpoint() -> str:
    """从哪下载 Hugging Face 上的模型：huggingface.co 和 hf-mirror.com 同时试，用连得上、下得快的那个（结果记 10 分钟；
    下载出错时 forget_endpoint() 清掉，下次重新试）。都连不上时先用 huggingface.co，下载会报出原因"""
    global _endpoint_cache
    with _endpoint_lock:
        if _endpoint_cache and time.monotonic() - _endpoint_cache[0] < 600:
            return _endpoint_cache[1]
        results: dict[str, float | None] = {}
        threads = [
            threading.Thread(target=lambda b=b: results.__setitem__(b, _probe(b)), daemon=True) for b in HF_ENDPOINTS
        ]
        for t in threads:
            t.start()
        for t in threads:
            t.join(20)
        ok = {b: t for b, t in results.items() if t is not None}
        chosen = min(ok, key=ok.__getitem__) if ok else HF_ENDPOINTS[0]
        _endpoint_cache = (time.monotonic(), chosen)
        log.info("模型从 %s 下载（测速：%s）", chosen, {b: (f"{t:.1f}s" if t else "连不上") for b, t in results.items()})
        return chosen


def forget_endpoint() -> None:
    global _endpoint_cache
    with _endpoint_lock:
        _endpoint_cache = None


def onnx_base(name: str) -> str:
    if ONNX_URL:
        return f"{ONNX_URL}/{name}"
    return f"{endpoint()}/{ONNX_REPO}/resolve/main/{name}"


def onnx_dir(name: str) -> Path:
    return MODEL_DIR / f"{name}-onnx"


def has_onnx(name: str) -> bool:
    meta = onnx_dir(name) / "meta.json"
    if not meta.is_file():
        return False
    try:
        files = json.loads(meta.read_text()).get("files", [])
    except ValueError:
        return False
    return bool(files) and all((onnx_dir(name) / f).is_file() for f in files)


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 24), b""):
            h.update(chunk)
    return h.hexdigest()


def has_torch() -> bool:
    """装了 PyTorch（uv sync --extra torch）：能直接用 Hugging Face 上的原版模型，Mac、NVIDIA 显卡上更快"""
    return importlib.util.find_spec("torch") is not None and importlib.util.find_spec("transformers") is not None


def has_hf(name: str) -> bool:
    return all((MODEL_DIR / name / f).is_file() for f in HF_FILES)


def onnx_model(name: str, download: bool = AUTO_DOWNLOAD) -> Path:
    """返回 ONNX 版的目录，没有就从 WANMORY_ONNX_URL 下载"""
    target = onnx_dir(name)
    with _download_locks[name]:
        if has_onnx(name):
            return target
        if not download:
            raise ModelMissing(name)
        base = onnx_base(name)
        target.mkdir(parents=True, exist_ok=True)
        with urllib.request.urlopen(f"{base}/meta.json", timeout=60) as resp:
            meta_raw = resp.read()
        meta = json.loads(meta_raw)
        files, sizes, hashes = meta.get("files", []), meta.get("sizes", {}), meta.get("sha256", {})
        total = sum(sizes.values())
        done = sum(sizes.get(f, 0) for f in files if (target / f).is_file())
        _report(name, state="downloading", done=done, total=total, error="")
        log.info("下载模型 %s（ONNX）：%s", name, base)
        for f in files:
            if (target / f).is_file():
                continue
            part = target / f"{f}.part"
            _download(f"{base}/{f}", part, lambda d, _t: _report(name, done=d, total=total), start=done)
            if f in hashes and _sha256(part) != hashes[f]:
                part.unlink()
                raise RuntimeError(f"{f} 下载得不完整（校验不对），再下一次试试")
            part.rename(target / f)
            done += sizes.get(f, 0)
        (target / "meta.json").write_bytes(meta_raw)  # 最后写 meta.json：有它才算下载完了
        _report(name, state="done", done=total, total=total)
        log.info("模型 %s 已就绪：%s", name, target)
        return target


# Hugging Face 上的模型（Chinese-CLIP）只下载 transformers 加载要用的几个文件
HF_FILES = ["config.json", "preprocessor_config.json", "vocab.txt", "pytorch_model.bin"]


def hf_model(name: str, repo: str, download: bool = AUTO_DOWNLOAD) -> Path:
    """返回下载好的 Hugging Face 模型目录（MODEL_DIR/<name>），没有就先下载。一个个文件先写到 .part，下完再改名，
    中途断掉不会留下坏文件；已经下好的文件不重下。设置了 HF_ENDPOINT（例如国内的镜像）时从那里下"""
    target = MODEL_DIR / name
    with _download_locks[name]:
        if has_hf(name):
            return target
        if not download:
            raise ModelMissing(name)
        from huggingface_hub import get_hf_file_metadata, hf_hub_url

        log.info("下载模型 %s：huggingface.co/%s（几个 GB，要等一会儿）", name, repo)
        target.mkdir(parents=True, exist_ok=True)
        files = [(f, hf_hub_url(repo, f, endpoint=endpoint())) for f in HF_FILES]
        sizes = {f: get_hf_file_metadata(url).size or 0 for f, url in files}
        total = sum(sizes.values())
        done = sum(sizes[f] for f, _ in files if (target / f).is_file())
        _report(name, state="downloading", done=done, total=total, error="")
        for f, url in files:
            if (target / f).is_file():
                continue
            part = target / f"{f}.part"
            _download(url, part, lambda d, _t: _report(name, done=d, total=total), start=done)
            part.rename(target / f)
            done += sizes[f]
        _report(name, state="done", done=total, total=total)
        log.info("模型 %s 已就绪：%s", name, target)
        return target
