# Reden-Pipeline Reality-Check (2026-04-30)

**Methodik:** Phase 1 aus `project_reden_pipeline_status.md` — 5 zufällige Reden aus
`speech_summaries` ziehen, `zusammenfassung` gegen `original_text` manuell vergleichen,
Halluzinations-Pattern identifizieren. Wegen unerwarteter Funde wurde noch eine zweite
Stichprobe von 5 "sauberen" (nicht-duplizierten) Reden gezogen → insgesamt 10 inspiziert.

**Generator:** `groq:llama-3.3-70b-versatile` (Fallback `llama-4-scout-17b-16e-instruct`),
Prompt-Version `v1-2025`, Skript `scripts/extract-speeches-xml.ts`. Prompt enthält
NUR den Redetext (kein Topic-Priming), erwartet JSON mit `zusammenfassung` (2–3 Sätze) +
`kontext` (3–8 Wörter) + `typ`.

---

## TL;DR

1. **PRIORITÄT 1 — Datenintegritäts-Bug (Speaker-Attribution):** 617 Zeilen (≈7,5 %)
   in `speech_summaries` haben einen `original_text`, der auch in mindestens einer
   weiteren Zeile vorkommt — d.h. dieselbe Rede ist mehreren Speakern zugeordnet.
   Der Reality-Check stieß sofort auf so einen Fall: Eine AfD-Rede zur Ganztagsschule
   (Gereon Bollmann) ist zusätzlich unter Hendrik Bollmann (SPD) mit erfundenem
   Kommunen-Kontext gespeichert. Das ist ein **Extraktions-Bug**, NICHT die LLM.
   Quelle: `extract-speeches-xml.ts:319-322` mit zu lockerer Last-Name-Heuristik
   (`xmlNachname.includes(lastName) || lastName.includes(xmlNachname)`) plus
   `ORIGINAL_SPEAKER` env-override (Zeile 469).

2. **Llama 70B Reden-Qualität ist solide.** Faktentreue OK, keine harten
   Halluzinationen wie bei Llama 8B in der CV-Pipeline. Aber zwei systematische
   Schwächen sind zu beobachten:
   - **Tonalitäts-Verflachung:** Polemische AfD-Reden werden in neutrale Sprache
     übersetzt. Killer für späteres Tonalitäts-Feature (Synopse-Aussage-vs-Vote).
   - **Auslassung bei Multi-Punkt-Reden:** Bei 2–4 separaten Forderungen geht
     gelegentlich eine verloren oder wird zu generisch zusammengefasst.

3. **Generator-Upgrade nicht oberste Priorität.** Das eigentliche Risiko sitzt
   in den Daten und im fehlenden Tonalitäts-Layer, nicht in der Faktentreue der
   `zusammenfassung`. Reihenfolge: Daten reparieren → Halluzinations-Inspektor
   (Nemotron-Nano) auf SAUBERE Daten → erst dann ggf. Haiku-Re-Generation.

---

## Stichprobe 1: Erste 5 zufällig gezogene Reden

| ID | Speaker | Thema | Verdikt |
|----|---------|-------|---------|
| 1232 | Hendrik Bollmann (SPD) | "Entschuldung der Kommunen" | ❌ DATENBUG — original_text ist eigentlich Gereon Bollmanns Ganztagsschule-Rede |
| 616  | Gökay Akbulut          | BMZ-Kürzungen              | ✅ Akkurat |
| 1497 | René Bochmann          | Bundeswasserstraßen        | ✅ Akkurat |
| 2607 | Dr. Günter Krings      | Mietpreisbremse            | ✅ Akkurat |
| 1130 | Dr. Christoph Birghan  | Hightech Agenda            | ⚠ Unvollständig — original_text enthält 2 Fragestunde-Beiträge, nur einer zusammengefasst |

### Fall ID=1232 im Detail (der KRITISCHE Fall)

- `speaker` = "Hendrik Bollmann", `kontext` = "Finanzielle Stärkung und Entschuldung der Kommunen"
- `zusammenfassung` = *"… fordert einen Zukunftspakt zur Entschuldung und finanziellen Stärkung der Kommunen, … plädiert für eine Neuordnung der Finanzbeziehungen zwischen Bund, Ländern und Kommunen sowie eine gezielte Investitionsförderung für strukturschwache Regionen."*
- `original_text` (=2722 Zeichen): tatsächlich eine Anti-Ganztagsschule-Polemik
  ("Beide Eltern sollen … als Steuerzahler und Lückenbüßer für den Fachkräftemangel dienen") — klare AfD-Rhetorik.
- DB-Check zeigte: `id=1213` hat denselben original_text, korrekt unter "Gereon Bollmann"
  mit kontext "Ausbau der Ganztagsschulen und Lehrermangel" gespeichert.
