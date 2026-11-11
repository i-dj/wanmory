#!/usr/bin/env bash
# Wanmory uninstaller
#
#   curl -fsSL https://wanmory.com/uninstall.sh | bash
#   or download and run: bash uninstall.sh [--dir DIR] [-y] [--purge] [--dry-run]
#
# Stops and removes the Wanmory containers, then asks item by item what else to delete:
# database, data directory (thumbnails and uploaded photos), AI models, Docker images, configuration files.
# Existing photo folders mounted from a NAS or external drive are NEVER touched.
#
# Options:
#   --dir DIR    Install directory (default: ~/wanmory)
#   -y, --yes    Non-interactive: remove the containers only, keep all data
#   --purge      Non-interactive: remove everything listed above (except your photo folders)
#   --dry-run    Show what would be done without changing anything

set -euo pipefail

# Wrapped in main() so `curl | bash` reads the whole script before running it (see install.sh)
main() {
exec </dev/null

if [ -t 1 ]; then
  C_RESET=$'\033[0m' C_BOLD=$'\033[1m' C_DIM=$'\033[2m' C_RED=$'\033[31m' C_GREEN=$'\033[32m' C_YELLOW=$'\033[33m' C_ORANGE=$'\033[38;5;216m'
else
  C_RESET='' C_BOLD='' C_DIM='' C_RED='' C_GREEN='' C_YELLOW='' C_ORANGE=''
fi
step() { printf '\n%s==>%s %s%s%s\n' "$C_ORANGE" "$C_RESET" "$C_BOLD" "$*" "$C_RESET"; }
ok() { printf '  %s✔%s %s\n' "$C_GREEN" "$C_RESET" "$*"; }
info() { printf '  %s•%s %s\n' "$C_DIM" "$C_RESET" "$*"; }
warn() { printf '  %s!%s %s\n' "$C_YELLOW" "$C_RESET" "$*"; }
fail() {
  printf '  %s✘ %s%s\n' "$C_RED" "$*" "$C_RESET" >&2
  exit 1
}

MODE=ask # ask | keep (-y) | purge (--purge)
DRY_RUN=0
INSTALL_DIR="${WANMORY_DIR:-$HOME/wanmory}"
DIR_GIVEN=0
while [ $# -gt 0 ]; do
  case "$1" in
    -y | --yes) MODE=keep ;;
    --purge) MODE=purge ;;
    --dry-run) DRY_RUN=1 ;;
    --dir)
      INSTALL_DIR="${2:?--dir requires a directory}"
      DIR_GIVEN=1
      shift
      ;;
    -h | --help)
      sed -n '2,16p' "$0" 2>/dev/null | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *) fail "Unknown option: $1 (see --help)" ;;
  esac
  shift
done

TTY=/dev/tty
if [ "$MODE" = ask ] && ! { [ -r "$TTY" ] && : <"$TTY"; } 2>/dev/null; then
  warn "No interactive terminal available; removing containers only and keeping all data (use --purge to remove everything)"
  MODE=keep
fi

ask() {
  local __var=$1 __prompt=$2 __def=$3 __in=''
  printf '  %s %s[%s]%s: ' "$__prompt" "$C_DIM" "$__def" "$C_RESET" >"$TTY"
  IFS= read -r __in <"$TTY" || true
  printf -v "$__var" '%s' "${__in:-$__def}"
}

# choose PROMPT: interactive y/N (default No); -y answers No, --purge answers Yes
choose() {
  local __in=''
  case "$MODE" in
    keep) return 1 ;;
    purge) return 0 ;;
  esac
  printf '  %s %s[y/N]%s: ' "$1" "$C_DIM" "$C_RESET" >"$TTY"
  IFS= read -r __in <"$TTY" || true
  case "$__in" in [Yy]*) return 0 ;; *) return 1 ;; esac
}

# Refuse to delete paths that are obviously not Wanmory's
safe_to_delete() {
  local p=$1
  case "$p" in
    '' | / | /bin | /boot | /dev | /etc | /home | /lib | /opt | /proc | /root | /sbin | /srv | /sys | /tmp | /usr | /var | /volume1 | /volume2 | /mnt | /media | /Users)
      return 1
      ;;
  esac
  [ "$p" != "$HOME" ] && [ "$p" != "${HOME%/}/" ]
}

