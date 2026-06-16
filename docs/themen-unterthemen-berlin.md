# Themen-Unterthemen Berlin — Arbeits-Doc & Discovery

**Parlament-spezifisches Arbeits-Log** (Pendant zu `docs/themen-unterthemen-design.md` für den Bund).
Folgt der wiederverwendbaren Prozedur `docs/PROZEDUR-themen-unterthemen.md` — hier stehen nur die
**Berlin-Befunde, -Entscheidungen und der Stand**, nicht die allgemeine Methode.

---

## Stufe 0 — Feldstruktur ✅

`src/lib/berlin-themen-struktur.ts` (757afd5): 12 Politikfelder + 4 Querschnitt, aus 47 kontrollierten
`thema_json`-Roh-Tags über 19.449 DS, lückenlos gemappt. **⌀ 2,1 Felder/DS** (nur 21/19.409 in 4+
Feldern) → Berlin hat den BT-`item_topics`-Überzähl-Bug **nicht**; Tag-Rollup ist vertrauenswürdig.

## Stufe 1 — Manueller Discovery-Lauf (läuft)

### Spar-Hebel-Test (gratis, DB-Messung 2026-06-15) — trägt `thema_json` schon ein Intra-Feld-Signal?

**Berlin-Eigenheit gegenüber dem Bund:** Beim BT war das `thema`-Feld durchgängig *Feld-Level* und trug
**null** Intra-Feld-Signal → der Batch war für die Sub-Ebene alternativlos. Berlin ist anders: die
Feldstruktur **bündelt mehrere Roh-Tags pro Feld**, und diese Tags sind bereits ein **grober, GRATIS
verfügbarer Sub-Split**:

| Feld | Tags (= Gratis-Sub-Knoten, mit DS-Zahl) | Gratis-Split? |
|---|---|---|
| Stadtentwicklung, Bauen & Wohnen | Wohnen 2414 · Stadtentwicklung 2353 · Liegenschaften 1727 · Bauplanung 1209 · Wohnungslosigkeit 526 · Denkmalschutz 307 | ✅ 6 |
| Verwaltung & Digitales | Verwaltung 3759 · Digitalisierung 1057 · Datenschutz 273 · Bürokratie 76 | ✅ 4 |
| Mobilität & Verkehr | Mobilität 3512 · Verkehrssicherheit 1445 · ÖPNV 1220 · Radverkehr 516 | ✅ 4 |
| Soziales, Arbeit & Familie | Soziale Infrastruktur 1419 · Familie 1189 · Arbeitsmarkt 843 · Inklusion 777 | ✅ 4 |
| Innere Sicherheit & Justiz | Polizei 1450 · Justiz 913 · Gewaltprävention 641 · Extremismus 455 | ✅ 4 |
| Finanzen & Haushalt | Finanzen 2317 · Haushalt 619 · Steuern 54 | ✅ 3 |
| Umwelt, Klima & Energie | Klimaschutz 1909 · Energie 512 · Tierschutz 354 | ✅ 3 |
| Migration & Integration | Geflüchtete 873 · Integration 563 · Migration 449 | ✅ 3 |
| Bildung & Wissenschaft | Bildung 3320 · Hochschulen 437 | ⚠️ 2 |
| Gesundheit & Pflege | Gesundheit 1423 · Pflege 232 | ⚠️ 2 |
| Kultur & Sport | Kultur 634 · Sport 389 | ⚠️ 2 |
| Wirtschaft & Tourismus | Wirtschaft 825 · Tourismus 87 | ⚠️ 2 |

**Befund:** 8 von 12 Feldern haben 3–6 gebündelte Tags → ein **grober Sub-Level steht ohne jeden
Batch** (z.B. Wohnen-Feld in Wohnen/Stadtentwicklung/Liegenschaften/Bauplanung/Wohnungslosigkeit/
Denkmalschutz). 4 Felder (Bildung, Gesundheit, Kultur, Wirtschaft) sind faktisch 1-Tag-dominiert → da
gibt's gratis fast nichts.

