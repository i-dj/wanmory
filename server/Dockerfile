# 后端镜像：Go 程序（内嵌前端页面）+ 处理照片和视频用的 ExifTool、libvips、FFmpeg。
# 用户和开发者本机都不需要再装这些工具。构建上下文是仓库根目录：
#   docker build -f server/Dockerfile .

# ---- 打包前端 ----
# 网页文件和 CPU 架构无关：在构建机本身的架构上打包一次（BUILDPLATFORM），不在模拟器里重复做
FROM --platform=$BUILDPLATFORM node:24-trixie-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ---- 编译后端，把前端嵌进去 ----
# 也在构建机本身的架构上编译，用 GOARCH 交叉编译出目标架构（TARGETARCH）的程序
FROM --platform=$BUILDPLATFORM golang:1.26-trixie AS build
ARG TARGETOS TARGETARCH
# 版本号（发布时是标签去掉 v，例如 0.2.2），写进程序里，设置 → 系统更新拿它和 GitHub 上的比
ARG VERSION=dev
WORKDIR /src
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ ./
COPY --from=web /web/dist/ ./internal/webui/dist/
# 纯 Go 程序，不需要 cgo，编出来是静态文件
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH go build -trimpath -ldflags="-s -w -X github.com/wanmory/wanmory/server/internal/version.Version=${VERSION}" -o /out/wanmory ./cmd/wanmory

# ---- 运行 ----
FROM debian:trixie-slim
# libvips-tools：vipsthumbnail；libheif-plugin-libde265：HEIC 解码（iPhone 照片）
# libimage-exiftool-perl：exiftool；tzdata：照片没有时区时按 TZ 解释
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libvips-tools libheif-plugin-libde265 libimage-exiftool-perl tzdata ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# ffmpeg（视频截帧）用静态编译的单个文件：Debian 的 ffmpeg 包会连带装上 LLVM、显卡驱动、语音合成等
# 三百多 MB 用不到的库，镜像大一倍。来自 github.com/wader/static-ffmpeg，固定版本和摘要，换版本时一起改
COPY --from=mwader/static-ffmpeg:7.1.1@sha256:11a44711684c0b9f754c047dcd64235b8b52deab251bd0e0a86f22faa160749c /ffmpeg /usr/local/bin/ffmpeg

# 相册以 wanmory（uid 1000）运行：入口脚本以 root 启动，改好数据目录的归属后降成 wanmory（见 entrypoint.sh）；
# /data 先建好并改归属，挂载命名卷时会继承这个权限
RUN useradd --system --uid 1000 --create-home wanmory \
 && mkdir -p /data /photos && chown wanmory:wanmory /data /photos
COPY --from=build /out/wanmory /usr/local/bin/wanmory
COPY --chmod=755 server/entrypoint.sh /usr/local/bin/wanmory-entrypoint
# IP 地址库（ip2region，离线查 IP 大概在哪，登录日志用）：IPv4 约 11 MB、IPv6 约 37 MB，构建时下载最新的
ADD --chmod=644 https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data/ip2region_v4.xdb \
    https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data/ip2region_v6.xdb \
    /usr/share/wanmory/ipdb/

# /photos 是照片目录：把 NAS、移动硬盘上已有的照片挂载到它下面（可以挂多个、可以只读），相册定时扫描导入
ENV WANMORY_DATA_DIR=/data \
    WANMORY_LIBRARY_DIR=/photos \
    WANMORY_ADDR=:8080
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD ["wanmory", "healthcheck"]
ENTRYPOINT ["wanmory-entrypoint"]
