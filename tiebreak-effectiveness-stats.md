# Multi-LLM-Konsens — Wirksamkeits-Statistik

**Stand:** 2026-04-29
**Scope:** 640 deutsche Politiker:innen (629 Bundestag-MdBs + 11 Quereinsteiger-Minister), 21. Wahlperiode

---

## Datenbasis

| Metrik | Wert |
|---|---:|
| Strukturierte CV-Einträge (`cv_json` aus Wikipedia) | **7.342** |
| Strukturierte CV-Einträge (`cv_homepage_json` aus Homepage) | **7.005** |
| **Total Einzelaussagen geprüft** | **~14.347** |

Jede Aussage = ein `{jahr, text}`-Eintrag in den Sektionen Ausbildung / beruflicher Werdegang / politische Stationen / Sonstiges.

---

## Stufe 1 — Cross-Check (Llama vs. Mistral)

**Llama** (Generator) und **Mistral Small** (Cross-Check) extrahieren unabhängig dieselben Daten.

- **676 Diskrepanzen** identifiziert (4,7% der Aussagen)
- = wo Llama und Mistral sich uneinig waren

Ohne Cross-Check wären diese 676 Diskrepanzen unentdeckt geblieben.

---

## Stufe 2 — Tiebreak v1 (Phi-4-multimodal auf NVIDIA NIM, eine Quelle)

Pro Konflikt entscheidet Phi-4-multimodal mit Quellbeleg.

| Verdict | Anzahl | Anteil |
|---|---:|---:|
| 🟦 Llama korrekt | 121 | 17,9% |
| 🟧 **Mistral korrekt** (= Llama-Halluzination) | **170** | **25,1%** |
| 🟩 Beide korrekt (separate Aussagen, beide belegt) | 286 | 42,3% |
| 🟥 Beide falsch (laut Phi-4-multimodal) | 36 | 5,3% |
| ⬜ Unklar (Quelle zu dünn) | 63 | 9,3% |
| **Total** | **676** | **100%** |

**Erkenntnis:** Schon mit nur einer Quelle (Wikipedia-Bio-Summary ODER Homepage) entdeckt Phi-4-multimodal **170 echte Llama-Halluzinationen** (= 25,1% der Diskrepanzen, 1,2% der Gesamt-Aussagen).

---

## Stufe 3 — Tiebreak v2 (GPT-4o-mini auf GitHub Models, vier Quellen)

Für die 99 unscharfen Fälle (36 „keiner" + 63 „unklar" aus v1) zweite Runde mit **allen 4 Roh-Text-Quellen** gleichzeitig: Wikipedia-Volltext + Bundestag-Profil + Homepage + Bundesregierung.

| Verdict | Anzahl | Anteil |
|---|---:|---:|
| 🟦 Llama korrekt | 1 | 1,0% |
| 🟧 **Mistral korrekt** (zusätzliche Halluzination entdeckt) | **5** | **5,1%** |
| 🟩 Beide korrekt (separat belegt) | 93 | 93,9% |
| 🟥 Beide falsch | 0 | 0,0% |
| ⬜ Unklar | 0 | 0,0% |
| **Total** | **99** | **100%** |

**Erkenntnis:** Die ehemals 99 „unentscheidbaren" Fälle aus v1 sind **alle aufgelöst** worden. 93/99 (94%) waren in Wahrheit gar keine Halluzinationen — beide Aussagen waren separat belegt, nur die ursprüngliche Quelle (eine einzelne) zu dünn zum Erkennen. Plus 5 weitere Halluzinationen entdeckt.

---

## Aggregierte Wirksamkeit

| Frage | Antwort |
|---|---:|
| Wie viele Aussagen hat Llama allein produziert? | ~14.347 |
| Wie viele davon waren mit Mistral konsistent? | 13.671 (95,3%) |
| Wie viele Diskrepanzen entdeckt durch Cross-Check? | 676 (4,7%) |
| Davon **echte Llama-Halluzinationen** (Mistral korrekt, Llama nicht)? | **175** (v1: 170 + v2: 5) |
| Echte Halluzinations-Rate auf Gesamt-Aussagen | **~1,2%** |
| Diskrepanzen, die sich als Detailunterschiede entpuppten (beide stimmen) | 379 (286 + 93) |
| Korrekt-Patches angewendet (DB-Updates) | **172 + 3 wackelige Edge-Cases** |

---

## Was bringt jeder einzelne Pass?

