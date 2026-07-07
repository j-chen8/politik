# Prozedur: Vor-Parlaments-Analyse (Dokument ohne Drucksache)

**Zweck.** Schritt-für-Schritt, wie wir ein Regierungs-/Kabinettsdokument analysieren, **bevor** es
als Drucksache existiert (Haushaltsentwurf nach Kabinettbeschluss, große Kabinettsvorlagen, ggf.
Referentenentwürfe) — Frühindikator-Prinzip wie beim Kommissions-Tracker, aber mit zwei
Besonderheiten: die Quelle ist (noch) **nicht amtlich publiziert**, und es gibt eine
**Abgleich-Pflicht**, sobald die amtliche Fassung erscheint.

**Abgrenzung.** Schwester-Prozedur zu [[PROZEDUR-kommissionsbericht.md]] — deren Kern-Prinzipien
gelten unverändert (kein Zwangsschema · manuell statt LLM-Fließband [[feedback_checke_heisst_manuell]]
· zu jedem Trend der Grund [[feedback_trend_immer_grund]] · Zahlen in Klartext
[[feedback_consumer_scan_first]]). Hier steht nur, was ZUSÄTZLICH nötig ist.

> **Referenz-Implementierung (zum Klonen):** Bundeshaushalt 2027 —
> Seite `src/app/analyse/haushalt-2027/page.tsx` · geteilte Aufmacher-Bausteine
> `src/components/AnalyseAufmacher.tsx` (TheseKachel/TheseZahl, WenEsTrifftKachel,
> KennzahlKachel, QuelleKarte; dieselben Komponenten wie die Kommissions-Detailseite) ·
> Wächter `scripts/check-haushalt-2027.ts` · Startseiten-Anbindung `aufmacher_pick.analyse_url`.
> Entstanden 07.07.2026 (Commits 6243163 + 4f21b1e + e097d8c).

---

## Stufe 0 — Lohnt es? (Anlass prüfen)

Zwei Bedingungen müssen BEIDE gelten:
1. **Hohe Salienz:** Thema ist Aufmacher-Kandidat (Salienz-Ranking, viele Outlets) und die
   Berichterstattung läuft der amtlichen Verfügbarkeit voraus.
2. **Amtlich existiert nichts:** DIP geprüft (`f.zuordnung=BR` **und** `BT`, Titel-Suche über
   jüngste Drucksachen), einschlägiges Fachportal geprüft (Haushalt: `bundeshaushalt.de`
   `/internalapi/config` — Jahresliste), Ministeriums-Seite gesichtet (oft Radware-Bot-Schutz —
   NICHT umgehen, manuell schauen).

Wenn amtlich schon etwas da ist → normale Pipeline bzw. Kommissions-SOP, nicht diese Prozedur.

## Stufe 1 — Quelle beschaffen UND verifizieren

Nachrichtenredaktionen haben das Dokument oft im „liegt der Redaktion vor"-Kanal — und manche
legen es öffentlich ab:
- **Suchmuster:** `"<Dokumenttitel>" Entwurf PDF Kabinettvorlage download` (WebSearch);
  Asset-Server der Fachmedien (Fund 07/2026: `table.media/assets/...`), Verbände (erhalten
  Referentenentwürfe zur Stellungnahme), FragDenStaat.
- **Authentizität prüfen, bevor irgendwas gebaut wird:** Briefkopf/Adressat (Kabinettsache →
  „Chef des Bundeskanzleramtes"), Datenblatt-Nr./GZ, Datum, Seitenumfang plausibel (Haushalt:
  1.655 S.), Stichproben-Zahlen gegen die offizielle PR (BMF-Pressemitteilung) — Abweichung =
  Finger weg.
- **Herkunft dokumentieren** (URL, Fassung, Datum) — sie wird auf der Seite ausgewiesen, nicht
  versteckt.

**User-Entscheid einholen:** Analyse aus nicht-amtlicher Fassung ist eine Methodik-Entscheidung
(transparent gelabelt vs. konservativ warten). 07/2026: User entschied „jetzt, transparent".

## Stufe 2 — Substrat wählen (nicht alles lesen)

Große Zahlenwerke haben eine Lese-Hierarchie. Beim Haushalt: **Anschreiben** (28 S. = der ganze
politische Kern: Prioritäten, Konsolidierung, Politikbereiche) + **Übersichts-Anlagen**
(Einzelplanübersichten Einnahmen/Ausgaben/VE, Bereichsausnahme-Rechnung, Finanzplan-Gesamtübersicht).
Die 1.600 Seiten Einzelplan-Details sind Stoff für die Zeit NACH der amtlichen Publikation
(bzw. maschinenlesbare Portal-Daten). Extraktion: pypdf in den Scratchpad, dann **selbst lesen**.

