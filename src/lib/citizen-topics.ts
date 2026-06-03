/**
 * Bürger-Themen-Frontdoor — editorische Konfiguration ("Was bewegt Deutschland").
 *
 * Sichtbare, menschlich benannte Ebene ÜBER dem AW-Politikfeld-Skelett. Jede
 * Kachel mappt auf eine oder mehrere EXAKTE `aw_field`-Werte aus `item_topics`
 * (die linkbare, klassifizierte Einheit). Reihenfolge nach Umfrage-Salienz-TIER
 * (Bürger-Perspektive), NICHT nach rohem Volumen — rohes Volumen = wer am meisten
 * *einbringt* (z. B. Oppositions-Anträge), nicht parlamentarische Priorität.
 *
 * Salienz-Tiers sind trianguliert über mehrere Umfragen — Herleitung + Quellen:
 * docs/umfrage-salienz.md. KEINE fragilen Einzel-Prozentzahlen (volatil +
 * methodenabhängig). "Rente" und "Inflation" haben kein eigenes aw_field
 * (in Soziale Sicherung bzw. Wirtschaft aufgegangen) → Divergenz-Analyse (Schicht 2),
 * nicht als eigene Kachel.
 */

export type Tier = "sehr hoch" | "hoch" | "mittel-hoch" | "mittel" | "niedrig";

export const TIER_ORDER: Tier[] = ["sehr hoch", "hoch", "mittel-hoch", "mittel", "niedrig"];

/** Neutrale, abgestufte Badge-Stile (kein rot=schlecht/grün=gut — nur Intensität). */
export const TIER_STYLE: Record<Tier, string> = {
  "sehr hoch": "bg-[#1a3e72] text-white",
  hoch: "bg-[#1a3e72]/12 text-[#1a3e72]",
  "mittel-hoch": "bg-zinc-200 text-zinc-700",
  mittel: "bg-zinc-100 text-zinc-600",
  niedrig: "bg-zinc-50 text-zinc-400 ring-1 ring-inset ring-zinc-200",
};

export interface CitizenTopic {
  slug: string;
  label: string;
  blurb: string;
  /** Entweder exakte aw_field-Werte aus item_topics … */
  awFields?: string[];
  /** … ODER Stichwörter (thema-Tag/Zusammenfassung) für Themen ohne eigenes
   *  aw_field (z. B. Rente, Krieg — sind eigene Umfrage-Kategorien). */
  themaMatch?: string[];
  /** Original-Umfrage-Begriff(e), aus denen die Salienz stammt — für Transparenz. */
  surveyTerm?: string;
  tier: Tier;
  /** Optionaler Zusatz, z. B. Trend. */
  flag?: string;
}

/**
 * Featured-Shortlist — die "wichtigsten" Themen fürs Cover (nicht alle 28 Felder).
 *
 * REIHENFOLGE = Umfrage-Salienz, absteigend (Bürger-Perspektive). Array-Reihenfolge
 * IST die Anzeige-Reihenfolge: die Seite sortiert NUR nach Tier (stabil), wodurch
 * die hier gewählte Within-Tier-Ordnung erhalten bleibt. Within-Tier-Reihenfolge
 * folgt der Umfrage-Salienz (NICHT dem Parlaments-Volumen) — z. B. Soziale Sicherung
 * vor Verteidigung, weil Armut/Ungleichheit in vorgegebenen Umfragen oben steht
 * (Ipsos #1, 36 %). Wo offene/vorgegebene Umfragen sich uneinig sind, dient die
 * vorgegebene-Liste-Salienz als Tiebreaker (Begründung: docs/umfrage-salienz.md).
 */
