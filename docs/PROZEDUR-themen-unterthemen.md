# Prozedur: Themen-Unterthemen für ein Parlament (wiederverwendbare SoP)

**Zweck.** Schritt-für-Schritt, wie wir die **zweistufige Themen-Klassifikation** (Politikfeld →
Unterthema) für ein Parlament aufbauen — so, dass jedes weitere Landesparlament (Berlin, dann
Bayern/NRW/…) **dieselbe Prozedur** durchläuft, ohne dass sie neu verhandelt werden muss.

**Zwei Kern-Prinzipien:**
1. **Erst von Hand verstehen, dann automatisieren.** Der manuelle Discovery-Lauf (Stufe 1) ist das
   Herzstück — er entscheidet *ob*, *wie tief* und *ob überhaupt ein bezahlter LLM-Lauf* nötig ist.
2. **Nie direkt in den Vollbatch.** Wenn ein LLM-Lauf nötig ist: erst billig de-risken (Spike, Cents),
   dann *ein* Feld pilotieren, **dann** global. Kostenpflichtige Stufe nur nach bestandener Vorstufe +
   explizitem Kosten-OK ([[feedback_ask_before_spending]], [[feedback_batch_api_threshold]]).

> **Referenz-Implementierung Bundestag** (Vorlage zum Klonen): Arbeits-Log aller BT-Entscheidungen
> `docs/themen-unterthemen-design.md` · Taxonomie `scripts/_lib/themen-taxonomie.ts` (SoT
> `docs/themen-taxonomie-bt.md`) · Spike `scripts/spike-wirtschaft-unterthemen.ts` · Pilot
> `scripts/batch-wirtschaft-unterthemen.ts` · Global `scripts/batch-unterthemen-global.ts` ·
> Reden-Erben `scripts/seed-rede-unterthemen.ts` · Datenschicht `src/lib/themen-blatt.ts` · UI
> `src/components/VorschauThemen.tsx`.

---

## Stufe 0 — Feldstruktur (Ebene 1) festzurren · gratis

Politikfelder + Querschnitt aus der **amtlichen, kontrollierten Verschlagwortung** des Parlaments
ableiten (nicht erfinden), lückenlos auf die Roh-Tags mappen, als Code-Artefakt + SoT-JSON festzurren.
- Artefakte: `src/lib/<parlament>-themen-struktur.ts` + `docs/themenfelder-<parlament>*`.
- Begleitend messen: **⌀ Felder/DS** (Roh-Tags → Felder). ~2 = Tag-Rollup vertrauenswürdig (Berlin:
  ⌀2,1); explodiert er, braucht schon Ebene 1 die LLM-Kern-Zuordnung (BT-`item_topics`-Fall).

## Stufe 1 — Manueller Discovery-Lauf · gratis · ★ HERZSTÜCK ★

**Claude Code liest in der Session viele echte Drucksachen *eines* Felds von Hand** (BT: ~60
Wirtschaft-DS) und analysiert sie auf ihre spezifischen Themen — *um zu verstehen, wie man mit ihnen
arbeitet*, bevor irgendeine Taxonomie steht oder Geld fließt. Liefert die Entscheidungs-Befunde:

- **Befund „Multi-Feld?":** Sind die Items durchgängig multi-topic? (BT: ja → Multi-Label ist Pflicht,
  nicht optional; etliche „Unterthemen" sind in Wahrheit Cross-Feld-Cluster.)
- **Befund „Tiefe 2 vs. 3":** Aus dem Material die natürlichen Ebene-2-Cluster ableiten, dann an einem
  großen Cluster den Tiefe-Test machen: Hat ein Ebene-3-Split je Knoten genug Items, oder nur 2–6
  (→ leere Browse-Knoten)? (BT-Regel, am Material bestätigt: **2 navigierbare Ebenen**; was darunter
  liegt, ist flacher Filter-Tag, kein dritter Klick.)
- **Befund „Spar-Hebel" — entscheidet, OB der Batch nötig ist:** Quantitativ (DB, gratis) messen, ob
  das **vorhandene** Themen-Feld (`thema`/`thema_json`) das Intra-Feld-Unterthemen-Signal schon trägt.
  Token-Frequenz des Themen-Felds über die Feld-DS auszählen + an 2 weiteren Feldern gegenproben.
  - BT-Ergebnis: Das Feld ist durchgängig **Feld-Level** (gleiches Vokabular wie die Felder selbst) —
    es trennt **nicht** „Industriepolitik vs. Mittelstand vs. Außenhandel" *innerhalb* eines Felds.
    → **Der LLM-Lauf ist für die Intra-Feld-Achse nötig.** ABER das Feld liefert gratis die
    **Cross-Feld-„verwandte Themen"-Fläche** (Wirtschaft → Energie/Finanzen/Verbraucherschutz …) — ein
    populierter Null-Kosten-Browse-Layer, der ohne Batch sofort steht.
- **Konsequenz-Entscheidung: zwei Sub-Layer-Achsen trennen.** Achse A = Cross-Feld-Überlappung (aus
  dem Themen-Feld, **0 €**, sofort). Achse B = echtes Intra-Feld-Unterthema (**neuer LLM-Lauf**). Wenn
  A den belegten Bedarf deckt, kann B nach hinten — die teure Wette wird verschoben, bis ein konkreter
  Bedarf belegt ist, den A nicht deckt.

**Output der Stufe:** ein Befund-Abschnitt im Arbeits-Doc `docs/themen-unterthemen-<parlament>.md` —
und die Antwort auf *„Vollbatch ja/nein und in welcher Achse?"*, bevor ein Cent ausgegeben wird.

