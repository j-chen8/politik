/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Raumordnung, Bau- und Wohnungswesen" (50 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Baurecht / Deregulierung =====
  { aspekt: "Baurecht / Deregulierung", partei: "AfD",
    lang: [
      { text: "Deregulierung: weniger Vorschriften, Abbau von Klima-/Energiestandards für günstigeres und schnelleres Bauen", idx: r(2,4,5,6,7,8,9,10,12,16,18,19,20) },
      { text: "Gegen Sonderbaurecht für Flüchtlingsunterkünfte (§ 246 BauGB)", idx: r(1,17) },
      { text: "Kritik am Bauturbo als ineffektiv und Aushöhlung kommunaler Selbstverwaltung; gegen das überragende öffentliche Interesse", idx: r(0,11,13,14,3,15) },
    ],
    kurz: [
      { text: "Deregulierung und Abbau von Klima-/Energiestandards für günstigeres Bauen; gegen Sonderbaurecht für Flüchtlingsunterkünfte", idx: r(2,4,5,6,7,8,9,10,12,16,18,19,20,1,17) },
      { text: "Kritik am Bauturbo als ineffektiv und Aushöhlung kommunaler Selbstverwaltung", idx: r(0,11,13,14,3,15) },
    ] },
  { aspekt: "Baurecht / Deregulierung", partei: "CDU/CSU",
    lang: [
      { text: "Deregulierung, Bauturbo und schnellere Genehmigungen (Gebäudetyp E, Baunormenbremse) zur Beschleunigung des Wohnungsbaus", idx: r(3,4,5,7,8,9,10,11,12,13,15,16,17,18,19,20) },
      { text: "Baugesetzbuch-Reform gegen Schrottimmobilien; EU-Bauproduktenverordnung; Sonderbaurecht (§ 246) für Geflüchtete behalten; Bahnflächen freigeben", idx: r(2,14,0,6,1) },
    ],
    kurz: [
      { text: "Deregulierung, Bauturbo und schnellere Genehmigungen (Gebäudetyp E) zur Beschleunigung des Wohnungsbaus", idx: r(3,4,5,7,8,9,10,11,12,13,15,16,17,18,19,20) },
      { text: "Baugesetzbuch-Reform gegen Schrottimmobilien; Sonderbaurecht für Geflüchtete behalten; Bahnflächen freigeben", idx: r(2,14,0,6,1) },
    ] },
  { aspekt: "Baurecht / Deregulierung", partei: "GRÜNE",
    lang: [{ text: "Gegen pauschale Deregulierung; differenzierte Planung mit sozialen Quoten und Innenentwicklungsvorrang; gegen Abschwächung der Umweltprüfung", idx: r(1,2,0) }],
    kurz: [{ text: "Gegen pauschale Deregulierung; differenzierte Planung mit sozialen Quoten; Umweltprüfung erhalten", idx: r(1,2,0) }] },
  { aspekt: "Baurecht / Deregulierung", partei: "LINKE",
    lang: [{ text: "Gegen Lockerung des Planungsrechts (Bauturbo); mehr statt weniger Planung und Regulierung zur Umverteilung", idx: r(0,1) }],
    kurz: [{ text: "Gegen Lockerung des Planungsrechts (Bauturbo); mehr Planung und Regulierung", idx: r(0,1) }] },
  { aspekt: "Baurecht / Deregulierung", partei: "SPD",
    lang: [{ text: "Bauturbo, Gebäudetyp E und Bürokratieabbau für schnelleres, kostengünstigeres Bauen (auch Zugang zu Bahnflächen)", idx: r(0,1,2,4,3) }],
    kurz: [{ text: "Bauturbo, Gebäudetyp E und Bürokratieabbau für schnelleres, kostengünstigeres Bauen", idx: r(0,1,2,4,3) }] },

  // ===== Boden- / Vorkaufspolitik =====
  { aspekt: "Boden- / Vorkaufspolitik", partei: "AfD",
    lang: [{ text: "Ablehnung ausgedehnter kommunaler Vorkaufsrechte mit Preiskorrektur", idx: r(0) }],
    kurz: [{ text: "Ablehnung ausgedehnter kommunaler Vorkaufsrechte", idx: r(0) }] },
  { aspekt: "Boden- / Vorkaufspolitik", partei: "CDU/CSU",
    lang: [{ text: "Kommunales Vorkaufsrecht gegen Problemimmobilien stärken, aber gegen überzogene Ausweitung/faktische Enteignung; Kommunen fehlen oft die Mittel", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Kommunales Vorkaufsrecht gegen Problemimmobilien stärken, aber gegen Ausweitung zur Enteignung", idx: r(0,1,2,3,4) }] },
  { aspekt: "Boden- / Vorkaufspolitik", partei: "GRÜNE",
    lang: [{ text: "Kommunale Vorkaufsrechte stärken und ausweiten gegen Bodenspekulation; gemeinwohlorientierte Bodenpolitik zur Senkung der Bodenpreise", idx: r(0,2,3,1) }],
    kurz: [{ text: "Kommunale Vorkaufsrechte stärken/ausweiten gegen Bodenspekulation", idx: r(0,2,3,1) }] },
  { aspekt: "Boden- / Vorkaufspolitik", partei: "LINKE",
    lang: [{ text: "Vorkaufsrechte ausweiten/wiederherstellen gegen Spekulation; Rekommunalisierung in Milieuschutzgebieten", idx: r(0,2,3,1) }],
    kurz: [{ text: "Vorkaufsrechte ausweiten/wiederherstellen gegen Spekulation; Rekommunalisierung", idx: r(0,2,3,1) }] },
  { aspekt: "Boden- / Vorkaufspolitik", partei: "SPD",
    lang: [{ text: "Kommunales Vorkaufsrecht reformieren/wiedereinführen gegen Problemimmobilien (mit finanziellen Mitteln und schnelleren Verfahren)", idx: r(0,1,2) }],
    kurz: [{ text: "Kommunales Vorkaufsrecht reformieren/wiedereinführen gegen Problemimmobilien", idx: r(0,1,2) }] },

  // ===== Eigenbedarfskündigung =====
  { aspekt: "Eigenbedarfskündigung", partei: "AfD",
    lang: [{ text: "Gegen Einschränkung/Sperrfristen bei Eigenbedarfskündigungen als Generalverdacht gegen Vermieter", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Gegen Einschränkung/Sperrfristen bei Eigenbedarfskündigungen", idx: r(0,1,2,3,4) }] },
  { aspekt: "Eigenbedarfskündigung", partei: "CDU/CSU",
    lang: [
      { text: "Gegen Verbot/weitere Einschränkung des Eigenbedarfs (weniger Wohnungsangebot)", idx: r(1,2) },
      { text: "Schutz vor Kündigung bei Mietrückständen als sozialpolitischer Schritt", idx: r(0) },
    ],
    kurz: [{ text: "Gegen Verbot/Einschränkung des Eigenbedarfs; Schutz bei Mietrückständen", idx: r(1,2,0) }] },
  { aspekt: "Eigenbedarfskündigung", partei: "GRÜNE",
    lang: [
      { text: "Eigenbedarfskündigungen einschränken und Kündigungsschutz verbessern gegen Missbrauch", idx: r(1,4,5,6,3) },
      { text: "Fünfjähriger Kündigungsschutz für Mieter, die gegen überhöhte Mieten vorgehen; Kritik am 70+-Ausschluss", idx: r(0,2) },
    ],
    kurz: [
      { text: "Eigenbedarfskündigungen einschränken und Kündigungsschutz verbessern gegen Missbrauch", idx: r(1,4,5,6,3) },
      { text: "Fünfjähriger Kündigungsschutz bei Vorgehen gegen überhöhte Mieten", idx: r(0,2) },
    ] },
  { aspekt: "Eigenbedarfskündigung", partei: "LINKE",
    lang: [{ text: "Kündigungsschutz verschärfen; vorgetäuschten Eigenbedarf verbieten (Missbrauch durch Vermieter)", idx: r(0,1,2,3) }],
    kurz: [{ text: "Kündigungsschutz verschärfen; vorgetäuschten Eigenbedarf verbieten", idx: r(0,1,2,3) }] },
  { aspekt: "Eigenbedarfskündigung", partei: "SPD",
    lang: [{ text: "Unterstützung erweiterter Mieterschutzmechanismen", idx: r(0) }],
    kurz: [{ text: "Erweiterte Mieterschutzmechanismen", idx: r(0) }] },

  // ===== Grundsteuer-Umlage auf Mieter =====
  { aspekt: "Grundsteuer-Umlage auf Mieter", partei: "AfD",
    lang: [{ text: "Gegen die Umlage der Grundsteuer auf Mieter; Forderung nach Abschaffung der Grundsteuer als versteckte Mietersteuer", idx: r(0,1) }],
    kurz: [{ text: "Gegen Umlage auf Mieter; Grundsteuer als versteckte Mietersteuer abschaffen", idx: r(0,1) }] },
  { aspekt: "Grundsteuer-Umlage auf Mieter", partei: "CDU/CSU",
    lang: [{ text: "Ablehnung von Umlagen und zusätzlichen Kostenbelastungen für Vermieter", idx: r(0) }],
    kurz: [{ text: "Ablehnung von Umlagen und zusätzlichen Kostenbelastungen für Vermieter", idx: r(0) }] },
  { aspekt: "Grundsteuer-Umlage auf Mieter", partei: "GRÜNE",
    lang: [{ text: "Umlagefähigkeit (Modernisierungskosten) beschränken statt Abschaffung; gegen AfD-Grundsteuerabschaffung, die Vermögende entlastet", idx: r(0,1,2) }],
    kurz: [{ text: "Umlagefähigkeit (Modernisierungskosten) beschränken statt Abschaffung der Grundsteuer", idx: r(0,1,2) }] },
  { aspekt: "Grundsteuer-Umlage auf Mieter", partei: "LINKE",
    lang: [{ text: "Gegen Umlage auf Mieter (soll Eigentümer treffen); Kritik an asymmetrischer Modernisierungskostenverteilung", idx: r(1,0,2) }],
    kurz: [{ text: "Gegen Umlage auf Mieter (soll Eigentümer treffen)", idx: r(1,0,2) }] },
  { aspekt: "Grundsteuer-Umlage auf Mieter", partei: "SPD",
    lang: [{ text: "Grundsteuer als sozial ausgewogene Steuer verteidigen (gegen AfD-Abschaffung); Schutz vor Kostenbelastung durch Modernisierung", idx: r(0,1) }],
    kurz: [{ text: "Grundsteuer verteidigen (gegen AfD-Abschaffung); Schutz vor Modernisierungskosten", idx: r(0,1) }] },

  // ===== Leerstand =====
  { aspekt: "Leerstand", partei: "AfD",
    lang: [{ text: "Gegen Regulierung von Kurzzeitvermietung und gegen Verstaatlichung; Marktlösung und Vollzug bestehender Gesetze statt Enteignung", idx: r(0,1,2) }],
    kurz: [{ text: "Gegen Regulierung von Kurzzeitvermietung/Verstaatlichung; Marktlösung statt Enteignung", idx: r(0,1,2) }] },
  { aspekt: "Leerstand", partei: "CDU/CSU",
    lang: [
      { text: "Leerstand durch Sanierung, Umnutzung (auch Bahnflächen, ländlicher Raum) und Städtebauförderung bekämpfen", idx: r(1,3,5,6,7) },
      { text: "Zu restriktive Regeln/Kosten für Vermieter führen zu mehr Leerstand; Ablehnung des AfD-Antrags", idx: r(0,4,2) },
    ],
    kurz: [
      { text: "Leerstand durch Sanierung, Umnutzung (auch Bahnflächen) und Städtebauförderung bekämpfen", idx: r(1,3,5,6,7) },
      { text: "Zu restriktive Regeln/Kosten für Vermieter führen zu mehr Leerstand", idx: r(0,4,2) },
    ] },
  { aspekt: "Leerstand", partei: "GRÜNE",
    lang: [
      { text: "Kurzzeitvermietung regulieren (Zweckentfremdungsverbot, Datenaustausch); Büro-/Leerstandsumnutzung zu Wohnraum", idx: r(0,5,3,4) },
      { text: "Schrottimmobilien mit kommunalen Instrumenten bekämpfen; Bebauungsanreiz über Grundsteuer", idx: r(2,6,1,7) },
    ],
    kurz: [
      { text: "Kurzzeitvermietung regulieren; Büro-/Leerstandsumnutzung zu Wohnraum", idx: r(0,5,3,4) },
      { text: "Schrottimmobilien mit kommunalen Instrumenten bekämpfen", idx: r(2,6,1,7) },
    ] },
  { aspekt: "Leerstand", partei: "LINKE",
    lang: [
      { text: "Leerstand aktivieren statt Neubau (Leerstandserfassung/-verbot, Büroumwandlung, Durchgriffsrechte)", idx: r(0,1,3,4,6) },
      { text: "Airbnb hart regulieren; gegen planlose Abrisse funktionaler Infrastruktur", idx: r(2,5) },
    ],
    kurz: [
      { text: "Leerstand aktivieren statt Neubau (Erfassung/Verbot, Büroumwandlung); Airbnb regulieren", idx: r(0,1,3,4,6,2) },
      { text: "Gegen planlose Abrisse funktionaler Infrastruktur", idx: r(5) },
    ] },
  { aspekt: "Leerstand", partei: "SPD",
    lang: [{ text: "Gegen spekulativen Leerstand (Eingriffsrechte, Sanktionen, Städtebauförderung); Kurzzeitvermietung digital erfassen und regulieren", idx: r(0,2,1,3) }],
    kurz: [{ text: "Gegen spekulativen Leerstand (Eingriffsrechte, Städtebauförderung); Kurzzeitvermietung regulieren", idx: r(0,2,1,3) }] },

  // ===== Mietpreisbremse / Mietendeckel =====
  { aspekt: "Mietpreisbremse / Mietendeckel", partei: "AfD",
    lang: [
      { text: "Ablehnung der Mietpreisbremse als ineffektiv, Planwirtschaft und investitionsfeindlich (verschärft den Wohnungsmangel)", idx: r(0,1,2,3,4,5,6,8,9,10,11,12,13,14,15,17) },
      { text: "Gegen Verschärfung der Mietwuchervorschriften (Kriminalisierung von Vermietern)", idx: r(7,16,18) },
    ],
    kurz: [
      { text: "Ablehnung der Mietpreisbremse als ineffektiv und investitionsfeindlich", idx: r(0,1,2,3,4,5,6,8,9,10,11,12,13,14,15,17) },
      { text: "Gegen Verschärfung der Mietwuchervorschriften", idx: r(7,16,18) },
    ] },
  { aspekt: "Mietpreisbremse / Mietendeckel", partei: "CDU/CSU",
    lang: [
      { text: "Befristete Verlängerung der Mietpreisbremse bis 2029 als Übergangsinstrument; gegen permanenten Mietendeckel", idx: r(1,3,4,8,10,6) },
      { text: "Warnung vor Investitionshemmnis bei isolierter Regulierung; gegen Indexmietverbot und Mietwucher-Verschärfung; Sanktionen ausreichend; Flüchtlingsunterkünfte entlasten den Markt", idx: r(0,7,9,5,2) },
    ],
    kurz: [
      { text: "Befristete Verlängerung der Mietpreisbremse bis 2029 als Übergangsinstrument; gegen permanenten Mietendeckel", idx: r(1,3,4,8,10,6) },
      { text: "Warnung vor Investitionshemmnis; gegen Indexmietverbot und Mietwucher-Verschärfung", idx: r(0,7,9,5,2) },
    ] },
  { aspekt: "Mietpreisbremse / Mietendeckel", partei: "GRÜNE",
    lang: [
      { text: "Mietpreisbremse entfristen, bundesweit ausweiten und verschärfen; Schlupflöcher (möblierte Wohnungen) schließen, Sanktionen stärken", idx: r(1,2,3,4,6,8,9,10,0) },
      { text: "Gegen AfD-Ablehnung der Verlängerung; Kritik an Linke-Vorschlägen als unrealistisch", idx: r(7,5) },
    ],
    kurz: [
      { text: "Mietpreisbremse entfristen, bundesweit ausweiten und verschärfen; Schlupflöcher schließen", idx: r(1,2,3,4,6,8,9,10,0) },
      { text: "Gegen AfD-Ablehnung; Kritik an Linke-Vorschlägen als unrealistisch", idx: r(7,5) },
    ] },
  { aspekt: "Mietpreisbremse / Mietendeckel", partei: "LINKE",
    lang: [
      { text: "Bundesweiter Mietendeckel und sechsjähriger Mietenstopp statt unwirksamer Mietpreisbremse", idx: r(0,1,2,3,5,6,7,9,10,12) },
      { text: "Mietwucher schärfer verfolgen und sanktionieren (höhere Bußgelder, erleichterter Nachweis); gegen AfD-Ablehnung", idx: r(8,13,14,4,11) },
    ],
    kurz: [
      { text: "Bundesweiter Mietendeckel und Mietenstopp statt unwirksamer Mietpreisbremse", idx: r(0,1,2,3,5,6,7,9,10,12) },
      { text: "Mietwucher schärfer verfolgen und sanktionieren; gegen AfD-Ablehnung", idx: r(8,13,14,4,11) },
    ] },
  { aspekt: "Mietpreisbremse / Mietendeckel", partei: "SPD",
    lang: [
      { text: "Verlängerung der Mietpreisbremse bis 2029 als zentrales Schutzinstrument gegen Mietsteigerungen", idx: r(0,1,2,3,4,5,7,9,10,11,13,14) },
      { text: "Durchsetzung und Sanktionen stärken; Ausweitung auf möblierte Wohnungen/Kurzzeitvermietung; Indexmieten deckeln", idx: r(6,8,12) },
    ],
    kurz: [
      { text: "Verlängerung der Mietpreisbremse bis 2029 als zentrales Schutzinstrument", idx: r(0,1,2,3,4,5,7,9,10,11,13,14) },
      { text: "Durchsetzung stärken; Ausweitung auf möblierte/Kurzzeitvermietung; Indexmieten deckeln", idx: r(6,8,12) },
    ] },

  // ===== Obdachlosigkeit =====
  { aspekt: "Obdachlosigkeit", partei: "AfD",
    lang: [{ text: "Mehr Wohnraum statt Sonderprogramme; soziale Hilfsangebote statt Verdrängung", idx: r(0,1) }],
    kurz: [{ text: "Mehr Wohnraum statt Sonderprogramme; soziale Hilfsangebote", idx: r(0,1) }] },
  { aspekt: "Obdachlosigkeit", partei: "CDU/CSU",
    lang: [{ text: "Wohnungslosigkeit durch Neubau, spezialisierte Unterstützung (wohnungslose Frauen mit Gewalterfahrung) und Kündigungsschutz in Härtefällen bekämpfen", idx: r(0,1,2) }],
    kurz: [{ text: "Wohnungslosigkeit durch Neubau, spezialisierte Unterstützung und Härtefall-Kündigungsschutz bekämpfen", idx: r(0,1,2) }] },
  { aspekt: "Obdachlosigkeit", partei: "GRÜNE",
    lang: [{ text: "Strategie zur Überwindung der Wohnungslosigkeit bis 2030 (Housing First; Bedarfe wohnungsloser Frauen)", idx: r(0) }],
    kurz: [{ text: "Strategie zur Überwindung der Wohnungslosigkeit bis 2030 (Housing First)", idx: r(0) }] },
  { aspekt: "Obdachlosigkeit", partei: "LINKE",
    lang: [{ text: "Wohnungslosigkeit (ca. 500.000) als Skandal; verbindliche Maßnahmen und Finanzierung, geschlechtergerechte Notunterkünfte; gegen Wohngeldkürzung", idx: r(0,1,2,3) }],
    kurz: [{ text: "Wohnungslosigkeit als Skandal; verbindliche Maßnahmen, geschlechtergerechte Notunterkünfte", idx: r(0,1,2,3) }] },
  { aspekt: "Obdachlosigkeit", partei: "SPD",
    lang: [{ text: "Schonfristzahlung auf ordentliche Kündigungen ausweiten; verdeckte Wohnungslosigkeit von Frauen und frauenspezifische Unterkünfte", idx: r(0,1) }],
    kurz: [{ text: "Schonfristzahlung ausweiten; verdeckte Wohnungslosigkeit von Frauen adressieren", idx: r(0,1) }] },

  // ===== Recht auf Wohnen ins GG =====
  { aspekt: "Recht auf Wohnen ins GG", partei: "LINKE",
    lang: [{ text: "Wohnen als Grundrecht stärken (keine Ware, dem Gebrauchswert dienend); Mietenstopp und Mieterschutz", idx: r(0,1) }],
    kurz: [{ text: "Wohnen als Grundrecht stärken (keine Ware)", idx: r(0,1) }] },
  { aspekt: "Recht auf Wohnen ins GG", partei: "SPD",
    lang: [{ text: "Wohnen als Grundrecht/Menschenrecht anerkennen; aktive Wohnungspolitik und Wohnungskontingente für gefährdete Gruppen", idx: r(0,1,2) }],
    kurz: [{ text: "Wohnen als Grundrecht/Menschenrecht; aktive Wohnungspolitik", idx: r(0,1,2) }] },

  // ===== Sozialer Wohnungsbau =====
  { aspekt: "Sozialer Wohnungsbau", partei: "AfD",
    lang: [
      { text: "Mehr Wohnungsbau durch Deregulierung/Marktmechanismen und Baukostensenkung statt Sonderprogramme", idx: r(0,2,4,5,8,9,10) },
      { text: "Kritik an Zielverfehlung (400.000 Wohnungen); Bahnflächen für Wohnungsbau freigeben", idx: r(3,6,1,7) },
    ],
    kurz: [
      { text: "Mehr Wohnungsbau durch Deregulierung/Marktmechanismen und Baukostensenkung statt Sonderprogramme", idx: r(0,2,4,5,8,9,10) },
      { text: "Kritik an Zielverfehlung; Bahnflächen freigeben", idx: r(3,6,1,7) },
    ] },
  { aspekt: "Sozialer Wohnungsbau", partei: "CDU/CSU",
    lang: [
      { text: "Sozialen Wohnungsbau finanzieren/fördern (23,5 Mrd. € bis 2029), kombiniert mit privaten Investitionen und Wohneigentum", idx: r(0,2,3,4,5,8,10,13,14) },
      { text: "Bahnflächen freigeben; soziale Quoten über städtebauliche Verträge; steuerliche Anreize; ländlicher Raum; Bauen als Kernlösung", idx: r(1,9,6,7,12,11) },
    ],
    kurz: [
      { text: "Sozialen Wohnungsbau finanzieren/fördern (23,5 Mrd. €), kombiniert mit privaten Investitionen und Wohneigentum", idx: r(0,2,3,4,5,8,10,13,14) },
      { text: "Bahnflächen freigeben; soziale Quoten; steuerliche Anreize; ländlicher Raum", idx: r(1,9,6,7,12,11) },
    ] },
  { aspekt: "Sozialer Wohnungsbau", partei: "GRÜNE",
    lang: [{ text: "Bezahlbarkeit statt Neubaufetischismus; verbindliche Quoten (50 % bezahlbar) und Rekommunalisierung; Nachhaltigkeit und faire Arbeitsbedingungen", idx: r(0,1,2,4,3) }],
    kurz: [{ text: "Bezahlbarkeit statt Neubaufetischismus; verbindliche Sozialquoten und Rekommunalisierung", idx: r(0,1,2,4,3) }] },
  { aspekt: "Sozialer Wohnungsbau", partei: "LINKE",
    lang: [
      { text: "Investitionsprogramm für gemeinnützigen, kommunalen sozialen Wohnungsbau; öffentliche Regulierung des Neubaus", idx: r(0,1,4,5,7) },
      { text: "Verbindliche Kontingente für Frauen in Wohnungsnot; gegen AfD-Ablehnung; gegen Plattenbau-Abrisse", idx: r(3,2,6) },
    ],
    kurz: [
      { text: "Investitionsprogramm für gemeinnützigen, kommunalen sozialen Wohnungsbau", idx: r(0,1,4,5,7) },
      { text: "Kontingente für Frauen in Wohnungsnot; gegen AfD-Ablehnung; gegen Plattenbau-Abrisse", idx: r(3,2,6) },
    ] },
  { aspekt: "Sozialer Wohnungsbau", partei: "SPD",
    lang: [
      { text: "Förderung des sozialen Wohnungsbaus erhöhen (Rekordförderung, auch im Bestand)", idx: r(0,1,2,5) },
      { text: "Regionen mit niedrigem Einkommen beachten; Bahnflächen nutzen; Kurzzeitvermietung regulieren", idx: r(3,6,4) },
    ],
    kurz: [
      { text: "Förderung des sozialen Wohnungsbaus erhöhen (Rekordförderung, auch im Bestand)", idx: r(0,1,2,5) },
      { text: "Regionen mit niedrigem Einkommen beachten; Bahnflächen nutzen", idx: r(3,6,4) },
    ] },

  // ===== Studierenden-/WG-Wohnen =====
  { aspekt: "Studierenden-/WG-Wohnen", partei: "CDU/CSU",
    lang: [{ text: "Generationenwohnen als Modell zur Lösung spezieller Wohnungsprobleme (v. a. von Frauen)", idx: r(0) }],
    kurz: [{ text: "Generationenwohnen als Modell für spezielle Wohnungsprobleme", idx: r(0) }] },
  { aspekt: "Studierenden-/WG-Wohnen", partei: "SPD",
    lang: [{ text: "Kritik daran, dass Berufstätige in Studi-WGs bleiben, weil der Umzug in eine eigene Wohnung zum Armutsrisiko wird", idx: r(0) }],
    kurz: [{ text: "Berufstätige in Studi-WGs, weil eigene Wohnung zum Armutsrisiko wird", idx: r(0) }] },

  // ===== Vergesellschaftung großer Vermieter =====
  { aspekt: "Vergesellschaftung großer Vermieter", partei: "AfD",
    lang: [{ text: "Ablehnung von Enteignung und Verstaatlichung als sozialistischer Übergriff auf Privateigentum", idx: r(0,1,2,3) }],
    kurz: [{ text: "Ablehnung von Enteignung und Verstaatlichung als Übergriff auf Privateigentum", idx: r(0,1,2,3) }] },
  { aspekt: "Vergesellschaftung großer Vermieter", partei: "CDU/CSU",
    lang: [{ text: "Ablehnung von Enteignungen als ineffektiv und kontraproduktiv für den Wohnungsneubau", idx: r(0) }],
    kurz: [{ text: "Ablehnung von Enteignungen als kontraproduktiv für den Wohnungsneubau", idx: r(0) }] },
  { aspekt: "Vergesellschaftung großer Vermieter", partei: "LINKE",
    lang: [{ text: "Vergesellschaftung der Bestände von Immobilienspekulanten und Rekommunalisierung; Schlupflöcher für spekulative Geschäftsmodelle schließen", idx: r(0,1,2) }],
    kurz: [{ text: "Vergesellschaftung der Bestände von Spekulanten und Rekommunalisierung", idx: r(0,1,2) }] },

  // ===== Wohneigentum fördern =====
  { aspekt: "Wohneigentum fördern", partei: "AfD",
    lang: [{ text: "Wohneigentum als Altersvorsorge und für junge Familien fördern (Grundsteuer abschaffen); gegen staatliche Eingriffe und die Mietpreisbremse", idx: r(0,1,2,3,4) }],
    kurz: [{ text: "Wohneigentum als Altersvorsorge fördern; gegen staatliche Eingriffe und die Mietpreisbremse", idx: r(0,1,2,3,4) }] },
  { aspekt: "Wohneigentum fördern", partei: "CDU/CSU",
    lang: [{ text: "Wohneigentum fördern (steuerliche Anreize, junge Familien, Einfamilienhäuser, Dachausbau/Einliegerwohnungen) als Teil der Lösung für bezahlbares Wohnen", idx: r(0,1,2,3,4,5,6,7,8) }],
    kurz: [{ text: "Wohneigentum fördern (steuerliche Anreize, junge Familien, Einfamilienhäuser) als Teil der Lösung", idx: r(0,1,2,3,4,5,6,7,8) }] },
  { aspekt: "Wohneigentum fördern", partei: "SPD",
    lang: [{ text: "Wohneigentum in der Heimat ermöglichen; Unterstützung beim Kauf von Bestandsimmobilien", idx: r(0,1) }],
    kurz: [{ text: "Wohneigentum ermöglichen; Unterstützung beim Kauf von Bestandsimmobilien", idx: r(0,1) }] },
];

applySynthese("Raumordnung, Bau- und Wohnungswesen", CELLS);
