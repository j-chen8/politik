# Prozedur: Kommissionsbericht analysieren (wiederverwendbare SoP)

**Zweck.** Schritt-für-Schritt, wie wir *einen* Leitbericht einer Regierungs-/Expertenkommission in
die Analyse-Schicht `kommission_bericht_analyse` überführen — so, dass jeder Bericht (die 19 der
Watchlist + jeder neu einlaufende) **dieselbe Behandlung** bekommt und die Detailseite
`/kommissionen/[slug]` in gleicher Qualität rendert.

**Abgrenzung.** Dies ist die **Analyse**-Prozedur. Die **Beschaffung** (PDF-Download → Volltext →
Neu-Meldung) ist eine getrennte, bereits automatisierte Schicht — siehe [[project_kommissions_tracker]]:
`scripts/scrape-kommissionsberichte.ts` + Tages-Timer `kommissionen-daily` (07:15) + Mail-Hook
„🆕 NEUER KOMMISSIONSBERICHT". Diese Prozedur setzt dort an, wo ein Bericht mit `full_text` in der DB
liegt.

**Kern-Prinzipien:**
1. **Jeden Bericht einzeln, ohne Zwangsschema lesen.** Nicht 33-Empfehlungs-Raster über einen
   1-Empfehlungs-Bericht stülpen. Erst verstehen, *was* der Bericht ist (Reform vs. beratend/technisch),
   dann Felder wählen. (User 2026-07-01: KEF hatte „3× derselbe Beitragssatz" als Kernpunkte — falsch.)
2. **Kein automatisches LLM-Fließband.** Volumen ist winzig (~19 Gremien × 1–2 Leitberichte/Jahr), der
   Wert liegt im Urteil. Bezahlte API wäre teuer *und* schlechter. Manuell (Claude Code liest) +
   deterministische Vor-Extraktoren für den mechanischen Teil. [[feedback_checke_heisst_manuell]]
   [[feedback_kosten_ok_vor_api]]
3. **Zu jedem Trend den Grund.** „steigt/sinkt/geringer als" nie nackt stehen lassen — Ursache aus dem
   Volltext mitliefern. [[feedback_trend_immer_grund]]
4. **Zahlen möglichst selbsterklärend + pro-Person / Klartext.** Meta-Zahlen („33 Empfehlungen") sind
   wertlos. [[feedback_consumer_scan_first]]

> **Referenz-Implementierungen (zum Klonen):** KEF (beratend/technisch, mit Verwendungs-Aufschlüsselung)
> · Rente = `alterssicherungskommission` (Reform, gruppe/art/impact) · FKG = `finanzkommission-gesundheit`.
> Insert-Muster: `scratchpad/*-update.cjs` (better-sqlite3, `UPDATE … WHERE kommission_slug=?`,
> idempotent). Felder + Reader: `src/lib/db.ts` (`KommissionAnalyse`, `getKommissionAnalyse`). UI:
> `src/app/kommissionen/[slug]/page.tsx`. Schema: `scripts/_lib/kommissionen-schema.ts`.

---

## Die Analyse-Felder (Spalten in `kommission_bericht_analyse`)

| Feld | Form | Wofür | Pflicht? |
|---|---|---|---|
| `auftrag` | String | 1–2 Sätze: was die Kommission tut + welcher Bericht | ja |
| `kennzahlen_json` | `[{wert,label}]` | Hero: `[0]` = Leit-These (große Kachel), Rest = Zahlen-Kacheln | ja (≥1) |
| `kernbefunde_json` | `[{titel,text,betrifft?,schwere?}]` | **„Das Wichtigste"** — nach Schwere sortiert, je mit „Betrifft" | für beratende/technische Berichte |
| `verwendung_json` | `{titel?,zeitraum?,gesamt?,posten:[{label,wert,anteil?}]}` | **„Wofür das Geld gebraucht wird"** — Balken | wo der Bericht Geld/Mengen aufschlüsselt |
| `kernpunkte_json` | `[{massnahme,kapitel?,gruppe?,art?,impact?,umsetzbarkeit?}]` | Detailliste (Reform: „Alle Empfehlungen"; beratend: „Im Detail") | ja |
| `mitglieder_json` | `{anzahl,zusammensetzung,merkmale[],gruppen[{rolle,personen[]}],beratend?}` | **„Wer dahinter steckt"** — Autoren/Experten | ja, wenn Roster ermittelbar |
| `eckpunkte_json` | `[string]` | Hero-Fallback, nur wenn keine Leit-Kennzahl | selten |

**Der entscheidende Schalter — Reform vs. beratend (`reformStil` in page.tsx):**
Ist `kernbefunde` **leer** → Reform-Stil: „Größte Einschnitte" + „Wen es trifft"-Hero (aus
`kernpunkte.art/impact/gruppe`), Detailsektion heißt „Alle Empfehlungen". Ist `kernbefunde`
**befüllt** → beratend/technisch: kein Einschnitt-Raster, „Das Wichtigste" trägt die Betroffenen,
Detailsektion heißt „Im Detail". → **Reform-Bericht:** kernbefunde leer lassen, kernpunkte mit
gruppe/art/impact. **Beratend/technisch:** kernbefunde füllen, kernpunkte ohne art/impact (nur
massnahme+kapitel).

---

## Stufe 0 — Leitbericht identifizieren · gratis

Pro Kommission **den** einen maßgeblichen Bericht wählen — NICHT Anhänge/Factsheets/Ergänzungsbände.
Fallen aus der Praxis: Mindestlohn = „Fünfter Bericht" (nicht Ergänzungsband); Monopolkommission =
Sondergutachten; SVR-Jahresgutachten hat Kernbotschaften/Grafiken als *separate* Berichte → filtern.
Prüfen: `SELECT id,titel,pages,chars FROM kommission_bericht WHERE kommission_slug=? ORDER BY pages DESC`.

## Stufe 1 — Mechanisch vor-extrahieren · grep · €0 · ★ zuerst ★

Volltext in Scratchpad dumpen (`SELECT full_text …`), dann deterministisch greppen (kein LLM):
- **Mitglieder:** Abschnitt „Mitglieder der Kommission" / „setzt sich zusammen" / „benannt durch". Die
  meisten Berichte listen Name + Land/Entsender + Fachbereich + Rolle **wörtlich** → direkt nach
  `mitglieder_json`. (KEF: 16 Mitglieder komplett im Bericht, S. 21–22.)
- **Finanz-/Verwendungstabellen:** grep `Aufwand|Mio. €|Summe|Anteil|Personal|Investit` → die
  Aufschlüsselung „wofür das Geld" (→ `verwendung_json`). Prozente auf 100 prüfen.
- **Kennzahlen-Kandidaten:** die Leitzahl(en) — Betrag, Volumen, Kürzung, Quote.

## Stufe 2 — Management-Summary lesen → wichtigste Punkte · manuell

Vorwort / Zusammenfassung / Kernbotschaften **selbst lesen**. Die *schwerwiegendsten und relevantesten*
Punkte herausziehen (nicht die zahlreichsten). Je Punkt: **wen betrifft es** (konkrete Gruppe + grobe
Größenordnung). Nach Schwere sortieren (`schwere: hoch|mittel|gering` → farbiger Rand). Typisch 4–6
Kernbefunde. Redundanz vermeiden: nicht 3× dieselbe Aussage variieren.

## Stufe 3 — Zu jedem Trend den Grund · grep + lesen

Jede Steigerungs-/Senkungs-/Vergleichsaussage (in Kennzahlen UND Kernbefunden): Ursache im Volltext
suchen (`Grund|Ursache|zurückzuführen|bedingt|Treiber|wegen|Anstieg`) und in den Text integrieren
(„… — Grund: …"). Kein Grund in der Quelle → weglassen, nicht erfinden. [[feedback_trend_immer_grund]]

## Stufe 4 — Detailebene füllen (`kernpunkte`) · manuell

Die kanonische, kapitelgegliederte Detailliste — mehr Tiefe als „Das Wichtigste": harte Zahlen,
Aufschlüsselungen, Einzelfälle. Kapitel als Klammer (`kapitel`), massnahme als **vollständigen Satz**
oder **bewusst kurze Phrase** — nie mitten abschneiden (Alt-Falle Rente: 11/33 Sätze abgeschnitten).
Reform: hier gruppe/art/impact setzen. Beratend: nur massnahme + kapitel.

## Stufe 5 — Insert + Render-Check + Screenshot

`scratchpad/<slug>-update.cjs` (better-sqlite3, ALTER idempotent + `UPDATE … WHERE kommission_slug=?`),
JSON.stringify je Feld. Danach: `curl -s localhost:3001/kommissionen/<slug>` auf Kern-Strings
prüfen (200 + Sektionen da), Screenshot (Playwright) zur visuellen Abnahme. `npx tsc --noEmit` grün.
DB-Daten sind **gitignored** → beim Deploy mitnehmen (Prod braucht `ensureKommissionenSchema`-Lauf).

---

## Lehren / Fallen (nicht wiederholen)

- **Kein Zwangsschema.** Beratender Bericht als „Alle Empfehlungen (3)" mit 3× derselben Zahl = der
  Fehler, der diese Prozedur ausgelöst hat. → `kernbefunde` + „Im Detail".
- **Mitglieder aus dem Bericht selbst**, nicht raten. Wikipedia-Links **online verifizieren**, nie
  konstruieren; MdB → internes `/politiker/{id}`, externe → Wikipedia (↗). Absenz eines Links ist ok.
- **Neutralität:** bei „Wer dahinter steckt" KEIN „neutral/parteiisch"-Urteil — nur Fakten (Rolle,
  Qualifikation, Entsender), Leser urteilt selbst. [[feedback_neutralitaet]]
- **Verwendungs-Aufschlüsselung** ist starkes Bürger-Material („wo geht mein Geld hin?") — immer prüfen,
  ob der Bericht sie hergibt; Balken (nicht Torte) bei >3 Posten.
- Zahlen der manuellen Lesung sind fehleranfällig → beim Review stichprobenartig gegen den Volltext.

*Angelegt 2026-07-01 (KEF-Umbau). Additiv — ersetzt nichts. [[feedback_procedures_additive]]*