## Stufe 3 — Analyse-Register (zusätzlich zur Kommissions-SOP)

Für Zahlenwerke gilt über die Kommissions-Prinzipien hinaus:
- **Mechanik erklären, nicht nur Zahlen zeigen.** Die stärkste Sektion der Haushalts-Analyse ist
  „Wie passen 203,7 Mrd. neue Schulden zur Schuldenbremse?" — Regelwerk + Wege daran vorbei.
- **Umbuchungs-Warnung:** Prozent-Bewegungen je Einzelplan können Verlagerungen sein
  (Verkehr → SVIK/Epl. 14), keine Kürzungen. Immer prüfen und explizit sagen.
- **Eigenbefunde suchen** — Regel vs. Realität ist die ergiebigste Frage: Stellenabbau-Regel vs.
  Netto-Stellenaufbau; „zulässige NKA exakt auf den Euro ausgeschöpft"; Einnahmen aus noch nicht
  beschlossenen Gesetzen als „Globale Mehreinnahme".
- **„Wen es trifft" in BEIDE Richtungen** (Ausweitung UND Kürzung/Belastung) — Ampel zeigt, Leser
  urteilt. [[feedback_neutralitaet]]

## Stufe 4 — Seite bauen

- Route: `/analyse/<slug>` (z.B. `/analyse/haushalt-2027`).
- **Bausteine aus `AnalyseAufmacher.tsx` verwenden, nie nachbauen** [[feedback_reuse_real_component]]:
  TheseKachel + TheseZahl (EINE Hero-Zahl), WenEsTrifftKachel, KennzahlKacheln (4–6),
  QuelleKarte am Ende. Grid des Aufrufers wie in der Komponenten-Doku.
- **PFLICHT: prominente Herkunfts-Box** (amber, direkt unter dem Header): Fassung + Datum +
  Fundort-Link + Satz „amtliche Drucksache folgt — wir gleichen dann ab".
- Dokumentspezifische Tiefe (Tabellen, Mechanik-Sektionen) frei gestalten — kein Zwangsschema.
  Lange Kataloge eingeklappt (`<details>`, Kommissions-Muster).
- Methodik-Fußnote: was gelesen wurde (Fundstellen), manuell/kein LLM, Rundungshinweis.
- **Inhalt lebt im Code (TSX), nicht in der DB** — bewusst anders als Kommissionen: Einzelstück
  statt Serie, versioniert im Git, kein Deploy-DB-Mitnahme-Problem.
- Falle: deutsche Anführungszeichen in TS-Strings — `„X"` mit ASCII-Schlusszeichen bricht den
  Parser, immer `„X“` (U+201E/U+201C).

## Stufe 5 — Anbindung an die Startseite

Aufmacher-Pick um `analyse_url` ergänzen (Picker-Feld „Analyse-Pfad") → die Startseiten-Karte
rendert die „Unsere Analyse"-Box. Kette komplett: Summary + Quell-Artikel → Unsere Analyse →
Parteienvergleich.

## Stufe 6 — Abgleich-Pflicht (macht die Vorab-Analyse seriös)

- **Wächter aufsetzen** (Muster `check-haushalt-2027.ts`): prüft im 6h-Salienz-Lauf DIP (BR+BT,
  Titel-Regex) + Fachportal; meldet EINMALIG per Mail (Dedupe-Tabelle `wachposten_gemeldet`).
- Wenn die amtliche Fassung erscheint: Zahlen stichprobenartig abgleichen, QuelleKarte auf das
  amtliche Dokument umstellen, Herkunfts-Box entschärfen („abgeglichen mit BT-Drs …"), Wächter-
  Script löschen. Erst damit ist die Analyse „fertig".

---

## Lehren / Fallen

- **Scratchpad ist flüchtig:** PDF + Extrakte dort überleben die Session nicht. Der dauerhafte
  Verweis ist die Quell-URL auf der Seite; das Original NICHT ins Repo (13 MB, Urheber-/
  Publikationsweg unklar) — die amtliche Fassung kommt ohnehin.
- **Bot-Schutz nicht umgehen** (BMF/Radware): inoffizielle Spiegel oder warten.
- **PR-Zahlen nie als Quelle** — nur zur Plausibilisierung der Dokument-Echtheit.
- Kein-Anker/Kein-Dokument ist der **Normalfall** bei Tagesthemen — diese Prozedur lohnt nur bei
  Dokumenten mit Gewicht (Haushalt, große Reformpakete), nicht für jede Kabinettsmeldung.

*Angelegt 2026-07-07 (Haushalt-2027-Analyse). Additiv — ersetzt nichts. [[feedback_procedures_additive]]*
