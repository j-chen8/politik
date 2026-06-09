# Themen-Unterthemen — Design & Pilot Wirtschaft (Arbeitsdokument)

> **Zweck:** Wort-für-wort-Sicherung der Methoden-Diskussion + des ersten manuellen
> Analyse-Durchgangs zum Modell-B-Unterthemen-Layer (User-Auftrag 2026-06-08:
> „Speicher erstmal wort für wort"). Setzt auf `docs/themen-granularitaet-research.md`
> (deep-research 2026-06-07) auf. Gehört zum Themenfelder-/Homepage-Track.
>
> Status: **manueller Discovery-Lauf begonnen** (60 Wirtschaft-Drucksachen gelesen),
> LLM-Lauf-Konfiguration noch nicht finalisiert. Nächste Schritte am Ende.

---

## Ausgangslage (Material)

`topic_tag_map`: **29 `aw_fields`** (28 echte + `UNKLAR`), **2.606 Roh-Tags**.

Felder nach Volumen (Top, `SUM(occurrences)`):

| aw_field | tags | items |
|---|---|---|
| Raumordnung, Bau- und Wohnungswesen | 45 | 11.451 |
| Verkehr | 30 | 7.304 |
| Staat und Verwaltung | 112 | 6.453 |
| Öffentliche Finanzen, Steuern und Abgaben | 153 | 4.782 |
| Gesellschaftspolitik, soziale Gruppen | 91 | 4.325 |
| Innere Sicherheit | 88 | 4.255 |
| Bildung und Erziehung | 21 | 4.044 |
| Umwelt | 27 | 3.154 |
| Soziale Sicherung | 105 | 2.986 |
| Politisches Leben, Parteien | 490 | 2.661 |
| Recht | 104 | 2.248 |
| Migration und Aufenthaltsrecht | 154 | 2.241 |
| Medien, Kommunikation und Informationstechnik | 61 | 2.216 |
| **Wirtschaft** | **100** | **2.083** |
| Gesundheit | 64 | 1.999 |
| Arbeit und Beschäftigung | 81 | 1.595 |
| Außenpolitik und internationale Beziehungen | 353 | 1.506 |
| Energie | 63 | 1.185 |
| Kultur | 8 | 1.046 |
| Verteidigung | 157 | 731 |
| Sport, Freizeit und Tourismus | 3 | 511 |
| UNKLAR | 38 | 345 |
| Europapolitik und Europäische Union | 48 | 329 |
| Entwicklungspolitik | 8 | 267 |
| Landwirtschaft und Ernährung | 17 | 250 |
| Wissenschaft, Forschung und Technologie | 39 | 231 |
| Bundestag | 94 | 142 |
| Außenwirtschaft | 30 | 43 |
| Neue Bundesländer | 22 | 26 |

**Datenpfade:**
- `item_topics (source, item_id, aw_field, querschnitt, origin)` mappt Items → Feld.
- Wirtschaft-Items: **1.031 Drucksachen + 1.942 Reden** (+ 75 Medien, 3 Votes).
- Drucksachen-Text/Signal: `drucksache_analyses.zusammenfassung` / `.thema` / `.kerninhalt`.
- Reden-Signal: `speech_summaries.zusammenfassung` (Reden nutzen `speech_analyses_v2`-Schema).

---

## Strukturelle Klärung: drei Ebenen, nicht zwei

Die Research sagt **~7–12 Oberthemen** an der Oberfläche. Wir haben **28 `aw_fields`** —
die können also *nicht* die sichtbaren Oberthemen sein. De facto drei Ebenen:

| Ebene | Anzahl | Quelle |
|---|---|---|
| Sichtbare **Oberthemen** | ~10–12 | muss gebildet werden (Gruppierung der 28 Felder) |
| `aw_field` | 28 | existiert (abgeordnetenwatch) |
| **Modell-B-Unterthemen** | ~120 (Obergrenze, kein Soll!) | **zu bauen** (m:n zu Feldern) |
| Roh-Tags | 2.606 | existiert (`topic_tag_map`) |

---

## Strategischer Brainstorm (verbatim)

### Was das eigentliche Problem ist

Die Daten verschieben das Problem. Unterthemen *erfinden* ist billig — das kann ich in einer
Stunde für alle 28 Felder. Der teure, unsichere Teil ist ein anderer:

> **1665 von 2083 Wirtschaft-Items tragen nur den generischen Tag „Wirtschaft".** Kein Item
> ist heute mit einem sinnvollen Unterthema gelabelt.

Das heißt: Egal welche Fein-Liste wir designen — sie ist nur ein **Ziel-Schema**, das leer
ist. Erst eine LLM-Re-Klassifikation füllt es. Die offene Frage ist also nicht „welche 120
Labels", sondern **„kann ein LLM diese 1665 generischen Items überhaupt sauber auf
Unterthemen aufteilen?"** Das ist das Risiko, das man zuerst killen muss.

### Wo die Planung hinterfragt wird

**1. Das „~120"-Ziel ist eine Falle.** Die Research nennt 120 als *Obergrenze/Interpolation*,
nicht als Soll. Wenn ich auf 120 hinoptimiere, baue ich Unterthemen mit 2 Items (z.B.
„Kartellrecht" = 5 Vorkommen) — leere Browse-Knoten, die genau gegen „moderate breadth +
Scent" verstoßen. **Designtreiber muss Volumen sein, nicht die Zahl 120.** Lieber 70 gut
gefüllte als 120 halbleere.

**2. „Erst alle 28 Felder, dann Pilot" hat die Risiko-Reihenfolge falschrum.** So designst du
120 Unterthemen, *bevor* du weißt, ob die Methode trägt. Zeigt der Pilot, dass das LLM die
generischen Items nicht trennen kann, war die 28-Felder-Arbeit umsonst.

### Die größere Frage (User-Entscheidung)

Brauchen wir die 120er-Ebene *überhaupt*? Billigere Alternative, die heute schon funktioniert:

> **10–12 gruppierte Oberthemen → die 28 `aw_fields` SIND die „Unterthemen" → fertig.** Keine
> neue Ebene, keine LLM-Re-Klassifikation, weil die Items schon auf Felder gemappt sind.

Der einzige Grund, die 120er-Ebene zu bauen: wenn „Wirtschaft" als *ein* Knoten mit 2083 Items
zu grob ist — wenn Leute „Mittelstand", „Industrie", „Verbraucherschutz" getrennt browsen
wollen, und wenn die Serendipitäts-Fläche feinere Knoten braucht. Plausibel, aber eine
**Produktwette**, kein Automatismus. Der Wirtschaft-Pilot beantwortet sie.

### Reihenfolge-Vorschlag

**Schritt 1: Wirtschaft-Pilot als ENTSCHEIDUNGS-Experiment** (nicht „kleiner erster Schritt"):
- 5–7 Unterthemen für Wirtschaft designen, gegroundet in den Tag-Köpfen
- LLM klassifiziert die ~2083 Wirtschaft-Items multi-label dagegen (~$0,30, Kosten-OK vorher)
- **Erfolgskriterien vorab festnageln** (sonst maskiert „lief durch" als „funktionierte"):
  - „Sonstiges"-Quote < ~15 % (sonst Taxonomie zu lückig)
  - kein Unterthema frisst > 40 % (sonst Split sinnlos)
  - jedes designte Unterthema kriegt nennenswertes Volumen
  - Stichproben-Präzision an ~20 Items von Hand geprüft

Beantwortet beide Fragen in einem Schritt: Trägt die Methode? Und: Ist die 120er-Ebene die
Mühe gegenüber „28 Felder reichen" wert?

**Schritt 2 (nur wenn Pilot besteht): Multi-Agent-Workflow für die übrigen 27 Felder.** Dann
ist der Workflow das richtige Werkzeug — 27 unabhängige Einheiten, ein Agent pro Feld nach dem
im Pilot bewährten Muster, plus Quer-Dedup. Jetzt wäre er verfrüht.

---

## Tiefe & Verschachtelung — geklärt (verbatim)

User-Idee war: „Wirtschaft → KI → Deepfake" oder „Wirtschaft → Energie → Gas, Solar" — wie
tief splitten, wie weit ist zu weit?

**Zwei Denkfehler in der Skizze, geradegezogen:**

**a) „Energie" und „KI" sind keine Unterthemen von Wirtschaft — sie sind eigene Felder.**
Energie ist ein eigenes `aw_field` (1.185 Items), KI/Deepfake gehört zu „Medien, Kommunikation
und IT". Hängt man Energie *unter* Wirtschaft, zählt man doppelt und bricht das m:n-Modell. Das
„mag Wirtschaft → sieht Energie → klickt" ist die **„verwandte Themen"-Fläche** (Research-
Befund 9/10) — *Querverlinkung*, nicht *Verschachtelung*.

**b) Tiefe-3 zum Browsen ist durch unsere eigene Research kontraindiziert.** Larson &
Czerwinski (Befund 8): „minimum depth, maximum breadth — expandable indexes only at depth 2–3",
und mehr Tiefe **schadet** der Such-Performance. Drei navigierbare Ebenen (Wirtschaft → Energie
→ Gas) ist genau das, wovor das Material warnt.

**Auflösung — zwei verschiedene Dinge, die nicht vermischt werden dürfen:**

| | Was | Tiefe |
|---|---|---|
| **Navigation** (was der User klickt) | Oberthema → Unterthema | **max. 2 Ebenen, hart** |
| **Klassifikation/Facette** (wie fein intern gelabelt) | Gas · Solar · Wind unter „Energiewende & Stromerzeugung" | beliebig fein, aber **flache Facette/Filter**, nicht 3. Klick-Ebene |

Gas/Solar/Wind *dürfen* existieren — als flache Filter-Tags unter einem Unterthema oder schlicht
als Suchbegriffe. Sie werden nur nie zur dritten Navigationsstufe. Feinheit ohne Tiefen-Strafe.

### Ehrlich zu „keine weiteren Läufe"

„Genau 1 Lauf" ist nicht garantierbar — aber wir können **für „1 Lauf + 1 billiger Korrektur-
Batch" designen**. Der `Sonstiges`-Flag aus Lauf 1 *ist* die Lückenliste: < 15 % → durch;
höher → Taxonomie patchen und **nur die Sonstiges-Items** re-klassifizieren (Cent-Beträge).
One-and-done machen vier Dinge, die alle aus der manuellen Analyse fallen:
1. **Geschlossene Unterthemen-Liste** (kein Freitext mehr fürs LLM)
2. **Klare Multi-Label-Regeln** (E-Auto-Förderung = Wirtschaft + Verkehr + Energie + Umwelt)
3. **Few-Shot-Beispiele** aus real gelesenen Items
4. **Definierter `Sonstiges`-Begriff** als Auffangventil

---

## Manueller Discovery-Lauf #1 — Wirtschaft (60 Drucksachen gelesen)

### Befund 1: Fast alles ist Multi-Feld — schon im Bestand

Die `thema`-Spalte der echten Items ist durchgängig multi-topic:
- KI-Gigafactory → `Digitalisierung, Energie, Wirtschaft`
- E-Auto/Bahn → `Verkehr, Energie, Wirtschaft`
- Lieferkettengesetz → `Wirtschaft, Menschenrechte, Arbeitsmarkt`
- Zoll-Deal USA → `Außenpolitik, Wirtschaft, Steuern`

Reine „nur-Wirtschaft"-Items sind die Ausnahme. Multi-Label ist nicht optional, **und** etliche
„Wirtschaft-Unterthemen" sind in Wahrheit Cross-Feld-Cluster (KI-Wirtschaft, Energiewirtschaft,
Außenhandel).

