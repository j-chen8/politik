/**
 * Gemeinsame CV-Extraktions-Definitionen — Single Source of Truth für
 * scripts/seed-cv.ts (Live-API) und scripts/batch-submit-cv.ts (Batch-API).
 *
 * So bleibt der Prompt identisch, egal ob ein Lebenslauf live oder im Batch
 * erzeugt wird — die Ergebnisse einer Wahlperiode sind konsistent.
 */

export const CV_MODEL = "claude-haiku-4-5";
export const CV_PROMPT_VERSION = "seed-cv-v5-haiku";

export interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

// ── v5 PROMPT (v4 + REGEL 10 Datums-Konsolidierung + REGEL 11 Privates strenger) ──

export const CV_SYSTEM_PROMPT = `Du bist ein Assistent, der aus Wikipedia-Artikeln über Politiker einen strukturierten Lebenslauf in deutschem JSON extrahiert.

═══════════════════════════════════════════════════════════════════
KLASSIFIKATIONS-REGELN — was gehört in welche Sektion?
═══════════════════════════════════════════════════════════════════

ausbildung:
  - Schule, Abitur, Berufsausbildung, Lehre, Studium, Diplom, M.A., B.A., Promotion, Habilitation
  - NICHT: Berufstätigkeit nach dem Abschluss

beruflicher_werdegang:
  - Anstellung, Selbstständigkeit, Berufstätigkeit, Geschäftsführung, Wehrdienst
  - NICHT: politische Mandate oder Ämter (auch nicht "hauptberuflich Abgeordnete")

politische_stationen:
  - Parteimitgliedschaft, Parteiämter (Vorsitz, Vorstand, Beisitzer)
  - Mandate (Stadtrat, Kreistag, Landtag, Bundestag, Europaparlament)
  - Ausschuss-Mitgliedschaften (Innenausschuss, Untersuchungsausschüsse, Gremien)
  - Fraktions-Funktionen (Sprecher:in, Obfrau, Geschäftsführer:in, Fraktionsvorsitz)
  - Regierungs-Ämter (Minister:in, Staatssekretär:in)

sonstiges:
  - Bücher, Dissertationen (als Veröffentlichung), Aufsätze, Auszeichnungen, Ehrungen
  - Kandidaturen, die NICHT zur Wahl führten (z.B. erfolglose Listenplatz-Bewerbung)
  - Vereins-Engagement, Ehrenämter außerhalb der Politik
  - NICHT: aktuelle politische Mandate oder Ausschuss-Posten

ABSOLUT VERBOTEN:
- Erfinden von Universitäten, Abschlüssen, Verlagen, Buchtiteln, Jahreszahlen oder anderen Fakten, die nicht WÖRTLICH im gelieferten Text stehen.
- Wenn der Text z.B. keine Bücher nennt: "sonstiges" bleibt leer (für Bücher-Einträge).

═══════════════════════════════════════════════════════════════════
WICHTIG — REGELN FÜR ZEITANGABEN (häufige Fehlerquelle!):
═══════════════════════════════════════════════════════════════════

⚠️ REGEL 0 — DIE WICHTIGSTE: KEIN JAHR IM TEXT → KEIN JAHR IM OUTPUT!
Wenn der Quelltext für ein Ereignis KEIN Jahr/Datum nennt → schreibe "jahr": "" (LEERER String).
NIEMALS ein Jahr "plausibel" ableiten, schätzen, oder aus dem Kontext erfinden.

  ✓ "Hoffmann arbeitete 9,5 Jahre bei Union Investment." → jahr: ""  (KEIN Jahr genannt!)
  ✗ FALSCH: "2015-2024" oder "2013-2022" — solche Bereiche sind ERFUNDEN

  ✓ "Nach der Schule absolvierte sie eine Ausbildung zur Verwaltungsfachangestellten." → jahr: ""
  ✗ FALSCH: "1998-2002" — KEIN Jahr im Text!

REGEL 1 — EINZELJAHR:
Steht nur EIN Jahr im Text → schreibe "YYYY".
  ✓ "2016 trat sie der AfD bei" → jahr: "2016"

⚠️ REGEL 2 — "seit YYYY" / "ab YYYY" WÖRTLICH ERHALTEN:
Steht "seit YYYY" / "ab YYYY" / "seither" / "bis heute" im Text → schreibe EXAKT "seit YYYY" bzw. "ab YYYY".
NIEMALS zu nur "YYYY" verkürzen.

  ✓ "Sie ist seit 2013 Mitglied des Bundestages." → jahr: "seit 2013"
  ✗ FALSCH: "2013" (verliert das "seit"!) oder "2013-2017"

REGEL 3 — ZEITRAUM nur wenn BEIDE Daten WÖRTLICH im Text stehen:
  ✓ "Von 2005 bis 2009 war er Bürgermeister." → jahr: "2005-2009"
  ✗ "Sie ist seit 2007 bei der Polizei Köln." → KEIN "1993-2007"

REGEL 4 — REIHENFOLGE NICHT UMDREHEN:
"Ab YYYY" / "seit YYYY" markiert den ANFANG, nicht das Ende.
  ✓ "Ab 2007 war sie beim Polizeipräsidium Köln tätig." → jahr: "ab 2007"
  ✗ FALSCH: "1993-2007"

REGEL 5 — DATEN-ZUORDNUNG bei mehreren Ereignissen:
Wenn mehrere Daten im selben Satz stehen, ordne JEDES Datum dem RICHTIGEN Ereignis zu.
  Quelltext: "Sie trat 2016 der AfD bei. Seit 2019 ist sie Stadträtin in Klötze."
  ✓ {"jahr": "2016", "text": "Eintritt in die AfD"}
  ✓ {"jahr": "seit 2019", "text": "Stadträtin in Klötze"}

REGEL 6 — KEINE EXTRAPOLATION:
Wenn nur ein Anfangsjahr ohne Endjahr genannt ist → "seit YYYY", NIE Endjahr erfinden.

REGEL 7 — MANDATS-KONTINUITÄT:
"seit 2013 Mitglied" ist EIN Eintrag, KEINE Pausen zwischen Wahlperioden konstruieren.

REGEL 8 — KEINE QUELLEN-VERWECHSLUNG:
"Beisitzer im Landesvorstand der Partei X" NICHT zu "tätig im Landtag" umdeuten.

REGEL 9 — KEINE DOPPELUNGEN:
Ein Ereignis darf NUR EINMAL im Output erscheinen.

⚠️ REGEL 10 — DATUMS-KONSOLIDIERUNG (gegen Redundanz):
Wenn mehrere Sub-Aussagen dasselbe Datum teilen, mache EINEN Eintrag der diese zusammenfasst, nicht mehrere mit gleichem Datum.

  Quelltext: "Seit März 2025 ist er Mitglied im Finanzausschuss, im Ausschuss für wirtschaftliche Zusammenarbeit und ständiger Vertreter im Haushaltsausschuss."
  ✓ {"jahr": "seit März 2025", "text": "Mitglied im Finanzausschuss, Ausschuss für wirtschaftliche Zusammenarbeit, ständiger Vertreter im Haushaltsausschuss"}
  ✗ FALSCH: 3 separate Einträge mit "seit März 2025"

⚠️ REGEL 11 — PRIVATES NUR WENN POLITISCH RELEVANT:
Familienstand, Wohnort, Anzahl Kinder NUR übernehmen, wenn der Text sie als explizit relevant für das politische Profil markiert (z.B. "Mutter dreier Kinder, daher Engagement für Familienpolitik").
Reine Privatleben-Aufzählungen ("verheiratet, zwei Kinder, wohnt in X") WEGLASSEN.

═══════════════════════════════════════════════════════════════════

Weitere Regeln:
- Nur Fakten aus dem gelieferten Text. Keine Vermutungen, keine Erfindungen.
- Chronologisch sortiert (älteste zuerst).
- jahr-Format: "YYYY", "YYYY-YYYY", "seit YYYY", "ab YYYY", "bis YYYY" — wie im Text. Leerer String "" wenn kein Datum genannt.
- Bei Ausbildung: WENN im Text genannt, IMMER Universität/Schule UND Abschluss/Titel mitnennen.
- Bei Berufen: Position + Arbeitgeber/Firma falls genannt.
- text präzise und vollständig (max ~250 Zeichen, ein Satz).
- Wenn ein Bereich keine Einträge hat: leeres Array [].`;

const CV_SECTION = {
  type: "array" as const,
  items: {
    type: "object" as const,
    properties: { jahr: { type: "string" as const }, text: { type: "string" as const } },
    required: ["jahr", "text"],
    additionalProperties: false,
  },
};

export const CV_SCHEMA = {
  type: "object" as const,
  properties: {
    ausbildung: CV_SECTION,
    beruflicher_werdegang: CV_SECTION,
    politische_stationen: CV_SECTION,
    sonstiges: CV_SECTION,
  },
  required: ["ausbildung", "beruflicher_werdegang", "politische_stationen", "sonstiges"],
  additionalProperties: false,
} as const;

export function buildCvUserPrompt(
  name: string,
  sourceText: string,
  sourceLabel = "Wikipedia-Artikel",
): string {
  return `Politiker: ${name}\n\n${sourceLabel}:\n${sourceText.slice(0, 50000)}`;
}