abs_path() {
  local d=${1/#\~/$HOME}
  case "$d" in /*) printf '%s' "$d" ;; *) printf '%s/%s' "$INSTALL_DIR" "${d#./}" ;; esac
}

size_of() { du -sh "$1" 2>/dev/null | awk '{print $1}'; }

run() {
  if [ "$DRY_RUN" = 1 ]; then
    printf '  %s[dry-run]%s %s\n' "$C_DIM" "$C_RESET" "$*"
  else
    "$@"
  fi
}

printf '\n%sWanmory%s · uninstaller\n' "$C_BOLD" "$C_RESET"

# ---------- locate the installation ----------
step "Locating installation"
if [ "$MODE" = ask ] && [ "$DIR_GIVEN" = 0 ]; then
  ask INSTALL_DIR "Install directory" "$INSTALL_DIR"
fi
INSTALL_DIR=${INSTALL_DIR/#\~/$HOME}
[ -d "$INSTALL_DIR" ] || fail "$INSTALL_DIR does not exist"
INSTALL_DIR=$(cd "$INSTALL_DIR" && pwd)
[ -f "$INSTALL_DIR/docker-compose.yml" ] || fail "No docker-compose.yml in $INSTALL_DIR; is this a Wanmory installation?"
grep -q 'wanmory' "$INSTALL_DIR/docker-compose.yml" || fail "$INSTALL_DIR/docker-compose.yml does not look like a Wanmory compose file"
ok "$INSTALL_DIR"

command -v docker >/dev/null 2>&1 || fail "Docker not found"
if docker compose version >/dev/null 2>&1; then
  COMPOSE=(docker compose)
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE=(docker-compose)
else
  fail "Docker Compose not found"
fi
docker info >/dev/null 2>&1 || fail "Cannot talk to Docker (is it running? do you need sudo?)"

# Read the configuration to find out where things are stored
WANMORY_DATA_DIR='' WANMORY_MODELS_DIR='' WANMORY_DB_DIR=''
if [ -f "$INSTALL_DIR/.env" ]; then
  # shellcheck disable=SC1091
  set -a && . "$INSTALL_DIR/.env" && set +a
fi
DATA_DIR=$(abs_path "${WANMORY_DATA_DIR:-./data}")
MODELS_DIR=$(abs_path "${WANMORY_MODELS_DIR:-./models}")
DB_DIR=''
[ -n "${WANMORY_DB_DIR:-}" ] && DB_DIR=$(abs_path "$WANMORY_DB_DIR")

cd "$INSTALL_DIR"
PROJECT=$("${COMPOSE[@]}" config --format json 2>/dev/null | tr ',' '\n' | sed -n 's/^{*"name": *"\([^"]*\)".*/\1/p' | head -1)
PROJECT=${PROJECT:-$(basename "$INSTALL_DIR" | tr 'A-Z' 'a-z')}
DB_VOLUME="${PROJECT}_pgdata"

info "Containers:   $("${COMPOSE[@]}" ps -a -q 2>/dev/null | grep -c . || true) (project \"$PROJECT\")"
if [ -n "$DB_DIR" ]; then
  info "Database:     $DB_DIR ($(size_of "$DB_DIR" || echo '?'))"
elif docker volume inspect "$DB_VOLUME" >/dev/null 2>&1; then
  info "Database:     Docker volume $DB_VOLUME"
else
  info "Database:     Docker volume $DB_VOLUME (not found)"
fi
info "Data:         $DATA_DIR ($([ -d "$DATA_DIR" ] && size_of "$DATA_DIR" || echo 'not found'))"
info "AI models:    $MODELS_DIR ($([ -d "$MODELS_DIR" ] && size_of "$MODELS_DIR" || echo 'not found'))"
if [ -f "$INSTALL_DIR/docker-compose.override.yml" ]; then
  while IFS= read -r line; do
    src=$(printf '%s' "$line" | sed -n 's/^ *- *"\{0,1\}\([^:"]*\):\/photos.*/\1/p')
    [ -n "$src" ] && info "Photo folder: $src ${C_GREEN}(never deleted)${C_RESET}"
  done <"$INSTALL_DIR/docker-compose.override.yml"
fi

# ---------- decide ----------
step "Choose what to remove"
info "Containers and the network are always removed."
DEL_DB=0 DEL_DATA=0 DEL_MODELS=0 DEL_IMAGES=0 DEL_CONFIG=0
if choose "Delete the database (people, albums, settings, AI results; cannot be undone)"; then DEL_DB=1; fi
if choose "Delete the data directory (thumbnails AND photos uploaded through the web page)"; then DEL_DATA=1; fi
if choose "Delete the AI models (can be downloaded again)"; then DEL_MODELS=1; fi
if choose "Remove the Docker images used by Wanmory, including postgres/pgvector (can be pulled again)"; then DEL_IMAGES=1; fi
if choose "Delete the configuration files (.env with the database password, docker-compose.yml)"; then DEL_CONFIG=1; fi

step "Summary"
ok "Remove containers and network"
[ "$DEL_DB" = 1 ] && warn "Delete database ${DB_DIR:-(volume $DB_VOLUME)}"
[ "$DEL_DATA" = 1 ] && warn "Delete data directory $DATA_DIR"
[ "$DEL_MODELS" = 1 ] && ok "Delete AI models $MODELS_DIR"
[ "$DEL_IMAGES" = 1 ] && ok "Remove Docker images"
[ "$DEL_CONFIG" = 1 ] && ok "Delete configuration files in $INSTALL_DIR"
[ "$DEL_DB$DEL_DATA$DEL_MODELS$DEL_CONFIG" = 0000 ] && info "All data and configuration are kept; reinstall any time with install.sh"
if [ "$DEL_CONFIG" = 1 ] && [ "$DEL_DB" = 0 ]; then
  warn "The database is kept but .env (with its password) will be deleted; note WANMORY_DB_PASSWORD now if you want to reuse the database"
fi

# Deleting the database or uploaded photos needs an explicit confirmation
if [ "$MODE" = ask ] && { [ "$DEL_DB" = 1 ] || [ "$DEL_DATA" = 1 ]; }; then
  printf '  %sThis permanently deletes data. Type DELETE to continue:%s ' "$C_RED" "$C_RESET" >"$TTY"
  IFS= read -r answer <"$TTY" || true
  [ "$answer" = DELETE ] || fail "Cancelled; nothing was changed"
elif [ "$MODE" = ask ]; then
  choose "Proceed" || fail "Cancelled; nothing was changed"
fi

# ---------- remove ----------
step "Removing"
DOWN=(down --remove-orphans)
[ "$DEL_DB" = 1 ] && [ -z "$DB_DIR" ] && DOWN+=(--volumes)
[ "$DEL_IMAGES" = 1 ] && DOWN+=(--rmi all)
run "${COMPOSE[@]}" "${DOWN[@]}"
ok "Containers removed"

remove_dir() {
  local label=$1 dir=$2
  if [ ! -e "$dir" ]; then
    info "$label: $dir not found"
  elif ! safe_to_delete "$dir"; then
    warn "$label: refusing to delete $dir; remove it manually if you are sure"
  else
    run rm -rf -- "$dir" || warn "$label: could not delete $dir (try with sudo)"
    ok "$label deleted: $dir"
  fi
}

if [ "$DEL_DB" = 1 ]; then
  if [ -n "$DB_DIR" ]; then
    remove_dir "Database" "$DB_DIR"
  elif docker volume inspect "$DB_VOLUME" >/dev/null 2>&1; then
    run docker volume rm "$DB_VOLUME" >/dev/null && ok "Database volume deleted: $DB_VOLUME"
  else
    ok "Database volume removed"
  fi
fi
[ "$DEL_DATA" = 1 ] && remove_dir "Data directory" "$DATA_DIR"
[ "$DEL_MODELS" = 1 ] && remove_dir "AI models" "$MODELS_DIR"
if [ "$DEL_CONFIG" = 1 ]; then
  for f in .env docker-compose.yml docker-compose.override.yml; do
    [ -f "$INSTALL_DIR/$f" ] && run rm -f -- "$INSTALL_DIR/$f"
  done
  ok "Configuration files deleted"
  # Remove the install directory itself when nothing else is left in it
  if [ "$DRY_RUN" = 0 ] && [ -z "$(ls -A "$INSTALL_DIR" 2>/dev/null)" ]; then
    cd /
    rmdir "$INSTALL_DIR" 2>/dev/null && ok "Removed empty directory $INSTALL_DIR"
  fi
fi

if [ "$DRY_RUN" = 1 ]; then
  printf '\n%sDry run finished; nothing was changed.%s\n\n' "$C_BOLD" "$C_RESET"
  exit 0
fi
printf '\n%s✔ Wanmory has been uninstalled%s\n' "$C_GREEN$C_BOLD" "$C_RESET"
if [ "$DEL_DB" = 0 ] && [ "$DEL_CONFIG" = 0 ]; then
  printf '  Data and configuration were kept; running install.sh again in %s brings everything back.\n' "$INSTALL_DIR"
fi
printf '  Your existing photo folders were not touched.\n\n'
}

main "$@"
