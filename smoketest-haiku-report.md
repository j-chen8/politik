# Smart-Haiku Smoke-Test Report

**Modell:** `claude-haiku-4-5`
**System-Prompt:** docs/summarization-methodology.md (~7348 Tokens, gecached)
**Reden:** 20/20
**Tokens:** input=29074, cache_read=229860, cache_write=0, output=27474
**Cost:** ~$0.1894
**Validierung:** 17 OK, 3 Errors
**Quote-Validierung:** 84/92 Zitate korrekt (91.3%)

## Übersicht

| # | rede_id | Speaker | Partei | Typ | Tonalität | Zitate | H-Flags |
|---|---------|---------|--------|-----|-----------|--------|---------|
| 1 | ID211101400 | Jürgen Hardt | CDU/CSU | K | staatsmaennisch | 4/6 | H8,H4,H6 |
| 2 | ID211404200 | Dr. Günter Krings | CDU/CSU | E | sachlich_pragmatisch | 4/7 | H6,H4,H2 |
| 3 | ID211607400 | René Bochmann | AfD | B | sachlich_kritisch | 3/3 | H4,H2,H8 |
| 4 | ID212708300 | Gökay Akbulut | Die Link | D | sozial_anklagend | 4/4 | H4,H7,H2,Keine |
| 5 | ID214008100 | Dunja Kreiser | SPD | D | konfrontativ_belegend | 7/8 | H3,H7,H2 |
| 6 | ID214008600 | Kurt Kleinschmidt | AfD | A+B | polemisch | 3/3 | H2,H3,H7,Klassischer |
| 7 | ID214405000 | Joachim Bloch | AfD | A+B | polemisch_sachlich | 6/7 | H1,H4,H7 |
| 8 | ID215303600 | Dr. Moritz Heuberger | BÜNDNIS  | F | sachlich_konstruktiv | 6/6 | H4,H2,H8,H6 |
| 9 | ID21700700 | Gereon Bollmann | AfD | A | polemisch | 4/4 | H2,H4,H5,H7 |
| 10 | ID211103700 | Dr. Hülya Düber | CDU/CSU | H | sachlich_pragmatisch | 6/6 | H6,H4,H2 |
| 11 | ID211411100 | Kai Whittaker | CDU/CSU | D | konfrontativ_belegend | 7/8 | H2,H3,H7,H4 |
| 12 | ID211315500 | Johannes Schraps | SPD | K | staatsmaennisch | 2/2 | H6,H8 |
| 13 | ID211604500 | Ruppert Stüwe | SPD | E | bilanzierend_werbend | 4/4 | H6,H4 |
| 14 | ID211314500 | Martin Sichert | AfD | A | polemisch | 4/4 | H2,H3,H4,VORSICHT |
| 15 | ID211601900 | Rainer Groß | AfD | A | polemisch | 8/8 | H1,H2,H4,H6,H8 |
| 16 | ID211000500 | Hanna Steinmüller | BÜNDNIS  | D | konfrontativ_belegend | 7/7 | H4,H1,H7 |
| 17 | ID211001700 | Dr. Sandra Detzer | BÜNDNIS  | ? | ? | 0/0 | — |
| 18 | ID211504100 | Doris Achelwilm | Die Link | G | sozial_anklagend | 5/5 | H4,H8 |
| 19 | ID212015400 | Vinzenz Glaser | Die Link | ? | ? | 0/0 | — |
| 20 | ID211003100 | Lars Klingbeil | — | ? | ? | 0/0 | — |

---
## Detail-Ausgabe pro Rede

### ID211101400 — Jürgen Hardt (CDU/CSU)

**Sitzung 11 (2025-06-06)** | Topic: Beratung des Antrags der Fraktion Die Linke | Original: 5529 Zeichen | Latenz: 14136ms

