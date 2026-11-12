#!/bin/sh
# 容器的入口：保证相册程序一定能往数据目录里写，再启动它。
# 宿主机上挂进来的数据目录常常不归容器里的 wanmory（uid 1000）：用 sudo 跑了安装脚本时归 root，
# 树莓派等机器上的用户也不一定是 1000。不处理的话相册建不了 /data/upload，一启动就退出、反复重启。
#
# 以 root 启动时（默认）：
#   1. 把数据目录里不归 1000 的文件改成归 wanmory；
#   2. 试着以 wanmory 写一个文件，写得进就降成 wanmory 运行；
#   3. 还是写不进（U 盘的 exFAT/NTFS、SMB 网络共享这类改不了归属的文件系统），就以 root 运行，保证能用。
# 只处理数据目录，不碰 /photos 下挂进来的照片。compose 里自己指定了 user（不是 root）时直接运行。
set -e

if [ "$(id -u)" != 0 ]; then
  exec wanmory "$@"
fi

data="${WANMORY_DATA_DIR:-/data}"
mkdir -p "$data"
if [ -n "$(find "$data" ! -user 1000 -print -quit 2>/dev/null)" ]; then
  echo "wanmory: changing owner of $data to wanmory (1000:1000)" >&2
  find "$data" ! -user 1000 -exec chown wanmory:wanmory {} + 2>/dev/null || true
fi

as_wanmory() { setpriv --reuid=wanmory --regid=wanmory --init-groups "$@"; }

probe="$data/.wanmory-write-test"
if as_wanmory sh -c 'touch "$1" && rm -f "$1"' sh "$probe" 2>/dev/null; then
  exec setpriv --reuid=wanmory --regid=wanmory --init-groups wanmory "$@"
fi

echo "wanmory: $data is not writable by uid 1000 (its file system does not support changing owners); running as root" >&2
exec wanmory "$@"
