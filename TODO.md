# Politik — Ideas & Roadmap

## Now
<!-- Current focus / next thing to build -->


## Next Up
<!-- Prioritized ideas ready to build -->


## Ideas

### 1. Ausschuss-Detektiv (Gamechanger)
Die wahre Arbeit passiert in den Fach-Ausschüssen — dort das Licht anknipsen.
- **Anwesenheit prüfen** — Aus Kurzprotokollen extrahieren, wer wirklich im Raum saß (oder hybrid)
- **Aktivität messen** — Wer stellt Fragen? Wer bringt Anträge ein? (Unterscheidung „Stimmvieh" vs. „Fachpolitiker")
- **Transparenz-Lücke anzeigen** — Geheim tagende Ausschüsse aktiv als „Informations-Vakuum" markieren, um Druck aufzubauen
- _Komplexität: Hoch — Protokoll-Parsing, evtl. PDF-Scraping, eigene Datenstruktur_
- _Datenquellen: Bundestag Kurzprotokolle, DIP API_

### 2. KI-Dolmetscher
Politik-Sprache in Bürger-Sprache übersetzen.
- **Automatische Zusammenfassungen** — Transkripte, Reden, komplexe Anträge → 3–5 verständliche Sätze für normale Menschen (via Claude/Gemini)
- **Kontext liefern** — Nicht nur WAS beschlossen wurde, sondern WARUM es für den Bürger wichtig ist
- _Komplexität: Mittel — LLM-API-Anbindung, Prompt-Engineering, Caching für Kosten_
- _Abhängigkeit: Funktioniert standalone, wird aber noch besser mit Ausschuss-Daten_

#### Strategie für Bundestagsprotokolle
Bundestagsreden haben eine spezielle Struktur (Zwischenrufe, Protokollnotizen, förmliche Anreden). Damit die Zusammenfassung gelingt:

| Schritt | Fokus |
|---------|-------|
| **Filterung** | Modell anweisen, Zwischenrufe in Klammern entweder zu ignorieren oder gezielt die "Stimmung im Saal" daraus abzuleiten |
| **Struktur** | Nach Thesen, Forderungen und Gegenargumenten sortieren — nicht nur den chronologischen Ablauf wiedergeben |
| **Kontext** | Da wir uns 2026 befinden: Reden im Kontext der aktuellen Regierungspolitik unter Bundeskanzler Merz bewerten |

### 3. Finanz-Radar (Follow the Money)
Geldflüsse sichtbar machen.
- **Stiftungs-Check** — Welche Politiker werden durch Stiftungen finanziert? Welche Stiftungen erhalten Steuergeld? (Lobby-Verstrickungen)
- **Steuerverschwendung** — Ineffiziente Ausgaben und „Tax Waste" den handelnden Personen zuordnen
- _Komplexität: Hoch — Datenquellen unklar, evtl. manuelle Recherche + Scraping nötig_
- _Datenquellen: Nebeneinkünfte (abgeordnetenwatch), Lobbyregister, Bundesrechnungshof_

### 4. Mitarbeiter-Transparenz
Keine zentrale API — kreative Datenquellen nötig.

**Datenlage:**
- Keine offizielle Mitarbeiterliste (Datenschutz). Nur das Budget ist bekannt (~26.650 €/Monat pro MdB)
- Viele MdBs listen ihr Team freiwillig auf ihrer Homepage (Name, Foto, Zuständigkeit)
- Soziale Medien (Impressum, Bios) enthalten oft Mitarbeiter-Kürzel/Namen

**Features:**
- **Transparenz-Ranking: Personal**
  - Level 1: Keine Info
  - Level 2: Namen auf der Webseite
  - Level 3: Vollständige Veröffentlichung inkl. Gehälter (freiwillig)
- **Impressum-Scanner** — Abgeordneten-Webseiten automatisiert nach Team-Infos scannen (Scraping)
- **Familien-Check** — Nachnamen-Abgleich Team vs. MdB (Verwandte 1. Grades dürfen nicht über Staatsbudget angestellt werden)
- **Drehtür-Detektor** — Lobbyregister nach Ex-Mitarbeitern durchsuchen, die zu Lobby-Verbänden gewechselt sind

**Datenquellen:**
- Persönliche Webseiten der MdBs (Scraping)
- Lobbyregister (Drehtüreffekt-Check, seit 2022 verschärft)
- Hausausweis-Register (per IFG erstritten, statische PDFs via FragDenStaat)
- Crowdsourcing als Ergänzung

- _Komplexität: Hoch — Web-Scraping, NLP für Name-Extraction, rechtliche Prüfung (Datenschutz)_

## Someday / Maybe
<!-- Cool but not urgent -->


## Done
<!-- Completed items for reference -->
- Basic politician database with abgeordnetenwatch.de data
- Landing page with search and stats
- Politician list with parliament/party filters
- Individual politician detail pages
- Activities feed (Anfragen, Anträge, etc.)
- Search page
- Seed scripts for DB population