## Stufe 2 — Unterthemen-Taxonomie (Ebene 2) entwerfen · gratis

Pro Feld ~5–9 Unterthemen, **aus den Discovery-Befunden** abgeleitet, nicht vom Vorgänger-Parlament
kopiert (Landeskompetenzen: Stadtstaat-Bezirke, Schule/Polizei/Justiz = Landesmaterie …).
- Artefakte: `docs/themen-taxonomie-<parlament>.md` (SoT) + `scripts/_lib/themen-taxonomie-<parlament>.ts`
  (Record Feld→Unterthemen + `taxonomieText()` + `normalizePaar()`).
- **Pflicht-Check:** Taxonomie-Feld-Labels joinen **zeichengenau** auf die Stufe-0-Feldstruktur.

## Stufe 3 — Erfolgskriterien VORHER festnageln · gratis

Bevor ein einziger LLM-Call läuft (sonst maskiert „lief durch" als „funktionierte"):

| Kriterium | Schwelle |
|---|---|
| Sonstiges-Quote (auf **Kern-Items**, `kern_im_feld=true`) | **< 15 %** |
| Größter Cluster eines Felds | **< 40 %** |
| Spezifische Tags | brauchbar/entity-artig, **keine 1-Item-Erfindungen** |
| Hand-Stichprobe (n≈20–25) Präzision | **~85 %+** |
| `kern_im_feld`-Flag | fängt Cross-Feld-Items (Kern in anderem Feld → Sonstiges, nicht zwingen) |

## Stufe 4 — Spike · ~$0,05–0,15 (Cents, live, kein DB-Write)

~40 DS *eines* Felds, Haiku live, Output von Hand gegen Stufe 3 prüfen (Klon
`scripts/spike-<feld>-unterthemen.ts`).
- **Kostenrealität:** Schätzungen waren beim BT **~3× zu optimistisch** (Input ≈ 1.600 Token/Item).
  Immer real messen.
- **Besteht** → Stufe 6. **Fällt** → Stufe 5.

## Stufe 5 — Patchen + re-validieren · ~$0,10 · nur falls Spike Schwächen zeigt

Typischer BT-Befund: das **Sonstiges-Ventil wird nicht benutzt** → Cross-Feld-Items werden ins
nächstklingende Cluster gezwungen. Fix war **Prompt**, nicht Taxonomie (Sonstiges-Regel schärfen +
`kern_im_feld`-Flag) plus echte Lücken schließen (BT: 11. Cluster „Wettbewerb & Kartellrecht"). Dann
**dieselben 40 DS** erneut, Scorecard Lauf 1 vs. 2. Erst bestanden → Stufe 6.

## Stufe 6 — Pilot-Batch: EIN Feld · ~$1–3 (Batch-API) · nach Kosten-OK

Das größte/repräsentativste Feld komplett klassifizieren (Klon `batch-<feld>-unterthemen.ts`). Erlaubt,
die **echte UI an einem Feld end-to-end zu verdrahten und vorzuzeigen**, bevor global Geld fließt.

## Stufe 7 — Globaler Vollbatch · ~$6–12 (Batch-API) · nur nach bestandenem Pilot + Kosten-OK

Alle Felder × alle DS in EINEM Batch (Klon `batch-unterthemen-global.ts`). Taxonomie-Block **gecacht**
(`cache_control`). Schreibt **Original**-Taxonomie-Namen (Anzeige-Merges leben getrennt in der UI,
sonst reißt der Join). 1–3 `{feld, unterthema}`-Paare + 1–4 Tags/DS. `--submit` = nur unklassifizierte
(»update«-sicher); `--submit --all` nur bei Taxonomie-Änderung.

## Stufe 8 — Reden erben das Unterthema · gratis

Über die debattierte Drucksache erben (Klon `seed-rede-unterthemen.ts` → `<parlament>_rede_unterthemen`).
Nach **jedem** `--apply` neu laufen.

## Stufe 9 — Datenschicht + UI verdrahten · gratis

`src/lib/themen-blatt.ts` klonen, Joins von BT- auf Parlaments-Tabellen umverdrahten, dann die
**unveränderte** `VorschauThemen`-Komponente füttern → **identisches Design überall**. Erwartbar
dünnere Blatt-Stellen, wo die Datenlage abweicht (Berlin-Votes = Fraktions-Handzeichen, keine DIP-
Vorgänge) — Hülle gleich, Inhalt passt sich an.

---

## Pro Parlament ein eigenes Arbeits-Doc (diese SoP NICHT überschreiben)

Diese Datei ist die **allgemeine, unveränderliche Prozedur** — sie gilt unverändert für jedes neue
Parlament **und** für spätere Re-Läufe auf neuen Daten. Die parlament-spezifischen Befunde,
Entscheidungen und der Stand leben in einem **eigenen Arbeits-Log je Parlament**, NICHT hier:

| Parlament | Arbeits-Doc | Aktuelle Stufe |
|---|---|---|
| Bundestag | `docs/themen-unterthemen-design.md` | ✅ 9/9 fertig (Pilot Wirtschaft → global) |
| Berlin | `docs/themen-unterthemen-berlin.md` | 🔄 Stufe 1 (Discovery-Lauf läuft) |
| *(künftig)* | `docs/themen-unterthemen-<parlament>.md` | — |

Neues Parlament = neues Arbeits-Doc nach dieser Prozedur abarbeiten; diese SoP bleibt die Referenz.
