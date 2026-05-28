// Berlin-Reden: LLM-Drift-Aliase auf kanonische Methodology-Werte mappen.
// In der Berlin-Reden-DB existieren Tonalitäts-Werte, die das Modell trotz
// JSON-Schema-Enum erfunden hat. Die UI-Badge-Lookup-Maps kennen nur die
// 11 kanonischen Werte aus docs/summarization-methodology-berlin.md §5.
//
// Verteilung der Drifts (Stand 2026-05-26):
//   konfrontativ_faktenrhetorisch  1.942  → konfrontativ_belegend
//   sachlich_polemisch                 7  → polemisch_sachlich
//   social_anklagend                   7  → sozial_anklagend  (Typo)
//   ironic_jugendlich                  1  → ironisch_jugendlich (Typo)
//
// Bewusst nicht gemappt (mehrdeutig, insgesamt 8 Reden):
//   sachlich_anklagend, sachlich_anklagend_hybrid,
//   sachlich_konfrontativ, sachlich_pragmatisch
// Diese rendern weiter ohne Badge — transparent statt geraten.

const BERLIN_TONALITY_ALIASES: Record<string, string> = {
  konfrontativ_faktenrhetorisch: "konfrontativ_belegend",
  sachlich_polemisch: "polemisch_sachlich",
  social_anklagend: "sozial_anklagend",
  ironic_jugendlich: "ironisch_jugendlich",
};

export function resolveBerlinTonality(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return BERLIN_TONALITY_ALIASES[raw] ?? raw;
}
