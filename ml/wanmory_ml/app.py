"""AI 服务的 HTTP 接口（约定见仓库 README「AI 服务接口约定」）。

服务是无状态的：只接收图片，返回计算结果，不访问数据库、不保存任何文件。图片随请求一起发来（multipart），
不读本地目录：AI 服务常常在另一台机器上（家里的 Mac、带显卡的电脑），和后端不共用文件。

  GET  /health   版本和可用的硬件加速
  GET  /models   支持的任务和模型；catalog 里每个模型下载了没有、下载进度
  POST /models/{id}/download  在后台下载模型（huggingface.co 和 hf-mirror.com 自动选通的、快的）
  DELETE /models/{id}  删掉下载过的模型，腾出磁盘（用到时再下载）
  GET  /config   用 GPU 还是 CPU（device：auto / gpu / cpu），这台机器有什么显卡；CPU 线程数、核数、内存
  PUT  /config   {"device": "cpu"} 改用什么算，已经加载的模型卸掉、下次按新的设置加载；
                 {"threads": 2} 用 CPU 算时每个模型几个线程（0 是自动），已经加载的模型卸掉；
                 {"parallel": 1} 同时算几张照片（0 是自动）
  POST /predict  image：图片文件；tasks：JSON，例如 {"face": {"model": "antelopev2", "min_score": 0.5}, "clip": {}, "ocr": {}}。
                 只算文字向量时不传图片：{"clip.text": {"texts": ["海边日落", "生日蛋糕"]}}

设置了环境变量 WANMORY_ML_TOKEN 时，除 /health 外的请求都要带 Authorization: Bearer <令牌>。
"""

from __future__ import annotations

import ctypes
import gc
import json
import logging
import os
import threading
import time

import cv2
import numpy as np
from fastapi import Body, Depends, FastAPI, File, Form, Header, HTTPException, UploadFile

from . import __version__
from . import models as model_files
from . import runtime
from .face import FaceModel, all_providers, providers

log = logging.getLogger(__name__)

TOKEN = os.environ.get("WANMORY_ML_TOKEN", "")
DEFAULT_FACE_MODEL = os.environ.get("WANMORY_FACE_MODEL", "antelopev2")
DEFAULT_CLIP_MODEL = os.environ.get("WANMORY_CLIP_MODEL", "chinese-clip-vit-h-14")
MAX_TEXTS = 256
MAX_IMAGE_BYTES = 30 << 20

app = FastAPI(title="Wanmory AI", version=__version__)

_face_models: dict[str, FaceModel] = {}
_face_lock = threading.Lock()
_clip_models: dict = {}
_ocr_model = None
_ocr_lock = threading.Lock()
_clip_loading: set[str] = set()
_clip_lock = threading.Lock()
# 每个模型最后一次用到的时间（"face:buffalo_l"、"clip:chinese-clip-vit-b-16"、"ocr"），闲置久了卸掉，见 unload_idle
_last_used: dict[str, float] = {}


def touch(key: str) -> None:
    _last_used[key] = time.monotonic()


class Slots:
    """同时算几张照片（人脸、语义、文字）：最多 runtime.parallel() 个，多的排队。上限在设置里能改，每次进来时重新看。
    树莓派上是 1：每个模型已经用满了设定的线程数，再一起算只会互相抢 CPU、内存翻倍。
    只算文字向量（搜索框）不排这个队，搜索不用等后台处理"""

    def __init__(self):
        self.cond = threading.Condition()
        self.busy = 0

    def __enter__(self):
        with self.cond:
            while self.busy >= runtime.parallel():
                self.cond.wait()
            self.busy += 1

    def __exit__(self, *exc):
        with self.cond:
            self.busy -= 1
            self.cond.notify_all()


_slots = Slots()


def missing(name: str) -> HTTPException:
    return HTTPException(status_code=503, detail=f"模型 {name} 还没下载，到相册的「设置 → AI 服务」里下载")


