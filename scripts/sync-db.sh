#!/usr/bin/env bash
# Sync politik.db zwischen Rechnern via Cloudflare R2.
#
# Usage:
#   ./scripts/sync-db.sh push [--force]   lokale DB hochladen
#   ./scripts/sync-db.sh pull [--force]   remote DB runterladen (lokal wird gebackupt)
#   ./scripts/sync-db.sh auto             entscheidet selbst (push/pull/skip)
#   ./scripts/sync-db.sh status           Vergleich lokal vs. remote

set -euo pipefail

REMOTE="r2:politik-sync"
DB_FILE="politik.db"
DB_REMOTE_NAME="politik.db"
STATE_FILE=".politik-db-sync-state"   # speichert last-synced-epoch, gitignored

cd "$(dirname "$0")/.."

# Toleranz für mtime-Vergleiche (Sekunden). Schützt gegen Clock-Skew /
# Sub-Sekunden-mtime-Drift zwischen Rechnern.
TOLERANCE=60

# ── Helpers ──

dev_server_running() {
  pgrep -f "[n]ext dev" > /dev/null 2>&1
}

check_no_dev_server() {
  if dev_server_running; then
    echo "❌ Dev-Server läuft (next dev). Stoppe ihn zuerst, sonst wird die DB inkonsistent gesynct." >&2
    echo "   Tipp: pkill -f 'next dev'" >&2
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
  stat -c %s "$1" 2>/dev/null || stat -f %z "$1"
}

file_mtime_epoch() {
  stat -c %Y "$1" 2>/dev/null || stat -f %m "$1"
}

# Effektive DB-mtime: max(politik.db, politik.db-wal). Bei SQLite WAL-Mode
# landen frische Writes erstmal nur im -wal File; ohne diesen Check würde
# unsere Smart-Logik denken "lokal unverändert" obwohl es Änderungen gibt.
db_mtime_epoch() {
  local main wal=0
  main=$(file_mtime_epoch "$1")
  if [[ -f "${1}-wal" ]]; then
    wal=$(file_mtime_epoch "${1}-wal")
  fi
  if (( wal > main )); then echo "$wal"; else echo "$main"; fi
}

file_mtime_human() {
  stat -c %y "$1" 2>/dev/null || stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$1"
}

now_epoch() { date +%s; }

read_state() {
  [[ -f "$STATE_FILE" ]] && cat "$STATE_FILE" || echo "0"
}

write_state() {
  echo "$1" > "$STATE_FILE"
}

remote_epoch() {
  # Liest "epoch" Feld aus dem .meta JSON. 0 wenn kein Meta vorhanden.
  rclone cat "$REMOTE/${DB_REMOTE_NAME}.meta" --s3-no-check-bucket 2>/dev/null \
    | grep -oE '"epoch"[[:space:]]*:[[:space:]]*[0-9]+' \
    | grep -oE '[0-9]+' \
    || echo "0"
}

remote_meta_raw() {
  rclone cat "$REMOTE/${DB_REMOTE_NAME}.meta" --s3-no-check-bucket 2>/dev/null || echo ""
}

# ── Sync-Status berechnen ──
#
# Setzt globale Variablen:
#   LOCAL_EPOCH    — mtime der lokalen DB in epoch sec (0 wenn keine DB)
#   REMOTE_EP      — epoch des letzten Remote-Push (0 wenn kein Marker)
#   LAST_SYNC_EP   — epoch beim letzten erfolgreichen sync auf diesem Rechner
#   LOCAL_CHANGED  — "1" wenn lokale DB nach LAST_SYNC_EP geändert
#   REMOTE_CHANGED — "1" wenn Remote nach LAST_SYNC_EP gepusht
compute_status() {
  if [[ -f "$DB_FILE" ]]; then
    LOCAL_EPOCH=$(db_mtime_epoch "$DB_FILE")
  else
    LOCAL_EPOCH=0
  fi
  REMOTE_EP=$(remote_epoch)
  LAST_SYNC_EP=$(read_state)

  if (( LOCAL_EPOCH > LAST_SYNC_EP + TOLERANCE )); then
    LOCAL_CHANGED=1
  else
    LOCAL_CHANGED=0
  fi
  if (( REMOTE_EP > LAST_SYNC_EP + TOLERANCE )); then
    REMOTE_CHANGED=1
  else
    REMOTE_CHANGED=0
  fi
}

# ── Commands ──

