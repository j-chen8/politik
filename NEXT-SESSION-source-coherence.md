# Source-Coherence Vollauf — Pickup-Kontext

**Stand:** 2026-05-01 ~16:00 (gestoppt wegen Groq TPD-Quota erschöpft)
**Resume nach:** 02:00 lokal / 00:00 UTC am 2026-05-02 (Quota-Reset)

---

## TL;DR — was morgen zu tun ist

```bash
# 1. (optional) DB-Snapshot
cp politik.db "politik.db.snapshot-pre-source-coherence-resume-$(date +%Y%m%d-%H%M%S)"

# 2. Suspect-Einträge aus partial.jsonl entfernen
#    (alles ab Index 359 = Hakan Demir wird neu geprüft)
head -n 359 source-coherence.partial.jsonl > source-coherence.partial.jsonl.new
mv source-coherence.partial.jsonl.new source-coherence.partial.jsonl

# 3. Resume — Script holt sich automatisch nur die fehlenden ~204 Politiker
npx tsx scripts/source-coherence-check.ts > /tmp/source-coherence-vollauf-day2.log 2>&1 &

# 4. Wenn fertig: Report ist automatisch geschrieben in source-coherence-report.md
```

**ETA Resume:** ~204 Politiker × ~17s/Pol = ~58 Min

---

## Was passiert ist

- **Vollauf gestartet** mit `gpt-oss-120b` auf Groq (Free Tier, 4 Keys mit je 200K TPD)
- **271 Politiker sauber durchgelaufen** (Index 0–270, gepatchte Konflikte in DB geschrieben)
- **Ab Index ~360** (Hakan Demir) Groq-Quota auf gpt-oss-120b erschöpft → alle 4 Keys bei ~199.6K/200K TPD
- Skript lief weiter, aber alle LLM-Calls liefen in 5-Retry-Schleife → nur noch leere Resultate (`totalChecked=N, conflicts=0` ohne tatsächliche Prüfung)
- **Manueller Stop um ~16:00** weil das Skript ineffizient retries spammt (~40s gewasted pro Kandidat)

---

## Stand-Zahlen

| Metrik | Wert | Anmerkung |
|---|---:|---|
| Politiker im partial.jsonl | 527 / 563 | aber siehe unten |
| **Politiker sauber geprüft** | **~359** (Index 0–358) | bis Quota-Erschöpfung |
| **Suspect-Einträge** | **~168** (Index 359–526) | müssen morgen neu |
| Politiker noch komplett offen | 36 (564–600 in DB) | nie angefangen |
| Aussage-Paare als Konflikt-Kandidaten | 2.412 (kumuliert) | Wikipedia ↔ Homepage gleiches Jahr |
| **Echte Konflikte gefunden** | **28** (bei 25 Politikern) | aus den ersten 359 sauberen |

⚠️ **Achtung:** Die 28 Konflikte stammen aus den ersten ~359 Politikern. Die Suspect-Einträge (Index 359+) haben fälschlich `conflicts=0`, weil keine Prüfung erfolgte (Quota erschöpft). Re-Run morgen wird die korrekte Zahl liefern.

---

## Quota-Status

- **Groq Daily Token Limit:** 200K TPD pro Key
- **Verbrauch:** alle 4 Keys bei 199.6K–199.9K (99.8%+)
- **Reset:** 00:00 UTC = 02:00 lokal am 2026-05-02
- **Modell:** `openai/gpt-oss-120b`

Nach Reset hat jeder Key wieder 200K — ausreichend für die ~168 Suspect + 36 offene = 204 Politiker (Schätzung: <100K Tokens für Resume).

---

## Wichtige Files

| File | Stand | Zweck |
|---|---|---|
| `source-coherence.partial.jsonl` | 527 Einträge, davon ~168 suspect | Resume-Cache, vor Resume die letzten 168 löschen (s.o.) |
| `source-coherence.partial.pre-stage4.jsonl` | 519 Einträge | Backup vom alten Lauf vor Stage-4-Repair |
| `source-coherence-report.pre-stage4.md` | klein | alter Report (5 Politiker, 0 Konflikte) |
| `politicians.source_conflicts` (DB) | für die ersten ~359 gesetzt | DB-Update direkt aus Lauf |
| `politicians.source_coherence_checked_at` (DB) | für die ersten ~359 gesetzt | Timestamp |
| `/tmp/source-coherence-vollauf.log` | komplett | Log mit allen ✗ und Progress |

---

## Was die 28 Konflikte (Stand jetzt) bedeuten

In den ersten ~359 sauber geprüften Politikern: **25 Politiker mit echten Quellen-Widersprüchen** zwischen Wikipedia-CV und Homepage-CV. Beispiele für was als Konflikt zählt:

- „Amtsantritt 2018" (Wikipedia) vs. „Amtsantritt 2019" (Homepage) — gleicher Sachverhalt, anderes Jahr
- *NICHT* als Konflikt: „Studium 1995" + „Promotion 1995" (verschiedene Sachverhalte zum gleichen Jahr)

Die genauen Konflikte stehen in der DB unter `politicians.source_conflicts` (JSON pro Politiker). Nach Vollauf-Abschluss morgen wird automatisch `source-coherence-report.md` mit allen Konflikten generiert.

---

## Falls morgen das Skript noch zu langsam ist

Fallback-Optionen:
1. **DeepInfra mit Llama 3.3 70B:** Kosten ~$2–5, andere Modell-Familie als Backup
2. **Anderes Groq-Modell:** `llama-3.3-70b-versatile` hat eigene 200K TPD Pool
3. **Kleinere Sample:** statt alle 204 nur 50 random ziehen für Coverage-Pilot

---

## Cost-Bilanz Source-Coherence so far

| Phase | Cost |
|---|---:|
| Stage 5 Source-Coherence (gpt-oss-120b) | $0 (Free Tier) |
| **Total bisher** | **$0** |

Wahrscheinlich auch nach Vollauf-Abschluss: $0 (sofern Quota für Resume reicht).