def face_model(name: str) -> FaceModel:
    """按名字取人脸模型，第一次用时加载（必要时先下载）。加载很慢，多个请求同时来时只加载一次"""
    if name not in model_files.INSIGHTFACE_PACKS:
        raise HTTPException(status_code=400, detail=f"不认识的人脸模型：{name}")
    if not model_files.AUTO_DOWNLOAD and not model_files.downloaded(name):
        raise missing(name)
    touch(f"face:{name}")
    with _face_lock:
        if name not in _face_models:
            _face_models[name] = FaceModel(name)
        return _face_models[name]


def clip_model(name: str):
    """加载 CLIP 模型（必要时先下载几个 GB），已经加载了直接返回。PyTorch 用到时才导入，只做人脸时启动快"""
    with _clip_lock:
        if name in _clip_models:
            return _clip_models[name]
        _clip_loading.add(name)
    try:
        model = load_clip(name)
        with _clip_lock:
            _clip_models[name] = model
        return model
    finally:
        with _clip_lock:
            _clip_loading.discard(name)


def load_clip(name: str):
    """按环境挑语义搜索的实现，两个算出来的向量一样（见 scripts/export_clip_onnx.py 的核对）：
    装了 PyTorch、有显卡、原版模型下载了时用 PyTorch（Apple 芯片、NVIDIA 显卡上快）；其他情况用 ONNX 版，
    不用装 PyTorch（Docker 镜像、树莓派、N100）"""
    torch_gpu = not runtime.cpu_only() and gpu_info()["torch"] is not None
    if model_files.has_torch() and model_files.has_hf(name) and (torch_gpu or not model_files.has_onnx(name)):
        from .clip import ClipModel

        return ClipModel(name)
    from .clip_onnx import ClipOnnx

    model_files.onnx_model(name)
    return ClipOnnx(name)


def ocr_model():
    """文字识别模型，第一次用时加载（模型随 rapidocr 包装好了，几秒钟）"""
    global _ocr_model
    touch("ocr")
    with _ocr_lock:
        if _ocr_model is None:
            from .ocr import OcrModel

            _ocr_model = OcrModel()
        return _ocr_model


def ready_clip(name: str):
    """请求里用的 CLIP 模型：还没加载好就在后台加载，这次先回 503，后端过一会儿再来（不算失败）"""
    if name not in model_files.CLIP_REPOS:
        raise HTTPException(status_code=400, detail=f"不认识的 CLIP 模型：{name}")
    touch(f"clip:{name}")
    with _clip_lock:
        model = _clip_models.get(name)
        loading = name in _clip_loading
    if model is not None:
        return model
    if not model_files.AUTO_DOWNLOAD and not model_files.downloaded(name):
        raise missing(name)
    if not loading:
        threading.Thread(target=clip_model, args=(name,), daemon=True).start()
    raise HTTPException(status_code=503, detail=f"CLIP 模型 {name} 正在下载或加载，稍后再试")


def unload_idle(now: float | None = None) -> list[str]:
    """卸掉闲置超过 runtime.unload_after() 秒的模型，返回卸掉了哪些。换了档位后旧档的模型没人用了，也是这样卸掉的。
    正在算的请求手里还拿着模型，算完才真的释放"""
    global _ocr_model
    after = runtime.unload_after()
    if after <= 0:
        return []
    now = time.monotonic() if now is None else now
    idle = [k for k, t in list(_last_used.items()) if now - t > after]
    gone = []
    for key in idle:
        kind, _, name = key.partition(":")
        if kind == "face":
            with _face_lock:
                if _face_models.pop(name, None) is not None:
                    gone.append(key)
        elif kind == "clip":
            with _clip_lock:
                if _clip_models.pop(name, None) is not None:
                    gone.append(key)
        elif kind == "ocr":
            with _ocr_lock:
                if _ocr_model is not None:
                    _ocr_model = None
                    gone.append(key)
        _last_used.pop(key, None)
    if gone:
        release_memory()
        log.info("闲置超过 %d 秒，卸掉模型：%s", after, "、".join(gone))
    return gone


def release_memory() -> None:
    """垃圾回收，再让 glibc 把空出来的内存还给系统（不然进程占的内存不会降下来）"""
    gc.collect()
    try:
        ctypes.CDLL("libc.so.6").malloc_trim(0)
    except (OSError, AttributeError):  # macOS 没有
        pass


