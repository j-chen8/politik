/**
 * Kürzt den führenden Redner-Vorspann „<Titel> <Name> (<Ressort/Partei>) " einer
 * Berlin-Reden-Zusammenfassung weg — sonst starten alle Reden derselben Person
 * gleich mit der langen Bezeichnung (z.B. „Senator Christian Gaebler (Senatsverwaltung
 * für Stadtentwicklung, Bauen und Wohnen) verteidigt …"). Der Name steht in der UI
 * ohnehin daneben (Redner-Seite / Sitzungs-Liste / Profil). Cut bis zum ersten „) "
 * im ersten 90-Zeichen-Fenster, danach ggf. führende Satzzeichen + Großschreibung.
 */
export function stripBerlinSpeakerLead(summary: string | null | undefined): string | null {
  if (!summary) return summary ?? null;
  const rel = summary.slice(0, 90).indexOf(") ");
  if (rel === -1) return summary;
  let rest = summary.slice(rel + 2).replace(/^[\s,;:.–-]+/, "");
  if (!rest) return summary;
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}
