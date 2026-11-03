"""把 Chinese-CLIP 导出成 ONNX，这样 AI 服务不装 PyTorch 也能算语义向量（Docker 镜像小很多，树莓派、N100 上也跑得动）。

用法（要装了 PyTorch 的环境，例如 uv sync --extra torch）：
    uv run python scripts/export_clip_onnx.py chinese-clip-vit-h-14 [输出目录]

输出到 <模型目录>/<模型>-onnx/：
    visual.onnx（+ visual.onnx.data）  图片 → 向量，输入 pixel_values [N, 3, 224, 224]
    text.onnx（+ text.onnx.data）      文字 → 向量，输入 input_ids、attention_mask、token_type_ids [N, 52]
                                       （长度固定 52，不够的补齐：导出时注意力掩码的处理按这个长度定死了）
    vocab.txt                          文字切词表
    meta.json                          向量维度、预处理参数
向量都没有归一化，和 PyTorch 的 get_image_features / get_text_features 一样，用的时候再归一化。
导出后会拿几张随机图片、几段文字和 PyTorch 的结果比一下，相似度不够 0.9999 就报错。
"""

from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

import numpy as np
import torch
from transformers import ChineseCLIPModel, ChineseCLIPProcessor

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from wanmory_ml.models import CLIP_REPOS, MODEL_DIR, hf_model  # noqa: E402

TEXT_LEN = 52  # 和 clip.py 一样，搜索词、分类描述都很短


class Visual(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, pixel_values):
        out = self.model.get_image_features(pixel_values=pixel_values)
        return out if isinstance(out, torch.Tensor) else out.pooler_output


class Text(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, input_ids, attention_mask, token_type_ids):
        out = self.model.get_text_features(
            input_ids=input_ids, attention_mask=attention_mask, token_type_ids=token_type_ids
        )
        return out if isinstance(out, torch.Tensor) else out.pooler_output


def export(name: str, out_dir: Path) -> None:
    src = hf_model(name, CLIP_REPOS[name], download=True)
    # eager：普通的注意力实现，导出时掩码的处理不会被写死（SDPA 的会）
    model = ChineseCLIPModel.from_pretrained(src, dtype=torch.float32, attn_implementation="eager").eval()
    processor = ChineseCLIPProcessor.from_pretrained(src)
    out_dir.mkdir(parents=True, exist_ok=True)
    ref = reference(model, processor)

    pixels = torch.randn(1, 3, 224, 224)
    texts = processor(text=["海边日落", "一只猫"], padding="max_length", max_length=TEXT_LEN, return_tensors="pt")
    with torch.inference_mode():
        torch.onnx.export(
            Visual(model), (pixels,), str(out_dir / "visual.onnx"), input_names=["pixel_values"],
            output_names=["embedding"], dynamic_axes={"pixel_values": {0: "batch"}, "embedding": {0: "batch"}},
            opset_version=17, dynamo=False, external_data=True,
        )
        torch.onnx.export(
            Text(model), (texts["input_ids"], texts["attention_mask"], texts["token_type_ids"]),
            str(out_dir / "text.onnx"), input_names=["input_ids", "attention_mask", "token_type_ids"],
            output_names=["embedding"],
            dynamic_axes={k: {0: "batch"} for k in ("input_ids", "attention_mask", "token_type_ids", "embedding")},
            opset_version=17, dynamo=False, external_data=True,
        )
    pack(out_dir)
    shutil.copy(src / "vocab.txt", out_dir / "vocab.txt")
    pre = json.loads((src / "preprocessor_config.json").read_text())
    meta = {
        "model": name,
        "dim": model.config.projection_dim,
        "image_size": [pre["size"]["height"], pre["size"]["width"]],
        "mean": pre["image_mean"],
        "std": pre["image_std"],
        "text_len": TEXT_LEN,
        # 要下载的文件（超过 2 GB 的模型权重另存在 .onnx.data 里）
        "files": sorted(p.name for p in out_dir.iterdir() if p.name != "meta.json"),
    }
    (out_dir / "meta.json").write_text(json.dumps(meta, indent=2))
    check(ref, out_dir)
    print(f"导出好了：{out_dir}")


