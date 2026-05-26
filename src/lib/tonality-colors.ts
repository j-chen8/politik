// Zentrale Farb-Palette pro Tonalitäts-Slug (Methodologie v2.1).
// Genutzt von <TonalityBadge/> und überall, wo Tonalitäts-Badges
// gerendert werden — vorher waren diese Maps in 3+ Files dupliziert.

export const TONALITY_COLORS: Record<string, { color: string; bg: string }> = {
  sachlich: { color: "#374151", bg: "#f3f4f6" },
  polemisch: { color: "#b91c1c", bg: "#fee2e2" },
  polemisch_sachlich: { color: "#9a3412", bg: "#ffedd5" },
  emotional_persoenlich: { color: "#7c3aed", bg: "#ede9fe" },
  konfrontativ_faktenrhetorisch: { color: "#1d4ed8", bg: "#dbeafe" },
  ironisch_jugendlich: { color: "#a16207", bg: "#fef3c7" },
  bilanzierend_werbend: { color: "#15803d", bg: "#dcfce7" },
  staatsmaennisch: { color: "#1e40af", bg: "#dbeafe" },
  defensiv_pragmatisch: { color: "#475569", bg: "#f1f5f9" },
  sozial_anklagend: { color: "#be185d", bg: "#fce7f3" },
  mahnend: { color: "#854d0e", bg: "#fef9c3" },
};