| Pass | Modell-Familie | Was er liefert | Wert |
|---|---|---|---|
| ① **Llama-Generator** | Meta | 14.347 Aussagen extrahiert | Basis-Datenbestand |
| ② **Mistral-Cross-Check** | Mistral AI | Findet 676 Diskrepanzen (= 4,7% Quote) | **Detektion** |
| ③ **Phi-4-multimodal-Tiebreaker** | Microsoft | Entscheidet 614 von 676 klar (90,8%) | **Entscheidung** mit nur einer Quelle |
| ④ **GPT-4o-mini-v2** | OpenAI | Löst die 99 unscharfen mit 4 Quellen (100%) | **Vervollständigung** |

Ohne Stufe ②: 676 Halluzinationen + Detail-Differenzen wären unentdeckt geblieben.
Ohne Stufe ③: 676 markierte Diskrepanzen ohne Auflösung — unbrauchbar.
Ohne Stufe ④: 99 Konflikte (14,6% der entdeckten) blieben unentscheidbar.
**Mit allen 4 Stufen: 100% der Diskrepanzen geklärt, 175 echte Halluzinationen aus der DB entfernt.**

---

## Antworten auf wahrscheinliche Förderer-Fragen

**„Ist Multi-LLM-Konsens nicht ein Gimmick?"**

Nein. Konkrete Wirkung:
- Llama allein hätte **175 falsche Aussagen** in der Datenbank gelassen (~1,2% der Aussagen, ~25% der vom Cross-Check entdeckten Diskrepanzen)
- Bei Politik-Daten wäre jede einzelne dieser falschen Aussagen ein Vertrauensbruch
- Zwei-LLM-Konsens (Llama+Mistral) hätte zwar Diskrepanzen erkannt, aber nicht aufgelöst
- Erst die Tiebreaker-Stufe (Phi-4-multimodal + GPT-4o-mini) macht aus „Diskrepanz erkannt" eine **belegte Korrektur**

**„Wie viel Mehraufwand kostet das ggü. Single-LLM?"**

Faktor ~4× LLM-Calls. Aufwandsmäßig vertretbar:
- Mehrere Provider haben großzügige Tiers für kleinere Datenmengen (640 MdBs schaffbar)
- Bei Skalierung (Landtage, EU-Parlament, regelmäßige Updates) wird kostenpflichtige Nutzung relevant
- Zeitaufwand: 1 voller Lauf in ~2-3 Stunden Wandzeit

**„Wie reproduzierbar ist das?"**

- Audit-Trail komplett persistent: pro Aussage ist gespeichert, welches Modell mit welcher Prompt-Version wann entschieden hat
- Quelltexte (Wikipedia-Volltext, Bundestag-Bio, Homepage-Vita, Bundesregierung-Bio) sind in der DB persistiert
- Konflikte und Verdikte stehen in `tiebreak.partial.jsonl` und `tiebreak-v2.partial.jsonl` — kompletter Audit
- Open-Source: Skripte sind im Repo, jede:r kann den Lauf reproduzieren

**„Was passiert, wenn ein LLM-Anbieter ausfällt?"**

Cross-Vendor-Konsens (Meta, Mistral AI, Microsoft, OpenAI = 4 Anbieter, 4 Cloud-Plattformen):
- Bei Single-Vendor-Ausfall steht das Verfahren weiter
- Auch politisch wertvoll: kein Anbieter dominiert die Methodik

**„Methodische Limitationen?"**

Ehrlich kommuniziert auf der Methodik-Seite:
- Keine 100%-Garantie, nur Fehlerminimierung
- Tiebreaker können sich auch täuschen
- Quellen können veraltet/lückenhaft sein
- Bei jedem Eintrag ist die Quelle verlinkt → nutzer:innen können selbst prüfen

---

## Quellen-Effekt (v1 vs. v2)

| Quelle | v1 (eine Quelle) | v2 (vier Quellen) |
|---|---:|---:|
| Unscharfe Verdikte | **99 (14,6%)** | **0 (0%)** |
| Erkannte Halluzinationen | 170 | 175 (+5) |

→ **Mehr Quellen = präzisere Auflösung.** Der Sprung von 99 unscharfen Fällen auf 0 zeigt: Die Anzahl unabhängiger Quellen ist der Hebel, nicht die Anzahl Modelle. Aber beides zusammen = robust.

---

*Bericht generiert aus tiebreak.partial.jsonl (676 Einträge) und tiebreak-v2.partial.jsonl (99 Einträge). Reproduzierbar mit `scripts/check-rohtext-quality.ts` und `scripts/apply-tiebreak-patches-auto.ts`.*
