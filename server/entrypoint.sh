#!/bin/sh
# 容器的入口：保证相册程序能往数据目录里写，而且写出来的文件宿主机上的用户删得掉，再启动它。
#
# 以 root 启动时（默认）：
#   1. 看数据目录归谁：宿主机上普通用户建的（安装脚本就是这样建的），相册就以那个用户（同样的 uid、gid）运行，
#      上传的照片、缩略图都归他，宿主机上不用 sudo 就能管理、删除；
#      目录归 root（用 sudo 装的）或者是 Docker 的数据卷，就用镜像里的 wanmory（uid 1000）。
#   2. 数据目录里归属不对的文件（以前的版本留下的）改成归这个用户；
#   3. 以这个用户试写一个文件，写得进就降成这个用户运行；
#   4. 还是写不进（U 盘的 exFAT/NTFS、SMB 网络共享这类改不了归属的文件系统），就以 root 运行，保证能用。
# 只处理数据目录，不碰 /photos 下挂进来的照片。compose 里自己指定了 user（不是 root）时直接运行。
set -e

if [ "$(id -u)" != 0 ]; then
  exec wanmory "$@"
fi

data="${WANMORY_DATA_DIR:-/data}"
mkdir -p "$data"

uid=$(stat -c %u "$data")
gid=$(stat -c %g "$data")
if [ "$uid" = 0 ]; then
  uid=$(id -u wanmory)
  gid=$(id -g wanmory)
fi

if [ -n "$(find "$data" ! -user "$uid" -print -quit 2>/dev/null)" ]; then
  echo "wanmory: changing owner of files in $data to $uid:$gid" >&2
  find "$data" ! -user "$uid" -exec chown "$uid:$gid" {} + 2>/dev/null || true
fi

# 镜像里的 wanmory 有自己的家目录；别的 uid 没有，用 /tmp（exiftool、ffmpeg 偶尔要写缓存）
[ "$uid" = "$(id -u wanmory)" ] || export HOME=/tmp

as_owner() { setpriv --reuid="$uid" --regid="$gid" --clear-groups "$@"; }

probe="$data/.wanmory-write-test"
if as_owner sh -c 'touch "$1" && rm -f "$1"' sh "$probe" 2>/dev/null; then
  exec setpriv --reuid="$uid" --regid="$gid" --clear-groups wanmory "$@"
fi

echo "wanmory: $data is not writable by uid $uid (its file system does not support changing owners); running as root" >&2
exec wanmory "$@"
