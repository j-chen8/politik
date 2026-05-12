#!/bin/bash
# Lädt gezielt die Drucksachen nach, die in `activities` referenziert sind aber lokal fehlen.
# Liest die fehlenden drucksache_nrn direkt aus der DB (keine harten Range-Annahmen).

set -u
DB="/home/jinsheng/politik/politik.db"
OUTDIR="/home/jinsheng/politik/data/drucksachen"
MAX_SIZE=10485760  # 10 MB
LARGE_LOG="${OUTDIR}/large_files_skipped.txt"

[ -d "$OUTDIR" ] || { echo "OUTDIR fehlt: $OUTDIR"; exit 1; }

downloaded=0
skipped_existing=0
skipped_404=0
skipped_large=0
errors=0

# Hole DB-referenzierte Drucksachen aus WP21
sqlite3 "$DB" "SELECT DISTINCT drucksache_nr FROM activities WHERE dokumentart='Drucksache' AND drucksache_nr LIKE '21/%';" |
while IFS= read -r nr; do
  n="${nr#21/}"
  padded=$(printf "%05d" "$n")
  folder=${padded:0:3}
  fname="21${padded}.pdf"
  url="https://dserver.bundestag.de/btd/21/${folder}/${fname}"

  if [ -f "${OUTDIR}/${fname}" ]; then
    skipped_existing=$((skipped_existing+1))
    continue
  fi

  headers=$(curl -sI --max-time 15 "$url")
  status=$(echo "$headers" | head -1 | grep -oE '[0-9]{3}' | head -1)

  if [ "$status" != "200" ]; then
    skipped_404=$((skipped_404+1))
    echo "[404] 21/${n}"
    continue
  fi

  size=$(echo "$headers" | grep -i '^content-length' | awk '{print $2}' | tr -d '\r')

  if [ -n "$size" ] && [ "$size" -gt "$MAX_SIZE" ]; then
    size_mb=$(awk -v s="$size" 'BEGIN{printf "%.1f", s/1048576}')
    echo "[LARGE ${size_mb}MB] 21/${n} - ${url}" | tee -a "$LARGE_LOG"
    skipped_large=$((skipped_large+1))
    continue
  fi

  if curl -s --max-time 60 -o "${OUTDIR}/${fname}" "$url" && [ -s "${OUTDIR}/${fname}" ]; then
    downloaded=$((downloaded+1))
    if [ $((downloaded % 25)) -eq 0 ]; then
      echo "[OK ${downloaded}] zuletzt 21/${n}"
    fi
  else
    rm -f "${OUTDIR}/${fname}"
    errors=$((errors+1))
    echo "[ERR] 21/${n}"
  fi

  sleep 0.1
done

echo "=== Done ==="
echo "Downloaded: ${downloaded}"
echo "Skipped (already present): ${skipped_existing}"
echo "Skipped (404):             ${skipped_404}"
echo "Skipped (>10MB):           ${skipped_large}"
echo "Errors:                    ${errors}"
