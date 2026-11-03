"""人脸检测（SCRFD）和人脸特征（ArcFace），用 ONNX Runtime 推理。

流程：整张图缩放到 640×640（保持比例，右下补黑边）→ SCRFD 找出人脸框和 5 个关键点（两眼、鼻尖、两嘴角）
→ 按关键点把每张脸对齐、裁成 112×112 → ArcFace 算出 512 维特征（归一化到长度 1，两张脸的特征点积就是余弦相似度）。
另外给每张脸算两个质量指标，后端据此决定这张脸能不能用来分组：
  blur：对齐后人脸的拉普拉斯方差，越小越模糊；
  yaw：左右转头的程度，鼻尖偏离两眼中点的距离除以两眼间距，0 是正脸，0.5 左右已经很侧了。
SCRFD 输出的解码和 NMS 参照 InsightFace（MIT 许可）的实现。
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
import onnxruntime as ort

from .models import insightface_pack

log = logging.getLogger(__name__)

# ArcFace 训练时 5 个关键点在 112×112 图里的标准位置，对齐就是把检测到的关键点变换到这里
ARCFACE_TEMPLATE = np.array(
    [[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]],
    dtype=np.float32,
)

DET_SIZE = 640
NMS_THRESHOLD = 0.4


@dataclass
class Face:
    box: list[float]  # x, y, w, h，原图像素
    score: float
    landmarks: list[list[float]]  # 5 个点，原图像素
    embedding: list[float]  # 512 维，长度为 1
    blur: float
    yaw: float


def all_providers() -> list[str]:
    """这台机器能用的硬件加速，按优先级：CUDA、CoreML（Mac）、OpenVINO（Intel 核显），最后是 CPU。"""
    available = ort.get_available_providers()
    order = ["CUDAExecutionProvider", "CoreMLExecutionProvider", "OpenVINOExecutionProvider", "CPUExecutionProvider"]
    return [p for p in order if p in available]


def providers() -> list[str]:
    """现在要用的：设置里选了只用 CPU 时只有 CPU（见 runtime.py）"""
    from .runtime import cpu_only

    return ["CPUExecutionProvider"] if cpu_only() else all_providers()


def _session(path: Path) -> ort.InferenceSession:
    try:
        return ort.InferenceSession(str(path), providers=providers())
    except Exception as e:  # 个别加速后端不支持某些算子时，退回 CPU
        log.warning("用 %s 加载 %s 失败（%s），改用 CPU", providers(), path.name, e)
        return ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])


class FaceModel:
    """一个模型包（例如 antelopev2）里的检测和特征模型。"""

    def __init__(self, pack: str):
        self.pack = pack
        directory = insightface_pack(pack)
        det = next(p for p in directory.glob("*.onnx") if p.name.startswith(("scrfd", "det_")))
        rec = next(p for p in directory.glob("*.onnx") if p.name.startswith(("glint", "w600k")))
        self.det = _session(det)
        self.rec = _session(rec)
        self.det_input = self.det.get_inputs()[0].name
        self.rec_input = self.rec.get_inputs()[0].name
        self.det_outputs = [o.name for o in self.det.get_outputs()]
        self.dim = self.rec.get_outputs()[0].shape[-1]
        # SCRFD-10G 带关键点：3 个尺度（步长 8、16、32），每个位置 2 个锚点，输出 9 个：分数×3、框×3、关键点×3
        self.fmc = 3
        self.strides = [8, 16, 32]
        self.anchors = 2
        self._centers: dict[tuple[int, int, int], np.ndarray] = {}
        log.info("人脸模型 %s 已加载：检测 %s，特征 %s（%d 维），加速 %s",
                 pack, det.name, rec.name, self.dim, self.det.get_providers())

    def analyze(self, image: np.ndarray, min_score: float = 0.5) -> list[Face]:
        boxes, kpss = self._detect(image, min_score)
        faces = []
        for box, kps in zip(boxes, kpss):
            aligned = _align(image, kps)
            faces.append(
                Face(
                    box=[float(box[0]), float(box[1]), float(box[2] - box[0]), float(box[3] - box[1])],
                    score=float(box[4]),
                    landmarks=kps.round(2).tolist(),
                    embedding=self._embed(aligned).tolist(),
                    blur=float(cv2.Laplacian(cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()),
                    yaw=_yaw(kps),
                )
            )
        return faces

    def _detect(self, image: np.ndarray, threshold: float):
        h, w = image.shape[:2]
        scale = DET_SIZE / max(h, w)
        resized = cv2.resize(image, (round(w * scale), round(h * scale)))
        canvas = np.zeros((DET_SIZE, DET_SIZE, 3), dtype=np.uint8)
        canvas[: resized.shape[0], : resized.shape[1]] = resized
        blob = cv2.dnn.blobFromImage(canvas, 1 / 128, (DET_SIZE, DET_SIZE), (127.5, 127.5, 127.5), swapRB=True)
        outs = self.det.run(self.det_outputs, {self.det_input: blob})
        if outs[0].ndim == 3:  # 有的导出带了批次维度
            outs = [o[0] for o in outs]

        scores_all, boxes_all, kps_all = [], [], []
        for i, stride in enumerate(self.strides):
            scores = outs[i].reshape(-1)
            bbox = outs[i + self.fmc] * stride
            kps = outs[i + self.fmc * 2] * stride
            centers = self._anchor_centers(DET_SIZE // stride, DET_SIZE // stride, stride)
            keep = np.where(scores >= threshold)[0]
            if len(keep) == 0:
                continue
            c = centers[keep]
            b = bbox[keep]
            boxes_all.append(np.stack([c[:, 0] - b[:, 0], c[:, 1] - b[:, 1], c[:, 0] + b[:, 2], c[:, 1] + b[:, 3]], -1))
            k = kps[keep].reshape(-1, 5, 2)
            kps_all.append(k + c[:, None, :])
            scores_all.append(scores[keep])
        if not scores_all:
            return np.zeros((0, 5)), np.zeros((0, 5, 2))

        scores = np.concatenate(scores_all)
        boxes = np.concatenate(boxes_all) / scale
        kpss = np.concatenate(kps_all) / scale
        dets = np.hstack([boxes, scores[:, None]]).astype(np.float32)
        order = scores.argsort()[::-1]
        dets, kpss = dets[order], kpss[order]
        keep = _nms(dets, NMS_THRESHOLD)
        dets, kpss = dets[keep], kpss[keep]
        # 框不超出图片
        dets[:, [0, 2]] = dets[:, [0, 2]].clip(0, w)
        dets[:, [1, 3]] = dets[:, [1, 3]].clip(0, h)
        return dets, kpss

    def _anchor_centers(self, height: int, width: int, stride: int) -> np.ndarray:
        key = (height, width, stride)
        if key not in self._centers:
            grid = np.stack(np.mgrid[:height, :width][::-1], axis=-1).astype(np.float32)
            centers = (grid * stride).reshape(-1, 2)
            self._centers[key] = np.repeat(centers, self.anchors, axis=0)
        return self._centers[key]

    def _embed(self, aligned: np.ndarray) -> np.ndarray:
        blob = cv2.dnn.blobFromImage(aligned, 1 / 127.5, (112, 112), (127.5, 127.5, 127.5), swapRB=True)
        v = self.rec.run(None, {self.rec_input: blob})[0][0]
        return (v / np.linalg.norm(v)).astype(np.float32)


def _align(image: np.ndarray, kps: np.ndarray) -> np.ndarray:
    m, _ = cv2.estimateAffinePartial2D(kps.astype(np.float32), ARCFACE_TEMPLATE, method=cv2.LMEDS)
    return cv2.warpAffine(image, m, (112, 112), borderValue=0.0)


def _yaw(kps: np.ndarray) -> float:
    left_eye, right_eye, nose = kps[0], kps[1], kps[2]
    mid = (left_eye + right_eye) / 2
    span = float(np.linalg.norm(right_eye - left_eye)) or 1.0
    return round(float(nose[0] - mid[0]) / span, 3)


def _nms(dets: np.ndarray, threshold: float) -> list[int]:
    x1, y1, x2, y2, scores = dets.T
    areas = (x2 - x1 + 1) * (y2 - y1 + 1)
    order = scores.argsort()[::-1]
    keep = []
    while order.size > 0:
        i = order[0]
        keep.append(int(i))
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        inter = np.maximum(0.0, xx2 - xx1 + 1) * np.maximum(0.0, yy2 - yy1 + 1)
        iou = inter / (areas[i] + areas[order[1:]] - inter)
        order = order[np.where(iou <= threshold)[0] + 1]
    return keep
