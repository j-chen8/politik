#!/bin/bash
# Download all Drucksachen from 21. Bundestag (current Wahlperiode)
# Skips files > 10MB, logs them separately

COOKIE='enodia=eyJleHAiOjE3NzM5NDY2OTksImNvbnRlbnQiOnRydWUsImF1ZCI6ImF1dGgiLCJIb3N0IjoiZHNlcnZlci5idW5kZXN0YWcuZGUiLCJTb3VyY2VJUCI6IjE4OC4xOTIuMTU1LjIyOSIsIkNvbmZpZ0lEIjoiOGRhZGNlMTI1ZmQyYzM5MzJiOTQzYjUyZTlkMmNkNjUwNTc1NGUxNjIyMTJhMmNlMWJiNWFmMTVjMGQ0YmJmZSJ9.vZQBgCQuUnIRuroe_x3aiv9onN5OwQo3K9bPXs3dn-E='
OUTDIR="/home/jk/politik/data/drucksachen"
MAX_SIZE=10485760  # 10 MB
LARGE_LOG="${OUTDIR}/large_files_skipped.txt"
> "$LARGE_LOG"

downloaded=0
skipped_404=0
skipped_large=0

for n in $(seq 1 4810); do
  padded=$(printf "%05d" $n)
  folder=${padded:0:3}
  fname="21${padded}.pdf"
  url="https://dserver.bundestag.de/btd/21/${folder}/${fname}"
  
  # Skip if already downloaded
  [ -f "${OUTDIR}/${fname}" ] && continue
  
  # HEAD request to check existence and size
  headers=$(curl -sI -b "$COOKIE" "$url")
  status=$(echo "$headers" | head -1 | grep -oP '\d{3}')
  
  if [ "$status" != "200" ]; then
    skipped_404=$((skipped_404+1))
    continue
  fi
  
  size=$(echo "$headers" | grep -i content-length | awk '{print $2}' | tr -d '\r')
  
  if [ -n "$size" ] && [ "$size" -gt "$MAX_SIZE" ]; then
    size_mb=$(echo "scale=1; $size / 1048576" | bc)
    echo "SKIPPED (${size_mb} MB): 21/${n} - ${url}" | tee -a "$LARGE_LOG"
    skipped_large=$((skipped_large+1))
    continue
  fi
  
  curl -s -b "$COOKIE" -o "${OUTDIR}/${fname}" "$url"
  downloaded=$((downloaded+1))
  
  # Progress every 100
  if [ $((downloaded % 100)) -eq 0 ]; then
    echo "Progress: ${downloaded} downloaded, at 21/${n}..."
  fi
  
  # Small delay to avoid rate limiting
  sleep 0.1
done

echo ""
echo "=== Done ==="
echo "Downloaded: ${downloaded}"
echo "Not found (404): ${skipped_404}"
echo "Skipped (>10MB): ${skipped_large}"
echo "Large files logged in: ${LARGE_LOG}"