def _unload_loop() -> None:
    while True:
        time.sleep(30)
        try:
            unload_idle()
        except Exception:  # 别让后台线程因为意外退出
            log.exception("卸载闲置模型出错")


threading.Thread(target=_unload_loop, daemon=True, name="unload-idle").start()


def check_token(authorization: str = Header(default="")) -> None:
    if TOKEN and authorization != f"Bearer {TOKEN}":
        raise HTTPException(status_code=401, detail="令牌不对")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "version": __version__, "providers": providers()}


@app.get("/models", dependencies=[Depends(check_token)])
def models() -> dict:
    loaded = set(_face_models) | set(_clip_models)
    catalog = [
        {
            **m,
            "downloaded": model_files.downloaded(m["id"]),
            "loaded": m["id"] in loaded,
            "progress": model_files.progress(m["id"]),
        }
        for m in model_files.CATALOG
    ]
    return {
        "catalog": catalog,
        "storage": model_files.storage(),
        "auto_download": model_files.AUTO_DOWNLOAD,
        "face": {
            "default": DEFAULT_FACE_MODEL,
            "available": ["antelopev2", "buffalo_l"],
            "loaded": sorted(_face_models),
            "dim": 512,
        },
        "clip": {
            "default": DEFAULT_CLIP_MODEL,
            "available": ["chinese-clip-vit-h-14", "chinese-clip-vit-l-14", "chinese-clip-vit-b-16"],
            "loaded": sorted(_clip_models),
        },
    }


@app.post("/models/{name}/download", dependencies=[Depends(check_token)])
def download_model(name: str) -> dict:
    # 装了 PyTorch、有显卡：下原版（PyTorch 跑更快）；其他情况下 ONNX 版
    original = model_files.has_torch() and not runtime.cpu_only() and gpu_info()["torch"] is not None
    try:
        model_files.start_download(name, original=original and name in model_files.CLIP_REPOS)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=f"没有这个模型：{name}") from e
    return {"downloaded": model_files.downloaded(name), "progress": model_files.progress(name)}


@app.delete("/models/{name}", dependencies=[Depends(check_token)])
def delete_model(name: str) -> dict:
    # 已经加载的先卸掉（正在算的请求拿着旧对象，算完就释放）
    with _face_lock:
        _face_models.pop(name, None)
    with _clip_lock:
        _clip_models.pop(name, None)
    release_memory()
    try:
        model_files.delete(name)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=f"没有这个模型：{name}") from e
    except RuntimeError as e:
        raise HTTPException(status_code=409, detail=str(e)) from e
    return {"downloaded": model_files.downloaded(name)}


_gpu_cache: dict | None = None


def gpu_info() -> dict:
    """这台机器有什么显卡：onnx 是人脸用的 ONNX Runtime 加速，torch 是语义搜索用的 PyTorch 设备（cuda / mps）"""
    global _gpu_cache
    if _gpu_cache is None:
        onnx = [p for p in all_providers() if p != "CPUExecutionProvider"]
        torch_dev = None
        if model_files.has_torch():  # 没装 PyTorch（ONNX 版）时不导入，导入很慢
            from .clip import gpu_device

            torch_dev = gpu_device()
        _gpu_cache = {"available": bool(onnx or torch_dev), "onnx": onnx, "torch": torch_dev}
    return _gpu_cache


def _gpu_usable() -> bool:
    info = gpu_info()
    return bool(info["onnx"] or info["torch"])


runtime.gpu_usable = _gpu_usable


@app.get("/config", dependencies=[Depends(check_token)])
def get_config() -> dict:
    return {
        "device": runtime.device_pref(),
        "gpu": gpu_info(),
        "threads": runtime.threads_pref(),
        "parallel": runtime.parallel_pref(),
        "parallel_auto": runtime.auto_parallel(),
        "parallel_max": runtime.MAX_PARALLEL,
        "unload_after": runtime.unload_after(),
        "loaded": sorted([*(f"face:{n}" for n in _face_models), *(f"clip:{n}" for n in _clip_models)])
        + (["ocr"] if _ocr_model is not None else []),
        "threads_auto": runtime.auto_threads(),
        "cpus": runtime.cpu_count(),
        "memory": runtime.memory(),
    }