- Plenar-XML hat WP21/S7 zwei Bollmänner: Gereon (AfD) + zweimal Hendrik (SPD).
- Fazit: Beim Lauf für `Bollmann "Hendrik Bollmann"` wurden Gereons Reden
  fälschlich mit-extrahiert; der LLM bekam dann den falschen Text und
  halluzinierte ein dazu passendes Kommunen-Thema.

### Verbreitung

```sql
SELECT COUNT(*) FROM speech_summaries
WHERE original_text IN (
  SELECT original_text FROM speech_summaries
  WHERE original_text IS NOT NULL AND LENGTH(original_text) > 200
  GROUP BY original_text HAVING COUNT(*) > 1);
-- 617 Zeilen in 291 Duplikat-Gruppen
```

≈7,5 % der 8.245 Zeilen sind betroffen. Nicht alle 617 sind zwingend Speaker-Mismatches
(theoretisch könnten Reden absichtlich mehrfach gespeichert sein), aber das
1213/1232-Beispiel zeigt: in der Praxis sind es Mis-Attributionen.

---

## Stichprobe 2: 5 "saubere" Reden (nicht in der Duplikat-Menge)

Um die reine LLM-Qualität ohne Datenbug-Rauschen zu bewerten:

| ID | Speaker | Thema | Verdikt |
|----|---------|-------|---------|
| 2738 | Dunja Kreiser (SPD)        | Grüne Transformation   | ✅ Akkurat — alle Hauptpunkte erfasst |
| 2191 | Jürgen Hardt (CDU)         | Nahost / Iranpolitik   | ✅ Akkurat (kleine Auslassung: Hamas-Verantwortlichkeits-Rahmen) |
| 4819 | Kurt Kleinschmidt (AfD)    | Operation Irini        | ⚠ Tonalitäts-Verflachung — AfD-Polemik gegen "Seenotretter", "Migrationsrouten = Schlepperei", Lauterbach-Spitze etc. komplett neutralisiert |
| 2055 | Dr. Moritz Heuberger       | Bürokratieabbau        | ✅ Akkurat — alle 3 Punkte präzise |
| 1284 | Joachim Bloch (AfD)        | Haushalt 55-Mrd-Paket  | ⚠ Leichte Über-Interpretation — Bloch fordert Steuersenkungen, die Summary schreibt "Investitionen in heimische Infrastruktur und soziale Leistungen", was Bloch so NICHT zugesagt hat |

### Fall ID=4819 (Tonalitäts-Verflachung)

- Original: Polemische AfD-Rede mit "Messerstecher oder Massenvergewaltigungen?",
  "geduldet durch die Bundesregierung und gedeckelt durch das Mandat",
  "die ‚Seenotretter' von Irini ins Spiel kommen", "wenigstens die Frauen in
  Libyen weniger gefährdet sind", "Hoffentlich hat die [Gesundheitsversorgung]
  nicht Herr Lauterbach geplant".
- Summary: *"… lehnt die Verlängerung der Operation Irini ab und kritisiert
  die Bundesregierung für ihre Außen- und Verteidigungspolitik. Er argumentiert,
  dass Deutschland seine eigenen Probleme lösen sollte, anstatt sich in Libyen
  zu engagieren."*
- Inhaltlich nicht falsch, aber: Die polemische Rhetorik (Migration-Hetze,
  Lauterbach-Spitze, Schlepperei-Vorwurf) ist komplett unsichtbar. Wenn
  Bürger:innen später Kandidat:innen vergleichen sollen, ist DAS exakt das,
  was die Pipeline darstellen muss.

### Fall ID=1284 (Überinterpretation)

Bloch listet ausschließlich Steuer-/Abgabe-Senkungen + Gegenfinanzierung
durch Streichungen (EU-Zahlungen, Bürgergeld, Ukraine-Hilfen). Die rhetorische
Liste am Ende ("Erst wenn alle Schulen saniert sind …") ist KEIN
Investitionsprogramm, sondern eine Bedingungsklausel um Auslandszahlungen
auszusetzen. Der Generator hat daraus eine konstruktive Forderung
"Investitionen in heimische Infrastruktur und soziale Leistungen zu
priorisieren" gemacht — das hat Bloch so nicht gesagt.

---

## Halluzinations-Klassen (für Inspector-Design)

