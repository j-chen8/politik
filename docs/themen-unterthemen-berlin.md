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

### Manuelles Hand-Lesen (Phase B — Wohnen-Tiefenlauf, 2026-06-16) ✅

**65 echte Wohnen-DS in der Session von Hand gelesen** (35 `anfrage_antwort` + 30 `antrag`/`gesetzentwurf`/
`vorlage_senat`, über die ID-Spanne verteilt) und gegen die 9 DRAFT-Unterthemen geprüft. Plus quantitative
Keyword-Floor-Zählung über alle 2414 Wohnen-DS, um die Achsen-Größen zu belegen.

**Befund B1 — Multi-Feld bestätigt (deckt ⌀2,1):** Items spannen typisch Wohnen + Migration (modulare
Geflüchteten-Unterkünfte), + Umwelt/Wasser (Abwasser-/Trinkwasser-Erschließung), + Verkehr (Erschließung
Neubau), + Finanzen (Haushalt/Grundsteuer). Multi-Label ist Pflicht, nicht Option.

**Befund B2 — der GRATIS-Tag-Split versagt auf der wichtigsten Achse.** Der eine Tag „Wohnen" (2414 DS)
bündelt undifferenziert genau die politisch saliantesten Berlin-Wahl-Distinktionen. Keyword-Floor über die
2414 DS (echte Werte höher, da nur 300-Zeichen-Summary durchsucht):

| Intra-„Wohnen"-Achse | DS (Floor) | DRAFT-Bucket? |
|---|---|---|
| landeseigene WBG (HOWOGE/degewo/…) | **707** | teils (Sozialer & landeseigener Wohnungsbau) |
| Milieuschutz / Vorkaufsrecht | 93 | ✅ Mietregulierung & Mieterschutz |
| Miethöhe-Regulierung (Index/Deckel/Spiegel) | 56 | ✅ Mietregulierung & Mieterschutz |
| **Kleingärten** | **52** | ❌ **fehlt** |
| Wohnungslosigkeit | 31 | ✅ Wohnungslosigkeit & Obdachlosenhilfe |
| **Enteignung / Vergesellschaftung** (Volksentscheid DW&Co) | **30** | ❌ **fehlt** |
| Wohneigentum / Eigentumsförderung | 15 | ❌ **fehlt** |

→ Die gebündelten Geschwister-Tags (Stadtentwicklung/Liegenschaften/Bauplanung/…) trennen **nicht**
„Mietregulierung vs. sozialer Wohnungsbau vs. Vergesellschaftung vs. Wohneigentum" — die liegen **alle**
im Mega-Tag „Wohnen". Der Gratis-Split ist für das wichtigste Feld nachweislich zu grob.