### Befund 2: Tiefe — Ebene 2 trägt das Volumen, Ebene 3 ist Staub

Aus den 60 Items fallen für Wirtschaft ~10 natürliche **Ebene-2-Cluster** (Kandidaten):

| # | Unterthema (Ebene 2) | Cross-Feld |
|---|---|---|
| 1 | Industrie- & Standortpolitik (Wettbewerbsfähigkeit, Ansiedlung, Deindustrialisierung) | — |
| 2 | Außenhandel, Zölle & kritische Rohstoffe | Außenpolitik |
| 3 | Digital- & KI-Wirtschaft (Rechenzentren, Gigafactories, Cloud-Souveränität) | IT |
| 4 | Energiewirtschaft & Energiekosten (Strompreise, Gasversorgung, Förderung) | Energie |
| 5 | Lieferketten- & Unternehmensverantwortung (LkSG) | Arbeit, Recht |
| 6 | Wirtschaftsförderung & Subventionen (Bürgschaften, Sondervermögen) | Finanzen |
| 7 | Mittelstand, Handwerk & Gründung | — |
| 8 | Fachkräfte & Arbeitsmarkt-Wirtschaft | Arbeit, Migration |
| 9 | Verbraucherschutz | — |
| 10 | Konjunktur, Wachstum & Gesamtsteuerung (FSP) | Finanzen |