| Klasse | Häufigkeit (10 Stichproben) | Kritisch für Killer-Feature? |
|--------|------------------------------|------------------------------|
| **Datenbug: falscher Speaker/Text** | 1/10 (≈7,5 % systemweit) | JA — falsche Aussagen einem Politiker zuordnen ist worst case |
| Faktische Halluzination (erfundene Zahlen/Personen) | 0/10 | wäre kritisch, scheint bei 70B nicht aufzutreten |
| Tonalitäts-Verflachung (Polemik → neutral) | 1/10 | JA — Tonalitäts-Layer wird bei polemischen Reden falsch trainiert |
| Auslassung einzelner Forderungen | 1/10 (Hardt: Hamas-Rahmen; Birghan: 1 von 2 Fragen) | mittel — bei Synopse-vs-Vote könnten relevante Aussagen fehlen |
| Über-Interpretation (Forderung erfunden) | 1/10 (Bloch) | JA — verzerrt Aussage-vs-Vote |

LLM-only-Fehlerrate (ohne den Datenbug): 3/9 ≈ 33 % zeigen mindestens leichte Drift.
Davon ist allerdings nur 1/9 (Bloch) eine echte inhaltliche Halluzination, der Rest
ist Auslassung/Verflachung.

---

## Empfohlene nächste Schritte

### Priorität 1: Datenintegrität (BLOCKER)

Bevor jeder weitere Layer (Inspector, Themen-Klassifikator, Tonalitäts-Analyse,
Generator-Upgrade) Sinn ergibt, müssen die Speaker-/Text-Mis-Attributionen
weg. Ohne das halluziniert jeder downstream-Layer auf Müll-Eingaben.

**Vorschlag:**
1. Skript `scripts/audit-speech-attribution.ts` schreiben:
   - Für jede Duplikat-Gruppe (291 Gruppen): aus `data/plenarprotokolle_xml/`
     die `<rede id="ID...">` mit der erwarteten `redner_id` ziehen und prüfen,
     welcher Speaker im XML wirklich steht.
   - Output: JSONL mit `(id, speaker_db, speaker_xml, action)` wo `action ∈
     {keep, fix_speaker, delete_duplicate}`.
2. Bug-Fix in `extract-speeches-xml.ts` für künftige Läufe:
   - Last-Name-Heuristik strenger machen (Vorname-Match ZWINGEND verlangen).
   - `ORIGINAL_SPEAKER` env-override absichern oder ganz entfernen.

### Priorität 2: Halluzinations-Inspektor auf bereinigte Daten

Erst NACH Daten-Reparatur einen Mistral- oder Nemotron-Nano-Inspektor
über die `zusammenfassung` laufen lassen, der prüft:
- Sind alle in der Summary genannten Forderungen/Aussagen im `original_text`
  belegbar? (Über-Interpretation)
- Werden polemische Marker (Beifall-Kommentare, Anti-X-Rhetorik) reflektiert?
  (Tonalitäts-Verflachung)

Pattern aus CV-Pipeline (`scripts/inspect-dates.ts`) übertragbar — nur das
Verifikations-Kriterium ist diesmal "Text-Inhalts-Treue" statt "Datums-Präzision".

### Priorität 3: Generator-Upgrade evaluieren

Nur wenn Inspector aus Schritt 2 zeigt, dass Tonalitäts-/Auslassungs-Probleme
verbreitet sind:
- 50–100 schwierige Fälle (polemische Reden, Multi-Punkt-Reden) mit Haiku 4.5
  re-generieren und manuell vergleichen.
- Cost-Estimate: 8.245 Reden × ~3.000 Token Input + ~150 Token Output ≈ 25 M
  Input + 1,2 M Output Tokens → bei Haiku 4.5 grob $25–35 für eine komplette
  Re-Generation. Lohnt sich falls Tonalitäts-Layer stark abhängt.

### Priorität 4: Tonalitäts-Layer SEPARAT vom Generator

Die Generator-Aufgabe (Sach-Zusammenfassung) und die Tonalitäts-Analyse
(Sachlich/Emotional/Polemisch) sind zwei verschiedene Aufgaben. Tonalitäts-Layer
braucht den ROHTEXT plus Beifall-/Zwischenruf-Kommentare. Lieber als eigenen
Llama-4-Scout- oder Mistral-Pass auf `original_text` aufsetzen, statt vom
Generator zu erwarten dass er Polemik in 2–3 Sätzen rüberbringt.

---

## Offene Fragen für nächste Session

1. Gibt es weitere Datenbugs jenseits der 617 Duplikat-Zeilen? Z.B. Reden, die
   im XML zwei Speakern zugeordnet sind und korrekt nur dem einen attributiert
   wurden, aber bei einem anderen Politiker in `politicians` fehlt?
2. Wie war die genaue Aufruf-Sequenz von `extract-speeches-xml.ts` historisch?
   Gab es Läufe mit `ORIGINAL_SPEAKER` env-override, die das Problem erklären?
3. Sollen die 1.377 Zeilen ohne `model`-Info (alte Generierung) komplett
   re-generiert werden? Bei Daten-Reparatur ohnehin betroffen.
