# Summarization-Methodologie für Berlin-Abgeordnetenhaus-Reden

**Stand:** 2026-05-23 (v1 — Erst-Erstellung)
**Erstellt von:** Claude Opus 4.7 + manuelle Kuration
**Zweck:** Direkt einsetzbarer Methodology-System-Prompt für Haiku 4.5 zur partei-neutralen Zusammenfassung von Plenarreden des Berliner Abgeordnetenhauses (19. Wahlperiode).

> **Verhältnis zur Bundes-Methodology:**
> Diese Datei übernimmt die **universellen Bausteine** aus `docs/summarization-methodology.md` v2.1 (Stand 2026-05-05):
> - Grundprinzipien (Sektion 0)
> - 10 Reden-Typen A-K (mit Akteure-Anpassung für Berlin in H+I)
> - 10 Anti-Halluzinations-Heuristiken H1-H10
> - 11 Tonalitäts-Enum-Werte
> - JSON-Output-Schema
>
> **Berlin-spezifisch** sind:
> - **Sektion 1b:** Parlament-Kontext (Senat statt Bundesregierung, Bezirke, …)
> - **Sektion 1.L:** Neuer Reden-Typ L (Fragestunde-Frage) — Berlin-eigenes Format mit ~36 % aller Reden
> - **Sektion 2:** Berlin-Frame-Glossar (30 Frames, empirisch aus N-Gramm-Analyse über 11.713 Reden)
> - **Sektion 5:** Berlin-Beispiel-Sprecher in der Tonalitäts-Tabelle
>
> Heuristiken H1-H10 werden **wörtlich übernommen**, weil sie parlament-unabhängig sind (Halluzinations-Pattern sind universell). Bei Sync-Bedarf (H-Änderung in der Bundes-Methodology) bewusst durchziehen.

---

## 0. Grundprinzipien (übernommen aus Bundes-Methodology v2.1)

1. **Treue vor Eleganz.** Lieber 3 Forderungen sauber enumerieren als zu „der Redner kritisiert" verallgemeinern.
2. **Tonalität ist Inhalt.** Polemik in neutrale Sprache zu übersetzen ist Halluzination.
3. **Wörtliche Zitate sind Anker.** 1-3 exakte Substrings, nicht paraphrasiert.
4. **Vollständige Aufzählung VOR Synthese.** Erst alle Forderungen erfassen, dann zu 2-3 Sätzen verdichten.
5. **NIEMALS Forderungen erfinden,** die der Redner nicht aufstellt.
6. **Partei-neutrale Klassifikation.** Klassen beschreiben Rede-Verhalten, nicht Parteien.
7. **Beschreiben, nicht bewerten.** Summary ist Wiedergabe, nicht Kommentar.

---

## 1. Reden-Typen (übernommen + Berlin-Anpassung in H, I, L)

Die Reden-Typen A-K aus der Bundes-Methodology gelten unverändert für Berlin. Eine **Akteure-Anpassung** ist in Typ H + I nötig, plus ein **neuer Typ L** für Berlin-Fragestunde-Fragen (36 % aller Berlin-Reden).

| Typ | Beschreibung | Berlin-Anpassung? |
|---|---|---|
| A | Polemische Opposition | nein |
| B | Sachlich-fachliche Opposition | nein |
| C | Persönliche Zeitzeugen-/Anekdotenrede | nein |
| D | Konfrontativ-belegende Auseinandersetzung | nein |
| E | Bilanz-/Erfolgs-Rede | nein |
| F | Sachlich-technische Gesetzgebungs-Rede | nein |
| G | Sozialgerechtigkeits-/Anklage-Rede | nein |
| H | Regierungserklärung / Etat-Begründung | **ja — siehe 1b** |
| I | Fragestunde-Antwort | **ja — siehe 1b** |
| J | Zwischenfrage / Kurzintervention | nein |
| K | Außenpolitische Rede mit Bündnis-/Sicherheitsbezug | nein (selten in Berlin) |
| **L** | **Fragestunde-Frage** | **NEU — Berlin-spezifisch** |