**Tiefe-Test an #4 Energiewirtschaft:** Split in Strompreise / Gasversorgung / Förderprogramme /
E-Fuels? Im Material je **2–6 Items** → leere Browse-Knoten → genau Over-Categorization
(Befund 4) und „depth hurts" (Befund 8). **Ebene 3 ist hier nachweislich Facette, nicht
Navigation.**

→ **Empirische Tiefe-Regel:** 2 navigierbare Ebenen (Oberthema → Unterthema). Was darunter
liegt (Gas/Solar/Wind), wird flacher Filter-Tag, kein dritter Klick. Am echten Material
bestätigt.

### Befund 3 (Spar-Hebel): Wir haben das Signal vielleicht schon

Das `thema`-Feld aus `drucksache_analyses` ist **viel reicher** als die `topic_tag_map`-Tags —
bereits multi-topic und sauber. Bevor wir einen *vollen* neuen LLM-Lauf zahlen, prüfen:
**Lässt sich die Unterthemen-Zuordnung der Drucksachen größtenteils aus dem vorhandenen
`thema`-Feld ableiten?** Dann bräuchte der LLM-Lauf nur noch (a) die Reden (anderes Schema) und
(b) die Lücken — deutlich billiger.

### Befund 3 — QUANTITATIV GEMESSEN (2026-06-08, DB-Auswertung, kostenlos)