export const CITIZEN_TOPICS: CitizenTopic[] = [
  // ── sehr hoch ──────────────────────────────────────────────────────────
  {
    slug: "wirtschaft-preise",
    label: "Wirtschaft",


    blurb: "Wirtschaftslage, Inflation und Lebenshaltungskosten — in allen Umfragen ganz oben.",
    awFields: ["Wirtschaft", "Außenwirtschaft"],
    surveyTerm: "Wirtschaftslage & Kosten/Löhne/Preise",
    tier: "sehr hoch",
  },
  // ── hoch ───────────────────────────────────────────────────────────────
  {
    slug: "migration-asyl",
    label: "Migration",


    blurb: "Zuwanderung und Aufenthaltsrecht — über die Wahlperiode die zweithäufigste Sorge, zuletzt aber deutlich gefallen.",
    awFields: ["Migration und Aufenthaltsrecht"],
    surveyTerm: "Zuwanderung / Einwanderung",
    tier: "hoch",
    flag: "zuletzt rückläufig",
  },
  {
    slug: "soziale-sicherung",
    label: "Soziales",


    blurb: "Armut, soziale Ungleichheit und soziale Sicherung — Spitzensorge in vorgegebenen Umfragen.",
    awFields: ["Soziale Sicherung", "Gesellschaftspolitik, soziale Gruppen"],
    surveyTerm: "Soziales Gefälle / Armut und soziale Ungleichheit",
    tier: "hoch",
  },
  {
    slug: "krieg-konflikte",
    label: "Krieg",


    blurb: "Krieg in der Ukraine, Nahost und andere militärische Konflikte zwischen Staaten.",
    themaMatch: ["Ukraine", "Russland", "Gaza", "Nahost", "Hamas", "Selenskyj"],
    surveyTerm: "Ukraine/Krieg/Russland / Militärische Konflikte",
    tier: "hoch",
    flag: "Ukraine-Sorge zuletzt gefallen",
  },
  {
    slug: "verteidigung-bundeswehr",
    label: "Verteidigung",


    blurb: "Bundeswehr, Aufrüstung und Verteidigungsfähigkeit.",
    awFields: ["Verteidigung"],
    surveyTerm: "Bundeswehr/Verteidigung",
    tier: "hoch",
  },
  // ── mittel-hoch ──────────────────────────────────────────────────────────
  {
    slug: "innere-sicherheit",
    label: "Innere Sicherheit",

    blurb: "Kriminalität, Polizei und Extremismus.",
    awFields: ["Innere Sicherheit"],
    surveyTerm: "Kriminalität und Gewalt / Extremismus",
    tier: "mittel-hoch",
  },
  {
    slug: "gesundheit-pflege",
    label: "Gesundheit",


    blurb: "Krankenversicherung, Krankenhäuser und Pflege.",
    awFields: ["Gesundheit"],
    surveyTerm: "Gesundheitswesen, Pflege",
    tier: "mittel-hoch",
  },
  {
    slug: "rente",
    label: "Rente",


    blurb: "Gesetzliche Rente, Rentenniveau und Alterssicherung.",
    themaMatch: ["Rente"],
    surveyTerm: "Renten",
    tier: "mittel-hoch",
  },
  // ── mittel ───────────────────────────────────────────────────────────────
  {
    slug: "steuern-finanzen",
    label: "Steuern",


    blurb: "Haushalt, Steuern und Abgaben — größtes Initiativ-Volumen im Bundestag.",
    awFields: ["Öffentliche Finanzen, Steuern und Abgaben"],
    surveyTerm: "Steuern (Ipsos)",
    tier: "mittel",
  },
  {
    slug: "klima-umwelt",
    label: "Klima",


    blurb: "Klimaschutz, Natur und Umwelt.",
    awFields: ["Umwelt"],
    surveyTerm: "Klima / Energie / Klimawandel",
    tier: "mittel",
  },
  {
    slug: "energie",
    label: "Energie",

    blurb: "Strom- und Gaspreise, Energiewende und Versorgung.",
    awFields: ["Energie"],
    surveyTerm: "Teil von Klima / Energie",
    tier: "mittel",
  },
  {
    slug: "arbeit-loehne",
    label: "Arbeit",

    blurb: "Arbeitsmarkt, Mindestlohn und Beschäftigung.",
    awFields: ["Arbeit und Beschäftigung"],
    surveyTerm: "Arbeitslosigkeit",
    tier: "mittel",
  },
  // ── niedrig (keine eigene Umfrage-Kategorie — in keiner genutzten Umfrage eine
  //    Top-Sorge-Kategorie; aufgenommen wegen Wiedererkennbarkeit als Alltags-Thema) ──
  {
    slug: "verkehr-mobilitaet",
    label: "Verkehr",

    blurb: "Bahn, Auto, ÖPNV und Verkehrsinfrastruktur.",
    awFields: ["Verkehr"],
    tier: "niedrig",
  },
  {
    slug: "digitales-datenschutz",
    label: "Digitales",


    blurb: "Digitalisierung, Internet, IT-Sicherheit und Datenschutz.",
    awFields: ["Medien, Kommunikation und Informationstechnik"],
    tier: "niedrig",
  },
  {
    slug: "bildung",
    label: "Bildung",

    blurb: "Schule, Hochschule und Ausbildung.",
    awFields: ["Bildung und Erziehung"],
    tier: "niedrig",
  },
  {
    slug: "wohnen-bau",
    label: "Wohnen",


    blurb: "Mieten, Bauen und Stadtentwicklung — im Bund klein, vor allem Länder-/Kommunalsache.",
    awFields: ["Raumordnung, Bau- und Wohnungswesen"],
    tier: "niedrig",
  },
  {
    slug: "recht-justiz",
    label: "Recht",


    blurb: "Gesetze, Justiz, Strafrecht und Rechtsstaat — großes Gesetzgebungs-Volumen.",
    awFields: ["Recht"],
    tier: "niedrig",
  },
  {
    slug: "staat-verwaltung",
    label: "Verwaltung",


    blurb: "Verwaltung, Bürokratie und Behörden.",
    awFields: ["Staat und Verwaltung"],
    tier: "niedrig",
  },
  {
    slug: "aussenpolitik-europa",
    label: "Außenpolitik",

    blurb: "Diplomatie, internationale Beziehungen und die Europäische Union.",
    awFields: ["Außenpolitik und internationale Beziehungen", "Europapolitik und Europäische Union"],
    tier: "niedrig",
  },
  {
    slug: "landwirtschaft",
    label: "Landwirtschaft",

    blurb: "Landwirtschaft, Ernährung und ländlicher Raum.",
    awFields: ["Landwirtschaft und Ernährung"],
    tier: "niedrig",
  },
  // Catch-all: Long Tail, damit 100 % der Themen erreichbar sind (nichts versteckt)
  {
    slug: "weitere-themen",
    label: "Weitere Themen",

    blurb: "Parteien & Wahlrecht, Wissenschaft & Forschung, Entwicklungspolitik, Kultur, Sport und Parlamentsinternes.",
    awFields: [
      "Politisches Leben, Parteien",
      "Wissenschaft, Forschung und Technologie",
      "Entwicklungspolitik",
      "Kultur",
      "Sport, Freizeit und Tourismus",
      "Neue Bundesländer",
      "Bundestag",
    ],
    tier: "niedrig",
  },
];

