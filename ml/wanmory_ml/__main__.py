"""启动 AI 服务：python -m wanmory_ml（或 uv run python -m wanmory_ml）。

WANMORY_ML_HOST、WANMORY_ML_PORT 改监听地址，默认 0.0.0.0:3003。
WANMORY_FACE_MODEL_PRELOAD=1 时启动就加载人脸模型（第一次会先下载），不等第一个请求；CLIP 模型几个 GB，
在后台加载，加载期间人脸识别照常工作。
"""

import logging
import os
import threading

import uvicorn

from .app import DEFAULT_CLIP_MODEL, DEFAULT_FACE_MODEL, app, clip_model, face_model


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    if os.environ.get("WANMORY_FACE_MODEL_PRELOAD") == "1":
        face_model(DEFAULT_FACE_MODEL)
        threading.Thread(target=clip_model, args=(DEFAULT_CLIP_MODEL,), daemon=True).start()
    uvicorn.run(
        app,
        host=os.environ.get("WANMORY_ML_HOST", "0.0.0.0"),
        port=int(os.environ.get("WANMORY_ML_PORT", "3003")),
        log_level="info",
    )


main()
