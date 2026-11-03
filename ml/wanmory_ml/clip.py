"""语义搜索：Chinese-CLIP（阿里达摩院 OFA-Sys，MIT 许可）把图片和中文文字放进同一个向量空间，
「海边日落」的文字向量和海边日落照片的图片向量离得近。图片向量入库，搜索时算文字向量去比。

Chinese-CLIP 没有现成的 ONNX，这里用 PyTorch + transformers 跑：Apple 芯片用 MPS（GPU），有 NVIDIA 显卡用 CUDA，
都没有用 CPU。向量都归一化成长度 1，两个向量的点积就是余弦相似度。
"""

from __future__ import annotations

import logging
import threading

import cv2
import numpy as np
import torch
from PIL import Image
from transformers import ChineseCLIPModel, ChineseCLIPProcessor

from .models import CLIP_REPOS, hf_model

log = logging.getLogger(__name__)



def gpu_device() -> str | None:
    """这台机器上 PyTorch 能用的显卡：NVIDIA 是 cuda，Apple 芯片是 mps，都没有是 None"""
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return None


def device() -> str:
    """现在要用的：设置里选了只用 CPU 时是 cpu（见 runtime.py）"""
    from .runtime import cpu_only

    if cpu_only():
        return "cpu"
    if torch.cuda.is_available():
        return "cuda"
    if torch.backends.mps.is_available():
        return "mps"
    return "cpu"


class ClipModel:
    def __init__(self, name: str):
        if name not in CLIP_REPOS:
            raise ValueError(f"不认识的 CLIP 模型：{name}")
        path = hf_model(name, CLIP_REPOS[name])
        self.name = name
        self.device = device()
        # 显卡上用半精度：ViT-H/14 的权重从 4.1 GB 降到 1.9 GB，算出的向量和全精度的余弦相似度 0.99999，
        # 已经存下的向量不用重算。CPU 上半精度又慢又不一定支持，还是全精度
        self.dtype = torch.float16 if self.device in ("mps", "cuda") else torch.float32
        self.model = ChineseCLIPModel.from_pretrained(path, dtype=self.dtype).to(self.device).eval()
        self.processor = ChineseCLIPProcessor.from_pretrained(path)
        self.dim = self.model.config.projection_dim
        # 同一时刻只让一个请求用模型：MPS 上并发推理会出错，也不会更快
        self.lock = threading.Lock()
        log.info("CLIP 模型 %s 已加载（%s，%d 维）", name, self.device, self.dim)

    @torch.inference_mode()
    def image(self, bgr: np.ndarray) -> list[float]:
        """一张图片（OpenCV 的 BGR）的向量"""
        pil = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        # 像素也换成模型的精度（BatchFeature.to 只转浮点的）
        inputs = self.processor(images=pil, return_tensors="pt").to(self.device).to(self.dtype)
        with self.lock:
            out = self.model.get_image_features(**inputs)
        return _normalize(out)[0]

    @torch.inference_mode()
    def texts(self, texts: list[str]) -> list[list[float]]:
        """几段文字的向量，顺序和 texts 一样"""
        inputs = self.processor(text=texts, padding=True, truncation=True, max_length=52, return_tensors="pt").to(
            self.device
        )
        with self.lock:
            out = self.model.get_text_features(**inputs)
        return _normalize(out)


def _normalize(t) -> list[list[float]]:
    # 新版 transformers 可能返回带 pooler_output 的对象，旧版直接是张量
    if not isinstance(t, torch.Tensor):
        pooled = getattr(t, "pooler_output", None)
        t = pooled if pooled is not None else t[0]
    t = torch.nn.functional.normalize(t.float(), dim=-1)
    return t.cpu().numpy().tolist()
