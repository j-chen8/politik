#!/usr/bin/env bash
# Sync politik.db zwischen Rechnern via Cloudflare R2.
#
# Usage:
#   ./scripts/sync-db.sh push     # lokale DB hochladen
#   ./scripts/sync-db.sh pull     # remote DB runterladen (lokal wird gebackupt)
#   ./scripts/sync-db.sh status   # Vergleich lokal vs. remote

set -euo pipefail

REMOTE="r2:politik-sync"
DB_FILE="politik.db"
DB_REMOTE_NAME="politik.db"

cd "$(dirname "$0")/.."

# ── Helpers ──

dev_server_running() {
  pgrep -f "next dev" > /dev/null 2>&1
}

check_no_dev_server() {
  if dev_server_running; then
    echo "❌ Dev-Server läuft (next dev). Stoppe ihn zuerst, sonst wird die DB inkonsistent gesynct."
    echo "   Tipp: pkill -f 'next dev'"
    exit 1
  fi
}

human_size() {
  numfmt --to=iec --suffix=B "$1" 2>/dev/null || {
    local b=$1
    if (( b >= 1073741824 )); then echo "$(( b / 1073741824 ))GiB"
    elif (( b >= 1048576 )); then echo "$(( b / 1048576 ))MiB"
    elif (( b >= 1024 )); then echo "$(( b / 1024 ))KiB"
    else echo "${b}B"
    fi
  }
}

file_size() {
  if stat -c %s "$1" 2>/dev/null; then return; fi
  stat -f %z "$1"
}

file_mtime() {
  if stat -c %y "$1" 2>/dev/null; then return; fi
  stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$1"
}

# ── Commands ──

cmd_push() {
  check_no_dev_server

  if [[ ! -f "$DB_FILE" ]]; then
    echo "❌ $DB_FILE nicht gefunden"
    exit 1
  fi

  echo "→ WAL checkpoint…"
  sqlite3 "$DB_FILE" "PRAGMA wal_checkpoint(TRUNCATE);" > /dev/null

  local size
  size=$(file_size "$DB_FILE")
  echo "→ Upload nach $REMOTE/$DB_REMOTE_NAME ($(human_size "$size"))…"
  rclone copyto "$DB_FILE" "$REMOTE/$DB_REMOTE_NAME" --progress --s3-no-check-bucket

  # Marker mit Timestamp + Hostname für Konfliktdetektion
  local marker
  marker=$(printf '{"host":"%s","time":"%s","size":%d}' \
    "$(hostname)" "$(date -u +%Y-%m-%dT%H:%M:%S%z 2>/dev/null || date -Iseconds)" "$size")
  echo "$marker" | rclone rcat "$REMOTE/${DB_REMOTE_NAME}.meta" --s3-no-check-bucket

  echo "✓ Push fertig"
}

cmd_pull() {
  check_no_dev_server

  if [[ -f "$DB_FILE" ]]; then
    local backup="${DB_FILE}.backup-$(date +%Y%m%d-%H%M%S)"
    echo "→ Backup lokaler DB nach $backup…"
    cp "$DB_FILE" "$backup"
  fi

  echo "→ Download von $REMOTE/$DB_REMOTE_NAME…"
  rclone copyto "$REMOTE/$DB_REMOTE_NAME" "$DB_FILE" --progress --s3-no-check-bucket

  # WAL/SHM Reste aufräumen
  rm -f "${DB_FILE}-wal" "${DB_FILE}-shm"

  echo "✓ Pull fertig"
}

cmd_status() {
  echo "── Lokal ──"
  if [[ -f "$DB_FILE" ]]; then
    local lsize lmod
    lsize=$(file_size "$DB_FILE")
    lmod=$(file_mtime "$DB_FILE")
    echo "  Größe:    $(human_size "$lsize")"
    echo "  Modified: $lmod"
  else
    echo "  (keine lokale DB)"
  fi

  echo
  echo "── Remote ($REMOTE) ──"
  rclone lsl "$REMOTE/$DB_REMOTE_NAME" --s3-no-check-bucket 2>/dev/null || echo "  (keine remote DB)"

  echo
  echo "── Letzter Push ──"
  rclone cat "$REMOTE/${DB_REMOTE_NAME}.meta" --s3-no-check-bucket 2>/dev/null || echo "  (kein Marker)"
  echo
}

# ── Dispatch ──

case "${1:-}" in
  push)   cmd_push   ;;
  pull)   cmd_pull   ;;
  status) cmd_status ;;
  *)
    echo "Usage: $0 {push|pull|status}"
    exit 1
    ;;
esac
