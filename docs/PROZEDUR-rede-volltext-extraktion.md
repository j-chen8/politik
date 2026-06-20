# Prozedur: Reden-Volltext-Extraktion (Gold-Standard) + Wurzel des Themen-Über-Taggings

Stand 2026-06-20. Additives Arbeits-Doc (überschreibt keine bestehende Prozedur).

## Wozu

Die „Tut"-Schicht des Partei-Positionen-Features (`partei_aspekt_verhalten`) hatte **zwei
gekoppelte Mängel**, beide mit derselben Wurzel: **das LLM hat die Rede nie im Volltext gesehen.**

1. **Belege paraphrasiert.** Die alte Pipeline (`scripts/partei-aspekt-verhalten.ts`) fütterte das
   LLM mit der **Zusammenfassung** (`zusammenfassung_2_saetze` + `forderungen`, ⌀747 Zeichen) statt
   mit dem **Volltext** (⌀3.019 Zeichen). Aus Text, den es nie gesehen hat, kann es kein wörtliches
   Zitat ziehen → nur **2,7 %** der „Zitate" sind wörtlich im Quelltext auffindbar.
2. **Reden-Feld-Tags über-getaggt** (siehe Wurzel-Befund unten).

## Wurzel-Befund: Reden-Feld-Tags sind DS-geerbt, nicht aus der Rede abgeleitet

`item_topics` (source=`bt_rede`) hat **kein Score / kein Primär-Feld / kein Ranking** — nur flache,
gleichwertige Tags. **Alle 20.026 Reden-Tags tragen `origin = inherited_ds`**: Jeder Redner einer
Debatte erbt **alle Felder der debattierten Drucksache**, egal was er tatsächlich gesagt hat.

- Eine „Wirtschaft"-Rede hat im Schnitt **3,91 Felder** (max 11); praktisch keine ist „nur Wirtschaft".
- Wirtschafts-Vokabular (Kosten, Standort, Arbeitsplätze, Wettbewerb) steckt in fast jeder Debatte
  → Wirtschaft wird am häufigsten mit-vererbt.

**Gold-Audit (Claude Code, Volltext gelesen, 40 Reden Wirtschaft, 2026-06-20):**
- **26/40 primär Wirtschaft, 14/40 primär anderes Feld = ~35 % Fehl-Tag** (Wirtschaft nur sekundär).
- Fehl-Tags wohin: Verkehr 4 (Verbrenner-Anträge), Kultur 4 (Simson-Moped-Anträge), Gesundheit 3
  (Apotheken/GKV), Energie 2 (Energiewende-Rants), Außenpolitik 1 (Lubmin/Ukraine).
- Die korrekten Felder sind in den geerbten Tags **meist schon enthalten** — es fehlt nur die
  „welches ist primär?"-Entscheidung.

Erklärt eine ganze Klasse alter Befunde: Berlin-Unterthemen-Audit, Themenfelder-Rollup-Bug.

## Der Fix = Pro-Rede-Volltext-Extraktion (ein Durchlauf repariert BEIDES)

Statt Zusammenfassungen zu synthetisieren: **jede Rede im Volltext** lesen und entscheiden
- **passt** die Rede ins Feld? → Aspekt + **wörtliches** Zitat (Beleg aus dem gelesenen Text)
- **passt nicht?** → korrektes Primär-Feld benennen (Selbstkorrektur des DS-Erbe-Rauschens)

Belege sind **~100 % verifizierbar** (Zitat stammt aus dem gelesenen Text), und das Primär-Feld
ersetzt das flache DS-Erbe.

### Werkzeug: `scripts/gold-extract.ts` (tranchenweise, wiederholbar)

```
npx tsx scripts/gold-extract.ts --init
npx tsx scripts/gold-extract.ts --fetch --feld "Wirtschaft" --limit 25 --out /tmp/batch.txt
# Extraktor liest batch.txt, schreibt Ergebnis-JSON
npx tsx scripts/gold-extract.ts --write /tmp/batch-result.json
```

- `--write` **verifiziert jedes Zitat** deterministisch gegen `plenar_speeches.original_text`
  (`instr`) und meldet jede nicht-wörtliche Stelle → **kein Halluzinieren** möglich (Leitplanke).
- Ergebnis-Tabelle `rede_gold_extraktion(rede_id, feld, aspekt, partei, speaker, session_nr,
  passt, feld_korrekt, position, zitat, zitat_verifiziert, model, ...)`.
- JSON-Format pro Rede: `{rede_id, passt, feld_korrekt?, extraktionen:[{aspekt, position, zitat}]}`.

### Gold-Benchmark-Stand (2026-06-20)
40 Reden Wirtschaft (Sitzungen 144–147), Extraktor = Claude Code manuell:
**26 passt / 14 Fehl-Tag · 33 Zitate · 33/33 wörtlich verifiziert (100 %)** vs. 2,7 % alt.
Dieser Satz ist der **Benchmark** für jeden Produktions-Klassifikator.

## Modell-Wahl für den Produktions-Lauf (welches LLM?)

Die Aufgabe zerfällt in zwei Teile mit unterschiedlichem Schwierigkeitsgrad:
- **Wörtliches Zitat ziehen:** durch die deterministische Auto-Verifikation **selbstkorrigierend**
  — schlechte Zitate werden verworfen/neu angefragt. **Nicht** der Engpass; jedes brauchbare Modell
  reicht, wenn es den Volltext bekommt.
- **Primär-Feld entscheiden** (`passt` / `feld_korrekt`): der **eigentliche Diskriminator**. Braucht
  Urteil („Verbrenner-Antrag, der Automobil-Wettbewerbsfähigkeit argumentiert → primär Verkehr").
  Ein schwaches Modell bleibt beim Über-Tagging (markiert alles `passt`).

**Empfehlung:** Modelle **gegen den 40-Reden-Gold-Satz benchmarken** (passt-Übereinstimmung +
verifizierte-Zitat-Ausbeute), nicht raten. Prior:
- **Haiku 4.5** (≈ $1/$5; ~$5 für Wirtschaft komplett) — starkes Deutsch + Instruction-Following,
  die Nuance fürs Primär-Feld. Wahrscheinlich bestes Qualität/Kosten für Produktion.
- **Mistral medium (Free, 0 €)** — kostenloser Kandidat, aber tendenziell lascher beim Primär-Feld
  (mehr `passt`, verfehlt Fehl-Tags). Lohnt den Benchmark wegen 0 €.
- **Opus-Tier / Claude Code** = Gold-Referenz + Stichproben-Audit, **nicht** Produktion (zu teuer
  über ~25k Reden global).
Entscheidung empirisch aus dem Benchmark, nicht aus dem Bauch.

## Offen
- Benchmark Haiku 4.5 / Mistral medium gegen die 40 Gold-Reden (Haiku = bezahlt, Kosten-OK nötig).
- Bei Bestehen: Volltext-Klassifikator über alle Felder → fixt Belege UND `item_topics`-Tagging in
  einem Rutsch. `partei_aspekt_verhalten` danach NICHT mehr auf den DS-über-getaggten Reden neu laufen.
