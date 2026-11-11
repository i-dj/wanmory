.PHONY: dev build server run run-docker purge ml ml-run web web-dev live ipdb

DEV_DATABASE_URL ?= postgres://wanmory:wanmory_dev_pw@127.0.0.1:5432/wanmory

dev:
	docker compose -f docker/docker-compose.dev.yml up

# 打包前端并嵌进后端，编译出一个程序
build: web server

server:
	cd server && go build -o bin/wanmory ./cmd/wanmory

# 本机运行后端，连开发数据库，启动时自动执行迁移；上传的照片和缩略图默认放在项目下的 data/，
# 设置页里可以浏览 data/ 和你的主目录。内置 AI 服务是 Docker 里的 ml 容器（开发时开在 127.0.0.1:3103）
run:
	cd server && DATABASE_URL=$(DEV_DATABASE_URL) WANMORY_DATA_DIR=$(CURDIR)/data \
		WANMORY_STORAGE_ROOTS=$(CURDIR)/data:$(HOME) WANMORY_ML_URL=http://127.0.0.1:3103 go run ./cmd/wanmory

# 删除所有上传的照片、缩略图、任务和语义向量（设置保留），会先让你输入 yes 确认
purge:
	cd server && DATABASE_URL=$(DEV_DATABASE_URL) WANMORY_DATA_DIR=$(CURDIR)/data go run ./cmd/wanmory purge

# 在容器里运行后端，本机只需要 Docker
run-docker:
	docker compose -f docker/docker-compose.dev.yml --profile server up --build server

# 装 AI 服务要用的包。--extra torch 是 PyTorch：这台电脑有显卡（Apple 芯片、NVIDIA）时语义搜索用它跑，快很多；
# Docker 镜像里不装，只用 ONNX 版（见 ml/scripts/export_clip_onnx.py）
ml:
	cd ml && uv sync --extra torch

# 单独运行 AI 服务（3003 端口），也就是设置里的「远程」：在这台电脑或另一台电脑上直接跑 Python。
# Mac 上这样才用得上显卡（CoreML、MPS），Docker 里的内置 AI 服务只能用 CPU；第一次会下载人脸模型（约 340 MB）
ml-run:
	cd ml && WANMORY_FACE_MODEL_PRELOAD=1 uv run --extra torch python -m wanmory_ml

# 下载 IP 地址库（ip2region，登录日志里按 IP 显示大概在哪）到 data/ipdb，已经有了就跳过。Docker 镜像里自带，不用这一步
IPDB_URL := https://raw.githubusercontent.com/lionsoul2014/ip2region/master/data
ipdb:
	@mkdir -p data/ipdb
	@for f in ip2region_v4.xdb ip2region_v6.xdb; do \
		[ -s data/ipdb/$$f ] || { echo "下载 $$f…"; curl -fSL --progress-bar -o data/ipdb/$$f.tmp $(IPDB_URL)/$$f && mv data/ipdb/$$f.tmp data/ipdb/$$f; }; \
	done

# 打包前端，复制到后端的 webui/dist，下次编译后端时嵌进程序
web:
	cd web && npm install && npm run build
	find server/internal/webui/dist -mindepth 1 ! -name .gitkeep -delete
	cp -R web/dist/. server/internal/webui/dist/

# 改前端时用的开发服务器（5173），改完页面自动刷新；/api 转发给 make run 启动的后端
web-dev:
	cd web && npm run dev

# 一个命令把开发要用的都启动：数据库和内置 AI 服务（Docker，已经在跑就跳过）、后端（make run）、
# 单独启动的 AI 服务（make ml-run，设置里选「远程」、填 http://127.0.0.1:3003 时用它）、前端开发服务器（make web-dev）。
# 打开 http://localhost:5173，改前端保存后页面马上更新。
# 每行输出前面标着是谁的（[server] [ai] [web]），Ctrl+C 全部一起停（数据库和 Docker 里的 AI 服务留着）
live: ipdb
	@docker compose -f docker/docker-compose.dev.yml up -d --wait postgres
	@docker compose -f docker/docker-compose.dev.yml up -d ml
	@trap 'kill 0' INT TERM EXIT; \
	$(MAKE) --no-print-directory run 2>&1 | awk '{ print "[server] " $$0; fflush() }' & \
	$(MAKE) --no-print-directory ml-run 2>&1 | awk '{ print "[ai]     " $$0; fflush() }' & \
	$(MAKE) --no-print-directory web-dev 2>&1 | awk '{ print "[web]    " $$0; fflush() }' & \
	wait
