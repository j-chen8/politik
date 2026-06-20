#!/usr/bin/env bash
# Wrapper für den Wirtschaft-Pilot (partei-aspekt-verhalten.ts).
# Wartet, bis kein aw-themenfeld-synthese-Job mehr läuft (Mistral-Free frei),
# startet dann den Pilot. Läuft als systemd --user oneshot -> überlebt SSH/Sandbox.
set -uo pipefail
cd /home/jinsheng/politik || exit 1

LOG=/tmp/partei-aspekt-pilot.log
echo "=== Pilot-Wrapper gestartet $(date -Is) ===" >>"$LOG"

# 1) Gate: warten, solange die AW-Synthese (gleiches Mistral-large + Keys) läuft
while pgrep -f "scripts/aw-themenfeld-synthese.ts" >/dev/null 2>&1; do
  echo "[$(date -Is)] AW-Synthese läuft noch -> warte 120s" >>"$LOG"
  sleep 120
done
echo "[$(date -Is)] AW-Synthese beendet. 90s Puffer für Rate-Window." >>"$LOG"
sleep 90

# 2) Pilot starten (Wirtschaft, 5 Partei-Calls, Mistral-Free, 0 EUR)
echo "[$(date -Is)] Starte Wirtschaft-Pilot ..." >>"$LOG"
npx tsx scripts/partei-aspekt-verhalten.ts --feld "Wirtschaft" >>"$LOG" 2>&1
RC=$?
echo "[$(date -Is)] Pilot beendet (exit $RC)." >>"$LOG"

# 3) Kurzer Endstand in den Log
sqlite3 politik.db "SELECT 'Zeilen partei_aspekt_verhalten:', COUNT(*) FROM partei_aspekt_verhalten WHERE feld='Wirtschaft';" >>"$LOG" 2>&1
exit $RC
