"""Wanmory 的 AI 服务：人脸识别、语义搜索（CLIP）、文字识别（OCR），通过 HTTP 提供给后端。"""

import os

# 版本号：Docker 镜像构建时写进环境变量（和相册程序同一个版本号），直接跑 Python 时是 dev
__version__ = os.environ.get("WANMORY_VERSION", "dev")
