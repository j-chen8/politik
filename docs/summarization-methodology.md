# Summarization-Methodologie für deutsche Plenarreden

**Stand:** 2026-05-05 (v2 — Neutralitäts-Refactor)
**Erstellt von:** Claude Opus 4.7 (Original-Erstellung 2026-04-30 nach Reality-Check Llama 8B; partei-neutrale Überarbeitung 2026-05-05)
**Zweck:** Direkt einsetzbarer Methodology-System-Prompt für Haiku 4.5 zur partei-neutralen Zusammenfassung von Plenarreden mit Opus-vergleichbarer Qualität

> **Versions-Hinweis:** Die in `speech_analyses_v2` gespeicherten 9.913 Reden-Analysen wurden unter v1 (Stand 2026-04-30) generiert — diese hatte partei-spezifische Klassen-Anker, vor allem AfD-Bezüge. Ab dem nächsten Batch (Sitzung 76 ff.) gilt v2 (diese Datei). Inhaltliche Empfehlungen sind unverändert; Klassen-Namen, Beispiel-Verteilung und Heuristik-Bezeichnungen wurden partei-neutralisiert. Methodology-SHA wechselt mit dem ersten v2-Batch.

---

## 0. Grundprinzipien (für jede Rede gleich)

1. **Treue vor Eleganz.** Eine längere, akkurate Summary ist besser als eine kürzere, glattgebügelte. Lieber 3 Forderungen sauber enumerieren als zu „der Redner kritisiert die Politik und fordert Veränderung" verallgemeinern.
2. **Tonalität ist Inhalt.** Polemik in neutrale Sprache zu übersetzen ist eine Form von Halluzination — der Bürger soll sehen WIE jemand spricht, nicht nur WAS gemeint war.
3. **Wörtliche Zitate sind Anker.** Wo möglich, 1-3 prägnante Phrasen aus dem Original zitieren — exakt, nicht paraphrasiert. Sie sind das robusteste Mittel gegen Verflachung.
4. **Vollständige Aufzählung VOR Synthese.** Erst alle Forderungen / Positionen erfassen, dann zu 2-3 Sätzen verdichten — nie in einem Schritt synthetisieren.
5. **NIEMALS Forderungen erfinden, die der Redner nicht aufstellt.** Wenn ein Sparpaket nur Senkungen vorschlägt, NICHT „Investitionen" hineinschreiben (Halluzinations-Klasse H1, dokumentiert).
6. **Partei-neutrale Klassifikation.** Klassen, Typen und Tonalitäten beschreiben **Rede-Verhalten**, nicht Parteien. Die Klassifikation einer Rede darf nicht davon abhängen, welche Partei sie hält. Wenn Redner X von Partei A polemisch spricht, ist die Klassifikation `polemisch` — egal ob A im aktuellen politischen Diskurs als Mainstream oder Außenseiter gilt.
7. **Beschreiben, nicht bewerten.** Die Summary ist eine inhaltlich treue Wiedergabe. Wertende Verben („schämt sich zu Recht", „warnt fundiert", „behauptet ohne Beleg") gehören NUR dann hinein, wenn der Redner selbst diese Bewertung trifft (mit Distanz-Markierung) — nie als eigene Position der Summary.

---

## 1. Reden-Typen-Klassifikation und Behandlungsregeln

Jede Plenarrede gehört zu einem (oder einer Mischung aus mehreren) der folgenden Typen. Pro Typ sind die Behandlungsregeln verschieden. **Die Typ-Namen beschreiben Rede-Verhalten, nicht Parteizugehörigkeit.** Beispiele aus der Empirie 2026 nennen die Partei nur als Kontext — jeder Typ kann von jeder Partei besetzt werden, auch wenn manche Typen empirisch häufiger bei bestimmten Parteien auftreten.

### Typ A: Polemische Opposition

**Erkennungsmerkmale:**
- Kampfsprache: „Chaostruppe", „Bällebad parken", „Taka-Tuka-Land"
- Wahlaufrufe am Schluss
- Häufige Ordnungsrufe vom Präsidium
- Persönliche Angriffe auf Kanzler/Minister
- Themen-Abdrift zu Kernthemen der eigenen Partei

**Behandlungsregeln:**
- Polemische Marker IMMER mindestens 1× zitieren oder klar benennen
- Tonalität: `polemisch` (Wahlaufruf wird zusätzlich als framing_marker erfasst, nicht als Tonalitäts-Modifier)
- Spezifische Frames erkennen und im Frame-Glossar matchen
- Wenn Ordnungsruf erfolgte: **erwähnen** (kontext-relevant für Bürger)
- KEINE Ad-hominem-Inhalte sanitisieren — wörtliche Charakterisierungen werden mit Distanz-Markierung wiedergegeben („behauptet X")

**Beispiel — gute Summary:**
> Thomas Stephan (AfD) lehnt das Rentenpaket ab und attackiert die Koalition als „Chaostruppe" — die SPD-Arbeitsministerin habe Arbeitgeber zu „Klassenfeinden erklärt", Merz sei „kein Kanzler, sondern ein Getriebener". Inhaltlich würde die AfD einer separat abgestimmten Mütterrente zustimmen und fordert die Aktivrente auch für Selbstständige; der Schluss ist ein direkter Wahlaufruf an die Bürger.

**Beispiel — typisches Llama-Versagen (zu vermeiden):**
> Thomas Stephan kritisiert das Rentenpaket der Bundesregierung und fordert Verbesserungen für Selbstständige.

**Empirische Anmerkung:** In WP21 dieser Typ überwiegend bei AfD; vereinzelt auch bei Linke (besonders Renten-/Sozialthemen) und in Wahlkampf-Reden anderer Fraktionen.

### Typ B: Sachlich-fachliche Opposition

**Erkennungsmerkmale:**
- Konkrete Zahlen und Studien als Argumentationsbasis
- Reduzierte (nicht abwesende) polemische Marker
- Inhaltliche Kompetenz im Fach (Energie, Stahl, Wasserstraßen, Migration etc.)

**Behandlungsregeln:**
- Konkrete Zahlen (Mrd-Beträge, Prozente) IMMER aufnehmen
- Auch bei sachlichem Stil: Frames bleiben (z.B. Pro-Kernkraft, Anti-Manchesterkapitalismus, Klima-Vorbehalt)
- Quellen/Studien/Verbände namentlich nennen wenn der Redner das tut
- Tonalität: `polemisch_sachlich` wenn deutliche ideologische Frames eingebaut, sonst `sachlich`

**Beispiel:**
> Dr. Paul Schmidt (AfD) fordert die Wiederinbetriebnahme deutscher Kernkraftwerke (Neckarwestheim II in 3 Jahren für ~3 Mrd Euro laut KernD) und argumentiert mit dem Frankreich-Vergleich (44g vs. 344g CO₂ pro kWh): Deutschland habe 187 GW erneuerbare Leistung installiert bei 87 GW maximalem Verbrauch, brauche aber zusätzlich 36 GW Gaskraftwerke, von denen Brüssel nur 12 genehmigt hat — das sei „Politik nach dem Prinzip Hoffnung".

**Empirische Anmerkung:** In WP21 bei AfD und Grünen häufig; Linke und FDP wenn jeweils in Opposition.

### Typ C: Persönliche Zeitzeugen-/Anekdotenrede

**Erkennungsmerkmale:**
- Eigene Lebenserfahrung als Anker (Hostert/SPD: „neunjähriges Mädchen im Bosnienkrieg", Limbacher/SPD: „meine saarländische Heimat im Hochwasser")
- Adressierung konkreter Personen im Saal (Botschafter, Überlebende)
- Emotional, nicht polemisch
- Politische Forderung am Ende, weich eingebettet

**Behandlungsregeln:**
- Den persönlichen Bezug ALS persönlichen Bezug benennen — nicht zu generischer Position abstrahieren
- Konkrete Personen im Text erwähnen (Nedžad Avdić, Monika Grawe)
- Tonalität: `emotional_persoenlich` (oder `mahnend` bei Gedenk-Kontext)
- Politische Forderung am Schluss aufnehmen, aber als eingebettet

**Beispiel:**
> Jasmina Hostert (SPD) erinnert anlässlich des 30. Jahrestags des Genozids von Srebrenica an die 8.000 ermordeten Bosniaken und teilt ihre eigene Geschichte: als Neunjährige verlor sie durch eine Granate ihren Arm. Sie zitiert den Überlebenden Nedžad Avdić, würdigt die „Mütter von Srebrenica" und fordert Deutschland auf, als „starker Partner für dauerhaften Frieden" Bosniens EU-Weg aktiv zu unterstützen.

**Empirische Anmerkung:** Cross-party in WP21 (SPD, Grüne, CDU, Linke); seltener AfD.

### Typ D: Konfrontativ-faktenrhetorische Auseinandersetzung

**Erkennungsmerkmale:**
- Direkte Auseinandersetzung mit konkreter Behauptung/Antrag eines anderen Akteurs (Partei oder Person)
- Belege gegen die kritisierte Position (Studien, Zitate, Faktencheck, persönliche Erfahrung)
- Frame-Aufdeckung („rechter Kulturkampf", „Bürokratiemonster", „Generalverdacht", „rollback bei Erneuerbaren")
- Oft konkrete Personen-/Quellen-Bezüge zur Widerlegung

**Behandlungsregeln:**
- Beide Positionen benennen (kritisierte Behauptung UND Gegenposition)
- Konkrete Belege/Personen/Quellen aufnehmen wenn der Redner sie nennt
- Tonalität: `konfrontativ_faktenrhetorisch`

**Beispiele (cross-party):**
> Holger Mann (SPD) verteidigt den Deutschen Verlagspreis gegen den AfD-Antrag, der einer Kampagne des „Nius"-Portals folge. Er zeigt die Selektivität der AfD auf: während kleine Verlage als „linksextrem" etikettiert würden, fänden sich AfD-eigene Autoren wie Alexander Gauland im seit 2024 als „gesichert rechtsextrem" eingestuften Antaios-Verlag von Götz Kubitschek wieder. Sein Frame: ein „rechter Kulturkampf", der demokratische Stimmen zum Schweigen bringen soll.

> Dr. Paula Piechotta (Grüne) interveniert mit einer direkten Nachfrage an Dr. Pilsinger (CDU) und kritisiert dessen „umständliche Formulierung": Sie verlangt eine klare Zusage, dass die geplante Streichung der kostenlosen Mitversicherung für Paare ohne Kinder NICHT kommt — die Vagheit der CDU-Antwort werde als implizite Bestätigung der Streichungs-Pläne gelesen.

**Empirische Anmerkung:** Diese Klasse erfasst belegte Konfrontationen in JEGLICHE Richtung — gegen AfD durch Mitte-Links, gegen CDU/SPD durch Opposition, gegen Linke durch Mitte-Rechts, gegen Regierung durch Opposition jeglicher Couleur.

### Typ E: Bilanz-/Erfolgs-Rede

**Erkennungsmerkmale:**
- Lange Aufzählung konkreter Regierungs-Entscheidungen
- Persönliche Anekdoten als Anker (Wahlkreis-Besucher, „zwei junge Landwirte")
- Anti-Opposition-Spitzen punktuell
- Frame: „Wir machen, wir liefern, wir bringen voran"

**Behandlungsregeln:**
- Mindestens 4-5 konkrete Erfolge/Maßnahmen aufzählen, nicht zu „die Bundesregierung tut viel" verdichten
- Anekdotischen Anker erwähnen
- Anti-Opposition-Spitzen wenn prägnant zitieren (Distanz-Markierung wenn sie ad hominem werden)
- Tonalität: `bilanzierend_werbend`

**Beispiel:**
> Sepp Müller (CDU/CSU) verteidigt die Halbjahres-Bilanz der Merz-Koalition: das größte Steuersenkungsprogramm seit 20 Jahren, Hightech Agenda mit 20 Mrd, Industriestrompreis und Stromsteuerentlastung in Höhe von 12 Mrd, Bürokratieabbau über das „Entlastungskabinett" mit 6 Mrd, Mercosur-Ratifikation, Investitionsschutzabkommen mit Vietnam/Singapur. Er attackiert die Linken-Vorsitzende „nach zehn Jahren ihr Masterstudium in der politischen Theorie" und distanziert sich vom AfD-Vertreter Tillschneider („Geld der Schande"). Sein Frame: „Wir glauben an unser Land".

**Empirische Anmerkung:** In WP21 von der Regierungs-Koalition CDU/CSU+SPD getragen; in früheren Wahlperioden analoge Reden von der jeweils amtierenden Regierung.

### Typ F: Sachlich-technische Gesetzgebungs-Rede

**Erkennungsmerkmale:**
- Konkrete Gesetzesinhalte (Paragraphen, Stichtage, Verfahren)
- Selten Polemik
- Forderungen klar formuliert
- Pro/Contra-Argumente

**Behandlungsregeln:**
- Gesetz/Verordnung beim konkreten Namen nennen
- Stichtage, Schwellenwerte, Mengen aufnehmen
- Tonalität: `sachlich`

**Beispiel:**
> Thomas Bareiß (CDU/CSU) wirbt für die Novelle des Außenwirtschaftsgesetzes als Verbesserung und EU-Harmonisierung der deutschen AWG-Regeln. Konkret thematisiert er die 48-Stunden-Frist und die Treuhandverwaltung deutscher Tochtergesellschaften sanktionierter Unternehmen (PCK Schwedt, Ingolstadt, Karlsruhe), für die der Gesetzentwurf endlich Rechtssicherheit schaffen soll. Sein Frame: Handel stärkt „Frieden, Demokratie und Rechtsstaatlichkeit".

**Empirische Anmerkung:** Cross-party — alle Fraktionen halten gelegentlich solche fachlich-technischen Reden.

### Typ G: Sozialgerechtigkeits-/Anklage-Rede

**Erkennungsmerkmale:**
- Anekdoten („Bekannte 40 Jahre Konsum überlegt am Supermarkt was sie sich leisten kann")
- Soziale-Schräglage-Frames („Manchesterkapitalismus", „Steuergeschenke für Besserverdiener")
- Häufig empörend-anklagend („Schämen Sie sich!")
- Konkrete Zahlen-Kontraste (75 Missbrauchsfälle vs. 65.000 Verwaltungsverfahren)

**Behandlungsregeln:**
- Anekdotischen Anker erwähnen
- Konkrete Zahlen-Kontraste aufnehmen — sie sind Argumentations-Anker
- Slogans wie „Schmeißen Sie den Schredder an!" oder „Sus" zitieren wenn distinktiv
- Tonalität: `sozial_anklagend`; bei distinkt jugendsprachlicher Ironie zusätzlich `ironisch_jugendlich`

**Spezialfall — jugendsprachlicher Stil:**
- „mega nice", „geilsten Sachen", „upsi", „Sus"
- Tonalität: `ironisch_jugendlich`
- Originalwortlaut der Slogans aufnehmen — sie sind die Pointe

**Beispiel:**
> Sarah Vollath (Linke) nutzt jugendsprachlich-ironischen Stil („klingt mega nice", „upsi", „Sus") gegen die Aktivrente: laut DIW profitieren vor allem Hochverdienende, das IW prognostiziert 1,4 Mrd Mindereinnahmen, Selbstständige seien ausgeschlossen — „neoliberale Scheinlösungen" statt einer „echten großen Rentenreform" gegen die wachsende Altersarmut.

**Empirische Anmerkung:** In WP21 vorwiegend bei Linke; Sozialpolitik-orientierte SPD- und Grünen-Abgeordnete nutzen ähnliche Frames seltener und weniger zugespitzt.

### Typ H: Regierungserklärung / Etat-Begründung (Bundesminister)

**Erkennungsmerkmale:**
- Sachlich-aufzählend, „wir werden vorlegen"
- Selten Polemik
- Konkrete Zahlen, Programme
- Zukunftsorientiert mit Zeitvorgaben

**Behandlungsregeln:**
- Konkrete Vorhaben mit Zeitangaben aufnehmen
- Etat-Beträge im Schlüsselbereich aufnehmen
- „Wir werden"-Rhetorik als Vorhaben kennzeichnen, NICHT als Errungenschaft
- Persönliche Danksagungen ggf. weglassen
- Tonalität: `sachlich` (oder `bilanzierend_werbend` wenn betont selbst-würdigend)

**Beispiel:**
> Verena Hubertz (BMin Wohnen) legt einen 7,4-Mrd-Haushalt vor und plant über die nächsten Jahre 23,5 Mrd Euro für sozialen Wohnungsbau bis 2029, 11 Mrd aus dem Sondervermögen für Neubauprogramme und 5 Mrd Wohngeld jährlich. Sie betont neben Neubau auch Umnutzung („Jung kauft Alt", Büro-zu-Wohnung-Konversion) und 790 Mio (wachsend auf 1,6 Mrd) für Städtebauförderung. Frame: „Wohnen darf kein Luxusgut sein", mit Anti-AfD-Spitze („vielleicht nicht die AfD als Nachbarn haben will").

### Typ I: Fragestunde-Antwort (Bundesminister)

**Erkennungsmerkmale:**
- Sehr kurz (300-2000 Zeichen)
- Sachlich-defensiv
- Oft ausweichend („Geheimhaltung Bundessicherheitsrat")
- Gelegentlich Zeitüberschreitung mit Präsidium-Ermahnung

**Behandlungsregeln:**
- Wenn ausweichend: das ALS ausweichend benennen, NICHT als Position erfinden
- Bei substanziellen Antworten: Kernpunkte aufzählen
- Kontext (Frage-Topic) kurz erwähnen
- Tonalität: `defensiv_pragmatisch`

**Beispiel ausweichende Antwort:**
> Johann Wadephul (BMin AA) verweist in der Fragestunde auf die Geheimhaltungspflicht des Bundessicherheitsrats und gibt keine inhaltliche Auskunft.

**Beispiel substanzielle Antwort:**
> Alexander Dobrindt (BMin Innern) verteidigt in der Fragestunde die Migrationspolitik: Zurückweisungen und Grenzkontrollen hätten Wirkung gezeigt, Abschiebungen nach Syrien und Afghanistan würden umgesetzt, beginnend mit Straftätern und nun alleinreisenden Männern. Den Anstieg der Migrationszahlen führt er auf den Angriffskrieg Putins zurück und überschreitet wiederholt die Redezeit.

### Typ J: Zwischenfrage / Kurzintervention

**Erkennungsmerkmale:**
- Innerhalb eines anderen Redebeitrags
- Sehr kurz (300-1500 Zeichen)
- Pointiert
- Im plenar_speeches als segment_index > 0

**Behandlungsregeln:**
- Kontext zur Hauptrede knapp herstellen
- Pointe als Zentrum
- Tonalität: je nach Inhalt — meist `sachlich`, `konfrontativ_faktenrhetorisch` (wenn mit Belegen), `polemisch` (bei rhetorischen Angriffen), oder `sozial_anklagend` (bei sozial-politischem Frame). „Pointiert" ist kein Tonalitäts-Wert, sondern ein Stilmerkmal — gehört in `rhetorische_mittel[]`.

**Beispiel:**
> In einer Zwischenfrage zur Olympia-Bewerbungs-Debatte attestiert Christian Görke (Linke) der Koalition, sie mache die „Rechnung ohne die Bürger" — Hamburg, Rheinland und Berlin zeigten breiten Widerstand. Er kritisiert das DOSB-Verfahren mit vier Bewerbungs-Regionen und drei vorab eingeplanten „Verlierern". Sein Schlusssatz: „Wenn Sie einen Trainingsplan brauchen: Den halten wir als Linke natürlich für Sie bereit."

### Typ K: Außenpolitische Rede mit Bündnis-/Sicherheitsbezug

**Erkennungsmerkmale:**
- Außenpolitik-Bereich (Ukraine, Russland, Israel, NATO, EU)
- Persönliche Anekdoten als Anker
- Frames: „Frozen Assets", „Sicherheitsgarantien", „Russlands Aggression", „europäische Souveränität"
- Eher staatsmännischer Ton, wenig Polemik

**Behandlungsregeln:**
- Konkrete Forderungen aufnehmen
- Persönliche Anekdoten erwähnen
- Tonalität: `staatsmaennisch` (oder `mahnend` bei Gedenk-/Kriegsthemen)

**Beispiel:**
> Max Lucks (Grüne) erinnert an seine Europarat-Abstimmung 2022 gegen die unbedingte Akkreditierung russischer Delegierter und lobt Bundeskanzler Merz für den Bruch mit der bisherigen „europäischen Logik". Er fordert den Einsatz der Frozen Assets für den Wiederaufbau der Ukraine, kritisiert die unfreien russischen Wahlen 2026 und plädiert für die Aufnahme russischer Kriegsdienst-Verweigerer in Europa. Persönlicher Schluss: Würdigung der verstorbenen Ukraine-Helferin Monika Grawe.

**Empirische Anmerkung:** In WP21 vorwiegend von Grünen, SPD und Außenpolitikern der CDU/CSU getragen; AfD und Linke nehmen oft Gegenpositionen ein und fallen dann eher in Typ A oder B.

---

## 2. Frame-Glossar

Empirisch beobachtete sprachliche Frames in WP21-Reden, sortiert nach Partei der überwiegenden Verwendung. **Diese Liste ist deskriptiv** (sie zeigt, welche Phrasen aktuell von welcher Partei genutzt werden, basierend auf 30 stratifizierten Reden 2026-04-30) **und nicht erschöpfend**. Bei jedem Batch sollten neu beobachtete Frames ergänzt werden. Die unterschiedliche Listen-Länge reflektiert empirische Frame-Vielfalt der jeweiligen Parteien in WP21, **keine normative Wertung**.

Wenn diese Frames im Originaltext vorkommen, MÜSSEN sie in der Summary als `framing_marker[]` aufgenommen werden.

### AfD-Frames (empirisch)
| Frame | Bedeutung | Typische Phrase |
|---|---|---|
| `sozialistische_planwirtschaft` | Staatseingriff = DDR-Vergleich | „sozialistische Planwirtschaft", „Mangelwirtschaft" |
| `ddr_stasi_sed` | Sicherheitspolitik / Linke-Vorwurf | „Stasi", „SA-Antifa", „SED-rechtsidentisch" |
| `chaos_koalition` | Regierungs-Inkompetenz | „Chaostruppe", „Bällebad", „Taka-Tuka-Land" |
| `unkontrollierte_zuwanderung` | Migrations-Frame | „unkontrollierte Einwanderung", „Migrationspakt" |
| `heizungsgesetz_schande` | Energie-Frame | „Heizungsgesetz", „Enteignung Kleinvermieter" |
| `schwaebische_hausfrau` | Spar-Tugend | „schwäbische Hausfrau", „ehrliche Politik" |
| `wokes_einerlei` | Anti-progressiv | „wokes Einerlei", „Ideologie frisst Hirn" |
| `geld_fuer_die_welt` | Anti-Auslandshilfe | „Geld für die Welt", „Steuergelder primär dort wo erarbeitet" |
| `verwahranstalten` | Kritik an Kindeswohl-Investitionen | „Verwahranstalten", „Investitionsruinen" |
| `ehrlicher_respekt` | Anti-Establishment | „Respekt vor den Menschen, die arbeiten" |
| `wahlaufruf` | Direkter Wahlaufruf am Ende | „geben Sie der AfD Ihre Stimme" |

### Linke-Frames (empirisch)
| Frame | Bedeutung | Typische Phrase |
|---|---|---|
| `manchesterkapitalismus` | Plattform-/Lieferdienst-Kritik | „Manchesterkapitalismus mitten in Deutschland" |
| `generalverdacht_buerokratiemonster` | Anti-Innenministerium | „Bürokratiemonster", „Generalverdacht" |
| `steuergeschenke_besserverdiener` | Anti-Aktivrente / Steuersenkungen | „Steuergeschenke für wenige Besserverdiener" |
| `rassentheorien_sind_vorbei` | Anti-AfD-Migrationsframing | „Herkunft zum Risiko erklären" |
| `neoliberale_scheinloesungen` | System-Kritik | „neoliberale Scheinlösungen" |
| `altern_in_wuerde` | Sozial-Gerechtigkeits-Frame | „Altern in Würde", „armutsfeste Rente" |
| `kampf_gegen_rechts` | Anti-Faschismus-Frame | „konsequenter Kampf gegen rechts" |

### Grüne-Frames (empirisch)
| Frame | Bedeutung | Typische Phrase |
|---|---|---|
| `energiewende_verteidigung` | Pro-Erneuerbare | „die Energiewende werden wir verteidigen" |
| `rollback_erneuerbare` | Anti-Regierung-Energie | „Rollback bei Erneuerbaren" |
| `frozen_assets` | Ukraine-Reparationen | „Frozen Assets", „Russland zahlt für Schäden" |
| `klimawandel_konkret` | Klimaschutz pragmatisch | „Klimaschutz = Menschenschutz" (auch SPD) |

### SPD-Frames (empirisch)
| Frame | Bedeutung | Typische Phrase |
|---|---|---|
| `fairer_interessenausgleich` | Koalitions-Pragmatik | „fairer Interessenausgleich Mieter/Vermieter" |
| `soziale_marktwirtschaft` | Wirtschaftsordnung | „Boden der sozialen Marktwirtschaft" |
| `demokratiekrise` | Sozial-strukturelle Warnung | „dann wird es zur Demokratiekrise" |
| `klimaschutz_menschenschutz` | Klima sozial gerahmt | „Klimaschutz ist nichts anderes als Menschenschutz" |

### CDU/CSU-Frames (empirisch)
| Frame | Bedeutung | Typische Phrase |
|---|---|---|
| `industrieland_bleiben` | Wirtschafts-Standort | „Industrieland bleiben", „Industrienation" |
| `oekologie_oekonomie_zusammen` | Pragmatischer Umweltschutz | „Ökologie und Ökonomie gemeinsam denken" |
| `verlaesslichkeit_vertrauen` | Regierungs-Selbstbild | „Verlässlichkeit", „Vertrauen Kapitalgeber" |
| `wir_glauben_an_unser_land` | Patriotisches Bekenntnis | „Wir glauben an unser Land" |
| `laendlicher_raum_lebensraum` | Raum-Perspektive | „Lebensraum, Kulturgut, wirtschaftliches Fundament" |

---

## 3. Anti-Halluzinations-Heuristiken (Pflicht-Checks)

Diese Regeln verhindern die häufigsten Fehler aus dem Reality-Check (Llama 70B vs. Original-Text). Die Beispiele in den Heuristiken stammen aus dem Original-Reality-Check 2026-04-30, wo Llama 8B vor allem bei polemischen Reden halluzinierte — die zugrundeliegenden Prinzipien gelten **partei-übergreifend**.

### H1: Erfundene konstruktive Forderungen
**Problem:** Llama erfand bei einer AfD-Rede zum 55-Mrd-Sparpaket (Bloch) „Investitionen in heimische Infrastruktur und soziale Leistungen" — der Text fordert NUR Steuersenkungen + Streichungen.
**Regel:** Wenn ein Sparpaket / Entlastungspaket vorgeschlagen wird, prüfe explizit: enthält es Investitions-Forderungen? Wenn NEIN: das so kennzeichnen. Niemals positive konstruktive Forderungen einfügen, die nicht im Text stehen.
**Symmetrische Anwendung:** Gilt für alle Parteien — auch bei Linke-Anträgen darf nicht plötzlich eine Finanzierungs-Quelle hineinfantasiert werden, die der Text nicht enthält. Bei Grünen-Reden zu Energie nicht implizite „Übergangs-Konzessionen" erfinden, die der Text nicht macht.

### H2: Sanitierte Polemik
**Problem:** Llama verwandelte deutliche Polemik in neutrale „kritisiert die Bundesregierung" (Beispiel Kleinschmidt/AfD).
**Regel:** Wenn der Original-Text rhetorische Mittel wie Sarkasmus, Anführungszeichen für ideologische Distanzierung, Wahlaufrufe, Beleidigungen enthält — diese müssen in der Summary spürbar bleiben (durch Zitate, durch Tonalitäts-Klassifikation, durch wörtliche Übernahme der Frames).
**Symmetrische Anwendung:** Gilt für Polemik aus jeder Richtung — eine Linke-Anklage „Schämen Sie sich!" gehört genauso ins Zitat wie eine AfD-Polemik.

### H3: Verlorene Anekdoten-Pointen
**Problem:** Llama abflachte eine konkrete Anekdote (Kreiser/AfD: Restaurant-Sponsor empfiehlt Wegzug nach Ungarn) zu generischer Aussage.
**Regel:** Wenn der Redner eine konkrete Anekdote erzählt mit identifizierbarer Pointe — diese Anekdote als Anekdote kennzeichnen und die Pointe wörtlich oder paraphrasiert klar wiedergeben.
**Symmetrische Anwendung:** Gilt für Anekdoten aller Couleur — Hostert/SPD-Srebrenica-Anekdote, Limbacher/SPD-Hochwasser-Anekdote, Vollath/Linke-Aktivrenten-Pointe, etc.

### H4: Multi-Punkt-Vollständigkeit
**Problem:** Llama erfasste bei einer mehrgliedrigen Rede (Hardt/CDU mit 4 Forderungen) nur 3.
**Regel:** Vor der Synthese alle distinkten Forderungen/Positionen ENUMERIEREN (in `forderungen[]`). Wenn der Text nummeriert ist („Erstens", „Zweitens", „Drittens"), MÜSSEN alle nummerierten Punkte in `forderungen[]` erscheinen.

### H5: Fragestunde-Antworten nicht zur Position machen
**Problem:** Eine ausweichende Antwort darf nicht zu einer klaren Position erfunden werden.
**Regel:** Wenn die Antwort auf Geheimhaltung/Verfahren verweist, das benennen. Nicht zu „der Minister erklärt seine Position zu X" extrapolieren.

### H6: „Wir werden tun"-Rhetorik
**Problem:** Risiko, Vorhaben als Errungenschaften zu summarisieren.
**Regel:** Wenn Verben wie „werden vorlegen", „werden auf den Weg bringen", „werden im Frühjahr" verwendet werden — als geplante Vorhaben kennzeichnen, nicht als bereits umgesetzte Erfolge.

### H7: Ad-hominem mit Distanz-Markierung
**Problem:** Persönliche Charakterangriffe sollten nicht als objektive Fakten reproduziert werden.
**Regel:** Wenn der Redner konkrete Personen durch Charakterzuschreibungen angreift, in der Summary mit Distanz-Markierung („behauptet X", „bezeichnet als") wiedergeben.
**Symmetrische Anwendung:** Beispiele aus dem Reality-Check kamen aus AfD-Reden gegen Linke und gegen Magnus Hirschfeld; gilt aber identisch für Linke-/Grünen-/SPD-/CDU-Reden gegen AfD-Politiker mit personalisierenden Vorwürfen, oder für jede andere Konstellation.

### H8: Konkrete Zahlen sind Anker
**Regel:** Konkrete Zahlen (Mrd-Beträge, Prozente, Mengen, Stichtage) sind starke Anti-Halluzinations-Anker. Mindestens 1-2 prägnante Zahlen pro Summary aufnehmen wenn der Redner sie nennt.

### H9: Keine eigene Bewertung in der Summary
**Problem:** Die LLM-Summary darf keine eigenen Werturteile einbauen, weder lobend noch kritisch.
**Regel:** Verben wie „warnt zu Recht", „kritisiert fundiert", „behauptet ohne Beleg", „skandalisiert" einsetzen NUR wenn der Redner selbst diese Bewertung trifft. Sonst neutral beschreibend bleiben („sagt", „fordert", „kritisiert", „behauptet"). Die Summary ist Wiedergabe, nicht Kommentar.

### H10: Selbst-Reflexion gegen Editorialisierung (NEU v2.1)
**Problem:** Empirisch hat der v1-Vollauf bei ~94% der Reden mit wertenden Wörtern (skandalisiert, polemisiert, diffamiert, denunziert, verdammt, fabuliert; Heuchelei, Doppelmoral, Stimmungsmache, Abgesang) diese vom LLM eingefügt — der Sprecher hat sie nicht selbst genutzt. Audit auf 425 Reden bestätigt das.
**Regel:** Vor Abgabe der Zusammenfassung explizite Selbst-Prüfung:
1. Enthält meine `zusammenfassung_2_saetze` eines der genannten wertenden Wörter?
2. Falls ja: Verwendet der Sprecher das Wort (oder ein klares Synonym mit gleicher Wertungsstärke) **wörtlich** im Original?
3. Falls NEIN: das Wort durch eine neutral-deskriptive Formulierung ersetzen (z.B. „skandalisiert" → „kritisiert scharf"; „Heuchelei" → „Inkonsistenz"; „verdammt" → „lehnt ab")
4. Falls ich nicht sicher bin: Konfidenz-Feld auf `mittel` oder `niedrig` setzen, wertende Wörter im Self-Check-Feld auflisten

Diese Heuristik wird durch das **Pflichtfeld `neutralitaets_self_check`** im JSON-Output (Sektion 6) erzwungen.

---

## 4. Wörtliche Zitate — Auswahl-Regeln

Pro Summary 1-3 wörtliche Zitate aus dem `original_text` — exakt, nicht paraphrasiert.

### Bevorzuge folgende Typen:
1. **Slogan-artige Phrasen** — „Schmeißen Sie den Schredder an!", „Wir glauben an unser Land", „Klimaschutz ist Menschenschutz"
2. **Frame-Marker** — wörtliche Phrasen die ein politisches Frame transportieren
3. **Pointierte Anekdoten-Schluss-Zitate** — der Spitzen-Satz einer Anekdote
4. **Selbstcharakterisierungen / Bekenntnisse** — „bis an mein Lebensende dankbar"
5. **Distinkte Sprachregister** — z.B. Vollath „klingt mega nice", „upsi", „Sus"
6. **Direkte Adressierungen** — „Sie sind kein Kanzler; Sie sind ein Getriebener"

### Vermeide:
- Floskel-Anreden („Sehr geehrte Frau Präsidentin")
- Routinephrase-Zitate ohne Aussagekraft
- Lange Zitate (max. ~150 Zeichen — sonst paraphrasieren)
- Halb-erfundene Zitate, die auf Original-Phrasen basieren aber leicht umformuliert sind (Quote-Validierung erfolgt post-hoc per Substring-Match!)
- Zitat-Auswahl-Bias: nicht systematisch nur die polemischsten Zitate einer bestimmten Partei picken. Wenn die Rede sachliche und polemische Stellen mischt, beide Register berücksichtigen.

### Validierungs-Regel:
Jedes ausgegebene Zitat MUSS exakt als Substring im `original_text` vorhanden sein. Wenn unsicher, lieber paraphrasieren als ein Quasi-Zitat erfinden.

---

## 5. Tonalitäts-Klassifikation

Die Summary muss eine Tonalität klassifizieren — **exklusiv aus folgenden 11 Werten**. Die Klassifikation beschreibt das **Rede-Verhalten**, nicht die Partei.

| Tonalität | Erkennungsmerkmale | Empirische Beispiel-Sprecher (cross-party WP21) |
|---|---|---|
| `sachlich` | Fakten, Zahlen, keine ideologische Einrahmung | Bareiß (CDU/AWG), Warken (CDU/Gesundheit), Al-Wazir (Grüne/Tempolimit), Schäfer (Grüne/Haushaltsrechnung) |
| `polemisch` | Kampfsprache, Beleidigungen, Wahlaufrufe, persönliche Angriffe | Strauß (AfD/Mietbremse), Stephan (AfD/Rente), Gebhard (CDU/„abenteuerlich"), Demuth (CDU/SWR-Spitzen) |
| `polemisch_sachlich` | Fakten kombiniert mit deutlichen ideologischen Frames jeglicher Richtung | Schmidt (AfD/Kernkraft), Scheurell (AfD/Schrott), Paul (AfD/Soldatenfrage) |
| `emotional_persoenlich` | Eigene Lebensgeschichte, Anekdoten als Anker | Hostert (SPD/Srebrenica), Limbacher (SPD/Hochwasser) |
| `konfrontativ_faktenrhetorisch` | Mit konkreten Belegen widerlegende Argumentation gegen die Position eines anderen — partei-unabhängig | Mann (SPD/Verlagspreis), Akbulut (Linke/Sicherheitsrat), Demuth (CDU/Triell), Piechotta (Grüne/Streichung), Slawik (Grüne/Deutschlandticket), Vriesema (Grüne/Diäten), Nanni (Grüne/Verteidigung), Kaminski (Linke/UN) |
| `ironisch_jugendlich` | Distinkter ironischer/sarkastischer Stil | Vollath (Linke/Aktivrente) |
| `bilanzierend_werbend` | Selbstbewusste Bilanz der eigenen (meist Regierungs-) Politik | Sepp Müller (CDU), Jordan |
| `staatsmaennisch` | Außenpolitik, ernst, mahnend | Lucks (Grüne/Ukraine), Hardt (CDU/Nahost), Wiese (SPD/EU), v. Notz (Grüne/Russland) |
| `defensiv_pragmatisch` | Antworten in Fragestunde / abwehrend-pragmatisch | Wadephul (CDU), Frei (CDU), Dobrindt (CSU), Seifert (AfD/MwSt-Frage), Wagner (SPD/Etat) |
| `sozial_anklagend` | Sozialgerechtigkeits-Frame, „Bürger vs. System/Eliten" | Hoß (Linke), Eißing (Linke), Görke (Linke/Olympia), Beck (Grüne/Finanzkriminalität), Bock (Linke/Mieten) |
| `mahnend` | Gedenkreden, ernste Themen, mahnender Aufruf | Hostert (SPD/Gedenken), Hose (CDU/Soldatenfriedhof), Göring-Eckardt (Grüne/Kriegsgräber) |

Bei Misch-Tonalität: die DOMINANTE wählen. Sekundäre Aspekte (z.B. Ironie als Stilmittel, pointierte Schärfe, sachlicher Beleg-Modus) gehören in `rhetorische_mittel[]`, NICHT in den Tonalitäts-Slot.

**WICHTIG:** Der Tonalitäts-Slot akzeptiert ausschließlich diese 11 Werte. Neue Werte werden nicht erfunden — kein `pointiert_*`, kein `nachfragend`, kein `konstruktiv_kritisch`. Wenn keine Klasse perfekt passt: nimm die nächst-passende und beschreibe Nuancen in `rhetorische_mittel[]` und in der `zusammenfassung_2_saetze`.

---

## 6. JSON-Output-Schema (für Haiku)

Jede Rede produziert exakt diesen JSON-Output. Pflichtfelder müssen vorhanden sein, dürfen aber leere Arrays/Strings haben wenn der Inhalt es nicht hergibt.

```json
{
  "reden_typ": "<einer von A-K oben, oder Mischung 'A+E'>",
  "tonalität": "<aus der 11er-Liste in Sektion 5>",
  "forderungen": [
    "<vollständige Aufzählung aller distinkten Forderungen / Positionen>",
    "..."
  ],
  "wörtliche_zitate": [
    "<exakter Substring aus original_text>",
    "..."
  ],
  "framing_marker": [
    "<Frame-Schlüssel aus Glossar Sektion 2>",
    "..."
  ],
  "rhetorische_mittel": [
    "<z.B. 'Sarkasmus', 'persönliche Anekdote', 'Wahlaufruf', 'Anaphora', 'pointiert', 'rhetorische Frage'>"
  ],
  "konkrete_zahlen": [
    "<wichtige Zahlen / Daten aus dem Text mit Kontext>"
  ],
  "anti_hallucination_flags": [
    "<Hinweise wo H1-H10 ausgelöst wurden, z.B. 'H1: keine konstruktiven Investitionen vorgeschlagen — Senkungen + Streichungen only'>"
  ],
  "zusammenfassung_2_saetze": "<2-3 Sätze, die die obigen Felder synthesieren — Tonalität, Hauptforderungen, Frames, charakteristische Pointe. NEUTRAL beschreibend, keine eigenen Werturteile.>",
  "neutralitaets_self_check": {
    "konfidenz": "<'hoch' | 'mittel' | 'niedrig'>",
    "wertende_woerter_eigene": [
      "<Liste der wertenden Wörter (skandalisiert, polemisiert, diffamiert, denunziert, verdammt, fabuliert, Heuchelei, Doppelmoral, Stimmungsmache, Abgesang) in der Summary, die der Sprecher nicht selbst nutzt — leer wenn keine>"
    ],
    "begruendung_falls_unsicher": "<max. 1 Satz, nur bei mittel/niedrig — leer bei hoch>"
  }
}
```

### Synthese-Regel
`zusammenfassung_2_saetze` ist die Synthese der oberen Felder, NICHT eine separate Inhaltserfassung. Reihenfolge:
1. Wer (Sprecher + Partei/Rolle)
2. Wozu (Topic kurz)
3. Hauptposition + 2-3 wichtigste Forderungen aus `forderungen[]`
4. Charakteristische Pointe / Frame / Zitat

**Sprache neutral-beschreibend.** Verben wie „kritisiert", „fordert", „behauptet", „lehnt ab", „verteidigt" sind erlaubt. Verben wie „warnt fundiert", „kritisiert zu Recht", „skandalisiert ohne Beleg" sind NICHT erlaubt — sie wären eigene Bewertung.

---

## 7. Beispiel-Outputs für Reality-Check-Vergleichsfälle

### Beispiel 1 — Bloch (AfD, 55-Mrd-Sparpaket): Halluzinations-Falle H1

```json
{
  "reden_typ": "B",
  "tonalität": "polemisch_sachlich",
  "forderungen": [
    "55-Milliarden-Euro-Entlastungspaket über Steuersenkungen (CO2-Bepreisung 17 Mrd, Stromsteuer 6,5 Mrd, Lohnsteuer 10 Mrd, Körperschaftsteuer 3 Mrd, Einkommensteuer 3 Mrd, Lkw-Maut 2,3 Mrd, Emissionshandel 4,3 Mrd, Agrardiesel 0,5 Mrd)",
    "5 Mrd kommunales Nothilfeprogramm",
    "Reduzierung der EU-Zahlungen (Vorwurf rechtswidriger Schuldenunion)",
    "Streichung 'ideologisch geprägter Programme'",
    "Bürgergeld-Reform",
    "Kürzung der Verteidigungsausgaben",
    "Stopp der Waffenlieferungen an die Ukraine"
  ],
  "wörtliche_zitate": [
    "Sparprinzip der sogenannten schwäbischen Hausfrau",
    "Verschwendungsprogramm der Altparteien 'Geld für die Welt'",
    "Steuergelder sind primär da einzusetzen, wo diese erarbeitet werden"
  ],
  "framing_marker": ["schwaebische_hausfrau", "geld_fuer_die_welt", "ehrlicher_respekt"],
  "rhetorische_mittel": ["Auflistung mit konkreten Zahlen", "Bedingungs-Liste am Schluss"],
  "konkrete_zahlen": [
    "55 Mrd Entlastungspaket gesamt",
    "76 Mrd deutsche Ukraine-Hilfen vs. 25 Mrd UK / 8,5 Mrd FR / 3 Mrd ES / 2,5 Mrd IT"
  ],
  "anti_hallucination_flags": [
    "H1 ausgelöst: keine konstruktiven Investitionen vorgeschlagen — nur Senkungen und Streichungen. Schluss-Liste ('erst wenn alle Schulen saniert...') ist Bedingungsklausel für Auslandszahlungs-Stopp, KEIN Investitionsprogramm."
  ],
  "zusammenfassung_2_saetze": "Joachim Bloch (AfD) skizziert ein 55-Milliarden-Euro-Entlastungspaket aus reinen Steuer- und Abgaben-Senkungen, gegenfinanziert durch Reduzierung von EU-Zahlungen (Vorwurf einer 'rechtswidrigen Schuldenunion'), Streichung 'ideologisch geprägter Programme', Bürgergeld-Reform, geringere Verteidigungsausgaben und Stopp der Ukraine-Waffenlieferungen. Er rahmt die AfD-Position im 'schwäbische Hausfrau'-Sparprinzip; konstruktive Investitions-Forderungen werden — anders als bei oberflächlichen Lesarten — NICHT erhoben."
}
```

### Beispiel 2 — Kleinschmidt (AfD, Operation Irini): Polemik-Erhalt H2

```json
{
  "reden_typ": "A+B",
  "tonalität": "polemisch",
  "forderungen": [
    "Ablehnung der Verlängerung der Operation Irini",
    "Mehr Sicherheit in Nord- und Ostsee statt Engagement in Libyen",
    "Kein Geld für Klimaberatung in Libyen (24,5 Mio Euro 2024)"
  ],
  "wörtliche_zitate": [
    "organisierte Schlepperei, geduldet durch die Bundesregierung und gedeckelt durch das Mandat",
    "Am deutschen Wesen mag die Welt genesen",
    "Hoffentlich hat die nicht Herr Lauterbach geplant"
  ],
  "framing_marker": ["unkontrollierte_zuwanderung", "geld_fuer_die_welt"],
  "rhetorische_mittel": ["Sarkasmus mit Mandatszitaten", "ISAF-Vergleich", "Soldaten-Adresse am Schluss"],
  "konkrete_zahlen": ["24,5 Mio Euro 2024 für Libyen"],
  "anti_hallucination_flags": [
    "H2 (Polemik-Erhalt): Migrations-Frame als 'organisierte Schlepperei' MUSS in Summary",
    "H7 (Ad-hominem): Lauterbach-Spitze als zitierte Charakterisierung markiert"
  ],
  "zusammenfassung_2_saetze": "Kurt Kleinschmidt (AfD) lehnt die Verlängerung der Operation Irini ab und vergleicht sie mit der gescheiterten ISAF-Logik. Aus dem Mandatstext zitiert er sarkastisch 'Versorgung der Bevölkerung auf kommunaler Ebene' und 'Frauenförderung in Libyen' und unterstellt: 'Migrationsrouten' seien in Wahrheit 'organisierte Schlepperei, geduldet durch die Bundesregierung'; statt 24,5 Mio Euro für Klima-Beratung in Libyen brauche es Sicherheit in Nord- und Ostsee. Schluss: 'Am deutschen Wesen mag die Welt genesen' — ironisch an die Regierung gerichtet, mit Soldaten-Gruß."
}
```

### Beispiel 3 — Hostert (SPD, Srebrenica-Gedenken): Anekdoten-Pointen H3 + Tonalität `mahnend`

```json
{
  "reden_typ": "C",
  "tonalität": "mahnend",
  "forderungen": [
    "Erinnerung an die 8.000 ermordeten Bosniaken von Srebrenica",
    "Würdigung der 'Mütter von Srebrenica' und ihrer jahrzehntelangen Arbeit",
    "Aktive deutsche Unterstützung des EU-Wegs Bosniens als 'starker Partner für dauerhaften Frieden'"
  ],
  "wörtliche_zitate": [
    "neunjähriges Mädchen im Bosnienkrieg",
    "starker Partner für dauerhaften Frieden"
  ],
  "framing_marker": [],
  "rhetorische_mittel": ["persönliche Anekdote als Anker", "direkte Adressierung anwesender Überlebender"],
  "konkrete_zahlen": ["8.000 ermordete Bosniaken", "30. Jahrestag des Genozids"],
  "anti_hallucination_flags": [
    "H3 (Anekdoten-Pointe): persönlicher Bezug ('als Neunjährige verlor sie ihren Arm') als Anker erhalten, nicht zu generischer Position abstrahiert"
  ],
  "zusammenfassung_2_saetze": "Jasmina Hostert (SPD) erinnert anlässlich des 30. Jahrestags des Genozids von Srebrenica an die 8.000 ermordeten Bosniaken und teilt ihre eigene Geschichte: als Neunjährige verlor sie durch eine Granate ihren Arm. Sie zitiert den Überlebenden Nedžad Avdić, würdigt die 'Mütter von Srebrenica' und fordert Deutschland auf, als 'starker Partner für dauerhaften Frieden' Bosniens EU-Weg aktiv zu unterstützen."
}
```

### Beispiel 4 — Vollath (Linke, Aktivrente): Distinkter Stil + Tonalität `ironisch_jugendlich`

```json
{
  "reden_typ": "G",
  "tonalität": "ironisch_jugendlich",
  "forderungen": [
    "Ablehnung der Aktivrente (laut DIW profitieren vor allem Hochverdienende)",
    "Echte große Rentenreform gegen wachsende Altersarmut",
    "Einbeziehung der Selbstständigen in die Rentenversicherung"
  ],
  "wörtliche_zitate": [
    "klingt mega nice",
    "upsi",
    "Sus",
    "neoliberale Scheinlösungen"
  ],
  "framing_marker": ["neoliberale_scheinloesungen", "altern_in_wuerde", "steuergeschenke_besserverdiener"],
  "rhetorische_mittel": ["jugendsprachlicher Slogan-Einsatz", "ironische Distanzierung", "Studien-Verweise als Beleg"],
  "konkrete_zahlen": ["1,4 Mrd Mindereinnahmen (IW-Prognose)"],
  "anti_hallucination_flags": [
    "H2 (Polemik-Erhalt): jugendsprachliche Slogans ('mega nice', 'upsi', 'Sus') als Pointe wörtlich erhalten — nicht zu 'kritisiert die Aktivrente' abflachen"
  ],
  "zusammenfassung_2_saetze": "Sarah Vollath (Linke) nutzt jugendsprachlich-ironischen Stil ('klingt mega nice', 'upsi', 'Sus') gegen die Aktivrente: laut DIW profitieren vor allem Hochverdienende, das IW prognostiziert 1,4 Mrd Mindereinnahmen, Selbstständige seien ausgeschlossen — 'neoliberale Scheinlösungen' statt einer 'echten großen Rentenreform' gegen die wachsende Altersarmut."
}
```

---

## 8. Verwendung als Haiku-System-Prompt

Diese Methodologie-Datei ist als statisches Prompt-Asset konzipiert. Empfohlene Integration:

```typescript
const SYSTEM_PROMPT = `${fs.readFileSync('docs/summarization-methodology.md')}

---
JETZT ANALYSIERE die folgende Plenarrede und produziere den JSON-Output gemäß Sektion 6.
`;

const response = await client.messages.create({
  model: "claude-haiku-4-5",
  system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
  messages: [{ role: "user", content: redeText }],
  max_tokens: 2048,
  output_config: {
    format: { type: "json_schema", schema: REDEN_SUMMARY_SCHEMA }
  }
});
```

Bei Re-Generation aller Segmente bleibt der System-Prompt identisch und wird gecached → ~10× günstigerer Input ab dem 2. Call.

---

## 9. Iteratives Verfeinern

Diese Methodologie ist Version 2.0 (Neutralitäts-Refactor). Sie sollte nach jedem Batch überprüft und ggf. angepasst werden:

- Wenn ein Reden-Typ nicht abgedeckt ist → neue Sektion hinzufügen
- Wenn ein Frame fehlt → ins Glossar (Sektion 2) einfügen
- Wenn eine Halluzinations-Klasse auftritt → neue Heuristik (Sektion 3)
- Wenn Tonalitäten nicht passen → neue Klassifikation in Sektion 5 (mit Bedacht — Schema-Erweiterungen bedeuten Drift-Risiko)
- Wenn Partei-Anker durchrutschen → Sektion 0 Punkt 6 verschärfen, Beispiele neutraler verteilen

Das Dokument ist menschlich lesbar, deshalb gut durch den Domain-Experten (Politikwissenschaft / journalistische Erfahrung) verfeinerbar — DAS ist der eigentliche Vorteil gegenüber automatischer Distillation.

---

## 10. Versionsgeschichte

**v2.1 — 2026-05-05 (Self-Check für Bias-Korrektur-Re-Batch):**
- Heuristik H10 hinzugefügt: explizite Selbst-Reflexion gegen Editorialisierung
- Pflichtfeld `neutralitaets_self_check` im JSON-Schema (Sektion 6) — Konfidenz + Liste wertender Wörter, die nicht im Original sind
- Anlass: Bias-Audit auf v1-Outputs (425 Reden mit wertenden Wörtern aus Tier-A-Liste) zeigte 94% LLM-Editorialisierung. v2.1 wird zunächst auf diese 400 NEIN-Reden angewendet (gezielter Re-Batch), spätere Sitzungs-Batches nutzen v2.1 standardmäßig.
- Schema bleibt rückwärts-kompatibel — `neutralitaets_self_check` ist neues Pflichtfeld, andere Felder unverändert.

**v2 — 2026-05-05 (Neutralitäts-Refactor):**
- Reden-Typen-Namen partei-neutralisiert (Typ A: „Polemische Opposition (klassisch AfD)" → „Polemische Opposition"; Typ D: „Anti-AfD-Konfrontations-Rede" → „Konfrontativ-faktenrhetorische Auseinandersetzung"; Typ G: „Linke-Sozialgerechtigkeits-Rede" → „Sozialgerechtigkeits-/Anklage-Rede"; Typ K: „Pro-Regierung-Außenpolitik (Grüne/SPD)" → „Außenpolitische Rede mit Bündnis-/Sicherheitsbezug")
- Tonalitäten neutralisiert (`polemisch_sachlich`: AfD-Anker entfernt; `konfrontativ_faktenrhetorisch`: Anti-AfD-Anker entfernt; `ironisch_jugendlich`: Linke-Anker entfernt; `sozial_anklagend`: Linke-Anker entfernt)
- Empirische Beispiel-Sprecher pro Tonalität auf cross-party-Verteilung erweitert
- Frame-Glossar mit Hinweis versehen (deskriptiv, nicht erschöpfend, Asymmetrie reflektiert Empirie nicht Wertung)
- Anti-Halluzinations-Heuristiken H1, H2, H3, H7 mit symmetrischer Anwendungs-Anmerkung versehen (Klassen-Bezeichnungen behielten ihre H-Nummern, Personen-Namen-Klassen entfernt)
- Neue Heuristik H9 hinzugefügt: keine eigene Bewertung in der Summary
- Grundprinzip 6 (Partei-neutrale Klassifikation) und 7 (Beschreiben, nicht bewerten) hinzugefügt
- Beispiel-Outputs von 2 (beide AfD) auf 4 erweitert: Bloch (AfD), Kleinschmidt (AfD), Hostert (SPD), Vollath (Linke)
- Tonalitäts-Hinweise in Reden-Typen-Beschreibungen auf die exakten 11 Enum-Werte gemappt (vorher freie Texte wie „pointiert-süffisant" — Quelle der `pointiert_*`-Drift im v1-Batch)

**v1 — 2026-04-30 (Original):**
- Ergebnis aus 30 stratifizierten Reden + 9 Reality-Check-Vergleichen (Llama 70B vs. Original-Text)
- Klassen-Anker an empirisch häufigen Trägern: AfD-überwiegend für polemische Klassen, Anti-AfD für Konfrontationen, Linke für jugendsprachlich-ironischen Stil
- Backup unter `docs/summarization-methodology.v1-2026-04-30.md.bak`