cmd_push() {
  local force="${1:-}"

  if [[ ! -f "$DB_FILE" ]]; then
    echo "❌ $DB_FILE nicht gefunden" >&2
    exit 1
  fi

  compute_status

  if [[ "$force" != "--force" ]]; then
    if (( LOCAL_CHANGED == 0 && REMOTE_CHANGED == 0 )); then
      echo "= Nichts zu pushen (lokal unverändert seit letztem Sync)"
      return 0
    fi
    if (( LOCAL_CHANGED == 0 && REMOTE_CHANGED == 1 )); then
      echo "= Lokal unverändert, Remote ist neuer — kein Push nötig"
      return 0
    fi
    if (( LOCAL_CHANGED == 1 && REMOTE_CHANGED == 1 )); then
      echo "❌ KONFLIKT: Lokal UND Remote haben Änderungen seit letztem Sync." >&2
      echo "   Lokal mtime:   $(date -d "@$LOCAL_EPOCH" 2>/dev/null || date -r "$LOCAL_EPOCH")" >&2
      echo "   Remote epoch:  $(date -d "@$REMOTE_EP" 2>/dev/null || date -r "$REMOTE_EP")" >&2
      echo "   Letzter Sync:  $(date -d "@$LAST_SYNC_EP" 2>/dev/null || date -r "$LAST_SYNC_EP")" >&2
      echo "" >&2
      echo "   Optionen:" >&2
      echo "     1) lokale DB sichern, pull, Änderungen manuell mergen" >&2
      echo "     2) ./scripts/sync-db.sh push --force   (überschreibt Remote)" >&2
      exit 1
    fi
  fi

  # Erst hier prüfen — wenn wir nichts pushen, ist Dev-Server egal
  check_no_dev_server

  echo "→ WAL checkpoint…"
  sqlite3 "$DB_FILE" "PRAGMA wal_checkpoint(TRUNCATE);" > /dev/null

  local size now
  size=$(file_size "$DB_FILE")
  now=$(now_epoch)

  echo "→ Upload nach $REMOTE/$DB_REMOTE_NAME ($(human_size "$size"))…"
  rclone copyto "$DB_FILE" "$REMOTE/$DB_REMOTE_NAME" --progress --s3-no-check-bucket

  local marker
  marker=$(printf '{"host":"%s","time":"%s","epoch":%d,"size":%d}' \
    "$(hostname)" "$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -Iseconds)" \
    "$now" "$size")
  echo "$marker" | rclone rcat "$REMOTE/${DB_REMOTE_NAME}.meta" --s3-no-check-bucket

  write_state "$now"
  echo "✓ Push fertig (epoch=$now)"
}

cmd_pull() {
  local force="${1:-}"

  compute_status

  if [[ "$force" != "--force" ]]; then
    if (( REMOTE_CHANGED == 0 )); then
      echo "= Nichts zu pullen (Remote unverändert seit letztem Sync)"
      return 0
    fi
    if (( LOCAL_CHANGED == 1 && REMOTE_CHANGED == 1 )); then
      echo "❌ KONFLIKT: Lokal UND Remote haben Änderungen seit letztem Sync." >&2
      echo "   Pull würde lokale Änderungen überschreiben." >&2
      echo "   Optionen:" >&2
      echo "     1) ./scripts/sync-db.sh push --force   (lokale Version gewinnt)" >&2
      echo "     2) ./scripts/sync-db.sh pull --force   (Remote gewinnt; lokales Backup wird angelegt)" >&2
      exit 1
    fi
  fi

  # Erst hier prüfen — wenn wir nichts pullen, ist Dev-Server egal
  check_no_dev_server

  if [[ -f "$DB_FILE" ]]; then
    local backup="${DB_FILE}.backup-$(date +%Y%m%d-%H%M%S)"
    echo "→ Backup lokaler DB nach $backup…"
    cp "$DB_FILE" "$backup"
  fi

  echo "→ Download von $REMOTE/$DB_REMOTE_NAME…"
  rclone copyto "$REMOTE/$DB_REMOTE_NAME" "$DB_FILE" --progress --s3-no-check-bucket
  rm -f "${DB_FILE}-wal" "${DB_FILE}-shm"

  # State auf Remote-Epoch setzen, damit zukünftige Vergleiche stimmen.
  # Falls kein Remote-Epoch (alte Marker ohne epoch field) → now nehmen.
  local sync_ep="$REMOTE_EP"
  if (( sync_ep == 0 )); then sync_ep=$(now_epoch); fi
  write_state "$sync_ep"

  echo "✓ Pull fertig (epoch=$sync_ep)"
}

cmd_auto() {
  if [[ ! -f "$DB_FILE" ]] && [[ "$(remote_epoch)" == "0" ]]; then
    echo "= Weder lokale noch remote DB — nichts zu tun"
    return 0
  fi

  compute_status

  if (( LOCAL_CHANGED == 1 && REMOTE_CHANGED == 1 )); then
    echo "⚠️  Auto-Sync: Konflikt erkannt (lokal & remote beide neuer als letzter Sync)" >&2
    echo "   Status:" >&2
    cmd_status >&2
    exit 1
  fi

  if (( LOCAL_CHANGED == 1 )); then
    cmd_push
  elif (( REMOTE_CHANGED == 1 )); then
    cmd_pull
  else
    echo "= Auto-Sync: nichts zu tun (alles synchron)"
  fi
}

cmd_status() {
  compute_status

  echo "── Lokal ──"
  if [[ -f "$DB_FILE" ]]; then
    echo "  Größe:    $(human_size "$(file_size "$DB_FILE")")"
    echo "  Modified: $(file_mtime_human "$DB_FILE")"
    echo "  Epoch:    $LOCAL_EPOCH"
  else
    echo "  (keine lokale DB)"
  fi

  echo
  echo "── Remote ($REMOTE) ──"
  rclone lsl "$REMOTE/$DB_REMOTE_NAME" --s3-no-check-bucket 2>/dev/null \
    || echo "  (keine remote DB)"
  echo "  Marker: $(remote_meta_raw)"

  echo
  echo "── Sync-State ──"
  echo "  Last-Sync:      $LAST_SYNC_EP $( (( LAST_SYNC_EP > 0 )) && (date -d "@$LAST_SYNC_EP" 2>/dev/null || date -r "$LAST_SYNC_EP") )"
  echo "  Lokal geändert: $( (( LOCAL_CHANGED == 1 )) && echo JA || echo nein )"
  echo "  Remote geändert: $( (( REMOTE_CHANGED == 1 )) && echo JA || echo nein )"
  echo
}

# ── Dispatch ──

case "${1:-}" in
  push)   shift; cmd_push   "${1:-}" ;;
  pull)   shift; cmd_pull   "${1:-}" ;;
  auto)   cmd_auto ;;
  status) cmd_status ;;
  *)
    echo "Usage: $0 {push [--force]|pull [--force]|auto|status}"
    exit 1
    ;;
esac