export const SALIENCE_SOURCE =
  "Salienz-Einstufung über die gesamte Wahlperiode (nicht ein einzelner Monat): Politbarometer periodengemittelt (offene Frage, 21 Wellen Apr 2025–Mai 2026), ergänzt um Eurobarometer & Ipsos-Sorgenbarometer (vorgegebene Listen). Methodik & Quellen: docs/umfrage-salienz.md.";

export function topicBySlug(slug: string): CitizenTopic | undefined {
  return CITIZEN_TOPICS.find((t) => t.slug === slug);
}

/**
 * Visuals für die farbigen „Browse"-Kacheln (Spotify-Pattern). Farben sind
 * REIN ÄSTHETISCH vergeben — bewusst KEINE Partei-Farben, KEIN Alarm-Rot auf
 * aufgeladenen Themen (Neutralität: Farbe darf nicht etikettieren). Icon-Name =
 * lucide-react-Export (Auflösung in TopicCard).
 */
export const TOPIC_VISUAL: Record<string, { color: string; icon: string }> = {
  "wirtschaft-preise": { color: "#44948e", icon: "TrendingUp" },
  "migration-asyl": { color: "#667fb0", icon: "Users" },
  "soziale-sicherung": { color: "#bb6895", icon: "HeartHandshake" },
  "krieg-konflikte": { color: "#778397", icon: "Swords" },
  "verteidigung-bundeswehr": { color: "#698fa8", icon: "Shield" },
  "innere-sicherheit": { color: "#8c7fc5", icon: "ShieldAlert" },
  "gesundheit-pflege": { color: "#c57769", icon: "HeartPulse" },
  rente: { color: "#a48d66", icon: "PiggyBank" },
  "steuern-finanzen": { color: "#5d9a78", icon: "Landmark" },
  "klima-umwelt": { color: "#72a468", icon: "Leaf" },
  energie: { color: "#cea45b", icon: "Zap" },
  "arbeit-loehne": { color: "#b07a5e", icon: "Briefcase" },
  "verkehr-mobilitaet": { color: "#5c9aa4", icon: "TrainFront" },
  "digitales-datenschutz": { color: "#7e82c1", icon: "Cpu" },
  "recht-justiz": { color: "#8d7ea4", icon: "Scale" },
  "staat-verwaltung": { color: "#7e8c97", icon: "Building2" },
  "aussenpolitik-europa": { color: "#698fb5", icon: "Globe" },
  landwirtschaft: { color: "#8f975f", icon: "Wheat" },
  bildung: { color: "#c1975b", icon: "GraduationCap" },
  "wohnen-bau": { color: "#a48c77", icon: "Home" },
  "weitere-themen": { color: "#8c919c", icon: "LayoutGrid" },
};

/**
 * Grobe Fraktions-Klassifikation für die Divergenz-Entzerrung (21. Bundestag:
 * Koalition = CDU/CSU + SPD; Opposition = AfD, Grüne, Linke). "Regierung" =
 * Bundesregierung/-rat/-ministerien; "ohne" = keine Fraktionsangabe.
 */
export type FraktionBucket = "Opposition" | "Koalition" | "Regierung" | "ohne Angabe";

export function classifyFraktion(f: string | null): FraktionBucket {
  if (!f || !f.trim()) return "ohne Angabe";
  const s = f.toLowerCase();
  if (s.includes("afd") || s.includes("linke") || s.includes("grüne") || s.includes("grünen")) return "Opposition";
  if (s.includes("bundesregierung") || s.includes("bundesrat") || s.includes("bundesministerium")) return "Regierung";
  if (s.includes("cdu/csu") || s.includes("spd")) return "Koalition";
  return "ohne Angabe";
}

/** Aggregiert eine Fraktions-Aufschlüsselung in die vier Buckets + Gesamtsumme. */
export function bucketizeBreakdown(
  rows: { fraktion: string | null; n: number }[],
): { buckets: Record<FraktionBucket, number>; total: number } {
  const buckets: Record<FraktionBucket, number> = {
    Opposition: 0,
    Koalition: 0,
    Regierung: 0,
    "ohne Angabe": 0,
  };
  let total = 0;
  for (const r of rows) {
    buckets[classifyFraktion(r.fraktion)] += r.n;
    total += r.n;
  }
  return { buckets, total };
}
