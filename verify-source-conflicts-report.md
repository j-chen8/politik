# Stage 5.5 — Verifikation der Stage-5-Diskrepanzen

Stand: 2026-04-30 · Modell: llama-3.3-70b-versatile (Groq)

## Klassifikation
| Kategorie | Anzahl | Bedeutung |
|---|---:|---|
| 🟧 Echte Quellen-Diskrepanz | 0 | Wikipedia und Homepage sagen wirklich Verschiedenes — UI zeigt das |
| 🟦 Wikipedia-Extraktion falsch | 27 | cv_json muss neu erzeugt werden |
| 🟦 Homepage-Extraktion falsch | 8 | cv_homepage_json muss neu erzeugt werden |
| 🟥 Beide falsch | 3 | beide Extraktionen falsch — beide neu erzeugen |
| ⬜ Unklar | 0 | Quelltexte zu dünn |
| ✗ Fehler | 0 | Verifikations-Aufruf failed |