def pack(out_dir: Path) -> None:
    """超过 2 GB 的模型导出时每个权重一个文件（几百个）。合成 <名字>.onnx + 一个 <名字>.onnx.data，好下载。
    先存到临时目录，都存好了再换掉原来的文件，中途出错不会把导出的模型弄坏"""
    import onnx
    from onnx.external_data_helper import convert_model_to_external_data

    tmp = out_dir / ".packing"
    shutil.rmtree(tmp, ignore_errors=True)
    tmp.mkdir()
    for name in ("visual.onnx", "text.onnx"):
        model = onnx.load(str(out_dir / name), load_external_data=True)
        # 权重一律放进一个 .data 文件（protobuf 一个文件最多 2 GB，大模型的图只能这么存）
        convert_model_to_external_data(model, all_tensors_to_one_file=True, location=f"{name}.data", size_threshold=1024)
        onnx.save_model(model, str(tmp / name))
    for p in out_dir.iterdir():
        if p.is_file() and p.name not in ("meta.json", "vocab.txt"):
            p.unlink()
    for p in tmp.iterdir():
        p.rename(out_dir / p.name)
    tmp.rmdir()


WORDS = ["海边日落", "生日蛋糕", "在游泳的宝宝", "手机屏幕截图"]


def reference(model, processor) -> dict:
    """导出之前先用 PyTorch 算好对照的向量（导出过程会改动内存里的模型，导出后再算就不准了）"""
    rng = np.random.default_rng(0)
    pixels = rng.standard_normal((2, 3, 224, 224)).astype(np.float32)
    padded = processor(text=WORDS, padding="max_length", truncation=True, max_length=TEXT_LEN, return_tensors="pt")
    short = processor(text=WORDS, padding=True, return_tensors="pt")
    with torch.inference_mode():
        return {
            "pixels": pixels,
            "padded": {k: padded[k].numpy().astype(np.int64) for k in ("input_ids", "attention_mask", "token_type_ids")},
            "image": Visual(model)(torch.from_numpy(pixels)).numpy(),
            "text": Text(model)(padded["input_ids"], padded["attention_mask"], padded["token_type_ids"]).numpy(),
            "short": Text(model)(short["input_ids"], short["attention_mask"], short["token_type_ids"]).numpy(),
        }


def check(ref: dict, out_dir: Path) -> None:
    """ONNX 和 PyTorch 算出来的向量要几乎一样，数据库里已经存的向量才能接着用"""
    import onnxruntime as ort

    def cos(a, b):
        a, b = np.asarray(a, np.float64), np.asarray(b, np.float64)
        return float((a * b).sum() / np.linalg.norm(a) / np.linalg.norm(b))

    vis = ort.InferenceSession(str(out_dir / "visual.onnx"), providers=["CPUExecutionProvider"])
    txt = ort.InferenceSession(str(out_dir / "text.onnx"), providers=["CPUExecutionProvider"])
    got_img = vis.run(None, {"pixel_values": ref["pixels"]})[0]
    got_txt = txt.run(None, ref["padded"])[0]
    img = min(cos(a, b) for a, b in zip(ref["image"], got_img))
    text = min(cos(a, b) for a, b in zip(ref["text"], got_txt))
    pad = min(cos(a, b) for a, b in zip(ref["short"], got_txt))  # 补齐到 52 和 PyTorch 平时不补齐的也要一样
    print(f"和 PyTorch 比的相似度：图片 {img:.6f}，文字 {text:.6f}，补齐和不补齐 {pad:.6f}")
    if min(img, text, pad) < 0.9999:
        raise SystemExit("导出的 ONNX 和 PyTorch 的结果差太多")


if __name__ == "__main__":
    name = sys.argv[1]
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else MODEL_DIR / f"{name}-onnx"
    if "--pack" in sys.argv:  # 只重新打包已经导出的
        pack(out)
        meta = json.loads((out / "meta.json").read_text())
        meta["files"] = sorted(p.name for p in out.iterdir() if p.name != "meta.json")
        (out / "meta.json").write_text(json.dumps(meta, indent=2))
    else:
        export(name, out)
