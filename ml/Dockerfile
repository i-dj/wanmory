# 两步构建：先用 uv 把依赖装进 /app/.venv，运行的镜像只拷这个目录，不带 uv（省 20 多 MB）
FROM python:3.12-slim AS build

COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /usr/local/bin/uv

WORKDIR /app
COPY pyproject.toml uv.lock ./
# 只装默认的包，不装 PyTorch：语义搜索用 ONNX 版，镜像小很多（树莓派、N100 也能跑）
RUN uv sync --frozen --no-dev --no-install-project
COPY wanmory_ml ./wanmory_ml
RUN uv sync --frozen --no-dev --no-editable \
 && find /app/.venv -depth -type d \( -name tests -o -name __pycache__ \) -path '*/site-packages/*' -exec rm -rf {} +

FROM python:3.12-slim
WORKDIR /app
COPY --from=build /app /app
ENV PATH=/app/.venv/bin:$PATH

# 模型存在这里：挂载一个目录，重建容器不用重新下载。容器里不自动下载（几百 MB 到几 GB），
# 用户在相册的「设置 → AI 服务」里点下载
ENV WANMORY_MODEL_DIR=/models
ENV WANMORY_AUTO_DOWNLOAD=0
# 版本号（发布时是标签去掉 v），和相册程序的一样，设置页上显示
ARG VERSION=dev
ENV WANMORY_VERSION=$VERSION
EXPOSE 3003
CMD ["python", "-m", "wanmory_ml"]
