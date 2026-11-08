"""文字识别：认出照片里的字（证件、文件、截图、招牌……），存进数据库后可以按字搜照片。

用 RapidOCR 跑百度飞桨的 PP-OCRv6（Apache-2.0）：中英文都认，倒过来的字也认（方向分类）。模型是 ONNX，
和人脸一样用 onnxruntime，在 CPU 上一张 1440 像素的预览图三四百毫秒；模型文件随 rapidocr 包一起装好，不用另外下载。
"""

from __future__ import annotations

import logging
import threading

import numpy as np

log = logging.getLogger(__name__)

MODEL_ID = "pp-ocrv6-small"
MIN_SCORE = 0.6  # 把握低于这个的一行不要，多半是把花纹、树叶认成了字


class OcrModel:
    def __init__(self):
        from rapidocr import RapidOCR

        from .runtime import threads

        n = threads()
        self.engine = RapidOCR(
            params={"EngineConfig.onnxruntime.intra_op_num_threads": n, "EngineConfig.onnxruntime.inter_op_num_threads": 1}
        )
        self.lock = threading.Lock()
        log.info("文字识别模型 %s 已加载", MODEL_ID)

    def read(self, bgr: np.ndarray) -> dict:
        """认出图片里的字：text 是按从上到下、从左到右排好、一行一个换行的全文，lines 带每行的把握"""
        with self.lock:
            result = self.engine(bgr)
        lines = []
        for text, score in zip(result.txts or (), result.scores or ()):
            text = text.strip()
            if text and score >= MIN_SCORE:
                lines.append({"text": text, "score": round(float(score), 3)})
        return {"text": "\n".join(line["text"] for line in lines), "lines": lines}
