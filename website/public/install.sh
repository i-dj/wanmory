#!/usr/bin/env bash
# Wanmory installer
#
#   curl -fsSL https://wanmory.com/install.sh | bash
#   or download and run: bash install.sh [-y] [--dir DIR] [--dry-run]
#
# Steps: check the system (64-bit, Docker, Docker Compose, memory, disk) -> ask for port, LAN domain,
# database password and location, time zone, data/model directories, existing photo folders (any number)
# -> write .env (and docker-compose.override.yml for photo folders) -> download docker-compose.yml -> pull and start.
#
# Options:
#   -y, --yes       Non-interactive: accept all defaults (database password is generated)
#   --dir DIR       Install directory (default: ~/wanmory)
#   --dry-run       Check the system and write config files only; do not pull images or start
# Environment variables (also honoured with -y): WANMORY_PORT, WANMORY_DOMAIN, WANMORY_DB_PASSWORD, WANMORY_DB_DIR,
#   WANMORY_TZ, WANMORY_DATA_DIR, WANMORY_MODELS_DIR, WANMORY_PHOTOS (comma-separated; read-only unless suffixed :rw),
#   WANMORY_REGISTRY, WANMORY_VERSION

set -euo pipefail

# Everything lives in main() and is only invoked on the last line. With `curl | bash`, bash executes the script
# while it is still downloading; this makes it read the whole file first, so a dropped connection never runs half a script.
main() {
# No command below may read standard input: with `curl | bash` stdin *is* the script.
# All prompts read from /dev/tty instead.
exec </dev/null

COMPOSE_URLS=(
  "https://raw.githubusercontent.com/i-dj/wanmory/main/docker/docker-compose.yml"
  "https://gitee.com/i-dj/wanmory/raw/main/docker/docker-compose.yml"
)

# ---------- output ----------
if [ -t 1 ]; then
  C_RESET=$'\033[0m' C_BOLD=$'\033[1m' C_DIM=$'\033[2m' C_RED=$'\033[31m' C_GREEN=$'\033[32m' C_YELLOW=$'\033[33m' C_ORANGE=$'\033[38;5;216m'
else
  C_RESET='' C_BOLD='' C_DIM='' C_RED='' C_GREEN='' C_YELLOW='' C_ORANGE=''
fi
step() { printf '\n%s==>%s %s%s%s\n' "$C_ORANGE" "$C_RESET" "$C_BOLD" "$*" "$C_RESET"; }
ok() { printf '  %s✔%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
warn() { printf '  %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$*"; }
fail() {
  printf '  %s✘ %s%s\n' "$C_RED" "$*" "$C_RESET" >&2
  exit 1
}

# ---------- arguments ----------
ASSUME_YES=0
DRY_RUN=0
INSTALL_DIR="${WANMORY_DIR:-$HOME/wanmory}"
while [ $# -gt 0 ]; do
  case "$1" in
    -y | --yes) ASSUME_YES=1 ;;
    --dry-run) DRY_RUN=1 ;;
    --dir)
      INSTALL_DIR="${2:?--dir requires a directory}"
      shift
      ;;
    -h | --help)
      sed -n '2,17p' "$0" 2>/dev/null | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) fail "Unknown option: $1 (see --help)" ;;
  esac
  shift
done

TTY=/dev/tty
if [ "$ASSUME_YES" = 0 ] && ! { [ -r "$TTY" ] && : <"$TTY"; } 2>/dev/null; then
  warn "No interactive terminal available; using defaults"
  ASSUME_YES=1
fi

