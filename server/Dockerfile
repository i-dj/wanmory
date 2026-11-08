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
# libimage-exiftool-perl：exiftool；ffmpeg：视频截帧；tzdata：照片没有时区时按 TZ 解释
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      libvips-tools libheif-plugin-libde265 libimage-exiftool-perl ffmpeg tzdata ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# 不用 root 运行；/data 先建好并改归属，挂载命名卷时会继承这个权限
RUN useradd --system --uid 1000 --create-home wanmory \
 && mkdir -p /data && chown wanmory:wanmory /data
COPY --from=build /out/wanmory /usr/local/bin/wanmory

USER wanmory
ENV WANMORY_DATA_DIR=/data \
    WANMORY_ADDR=:8080
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD ["wanmory", "healthcheck"]
ENTRYPOINT ["wanmory"]