@app.put("/config", dependencies=[Depends(check_token)])
def put_config(
    device: str | None = Body(None, embed=True),
    threads: int | None = Body(None, embed=True),
    parallel: int | None = Body(None, embed=True),
) -> dict:
    global _ocr_model
    try:
        if device is None and threads is None and parallel is None:
            return get_config()
        if device is not None:
            runtime.set_device_pref(device)
        if threads is not None:
            runtime.set_threads_pref(threads)
        if parallel is not None:
            runtime.set_parallel_pref(parallel)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    with _ocr_lock:
        _ocr_model = None
    # 卸掉已经加载的模型，下次用到时按新的设置加载（正在用的请求拿着旧对象，算完就释放）
    with _face_lock:
        _face_models.clear()
    with _clip_lock:
        _clip_models.clear()
    release_memory()
    return get_config()


@app.post("/predict", dependencies=[Depends(check_token)])
def predict(image: UploadFile | None = File(None), tasks: str = Form(...)) -> dict:
    try:
        wanted = json.loads(tasks)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"tasks 不是合法的 JSON：{e}") from e
    unknown = set(wanted) - {"face", "clip", "clip.text", "ocr"}
    if unknown:
        raise HTTPException(status_code=400, detail=f"不支持的任务：{', '.join(sorted(unknown))}")

    result: dict = {"model_ids": {}}
    if "clip.text" in wanted:
        opts = wanted["clip.text"] or {}
        texts = opts.get("texts") or ([opts["text"]] if opts.get("text") else [])
        if not texts or len(texts) > MAX_TEXTS or not all(isinstance(t, str) for t in texts):
            raise HTTPException(status_code=400, detail=f"clip.text 要给 text 或者 1–{MAX_TEXTS} 个 texts")
        name = opts.get("model") or DEFAULT_CLIP_MODEL
        start = time.perf_counter()
        vectors = ready_clip(name).texts(texts)
        result["clip.text"] = {"embeddings": vectors, "embedding": vectors[0]}
        result["model_ids"]["clip"] = name
        log.info("clip.text %d 段，%.0f ms", len(texts), (time.perf_counter() - start) * 1000)
    if not {"face", "clip", "ocr"} & set(wanted):
        return result
    if image is None:
        raise HTTPException(status_code=400, detail="face、clip、ocr 要传图片")

    data = image.file.read(MAX_IMAGE_BYTES + 1)
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="图片太大")
    if not data:
        raise HTTPException(status_code=400, detail="图片是空的")
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="图片解不开")

    result["image"] = {"width": img.shape[1], "height": img.shape[0]}
    with _slots:
        analyze(img, wanted, image.filename, result)
    return result


def analyze(img: np.ndarray, wanted: dict, filename: str | None, result: dict) -> None:
    if "face" in wanted:
        opts = wanted["face"] or {}
        name = opts.get("model") or DEFAULT_FACE_MODEL
        start = time.perf_counter()
        model = face_model(name)
        faces = model.analyze(img, float(opts.get("min_score", 0.5)))
        result["face"] = [f.__dict__ for f in faces]
        result["model_ids"]["face"] = name
        log.info("face %s：%d 张脸，%.0f ms", filename, len(faces), (time.perf_counter() - start) * 1000)
    if "clip" in wanted:
        opts = wanted["clip"] or {}
        name = opts.get("model") or DEFAULT_CLIP_MODEL
        start = time.perf_counter()
        model = ready_clip(name)
        result["clip"] = {"embedding": model.image(img)}
        result["model_ids"]["clip"] = name
        log.info("clip %s：%.0f ms", filename, (time.perf_counter() - start) * 1000)
    if "ocr" in wanted:
        from .ocr import MODEL_ID

        start = time.perf_counter()
        result["ocr"] = ocr_model().read(img)
        result["model_ids"]["ocr"] = MODEL_ID
        log.info(
            "ocr %s：%d 字，%.0f ms", filename, len(result["ocr"]["text"]), (time.perf_counter() - start) * 1000
        )