trim() { printf '%s' "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'; }

# ask VAR PROMPT DEFAULT: read one line; Enter keeps the default
ask() {
  local __var=$1 __prompt=$2 __def=$3 __in=''
  if [ "$ASSUME_YES" = 1 ]; then
    printf -v "$__var" '%s' "$__def"
    return
  fi
  printf '  %s %s[%s]%s: ' "$__prompt" "$C_DIM" "$__def" "$C_RESET" >"$TTY"
  IFS= read -r __in <"$TTY" || true
  printf -v "$__var" '%s' "${__in:-$__def}"
}

# confirm PROMPT DEFAULT(y|n): returns 0 for yes
confirm() {
  local __prompt=$1 __def=$2 __in=''
  if [ "$ASSUME_YES" = 1 ]; then
    [ "$__def" = y ]
    return
  fi
  local hint='[Y/n]'
  [ "$__def" = n ] && hint='[y/N]'
  printf '  %s %s%s%s: ' "$__prompt" "$C_DIM" "$hint" "$C_RESET" >"$TTY"
  IFS= read -r __in <"$TTY" || true
  __in=${__in:-$__def}
  case "$__in" in [Yy]*) return 0 ;; *) return 1 ;; esac
}

# Resolve a path relative to the install directory (for creating directories)
abs_path() {
  local d=${1/#\~/$HOME}
  case "$d" in /*) printf '%s' "$d" ;; *) printf '%s/%s' "$INSTALL_DIR" "${d#./}" ;; esac
}

# Time zone names known to this system (from tzdata); empty when tzdata is not installed
tz_list() {
  local z=/usr/share/zoneinfo
  {
    if [ -r "$z/zone1970.tab" ]; then
      awk '!/^#/ {print $3}' "$z/zone1970.tab"
    elif [ -r "$z/zone.tab" ]; then
      awk '!/^#/ {print $3}' "$z/zone.tab"
    elif [ -d "$z" ]; then
      (cd "$z" && find Africa America Antarctica Arctic Asia Atlantic Australia Europe Indian Pacific -type f 2>/dev/null)
    fi
    [ -d "$z" ] && echo UTC
  } | sort -u
}

# tz_valid NAME: the name is a real IANA zone (case-insensitive). Without tzdata, accept anything shaped like Area/City
tz_valid() {
  local n=$1
  [ -n "$n" ] || return 1
  if [ -d /usr/share/zoneinfo ]; then
    tz_list | grep -qix -- "$n"
  else
    [[ "$n" =~ ^[A-Za-z]+(/[A-Za-z0-9_+-]+)+$ || "$n" = UTC ]]
  fi
}

# Common names that are not part of the zone name itself
tz_alias() {
  case "$(printf '%s' "$1" | tr 'A-Z' 'a-z' | tr -d ' _-')" in
    beijing | china | cn | prc | 北京 | 中国 | 上海) echo Asia/Shanghai ;;
    hongkong | hk | 香港) echo Asia/Hong_Kong ;;
    taiwan | tw | 台北 | 台湾) echo Asia/Taipei ;;
    japan | jp | 东京 | 日本) echo Asia/Tokyo ;;
    korea | kr | 首尔 | 韩国) echo Asia/Seoul ;;
    sg | 新加坡) echo Asia/Singapore ;;
    uk | britain | england | 伦敦 | 英国) echo Europe/London ;;
    germany | de | 德国) echo Europe/Berlin ;;
    france | fr | 法国) echo Europe/Paris ;;
    ny | nyc | est | edt | eastern | 纽约) echo America/New_York ;;
    la | sf | sanfrancisco | pst | pdt | pacific | 洛杉矶 | 旧金山) echo America/Los_Angeles ;;
    cst | central | chicago) echo America/Chicago ;;
    australia | au | 悉尼 | 澳大利亚) echo Australia/Sydney ;;
    utc | gmt | z) echo UTC ;;
  esac
}

printf '\n%sWanmory%s · open-source private AI photo library · installer\n' "$C_BOLD" "$C_RESET"

# ---------- 1. system check ----------
step "Checking system"

OS=$(uname -s)
case "$OS" in
  Linux) ok "OS: Linux" ;;
  Darwin) warn "OS: macOS (AI in containers cannot use the Apple GPU; for speed, run the AI service natively, see the docs)" ;;
  *) fail "Unsupported OS: $OS (Linux or macOS required)" ;;
esac

ARCH=$(uname -m)
case "$ARCH" in
  x86_64 | amd64) ARCH_NAME=amd64 ;;
  aarch64 | arm64) ARCH_NAME=arm64 ;;
  *) fail "Unsupported CPU architecture: $ARCH. Images are published for 64-bit amd64 and arm64 only; please install a 64-bit OS" ;;
esac
# A 64-bit kernel with a 32-bit userland (common on older Raspberry Pi OS) cannot run the images either
if [ "$OS" = Linux ] && command -v getconf >/dev/null 2>&1 && [ "$(getconf LONG_BIT)" != 64 ]; then
  fail "32-bit userland detected (getconf LONG_BIT = $(getconf LONG_BIT)); please install a 64-bit OS"
fi
ok "CPU: $ARCH (linux/$ARCH_NAME images)"

command -v docker >/dev/null 2>&1 || fail "Docker not found. Install it first: https://docs.docker.com/engine/install/ (Synology / QNAP: install Container Manager / Container Station from the package center)"
if ! docker info >/dev/null 2>&1; then
  if docker info 2>&1 | grep -qi 'permission denied'; then
    fail "Permission denied talking to Docker. Re-run with sudo, or add your user to the docker group: sudo usermod -aG docker \$USER (then log in again)"
  fi
  fail "Docker is not running. Start it first (Linux: sudo systemctl start docker)"
fi
ok "Docker $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo '')"

if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
  ok "Docker Compose $(docker compose version --short 2>/dev/null || echo v2)"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
  warn "Using legacy docker-compose (v1); upgrading to Docker Compose v2 is recommended"
else
  fail "Docker Compose not found. Install Docker Compose v2: https://docs.docker.com/compose/install/"
fi

if command -v curl >/dev/null 2>&1; then
  fetch() { curl -fsSL --connect-timeout 10 "$1" -o "$2"; }
elif command -v wget >/dev/null 2>&1; then
  fetch() { wget -q -T 10 "$1" -O "$2"; }
else
  fail "curl or wget is required to download configuration files"
fi

# Memory: below ~6 GB the AI service picks the lite model tier automatically
MEM_MB=0
if [ -r /proc/meminfo ]; then
  MEM_MB=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
elif [ "$OS" = Darwin ]; then
  MEM_MB=$(($(sysctl -n hw.memsize) / 1024 / 1024))
fi
if [ "$MEM_MB" -gt 0 ]; then
  if [ "$MEM_MB" -lt 2048 ]; then
    warn "Memory: ${MEM_MB} MB. Below 2 GB, AI recognition may not run"
  elif [ "$MEM_MB" -lt 4096 ]; then
    warn "Memory: ${MEM_MB} MB. AI will use the lite model tier"
  else
    ok "Memory: $((MEM_MB / 1024)) GB"
  fi
fi

# ---------- 2. configuration ----------
step "Configuration"

ask INSTALL_DIR "Install directory" "$INSTALL_DIR"
INSTALL_DIR=${INSTALL_DIR/#\~/$HOME}
mkdir -p "$INSTALL_DIR"
INSTALL_DIR=$(cd "$INSTALL_DIR" && pwd)

# Disk: models take 1-4 GB, plus thumbnails
FREE_GB=$(df -Pk "$INSTALL_DIR" | awk 'NR==2 {print int($4/1024/1024)}')
if [ "${FREE_GB:-0}" -lt 10 ]; then
  warn "Only ${FREE_GB} GB free on the install disk; models and thumbnails need at least 10 GB"
else
  ok "Disk: ${FREE_GB} GB free"
fi

REUSE_ENV=0
if [ -f "$INSTALL_DIR/.env" ]; then
  warn "Found an existing .env (previous installation)"
  if confirm "Keep the existing configuration (changing the database password would lock you out of the existing database)" y; then
    REUSE_ENV=1
  fi
fi

port_in_use() {
  local p=$1
  if command -v ss >/dev/null 2>&1; then
    ss -ltnH 2>/dev/null | awk '{print $4}' | grep -Eq "[:.]$p\$"
  elif command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1
  elif command -v netstat >/dev/null 2>&1; then
    netstat -an 2>/dev/null | grep -E 'LISTEN' | grep -Eq "[:.]$p[[:space:]]"
  else
    return 1
  fi
}

if [ "$REUSE_ENV" = 1 ]; then
  # shellcheck disable=SC1091
  set -a && . "$INSTALL_DIR/.env" && set +a
  PORT=${WANMORY_PORT:-8080}
  DOMAIN=${WANMORY_DOMAIN:-wanmory.local}
  ok "Keeping existing configuration: port $PORT, domain $DOMAIN"
else
  # Port
  while :; do
    ask PORT "Web port" "${WANMORY_PORT:-8080}"
    if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
      warn "The port must be a number between 1 and 65535"
    elif port_in_use "$PORT"; then
      warn "Port $PORT is already in use; choose another one"
      [ "$ASSUME_YES" = 1 ] && fail "Port $PORT is in use; re-run with WANMORY_PORT=<other port>"
    else
      break
    fi
    [ "$ASSUME_YES" = 1 ] && fail "Invalid port: $PORT"
  done

  # LAN domain (announced via mDNS)
  while :; do
    ask DOMAIN "LAN domain (must end in .local)" "${WANMORY_DOMAIN:-wanmory.local}"
    DOMAIN=$(printf '%s' "$DOMAIN" | tr 'A-Z' 'a-z')
    if [[ "$DOMAIN" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.local$ ]]; then
      break
    fi
    warn "The domain must end in .local and contain only letters, digits and hyphens, e.g. wanmory.local or photos.local"
    [ "$ASSUME_YES" = 1 ] && fail "Invalid domain: $DOMAIN"
  done

  # Database password
  random_password() {
    if command -v openssl >/dev/null 2>&1; then
      openssl rand -hex 16
    else
      LC_ALL=C tr -dc 'a-zA-Z0-9' </dev/urandom | head -c 32
    fi
  }
  if [ -n "${WANMORY_DB_PASSWORD:-}" ]; then
    DB_PASSWORD=$WANMORY_DB_PASSWORD
    ok "Database password: taken from WANMORY_DB_PASSWORD"
  elif confirm "Generate a random database password (recommended)" y; then
    DB_PASSWORD=$(random_password)
    ok "Random database password generated (stored in .env)"
  else
    while :; do
      printf '  Database password (min. 8 characters, hidden): ' >"$TTY"
      IFS= read -rs DB_PASSWORD <"$TTY" || true
      printf '\n  Repeat password: ' >"$TTY"
      IFS= read -rs P2 <"$TTY" || true
      printf '\n' >"$TTY"
      if [ "${#DB_PASSWORD}" -lt 8 ]; then
        warn "The password must be at least 8 characters"
      elif [ "$DB_PASSWORD" != "$P2" ]; then
        warn "The passwords do not match"
      elif [[ "$DB_PASSWORD" =~ [[:space:]\'\"\$\\@:/#?] ]]; then
        warn "Avoid spaces, quotes and the characters \$ \\ @ : / # ? (they break the database connection URL)"
      else
        break
      fi
    done
  fi

  # Database location: the Docker volume pgdata by default, or a directory on local disk
  while :; do
    ask DB_DIR "Database location (leave empty for the Docker volume pgdata, recommended)" "${WANMORY_DB_DIR:-}"
    DB_DIR=$(trim "$DB_DIR")
    [ "$DB_DIR" = pgdata ] && DB_DIR=''
    if [ -z "$DB_DIR" ]; then
      ok "Database: Docker volume pgdata"
      break
    fi
    DB_DIR=${DB_DIR/#\~/$HOME}
    if [[ "$DB_DIR" != /* && "$DB_DIR" != ./* && "$DB_DIR" != ../* ]]; then
      warn "Enter a path starting with / or ./, or leave empty to use the Docker volume"
      [ "$ASSUME_YES" = 1 ] && fail "Invalid database location: $DB_DIR"
      continue
    fi
    if [ -d "$(abs_path "$DB_DIR")" ] && [ -n "$(ls -A "$(abs_path "$DB_DIR")" 2>/dev/null)" ] && [ ! -f "$(abs_path "$DB_DIR")/PG_VERSION" ]; then
      warn "$DB_DIR is not empty and is not a PostgreSQL data directory; PostgreSQL may refuse to start"
    fi
    warn "Keep the database on a local disk; network shares (SMB / NFS) can corrupt it"
    ok "Database: $DB_DIR"
    break
  done

  # Time zone used for photos whose EXIF has no time zone. Type a city, country or part of a zone name;
  # one match is taken directly, several are listed with numbers to pick from
  DEFAULT_TZ=${WANMORY_TZ:-}
  if [ -z "$DEFAULT_TZ" ]; then
    if [ -r /etc/timezone ]; then
      DEFAULT_TZ=$(cat /etc/timezone)
    elif [ -L /etc/localtime ]; then
      DEFAULT_TZ=$(readlink /etc/localtime | sed 's|.*/zoneinfo/||')
    fi
  fi
  # A detected zone that is not valid falls back to Asia/Shanghai; WANMORY_TZ is resolved (or rejected) below
  [ -n "${WANMORY_TZ:-}" ] || tz_valid "${DEFAULT_TZ:-}" || DEFAULT_TZ=Asia/Shanghai
  TZ_IN=''
  while :; do
    if [ -z "$TZ_IN" ]; then
      ask TZ_IN "Time zone (type a city or region to search, e.g. shanghai, tokyo, london)" "$DEFAULT_TZ"
    fi
    q=$(trim "$TZ_IN")
    TZ_IN=''
    if tz_valid "$q"; then
      TZ_NAME=$(tz_list | grep -ix -- "$q" | head -1)
      TZ_NAME=${TZ_NAME:-$q}
      break
    fi
    alias=$(tz_alias "$q")
    if [ -n "$alias" ]; then
      TZ_NAME=$alias
      break
    fi
    key=$(printf '%s' "$q" | tr ' ' '_')
    matches=$(tz_list | grep -i -- "$key" || true)
    count=$(printf '%s' "$matches" | grep -c . || true)
    if [ "$count" -eq 1 ]; then
      TZ_NAME=$matches
      break
    fi
    [ "$ASSUME_YES" = 1 ] && fail "Unknown or ambiguous time zone: $q (use a full name such as Asia/Shanghai)"
    if [ "$count" -eq 0 ]; then
      warn "No time zone matches \"$q\". Try a city or region such as shanghai, hong_kong, tokyo, berlin, new_york, sydney, utc"
      continue
    fi
    printf '  %s%s time zones match \"%s\"%s\n' "$C_DIM" "$count" "$q" "$C_RESET" >"$TTY"
    printf '%s\n' "$matches" | head -15 | awk '{printf "    %2d) %s\n", NR, $0}' >"$TTY"
    [ "$count" -gt 15 ] && printf '    %s… narrow the search to see more%s\n' "$C_DIM" "$C_RESET" >"$TTY"
    ask pick "Choose a number, or type another search" "1"
    if [[ "$pick" =~ ^[0-9]+$ ]] && [ "$pick" -ge 1 ] && [ "$pick" -le "$count" ] && [ "$pick" -le 15 ]; then
      TZ_NAME=$(printf '%s\n' "$matches" | sed -n "${pick}p")
      break
    fi
    TZ_IN=$pick
  done
  ok "Time zone: $TZ_NAME"

  # Storage; relative paths are relative to the install directory
  ask DATA_DIR "Data directory (thumbnails, previews and uploaded photos)" "${WANMORY_DATA_DIR:-./data}"
  ask MODELS_DIR "AI model directory (1-4 GB)" "${WANMORY_MODELS_DIR:-./models}"

  for d in "$DATA_DIR" "$MODELS_DIR" ${DB_DIR:+"$DB_DIR"}; do
    mkdir -p "$(abs_path "$d")" 2>/dev/null || warn "Cannot create $(abs_path "$d") (check the path and permissions)"
  done
fi

# Existing photo folders: mounted under /photos via docker-compose.override.yml (merged automatically by Docker Compose).
# Each entry is "path|ro" or "path|rw". ro = read-only (recommended); rw = deleting a photo permanently also deletes the file.
PHOTO_DIRS=()
if [ -n "${WANMORY_PHOTOS:-}" ]; then
  IFS=',' read -ra _ps <<<"$WANMORY_PHOTOS"
  for p in "${_ps[@]}"; do
    p=$(trim "$p")
    [ -z "$p" ] && continue
    mode=ro
    case "$p" in
      *:rw) mode=rw p=${p%:rw} ;;
      *:ro) p=${p%:ro} ;;
    esac
    PHOTO_DIRS+=("${p/#\~/$HOME}|$mode")
  done