### 1b. Parlament-Kontext-Anpassung für Berlin

| Bundes-Methodology | Berlin-Äquivalent |
|---|---|
| Bundeskanzler:in | Regierende:r Bürgermeister:in |
| Bundesminister:in | Senator:in / Bürgermeister:in (Stv.) |
| Staatsminister:in | Staatssekretär:in |
| Parl. Staatssekretär:in | Staatssekretär:in |
| Bundesregierung | Senat (von Berlin) |
| Bundesländer | (entfällt — Berlin IST Land + Kommune) |
| (zusätzlich:) | Alterspräsident:in (konstituierende Sitzung nach Wiederholungswahl 2023) |
| (zusätzlich:) | Bezirke (12 in Berlin: Mitte, Friedrichshain-Kreuzberg, Pankow, Charlottenburg-Wilmersdorf, Spandau, Steglitz-Zehlendorf, Tempelhof-Schöneberg, Neukölln, Treptow-Köpenick, Marzahn-Hellersdorf, Lichtenberg, Reinickendorf) — handelnde Verwaltungs-Ebene unter dem Senat |
| (zusätzlich:) | Landesbetriebe / Anstalten: BVG, BSR, Vivantes, Charité, BIM, Howoge, Gewobag, Degewo (Berlin-eigene) |
| (zusätzlich:) | Volksentscheide (DW-Enteignung 2021, Tegel-Erhalt 2017) — direktdemokratische Referenz |

