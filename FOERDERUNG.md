# Politik-Radar — Förderstrategie

> Stand 2026-04-28. Fristen und Konditionen ändern sich häufig — vor jedem Antrag auf der Programmseite verifizieren.

## Inhalt

1. [App-Beschreibung (3 Längen)](#app-beschreibung)
2. [Förderlandschaft](#foerderlandschaft)
3. [Rechtsform-Optionen](#rechtsformen)
4. [Empfohlener Pfad](#empfohlener-pfad)

---

## App-Beschreibung

### Kurzfassung (~120 Wörter, für Antragsformulare)

Politik-Radar ist eine offene Webplattform für Transparenz im deutschen politischen System. Sie aggregiert öffentlich verfügbare Daten zu allen 629 Mitgliedern des 21. Deutschen Bundestages — Lebensläufe, Reden, Anfragen, Anträge, Abstimmungen, Ausschussarbeit, Nebeneinkünfte und Wahlkreise — und macht sie suchbar, vergleichbar und durchsichtig. Strukturierte Lebensläufe werden mit einer halluzinations-resistenten LLM-Pipeline aus mehreren Quellen erzeugt; perspektivisch kommt ein Multi-LLM-Konsens-System hinzu, das politische Texte parallel von Modellen unterschiedlicher Anbieter analysieren lässt, um einseitige KI-Bewertungen zu vermeiden. Die Plattform richtet sich an Bürger:innen, Journalist:innen, Lehrkräfte und zivilgesellschaftliche Recherche und ist Open Source.

### Mittlere Fassung (~350 Wörter, für Hauptanträge)

**Was ist Politik-Radar?**
Eine zivilgesellschaftliche Open-Source-Plattform, die parlamentarische Daten Deutschlands strukturiert, anreichert und in einer bürger:innen-tauglichen Oberfläche zugänglich macht. Quellen sind unter anderem abgeordnetenwatch.de, das Open-Data-Portal des Bundestags (Drucksachen, Plenarprotokolle, namentliche Abstimmungen), Wikidata und persönliche Politiker:innen-Homepages.

**Was ist heute schon da?**
Eine Datenbank zu allen 629 MdBs mit 99,8 % Lebenslauf-Coverage, vollständigen Mandaten, Wahlkreisen, Fraktionen, Wikipedia-Biografien, Twitter-/Instagram-Handles und Fotos. Alle Reden des aktuellen Bundestags sind als KI-erzeugte Kurzzusammenfassungen verfügbar; Anfragen, Anträge, Drucksachen und Ausschussprotokolle sind ebenso lokal gespiegelt. Die Detailseiten der MdBs verbinden diese Daten zu Profilen.

**Was ist die Vision?**
Drei Säulen:

1. **Aufklärung** — komplexe Politik in Bürgersprache übersetzen (KI-Dolmetscher für Reden, Anträge, Drucksachen).
2. **Kontrolle** — Geld- und Einflussströme sichtbar machen: Conflict-of-Interest-Matrix (Ausschuss × Nebenjob), Drehtür-Detektor (Lobbywechsel), Top-Verdiener-Ranking, Schweige-Liste inaktiver MdBs.
3. **Vergleichbarkeit** — Vote-Browser, Faction-Loyalty-Berechnung, Partei-Vergleichs-Dashboards, perspektivisch Erweiterung auf 16 Landtage und das Europäische Parlament.

**Was ist methodisch besonders?**
Politik-Radar will jede generierte Aussage auditierbar machen. Deshalb wird ein **Multi-LLM-Konsens-System** entwickelt: Texte werden parallel von Modellen unterschiedlicher Anbieter (Anthropic, OpenAI, Google, Open-Source) analysiert, divergierende Outputs werden semantisch verglichen und in der UI transparent dargestellt („3/4 Modelle einig, 1 abweichend — siehe Begründung"). Damit wird der naheliegende Vorwurf der KI-Parteilichkeit konstruktiv entschärft.

**Wer profitiert?**
Bürger:innen mit niedrigschwelligem Zugriff; Journalist:innen mit Recherche-Werkzeug; Lehrkräfte für politische Bildung; NGOs für Lobbymonitoring; Forschende mit strukturierten Datensätzen.

**Tech-Stack:** Next.js, TypeScript, SQLite. Code, Daten und Pipelines sind offen.

### Long-Form

Bei Bedarf ausbaubar in den Antragsstil des konkreten Topfs (Prototype Fund: Problem/Lösung/Wirkung; Mercator: Wirkungsmodell; CERV: Stakeholder-Logik).

---

## Förderlandschaft

### Top-Priorität (Solo möglich, ohne Rechtsform)

| # | Programm | Fördersumme | Nächster Call | Status |
|---|---|---|---|---|
| 1 | **Prototype Fund** (BMBF/OKFN) | bis **158.000 €** Teamförderung; ~47.500 €/6 Monate Solo | **01.10.–30.11.2026**, Förderbeginn 06/2027 | Aktiv. **Keine Rechtsform nötig.** |
| 2 | **MIZ Babelsberg** (mabb) | bis **40.000 €** + Coaching + Studio | nächster Call Sommer/Herbst 2026 | Aktiv, Solo möglich. Setzt **BB-Bezug** voraus. |

→ Realistischer Hauptpfad: Prototype Fund Class 03. Framing: „Software Infrastructure für demokratische Datenanalyse mit Multi-LLM-Konsens" — passt in die seit 2024 dominanten Themen *Data Literacy* + *Software Infrastructure* + *FOSS*.

### Zweite Reihe (Trägerorganisation nötig)

- **Civic Innovation Platform / Civic Coding (BMAS)** — bis 500.000 €. Nächste Runde noch nicht bestätigt, abhängig vom Bundeshaushalt 2027. Konsortium nötig.
- **Stiftung Mercator – Demokratie & digitalisierte Gesellschaft** — proaktive Förderung über Skizzen, kein offener Call. Inhaltlich Top-Match.
- **Schöpflin Stiftung** — laufend, jederzeit Antrag möglich, **nur gemeinnützige Träger**.
- **Robert Bosch Stiftung** — KI/Demokratie-Schwerpunkt 2026 (~17 Mio. €), kein offener Call, Beziehungsaufbau nötig.
- **Wikimedia Deutschland** — FOKAI-Programm startet 2026, passt wenn Politiker-Daten als Wikidata-Beitrag gedacht werden.

### EU-Ebene (Konsortium nötig)

- **CERV 2026** — Bürgerbeteiligungs-Strang 76 Mio. €. Mehrländer-Konsortium quasi Pflicht. Realistisch erst Schritt 3–4 nach Validierung.

### Journalismus-Spin

- **Otto-Brenner-Recherchestipendium** — ~6.000 € pro Projekt, jährlich. Passt für **Demonstrationsrecherche** mit den Daten (z. B. Drehtür-Detektor als Story).
- **Netzwerk Recherche / Grow-Stipendien (mit Schöpflin)** — Herbst 2026, gemeinnütziger Journalismus-Setup nötig.

### Eher nicht

- **bpb Modellförderung** — 2026er Mittel verbraucht.
- **Demokratie leben!** — strukturell auf Träger der freien Jugendhilfe zugeschnitten.
- **DSEE** — Mikroförderungen 500 – 1.500 €, falscher Hebel.
- **Hertie / Bertelsmann** — operativ, fördern selten extern.

---

## Rechtsformen

### Vergleich: Welche Rechtsform für Solo-Civic-Tech?

| | **Freiberufler** | **e.V.** | **gUG** | **gGmbH** |
|---|---|---|---|---|
| Mindestgründer | 1 | **7** | 1 | 1 |
| Stammkapital | 0 € | 0 € | ab 1 € (real ~1 k €) | **25.000 €** (12,5 k bei Gründung) |
| Notar | nein | ~25–70 € (Beglaubigung) | 300–700 € | 400–1.000 € |
| Gemeinnützigkeit | unmöglich | ja | ja | ja |
| Buchhaltung | EÜR | EÜR | doppelte BF + Bilanz + Bundesanzeiger | doppelte BF + Bilanz + Bundesanzeiger |
| Steuerberater | optional | optional | praktisch Pflicht | Pflicht (~1,5–3 k/J) |
| Gesamt-Gründungskosten | 0–50 € | 120–200 € | 600–1.100 € | 800–1.500 € + 25 k Kapital |
| Zeitrahmen bis Freistellungsbescheid | — | 3–6 Monate | 3–5 Monate | 3–5 Monate |

### Wann was?

- **Freiberufler bleiben** — Phase 1: Prototype Fund einsammeln (47.500 €), Sichtbarkeit aufbauen. **Schließt Mercator/Schöpflin/CIP aus.**
- **e.V. gründen** — nur sinnvoll, wenn 6 echte Mitstreiter:innen vorhanden sind. Strohleute werden vom Finanzamt zurückgewiesen.
- **gUG gründen** — wenn Haftungsbeschränkung + Gemeinnützigkeit nötig sind, aber 25 k € fehlen. Dauerhafte Rücklagenpflicht (25 % der Gewinne) bremst Reinvestitionen, Image bei Stiftungen weniger seriös.
- **gGmbH gründen** — erst bei nachhaltigem Förderfluss > 50.000 €/Jahr, wenn Anstellungen geplant sind und Mercator/Schöpflin regelmäßig sechsstellig fördern soll.

### Trägerverein-Modell (empfohlene Brücke)

**Du musst nicht selbst gründen.** Etablierter Weg in der deutschen Civic-Tech-Szene:

- **Trägerverein** (OKFN Deutschland, Wikimedia Deutschland, Bündnis F5, Liquid Democracy e.V., Code-for-Germany-Vereine) wird formaler Antragsteller; du bist Projektleitung.
- **Verwaltungspauschale**: 5–10 % der Fördersumme an den Träger.
- **Voraussetzung**: bestehende Beziehung. Erst Mitglied/aktiver Beitragender werden, dann Projekt einbringen — kalt anschreiben funktioniert selten.
- **Risiken**: Träger hat formale Verfügungsgewalt, Verwendungsnachweis-Pflichten landen letztlich bei dir, kein einfacher Exit bei Reibung.

---

## Empfohlener Pfad

1. **Sofort (Mai 2026)**: Freiberufler bleiben. Projekt öffentlich auf GitHub, README/Demo polieren, Twitter-/Mastodon-Präsenz aufbauen.
2. **Mai – August 2026**: Demonstrationsrecherche mit Politik-Radar-Daten (Conflict-of-Interest-Matrix oder Drehtür-Detektor) als Story platzieren — ggf. mit Journalist:innen-Kooperation. Macht den Antrag stärker und qualifiziert für Otto-Brenner-Stipendium (Bewerbung Anfang 2027).
3. **Juni – September 2026**: Kontakt zu OKFN Deutschland / Wikimedia DE / einem regionalen Code-for-DE-Verein knüpfen (Mitgliedschaft, Talks, Beiträge).
4. **Sommer/Herbst 2026**: MIZ Babelsberg-Call beobachten, falls BB-Bezug herstellbar.
5. **Oktober/November 2026**: **Prototype-Fund-Antrag Class 03** einreichen. Förderbeginn Juni 2027.
6. **Bei Zusage**: Prototype-Fund-Phase nutzen, um a) Multi-LLM-Konsens-System zu bauen, b) Sichtbarkeit zu maximieren, c) Trägerverein-Beziehung zu konkretisieren.
7. **2027 / nach Prototype Fund**: Über Trägerverein Mercator/Schöpflin/CIP angehen. **Erst bei dauerhaftem Förderfluss > 50 k €/Jahr** eigene gGmbH erwägen.