fi
if [ "$ASSUME_YES" = 0 ] && [ ! -f "$INSTALL_DIR/docker-compose.override.yml" ] && confirm "Add existing photo folders from a NAS or external drive (no re-upload needed)" y; then
  while :; do
    ask p "Photo folder path" ""
    p=$(trim "$p")
    p=${p/#\~/$HOME}
    if [ -z "$p" ]; then
      warn "No path entered"
    elif [ ! -d "$p" ] && ! confirm "$p does not exist. Add it anyway" n; then
      :
    else
      if confirm "Mount read-only (recommended: Wanmory will never modify or delete the original files)" y; then
        mode=ro
        ok "Added (read-only): $p"
      else
        mode=rw
        ok "Added (read-write): $p"
        warn "Read-write: permanently deleting a photo in Wanmory also deletes the original file in this folder"
      fi
      PHOTO_DIRS+=("$p|$mode")
    fi
    confirm "Add another photo folder" n || break
  done
fi

# ---------- 3. write configuration ----------
step "Writing configuration"

if [ "$REUSE_ENV" = 0 ]; then
  umask 077
  {
    echo "# Wanmory configuration, generated by install.sh on $(date '+%Y-%m-%d %H:%M')"
    echo "# After editing, run 'docker compose up -d' in this directory. Do not change the database password after the first start."
    echo "WANMORY_PORT=$PORT"
    echo "WANMORY_DOMAIN=$DOMAIN"
    echo "WANMORY_DB_PASSWORD=$DB_PASSWORD"
    if [ -n "$DB_DIR" ]; then echo "WANMORY_DB_DIR=$DB_DIR"; else echo "# WANMORY_DB_DIR=        # unset: the database lives in the Docker volume pgdata"; fi
    echo "WANMORY_TZ=$TZ_NAME"
    echo "WANMORY_DATA_DIR=$DATA_DIR"
    echo "WANMORY_MODELS_DIR=$MODELS_DIR"
    [ -n "${WANMORY_VERSION:-}" ] && echo "WANMORY_VERSION=$WANMORY_VERSION"
    [ -n "${WANMORY_REGISTRY:-}" ] && echo "WANMORY_REGISTRY=$WANMORY_REGISTRY"
    true
  } >"$INSTALL_DIR/.env"
  umask 022
  ok "$INSTALL_DIR/.env (mode 600, readable by you only)"
fi

if [ "${#PHOTO_DIRS[@]}" -gt 0 ]; then
  {
    echo "# Existing photo folders, generated by install.sh. Mounted under /photos (:ro = read-only); scanned every 15 minutes"
    echo "services:"
    echo "  server:"
    echo "    volumes:"
    used=' '
    i=0
    for item in "${PHOTO_DIRS[@]}"; do
      d=${item%|*}
      mode=${item##*|}
      i=$((i + 1))
      # Sub-folder name inside the container: ASCII letters/digits of the folder name, else photos1, photos2, ...
      name=$(basename "$d" | LC_ALL=C tr -c 'a-zA-Z0-9_-' '_' | sed 's/^_*//;s/_*$//')
      case "$used" in *" $name "*) name='' ;; esac
      [ -z "$name" ] && name="photos$i"
      used="$used$name "
      echo "      - \"$d:/photos/$name:$mode\""
    done
  } >"$INSTALL_DIR/docker-compose.override.yml"
  ok "$INSTALL_DIR/docker-compose.override.yml (${#PHOTO_DIRS[@]} photo folder(s))"
fi

# Download the official compose file: GitHub first, then the Gitee mirror
TMP=$(mktemp)
GOT=0
for u in ${WANMORY_COMPOSE_URL:-} "${COMPOSE_URLS[@]}"; do
  if fetch "$u" "$TMP" 2>/dev/null && grep -q 'services:' "$TMP"; then
    GOT=1
    break
  fi
  warn "Download failed: $u"
done
[ "$GOT" = 1 ] || {
  rm -f "$TMP"
  fail "Could not download docker-compose.yml. Check your network, or download it manually into $INSTALL_DIR"
}
mv "$TMP" "$INSTALL_DIR/docker-compose.yml"
chmod 644 "$INSTALL_DIR/docker-compose.yml"
ok "$INSTALL_DIR/docker-compose.yml"

cd "$INSTALL_DIR"
"${COMPOSE[@]}" config -q || fail "Configuration check failed; review .env and docker-compose.override.yml"
ok "Configuration is valid"

# ---------- 4. start ----------
if [ "$DRY_RUN" = 1 ]; then
  step "Configuration written (--dry-run: nothing pulled or started)"
  printf '  To start, run in %s: %s up -d\n' "$INSTALL_DIR" "${COMPOSE[*]}"
  exit 0
fi

step "Pulling images and starting (a few minutes on first run)"
"${COMPOSE[@]}" pull
"${COMPOSE[@]}" up -d

printf '  Waiting for Wanmory to start'
READY=0
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null "http://127.0.0.1:$PORT/api/auth/state" 2>/dev/null; then
    READY=1
    break
  fi
  printf '.'
  sleep 2
done
printf '\n'
if [ "$READY" = 1 ]; then
  ok "Wanmory is running"
else
  warn "Wanmory is not responding yet. Try again in a moment, or check the logs: ${COMPOSE[*]} logs server"
fi

LAN_IP=''
if [ "$OS" = Linux ]; then
  LAN_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{for (i=1;i<NF;i++) if ($i=="src") print $(i+1)}' | head -1)
  [ -z "$LAN_IP" ] && LAN_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
else
  LAN_IP=$(ipconfig getifaddr en0 2>/dev/null || true)
fi

printf '\n%s✔ Installation complete%s\n\n' "$C_GREEN$C_BOLD" "$C_RESET"
printf '  LAN address    %shttp://%s:%s%s\n' "$C_BOLD" "$DOMAIN" "$PORT" "$C_RESET"
[ -n "$LAN_IP" ] && printf '  IP address     http://%s:%s\n' "$LAN_IP" "$PORT"
printf '  Install dir    %s\n\n' "$INSTALL_DIR"
printf '  Next: open the page, create the admin account, then download the models in Settings > AI (系统设置 → AI 设置).\n'
printf '  %sSome Android devices cannot resolve .local names; use the IP address. Docs: https://wanmory.com/docs/%s\n\n' "$C_DIM" "$C_RESET"
}

main "$@"