`thema`-Abdeckung Wirtschaft-Drucksachen: **1031/1031 = 100 %** (kein NULL).

Token-Frequenz `thema` über die 1031 Wirtschaft-Drucksachen (gesplittet, Top):
`Wirtschaft` 839 · `Verbraucherschutz` 237 · `Energie` 215 · `Finanzen` 209 ·
`Arbeitsmarkt` 136 · `Digitalisierung` 131 · `Klimaschutz` 126 · `Innere Sicherheit` 101 ·
`Landwirtschaft` 98 · `Außenpolitik` 79 · `Steuern` 69 · `Gesundheit` 68 · `Europa` 68 ·
`Umweltschutz` 67 · `Verwaltung` 63 · `Bürokratie` 50 · `Forschung` 48 · `Justiz` 43 …

Gegenprobe an 2 weiteren Feldern (Robustheit) → **gleiches Bild, gleiches Vokabular:**
- *Innere Sicherheit:* `Innere Sicherheit` 1263 · `Justiz` 300 · `Migration` 233 · `Extremismus` 196 · `Finanzen` 135 · `Außenpolitik` 134 …
- *Energie:* `Energie` 528 · `Klimaschutz` 217 · `Wirtschaft` 208 · `Umweltschutz` 76 · `Verkehr` 67 · `Finanzen` 66 …

**ERGEBNIS — der Spar-Hebel trägt NICHT (für die Unterthemen-Achse):** Das `thema`-Feld ist
durchgängig **Feld-Level**, dasselbe Vokabular wie die `aw_fields` — eine *zweite
Mehrfeld-Klassifikation*, KEIN Intra-Feld-Unterthemen-Signal. Es trennt NICHT
„Industriepolitik vs. Mittelstand vs. Außenhandel" innerhalb von Wirtschaft. Von den 10
manuell gefundenen Ebene-2-Clustern ist exakt **einer** direkt als `thema`-Token wiederfindbar
(*Verbraucherschutz* 237); der Rest fehlt oder existiert nur als Cross-Feld-Überlappung
(z.B. „Wirtschaft-Item, das auch Energie berührt" ≠ Unterthema „Energiewirtschaft").

→ **`thema` kann den LLM-Unterthemen-Lauf NICHT ersetzen.** ABER es liefert gratis etwas
anderes: die **Cross-Feld-„verwandte Themen"-Fläche** (Research-Befund 9/10) ist bereits
berechnet und gut gefüllt — Wirtschaft → {Energie 215, Finanzen 209, Verbraucherschutz 237,
Arbeitsmarkt 136, Digitalisierung 131, …}. Das ist ein populierter, neutraler, Null-Kosten-
Browse-/Querverweis-Layer, der schon heute steht.

### Daraus geschärfte Entscheidung: ZWEI verschiedene Sub-Layer-Achsen

