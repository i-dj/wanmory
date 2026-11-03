"""语义搜索的 ONNX 版：和 clip.py（PyTorch）算出一样的向量，但不用装 PyTorch、transformers（Docker 镜像从几 GB 降到几百 MB，
树莓派、N100 上也跑得动）。模型是用 scripts/export_clip_onnx.py 从 Chinese-CLIP 导出的，放在 <模型目录>/<模型>-onnx/。

预处理和 Chinese-CLIP 的一样：图片直接缩放到 224×224（双三次插值，不裁剪），按 meta.json 里的均值、方差归一化；
文字用 BERT 的切词（中文一个字一个词、转小写），前后加 [CLS] [SEP]，补齐到 52。
"""

from __future__ import annotations

import json
import logging
import threading
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort
from PIL import Image
from tokenizers import BertWordPieceTokenizer

from .face import providers
from .models import onnx_dir

log = logging.getLogger(__name__)


def _session(path: Path) -> ort.InferenceSession:
    # CoreML 跑不了这么大的模型（加载能过，算的时候出错）；Mac 上要用显卡时走 PyTorch 的 MPS（见 app.load_clip）
    use = [p for p in providers() if p != "CoreMLExecutionProvider"]
    try:
        return ort.InferenceSession(str(path), providers=use)
    except Exception as e:  # 大模型有些加速后端吃不下，退回 CPU
        log.warning("用 %s 加载 %s 失败（%s），改用 CPU", use, path.name, e)
        return ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])


class ClipOnnx:
    def __init__(self, name: str):
        directory = onnx_dir(name)
        meta = json.loads((directory / "meta.json").read_text())
        self.name = name
        self.dim = meta["dim"]
        self.size = tuple(meta["image_size"])  # 高、宽
        self.mean = np.array(meta["mean"], np.float32).reshape(3, 1, 1)
        self.std = np.array(meta["std"], np.float32).reshape(3, 1, 1)
        self.text_len = meta["text_len"]
        self.visual = _session(directory / "visual.onnx")
        self.text = _session(directory / "text.onnx")
        self.device = "cpu" if self.visual.get_providers()[0] == "CPUExecutionProvider" else "gpu"
        self.tokenizer = BertWordPieceTokenizer(
            str(directory / "vocab.txt"), clean_text=True, handle_chinese_chars=True, strip_accents=None, lowercase=True
        )
        self.tokenizer.enable_truncation(self.text_len)
        self.tokenizer.enable_padding(length=self.text_len, pad_id=0, pad_token="[PAD]")
        self.lock = threading.Lock()
        log.info("CLIP 模型 %s 已加载（ONNX，%s，%d 维）", name, self.visual.get_providers()[0], self.dim)

    def pixels(self, bgr: np.ndarray) -> np.ndarray:
        """OpenCV 的 BGR 图片 → [1, 3, 224, 224]，和 ChineseCLIPProcessor 一样（PIL 双三次缩放）"""
        pil = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        h, w = self.size
        arr = np.asarray(pil.resize((w, h), Image.BICUBIC), np.float32) / 255.0
        return ((arr.transpose(2, 0, 1) - self.mean) / self.std)[None].astype(np.float32)

    def image(self, bgr: np.ndarray) -> list[float]:
        with self.lock:
            out = self.visual.run(None, {"pixel_values": self.pixels(bgr)})[0]
        return _normalize(out)[0]

    def tokens(self, texts: list[str]) -> dict[str, np.ndarray]:
        enc = self.tokenizer.encode_batch(texts)
        ids = np.array([e.ids for e in enc], np.int64)
        mask = np.array([e.attention_mask for e in enc], np.int64)
        return {"input_ids": ids, "attention_mask": mask, "token_type_ids": np.zeros_like(ids)}

    def texts(self, texts: list[str]) -> list[list[float]]:
        with self.lock:
            out = self.text.run(None, self.tokens(texts))[0]
        return _normalize(out)


def _normalize(v: np.ndarray) -> list[list[float]]:
    v = v.astype(np.float32)
    return (v / np.linalg.norm(v, axis=-1, keepdims=True)).tolist()
