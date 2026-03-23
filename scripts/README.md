# Scripts — Anleitung

## Reden-Zusammenfassungen für Politiker generieren

Das ist der Hauptworkflow um für einen Politiker alle Plenar-Reden zu extrahieren und per KI zusammenzufassen.

### Voraussetzungen

- Gemini API Keys in `.env`:
  ```
  GEMINI_API_KEY=...
  GEMINI_API_KEY_2=...
  ```
- XML-Plenarprotokolle unter `data/plenarprotokolle_xml/` (einmalig heruntergeladen)

### Einzelnen Politiker verarbeiten

```bash
# Syntax: npx tsx scripts/extract-speeches-xml.ts <Nachname> "<Voller Name>"
# Env-Variablen müssen gesetzt sein

export GEMINI_API_KEY="..." GEMINI_API_KEY_2="..."

npx tsx scripts/extract-speeches-xml.ts Brandner "Stephan Brandner"
npx tsx scripts/extract-speeches-xml.ts Merz "Friedrich Merz"
npx tsx scripts/extract-speeches-xml.ts Kraft "Dr. Rainer Kraft"
```

**Was passiert:**
1. Durchsucht alle 64 XML-Dateien nach `<rede>`-Blöcken des Politikers
2. Erkennt Fragestunden automatisch (>10 Reden in einer Sitzung → 1 Zusammenfassung)
3. Schickt jeden Redetext an Gemini 3.1 Flash Lite zur Zusammenfassung
4. Speichert Ergebnis in `speech_summaries`-Tabelle in `politik.db`
5. Ergebnis ist sofort unter `/protokolle/redner/<Name>` in der App sichtbar

### Mehrere Politiker auf einmal

```bash
export GEMINI_API_KEY="..." GEMINI_API_KEY_2="..."

for entry in \
  "Brandner|Stephan Brandner" \
  "Merz|Friedrich Merz" \
  "Weidel|Dr. Alice Weidel" \
  "Klingbeil|Lars Klingbeil"; do
  IFS='|' read -r lastname fullname <<< "$entry"
  echo "=== Processing: $fullname ==="
  npx tsx scripts/extract-speeches-xml.ts "$lastname" "$fullname"
done
```

### Batch-Verarbeitung nach Nachname (Buchstabe)

```bash
# Alle Redner deren Nachname mit G anfängt:
npx tsx scripts/batch-summarize.ts G

# Mehrere Buchstaben nacheinander:
npx tsx scripts/batch-summarize.ts E F G H
```

**WICHTIG: Nur EIN Prozess gleichzeitig laufen lassen!**
Mehrere parallele Prozesse überlasten die API Keys sofort (alle 429).
Die Keys werden pro Prozess geprüft — bei 5 parallelen Prozessen sind alle 5 Keys
innerhalb von Sekunden rate-limited und der Prozess bricht ab.

### Rate Limits (Gemini 3.1 Flash Lite Free Tier)

| Limit | Pro Key | Mit 5 Keys |
|-------|---------|------------|
| RPM | 15 | 75 |
| RPD | 500 | 2500 |
| TPM | 250k | 1.25M |

- Delay zwischen Requests: ~2.5s (automatisch im Script)
- Ein Politiker mit ~15 Sitzungen braucht ~15 Requests → ~40 Sekunden
- Minister mit Fragestunden (>10 Reden/Sitzung) werden automatisch zusammengefasst → spart Requests
- Bei Rate-Limiting wartet das Script 15s und probiert erneut (2 Retries)
- **NIEMALS mehrere batch-summarize Prozesse parallel starten** — immer sequentiell!
- Ein einzelner Prozess mit 5 Keys schafft ~24 RPM, das liegt sicher unter dem 75 RPM Limit
- Mit 5 Keys schafft man locker alle Redner an einem Tag (500 RPD × 5 = 2500 Requests)

### Tipps

- **Nachname muss exakt matchen** wie er in den XML-Dateien steht (Groß-/Kleinschreibung beachten)
- **Voller Name** wird für die DB und die Zusammenfassungen verwendet
- **Titel mitgeben** bei Dr./Prof.: `"Dr. Rainer Kraft"`, nicht `"Rainer Kraft"`
- **Erneut laufen lassen** überschreibt vorherige Zusammenfassungen für diesen Politiker
- Falls ein Nachname bei mehreren Politikern vorkommt (z.B. "Müller"), werden alle Reden beider Personen extrahiert — hier muss man ggf. den XML-Parser anpassen

### Nachname herausfinden

```bash
# Suche in den XML-Dateien nach einem Namen
grep -l "Weidel" data/plenarprotokolle_xml/*.xml | head -3
# Zeige den Redner-Tag
grep -A3 "Weidel" data/plenarprotokolle_xml/21064.xml | head -10
```

---

## Andere Scripts (Referenz)

### Daten herunterladen

| Script | Beschreibung |
|--------|-------------|
| `scrape-ausschuesse.sh` | Ausschuss-Protokolle + Tagesordnungen von bundestag.de (AJAX-API, braucht Enodia-Cookie) |
| `download-drucksachen.sh` | Alle Drucksachen der 21. WP von dserver.bundestag.de |

### Daten parsen (Regex — veraltet, XML ist besser)

| Script | Beschreibung |
|--------|-------------|
| `parse-protokoll.ts` | Regex-Parser für Plenarprotokolle (PDF) |
| `parse-ausschuss.ts` | Regex-Parser für Ausschuss-Protokolle (PDF) |
| `parse-with-llm.ts` | LLM-Parser für Plenarprotokolle (Gemini, PDF-basiert) |
| `summarize-speeches.ts` | PDF-basierter Speech-Finder + LLM (ersetzt durch `extract-speeches-xml.ts`) |

### Daten in DB laden

| Script | Beschreibung |
|--------|-------------|
| `seed.ts` | Politiker + Mandate von abgeordnetenwatch.de |
| `seed-activities.ts` | Parlamentarische Aktivitäten |
| `seed-protokolle.ts` | Regex-geparste Protokolldaten in DB |
| `seed-llm-data.ts` | LLM-geparste Plenarprotokoll-Daten in DB |

### Neue XML-Protokolle herunterladen

Wenn neue Sitzungen stattfinden:

```bash
# Neue XMLs holen (Beispiel: Sitzung 65)
curl -o data/plenarprotokolle_xml/21065.xml https://dserver.bundestag.de/btp/21/21065.xml

# Neue PDFs holen
curl -o data/plenarprotokolle/21065.pdf https://dserver.bundestag.de/btp/21/21065.pdf

# Danach seed-llm-data.ts neu laufen für aktualisierte Plenar-Übersicht
npx tsx scripts/seed-llm-data.ts
```
