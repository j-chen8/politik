/**
 * Politik-Glossar: bürgerverständliche Definitionen politik-spezifischer Begriffe.
 * Genutzt von <GlossarTerm/> (inline hover-preview) und /design/linear/glossar.
 */

export interface PolitikGlossarEntry {
  slug: string;        // URL-Anker und ID
  term: string;        // Display-Form
  short: string;       // 1-2 Sätze Definition
  example?: string;    // Optional konkretes Beispiel
  related?: string[];  // Slugs verwandter Begriffe
  category: "struktur" | "personen" | "dokument" | "verfahren";
}

export const POLITIK_GLOSSAR: PolitikGlossarEntry[] = [
  // Strukturen
  {
    slug: "bundestag",
    term: "Bundestag",
    short: "Direkt gewähltes Verfassungsorgan des Bundes. Verabschiedet Gesetze, wählt die Bundeskanzler:in und kontrolliert die Bundesregierung. Aktuell 630 Abgeordnete.",
    related: ["bundesrat", "fraktion", "mdb"],
    category: "struktur",
  },
  {
    slug: "bundesrat",
    term: "Bundesrat",
    short: "Vertretung der 16 Bundesländer auf Bundesebene. Wirkt bei Gesetzgebung mit, insbesondere bei zustimmungspflichtigen Gesetzen. NICHT identisch mit dem Bundestag.",
    related: ["bundestag"],
    category: "struktur",
  },
  {
    slug: "wahlperiode",
    term: "Wahlperiode",
    short: "Zeitraum zwischen zwei Bundestagswahlen, üblicherweise vier Jahre. Drucksachen werden nach Wahlperiode gezählt — am Anfang einer neuen Wahlperiode beginnt die Zählung wieder bei 1.",
    example: "Die 21. Wahlperiode startete nach der Bundestagswahl 2025.",
    related: ["drucksache", "bundestag"],
    category: "struktur",
  },
  {
    slug: "fraktion",
    term: "Fraktion",
    short: "Zusammenschluss von mindestens 5 % der Bundestags-Abgeordneten derselben Partei. Hat besondere parlamentarische Rechte (z.B. eigene Anträge stellen). Aktuell: CDU/CSU, SPD, AfD, Grüne, Linke, BSW.",
    related: ["mdb", "bundestag"],
    category: "struktur",
  },
  {
    slug: "ausschuss",
    term: "Ausschuss",
    short: "Fachlich spezialisierte Arbeitsgruppe des Bundestages (z.B. Haushaltsausschuss, Innenausschuss). Berät Drucksachen vor der Plenarberatung und erarbeitet Beschlussempfehlungen.",
    related: ["beschlussempfehlung", "plenum"],
    category: "struktur",
  },
  {
    slug: "plenum",
    term: "Plenum",
    short: "Vollversammlung aller Bundestags-Abgeordneten im Plenarsaal. Hier finden Reden, Debatten und Abstimmungen statt.",
    related: ["lesung", "namentliche-abstimmung"],
    category: "struktur",
  },

  // Personen
  {
    slug: "mdb",
    term: "MdB",
    short: "Mitglied des Bundestages — eine:r der 630 direkt oder über Liste gewählten Abgeordneten. Hat freies Mandat (Art. 38 GG): keiner Weisung unterworfen.",
    related: ["fraktion", "bundestag"],
    category: "personen",
  },
  {
    slug: "bundesregierung",
    term: "Bundesregierung",
    short: "Die Exekutive auf Bundesebene: Bundeskanzler:in und die Bundesminister:innen. Antwortet auf Kleine und Große Anfragen, bringt Gesetzentwürfe ein, vertritt Deutschland nach außen.",
    related: ["antwort-bundesregierung", "gesetzentwurf"],
    category: "personen",
  },
  {
    slug: "mitzeichner",
    term: "Mitzeichner:in",
    short: "Abgeordnete, die einen Antrag, eine Anfrage oder einen Gesetzentwurf zusammen mit den Initiatoren einbringen. Bei Gruppenanträgen Träger der politischen Initiative.",
    example: "Bei einer interfraktionellen Kleinen Anfrage zeichnen Abgeordnete mehrerer Fraktionen mit.",
    related: ["antrag", "kleine-anfrage"],
    category: "personen",
  },
  {
    slug: "berichterstatter",
    term: "Berichterstatter:in",
    short: "Vom Ausschuss benannte Abgeordnete, die dem Bundestag die Beratungen und die Beschlussempfehlung des Ausschusses präsentieren. Üblicherweise stellt jede Fraktion eine:n Berichterstatter:in — die Rolle ist eine formale Aufgabe der parlamentarischen Arbeit, KEINE inhaltliche Zustimmung zur Empfehlung. Berichterstatter:innen können in der nachfolgenden Abstimmung sehr wohl gegen die Empfehlung ihres eigenen Ausschusses stimmen.",
    example: "Eine Beschlussempfehlung des Landwirtschaftsausschusses zur Ablehnung eines Antrags der Grünen wird auch von einem grünen Berichterstatter mit-präsentiert — die Grüne Fraktion stimmt in der Abstimmung trotzdem dagegen, weil sie die Ablehnung ihres eigenen Antrags ablehnt.",
    related: ["beschlussempfehlung", "ausschuss", "bericht"],
    category: "personen",
  },

  // Dokumente
  {
    slug: "drucksache",
    term: "Drucksache",
    short: "Offizielles Dokument des Deutschen Bundestages. Wird zu jedem Antrag, Gesetzentwurf, jeder Anfrage oder jedem Bericht ausgegeben. Aktenzeichen: Wahlperiode/laufende Nummer.",
    example: "„21/3250\" = 3.250. Drucksache der 21. Wahlperiode.",
    related: ["wahlperiode", "kleine-anfrage", "gesetzentwurf"],
    category: "dokument",
  },
  {
    slug: "kleine-anfrage",
    term: "Kleine Anfrage",
    short: "Schriftliche Anfrage einer Fraktion an die Bundesregierung. Wird schriftlich beantwortet — ohne Aussprache im Plenum. Dient der Kontrolle der Regierung und der Information.",
    example: "Antwort kommt typischerweise nach 2-4 Wochen als eigene Drucksache zurück.",
    related: ["grosse-anfrage", "antwort-bundesregierung", "drucksache"],
    category: "dokument",
  },
  {
    slug: "grosse-anfrage",
    term: "Große Anfrage",
    short: "Wie die Kleine Anfrage eine schriftliche Anfrage an die Bundesregierung — ABER mit Aussprache im Plenum. Wird seltener gestellt, behandelt umfassendere Themen.",
    related: ["kleine-anfrage", "antwort-bundesregierung"],
    category: "dokument",
  },
  {
    slug: "antrag",
    term: "Antrag",
    short: "Initiative einer Fraktion oder Abgeordneten-Gruppe, eine Position zu fassen oder die Regierung zu etwas aufzufordern. Wird im Plenum diskutiert und abgestimmt — anders als ein Gesetzentwurf ändert er keine Rechtslage direkt.",
    related: ["gesetzentwurf", "entschliessungsantrag"],
    category: "dokument",
  },
  {
    slug: "entschliessungsantrag",
    term: "Entschließungsantrag",
    short: "Antrag, mit dem der Bundestag eine politische Position zum Ausdruck bringt — oft begleitend zu einem Gesetzentwurf. Hat keinen direkten Gesetzeskraft, aber politische Signalwirkung.",
    related: ["antrag", "gesetzentwurf"],
    category: "dokument",
  },
  {
    slug: "gesetzentwurf",
    term: "Gesetzentwurf",
    short: "Vorschlag für ein neues Gesetz oder die Änderung eines bestehenden. Kann von der Bundesregierung, einer Fraktion oder dem Bundesrat eingebracht werden. Durchläuft drei Lesungen vor der Schlussabstimmung.",
    related: ["lesung", "namentliche-abstimmung"],
    category: "dokument",
  },
  {
    slug: "antwort-bundesregierung",
    term: "Antwort der Bundesregierung",
    short: "Schriftliche Reaktion der Bundesregierung auf eine Kleine oder Große Anfrage. Erscheint als eigene Drucksache und referenziert die ursprüngliche Anfrage.",
    related: ["kleine-anfrage", "grosse-anfrage", "bundesregierung"],
    category: "dokument",
  },
  {
    slug: "unterrichtung",
    term: "Unterrichtung",
    short: "Bericht der Bundesregierung oder einer anderen Stelle an den Bundestag. Häufig regelmäßige Berichte (Armuts- und Reichtumsbericht, Subventionsbericht etc.) zur Information des Parlaments.",
    related: ["bericht", "bundesregierung"],
    category: "dokument",
  },
  {
    slug: "bericht",
    term: "Bericht",
    short: "Schriftliche Darstellung von Befunden, oft im Auftrag des Bundestages oder gemäß Gesetz erstellt. Wird im Plenum oder Ausschuss behandelt.",
    related: ["unterrichtung"],
    category: "dokument",
  },
  {
    slug: "beschlussempfehlung",
    term: "Beschlussempfehlung",
    short: "Empfehlung eines Ausschusses an das Plenum, wie über eine Drucksache abgestimmt werden soll. Der federführende Ausschuss erarbeitet sie nach Beratung.",
    related: ["ausschuss"],
    category: "dokument",
  },

  // Verfahren
  {
    slug: "lesung",
    term: "Lesung",
    short: "Beratungsschritt zu einem Gesetzentwurf im Plenum. Erste Lesung = Vorstellung; Zweite Lesung = Detail-Debatte + Ausschuss-Beratung; Dritte Lesung = Schlussabstimmung.",
    related: ["gesetzentwurf", "namentliche-abstimmung"],
    category: "verfahren",
  },
  {
    slug: "namentliche-abstimmung",
    term: "Namentliche Abstimmung",
    short: "Abstimmung im Plenum, bei der jede:r Abgeordnete einzeln namentlich erfasst wird (Ja / Nein / Enthaltung / nicht teilgenommen). Pro Wahlperiode finden nur einige Dutzend statt — auf Antrag einer Fraktion oder von 5 % der MdB, meist bei politisch wichtigen oder kontroversen Entscheidungen. Ermöglicht öffentliche Nachvollziehbarkeit des Stimmverhaltens.",
    related: ["plenum", "gesetzentwurf", "handzeichen-abstimmung"],
    category: "verfahren",
  },
  {
    slug: "handzeichen-abstimmung",
    term: "Abstimmung per Handzeichen",
    short: "Standard-Abstimmungsverfahren im Plenum: Bundestagspräsident:in ruft auf, MdB heben für Ja / Nein / Enthaltung die Hand. Das Präsidium ermittelt das Aggregat-Ergebnis — wer wie gestimmt hat, wird NICHT protokolliert. Wird für die große Mehrheit aller Beschlüsse verwendet; nur bei besonders bedeutenden Themen verlangt eine Fraktion eine namentliche Abstimmung.",
    related: ["namentliche-abstimmung", "plenum"],
    category: "verfahren",
  },
  {
    slug: "ueberweisung",
    term: "Überweisung",
    short: "Verfahrensschritt, bei dem eine Drucksache nach der ersten Lesung im Plenum an einen oder mehrere Ausschüsse zur detaillierten Beratung weitergegeben wird. Eine überwiesene Drucksache ist NICHT entschieden — sie wartet noch auf die Ausschuss-Beratung und die spätere Schlussabstimmung im Plenum.",
    related: ["ausschuss", "beschlussempfehlung", "lesung"],
    category: "verfahren",
  },
];

export const POLITIK_GLOSSAR_MAP = Object.fromEntries(
  POLITIK_GLOSSAR.map((e) => [e.slug, e]),
) as Record<string, PolitikGlossarEntry>;