Die Messung legt offen, dass es zwei Kandidaten für „was unter Wirtschaft hängt" gibt — die
bisher vermischt wurden:

| | Achse A: **Cross-Feld-Überlappung** | Achse B: **Intra-Feld-Unterthema** |
|---|---|---|
| Beispiel | Wirtschaft → Energie / Finanzen / Verbraucherschutz | Wirtschaft → Industriepolitik / Mittelstand / Außenhandel |
| Quelle | `thema`-Feld (existiert) | manueller Discovery → **neuer LLM-Lauf** |
| Kosten | **0 €**, sofort | ~0,30 € Pilot + Risiko (trennt LLM die 1665 generischen Items sauber?) |
| Füllung | gut gefüllt (Volumen je Knoten 50–240) | gemischt; etliche Cluster dünn (#4-Split 2–6 Items) |
| Was es ist | die „verwandte Themen"-Fläche (Research 9/10) | der eigentliche Modell-B-Tiefen-Split |
| Schwäche | kein echter Split *innerhalb* Wirtschaft; „Mittelstand" nicht abbildbar | Produktwette, ob der Nutzer den Split überhaupt will |

**Empfehlung (zu bestätigen):** Achse A ist der billige, sofort-lieferbare *erste* Browse-Sub-
Layer und deckt einen großen Teil dessen ab, wofür man intuitiv die 120er-Ebene wollte. Achse B
(LLM-Lauf) erst bauen, wenn ein konkreter Bedarf belegt ist, den A nicht deckt
(„ich will Mittelstand/Industriepolitik getrennt browsen"). Das verschiebt die teure Wette nach
hinten und liefert sofort einen echten Sub-Layer. **Der Wirtschaft-Pilot bleibt das saubere
Entscheidungs-Experiment** — aber die Frage ist jetzt präziser: *Reicht Achse A, oder rechtfertigt
ein konkreter Bedarf Achse B?*

### Roh-Tag-Bild Wirtschaft (zur Erinnerung, warum Tags allein nicht reichen)

`Wirtschaft` 1665 · `Verbraucherschutz` 246 · `Wirtschaftspolitik` 34 · `Industriepolitik` 8 ·
`Automobilindustrie` 6 · `Mittelstandspolitik` 6 · `Kartellrecht` 5 · … langer 1er-Schwanz
(LLM-Einzelerfindungen wie „CEO-Vergütung-Regulierung"). Kopf zu generisch, Schwanz zu dünn.

---

## Nächste Schritte (offen, beim Wiederaufnehmen)

1. ~~**~60–80 Items quer lesen**~~ — Discovery #1 (60 Drucksachen) reicht für die Cluster-Skizze.
2. ✅ **Befund 3 quantitativ geprüft** (2026-06-08): `thema` ist Feld-Level, KEIN Unterthemen-
   Signal → ersetzt den LLM-Lauf nicht, liefert aber die Cross-Feld-Fläche (Achse A) gratis.
3. **ENTSCHEIDUNG zuerst (User):** Achse A (gratis, Cross-Feld) als erster Sub-Layer — reicht das,
   oder gibt es belegten Bedarf für Achse B (LLM-Intra-Feld-Split)? Siehe Tabelle oben.
4. Nur falls Achse B: geschlossene Unterthemen-Liste + Multi-Label-Regeln + Few-Shots +
   Sonstiges-Definition + Erfolgskriterien festnageln, dann Kosten-OK (~$0,30 Wirtschaft-Pilot).

**Offene Entscheidungen für den User:**
- **Achse A vs. Achse B** (neu, nach der Messung) — der eigentliche Hebel. Reicht der gratis
  Cross-Feld-Layer aus `thema` als Browse-Sub-Ebene, oder lohnt der LLM-Lauf für echten
  Intra-Feld-Split?
- Falls Achse B: Erfolgskriterien des Pilots wie oben festnageln, bevor der Lauf startet.

---

## Architektur-Wende: Baum → Baum + Verbindungsnetz (2026-06-08)

User-Frage, die alles schärft: „Kann man die spezifischen Themen (KI, Krypto, Deepfake …)
*wieder verbinden*?" Antwort aus den Daten: **ja — sie sind es von Natur aus.**

Gemessen, womit sich spezifische Tech-Tags verbinden (thema-Tokens ihrer Items):
- **KI** → Digitalisierung 101 · Wirtschaft 29 · Forschung 24 · Datenschutz 24 · Außenpolitik 21
  · Arbeitsmarkt 20 · Energie 18 · Innere Sicherheit 17 · Gesundheit 15 · Bildung 14 · Justiz 13
  (= quer durch **alle** Felder).
- **Cybersicherheit** → Innere Sicherheit **58** · Digitalisierung 51 · Verteidigung 13 ·
  Datenschutz 11 · Wirtschaft **7**. → Cyber ist *primär* Innere Sicherheit, Wirtschaft nur Neben-
  anschluss; ein reiner Baum unter „Digital-Wirtschaft" würde es **falsch einsortieren**.

**Konsequenz — die spezifischen Tags sind kein Baum, sondern ein Netz:** Ein Tag wie „KI" ist
kein Blatt unter einem Oberthema, sondern ein **Knotenpunkt mit mehreren Eltern**, der Felder
*verbindet*. Das ist exakt die „verwandte Themen"/Serendipitäts-Fläche der Research (Befund
9/10) — und sie ist **neutral by design** (nur reales Mit-Vorkommen, kein Etikett).

**Architektur, die daraus folgt:**
| Schicht | Form | Zweck |
|---|---|---|
| Navigation | flacher **Baum**, 2 Ebenen (Oberthema → Unterthema) | Orientierung, kein Verlaufen |
| Spezifische Tags | **Netz** darübergelegt (Mehr-Eltern, querverbunden) | Tiefe + Entdeckung |

**Der Clou: die Kanten kosten nichts extra.** Sobald der LLM-Lauf pro Item die spezifischen
Tags vergeben hat, fallen die Verbindungen (KI↔Gesundheit, Cyber↔Verteidigung) **automatisch
aus dem Mit-Vorkommen** — Korrelation, keine zweite Klassifikation. Tags *einmal* bauen, Graph
rechnet sich selbst.

**Spezifische Tech-Tags (Drucksachen, Keyword-Scan — Beleg, dass die Körnung da ist):**
KI 147 · Cybersicherheit 101 · Startups/VC 65 · Rechenzentren/Cloud 54 · Breitband/Netzausbau 43
· Drohnen 35 · Krypto 29 · Digitale Souveränität 16 · Gigafactory/Batterie 15 · Plattform-Reg. 15
· Halbleiter 14 · Datenökonomie 11 · Digitale Verwaltung/OZG 11 · Open Source 9 · Deepfake 8 ·
Quanten 8 · E-Commerce 5. (Reden verdoppeln grob: Cyber +82, Startups +58, Rechenzentren +45.)
Natürlicher Bruch: **Anker** (≥40, browsbar) strukturieren die Seite; **Nischen** (Deepfake 8 …)
sind Filter-Chips/Story-Haken, nie eigene Seiten.

## Pilot-Plan Wirtschaft (Spike — „versuchen, dann schauen", User-OK 2026-06-08)

**Vorgehen: klein anfangen, anschauen, dann skalieren** (nicht direkt 2.000-Item-Batch). Test der
Kern-Risikofrage: *Kann Haiku ein Item sauber in {Unterthema (geschlossen) + spezifische Tags
(offen)} zerlegen, multi-label, mit Sonstiges-Ventil?*

- **Geschlossene Unterthemen-Liste Wirtschaft** (10 Cluster aus Discovery #1): Industrie- &
  Standortpolitik · Außenhandel, Zölle & Rohstoffe · Digital- & KI-Wirtschaft · Energiewirtschaft
  & -kosten · Lieferketten & Unternehmensverantwortung · Wirtschaftsförderung & Subventionen ·
  Mittelstand, Handwerk & Gründung · Fachkräfte & Arbeitsmarkt-Wirtschaft · Verbraucherschutz ·
  Konjunktur, Wachstum & Gesamtsteuerung. (+ `Sonstiges`.)
- **Spike:** ~40 Wirtschaft-Drucksachen live (Haiku, **< 3 Cent** → unter Batch-Schwelle), Output
  von Hand prüfen.
- **Erfolgskriterien (wie oben):** Sonstiges < 15 % · kein Cluster > 40 % · spezifische Tags
  brauchbar (nicht 1-Item-Erfindungen) · Stichprobe-20 präzise.
- Besteht der Spike → voller Wirtschaft-Batch (~2.000 Items, Batch API). Fällt er → ehrlich
  stoppen bzw. Taxonomie patchen.
