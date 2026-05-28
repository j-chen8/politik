/**
 * Hardcoded Claude-Opus-Goldstandard-Versionen ausgewählter TOP-Synthesen
 * zum Side-by-Side-Vergleich mit Haiku-v4-Output.
 *
 * Eingabe ist IDENTISCH zu Haikus Eingabe (zusammenfassung_2_saetze + konkrete_zahlen +
 * forderungen pro Rede) — d. h. KEIN Volltext-Vorsprung. Differenzen zeigen Modell-Gap,
 * NICHT Daten-Gap.
 *
 * Sobald Haiku-v4 konsistent diese Qualität trifft, wird diese Datei gelöscht.
 */

import type { KeyFact } from "@/lib/db";

export interface ClaudeGoldEntry {
  key_facts: KeyFact[];
}

const GOLD: Record<string, ClaudeGoldEntry> = {
  // Sitzung 85 · TOP 1 · Aktuelle Stunde (1. Mai 2026-Bilanz, 9 Wortbeiträge).
  // Reden-Reihenfolge: 1 Matz (SPD), 2 Franco (GRÜNE), 3 Wapler (GRÜNE), 4 Eralp (LINKE),
  // 5 Weiß (AfD), 6 Bertram (AfD), 7 Bertram (AfD), 8 Bertram (AfD), 9 Spranger (SPD-Senat).
  "85::1::Aktuelle Stunde": {
    key_facts: [
      {
        text: "Der 1. Mai 2026 verlief mit 5.300 Polizeikräften, 87 Festnahmen und 15 verletzten Polizeibeamten — die Koalition wertet das als Erfolg der Berliner Deeskalationsstrategie.",
        refs: [1, 9],
      },
      {
        text: "Die AfD widerspricht der Erfolgserzählung mit eigenen Zahlen: Strafverfahren stiegen von 39 (2024) auf 121 (2026) — eine Verdreifachung, die der Senat in seiner Bilanz nicht thematisiere.",
        refs: [5],
      },
      {
        text: "Müllbilanz: 350 Kubikmeter Hinterlassenschaften (fast doppelt so viel wie 2025) wurden von 170 BSR-Mitarbeitern mit über 70 Fahrzeugen eingesammelt — Senatorin Spranger appelliert an Feiernde, Verpackungen selbst mitzunehmen.",
        refs: [6, 9],
      },
      {
        text: "GRÜNE und LINKE nutzen die Aktuelle Stunde für breitere Sozialkritik: LINKE-Sprecherin Eralp nennt Vonovias 1 Mrd. Euro Aktionärsausschüttung, kritisiert Wohngeld-Kürzungen und fordert die Ablösung von Regierendem Bürgermeister Wegner.",
        refs: [3, 4],
      },
      {
        text: "Die AfD fordert in drei Wortbeiträgen Nulltoleranzpolitik, sofortige Bußgelder und eine restriktivere Auslegung des Versammlungsrechts — DJ-Pult-Partys sollten nicht mehr als politische Demonstrationen genehmigt werden.",
        refs: [6, 7, 8],
      },
    ],
  },
};

export function getClaudeGold(
  sitzungNr: number,
  marker: string,
  titel: string,
): ClaudeGoldEntry | null {
  return GOLD[`${sitzungNr}::${marker}::${titel}`] ?? null;
}
