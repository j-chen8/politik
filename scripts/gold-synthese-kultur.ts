/** MANUELLE Gold-Synthese (Claude Code, kein LLM) — Feld "Kultur" (26 Zellen). */
import { applySynthese, Cell, r } from "./_lib/gold-synthese-apply";

const CELLS: Cell[] = [
  // ===== Erinnerungskultur =====
  { aspekt: "Erinnerungskultur", partei: "AfD",
    lang: [
      { text: "Kriegsgräberpflege und Gedenken an alle Gefallenen unabhängig von der Herkunft; höhere Finanzierung der Kriegsgräberstätten", idx: r(1,3,4) },
      { text: "Gegen ideologische Umdeutung, Denk- und Sprechverbote und selektive Erinnerung (Bismarck-Zimmer); Migrationsgesellschaft verändert die Erinnerungskultur", idx: r(2,5,6,0) },
    ],
    kurz: [
      { text: "Kriegsgräberpflege und Gedenken an alle Gefallenen; höhere Finanzierung", idx: r(1,3,4) },
      { text: "Gegen ideologische Umdeutung und Denkverbote in der Erinnerungskultur", idx: r(2,5,6,0) },
    ] },
  { aspekt: "Erinnerungskultur", partei: "CDU/CSU",
    lang: [
      { text: "Gedenkort für polnische Opfer (Krolloper, Deutsch-Polnisches Haus) als Zeichen historischer Verantwortung und Aussöhnung", idx: r(0,1,9) },
      { text: "Kriegsgräberfürsorge und Volksbund als Versöhnungs- und Bildungsarbeit (Nie wieder!)", idx: r(2,4,6,8) },
      { text: "Gedenkstätten gegen NS- und SED-Verbrechen stärken und Orte der Demokratiegeschichte als pädagogisches Erbe", idx: r(3,5,7,10) },
    ],
    kurz: [
      { text: "Gedenkort für polnische Opfer als historische Verantwortung; Kriegsgräberfürsorge als Versöhnungsarbeit", idx: r(0,1,9,2,4,6,8) },
      { text: "Gedenkstätten gegen NS- und SED-Verbrechen und Orte der Demokratiegeschichte stärken", idx: r(3,5,7,10) },
    ] },
  { aspekt: "Erinnerungskultur", partei: "GRÜNE",
    lang: [{ text: "Gedenkorte und Mahnmale für NS-Verbrechen und polnische Opfer; Kriegsgräberpflege; Kolonialverbrechen als dritte Säule der Erinnerungskultur", idx: r(0,1,2) }],
    kurz: [{ text: "Gedenkorte für NS-Verbrechen; Kolonialverbrechen als dritte Säule der Erinnerungskultur", idx: r(0,1,2) }] },
  { aspekt: "Erinnerungskultur", partei: "LINKE",
    lang: [
      { text: "Demokratiegeschichte (1848) stärken; gegen ideologische Verengung von rechts; Kolonialverbrechen als dritte Säule der Gedenkstättenkonzeption", idx: r(0,1,2) },
      { text: "Authentische Gedenkorte mit Begegnung statt ritualisierter Zeremonien; gegen Gleichsetzung von Opfern und Tätern bei der Kriegsgräberfürsorge", idx: r(3,4) },
    ],
    kurz: [
      { text: "Demokratiegeschichte stärken; Kolonialverbrechen als dritte Säule der Gedenkstättenkonzeption", idx: r(0,1,2) },
      { text: "Authentische Gedenkorte mit Begegnung; gegen Gleichsetzung von Opfern und Tätern", idx: r(3,4) },
    ] },
  { aspekt: "Erinnerungskultur", partei: "SPD",
    lang: [
      { text: "Gedenkarbeit als zentral für das Demokratieverständnis (moralischer Imperativ); Gedenkstättenkonsens zur Singularität des Holocaust und DDR-Aufarbeitung", idx: r(0,1,4,2) },
      { text: "Kriegsgräberfürsorge und Bildungsarbeit des Volksbundes; Versöhnung mit Polen aus historischer Verantwortung", idx: r(3,5,6) },
    ],
    kurz: [
      { text: "Gedenkarbeit für das Demokratieverständnis; Gedenkstättenkonsens (Holocaust, DDR-Aufarbeitung)", idx: r(0,1,4,2) },
      { text: "Kriegsgräberfürsorge des Volksbundes; Versöhnung mit Polen", idx: r(3,5,6) },
    ] },

  // ===== Kultur als Staatsziel (GG) =====
  { aspekt: "Kultur als Staatsziel (GG)", partei: "AfD",
    lang: [{ text: "Nationales Kulturgut als staatliche Verantwortung bewahren; gegen die Förderung als verfassungsfeindlich bewerteter Verlage", idx: r(0,1) }],
    kurz: [{ text: "Nationales Kulturgut bewahren; gegen Förderung verfassungsfeindlicher Verlage", idx: r(0,1) }] },
  { aspekt: "Kultur als Staatsziel (GG)", partei: "CDU/CSU",
    lang: [
      { text: "Kultur als identitätsstiftendes Gut bewahren (Kulturgutschutzgesetz); Kunstfreiheit, allein durch das Strafrecht begrenzt", idx: r(2,6,3,4) },
      { text: "Nationale Symbole und Demokratiegeschichte; Kinos als Kulturorte; kleine unabhängige Verlage unterstützen", idx: r(0,1,5) },
    ],
    kurz: [
      { text: "Kultur als identitätsstiftendes Gut bewahren; Kunstfreiheit, nur durch das Strafrecht begrenzt", idx: r(2,6,3,4) },
      { text: "Nationale Symbole und Demokratiegeschichte; Kinos und kleine Verlage unterstützen", idx: r(0,1,5) },
    ] },
  { aspekt: "Kultur als Staatsziel (GG)", partei: "GRÜNE",
    lang: [{ text: "Kultur als fundamentales Gut, das Freiheit und demokratische Werte verkörpert, für alle Bevölkerungsgruppen", idx: r(0) }],
    kurz: [{ text: "Kultur als fundamentales Gut der Freiheit für alle Bevölkerungsgruppen", idx: r(0) }] },
  { aspekt: "Kultur als Staatsziel (GG)", partei: "LINKE",
    lang: [{ text: "Unabhängigkeit und Vielfalt von Kultureinrichtungen und Verlagen gegen Instrumentalisierung und Druck von rechts verteidigen", idx: r(0) }],
    kurz: [{ text: "Unabhängigkeit und Vielfalt der Kultur gegen Druck von rechts verteidigen", idx: r(0) }] },
  { aspekt: "Kultur als Staatsziel (GG)", partei: "SPD",
    lang: [{ text: "Schutz von Kulturgut und kulturellem Erbe als Rechtsstaatsaufgabe; künstlerische Freiheit gegen ideologische Eingriffe; Deutscher Verlagspreis", idx: r(0,1,2) }],
    kurz: [{ text: "Schutz von Kulturgut als Rechtsstaatsaufgabe; künstlerische Freiheit gegen ideologische Eingriffe", idx: r(0,1,2) }] },

  // ===== Restitution / koloniales Erbe =====
  { aspekt: "Restitution / koloniales Erbe", partei: "AfD",
    lang: [{ text: "Symmetrische Restitution (auch Rückgabe deutschen Kulturguts) statt einseitiger postkolonialer Rückgabeforderungen; Kritik am Kulturgutschutzgesetz", idx: r(0,1,2) }],
    kurz: [{ text: "Symmetrische Restitution statt einseitiger postkolonialer Rückgabeforderungen", idx: r(0,1,2) }] },
  { aspekt: "Restitution / koloniales Erbe", partei: "CDU/CSU",
    lang: [{ text: "Rückgabe identitätsstiftender Kulturgüter an Polen als Aussöhnung; Kulturgutschutz bei ermöglichtem internationalen Austausch; Aufarbeitung deutscher Verbrechen in Afrika", idx: r(0,1,2,3) }],
    kurz: [{ text: "Rückgabe von Kulturgütern an Polen als Aussöhnung; Kulturgutschutz; Aufarbeitung in Afrika", idx: r(0,1,2,3) }] },
  { aspekt: "Restitution / koloniales Erbe", partei: "GRÜNE",
    lang: [{ text: "Verantwortung für Kolonialismus anerkennen (nicht relativieren); Kolonialverbrechen als eigenständige Säule der Erinnerungskultur", idx: r(0,1) }],
    kurz: [{ text: "Kolonialverantwortung anerkennen; Kolonialverbrechen als eigenständige Säule", idx: r(0,1) }] },
  { aspekt: "Restitution / koloniales Erbe", partei: "LINKE",
    lang: [{ text: "Wirksames Restitutionsgesetz für NS-Raubkunst; Aufarbeitung deutscher Kolonialverbrechen und Verankerung in der Gedenkstättenkonzeption", idx: r(0,1) }],
    kurz: [{ text: "Restitutionsgesetz für NS-Raubkunst; Aufarbeitung der Kolonialverbrechen", idx: r(0,1) }] },
  { aspekt: "Restitution / koloniales Erbe", partei: "SPD",
    lang: [{ text: "Modernisierung der Rückgabe- und Schutzregelungen (Kulturgutschutzgesetz) nach europäischen Standards; Kolonialismus in die Gedenkpolitik einbeziehen (eigenständiges Konzept)", idx: r(0,1,2,3) }],
    kurz: [{ text: "Rückgabe- und Schutzregelungen modernisieren; Kolonialismus in die Gedenkpolitik einbeziehen", idx: r(0,1,2,3) }] },

  // ===== Film- / Games-Förderung =====
  { aspekt: "Film- / Games-Förderung", partei: "AfD",
    lang: [{ text: "Kritik an ideologischer, diversitätsorientierter Filmförderung und an Korruption/Verschwendung; künstlerische Freiheit statt politischer Lenkung; Rückzahlung bei Verstößen", idx: r(0,1,2,3) }],
    kurz: [{ text: "Kritik an ideologischer Filmförderung und Verschwendung; künstlerische Freiheit statt Lenkung", idx: r(0,1,2,3) }] },
  { aspekt: "Film- / Games-Förderung", partei: "CDU/CSU",
    lang: [{ text: "Filmförderung verdoppeln (250 Mio. €) und Streaming-Anreize zur internationalen Wettbewerbsfähigkeit; freiwillige Selbstverpflichtung statt gesetzlicher Regulierung; Kinos als Kulturorte", idx: r(0,1,2) }],
    kurz: [{ text: "Filmförderung verdoppeln (250 Mio. €) und Streaming-Anreize; freiwillige Selbstverpflichtung statt Gesetz", idx: r(0,1,2) }] },
  { aspekt: "Film- / Games-Förderung", partei: "GRÜNE",
    lang: [{ text: "Verbindliche gesetzliche Investitionsverpflichtung für Streamingdienste, Steuererleichterungen und Erhalt des Zukunftsprogramms Kino", idx: r(0,1) }],
    kurz: [{ text: "Verbindliche Investitionsverpflichtung für Streamingdienste; Zukunftsprogramm Kino erhalten", idx: r(0,1) }] },
  { aspekt: "Film- / Games-Förderung", partei: "LINKE",
    lang: [{ text: "Gesetzliche Investitionsverpflichtung für Streamingdienste und verbindliche Diversitätsquoten statt freiwilliger Selbstverpflichtung; strukturelle Verlagsförderung statt Preisen", idx: r(0,1) }],
    kurz: [{ text: "Gesetzliche Investitionsverpflichtung für Streamer und Diversitätsquoten statt Freiwilligkeit", idx: r(0,1) }] },
  { aspekt: "Film- / Games-Förderung", partei: "SPD",
    lang: [{ text: "Verlässliche steuerliche Anreize und gesetzliche Investitionspflicht für Streamer; Erhöhung der Fördermittel auf 250 Mio. €", idx: r(0,1) }],
    kurz: [{ text: "Steuerliche Anreize und gesetzliche Investitionspflicht für Streamer; 250 Mio. € Förderung", idx: r(0,1) }] },

  // ===== Soziale Lage der Künstler:innen =====
  { aspekt: "Soziale Lage der Künstler:innen", partei: "LINKE",
    lang: [{ text: "Gerechte Direktvergütung für Musikstreaming und bessere Arbeitsbedingungen; existenzbedrohende Lage von Filmschaffenden", idx: r(0,1) }],
    kurz: [{ text: "Gerechte Direktvergütung für Musikstreaming; existenzbedrohende Lage von Filmschaffenden", idx: r(0,1) }] },
  { aspekt: "Soziale Lage der Künstler:innen", partei: "SPD",
    lang: [{ text: "Wirtschaftliche Bedrängung kleiner und unabhängiger Verlage; unsichere Lage von Filmschaffenden durch wegbrechende Aufträge", idx: r(0,1) }],
    kurz: [{ text: "Wirtschaftliche Bedrängung kleiner Verlage; unsichere Lage von Filmschaffenden", idx: r(0,1) }] },

  // ===== KI / Urheberrecht =====
  { aspekt: "KI / Urheberrecht", partei: "GRÜNE",
    lang: [{ text: "Kritik an ungezügelter KI-Entwicklung als Herausforderung für die Buchbranche", idx: r(0) }],
    kurz: [{ text: "Ungezügelte KI-Entwicklung als Herausforderung für die Buchbranche", idx: r(0) }] },
  { aspekt: "KI / Urheberrecht", partei: "SPD",
    lang: [{ text: "Warnung vor existenzieller Bedrohung kleiner und unabhängiger Verlage durch die KI-Entwicklung", idx: r(0) }],
    kurz: [{ text: "KI-Entwicklung als existenzielle Bedrohung kleiner Verlage", idx: r(0) }] },

  // ===== Deutsche Sprache / Leitkultur =====
  { aspekt: "Deutsche Sprache / Leitkultur", partei: "AfD",
    lang: [{ text: "Verteidigung der traditionellen Sprache gegen ideologische Umgestaltung (gegen die Bevölkerungsmehrheit)", idx: r(0) }],
    kurz: [{ text: "Verteidigung der traditionellen Sprache gegen ideologische Umgestaltung", idx: r(0) }] },

  // ===== Gendersprache =====
  { aspekt: "Gendersprache", partei: "AfD",
    lang: [{ text: "Ablehnung von Gendersternchen als Sprachverhunzung und Kritik an deren Durchsetzung in der Kulturszene", idx: r(0) }],
    kurz: [{ text: "Ablehnung von Gendersternchen als Sprachverhunzung", idx: r(0) }] },
];

applySynthese("Kultur", CELLS);