#### Original (Auszug)
> Herr Präsident! Liebe Kolleginnen und Kollegen! Wir hatten ja bereits gestern Gelegenheit, das Thema hier im Rahmen einer Aktuellen Stunde zu besprechen. Und viele Kolleginnen und Kollegen aus der Außenpolitik, aus dem Menschenrechtsausschuss sowie aus dem Ausschuss für wirtschaftliche Zusammenarbeit und Entwicklung hatten Gelegenheit, gestern und vorgestern mit dem Außenminister des Staates Israel, Gideon Sa’ar, zu sprechen, sich mit ihm direkt auszutauschen und zu hören, was die Sicht der israelischen Regierung auf die aktuelle Entwicklung ist.
> Was wir bei diesen Gesprächen immer wieder beto
> _… (4929 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Nahostkonflikt und deutsche Außenpolitik
- **Typ:** debatte
- **Summary:** Jürgen Hardt fordert eine Verschärfung der deutschen Iranpolitik, um den Bau einer Atombombe zu verhindern und die Revolutionsgarden als Terrororganisation einzustufen. Zudem mahnt er Israel zur deutlichen Erhöhung der humanitären Hilfe für den Gazastreifen und betont, dass der Gazastreifen kein israelisches Staatsgebiet ist.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** K
- **Tonalität:** staatsmaennisch
- **Forderungen (9):**
  - Hamas muss völkerrechtswidrigen Kampf aufgeben, verbleibende Geiseln und Leichname an Israel übergeben
  - Israel muss humanitäre Hilfe im Gazastreifen deutlich erhöhen (Referenz: 700 Lkws/Tag Januar-März als Benchmark)
  - Deutschland und EU müssen humanitäre Hilfe über UN und World Food Programme ausweiten
  - Bundesregierung muss Iranpolitik anpassen und verschärfen, insbesondere Terrorlistung der Revolutionsgarden vorantreiben
  - Iran muss am Erwerb von Atomwaffen gehindert werden
  - Israel darf nicht die zivile Administration des Gazastreifens übernehmen; Gaza ist nicht Teil israelischen Staatsgebiets
  - Gaza muss unter maßgeblicher palästinensischer Führung zivil verwaltet werden
  - Internationale Sicherheitsgarantien für Israel beim Wiederaufbau Gazas erforderlich
  - Deutschland und EU bieten massive Unterstützung beim zivilen Aufbau und Wiederaufbau an — 'weder an deutschem Geld noch an deutschem Willen darf es scheitern'
- **Wörtliche Zitate (4/6 valid):**
  - ✅ „Wenn die Hamas ihren völkerrechtswidrigen Kampf, ihren Terrorkampf gegen Israel, ihr Ziel der Zerstörung Israels aufgeben und die verbleibenden Geiseln und die Leichname der verstorbenen Geiseln an Israel übergeben würde, würde sich natürlich die humanitäre Lage im Gazastreifen komplett anders darstellen."
  - ✅ „Ich behaupte, die Amerikaner hätten das in Berlin auch nicht getan, wenn aus jedem Keller irgendeine Waffen-SS-Truppe sie befeuert hätte."
  - ❌ „Der Staat, der eine Atombombe und Atomraketen mit dem Ziel baut, Israel zu zerstören; das hat der Iran als Staatsziel ausgegeben."
  - ✅ „Der Gazastreifen ist nicht Teil des Staatsgebietes von Israel und muss auch so von Israel behandelt werden."
  - ❌ „Es bedarf letztlich einer Organisation unter maßgeblicher Führung der Palästinenser selbst, die die zivile Verwaltung übernimmt."
  - ✅ „darf es weder an deutschem Geld noch an deutschem Willen scheitern"
- **Framing-Marker:** frozen_assets, iran_atomwaffen_existenzbedrohung, israel_besatzung_nicht_rechtmaessig, gaza_humanitaere_katastrophe
- **Rhetorische Mittel:** Historischer Vergleich (Berlin 1945 / Kaugummi-Strategie), Konditionalsätze (Wenn-dann-Logik: wenn Hamas aufgibt, ändert sich Lage), Drei-Punkte-Struktur (Das Erste / Das Zweite / Das Dritte), Persönliche Anmahnungen bei Außenminister Sa'ar, Konkrete Zahl als Benchmark (700 Lkws/Tag)
- **Konkrete Zahlen:** 700 Lkws pro Tag in den Gazastreifen (Januar-März Referenzwert) | 7. Oktober 2023 als Bezugsdatum für Hamas-Anschlag
- **Anti-Halluzinations-Flags:**
  - H8 (Zahlen-Anker): 700 Lkws/Tag ist konkrete messbare Baseline für humanitäre Kapazität — erfasst
  - H4 (Multi-Punkt-Vollständigkeit): Drei-Punkte-Struktur ('Das Erste / Das Zweite / Das Dritte') + abschließendes Angebot vollständig enumariert
  - H6 ('Wir werden tun'-Rhetorik): Futures wie 'wir sind gerne bereit' und 'darf es nicht an deutschem Geld scheitern' sind prospektive Zusagen, keine Erfolgsmeldungen — als solche gekennzeichnet
- **Zusammenfassung:** Jürgen Hardt (CDU/CSU) bezieht sich auf Gespräche mit Außenminister Gideon Sa'ar und legt dar: Die Hamas muss ihren völkerrechtswidrigen Kampf beenden und Geiseln freigeben, damit sich die humanitäre Lage Gazas verbessert — Israel könne wie die Amerikaner 1945 in Berlin nicht auf Wohlwollen werben, wenn aus jedem Keller geschossen wird. Hardt fordert deutlich erhöhte humanitäre Hilfe (Benchmark 700 Lkws/Tag), eine Verschärfung der deutschen Iranpolitik gegen die Atomwaffen-Entwicklung, und — in Kritik impliziter israelischer Annexionspläne — eine zivile Verwaltung Gazas unter palästinensischer Führung mit internationalen Sicherheitsgarantien. Deutschland und die EU bieten dafür massive wirtschaftliche und zivile Unterstützung an: 'darf es weder an deutschem Geld noch an deutschem Willen scheitern'.

---

### ID211404200 — Dr. Günter Krings (CDU/CSU)

**Sitzung 14 (2025-06-26)** | Topic: Zweite und dritte Beratung des von den Fraktionen der CDU/CSU und SPD eingebrachten Entwurfs eines Gesetzes zur Änderung der Regelungen über die zulässige Miethöhe bei Mietbeginn | Original: 4928 Zeichen | Latenz: 10686ms

#### Original (Auszug)
> Herr Präsident! Meine sehr verehrten Damen und Herren! Wir wollen heute ein Gesetz beschließen, das für viele Mieter, aber eben auch Vermieter in Deutschland unmittelbare Bedeutung hat: die Verlängerung der Mietpreisbremse in angespannten Wohnungsmärkten bis zum 31.12.2029. Wir können als Koalition heute zwar weniger mit bunten T-Shirts aufwarten, dafür aber mit einem guten Gesetz, auch dank der Justizministerin, meine Damen und Herren.
> Schon die Tatsache, dass wir diese Regelung in einer gemeinsamen Initiative der Fraktionen von CDU/CSU und SPD einbringen, zeigt: Diese Koalition steht für ein
> _… (4328 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Verlängerung der Mietpreisbremse
- **Typ:** debatte
- **Summary:** Dr. Günter Krings befürwortet die Verlängerung der Mietpreisbremse bis 2029 als notwendiges Übergangsinstrument zum Mieterschutz. Er betont jedoch, dass das eigentliche Problem der Wohnungsmangel sei, der nur durch mehr Neubau und den Abbau bürokratischer Hürden im Baurecht gelöst werden könne.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** E
- **Tonalität:** sachlich_pragmatisch
- **Forderungen (6):**
  - Verlängerung der Mietpreisbremse in angespannten Wohnungsmärkten bis 31.12.2029
  - Beibehaltung des Neubau-Stichtags 1. Oktober 2014 — Neubauten weiterhin ausgenommen
  - Anwendung der Mietpreisbremse nur dort, wo Landesregierungen angespannte Märkte durch Rechtsverordnungen feststellen
  - Beschleunigung und Vereinfachung des Baurechts — 'alte Zöpfe konsequent abschneiden'
  - Flankierung durch Neubau-Offensive, Wohngeld und soziale Wohnraumförderung
  - Einhaltung der Bundesverfassungsgerichts-Warnung gegen beliebige Erweiterung/Verlängerung der Mietpreisbremse
- **Wörtliche Zitate (4/7 valid):**
  - ❌ „fairer Interessenausgleich zwischen Mieterinnen und Mietern einerseits und Vermieterinnen und Vermietern andererseits"
  - ✅ „Wir treten für ein Mietrecht ein, das auf dem Boden unserer sozialen Marktwirtschaft steht"
  - ✅ „Die eigentlichen Probleme auf den Wohnungsmärkten lösen wir natürlich nicht durch Preisregulierung, sondern durch Neubau"
  - ✅ „die Mietpreisbremse halte Bauherren davon ab, neuen Wohnraum zu schaffen, so ist das schlichtweg falsch"
  - ❌ „Wer das Vertrauen von Kapitalgebern zerstört, der gefährdet damit auch künftige Investitionen"
  - ❌ „Wir sollten niemals im laufenden Spiel die Tore verschieben"
  - ✅ „Diese Mietpreisbremse ist und bleibt ein Element einer echten Gesamtstrategie"
- **Framing-Marker:** fairer_interessenausgleich, soziale_marktwirtschaft, verlaesslichkeit_vertrauen
- **Rhetorische Mittel:** Koalitions-Selbstlob ('weniger bunte T-Shirts, dafür ein gutes Gesetz'), Spiel-Metapher ('im laufenden Spiel die Tore verschieben'), Wiederholte Betonung von 'Verlässlichkeit', Betont faire Darstellung beider Seiten (Mieter + Vermieter)
- **Konkrete Zahlen:** Mietpreisbremsen-Verlängerung bis 31.12.2029 | Neubau-Stichtag: 1. Oktober 2014
- **Anti-Halluzinations-Flags:**
  - H6: 'Wir werden es nicht länger hinnehmen...' und 'Wir unterstützen die Bemühungen der Bauministerin' sind künftige Regierungs-Vorhaben, keine abgeschlossenen Erfolge
  - H4: Alle distinkten Forderungen enumeriert — 6 Punkte vollständig erfasst
  - H2: Polemik ist gering; sachlich-pragmatischer Ton bewahrt, keine Übertreibung
- **Zusammenfassung:** Dr. Günter Krings (CDU/CSU) verteidigt die Koalitions-Initiative zur Verlängerung der Mietpreisbremse bis Ende 2029 als 'fairer Interessenausgleich' zwischen Mietern und Vermietern auf Basis der sozialen Marktwirtschaft; er betont, dass Neubauten (ab 1.10.2014) bewusst ausgenommen bleiben, um das Vertrauen von Kapitalgebern nicht zu zerstören. Die eigentliche Lösung des Wohnungsmangels sieht Krings nicht in Preisregulierung, sondern in Baurechts-Vereinfachung, Neubau-Offensive und Wohngeld — die Mietpreisbremse ist nur ein befristetes Übergangsinstrument, das die Bundesverfassungsgerichts-Warnung vor beliebiger Erweiterung respektiert. Der Rahmen ist durchgängig pragmatisch-institutionell: 'Wir sollten niemals im laufenden Spiel die Tore verschieben'.

---

### ID211607400 — René Bochmann (AfD)

**Sitzung 16 (2025-07-08)** | Topic: Wir kommen jetzt zum Geschäftsbereich des Bundesministeriums für Verkehr, Einzelplan 12. | Original: 3857 Zeichen | Latenz: 12905ms

#### Original (Auszug)
> Herr Präsident! Sehr geehrte Damen und Herren! Liebe Landsleute! Im jetzt zu behandelnden Einzelplan 12 spreche ich zur See- und Binnenschifffahrt, dem Hafenstandort Deutschland und den Baumaßnahmen an den Bundeswasserstraßen. Die jahrzehntelang sträflich vernachlässigte Bundeswasserstraßeninfrastruktur inklusive neuer Vorhaben allgemeinverständlich zusammenzufassen, ist in meiner kurzen Redezeit unmöglich.
> Der von der vergangenen Ampelkoalition nicht beschlossene Haushaltsansatz für das Jahr 2025 lag bei 1,993 Milliarden Euro. Die jetzige Schuldenkoalition hat diesen mit einem Sondervermögen 
> _… (3257 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Infrastruktur der Bundeswasserstraßen und Schifffahrt
- **Typ:** debatte
- **Summary:** René Bochmann kritisiert die unzureichende Finanzierung und Priorisierung bei der Instandhaltung der deutschen Wasserstraßeninfrastruktur. Er fordert unter anderem die Stärkung des Hafenstandorts Deutschland, die Umsetzung konkreter Bauprojekte sowie die Einführung einer gesetzlichen Haftpflichtversicherung für Binnenschiffe, um den Steuerzahler vor Kollisionsschäden zu schützen.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** B
- **Tonalität:** sachlich_kritisch
- **Forderungen (14):**
  - Erhöhung der Mittel für Bundeswasserstraßeninfrastruktur über die aktuellen 8 Milliarden Euro hinaus
  - Sicherung des Hafenstandortes Deutschland
  - Schaffung von Anreizen für deutsche Reeder, um unter deutscher Flagge zu fahren
  - Ausbildung und Beschäftigung deutscher Seeleute zur Rettung maritimen Know-hows
  - Umsetzung der ausstehenden Abladeoptimierung im Mittelrhein
  - Sanierung und Anpassung der 27 Neckarschleusen
  - Nachrüstung der zweiten Schleusenkammer bei sieben der zehn deutschen Moselschleusen (gemäß Bundesverkehrswegeplan 2003)
  - Nutzung von Baustandardisierungen
  - Einführung einer Reservevorhaltung von mindestens einem Schleusentor auf der Mosel
  - Konsequente Umsetzung des Gesamtkonzeptes Elbe
  - Überprüfung und Überdenken der Fahrrinnenanpassung der Außenweser und Unterweser für 14,5-Meter-Tiefgang
  - Gesetzliche Verpflichtung zur Haftpflichtversicherung für Binnenschiffe auf deutschen Wasserstraßen
  - Öffentliche Darstellung aller Schäden an der Infrastruktur, Schadensersatzansprüche und Wiederherstellungskosten gegenüber dem Steuerzahler
  - Aufstockung des Fachpersonals in der Generaldirektion Wasserstraßen und Schifffahrt (GDWS)
- **Wörtliche Zitate (3/3 valid):**
  - ✅ „Priorisierung falsch: BMDV riskiert Ausfall von Wasserstraßen"
  - ✅ „Die jahrzehntelang sträflich vernachlässigte Bundeswasserstraßeninfrastruktur"
  - ✅ „Wir werden es tun! Früher oder später, jedoch immer zum Wohle Deutschlands"
- **Framing-Marker:** industrieland_bleiben, verlaesslichkeit_vertrauen, ineffiziente_regierungsverwaltung
- **Rhetorische Mittel:** Zitat aus Bundesrechnungshof-Bericht, Detaillierte Aufzählung technischer Maßnahmen, Internationale Vergleich (Niederlande), Verweis auf Medienberichterstattung (Die Zeit), Verweis auf unbeantworte Einzelfrage, Wahlslogans-ähnlicher Schluss
- **Konkrete Zahlen:** 1,993 Milliarden Euro Haushaltsansatz 2025 Ampel-Koalition | 8 Milliarden Euro Erhöhung durch Schuldenkoalition via Sondervermögen | 27 Neckarschleusen sanierungsbedürftig | Sieben von zehn deutschen Moselschleusen benötigen Nachrüstung | 14,5 Meter Tiefgang für Containerschiffe (Außen-/Unterweser) | 9. April 2025 (Zeitpublikation zu Elbvertiefung und Baggerkosten) | Einzelfrage 379 Juni 2025
- **Anti-Halluzinations-Flags:**
  - H4 (Vollständigkeit): Alle 10 technischen Einzelmaßnahmen aus der Aufzählung (Abladeoptimierung bis Elbe-Konzept) wurden in forderungen[] aufgenommen und nicht synthetisiert zu generischer Aussage
  - H2 (Tonalität): Sachliche Kritik mit AfD-Frames (Regierungs-Inkompetenz, Priorisierungsfehler) bewahrt — nicht zu 'kritisiert die Infrastrukturpolitik' abgeflacht
  - H8 (Zahlen): Alle Finanzierungsangaben und Infrastruktur-Spezifikationen aufgenommen — Anker gegen numerische Erfindungen
- **Zusammenfassung:** René Bochmann (AfD) kritisiert die Infrastrukturpolitik der Bundesregierung im Verkehrshaushalt 2025 (Einzelplan 12): Obwohl die Schuldenkoalition das Budget von 1,993 auf 8 Milliarden Euro erhöht hat, reicht das nicht aus für die anstehenden Aufgaben — jahrzehntelange Vernachlässigung der Bundeswasserstraßen, mangelndes Fachpersonal in der GDWS, sowie fehlerhafte Priorisierungen. Er fordert Sanierung der 27 Neckarschleusen, Umsetzung des Mittelrhein-Abladeoptimierung, Haftpflichtversicherung für Binnenschiffe, Überprüfung der kostspieligen Weser-Fahrrinnenanpassung (analog zur gescheiterten Elbvertiefung mit jährlichen Millionen-Baggerkosten) und öffentliche Transparenz über Infrastrukturschäden. Der Schluss ist Wahlaufruf-artig: ‚Wir werden es tun! Früher oder später, jedoch immer zum Wohle Deutschlands.'

---

### ID212708300 — Gökay Akbulut (Die Linke)

**Sitzung 27 (2025-09-24)** | Topic: Wir kommen nun zu dem Geschäftsbereich des Bundesministeriums für wirtschaftliche Zusammenarbeit und Entwicklung, Einzelplan 23. | Original: 2724 Zeichen | Latenz: 10409ms

#### Original (Auszug)
> Sehr geehrte Frau Präsidentin! Liebe Kolleginnen und Kollegen der demokratischen Fraktionen! In ihren Sonntagsreden behaupten Mitglieder der Bundesregierung immer wieder, international mehr Verantwortung übernehmen zu wollen. Eine andere Sprache spricht aber dieser Haushaltsentwurf. Beim BMZ werden über 300 Millionen Euro in verschiedenen Bereichen gekürzt, auf die ich jetzt eingehen werde. Die humanitäre Hilfe wird gegenüber 2024 halbiert. Das ist beschämend für ein Land, das zu den größten Volkswirtschaften der Welt gehört.
> Ich habe in den vergangenen Wochen mit einigen Organisationen aus de
> _… (2124 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Kürzungen im Haushalt für Entwicklungszusammenarbeit
- **Typ:** debatte
- **Summary:** Gökay Akbulut kritisiert die geplanten Kürzungen im Haushalt des Bundesministeriums für wirtschaftliche Zusammenarbeit und Entwicklung scharf. Sie fordert eine deutliche Aufstockung der Mittel für humanitäre Hilfe, Krisenprävention und zivile Konfliktbewältigung anstelle von Investitionen in Rüstungsgüter.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** D
- **Tonalität:** sozial_anklagend
- **Forderungen (6):**
  - Aufstockung der humanitären Hilfe statt Kürzung um über 300 Millionen Euro
  - Erreichung des 0,7-Prozent-BNE-Ziels für Entwicklungszusammenarbeit und humanitäre Hilfe
  - Rückgängigmachung der 39-prozentigen Kürzung beim Titel 'Krisenbewältigung und Wiederaufbau'
  - Aufstockung der Mittel beim Zivilen Friedensdienst (ZFD)
  - Verlagerung von Rüstungsausgaben zu ziviler Konfliktbewältigung und humanitärer Hilfe
  - Krisenprävention statt nur Krisenbewältigung
- **Wörtliche Zitate (4/4 valid):**
  - ✅ „Die Kürzungen von heute sind die Krisen von morgen"
  - ✅ „Das ist beschämend für ein Land, das zu den größten Volkswirtschaften der Welt gehört"
  - ✅ „Es ist untragbar, dass die Bundesregierung sich hier vor ihrer internationalen Verpflichtung drückt"
  - ✅ „Statt noch mehr Milliarden in Panzer und Raketen zu stecken, brauchen wir mehr Mittel für zivile Konfliktbewältigung"
- **Framing-Marker:** demokratiekrise, klimawandel_konkret, kampf_gegen_rechts
- **Rhetorische Mittel:** Kontrast-Struktur ('Sonntagsreden' vs. 'Haushaltsentwurf'), Anekdote-gestützte Kritik (Gespräche mit Entwicklungsorganisationen), Konkrete humanitäre Fallbeispiele (Cholera, Malaria, Hunger), Zahlenkette zur Dramatisierung (700 Mio in Armut, 2 Mrd in Krisengebieten), USA-Trump-Vergleich als Negativ-Referenz, Wert-Kontraposition (Panzer vs. humanitäre Hilfe)
- **Konkrete Zahlen:** über 300 Millionen Euro Kürzungen beim BMZ | humanitäre Hilfe halbiert gegenüber 2024 | 700 Millionen Menschen weltweit von extremer Armut betroffen | 39 Prozent Kürzung beim Titel 'Krisenbewältigung und Wiederaufbau' gegenüber 2024 | 2 Milliarden Menschen in Gebieten ohne funktionierende staatliche Ordnung | 0,7 Prozent BNE-Ziel für Entwicklungszusammenarbeit (nicht erreicht)
- **Anti-Halluzinations-Flags:**
  - H4 (Multi-Punkt-Vollständigkeit): sechs distinkte Forderungen enumeriert — keine synthetisiert
  - H7 (Ad-hominem-Distanz): Trump-Referenz ist externe Vergleichssetzung, keine Ad-hominem gegen deutsche Akteure
  - H2 (Polemik-Erhalt): 'beschämend', 'untragbar', 'verantwortungslos', 'fragwürdig' — Tonalität als sozial-anklagend bewahrt
  - Keine H1-Halluzination: keine erfundenen Investitionsvorhaben — nur Umverteilungs-Forderungen (Panzer → humanitäre Hilfe)
- **Zusammenfassung:** Gökay Akbulut (Die Linke) kritisiert den Haushaltsentwurf des BMZ als Bruch von 'Sonntagsreden' über internationale Verantwortung: über 300 Millionen Euro Kürzungen, inklusive Halbierung der humanitären Hilfe und 39-prozentiger Kürzung bei 'Krisenbewältigung und Wiederaufbau', während weltweit 700 Millionen in extremer Armut und 2 Milliarden in Krisengebieten leben und Cholera/Malaria-Bekämpfung zurückgeworfen werden. Sie fordert stattdessen: Aufstockung auf das 0,7-Prozent-BNE-Ziel, Krisenprävention, Aufbau des ZFD und Umverteilung von Rüstungs- zu humanitären Ausgaben — ihr Kernframe: 'Die Kürzungen von heute sind die Krisen von morgen' — und rahmt es als unverantwortliches 'Einknicken vor globalen Rechten' angesichts des Trump-Kurswechsels.

---

### ID214008100 — Dunja Kreiser (SPD)

**Sitzung 40 (2025-11-13)** | Topic: Beratung des Antrags der Abgeordneten Bernd Schattner, Marc Bernhard, René Springer, weiterer Abgeordneter und der Fraktion der AfD | Original: 5047 Zeichen | Latenz: 15152ms

#### Original (Auszug)
> Sehr geehrte Frau Präsidentin! Sehr geehrte Damen und Herren! Liebe Kolleginnen und Kollegen! Die Woche der AfD-Gewitterwolken über Berlin zieht sich weiter. Die AfD spricht von Deindustrialisierung und von Untergang und verkauft das als Sorge um unseren Standort. Aber wer in diesen Antrag, in diesen Fünfpunkteplan, schaut, der sieht: Das ist keine Industriepolitik; das ist eine Rückschau auf ein Wirtschaftssystem von gestern.
> Darin heißt es wörtlich: „die sogenannte ‚Grüne Transformation‘“. Allein diese Wortwahl zeigt, wie weit die AfD von der Realität entfernt ist. Diese Transformation ist n
> _… (4447 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Wirtschaftspolitik und grüne Transformation
- **Typ:** debatte
- **Summary:** Dunja Kreiser verteidigt die grüne Transformation der deutschen Industrie als notwendigen Fortschritt und lehnt den wirtschaftspolitischen Ansatz der AfD als rückwärtsgewandt ab. Sie betont, dass die Bundesregierung durch gezielte Investitionen und die Zusammenarbeit mit Unternehmen und Gewerkschaften Arbeitsplätze sichert und Innovationen fördert, während sie der AfD vorwirft, durch ihre Geldgeber aktiv Investitionen aus Deutschland abzuziehen.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** D
- **Tonalität:** konfrontativ_belegend
- **Forderungen (7):**
  - Ablehnung des AfD-Fünfpunkteplans als Rückschau auf veraltetes Wirtschaftssystem statt echter Industriepolitik
  - Festhalten an der Grünen Transformation als längst laufender, realer Prozess — nicht 'sogenannt'
  - Unterstützung von Unternehmen bei der Umstellung auf klimaneutrale Produktionsverfahren (Stahlgipfel, Autogipfel, Chemie, Mittelstand, Handwerk)
  - Fortsetzung von Transformationsnetzwerken wie ReTraSON zur Begleitung des Wandels in Regionen (Wirtschaft, Gewerkschaften, Kommunen, Forschung)
  - Aufpassing auf EU-Fördermittel — müssen an tatsächlich transformierenden Betrieben ankommen, nicht an strukturschwachen Regionen pauschal
  - Reform der EU-Fördermechanismen, damit Transformationsmittel gezielt fließen und Auswanderung weniger attraktiv wird
  - Festhalten an Transformationskriterien auf europäischer Ebene — glaubwürdigkeit gegenüber global / international
- **Wörtliche Zitate (7/8 valid):**
  - ❌ „Darin heißt es wörtlich: 'die sogenannte Grüne Transformation'. Allein diese Wortwahl zeigt, wie weit die AfD von der Realität entfernt ist."
  - ✅ „Das ist keine Industriepolitik; das ist eine Rückschau auf ein Wirtschaftssystem von gestern."
  - ✅ „Das ist kein Niedergang; das ist Fortschritt, und den werden wir auf jeden Fall nicht aufhalten."
  - ✅ „Deutschland ist stark, weil wir Innovation fördern."
  - ✅ „Das ist praktisches Zukunftsmanagement, kein Populismus."
  - ✅ „Stillstand schützt keine Arbeitsplätze; Stillstand kostet Zukunft."
  - ✅ „Die AfD führt die Wirtschaft hinter die Fichte."
  - ✅ „Ihre Geldgeber empfehlen, aus Deutschland wegzugehen – das ist die Wahrheit hier heute im Plenum."
- **Framing-Marker:** energiewende_verteidigung, industrieland_bleiben, oekologie_oekonomie_zusammen, innovationsfoerderung_als_stabilitaet
- **Rhetorische Mittel:** Persönliche Anekdote (Restaurant-Gespräch mit AfD-Sponsor als Investor), Anaphora ('Wir handeln, wir unterstützen, wir investieren'), Kontrast-Rhetorik (Transformation vs. Stillstand), Direkte Adressierung der AfD-Fraktion ('Ihre Geldgeber', 'Ihre Spender'), Widerspruch-Aufdeckung (Ungarn-Strom auch subventioniert), Zwischen-Konflikt mit Ordnungsverletzung (AfD brüllt, Kreiser: 'Hören Sie mir doch einfach mal zu')
- **Konkrete Zahlen:** Salzgitter AG als Transformationsunternehmen (Beispiel aus heutigem Gespräch) | ReTraSON als Transformationsnetzwerk in ihrer Region
- **Anti-Halluzinations-Flags:**
  - H3 ausgelöst: Anekdote vom Restaurant-Sponsor ist zentrale Pointe — MUSS als Anekdote erkennbar sein, nicht abstrahiert zu 'AfD hat dubiose Finanzierung'. Die Pointe ist: Sponsor rät Firmen weg, während AfD mit Fünfpunkteplan so tut, als wolle sie Wirtschaft schützen — das ist die Heuchelei-Aufdeckung.
  - H7 ausgelöst: Ad-hominem-Charakter der Anekdote mit Distanz-Markierung ('Er hat mir gesagt'), nicht als etablierte Fakten, sondern als Bericht von Kreisers persönlichem Zeugnis.
  - H2 ausgelöst: Polemik-Marker ('hinter die Fichte führen', 'Augenwischerei', 'Hetzkampagnen') MÜSSEN erhalten bleiben — nicht zu neutralem 'kritisiert' abflachen.
- **Zusammenfassung:** Dunja Kreiser (SPD) lehnt den AfD-Fünfpunkteplan als veraltete Industriepolitik ab und verteidigt die Grüne Transformation als längst laufende Realität, in der deutsche Unternehmen (Salzgitter AG, Stahlgipfel etc.) führend bei Innovation und klimafreundlicher Produktion seien. Sie konfrontiert die AfD mit einer persönlichen Anekdote: Ein AfD-Sponsor, den sie zufällig im Restaurant traf, rät Mittelständlern, nicht mehr in Deutschland zu investieren und nach Ungarn auszuweichen — während die AfD mit ihrem Fünfpunkteplan Wirtschaftsschutz vortäuscht. Kreisers Frame: ‚praktisches Zukunftsmanagement' vs. ‚Populismus' und ‚Hetzkampagnen'; ihr Hauptanliegen ist die gezielte Steuerung von EU-Transformationsmitteln, damit sie an transformierenden Betrieben, nicht pauschal an strukturschwachen Regionen ankommen — und damit nicht selbst Migration verursacht.

---

### ID214008600 — Kurt Kleinschmidt (AfD)

**Sitzung 40 (2025-11-13)** | Topic: – Beratung der Beschlussempfehlung und des Berichts des Auswärtigen Ausschusses (3. Ausschuss) zu dem Antrag der Bundesregierung | Original: 3241 Zeichen | Latenz: 10764ms

#### Original (Auszug)
> Sehr geehrte Frau Präsidentin! Sehr geehrte Abgeordnete! Sehr geehrte Kameraden! Zu Beginn meiner Rede möchte ich klarstellen: Die Fraktion der Alternative für Deutschland wird der Operation Irini nicht zustimmen. Schon bei ISAF hieß die Logik: Ab ins Ursprungsland des Terrorismus, ab nach Afghanistan! – Wie das 2021 endete, mussten wir ja schmerzlich erfahren.
> Ähnlich verhält sich das mit der Operation Irini. Seit 2020 läuft dieser Einsatz und soll nun zum sechsten Mal verlängert werden. Und hat der Antrag zur Verlängerung bei ISAF noch aus zwei DIN-A4-Seiten bestanden, besteht die Drucksache
> _… (2641 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Operation Irini
- **Typ:** debatte
- **Summary:** Kurt Kleinschmidt lehnt die Verlängerung der Operation Irini ab und kritisiert die Bundesregierung für ihre Außen- und Verteidigungspolitik. Er argumentiert, dass Deutschland seine eigenen Probleme lösen sollte, anstatt sich in Libyen zu engagieren.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** A+B
- **Tonalität:** polemisch
- **Forderungen (3):**
  - Ablehnung der Verlängerung der Operation Irini (sechste Verlängerung seit 2020)
  - Fokus auf Sicherheit in Nord- und Ostsee statt auf Libyen-Engagement
  - Kritik an Geldverschwendung: 24,5 Millionen Euro 2024 für Energiewende/Klimaberatung in Libyen
- **Wörtliche Zitate (3/3 valid):**
  - ✅ „organisierte Schlepperei, geduldet durch die Bundesregierung und gedeckelt durch das Mandat Irini"
  - ✅ „Kraft und Zeit haben wir nicht, wenn ich mir die sicherheitspolitischen Herausforderungen in der Nord- und Ostsee anschaue"
  - ✅ „Am deutschen Wesen mag die Welt genesen"
- **Framing-Marker:** unkontrollierte_zuwanderung, geld_fuer_die_welt, isaf_parallele_misserfolg
- **Rhetorische Mittel:** Sarkasmus beim Zitieren des Mandats ('Sehr gut! Gute Idee!'), Suggestive Rhetorik ('Was ist wohl mit Konflikt und Gefährdung gemeint? Messerstecher oder Massenvergewaltigungen?'), Zitat-Dekonstruktion durch Kontrastierung (Libyens Bevölkerungs-Versorgung vs. Deutschland), Ad-hominem gegen Lauterbach ('Hoffentlich hat die nicht Herr Lauterbach geplant'), Klassisches AfD-Abschluss-Ritual (Soldatengruß, 'Soldatenglück, immer eine Handbreit Wasser unterm Kiel'), Doppelzüngige Selbstcharakterisierung ('als Militär')
- **Konkrete Zahlen:** Operation Irini läuft seit 2020, sechste Verlängerung geplant | Antrags-Umfang: 2 DIN-A4-Seiten bei ISAF, 8 DIN-A4-Seiten bei Irini-Oktober-2025 | 24,5 Millionen Euro 2024 für Energiewende/Klimaberatung in Libyen (ohne humanitäre Hilfen)
- **Anti-Halluzinations-Flags:**
  - H2 (Polemik-Erhalt): Sarkasmus und Migrations-Frames als 'organisierte Schlepperei' MÜSSEN spürbar bleiben — nicht zu neutralem 'kritisiert das Mandat' abflachen
  - H3 (Anekdoten-Pointe): Die ISAF-Parallele ist zentral für Kleinschmidts Struktur — nicht weglassen
  - H7 (Ad-hominem mit Distanz): Lauterbach-Spitze als zitierte Charakterisierung mit sarkastischem Ton
  - Klassischer AfD-Wahlaufruf FEHLT hier — nur Fraktion-Loyalitäts-Abschluss ('Ihnen und euch') ohne direkten Wahlaufruf
- **Zusammenfassung:** Kurt Kleinschmidt (AfD) lehnt die sechste Verlängerung der Operation Irini ab und vergleicht sie strukturell mit dem gescheiterten ISAF-Einsatz. Durch Dekonstruktion des achtenseitigen Mandats zitiert er sarkastisch dessen Ziele ('Versorgung der Bevölkerung auf kommunaler Ebene', 'Frauenförderung in Libyen', 'Beratung zur Anpassung an den Klimawandel') und unterstellt: Diese seien Verschleierung für 'organisierte Schlepperei' auf bekannten Migrationsrouten, die die Bundesregierung decke; 24,5 Millionen Euro 2024 für Libyens Energiewende statt Sicherheit in Nord- und Ostsee — 'Am deutschen Wesen mag die Welt genesen'. Schluss mit klassischem AfD-Soldaten-Ritual.

---

### ID214405000 — Joachim Bloch (AfD)

**Sitzung 44 (2025-11-27)** | Topic: : Einzelplan 15 Bundesministerium für Gesundheit | Original: 3107 Zeichen | Latenz: 14089ms

#### Original (Auszug)
> Frau Präsidentin! Frau Ministerin! Liebe Kolleginnen und Kollegen! Die Krankenkassen kollabieren. Den Versicherten drohen erneut Beitragserhöhungen. Und die Regierung legt einen Haushalt vor, der beides gerade nicht abwendet. Seit Merkel erfahren wir in allen Bereichen eine Reformverschleppung. Nur die Alternative für Deutschland wird das Sparprinzip der sogenannten schwäbischen Hausfrau endlich umsetzen.
> Hierzu schlagen wir ein Entlastungspaket in Höhe von 55 Milliarden Euro vor, das gezielt auf die Stärkung von Wachstum, Beschäftigung und Kaufkraft abzielt. Weiter sind 5 Milliarden Euro für 
> _… (2507 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Haushalts- und Wirtschaftspolitik
- **Typ:** debatte
- **Summary:** Joachim Bloch kritisiert die aktuelle Haushaltspolitik und fordert ein 55-Milliarden-Euro-Entlastungspaket zur Stärkung der deutschen Wirtschaft. Er schlägt vor, Auslandszahlungen, insbesondere Waffenlieferungen an die Ukraine, zu stoppen und stattdessen Investitionen in die heimische Infrastruktur und soziale Leistungen zu priorisieren.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** A+B
- **Tonalität:** polemisch_sachlich
- **Forderungen (9):**
  - 55-Milliarden-Euro-Entlastungspaket durch Steuersenkungen und Abgabenreduktionen (CO2-Bepreisung 17 Mrd, Stromsteuer 6,5 Mrd, Lohnsteuer 10 Mrd, Körperschaftsteuer 3 Mrd, Einkommensteuer 3 Mrd, Lkw-Maut 2,3 Mrd, Emissionshandel 4,3 Mrd, Agrardiesel 0,5 Mrd)
  - 5 Milliarden Euro kommunales Nothilfeprogramm
  - Lohnentlastung zur Stabilisierung der gesetzlichen Krankenversicherung
  - Reduzierung der EU-Zahlungen (Kritik: Deutschland zahlt 1 Mrd/Woche nach Brüssel, erhält nur 1 Mrd/Woche zurück)
  - Streichung ideologisch geprägter Programme mit zweifelhaftem Nutzen
  - Reform des Bürgergeldes
  - Kürzung der Verteidigungsausgaben
  - Stopp der Waffenlieferungen an die Ukraine
  - Aussetzung von Auslandszahlungen bis deutsche Infrastruktur und öffentliche Dienste (Schulen, Krankenhäuser, Deutsche Bahn, Brücken, Polizei, Justiz, Schulessen, Kindergärten, Schwimmbäder, ÖPNV, Hausärzte) vollständig saniert sind
- **Wörtliche Zitate (6/7 valid):**
  - ✅ „Die Krankenkassen kollabieren."
  - ✅ „Nur die Alternative für Deutschland wird das Sparprinzip der sogenannten schwäbischen Hausfrau endlich umsetzen."
  - ✅ „Wer den Sozialstaat erhalten will, muss die Wirtschaft stärken."
  - ✅ „Steuergelder sind primär da einzusetzen, wo diese erarbeitet werden."
  - ❌ „Nur die Alternative für Deutschland wird das Verschwendungsprogramm der Altparteien 'Geld für die Welt' auf ein vernünftiges Maß zurückführen und vorerst gar aussetzen."
  - ✅ „Deutschland hat tausend Probleme, und keines wird gelöst."
  - ✅ „Erst dann, aber nur dann haben wir das beste Deutschland aller Zeiten erreicht."
- **Framing-Marker:** schwaebische_hausfrau, geld_fuer_die_welt, ehrlicher_respekt
- **Rhetorische Mittel:** Detaillierte Auflistung mit konkreten Beträgen (Anaphora: 'Senkung der...'), Vergleichende Zahlenrhetorik (Deutschland 76 Mrd vs. UK 25 Mrd, FR 8,5 Mrd, ES 3 Mrd, IT 2,5 Mrd), Bedingungsklausel-Katalog (Erst wenn... Erst dann...), Wahlaufruf-implizite Positionierung ('Nur die AfD')
- **Konkrete Zahlen:** 55 Milliarden Euro Entlastungspaket | 5 Milliarden Euro kommunales Nothilfeprogramm | CO2-Bepreisung 17 Mrd, Stromsteuer 6,5 Mrd, Lohnsteuer 10 Mrd, Körperschaftsteuer 3 Mrd, Einkommensteuer 3 Mrd, Lkw-Maut 2,3 Mrd, Emissionshandel 4,3 Mrd, Agrardiesel 0,5 Mrd Euro | Deutschland: 76 Mrd an Ukraine, Großbritannien 25 Mrd, Frankreich 8,5 Mrd, Spanien 3 Mrd, Italien 2,5 Mrd Euro | Deutschland zahlt 1 Mrd Euro pro Woche nach Brüssel, erhält nur 1 Mrd Euro pro Woche zurück
- **Anti-Halluzinations-Flags:**
  - H1 (Bloch-Klasse): Keine konstruktiven Investitionen in infrastrukturelle oder soziale Vorhaben vorgeschlagen — AUSSCHLIESSLICH Steuer-/Abgabensenkungen und Kürzungen. Die abschließende Bedingungsklausel ('Erst wenn...') ist eine Vorwarts-Negation für Auslandszahlungs-Stopp, KEINE eigenständige Investitionsforderung.
  - H4 (Vollständigkeit): Alle 9 diskretifizierten Forderungen/Positionen enumereriert: 8 konkrete Abgabesenkungen + 1 Negativ-Forderung (Stopp Ukraine) + Bedingungsklausel.
  - H7 (Ad-hominem mit Distanz): 'Altparteien' als Charakterisierung, aber im Reden-Register des Sprechers — nicht als objektive Bewertung wiedergegeben.
- **Zusammenfassung:** Joachim Bloch (AfD) kritisiert die Kollaps-Situation der Krankenkassen und den Haushalt als unzureichend, präsentiert dagegen ein 55-Milliarden-Euro-Entlastungspaket ausschließlich aus Steuer- und Abgabensenkungen (CO2, Stromsteuer, Lohn-/Körperschaftsteuer, Lkw-Maut, Emissionshandel), gegenfinanziert durch Reduzierung der EU-Zahlungen (Vorwurf einer rechtswidrigen Schuldenunion), Streichung ideologischer Programme, Bürgergeld-Reform, Rüstungs-Kürzungen und Stopp der Ukraine-Waffenlieferungen (Deutschland zahle 76 Mrd vs. UK 25 Mrd). Im Rahmen des 'schwäbische Hausfrau'-Sparprinzips fordert er eine Bedingungsklausel: Auslandszahlungen erst wieder nach vollständiger Sanierung aller deutschen Schulen, Krankenhäuser, der Bahn, Brücken, und Gewährleistung von Hausärzteverfügbarkeit — für die 'beste Deutschland aller Zeiten'.

---

### ID215303600 — Dr. Moritz Heuberger (BÜNDNIS 90/DIE GRÜNEN)

**Sitzung 53 (2026-01-15)** | Topic: Beratung der Unterrichtung durch die Bundesregierung | Original: 4289 Zeichen | Latenz: 12926ms

#### Original (Auszug)
> Sehr geehrter Herr Präsident! Liebe Kolleginnen und Kollegen! Liebes Publikum! Im neuen Jahr haben viele gute Vorsätze. Oft geht es darum, fitter und gesünder zu werden. Das mit dem Fitwerden braucht bei mir noch eine Weile. Aber wir reden hier ja darüber, wie wir unseren Staat fitmachen. Das ist auch dringend nötig; denn 73 Prozent der Menschen sagen, dass sie denken, dass unser Staat mit seinen Aufgaben aktuell überfordert ist. Dieser Eindruck kommt nicht von ungefähr. Wenn Unternehmen jedes Jahr 100 000 Beschäftigte abstellen müssen, um bürokratische Hürden zu meistern, dann entsteht so ein
> _… (3689 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Bürokratieabbau und staatliche Modernisierung
- **Typ:** debatte
- **Summary:** Dr. Moritz Heuberger fordert einen effizienteren und digitalisierten Staat, der durch Prozessoptimierung statt durch bloßen Abbau von Standards entlastet wird. Er kritisiert das aktuelle Entlastungspaket als reine Symptombekämpfung und warnt davor, dass mangelnde Rechtssicherheit oder rein fiktive Genehmigungsverfahren die staatliche Handlungsfähigkeit langfristig schwächen.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** F
- **Tonalität:** sachlich_konstruktiv
- **Forderungen (9):**
  - Vereinfachung von Berichtspflichten nach dem Once-Only-Prinzip statt wahlloser Streichungen
  - Bundeln von Meldungen und Kopplung an interne Controlling-Prozesse, um doppelte Reporting-Anforderungen (intern + staatlich) zu vermeiden
  - Digitale Schnittstellen für direkte Datenübermittlung zwischen Unternehmen und Staat
  - Praktische Vereinfachungen, risikobasierte Stichproben und höhere Strafen bei Verstößen statt pauschaler Kahlschlag
  - Erhalt von Umwelt- und Sozialstandards trotz Ressourceneinsparungen
  - Keine Senkung von Qualitätsstandards bei Maklern und Hausverwaltungen (zur Vermeidung von Rechtsunsicherheit)
  - Genehmigungsfiktion nur als Übergangslösung, nicht als Dauerlösung
  - Gleichzeitige Stärkung von Personal und IT-Kapazitäten bei Fristverschiebungen
  - Investition in staatliche Handlungsfähigkeit statt Risiko-Verschiebung durch Zeitablauf
- **Wörtliche Zitate (6/6 valid):**
  - ✅ „Wenn Unternehmen jedes Jahr 100 000 Beschäftigte abstellen müssen, um bürokratische Hürden zu meistern, dann entsteht so ein Eindruck."
  - ✅ „Once-Only-Prinzip"
  - ✅ „mehr praktische Vereinfachungen, risikobasierte Stichproben und höhere Strafen bei Verstößen statt einfach nur Kahlschlag"
  - ✅ „Das ist kein Bürokratieabbau. Das ist am Ende eine Kostenverlagerung in die Justiz."
  - ✅ „eine Fiktion heilt keine schlechten Prozesse"
  - ✅ „Wir wollen keinen schlanken Staat, der unter dem Gewicht seiner Aufgaben einbricht, sondern wir wollen einen schlauen Staat, der den Herausforderungen unserer Zeit gewachsen ist."
- **Framing-Marker:** energiewende_verteidigung, oekologie_oekonomie_zusammen, industrieland_bleiben
- **Rhetorische Mittel:** Persönliche Anekdote Einleitung (Fitnessvorsätze als Metapher für Staatsfitness), Statistischer Beleg (73 Prozent Überförderungs-Wahrnehmung), Konkrete Alltagsbeispiele (Onlineantrag ausdrucken, Berliner Senat), Dreigliedrige Struktur mit Fokussierung auf drei Kernpunkte, Schlusmetapher (Muskelaufbau vs. Kaloriendefizit), Technische Fach-Begriffe (Once-Only-Prinzip, Genehmigungsfiktion, risikobasierte Stichproben)
- **Konkrete Zahlen:** 73 Prozent der Menschen empfinden den Staat als überfordert | 100 000 Beschäftigte pro Jahr für Bürokratie-Bewältigung nötig
- **Anti-Halluzinations-Flags:**
  - H4 (Vollständigkeit): Alle drei nummerierten Punkte (Vereinfachen/Digitalisieren, Rechtssicherheit/Verlässlichkeit, Prozesse statt Workarounds) wurden erfasst; Subpunkte (Once-Only, Bundeln, digitale Schnittstellen; Qualitätsstandards-Erhalt; Fiktion-Grenze, Personalstärkung) vollständig enumeriert
  - H2 (Polemik-Erhalt): Sachlicher Ton bewahrt, aber Kritik an 'Kahlschlag' und 'Kostenverlagerung in die Justiz' als distinkte Positionen markiert
  - H8 (Zahlen-Anker): beide nennenswerten Zahlen (73%, 100k) aufgenommen
  - H6 (Vorhaben-Rhetorik): Text enthält keine 'wir werden'-Aussagen; Forderungen sind normativ-konstruktiv, keine Ankündigungen
- **Zusammenfassung:** Dr. Moritz Heuberger (Grüne) kritisiert das Entlastungspaket der Bundesregierung als symptomatisch und plädiert für drei konstruktive Alternativen: (1) das Once-Only-Prinzip und digitale Schnittstellen statt pauschaler Streichung von Berichtspflichten, um Doppel-Reporting zu vermeiden; (2) Erhalt von Qualitäts- und Umwelt-Standards gegen Rechtsunsicherheit und Justiz-Kostenverlagerung; (3) echte Prozess-Verbesserung statt bloßer Genehmungsfiktionen, gekoppelt mit Personal- und IT-Stärkung. Sein Frame: nicht ein 'schlanker Staat unter dem Gewicht seiner Aufgaben', sondern ein 'schlauer Staat' — eine Absage an destruktive Sparlogik zugunsten von handlungsfähiger Staatlichkeit.

---

### ID21700700 — Gereon Bollmann (AfD)

**Sitzung 7 (2025-05-22)** | Topic: Erste Beratung des von den Fraktionen der CDU/CSU und SPD eingebrachten Entwurfs eines Gesetzes zur Verlängerung der Fristen im Investitionsprogramm Ganztagsausbau | Original: 2722 Zeichen | Latenz: 9610ms

#### Original (Auszug)
> Frau Präsidentin! Frau Ministerin! Meine Damen und Herren! Seit rund 50 Jahren macht man uns die Ganztagsschule mit den Argumenten schmackhaft, sie verbessere die gleichberechtigte Teilhabe von Frauen und Männern am Erwerbsleben und erhöhe die Bildungschancen, weil der Bildungserfolg der Kinder bis heute von ihrer sozialen Herkunft abhänge.
> Man verschweigt dabei aber, dass die Ganztagsschule unsere Familien auch beschädigen kann. Wenn die gemeinsame Freizeitgestaltung in den Familien sich auf die Abendstunden und die Wochenenden beschränkt, wenn die Geschwister weniger Kontakt untereinander ha
> _… (2122 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Ausbau der Ganztagsschulen und Lehrermangel
- **Typ:** debatte
- **Summary:** Gereon Bollmann kritisiert den Ausbau der Ganztagsschulen als familienfeindlich und zweifelt deren pädagogischen Nutzen an. Er fordert stattdessen eine direkte finanzielle Förderung von Familien durch Steuersenkungen und warnt vor einem massiven Lehrermangel, der die geplanten Schulbauten zu bloßen Verwahrorten machen könnte.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** A
- **Tonalität:** polemisch
- **Forderungen (5):**
  - Ablehnung des Ganztagsausbau-Gesetzes
  - Umleitung der Milliarden in direkte Familienförderung statt Schulbau-Investitionen
  - Massive Steuerentlastungen (wie von der AfD seit Jahren vorgeschlagen)
  - Priorisierung von pädagogischem Personal statt baulicher Infrastruktur
  - Lösung des Lehrermangels (55.000 zusätzliche Lehrer bis 2030, 85.000 bis 2035/2036)
- **Wörtliche Zitate (4/4 valid):**
  - ✅ „gibt man der Familie Steine statt Brot"
  - ✅ „Beide Eltern sollen Erwerbseinkommen beziehen und als Steuerzahler und Lückenbüßer für den Fachkräftemangel dienen"
  - ✅ „bauliche Verwahranstalten für unsere Kinder"
  - ✅ „Investitionsruinen"
- **Framing-Marker:** verwahranstalten, steuergeschenke_besserverdiener, manchesterkapitalismus
- **Rhetorische Mittel:** Metaphern (Steine statt Brot, Verwahranstalten, Investitionsruinen), Rhetorical question (Nennen Sie mir einen empirischen Beleg...), Reductio ad absurdum (Lehrermangel nicht gelöst, aber Milliarden für Bauten), Berufung auf Autorität (Prof. Eckhard Klieme, Simone Fleischmann)
- **Konkrete Zahlen:** 85.000 fehlende Lehrerstellen bis Schuljahr 2035/2036 (Statista) | 55.000 zusätzlich benötigte Lehrer bis 2030 (Kultusministerkonferenz) | rund 50 Jahre: Ganztagsschule-Versprechen ohne Erfüllung
- **Anti-Halluzinations-Flags:**
  - H2 (Polemik-Erhalt): Scharfe Kritik an Ganztagsschule als 'Familie beschädigen', 'Steine statt Brot', 'Verwahranstalten' — diese Tonalität MUSS erhalten bleiben, nicht in sachliche Kritik neutralisiert
  - H4 (Vollständigkeit): Alle vier Kritik-Stränge erfasst: (1) Familienschaftsschaden, (2) fehlender empirischer Beleg, (3) Fokus auf Beton statt Personal, (4) ungelöster Lehrermangel
  - H5: Keine ausweichende Antwort, sondern substantielle inhaltliche Kritik mit Zahlen
  - H7 (Ad-hominem mit Distanz): Keine persönliche Attacke auf Personen, sondern auf Politikansatz
- **Zusammenfassung:** Gereon Bollmann (AfD) lehnt das Ganztagsausbau-Gesetz ab und argumentiert polemisch mit drei zentralen Punkten: (1) Ganztagsschulen 'beschädigen Familien', geben ihnen 'Steine statt Brot' und dienen nur dazu, beide Eltern als Steuerzahler und 'Lückenbüßer für Fachkräftemangel' einzuspannen; (2) empirische Belege für Bildungserfolg fehlen (Verweis auf Prof. Eckhard Klieme); (3) die Milliarden fließen in 'Schulbau-Investitionsruinen' statt in Personal — während 55.000 Lehrerstellen bis 2030 und 85.000 bis 2035/2036 fehlen. Sein Gegenprogramm: direkte Familienförderung und massive Steuerentlastung statt baulicher Kapazitäten.

---

### ID211103700 — Dr. Hülya Düber (CDU/CSU)

**Sitzung 11 (2025-06-06)** | Topic: Beratung des Antrags der Abgeordneten Ricarda Lang, Lisa Paus, Andreas Audretsch, weiterer Abgeordneter und der Fraktion BÜNDNIS 90/DIE GRÜNEN | Original: 4792 Zeichen | Latenz: 13430ms

#### Original (Auszug)
> Sehr geehrter Herr Präsident! Liebe Kolleginnen und Kollegen! Mindestlohndebatten finden auch zehn Jahre nach der Einführung des Mindestlohns im Eilverfahren den Weg auf die Tagesordnung des Deutschen Bundestages. Der Grund ist offensichtlich: Die Mindestlohnkommission muss bis Ende Juni dieses Jahres eine Empfehlung für die Höhe des gesetzlich festgeschriebenen Mindestlohns geben.
> Damit bin ich auch schon bei den Anträgen der Fraktionen Bündnis 90/Die Grünen und Die Linke. Die Politik sollte sich nicht in die Lohnfindung einmischen.
> Einen gesetzlich vorgeschriebenen Mindestlohn lehnen wir ab.
> _… (4192 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Festlegung des gesetzlichen Mindestlohns
- **Typ:** debatte
- **Summary:** Dr. Hülya Düber lehnt eine politische Einmischung in die Lohnfindung ab und plädiert dafür, die Festlegung des Mindestlohns der unabhängigen Mindestlohnkommission zu überlassen. Sie fordert einen fairen Interessenausgleich zwischen Arbeitgebern und Arbeitnehmern und warnt vor einer Überlastung kleiner Betriebe durch zu hohe Lohnvorgaben, weshalb sie stattdessen Entlastungen und Steuererleichterungen für die Wirtschaft fordert.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** H
- **Tonalität:** sachlich_pragmatisch
- **Forderungen (8):**
  - Ablehnung eines gesetzlich vorgeschriebenen Mindestlohns
  - Vertrauen in die unabhängige Mindestlohnkommission als Lohnfindungs-Instanz
  - Forderung an die Mindestlohnkommission: ordentliche Arbeit mit fairem Austausch zwischen Arbeitgeber- und Arbeitnehmerinteressen
  - Verbot von einseitigen Durchsetzungen wie 2023 (als Arbeitgeberseite ohne Übereinkunft ihre Empfehlung durchsetzte)
  - Abwarten der EuGH-Entscheidung zum Klageverfahren gegen die EU-Mindestlohnrichtlinie vor weiteren Handlungen
  - Rahmenbedingungen und Entlastungen (Steuererleichterungen) für kleine Betriebe im ländlichen Raum
  - Befürwortung des Bundestariftreuegesetzes zur Stärkung der Tarifbindung
  - Dialog mit Betrieben zur Ermöglichung guter Löhne ohne Existenzgefährdung
- **Wörtliche Zitate (6/6 valid):**
  - ✅ „Die Politik sollte sich nicht in die Lohnfindung einmischen"
  - ✅ „Wir setzen nämlich auf die Errungenschaften der sozialen Marktwirtschaft, eine starke Tarifpartnerschaft"
  - ✅ „Der richtige Adressat für das Verhandeln eines angemessenen Mindestlohns ist somit nicht die Politik, sondern die unabhängige Mindestlohnkommission"
  - ✅ „Der Bruch mit diesem Versprechen unserer sozialen Marktwirtschaft ist eben keine Option"
  - ✅ „Welcher Lohn ist fair, und welche Gehaltszahlung kann die Wirtschaft in der aktuellen Lage noch verkraften?"
  - ✅ „Gute Arbeits- und Sozialpolitik liegt vor, wenn gute Löhne möglich sind, ohne Betriebe in Existenznot zu bringen, wobei die Entscheidungsfindung in die bewährten Hände der Tarifautonomie gehört"
- **Framing-Marker:** soziale_marktwirtschaft, laendlicher_raum_lebensraum, oekologie_oekonomie_zusammen
- **Rhetorische Mittel:** Konkrete Wahlkreis-Anekdote (Würzburger Winzer und Landwirte), Dreischritt-Argumentation: Prinzip (Tarifautonomie) → Gegenwart (2023-Beispiel) → Zukunft (Dialog), Finale Zusammenfassung in Einzel-Satz, Adressat-Verschiebung (Politik → Mindestlohnkommission → Tarifpartner)
- **Konkrete Zahlen:** 15 Euro geplanter Mindestlohn (Schreckensszenario für kleine Betriebe) | Gut die Hälfte (>50%) der Beschäftigten arbeiten noch in tarifgebundenen Betrieben | 10 Jahre seit Einführung des Mindestlohns (2015 im Kontext)
- **Anti-Halluzinations-Flags:**
  - H6 ausgelöst: 'Bundestariftreuegesetz' ist als im Koalitionsvertrag bereits fixiertes Ziel erwähnt, NICHT als neue Forderung hier — korrekt als bestehende Position aufgenommen.
  - H4 (Multi-Punkt-Vollständigkeit): Acht distinkter Forderungen erfasst, die Rede folgt klarer struktureller Logik (Ablehnung Politisierung → Vertrauen MLK → Fairness-Kritik 2023 → EuGH-Abwarten → Rahmenbedingungen kleine Betriebe → Tarifbindung → Synthese-Satz). Keine Punkt-Abdrift.
  - H2 (Polemik-Erhalt nicht zutreffend): Diese Rede ist bewusst NICHT polemisch — sachlich, pragmatisch, anerkennend (gegenüber Grüne/Linke: 'in der Sache sind wir uns im Grundsatz einig'). Tonalität korrekt als sachlich klassifiziert.
- **Zusammenfassung:** Dr. Hülya Düber (CDU/CSU) lehnt einen gesetzlich vorgeschriebenen Mindestlohn ab und vertraut auf die unabhängige Mindestlohnkommission als Lohnfindungs-Instanz im Rahmen der sozialen Marktwirtschaft — fordert aber gleichzeitig 'ordentliche Arbeit' mit fairem Arbeitgeber-Arbeitnehmer-Ausgleich, nicht wie 2023 einseitige Durchsetzungen. Sie betont die Lasten kleiner Betriebe im ländlichen Raum (Würzburger Winzer, Spargelbauern) und fordert entsprechend Entlastungen und Dialog statt Politisierung; parallel befürwortet sie das Bundestariftreuegesetz zur Stärkung der insgesamt schwachen Tarifbindung (nur noch ~50% der Beschäftigten). Ihre Schlussformel: gute Löhne ohne Existenzgefährdung durch bewährte Tarifautonomie.

---

### ID211411100 — Kai Whittaker (CDU/CSU)

**Sitzung 14 (2025-06-26)** | Topic: Beratung des Antrags der Abgeordneten René Springer, Peter Bohnhof, Gerrit Huy, weiterer Abgeordneter und der Fraktion der AfD | Original: 5741 Zeichen | Latenz: 15173ms

#### Original (Auszug)
> Frau Präsidentin! Werte Kolleginnen und Kollegen! Mein Vorredner hat geschlagene vier Minuten gebraucht, um zu erklären, was die AfD eigentlich will; es wäre bei Gott auch kürzer gegangen. Deshalb noch mal zum Mitschreiben: Sie von der AfD glauben, dass wir hier zu viele Ukrainer haben, weil es hier zu leicht und zu viel Bürgergeld gibt. Und Sie glauben, dass die Ukrainer faul sind. Und weil sie faul sind, muss man ihnen das Bürgergeld wegnehmen. Zurück ins Asylbewerberleistungsgesetz: Das ist Ihre Politik.
> Natürlich greifen Sie dieses Thema jetzt auf, weil wir als Koalition auch zurückwollen 
> _… (5141 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Unterstützung der Ukraine
- **Typ:** kurzintervention
- **Summary:** Kai Whittaker kritisiert die AfD für ihre Haltung zu ukrainischen Flüchtlingen und ihre angebliche Unterstützung von Putins Krieg. Er fordert, dass man nicht die Ukrainer zum Problem macht und dass Menschenwürde keine Kostenfrage sein sollte.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** D
- **Tonalität:** konfrontativ_belegend
- **Forderungen (4):**
  - Beendigung der Sonderregelung für ukrainische Kriegsflüchtlinge im Bürgergeld und Rückkehr zur Regelung des Asylbewerberleistungsgesetzes
  - Verbesserung des Bürgergeld-Systems durch Erhöhung der Anreize zwischen Bürgergeld und Lohn
  - Entlastung der Jobcenter
  - Nachschärfung gegen Missbrauch im Bürgergeld-System
- **Wörtliche Zitate (7/8 valid):**
  - ✅ „Deshalb noch mal zum Mitschreiben: Sie von der AfD glauben, dass wir hier zu viele Ukrainer haben, weil es hier zu leicht und zu viel Bürgergeld gibt. Und Sie glauben, dass die Ukrainer faul sind."
  - ✅ „Wir beenden jetzt diese Sonderregelung, weil die akute Ausnahmesituation vorbei ist."
  - ✅ „Das ist kaltes Kosten-Nutzen-Denken, bezogen auf Menschenleben, und das ist brandgefährlich."
  - ✅ „Wenn Menschenwürde eine Kostenfrage wird, verlieren wir alle."
  - ✅ „Wir werden Ausländer in ihre Heimat zurückführen. Millionenfach."
  - ✅ „Entweder wir sind Einwanderungsland ohne Sozialstaat, oder wir schützen den Sozialstaat mit Remigrationspolitik."
  - ❌ „Sie sind nicht patriotisch. Sie sind nationalistisch, Herr Springer."
  - ✅ „Was bleibt von Ihrer Politik, Herr Springer, wenn man die Wut abzieht? Kein Konzept, kein Plan, nur Parolen!"
- **Framing-Marker:** unkontrollierte_zuwanderung, rassentheorien_sind_vorbei, kampf_gegen_rechts
- **Rhetorische Mittel:** Persönliche Anklage mit Charakterisierung ('Sie sind nationalistisch'), Twitter-Zitate als Beleg für AfD-Remigrations-Rhetorik, Anaphora ('Herr Kollege' / 'Ja, ...'), Szenario-Warnung (heute Geflüchtete, morgen Rentner/Kranke/Alleinerziehende), Direkter Wahlaufruf-Kontrast ('Wir setzen auf Chancen statt Chauvinismus'), Ordnungsruf während der Rede (Keuter/Springer Zwischenruf 'Vaterlandsverräter')
- **Konkrete Zahlen:** Vier Minuten: Länge von Springers AfD-Vorrednerei | Millionen Menschen: innerhalb weniger Wochen nach russischer Invasion geflohen | 10. Januar, Februar: Twitter-Posts Springers zur Remigration
- **Anti-Halluzinations-Flags:**
  - H2 (Polemik-Erhalt): Whittaker greift AfD mit persönlichen Charakterisierungen ('nationalistisch', nicht 'patriotisch') und expliziter Frame-Aufdeckung an — MUSS in Summary als konfrontativ-belegend erhalten bleiben, nicht zu neutrale 'kritisiert' abflachen.
  - H3 (Anekdote/Pointe): Keine Anekdoten vorhanden; stattdessen zwei Twitter-Zitate Springers als Beleg-Strategie — diese müssen als Belege der Remigrations-Rhetorik aufgenommen werden.
  - H7 (Ad-hominem mit Distanz): 'Sie sind nationalistisch' und 'Sie sind nicht patriotisch' sind direkte Charakterzuschreibungen; in Summary mit klarer Attributions-Markierung ('Whittaker attestiert')
  - H4 (Vollständigkeit): Vier sachlich-konstruktive Forderungen am Schluss ('zusätzliche Anreize', 'Jobcenter entlasten', 'Missbrauch nachschärfen') MÜSSEN in forderungen[] aufgenommen werden, auch wenn die Rede zu 80% Konfrontation ist.
- **Zusammenfassung:** Kai Whittaker (CDU/CSU) führt eine konfrontativ-belegende Rede gegen den AfD-Antrag (Springer). Er entlarvt die AfD-Logik — faule Ukrainer, deshalb Kürzung von Bürgergeld — als vorgeschoben und attackiert die wahre AfD-Agenda: Remigration (mit Twitter-Zitaten Springers: 'Millionenfach zurückführen', 'Remigrationspolitik statt Einwanderung + Sozialstaat'). Whittaker attestiert Springer Nationalismus, nicht Patriotismus — ein Patriot schütze sein Land und stehe zur Bundeswehr, Springer hingegen schweige zu Putins Kriegsverbrechen. Inhaltlich will die Koalition die ukrainischen Kriegsflüchtlinge aus dem Bürgergeld zurück ins Asylbewerberleistungsgesetz nehmen (pragmatische Rückkehr zur alten Regelung, nicht AfD-Logik), UND das Bürgergeld selbst systemisch verbessern: höhere Anreize, Jobcenter-Entlastung, Missbrauchsbekämpfung — 'Chancen statt Chauvinismus'. Ein Ordnungsruf erfolgt gegen Keuter (AfD) für den Zwischenruf 'Vaterlandsverräter'.

---

### ID211315500 — Johannes Schraps (SPD)

**Sitzung 13 (2025-06-25)** | Topic: Ich rufe jetzt auf die Zusatzpunkte 4 und 5: | Original: 3721 Zeichen | Latenz: 8868ms

#### Original (Auszug)
> Verehrte Frau Präsidentin! Sehr geehrte Kolleginnen und Kollegen! Der russische Angriffskrieg gegen die Ukraine bringt weiter unermessliches Leid über das Land und über seine Menschen. Zerstörte Städte, getötete Zivilistinnen und Zivilisten, traumatisierte Kinder – dieses Leid ist eigentlich kaum wiedergutzumachen, und es lässt sich, ehrlich gesagt, auch nur ganz schwer in Zahlen fassen.
> Deshalb will ich zum Ende dieser Debatte, die manchmal ein bisschen aufgeladen war, noch mal ganz klar festhalten: Russland muss als Aggressor für seinen Angriffskrieg zur Verantwortung gezogen werden, und zwa
> _… (3121 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Nutzung eingefrorener russischer Vermögenswerte für die Ukraine
- **Typ:** debatte
- **Summary:** Johannes Schraps fordert, Russland für seinen Angriffskrieg politisch, völkerstrafrechtlich und finanziell zur Verantwortung zu ziehen. Er befürwortet die Prüfung einer weitergehenden Nutzung eingefrorener russischer Zentralbankreserven für den Wiederaufbau der Ukraine, betont dabei jedoch die Notwendigkeit einer rechtssicheren Umsetzung in Abstimmung mit EU- und G7-Partnern.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** K
- **Tonalität:** staatsmaennisch
- **Forderungen (6):**
  - Russland muss politisch, völkerstrafrechtlich und finanziell zur Verantwortung gezogen werden
  - Kriegsverbrechen des russischen Regimes müssen vor Gericht kommen
  - Finanzielle Wiedergutmachung muss Teil des rechtlichen Aufarbeitungsprozesses sein
  - Prüfung weitergehender Nutzungsoptionen der eingefrorenen russischen Zentralbankreserven (~300 Mrd USD)
  - Schnelle rechtliche Klärung der Vermögensnutzung in abgestimmtem G7- und EU-Rahmen
  - Rechtlich einwandfreie Umsetzung der Vermögensnutzung ohne Erosion der regelbasierten Ordnung
- **Wörtliche Zitate (2/2 valid):**
  - ✅ „Russland muss als Aggressor für seinen Angriffskrieg zur Verantwortung gezogen werden, und zwar politisch, völkerstrafrechtlich und finanziell"
  - ✅ „Die Ukraine verdient unsere Solidarität, verehrte Kolleginnen und Kollegen, und sie verdient gleichermaßen rechtlich tragfähige, verlässliche und langfristige Lösungen"
- **Framing-Marker:** frozen_assets, klimaschutz_menschenschutz
- **Rhetorische Mittel:** Wiederholung von Dreiergruppen (politisch, völkerstrafrechtlich, finanziell), Sachliche Aufzählung rechtlicher Bedenken, Mahnende Schlussforderung, Verweis auf externe Expertise (Weltbank, Kollege Stegner, Außenminister)
- **Konkrete Zahlen:** über 500 Milliarden US-Dollar Wiederaufbau-Bedarf laut Weltbank-Gutachten | knapp 300 Milliarden US-Dollar eingefrorene russische Zentralbankreserven | knapp 3 Milliarden US-Dollar jährliche Erträge aus Windfallprofits
- **Anti-Halluzinations-Flags:**
  - H6 ausgelöst: 'Außenminister prüft weitergehende Optionen' ist Vorhaben/Prüfung, nicht abgeschlossene Maßnahme — entsprechend als laufender Prozess dargestellt
  - H8 erfüllt: drei prägnante Zahlen (500 Mrd, 300 Mrd, 3 Mrd) als Ankerpunkte aufgenommen
- **Zusammenfassung:** Johannes Schraps (SPD) plädiert in dieser Debatte zum Schluss für eine dreifache Verantwortung Russlands: politisch, völkerstrafrechtlich und finanziell. Er würdigt die Weltbank-Schätzung von über 500 Mrd USD Wiederaufbau-Bedarf und begrüßt, dass die neue Bundesregierung die Nutzung der eingefrorenen 300-Mrd-USD-Zentralbankreserven (bislang nur 3 Mrd USD jährlich aus Windfallprofits) prüft — betont aber: Dies muss in rechtlich einwandfreier, eng mit EU und G7 abgestimmter Form geschehen, um Präzedenzfälle gegen die regelbasierte Ordnung zu vermeiden. Kernbotschaft: Die Ukraine verdient Solidarität UND rechtlich tragfähige, langfristige Lösungen.

---

### ID211604500 — Ruppert Stüwe (SPD)

**Sitzung 16 (2025-07-08)** | Topic: Wir kommen jetzt zum Einzelplan 25, zum Geschäftsbereich des Bundesministeriums für Wohnen, Stadtentwicklung und Bauwesen. | Original: 4370 Zeichen | Latenz: 10448ms

#### Original (Auszug)
> Frau Präsidentin! Werte Ministerin! Werte Kolleginnen und Kollegen! Je niedriger das Einkommen, desto mehr muss anteilig für die Wohnung ausgegeben werden. Das wird für immer mehr Menschen zum Problem.
> Deswegen müssen wir ganz konkret Politik für bezahlbares Wohnen machen, die dafür sorgt, dass Familien eine Wohnung finden, die auch ein Kinderzimmer hat, dass Auszubildende und Studierende dort ein Zimmer finden, wo sie auch lernen wollen, und dass man im Alter in eine Wohnung umziehen kann, die den eigenen Bedürfnissen entspricht, ohne dass sich die Miete verdoppelt, während sich die Wohnfläch
> _… (3770 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Bezahlbares Wohnen
- **Typ:** regierungserklaerung
- **Summary:** Ruppert Stüwe fordert Politik für bezahlbares Wohnen, um Familien, Auszubildende und Studierende sowie Menschen im Alter eine angemessene Wohnung zu ermöglichen. Er unterstützt den Haushaltsentwurf, der Investitionen in den Wohnungsbau und die klimafreundliche Infrastruktur vorsieht.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** E
- **Tonalität:** bilanzierend_werbend
- **Forderungen (9):**
  - Massive Investitionen in sozialen Wohnungsbau — Verdreifachung der Mittel im Vergleich zu 2021
  - 7,4 Milliarden Euro im Einzelplan 25 für Bauen und Wohnen (höchster Betrag je einer Koalition)
  - Zusätzliche 11 Milliarden Euro aus dem Sondervermögen bis 2029 für Wohnungsbau und klimafreundliche Infrastruktur
  - Erhöhter Anteil von Sozialwohnungen als explizites Ziel
  - Vereinfachung von Förderbedingungen und effizientere Prozesse
  - Investitionen in innovatives Bauen (modulares Bauen, neue Baustoffe, digitale Planungsmethoden)
  - Gründung eines Bundesforschungszentrums für klimaneutrales und ressourceneffizientes Bauen
  - Städtebauförderung mit knapp 800 Millionen Euro
  - Wohngeld-Expansion: Mittel seit 2022 mehr als verdoppelt, Berechtigtenkreis deutlich ausgeweitet
- **Wörtliche Zitate (4/4 valid):**
  - ✅ „Die Entscheidung darüber, wie Menschen wohnen, können wir nicht allein dem Markt überlassen"
  - ✅ „Es ist der höchste Betrag, den je eine Koalition für Bauen und Wohnen eingeplant hat"
  - ✅ „Die Miete darf Menschen nicht in Armut treiben"
  - ✅ „Lebenswerte Quartiere sind wichtig für den Zusammenhalt unserer Gesellschaft"
- **Framing-Marker:** soziale_marktwirtschaft, fairer_interessenausgleich
- **Rhetorische Mittel:** Konkrete Lebensszenarien (Familien, Auszubildende, Alter), Zahlen-Katalog zur Bilanz, Anti-AfD-Spitze (modulares Bauen / Bezahlbarkeit), Dank-Adressierung an Bundestag
- **Konkrete Zahlen:** 7,4 Milliarden Euro Einzelplan 25 (höchster Betrag je einer Koalition) | 11 Milliarden Euro aus Sondervermögen bis 2029 | Verdreifachung Sozialwohnungsbau-Mittel vs. 2021 | Knapp 800 Millionen Euro Städtebauförderung | Wohngeld: Mittel mehr als verdoppelt seit 2022
- **Anti-Halluzinations-Flags:**
  - H6 (Ministerial-Rhetorik): 'werden gründen wollen', 'werden vereinfachen' korrekt als geplante Vorhaben klassifiziert, nicht als Errungenschaften
  - H4 (Multi-Punkt-Vollständigkeit): Alle 9 distinkten Investitions- und Förder-Punkte enumeri­ert vor Synthese
- **Zusammenfassung:** Ruppert Stüwe (SPD) verteidigt den Haushaltsentwurf des Wohnungsministeriums als Investitionsschwerpunkt mit 7,4 Milliarden Euro (höchster Koalitions-Betrag aller Zeiten) plus 11 Milliarden aus dem Sondervermögen bis 2029. Seine fünf Prioritäten sind: Verdreifachung der Sozialwohnungsbau-Mittel, Innovationen im Bauen (modulares Bauen, Digitalisierung, Bundesforschungszentrum), 800 Millionen Euro Städtebauförderung für Nachbarschaften, Wohngeld-Expansion (Mittel verdoppelt, Berechtigtenkreis ausgeweitet), und die Absage an reinen Markt-Mechanismus — 'Die Entscheidung darüber, wie Menschen wohnen, können wir nicht allein dem Markt überlassen'. Er kontert AfD-Kritik an Innovation durch Bezahlbarkeits-Frame: billiges modulares Bauen sei gerade das Gegenteil von 'nur Villen fördern'.

---

### ID211314500 — Martin Sichert (AfD)

**Sitzung 13 (2025-06-25)** | Topic: Beratung des Antrags der Fraktionen der CDU/CSU und SPD | Original: 3112 Zeichen | Latenz: 11169ms

#### Original (Auszug)
> Frau Präsidentin! Meine Damen und Herren! Sie fordern Lehren für künftige Pandemien. In der Coronazeit verbreiteten sich mehrere Krankheiten pandemisch unter Politikern: Größenwahn, Kontrollwahn und hypochondrischer Wahn.
> Und in diesem Wahnzustand schien jedes Mittel recht. Eltern wurden vom Gesundheitsamt aufgefordert, wochenlang jeden körperlichen Kontakt den eigenen zweijährigen Kindern vorzuenthalten, nur weil irgendwer in der Kita einen positiven Test hatte. Gesunde Menschen wurden für symptomlos krank erklärt. Kindergeburtstage waren verboten, Kinder saßen mitten im Winter frierend in Zu
> _… (2512 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Coronapolitik und Aufarbeitung
- **Typ:** erklaerung
- **Summary:** Martin Sichert kritisiert die Coronapolitik und fordert einen Untersuchungsausschuss, um die Verantwortlichen zur Rechenschaft zu ziehen. Er erinnert an die Einschränkungen der Grundrechte und die Schäden, die durch die Coronamaßnahmen verursacht wurden. Er bietet an, gemeinsam mit Linken und Grünen einen Untersuchungsausschuss einzurichten.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** A
- **Tonalität:** polemisch
- **Forderungen (3):**
  - Einrichtung eines Untersuchungsausschusses statt 'Stuhlkreis' zur Aufarbeitung der Coronapolitik
  - Untersuchung von Maskenrichtlinien und Coronamaßnahmen
  - Aufarbeitung der staatlichen Coronapolitik und deren Folgen
- **Wörtliche Zitate (4/4 valid):**
  - ✅ „In der Coronazeit verbreiteten sich mehrere Krankheiten pandemisch unter Politikern: Größenwahn, Kontrollwahn und hypochondrischer Wahn"
  - ✅ „eine Zeit, in der die Würde der Menschen mit Füßen getreten wurde, eine Zeit voller Unmenschlichkeit und Grundrechtseinschränkungen, wie es sie in Deutschland seit 1945 nicht mehr gegeben hat"
  - ✅ „Deswegen brauchen wir keinen Stuhlkreis, sondern einen Untersuchungsausschuss"
  - ✅ „denn wir vergessen nicht. Corona muss aufgearbeitet werden"
- **Framing-Marker:** ddr_stasi_sed, staat_als_totalitaerer_akteur, unrechtsstaat_vergleich
- **Rhetorische Mittel:** Medizinische Metapher (Krankheiten unter Politikern), Aufzählung von Verboten (Anaphora), Hyperbel und emotionale Zuspitzung, Vergleich mit Unrechtsstaat (1945-Referenz), WHO-Zitat als vermeintlicher Beleg, Appellative Adresse an Linke/Grüne mit Koalitionsangebot
- **Konkrete Zahlen:** 300.000 Menschen starben einsam in Krankenhäusern | Zweieinhalb Millionen Impfnebenwirkungen in Deutschland 2021 (laut Sichert) | WHO-Aussage zu Nebenwirkungen 2021 vs. historischer Vergleich seit 1968
- **Anti-Halluzinations-Flags:**
  - H2 (Polemik-Erhalt): MUSS als Kernmerkmal bewahrt werden — der Text ist durchgehend polemisch mit Charakterisierungen von Regierungspolitik als 'Wahnsinn', 'Unmenschlichkeit', 'Unrecht'
  - H3 (Anekdoten): Mehrere konkrete Beispiele (zweijährige Kinder, Bauarbeiter mit Maske in Gluthitze, Großeltern mit Bußgeldern, Parkbank-Verbot) sind charakteristische Polemik-Anker
  - H4 (Vollständigkeit): Drei distinkte Forderungen — beide Untersuchungsausschuss-Varianten (Masken, Corona) aufgenommen
  - VORSICHT: WHO-Zitat und Impfnebenwirkungs-Zahlen werden von Sichert zitiert/behauptet, sind aber fachlich umstritten/falsch. In Summary als Behauptungen Sicherts mit Distanz-Markierung aufgenommen (nicht als Fakten validiert)
- **Zusammenfassung:** Martin Sichert (AfD) vergleicht die Coronapolitik mit einem 'Wahnzustand' von Politikern ('Größenwahn, Kontrollwahn, hypochondrischer Wahn') und zählt polemisch auf: Kontaktverbote für Kleinkinder, Maskenplicht in Gluthitze, Besuchsverbote in Pflegeheimen ('300.000 Menschen starben einsam'), vermeintlich systematische Beatmungen ('Tausende zu Tode'), Impf-Nebenwirkungen (2,5 Millionen 2021 laut seiner Behauptung). Er rahmt dies als 'Grundrechtseinschränkungen wie seit 1945 nicht mehr' und fordert einen Untersuchungsausschuss statt 'Stuhlkreis'; dabei adressiert er Linke und Grüne mit einem Angebot zur gemeinsamen Einrichtung: 'denn wir vergessen nicht'.

---

### ID211601900 — Rainer Groß (AfD)

**Sitzung 16 (2025-07-08)** | Topic: Ich eröffne nun die Aussprache. Wir beginnen mit der allgemeinen Finanzdebatte einschließlich der Einzelpläne 08, 20, 32 und 60 sowie dem Entwurf eines Haushaltsbegleitgesetzes 2025. | Original: 3869 Zeichen | Latenz: 16940ms

#### Original (Auszug)
> Sehr geehrter Herr Präsident! Sehr geehrte Damen und Herren! Liebe junge Leute, die wir hier sehen! Wir sind Zeugen eines epochalen Richtungswechsels, wir erleben die Schuldenwende: Die Staatsschulden explodieren. 1,7 Billionen Euro Bundesschulden produzieren bisher eine Zinslast von 30 Milliarden Euro pro Jahr. Mit diesem Haushalt werden es mindestens 33 Milliarden Euro. Ab 2029 muss der Steuerzahler dann 60 Milliarden Euro pro Jahr für Zinsen tragen, derzeit, wie Herr Middelberg richtig ausführte, zu 2,5 Prozent. Aber Zinsen bleiben nicht immer so, wie sie sind; die können auch steigen. – Da
> _… (3269 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Staatsverschuldung
- **Typ:** debatte
- **Summary:** Rainer Groß fordert eine Konsolidierung der Staatsfinanzen und kritisiert den Schuldenhaushalt. Er warnt vor den Folgen der explodierenden Staatsschulden und fordert eine solide Finanzpolitik.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** A
- **Tonalität:** polemisch
- **Forderungen (8):**
  - Konsolidierung statt Schuldenwachstum — Begrenzung der Staatsneuverschuldung
  - Stromsteuersenkung für alle Bürger
  - Vermögensanreize und Entlastungen zur Stärkung privater Investitionen
  - Abbau von Bürokratie, insbesondere 'grüne Stricke' die Wirtschaft / Bau fesseln
  - Kürzung der Bürgergeld-Ausgaben (kritisiert 43 Mrd Euro bis 2029)
  - Überprüfung der 144 Mrd Euro Handlungsbedarf 2025-2029 auf Einsparungspotenziale
  - Migrationswende mit Fokus auf Kostenreduktion
  - Rückkehr zu 'soliden Finanzen und vernünftiger Wirtschaftspolitik'
- **Wörtliche Zitate (8/8 valid):**
  - ✅ „Wir sind Zeugen eines epochalen Richtungswechsels, wir erleben die Schuldenwende: Die Staatsschulden explodieren."
  - ✅ „Das sind die Fesseln, Herr Bundesfinanzminister, die Sie unserem Land anlegen."
  - ✅ „Schulden machen ist eben keine deutsche Kernkompetenz – beim soliden Sparen sind wir besser."
  - ✅ „Konsolidierung statt Schuldentsunami!"
  - ✅ „Sie verteufeln die USA, tun es ihnen aber gleich."
  - ✅ „Deutschland hat ein Angebotsproblem. Die Wirtschaft, zum Beispiel der Bau, wurde von den grünen Fantasien der Ampel ruiniert."
  - ✅ „Schillers magisches Viereck hatte noch Substanz. Klingbeils Bermudadreieck ist der Einstieg in die völlige Versenkung der Staatsfinanzen."
  - ✅ „Solide Finanzen und vernünftige Wirtschaftspolitik gibt es nur mit uns, der Alternative für Deutschland."
- **Framing-Marker:** schwaebische_hausfrau, chaos_koalition, schuldenunion_warnung
- **Rhetorische Mittel:** Metaphern der Zerstörung ('Schuldenwende', 'Schuldentsunami', 'Fesseln', 'grüne Stricke', 'völlige Versenkung'), Historischer Vergleich (Karl Schiller 1967-1972), Alliteration / Wortspiel ('Schillers magisches Viereck' vs. 'Klingbeils Bermudadreieck'), Anrede an Unions-Abgeordnete als Warnung vor Kompromiss, Direkte Infragestellung der Verfassungskonformität ('rechtlich bedenklich'), Apostroph zu 'jungen Leuten' in der Zuschauer-Galerie
- **Konkrete Zahlen:** 1,7 Billionen Euro Bundesschulden | 30 Milliarden Euro Zinslast pro Jahr aktuell | 33 Milliarden Euro Zinslast mit diesem Haushalt | 60 Milliarden Euro Zinslast ab 2029 | Zinsgesicherung: derzeit nur 7 Jahre (vs. Italien/Frankreich mit längerer Bindung) | 39 Prozent der Steuereinnahmen verbleiben beim Bund | 43 Milliarden Euro Bürgergeld bis 2029 | 144 Milliarden Euro Handlungsbedarf bis 2029 | 60-Prozent-Schuldenquote (Bundesbank-Grenzwert) | 2,5 Prozent Zinssatz aktuell
- **Anti-Halluzinations-Flags:**
  - H1 (Bloch-Klasse): KEIN Erfinden von Investitions-Forderungen — Groß fordert reine Konsolidierung + Abbau ('grüne Stricke') + Entlastungen. Konstruktive Investitions-Programme werden explizit NICHT genannt.
  - H2 (Polemik-Erhalt): Kampfsprache ('Schuldentsunami', 'Fesseln', 'völlige Versenkung', 'Super-GAU') MUSS erhalten bleiben; Zitat-Verifizierung erforderlich für 'Schillers magisches Viereck' vs. 'Klingbeils Bermudadreieck'.
  - H4 (Vollständigkeit): Alle 6 distinkten Forderungs-Cluster enumeriert — Konsolidierung, Stromsteuer, Vermögensanreize, Bürokratie-Abbau, Bürgergeld-Schnitt, Handlungsbedarf-Priorisierung.
  - H6 (Ministerial-Wahrheit): Groß greift auf Bundesbank-Aussage und Sachverständigenrat-Professoren-Zitat zurück — diese sind externe Autoritäten, KEINE erfundenen Positionen.
  - H8 (Zahlenfundament): 10 konkrete Zahlen verankert — Schuldenstand, Zinslasten 30/33/60 Mrd, 7-Jahre-Zinsbin, 39%, 43 Mrd, 144 Mrd, 60%-Grenze, 2,5%.
- **Zusammenfassung:** Rainer Groß (AfD) attackiert den Merz-Haushalt als 'Schuldenwende' und 'Schuldenwaschanlage' ohne Nutzen: 1,7 Bio Euro Bundesschulden häufen sich, die Zinslast explodiert von 30 auf 33 (2025) bis 60 Mrd Euro (2029) an; Deutschland habe nur 7-Jahre-Zinsgesicherung (vs. Italien/Frankreich mit längerer), sei damit europäischer Stabilitätsanker gefährdet und verstoße gegen EU-Fiskalregeln. Groß fordert Konsolidierung, Stromsteuersenkung, Bürgergeld-Kürzung (43 Mrd bis 2029), Bürokratie-Abbau statt Nachfrageschub, und attackiert die Union in einer historischen Vergleich: Karl Schiller (SPD) sei 1967-1972 ob der Schulden-Spirale entnervt zurückgetreten — 'Schillers magisches Viereck war Substanz, Klingbeils Bermudadreieck ist Versenkung'. Schließt mit Wahlaufruf: 'solide Finanzen gibt es nur mit uns'.

---

### ID211000500 — Hanna Steinmüller (BÜNDNIS 90/DIE GRÜNEN)

**Sitzung 10 (2025-06-05)** | Topic: Erste Beratung des von den Fraktionen der CDU/CSU und SPD eingebrachten Entwurfs eines Gesetzes zur Änderung der Regelungen über die zulässige Miethöhe bei Mietbeginn | Original: 4375 Zeichen | Latenz: 16533ms

#### Original (Auszug)
> Frau Präsidentin! Liebe Kolleginnen und Kollegen! Liebe Bürgerinnen und Bürger! Frau Ministerin, Sie haben geschafft, was Marco Buschmann in dreieinhalb Jahren nicht geschafft hat: Sie haben einen Entwurf zur Mietpreisbremsenverlängerung vorgelegt. Dafür als Allererstes herzlichen Dank! Darauf haben wir lange gewartet.
> Zur Wahrheit gehört aber auch: Die Verlängerung der Mietpreisbremse, sie reicht bei Weitem nicht aus; denn wir haben verschiedene Probleme bei der Mietpreisbremse.
> Zum Ersten. Sie ist viel zu unbekannt und wird zu wenig genutzt. Wissenschaftlerinnen und Wissenschaftler der LMU u
> _… (3775 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Verlängerung und Reform der Mietpreisbremse
- **Typ:** debatte
- **Summary:** Hanna Steinmüller begrüßt die Verlängerung der Mietpreisbremse, kritisiert diese jedoch als unzureichend, da sie zu unbekannt ist, zu viele Ausnahmen aufweist und kaum sanktioniert wird. Sie fordert eine umfassende Reform des Mietrechts, einschließlich der Entfristung der Mietpreisbremse sowie strengerer Regeln gegen Umgehungen bei möbliertem Wohnraum und Neubauten.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** D
- **Tonalität:** konfrontativ_belegend
- **Forderungen (11):**
  - Verlängerung der Mietpreisbremse (positiv bewertete Regierungsinitiative)
  - Bessere Kommunikation und Bekanntmachung der Mietpreisbremse — Wissenschaftler der LMU und TU München dokumentieren 25% Anspruchsberechtigung, aber nur 2,4% tatsächliche Nutzung
  - Beseitigung des Transparenzdefizits beim Möblierungszuschlag — Offenlegungspflicht für Möblierungszuschlag und Kaltmiete um facto-Geltung der Mietpreisbremse nachvollziehbar zu machen
  - Vorzug der Ausnahmefrist für Neubau von 2014 (elf Jahre) mindestens auf 2019, aus Grüne-Sicht weiter
  - Schließung von Schlupflöchern bei umfassenden Sanierungen
  - Regulierung von befristeten Mietverträgen ('Wohnen auf Zeit') um Missbrauch zur Umgehung der Mietpreisbremse zu verhindern
  - Verstärkte Sanktionierung: Legal-Tech-Unternehmen Conny dokumentiert 90% Quote bei aktiven Fällen, wo Mietpreisbremse gezogen werden kann; in 80-90% liegt Miete 20%+ über ortsüblicher Vergleichsmiete — Vermieter ohne Angst vor Sanktionen
  - Entfristung der Mietpreisbremse (statt nur Verlängerung)
  - Neuregelung Eigenbedarfskündigung
  - Schärfung Mietwucher-Sanktionen
  - Neuregelung Kappungsgrenzen
- **Wörtliche Zitate (7/7 valid):**
  - ✅ „Sie haben einen Entwurf zur Mietpreisbremsenverlängerung vorgelegt. Dafür als Allererstes herzlichen Dank!"
  - ✅ „Die Verlängerung der Mietpreisbremse, sie reicht bei Weitem nicht aus"
  - ✅ „Die Mietpreisbremse, sie ist löchrig wie ein Schweizer Käse"
  - ✅ „Vermieter versuchen es immer wieder, weil sie keine Angst vor Sanktionen haben"
  - ✅ „Wenn du nicht mehr weiter weißt, gründe einen Arbeitskreis. Weißt du das Ergebnis schon, gründe eine Kommission."
  - ✅ „Wir sind eine Serviceopposition"
  - ✅ „manche hier im Haus haben ja schlechte Erfahrungen mit dem Thema Plagiat gemacht. Das Gute ist: So ein Gesetzentwurf ist keine wissenschaftliche Arbeit. Da können Sie Dinge einfach übernehmen; wir sagen es auch niemandem."
- **Framing-Marker:** fairer_interessenausgleich, rollback_erneuerbare
- **Rhetorische Mittel:** Lob mit Bedingung (Dank + sofort Kritik), Vier-Punkte-Struktur mit Nummerierung ('Zum Ersten', 'Zum Zweiten', usw.), Metapher: 'löchrig wie ein Schweizer Käse', Sachlich-belegte Kritik mit konkreten Quellen (LMU, TU München, Conny), Spöttische Kritik an Regierungs-Prozedur ('Arbeitskreis'-Witz), Humor-Angebot am Ende ('Plagiat'-Witz mit Selbst-Entschuldigung), Direkte Anrede an Koalition mit Konstruktiv-Auftrag ('Nutzen Sie das Faire-Mieten-Gesetz')
- **Konkrete Zahlen:** 10.000 Haushalte in München befragt (LMU/TU München) | 25% berechtigt zur Mietpreisbremse (2.500 Haushalte) | 2,4% tatsächliche Nutzung (240 Mieterin und Mieter) | 11 Jahre seit Gesetzentwurf 2014 — Neubau-Ausnahmefrist zu lang | 90% Quote bei Conny-Fällen wo Mietpreisbremse gezogen werden kann | 80-90% der Fälle: Miete 20%+ über ortsüblicher Vergleichsmiete
- **Anti-Halluzinations-Flags:**
  - H4 (Vollständigkeit): vier klar nummerierte Probleme der Mietpreisbremse ALLE aufgenommen: (1) Unbekanntheit/geringe Nutzung, (2) Ausnahmen/Schlupflöcher, (3) unzureichende Sanktionierung, (4) Befristung
  - H1 (keine erfundenen Forderungen): Grüne fordern KONSTRUKTIVE Reformen (Faire-Mieten-Gesetz mit 6 konkreten Punkten) — das ist Serviceopposition mit eigenen Vorschlägen, NICHT nur Kritik
  - H7 (Ad-hominem mit Distanz): 'Plagiat'-Witz ist humorvoll selbst-distanziert ('schlechte Erfahrungen mit dem Thema Plagiat gemacht') — wird als Rhetorik-Mittel markiert, nicht als Tatsachen-Aussage
- **Zusammenfassung:** Hanna Steinmüller (Grüne) dankt der Regierung für den Entwurf zur Mietpreisbremsenverlängerung, kritisiert dann aber sachlich-belegend die Unzulänglichkeit: vier Probleme — (1) nur 2,4% Nutzungsquote trotz 25% Berechtigung laut LMU/TU München, (2) Schlupflöcher (Möblierung, Neubau, Sanierungen, befristete Verträge) ohne Transparenz, (3) 90% Quote bei Conny zeigt Vermieter-Risikolosigkeit, (4) bloße Befristung statt Entfristung. Sie attackiert die Koalitions-Prozedur als ‚Arbeitskreis-Gründerei' und präsentiert das Grüne Faire-Mieten-Gesetz mit 6 konkreten Reformvorschlägen als ‚Serviceopposition', mit humorvoller Einladung an die Koalition: das Grüne-Gesetz als ‚Plagiat'-Vorlage zu benutzen.

---

### ID211001700 — Dr. Sandra Detzer (BÜNDNIS 90/DIE GRÜNEN)

**Sitzung 10 (2025-06-05)** | Topic: Erste Beratung des von den Abgeordneten Dr. Malte Kaufmann, Leif-Erik Holm, Enrico Komning, weiteren Abgeordneten und der Fraktion der AfD eingebrachten Entwurfs eines Gesetzes zur Abschaffung des Gesetzes über die unternehmerischen Sorgfaltspflichten zur Vermeidung von Menschenrechtsverletzungen in Lieferketten (Lieferkettensorgfaltspflichtenabschaffungsgesetz – LkSAG) | Original: 3376 Zeichen | Latenz: 10888ms

#### Original (Auszug)
> Herzlichen Dank. – Frau Präsidentin! Meine Kolleginnen und Kollegen! Um es auf den Punkt zu bringen: Menschen in Deutschland und Europa wollen T-Shirts kaufen, die ohne Zwangsarbeit und ohne Kinderarbeit hergestellt wurden.
> Diese Transparenz herzustellen, ist Ziel der europäischen Lieferkettengesetzgebung, deren nationale Umsetzung jetzt ansteht. Und dieses Ziel ist richtig, ohne Wenn und Aber; denn Verantwortung stärkt Unternehmen, unsere Werte und Europa.
> Jetzt fragt man sich natürlich: Wie ist eigentlich die Haltung der Bundesregierung zu diesem wichtigen Thema? Vizekanzler Klingbeil sprich
> _… (2776 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Lieferkettengesetzgebung
- **Typ:** erklaerung
- **Summary:** Dr. Sandra Detzer fordert von der Bundesregierung eine klare Haltung zur Umsetzung der europäischen Lieferkettengesetzgebung, die Transparenz über die Herstellung von Produkten ohne Zwangsarbeit und Kinderarbeit herstellen soll. Sie kritisiert die Aussagen des Bundeskanzlers, der sich für die Abschaffung der Richtlinie ausspricht, und betont, dass Verantwortung ein Wettbewerbsvorteil und keine Belastung für Unternehmen sei.

#### Smart-Haiku-Cascade (neu)
**FEHLER:** JSON-Parse: Expected ',' or '}' after property value in JSON at position 3051 (line 38 column 622) | extracted[0..300]: {
  "reden_typ": "D",
  "tonalität": "konfrontativ_belegend",
  "forderungen": [
    "Umsetzung der europäischen Lieferkettensorgfaltspflicht-Richtlinie in nationale Gesetzgebung",
    "Beibehaltung und schnelle Implementierung des Lieferkettensorgfaltspflichtengesetzes (LkSAG) — NICHT Abschaffung",

---

### ID211504100 — Doris Achelwilm (Die Linke)

**Sitzung 15 (2025-06-27)** | Topic: Beratung des Antrags der Fraktion Die Linke | Original: 3283 Zeichen | Latenz: 11194ms

#### Original (Auszug)
> Herr Präsident! Liebe Kolleginnen und Kollegen! Liebe Anwesende! Was wird bei all den Rekordinvestitionen eigentlich gerade für Menschen getan, die jeden Euro umdrehen müssen? Mit dem Abbau der Körperschaftsteuer verschenkt die GroKo Milliarden nach oben, ohne dass zum Beispiel große Beschäftigungseffekte zu erwarten sind. Das Senken der Stromsteuer für Verbraucher/-innen hingegen soll erst mal aufgeschoben werden. Positive Signale gehen gerade nur in eine Richtung. Auf handfeste Bedarfe der Leute wird gerade sehr wenig reagiert. Das ist ein Problem.
> Als Linke wollen wir für Menschen mit niedr
> _… (2683 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Mehrwertsteuersenkung auf Grundbedarfsgüter
- **Typ:** debatte
- **Summary:** Doris Achelwilm fordert die Abschaffung der Mehrwertsteuer auf Grundnahrungsmittel, Monatshygieneartikel sowie Bus und Bahn, um einkommensschwache Haushalte bei der Inflation zu entlasten. Zudem verlangt sie die Einrichtung einer Preisaufsichtsbehörde, um sicherzustellen, dass Steuersenkungen tatsächlich bei den Verbrauchern ankommen und nicht durch Übergewinne der Konzerne aufgezehrt werden.

#### Smart-Haiku-Cascade (neu)
- **Reden-Typ:** G
- **Tonalität:** sozial_anklagend
- **Forderungen (6):**
  - Abschaffung der Mehrwertsteuer auf Lebensmittel
  - Abschaffung der Mehrwertsteuer auf Bus und Bahn (Entlastung etwa 2 Milliarden Euro)
  - Abschaffung der Mehrwertsteuer auf Hygieneprodukte
  - Vollständige Steuerbefreiung für Produkte der Monatshygiene (nicht nur Reduktion auf 7 Prozent)
  - Neudefinition der Steuersätze für Grundnahrungsmittel (Babynahrung von 19% auf niedrigeren Satz, Beseitigung der Vergünstigung für Trüffel)
  - Einführung einer wirksamen Preisaufsichtsbehörde zur Verhinderung von Mitnahmeeffekten und Übergewinnen der Lebensmittelkartelle
- **Wörtliche Zitate (5/5 valid):**
  - ✅ „Was wird bei all den Rekordinvestitionen eigentlich gerade für Menschen getan, die jeden Euro umdrehen müssen?"
  - ✅ „Positive Signale gehen gerade nur in eine Richtung. Auf handfeste Bedarfe der Leute wird gerade sehr wenig reagiert."
  - ✅ „54 Prozent der Eltern im Bürgergeldbezug gezwungen, am eigenen Essen zu sparen"
  - ✅ „Dass zum Beispiel Babynahrung mit vollen 19 Prozent besteuert wird, Tierfutter oder Trüffel wiederum vergünstigt mit 7 Prozent, kann niemand erklären."
  - ✅ „Er ist ein notwendiges Gegengewicht zu Inflation und Frustration."
- **Framing-Marker:** steuergeschenke_besserverdiener, manchesterkapitalismus, generalverdacht_buerokratiemonster
- **Rhetorische Mittel:** Rhetorical question Eröffnung, Empirische Studie als Beleg (Initiative Sanktionsfrei, Helena Kilian-Steinhaus), Konkrete Statistiken (35% Preisanstieg Nahrungsmittel, 26% Umsatzsteuer-Steigerung), Absurditäts-Kontrast (Babynahrung 19% vs. Trüffel 7%), Persönliche Adresse mit Dank an Aktivisten, Anaphora ('Positive Signale gehen gerade nur...')
- **Konkrete Zahlen:** 54 Prozent der Eltern im Bürgergeldbezug müssen am eigenen Essen sparen (Initiative Sanktionsfrei) | Preise für Nahrungsmittel in den letzten 5 Jahren um 35 Prozent gestiegen | Einnahmen aus Umsatzsteuer in den letzten 4 Jahren um 26 Prozent gestiegen | Entlastung ÖPNV-Mehrwertsteuer-Befreiung etwa 2 Milliarden Euro | Mehrwertsteuer Hygieneprodukte 2020 gesenkt von 19 auf 7 Prozent
- **Anti-Halluzinations-Flags:**
  - H4 (Multi-Punkt-Vollständigkeit): alle 6 Forderungen aus dem Antrag enumeriiert — Mehrwertsteuer Lebensmittel, Bus/Bahn, Hygieneprodukte, Neudefinition Steuersätze (Babynahrung/Trüffel), Steuerbefreiung Monatshygiene (nicht nur 7%), Preisaufsichtsbehörde.
  - H8 (Konkrete Zahlen): 54%, 35%, 26%, 2 Mrd, 19%/7%-Kontraste aufgenommen als Anti-Halluzinations-Anker
- **Zusammenfassung:** Doris Achelwilm (Die Linke) legt einen Antrag zur Mehrwertsteuer-Befreiung auf Lebensmittel, Bus/Bahn und Hygieneprodukte vor und rahmt dies als sozialpolitisches Gegengewicht gegen Inflation und Frustration: Menschen mit niedrigen Einkommen zahlen die höchsten Konsumsteuern, Lebensmittelpreise sind in 5 Jahren um 35 Prozent gestiegen, 54 Prozent der Bürgergeld-Eltern sparen am eigenen Essen — während die GroKo Körperschaftsteuer und Stromsteuer senkt. Sie fordert zusätzlich eine wirksame Preisaufsichtsbehörde gegen Mitnahmeeffekte und kritisiert die Absurdität, dass Babynahrung mit 19 Prozent besteuert wird, während Trüffel 7 Prozent zahlt; Monatshygiene sollte komplett steuerfrei werden, nicht nur ermäßigt.

---

### ID212015400 — Vinzenz Glaser (Die Linke)

**Sitzung 20 (2025-09-10)** | Topic: Beratung des Antrags der Bundesregierung | Original: 2763 Zeichen | Latenz: 9542ms

#### Original (Auszug)
> Sehr geehrter Herr Präsident! Sehr geehrte Kolleginnen und Kollegen! Wenn wir auf die Lage im Südsudan blicken, sehen wir ein Land, das trotz über zehn Jahren internationaler Unterstützung und eines Friedensabkommens von 2018 erneut an der Schwelle zum Bürgerkrieg steht.
> Die politische Lage im Südsudan spitzt sich dramatisch zu. Die Spannungen zwischen rivalisierenden Eliten wachsen weiter. Erste Kämpfe zwischen bewaffneten Gruppen haben bereits begonnen. Der Befehlshaber der UNMISS bezeichnete die Lage im Südsudan bereits als Krieg.
> Zur gleichen Zeit zerstört der Klimawandel weiter Lebensgrun
> _… (2163 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Südsudan-Konflikt
- **Typ:** debatte
- **Summary:** Vinzenz Glaser fordert eine ehrliche Bilanz der UN-Mission im Südsudan und kritisiert die Kürzung der humanitären Hilfe durch die Bundesregierung. Er vertritt die Position, dass die Kürzung der Hilfe die Spannungen im Land verschärft und den Friedensprozess gefährdet.

#### Smart-Haiku-Cascade (neu)
**FEHLER:** JSON-Parse: Expected ',' or '}' after property value in JSON at position 2764 (line 38 column 633) | extracted[0..300]: {
  "reden_typ": "D",
  "tonalität": "mahnend_kritisch",
  "forderungen": [
    "Ehrliche und selbstkritische Bilanz der UNMISS-Mission vor Mandatsverlängerung",
    "Erhöhung der humanitären Hilfe für den Südsudan (Rückgängigmachung der über 50-prozentigen Kürzung)",
    "Kopplung von UN-Mandatsver

---

### ID211003100 — Lars Klingbeil [Bundesminister der Finanzen]

**Sitzung 10 (2025-06-05)** | Topic: — | Original: 4520 Zeichen | Latenz: 11962ms

#### Original (Auszug)
> Herr Präsident! Liebe Kolleginnen und Kollegen! Ich glaube, wir alle sind tief geprägt von den Gesprächen, die wir in den letzten Monaten in unseren Wahlkreisen geführt haben: mit Familien, mit Menschen, denen Arbeitsplatzverlust droht, die von großen Unsicherheiten in ihrem Leben geprägt sind, die sich fragen, wie sicher ihr Arbeitsplatz ist, ob sie das Einfamilienhaus weiter abbezahlen und ob sie die Ausbildung oder das Studium der Kinder weiter bezahlen können in diesen wirtschaftlich turbulenten Zeiten. Deswegen, liebe Kolleginnen und Kollegen, war es für die neue Koalition wichtig, dass w
> _… (3920 weitere Zeichen)_

#### Llama-70B (alt) Summary
- **Kontext:** Wirtschaftswachstum und Investitionsprogramm
- **Typ:** regierungserklaerung
- **Summary:** Lars Klingbeil stellt den neuen 'Wachstumsbooster' der Regierung vor, um durch Investitionsanreize, Steuersenkungen und ein 500-Milliarden-Euro-Sondervermögen die Wirtschaft zu stärken. Er fordert zudem ein härteres Vorgehen gegen Kriminelle und bekennt sich zur Förderung der Elektromobilität.

#### Smart-Haiku-Cascade (neu)
**FEHLER:** JSON-Parse: Expected double-quoted property name in JSON at position 3156 (line 48 column 290) | extracted[0..300]: {
  "reden_typ": "H",
  "tonalität": "sachlich_zukunftsorientiert",
  "forderungen": [
    "Wachstumsbooster-Paket zur Sicherung von Arbeitsplätzen und wirtschaftlichem Wachstum",
    "Umwandlung Deutschlands zu modernem, digitalem und klimaneutralem Standort",
    "Senkung von Energiepreisen und Ab

---