**Befund B3 — die 9 DRAFT-Unterthemen tragen, aber mit 3 Lücken.** Die meisten der 65 gelesenen DS mappen
sauber auf eines der 9 Unterthemen; gut populiert sind v.a. *Sozialer & landeseigener Wohnungsbau*
(HOWOGE-Gesellschafter-Serie Pätzold, Sozialwohnungs-Neubauziele, WVB-Institution, Privatisierung,
Mietermitwirkung), *Mietregulierung & Mieterschutz* (Vorkauf/Milieuschutz, Indexmieten, § 201a) und
*Bauleitplanung* (B-Pläne, Baubeschleunigungs-Gesetze). **Fehlende Buckets** (am Material belegt):
1. **Vergesellschaftung & Enteignung** (Volksentscheid „DW & Co enteignen", 30+ DS) — Berlin-Spezifikum,
   würde sonst fälschlich in Mieterschutz gezwängt.
2. **Wohneigentum & Eigentumsförderung** (CDU/FDP: Selbstnutzer-Quote, Einfamilienhäuser, Grunderwerbsteuer).
3. **Kleingärten & Laubenkolonien** (Sicherungsgesetz, Kündigungsmoratorium, 52+ DS) — evtl. auch Umwelt/Grün,
   aber im Wohnen-Feld stark vertreten.
→ DRAFT von 9 auf **12** Unterthemen erweitert (siehe `themen-taxonomie-berlin.ts`).

**Befund B4 — Tag-Unschärfe bestätigt, `kern_im_feld` nötig.** ~10/65 gelesene „Wohnen"-DS sind Kern in
einem anderen Feld: Haushaltsgesetz (Finanzen), Gaskosten-Rückerstattung (Finanzen/Energie),
LAP-afghanische (Migration), Arbeitsraum für Künstler (Kultur), Grundsteuergesetz (Steuern),
Abwasser/Trinkwasser ×4 (Umwelt). ≈ 12–15 % Cross-Feld-Rauschen → `kern_im_feld`-Flag + scharfe
Sonstiges-Regel im Prompt sind Pflicht (Stufe 3, Schwelle < 15 %).

**Befund B5 — Tiefe 2, nicht 3.** Innerhalb „Sozialer & landeseigener Wohnungsbau" gibt es Sub-Cluster
(HOWOGE-Gesellschafterfragen, Neubau-Ziele, Privatisierung, WVB, Mietermitwirkung), aber mehrere mit nur
2–6 Items → flacher Filter-Tag, kein dritter Klick. BT-Regel **2 navigierbare Ebenen** am Berlin-Material
bestätigt.

### Befund & Entscheidung Stufe 1 (★ Kern dieser Stufe)

**Vollbatch: JA — auf Achse B (echtes Intra-Feld-Unterthema), gestaffelt.** Belegt durch B2: der gratis
verfügbare Tag-Split kann die wichtigsten Wohnungspolitik-Distinktionen nicht leisten, weil sie im einen
2414-DS-Mega-Tag „Wohnen" kollabieren. Für das wahlentscheidende Feld ist der LLM-Lauf die einzige Quelle
der saliantesten Achse. Die DRAFT-Taxonomie hält (nach +3 Buckets), die Cross-Feld-Unschärfe ist mit
`kern_im_feld` beherrschbar.

- **Nächster Schritt (gratis):** Stufe 3 — Erfolgskriterien festnageln. (Stufe 2 Taxonomie: DRAFT auf 12
  Unterthemen gepatcht, Label-Join zu prüfen.)
- **Erster kostenpflichtiger Schritt (braucht Kosten-OK):** Stufe 4 Spike Wohnen, Haiku live, ~$0,10
  (BT-Realität: Schätzungen ~3× zu optimistisch → real messen). Dann Pilot Wohnen ~$1–3, dann global ~$8–12.
- **Offene Produktwette bleibt beim User:** Global lohnt v.a. die 8 mehr-Tag-Felder; die 4 dünnen Felder
  (Bildung/Gesundheit/Kultur/Wirtschaft) bekommen durch den Batch erst überhaupt eine Sub-Ebene.

## Stufe 2 — Unterthemen-Taxonomie (DRAFT, vorab gebaut, zu bestätigen)

`docs/themen-taxonomie-berlin.md` (SoT) + `scripts/_lib/themen-taxonomie-berlin.ts`. 16 Felder × 104
Unterthemen, Label-Join zu `berlin-themen-struktur.ts` verifiziert. **Status DRAFT** — wird nach dem
Discovery-Lauf (Stufe 1, Punkt 2) bestätigt oder gepatcht.

## Stufe 3 — Erfolgskriterien (vorab-registriert, 2026-06-16) ✅

Festgenagelt **vor** dem ersten LLM-Call (Pilot-/Spike-Feld = **Wohnen**, 2414 DS). Erwartungswerte aus
dem Discovery-Tiefenlauf (Phase B) abgeleitet — wird die Realität deutlich abweichen, ist das selbst ein
Befund.

**Sonstiges-Definition (Auffangventil, scharf):** Ein Item gehört in *Sonstiges*, wenn (a) sein Kern
**nicht** im Feld Stadtentwicklung/Bauen/Wohnen liegt (→ `kern_im_feld=false`, z.B. Haushaltsgesetz =
Finanzen, LAP-afghanische = Migration, Abwasser = Umwelt) **oder** (b) es im Feld liegt, aber zu keinem
der 12 Unterthemen passt. **Nie** ins nächstklingende Cluster zwingen (BT-Kern-Schwäche Lauf 1).

| Kriterium | Schwelle | Berlin-Erwartung (aus Discovery) |
|---|---|---|
| Sonstiges-Quote auf **Kern-Items** (`kern_im_feld=true`) | **< 15 %** | 12 Buckets decken breit → erwartet < 10 % |
| `kern_im_feld=false`-Quote (Cross-Feld) | (kein Cap, nur messen) | ~12–15 % (B4: Finanzen/Migration/Umwelt) |
| Größter Kern-Cluster eines Felds | **< 40 %** | *Sozialer & landeseigener Wohnungsbau* dominiert (landeseigene WBG allein 707/2414 ≈ 29 %) → grenzwertig, beobachten |
| Spezifische Tags | entity-artig, **keine 1-Item-Erfindungen** | — |
| Hand-Stichprobe (n≈20–25) Präzision | **~85 %+** | — |
| `kern_im_feld`-Flag wirkt | fängt Cross-Feld-Items als Sonstiges | Pflicht ab Lauf 1 (B4) |

**Pre-Mortem (was den Spike kippen würde):**
- Sonstiges-Ventil bleibt ungenutzt (0 %) → Cross-Feld-Items werden gezwängt = **BT-Lauf-1-Pathologie**.
  Gegenmittel ist eingebaut (scharfe Regel + Flag ab Lauf 1), nicht erst im Patch.
- *Sozialer & landeseigener Wohnungsbau* > 40 % → ggf. splitten (z.B. „Landeseigene WBG: Neubau & Ziele"
  vs. „… Bestandspolitik & Mietermitwirkung") — erst am Spike-Output entscheiden, nicht spekulativ.

## Stufe 4 — Spike Wohnen ✅ BESTANDEN (2026-06-16, $0,134 Haiku-Live, kein DB-Write)

`scripts/spike-wohnen-unterthemen.ts` + Lib `scripts/_lib/unterthemen-wohnen-berlin.ts` (12 Unterthemen aus
der Taxonomie + Sonstiges, `kern_im_feld`-Flag + scharfe Sonstiges-Regel **ab Lauf 1**). 40 DS (`dbid DESC`),
von Hand gegen die Stufe-3-Scorecard geprüft. Log: `aw-spike-wohnen-20260616.log`.

| Kriterium | Schwelle | Spike-Lauf 1 | |
|---|---|---|---|
| Hand-Präzision (n=40) | ~85 %+ | **~93 %** (37–38/40) | ✓ |
| Sonstiges auf Kern-Items | < 15 % | **0 %** (0/38) — jedes Kern-Item fand ein Bucket | ✓ |
| Sonstiges gesamt / Ventil benutzt? | > 0 % | **5 %** (2/40), beide korrekt `kern=false` | ✓ **kein** BT-Lauf-1-Versagen |
| `kern_im_feld=false` | nur messen | 5 % (2/40) — Wasserbetriebe-Gebühren, Wohngeld-Bearbeitung | ✓ Flag wirkt |
| Größter Kern-Cluster | < 40 % | 45 % (Soz. & landeseig. Wohnungsbau) | ⚠ **Sampling-Artefakt** |
| Tags entity-artig | keine Erfindungen | 110 distinkt / 92 Einzel — aber Adressen/Projekt-/Gesetzes-Eigennamen, keine Satz-/Feld-Erfindungen | ✓ |

**Befund S1 — die Taxonomie hält, die vorinstallierten Fixes wirken.** Anders als der BT-Spike (Lauf 1: 0 %
Sonstiges = Ventil tot, ~5–6 Force-Fits) hat Berlin schon in **Lauf 1 bestanden**, weil `kern_im_feld` +
scharfe Sonstiges-Regel von vornherein im Prompt standen. Das Ventil feuerte korrekt (Wasserbetriebe-
Gebührenkalkulation → Sonstiges/false; Wohngeld-Bearbeitungszeiten → Sonstiges/false). Die 3 neuen
Phase-B-Buckets wurden sauber benutzt (Wohneigentum: §250-Umwandlung; etc.).

**Befund S2 — der 45 %-Cluster ist ein Sampling-Artefakt, kein Taxonomie-Problem.** Die `dbid DESC`-Spanne
fing eine Häufung fast identischer GRÜNE-Wärme-Contracting-Anfragen (8/40 = 20 % der Stichprobe). Global
kommt Wärme-Contracting nur **25× in 2414** Wohnen-DS vor (~1 %). Bereinigt liegt „Soz. & landeseig.
Wohnungsbau" beim Floor (landeseigene WBG 707/2414 ≈ 29 %, < 40 %). → **Pre-Mortem-Split der Taxonomie
NICHT nötig**; im Pilot an der echten Voll-Feld-Verteilung gegenprüfen.

**Befund S3 — wenige Force-Fit-Kandidaten** (in der ~7 %-Fehlerquote): D-452621 (Senat-Lobbykontakte mit
Immobilienwirtschaft → Mietregulierung; Kern eher Transparenz → hätte Sonstiges sein können) und
D-453076-Wohngeld (Grenzfall: inhaltlich Wohnen-nah, aber Frage zielt auf Verwaltungs-Bearbeitung → Sonstiges
vertretbar). Keine systematische Pathologie.

**→ Verdikt Stufe 4: BESTANDEN. Stufe 5 (Patch+Re-Validate) ENTFÄLLT** (BT brauchte sie nur wegen Lauf-1-
Versagen). Nächster Schritt = **Stufe 6 Pilot Wohnen** (~$1–3, Batch-API, schreibt DB) — braucht Kosten-OK.
Hinweis für UI: Tag-Layer für Browse auf Tags mit ≥2 Vorkommen filtern (Eigennamen-Schwanz ausblenden).

## Stufe 6 — Pilot-Batch Wohnen ✅ BESTANDEN (2026-06-16, Batch-API, schreibt DB)

`scripts/batch-wohnen-unterthemen.ts` (`--estimate`/`--submit`/`--status`/`--apply`), Batch
`msgbatch_01Eyepn2JE9wj6yDcGnNmPah`, 2.414 Wohnen-DS, Haiku 4.5, durchgelaufen in ~4 Min. Geschrieben nach
neuer Tabelle **`berlin_ds_unterthemen`** (PK `dbid`+`feld`, idempotent). Realkosten ~$4 (Zeichen-Estimate
$2 war wie erwartet ~2× zu optimistisch; Spike-geerdet stimmte).

**Scorecard an der echten Voll-Verteilung (2.413 gespeichert):**

| Kriterium | Ziel | Ergebnis | |
|---|---|---|---|
| Sonstiges auf **Kern-Items** (`kern=1`) | < 15 % | **0,16 %** (3/1920) | ✓✓ |
| Größter Cluster | < 40 % | **39,8 %** (Soz. & landeseig. Wohnungsbau, 960) | ✓ grenzwertig |
| ⌀ Unterthemen/Item (multi-label) | sane | **1,49** | ✓ |
| `kern_im_feld=false` (Putzliste) | gemessen | **491 (20 %)** | ✓ wie B4 (~12–15 % erwartet) |
| Tag-Layer | wiederkehrende Entitäten | 1.073 Tags ≥2× (HOWOGE 268 · Gewobag 129 · degewo 115 · Belegungsbindung 63 · Milieuschutz 56 · Zweckentfremdungsverbot 51 · Vorkaufsrecht 44), 3.080 Eigennamen-Schwanz | ✓ |

**Befund P1 — Methode validiert, kein Split nötig.** Top-Cluster 39,8 % (meine Spike-Prognose „~29 %" war zu
optimistisch — der Sub-Split der Spitze ist der Tag-Layer, nicht ein 13. Unterthema). Vergesellschaftung (18)
+ Wohneigentum (30) + Kleingärten (41) bestätigen: die 3 Phase-B-Buckets tragen, aber dünn — als Filter-Tags
ok, nicht navigationskritisch.

**Befund P2 — Drift-Härtung.** 3/2.414 fielen durch das Enum (trotz JSON-Schema): 2 Tippfehler
(`Kleingarïten`, `Gebäudeverwahrlofung`) + 1 Fremdfeld-Halluzination (`Soziale Infrastruktur &
Daseinsvorsorge`). Normalizer um **Levenshtein-≤2-Fuzzy-Fallback** (eindeutiger Treffer) erweitert → Tippfehler
gratis aus dem Cache nachgezogen (2.411→2.413). Die 1 Halluzination bleibt offen (`D-440054`), holt der
Global-Lauf via `--submit` (nur Unklassifizierte) nach. Härtung hilft auch dem Global-Batch.

**→ Verdikt Stufe 6: BESTANDEN.** Nächste Schritte: **Stufe 9 UI an Wohnen verdrahten (gratis, vorzeigbar)**
ODER **Stufe 7 Global** (~$8–12, restliche 15 Felder) — Reihenfolge ist Produktentscheidung. UI-zuerst zeigt
den Wert, bevor global Geld fließt.

## Stufen 7–9

Noch offen. Folgen der allgemeinen Prozedur. Zwischenstand UI: ein **kostenloses Level-1-Feld-Grid**
(`/parlamente/berlin/themen`) ist gebaut (Wegwerf-/Interim-Stand, beweist den sauberen Rollup) — wird
durch die echte `VorschauThemen`-Komponente ersetzt, sobald die Sub-Ebene steht.

## Stand-Tabelle

| Stufe | 0 | 1 Discovery | 2 Taxonomie | 3 Kriterien | 4 Spike | 5 Patch | 6 Pilot | 7 Global | 8 Reden | 9 UI |
|---|---|---|---|---|---|---|---|---|---|---|
| Berlin | ✅ | ✅ (Batch JA, Achse B) | DRAFT+B (Wohnen 12) | ✅ | ✅ bestanden | entfällt | ✅ Wohnen | ⬜ | ⬜ | Interim-Grid |

**Verdikt Stufe 1 (2026-06-16):** Vollbatch JA auf Achse B, gestaffelt (Spike→Pilot→Global). Belegt: der
Gratis-Tag-Split kollabiert die saliantesten Wohnungspolitik-Achsen im 2414-DS-Mega-Tag „Wohnen". Nächster
gratis Schritt = Stufe 3 (Erfolgskriterien); erster kostenpflichtiger = Stufe 4 Spike Wohnen ~$0,10
(braucht Kosten-OK).
