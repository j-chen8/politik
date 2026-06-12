#!/bin/bash
# Nacht-Orchestrator »update« 2026-06-12 — sequenziell (EIN DB-Schreiber).
# Reihenfolge = Runbook §0 Schritte 4 → 4d → 4b; Wegwerf-Skript (Datum im Namen).
set -x
cd /home/jinsheng/politik

echo "=== 1) Drucksachen-Batch poll+ingest ==="
npx tsx scripts/run-drucksachen-batch.ts --poll msgbatch_01KssviUAeNNk3LgRstDGCAG

echo "=== 2) Reden-Batch retrieve (Retry-Loop) ==="
for i in $(seq 1 48); do
  npx tsx scripts/batch-retrieve-reden.ts --apply
  open=$(sqlite3 politik.db "SELECT COUNT(*) FROM plenar_speeches ps WHERE ps.original_text IS NOT NULL AND LENGTH(ps.original_text) >= 200 AND NOT EXISTS (SELECT 1 FROM speech_analyses_v2 v2 WHERE v2.rede_id = ps.rede_id AND v2.segment_index = ps.segment_index)")
  echo "offene Reden: $open (Versuch $i)"
  [ "$open" -lt 60 ] && break
  sleep 300
done

echo "=== 3) v2 -> speech_summaries Kopie ==="
npx tsx scripts/backfill-speech-summaries-from-v2.ts

echo "=== 4) TOP-Summaries Sitzung 81-83 ==="
for s in 81 82 83; do
  out=$(npx tsx scripts/batch-bundestag-top-summaries.ts --sitzung "$s" --confirm 2>&1)
  echo "$out" | tail -5
  bid=$(echo "$out" | grep -oE "msgbatch_[A-Za-z0-9]+" | head -1)
  if [ -n "$bid" ]; then
    for j in $(seq 1 30); do
      r=$(npx tsx scripts/batch-bundestag-top-summaries.ts --retrieve "$bid" 2>&1)
      echo "$r" | tail -3
      echo "$r" | grep -qiE "in_progress|noch nicht|processing" || break
      sleep 120
    done
  fi
done

echo "=== 5) Unterthemen-Batch (nur neue DS) ==="
npx tsx scripts/batch-unterthemen-global.ts --submit
for j in $(seq 1 60); do
  st=$(npx tsx scripts/batch-unterthemen-global.ts --status 2>&1)
  echo "$st" | tail -2
  echo "$st" | grep -q "ended" && break
  sleep 120
done
npx tsx scripts/batch-unterthemen-global.ts --apply

echo "=== 6) Reden-Erben + Topic-Propagation ==="
npx tsx scripts/seed-rede-unterthemen.ts
npx tsx scripts/build-item-topics.ts

echo "=== 7) Vote-Kontext fuer neue Polls ==="
npx tsx scripts/map-vote-drucksache-bundestag.ts --apply
for p in 6540 6541 6551 6552; do
  npx tsx scripts/generate-vote-context.ts --poll "$p" --write
done

echo "=== ORCHESTRATOR FERTIG $(date) ==="