**ABER — der Gratis-Split ist GRÖBER als die DRAFT-Taxonomie.** Beispiel Wohnen-Feld: 6 Tags vs. 9
geplante DRAFT-Unterthemen (*Mietregulierung · Sozialer & landeseigener Wohnungsbau · Bauleitplanung ·
Liegenschaften · Stadtteilentwicklung · Wohnungslosigkeit · Leerstand · Denkmalschutz · Große Projekte*).
Die Tags trennen **nicht** „Mietregulierung vs. sozialer Wohnungsbau" innerhalb von „Wohnen" 2414.

**→ Entscheidung „Vollbatch ja/nein" (Kern dieser Stufe):**
- Ein **kostenloser, grober Sub-Level** ist sofort baubar (gebündelte Tags als Ebene 2) — anders als
  beim Bund. Das könnte für eine erste Version reichen, v.a. bei den 8 mehr-Tag-Feldern.
- Der **LLM-Batch** liefert (a) die **feinere, sauberere** Ebene innerhalb der großen Tags, (b)
  überhaupt eine Sub-Ebene bei den 4 dünnen Feldern, (c) die `kern_im_feld`-Bereinigung der Tag-Unschärfe
  (Verwaltung enthielt in der Stichprobe Taser-/Sportanlagen-Anfragen).
- **Offene Produktwette (wie BT):** Reicht der grobe Gratis-Split für den Berlin-Wahl-Browse, oder will
  der Nutzer die feine Ebene? → an echtem Material zu prüfen (nächster Discovery-Schritt), bevor ~$8–12
  fließen.

### Manuelles Hand-Lesen (Phase A, ~600 Zusammenfassungen quer gelesen)

- **Multi-Feld bestätigt** (deckt sich mit ⌀2,1): eine DS liegt typisch in ~2 Feldern.
- **Tag-Unschärfe sichtbar:** „Verwaltung" hing an Taser- und Sportanlagen-Anfragen → das ist genau das,
  was `kern_im_feld` + Sub-Klassifikation sauberzieht.
- **DRAFT-Taxonomie** (16 Felder × 104 Unterthemen) aus diesem Lesen + den Tags abgeleitet:
  `docs/themen-taxonomie-berlin.md`.

### Offen in dieser Stufe (vor Kosten-Entscheidung)

1. **Tiefe 2-vs-3 an Berlin-Material bestätigen** (BT-Regel: 2 navigierbare Ebenen — für Berlin verproben).
2. **DRAFT-Unterthemen gegen ~40–60 echte DS *eines* großen Felds (Wohnen) von Hand gegenlesen** — halten
   die 9 Wohnen-Unterthemen am Material, oder sind sie zu fein/zu grob?
3. Daraus die belegte Antwort: **grober Gratis-Split genug, oder Batch (welche Achse)?**

## Stufe 2 — Unterthemen-Taxonomie (DRAFT, vorab gebaut, zu bestätigen)

`docs/themen-taxonomie-berlin.md` (SoT) + `scripts/_lib/themen-taxonomie-berlin.ts`. 16 Felder × 104
Unterthemen, Label-Join zu `berlin-themen-struktur.ts` verifiziert. **Status DRAFT** — wird nach dem
Discovery-Lauf (Stufe 1, Punkt 2) bestätigt oder gepatcht.

## Stufen 3–9

Noch offen. Folgen der allgemeinen Prozedur. Zwischenstand UI: ein **kostenloses Level-1-Feld-Grid**
(`/parlamente/berlin/themen`) ist gebaut (Wegwerf-/Interim-Stand, beweist den sauberen Rollup) — wird
durch die echte `VorschauThemen`-Komponente ersetzt, sobald die Sub-Ebene steht.

## Stand-Tabelle

| Stufe | 0 | 1 Discovery | 2 Taxonomie | 3 Kriterien | 4 Spike | 5 Patch | 6 Pilot | 7 Global | 8 Reden | 9 UI |
|---|---|---|---|---|---|---|---|---|---|---|
| Berlin | ✅ | 🔄 läuft | DRAFT | ⬜ | ⬜ | — | ⬜ | ⬜ | ⬜ | Interim-Grid |