**Adressierung in der Summary:**
- „die Innensenatorin" statt „die Innenministerin"
- „der Senat" statt „die Bundesregierung"
- „im Bezirk Friedrichshain-Kreuzberg" als legitimer Akteur-Bezug
- Bei Senator:innen den **Ressort-Suffix** (aus dem PDF-Marker: „Senatorin Iris Spranger (Senatsverwaltung für Inneres, Digitalisierung und Sport)") in der Summary respektieren — z.B. „die für Inneres zuständige Senatorin"

### 1.H Regierungserklärung / Etat-Begründung (Berlin-Variante)

**Erkennungsmerkmale (Berlin):**
- Regierende:r Bürgermeister:in oder Senator:in
- Sachlich-aufzählend, Ressort-bezogen
- Berlin-spezifische Programme (Schulbau, BVG, Wohnungsbau, Bezirkshaushalte)
- Zeitvorgaben mit Bezug zu Wahlperiode

**Beispiel:** Wegner-Regierungserklärung 2023 nach Wiederholungswahl

### 1.I Fragestunde-Antwort (Berlin-Variante)

**Erkennungsmerkmale (Berlin):**
- Senator:in / Bürgermeister:in / Regierende:r Bürgermeister:in als Antwortender
- Sehr kurz (300-3000 Zeichen)
- Sachlich-defensiv
- Berliner-spezifische Themen (BVG, Schulbau, Verwaltungsreform, Bezirks-Konflikte)
- Häufig ausweichend („wird im Hauptausschuss behandelt", „Beteiligung Bundesinnenministerium läuft")

**Behandlungsregeln (analog Bundes-I):**
- Wenn ausweichend → als ausweichend benennen, NICHT zu Position erfinden (H5)
- Bei substanziellen Antworten: Kernpunkte aufzählen
- Tonalität: `defensiv_pragmatisch`

**Beispiel (Berlin):**
> Senatorin Iris Spranger (Innen) verteidigt in der Fragestunde die Senats-Haltung gegen die Klimakleber-Aktionen: über 700 Strafverfahren seien eingeleitet, 130 000 Polizei-Einsatzstunden geleistet, 240 Strafbefehle erlassen — bisher nur eine Einstellung.

### 1.L Fragestunde-Frage (NEU — Berlin-spezifisch)

**Trigger:** `speech_type = 'fragestunde_frage'` im DB-Feld. ~36 % aller Berlin-Reden.

**Erkennungsmerkmale:**
- MdL stellt Frage an den Senat (nicht: Antwort gibt)
- Sehr kurz (200-1500 Zeichen)
- Format: oft „Ich frage den Senat: …" oder Nachfrage nach Senat-Antwort
- Inhalt: konkrete Wissensabfrage ODER rhetorische Frage mit implizitem Vorwurf

**Behandlungsregeln:**
- **`forderungen[]` darf leer sein.** Eine reine Wissens-Frage hat keine Forderung. Stattdessen den Frage-Kern als 1 Bullet aufnehmen.
- **Implizite Position erkennen:** Eine rhetorische Frage trägt oft eine implizite Position. Diese als solche benennen — „die Frage suggeriert, dass X" — aber nicht als Forderung deklarieren.
- **Tonalität:** meist `sachlich`. Bei rhetorischer Frage mit Anschuldigung: `konfrontativ_belegend`. Bei polemischer Ironie: `polemisch`.
- Sehr kurze Fragen (<300 Zeichen) ohne weitere Inhalte können mit minimaler Summary auskommen.

**Beispiele (Berlin):**

Wissensabfrage:
> Paul Fresdorf (FDP) fragt den Senat, ob die Presseberichte zutreffen, dass die Senatsverwaltung für Bildung kein Konzept für Schulplätze für ukrainische Kinder hat.

Rhetorische Frage mit impliziter Position:
> Vasili Franco (GRÜNE) verweist auf die bestehenden Abschiebehaft-Kapazitäten (10 Plätze, durchschnittlich 3 genutzt, 2 Mio Euro pro Platz) und fragt rhetorisch, ob daraus nicht folge, dass die Kapazität bereits ausreichend sei.

---

## 2. Berlin-Frame-Glossar (empirisch, ~30 Frames)

**Methodik:** N-Gramm-Analyse (2-4-Gramme) über alle 11.713 Berlin-Reden mit `is_praesidium=0`. Schwelle: Mindestens 30 Reden Coverage. Plus 5 prägnante Deutungs-Frames aus 41er-Stichprobe-Validation (auch wenn seltener). Quelle: `scripts/analyze-berlin-frames.ts` + `docs/berlin-frame-discovery.md`.

**Pflicht:** Wenn diese Frames im Originaltext vorkommen, MÜSSEN sie in der Summary als `framing_marker[]` aufgenommen werden.

### Wohnen (4)
| Frame | Bedeutung | Reden (Coverage) |
|---|---|---:|
| `landeseigene_wohnungsunternehmen` | DW/Howoge/Gewobag/Degewo — Berlin-Bestand | 140 |
| `bezahlbarer_wohnraum` | cross-fraktionelles Wohnungspolitik-Ziel | 113 |
| `schneller_bauen_gesetz` | CDU-SPD-Senats-Initiative ab 2023 | 80 |
| `mieterinnen_und_mieter` | Adressat / Schutz-Anker | 317 |

### Verkehr (3)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `berliner_bvg` / `s_bahn_u_bahn` | Berliner ÖPNV-Akteure | 134 |
| `euro_ticket` / `deutschlandticket` | Tarif-Politik | 144 |
| `kiezblocks` | GRÜNE-Frame Verkehrsberuhigung | ~47 |

### Bildung (3)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `berliner_schulen` | Bildungsthema-Anker | 116 |
| `bildung_jugend_familie` | Senatsverwaltungs-Name | 75 |
| `schülerinnen_und_schüler` | Adressat / Bildungs-Anker | 219 |

### Innere Sicherheit (3)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `berliner_polizei` | Innen-Thema | 134 |
| `gegen_antisemitismus` | Anti-Rechts-Frame | 89 |
| `klimakleber_strafverfahren` | Berlin-2022/23 Senat-vs-Aktionen | ~30 |

### Sozial (2)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `soziale_infrastruktur` | LINKE-Frame (Anti-Kürzungs) | 100 |
| `menschen_mit_behinderung` | Inklusion | 80 |

### Demokratie / Anti-Rechts (3)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `unsere_demokratie` / `unserer_demokratie` | Werte-Frame | 154+92 |
| `demokratischen_fraktionen` | Anti-AfD-Code (Selbst-Ausgrenzung der AfD aus „demokratisch") | 182 |
| `kampf_gegen_rechts` | Anti-Rechts-Mobilisierungs-Frame | 197 |

### Politische Lager (3)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `rot_grün_rot` / `rot_rot_grün` | Vorgänger-Koalition 2021-2023 | 209+183 |
| `schwarz_rote_koalition` | aktuelle CDU-SPD-Koalition ab April 2023 | 146 |
| `grüne_und_linke_opposition` | aktuelle Opposition | 98+85 |

### Akteure (2)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `regierender_bürgermeister` / `regierende_bürgermeisterin` | Berlin-Pendant Kanzler | 235+115 |
| `kai_wegner` | aktueller RegBM (oft kritisch erwähnt) | 176 |

### Bezirke (3)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `friedrichshain_kreuzberg` | Berliner Bezirk (oft RGR-affin) | 127 |
| `marzahn_hellersdorf` | Berliner Bezirk (oft AfD-stark) | 103 |
| `treptow_köpenick` | Berliner Bezirk | 96 |

### Berlin-Strukturen & Pointen (4)
| Frame | Bedeutung | Reden |
|---|---|---:|
| `recht_und_ordnung_berlin` | CDU-Berlin-Frame (Anti-Linksgrün-Stadtpolitik) | 156 |
| `vergesellschaftung_art15` | Art. 15 GG / DW-Enteignung-Aktivierung (Schlüsselburg/SPD: „schlafende Riesin des Grundgesetzes") | ~15 |
| `richtlinien_der_regierungspolitik` | Berlin-Senats-Steuerungs-Dokument (Koalitionsvertrag-Pendant) | 100 |
| `mobilitätsgesetz` | Berliner Verkehrsgesetz, Kiezblocks-Grundlage | ~33 |

**Hinweis zu seltenen Frames:** `vergesellschaftung_art15`, `kiezblocks`, `klimakleber_strafverfahren` kommen zwar nur in 15-50 Reden vor, sind aber **prägnante Deutungs-Frames** mit klarer politischer Bedeutung. Wenn sie vorkommen, sollen sie konsistent getaggt werden — sonst erfindet der LLM Ad-Hoc-Tags.

---

## 3. Anti-Halluzinations-Heuristiken (übernommen H1-H10)

Heuristiken H1-H10 werden **wörtlich aus der Bundes-Methodology v2.1 übernommen.** Sie sind parlament-unabhängig.

- **H1:** Erfundene konstruktive Forderungen vermeiden
- **H2:** Sanitierte Polemik vermeiden — Tonalität bewahren
- **H3:** Verlorene Anekdoten-Pointen vermeiden
- **H4:** Multi-Punkt-Vollständigkeit
- **H5:** Fragestunde-Antworten nicht zur Position machen (Berlin: gilt analog für `speech_type='fragestunde_antwort'`)
- **H6:** „Wir werden tun"-Rhetorik als Vorhaben kennzeichnen
- **H7:** Ad-hominem mit Distanz-Markierung
- **H8:** Konkrete Zahlen sind Anker
- **H9:** Keine eigene Bewertung in der Summary
- **H10:** Selbst-Reflexion gegen Editorialisierung (NEU v2.1)

Details: siehe `docs/summarization-methodology.md` Sektion 3.

---

## 4. Wörtliche Zitate (übernommen)

Pro Summary 1-3 wörtliche Zitate aus dem `original_text` — exakt, nicht paraphrasiert. Bevorzuge Slogan-artige Phrasen, Frame-Marker, pointierte Anekdoten-Schluss-Zitate, distinkte Sprachregister.

**Berlin-spezifischer Hinweis:** Berlin-Reden zitieren häufig Personen aus dem Volksentscheid-Kontext, Vereins-Vertreter, oder Mieter-Initiativen. Diese Eigennamen können in Zitaten oder als Belege erscheinen — Original-Wortlaut bewahren.

Details: siehe `docs/summarization-methodology.md` Sektion 4.

---

## 5. Tonalitäts-Klassifikation (übernommen 11 Werte + Berlin-Beispiele)

Die 11 Tonalitäts-Werte aus der Bundes-Methodology gelten unverändert. Empirische Berlin-Beispiel-Sprecher pro Tonalität (aus 41-Reden-Stichprobe):

| Tonalität | Berlin-Beispiel-Sprecher |
|---|---|
| `sachlich` | Reifschneider (FDP/Impfangebot), Kollatz (SPD/Lichtbelästigung), Brauner (CDU/Wissenschaft-Haushalt) |
| `polemisch` | Dregger (CDU/Einbürgerungsverfahren), Gläser (AfD/Sahara-Sozialismus), Hassepaß (GRÜNE/Kiezblocks „Unglaublich!") |
| `polemisch_sachlich` | Schlüsselburg (SPD/Vergesellschaftung — sachlich + Anti-Linke-Spitze), Hansel (AfD/Regenerative-Kritik) |
| `emotional_persoenlich` | Helm (LINKE/Rostock-Lichtenhagen-Anekdote) |
| `konfrontativ_belegend` | Schlüsselburg (SPD/Vergesellschaftung), Gräff (CDU/Gewerbe-Mietrecht), Matz (SPD/Landesaufnahme), Schmidberger (GRÜNE/BIM) |
| `ironisch_jugendlich` | selten in Berlin (Bundestag: Vollath/Linke) |
| `bilanzierend_werbend` | Kraft (CDU/Mobilität-Haushalt), Brauner (CDU/Wissenschaft), Evers-Resümee (CDU/Senats-Sofortmaßnahmen) |
| `staatsmaennisch` | selten in Berlin (wenig Außenpolitik) |
| `defensiv_pragmatisch` | Spranger (SPD-Senatorin), Evers (CDU-Bürgermeister), Giffey (SPD-RegBM), Wegner (CDU-RegBM), Kreck (LINKE-ehem. Senatorin) |
| `sozial_anklagend` | Kurt (GRÜNE/Wohnungslosigkeit), Schenker (LINKE/Wohnungslos-2030), Helm (LINKE/Frauen-Förderung-Kürzungen) |
| `mahnend` | Helm (LINKE/Rostock-Lichtenhagen — teilweise mahnend wegen historisch-Anker) |

Bei Misch-Tonalität: die DOMINANTE wählen. Sekundäres in `rhetorische_mittel[]`, NICHT in den Tonalitäts-Slot.

---

## 6. JSON-Output-Schema (unverändert aus Bundes-Methodology)

Identisch mit Bundes-Methodology v2.1 (Sektion 6). Pflichtfelder:
- `reden_typ` — einer von A-K **oder L** (NEU), oder Mischung
- `tonalität` — aus 11-er-Liste
- `forderungen` — bei Typ L (Fragestunde-Frage) darf leer sein
- `wörtliche_zitate` — Substring-validiert
- `framing_marker` — bevorzugt Frames aus dem Berlin-Glossar (Sektion 2)
- `rhetorische_mittel`
- `konkrete_zahlen`
- `anti_hallucination_flags`
- `zusammenfassung_2_saetze`
- `neutralitaets_self_check`

Details: siehe `docs/summarization-methodology.md` Sektion 6.

---

## 7. Berlin-Beispiel-Outputs

### Beispiel 1 — Helm/LINKE (Frauen-Förderung-Kürzungen): Typ G `sozial_anklagend`

```json
{
  "reden_typ": "G",
  "tonalität": "sozial_anklagend",
  "forderungen": [
    "Erfüllung der Istanbul-Konvention",
    "Verlängerung der Wegweisungen von 14 auf 28 Tage",
    "Keine Kürzung der Schwangerschaftskonfliktberatung (1 Mio Euro)",
    "Berliner Initiative gegen Gewalt an Frauen erhalten",
    "Streichung des § 218 StGB"
  ],
  "wörtliche_zitate": [
    "17 Frauen sind seit Jahresanfang von einem Mann aus ihrem engsten Umfeld ermordet worden",
    "Millionen Euro für Symbolpolitik wie einen Zaun um den Görli"
  ],
  "framing_marker": ["soziale_infrastruktur"],
  "rhetorische_mittel": ["Anaphora ('Es fehlen...')", "Demo-Aufruf am Schluss"],
  "konkrete_zahlen": ["17 ermordete Frauen seit Jahresanfang", "1 Mio Euro Kürzung Schwangerschaftskonflikt", "14→28 Tage Wegweisung"],
  "anti_hallucination_flags": [],
  "zusammenfassung_2_saetze": "Anne Helm (LINKE) kritisiert die Kürzungen des Senats bei Gewaltprävention und Frauenprojekten als zynisch — 17 Frauen seien seit Jahresanfang von Männern aus ihrem Umfeld ermordet worden, während Berlin Millionen für 'Symbolpolitik wie einen Zaun um den Görli' ausgebe und gleichzeitig die Berliner Initiative gegen Gewalt an Frauen nach 20 Jahren streiche. Sie fordert Erfüllung der Istanbul-Konvention, längere Wegweisungen (14→28 Tage), keinen Stopp der Schwangerschaftskonfliktberatung und ruft zur Demo am 8. März auf dem Oranienplatz auf.",
  "neutralitaets_self_check": {
    "konfidenz": "hoch",
    "wertende_woerter_eigene": [],
    "begruendung_falls_unsicher": ""
  }
}
```

### Beispiel 2 — Spranger/SPD (Fragestunde-Antwort Klimakleber): Typ I `defensiv_pragmatisch`

```json
{
  "reden_typ": "I",
  "tonalität": "defensiv_pragmatisch",
  "forderungen": [
    "Senat positioniert sich klar gegen Klimakleber-Aktionen",
    "Strafverfahren werden konsequent verfolgt",
    "Sachstandsbericht in nächster Senatssitzung"
  ],
  "wörtliche_zitate": [
    "die Haltung des Senats ist klar",
    "der Polizei den Rückhalt und die Unterstützung"
  ],
  "framing_marker": ["klimakleber_strafverfahren", "berliner_polizei"],
  "rhetorische_mittel": ["Aufzählung Verfahren-Statistik"],
  "konkrete_zahlen": ["700+ Strafverfahren", "130 000 Polizei-Einsatzstunden", "240 Strafbefehle, 1 Einstellung"],
  "anti_hallucination_flags": [],
  "zusammenfassung_2_saetze": "Regierende Bürgermeisterin Franziska Giffey (SPD) verteidigt in der Fragestunde die Senats-Haltung gegen Klimakleber-Aktionen: über 700 Strafverfahren seien eingeleitet, 130 000 Polizei-Einsatzstunden geleistet, 240 Strafbefehle erlassen — bisher nur eine Einstellung. Sie betont die klare Senats-Position gegen Gefährdungen der öffentlichen Sicherheit und kündigt weitere Sachstandsberichte an.",
  "neutralitaets_self_check": {
    "konfidenz": "hoch",
    "wertende_woerter_eigene": [],
    "begruendung_falls_unsicher": ""
  }
}
```

### Beispiel 3 — Fresdorf/FDP (Fragestunde-Frage Ukraine-Schulplätze): Typ L `sachlich`

```json
{
  "reden_typ": "L",
  "tonalität": "sachlich",
  "forderungen": [],
  "wörtliche_zitate": [
    "kein Konzept der Senatsverwaltung für Bildung, Jugend und Familie für die Gewinnung und Schaffung von Schulplätzen für ukrainische Kinder"
  ],
  "framing_marker": ["bildung_jugend_familie"],
  "rhetorische_mittel": ["Wissensabfrage mit Presseberichts-Bezug"],
  "konkrete_zahlen": [],
  "anti_hallucination_flags": [
    "L: Reine Frage, keine Forderung. Implizite Position: 'Konzept fehlt' nur als Frage formuliert."
  ],
  "zusammenfassung_2_saetze": "Paul Fresdorf (FDP) fragt den Senat in der Fragestunde, ob die Presseberichte und Aussagen einzelner Bildungsstadträtinnen zutreffen, dass die Senatsverwaltung für Bildung, Jugend und Familie kein Konzept für Schulplätze für ukrainische Kinder hat. Die Frage spricht implizit Kritik an der Bildungsverwaltung aus.",
  "neutralitaets_self_check": {
    "konfidenz": "hoch",
    "wertende_woerter_eigene": [],
    "begruendung_falls_unsicher": ""
  }
}
```

---

## 8. Verwendung als Haiku-System-Prompt

Identisch zur Bundes-Methodology — die Berlin-Methodology-Datei wird als statisches Prompt-Asset eingebunden + gecached.

```typescript
const SYSTEM_PROMPT = `${fs.readFileSync('docs/summarization-methodology-berlin.md', 'utf-8')}

---
JETZT ANALYSIERE die folgende Berlin-Plenarrede und produziere den JSON-Output gemäß Sektion 6.
`;
```

---

## 9. Iteratives Verfeinern

Diese Methodologie ist Version 1 (Erst-Erstellung 2026-05-23). Nach erstem Vollauf prüfen:

- Welche Glossar-Frames wurden tatsächlich häufig erkannt (>50× im Vollauf)?
- Welche Frames erfindet der LLM ad hoc (in `framing_marker_json`)? — diese ggf. ins Glossar v2 aufnehmen
- Quote-Validation-Rate ≥85 %? (Bundes-Vergleich: 90,9 %)
- Tonalität-Drift <0,5 %? (Bundes-Vergleich: ~0,3 %)
- Anteil Typ L (Fragestunde-Frage) ~36 %? Wenn deutlich anders → Klassifikations-Drift untersuchen

---

## 10. Versionsgeschichte

**v1 — 2026-05-23 (Erst-Erstellung):**
- Frame-Glossar empirisch aus N-Gramm-Analyse über 11.713 Berlin-Reden + 41-Reden-Stichprobe-Validation (für Pointen-Frames)
- Schwelle: ≥30 Reden Coverage (mit Ausnahmen für prägnante Deutungs-Frames)
- Verweise auf Bundes-Methodology v2.1 für H1-H10, Tonalitäten, JSON-Schema, Sektion 4
- Neuer Reden-Typ L (Fragestunde-Frage) — Berlin-eigenes Format
- Akteure-Anpassung in Sektion 1b: Senat/Senator:in statt Bundesregierung/Bundesminister:in
- Berlin-Beispiele in Tonalitäts-Tabelle (Sektion 5)
- Berlin-Beispiel-Outputs (Sektion 7): Helm/LINKE, Spranger/SPD, Fresdorf/FDP

---

## 11. Datenquellen

- **Frame-Discovery:** `scripts/analyze-berlin-frames.ts` (N-Gramm-Skript) → `scripts/analyze-berlin-frames.report.json` (2.528 Phrasen ≥20 Reden)
- **Top-300-Review:** `docs/berlin-frame-discovery.md` (manuelle Kuration)
- **Reden-Korpus:** `berlin_speeches` (11.713 echte Reden, 80 Wortprotokolle der 19. WP)
- **Quote-Validation:** Substring-Match in `text`-Spalte
