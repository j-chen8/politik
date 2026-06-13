/**
 * Zerlegt amtliche Tagesordnungspunkt-Titel aus dem Plenarprotokoll-TOC in
 * Beratungsstufe + Kern-Titel, damit Listen nicht mit Verfahrens-Prosa
 * („Erste Beratung des von den Abgeordneten … eingebrachten Entwurfs eines
 * Gesetzes zur …") zulaufen.
 *
 * Zwei Fälle:
 * 1. Gesetzentwurf-Lesungen: Kern steckt im Titel selbst — Genitiv-Phrase
 *    („… Entwurfs eines Dritten Gesetzes zur …") wird in den Nominativ
 *    gehoben („Drittes Gesetz zur …").
 * 2. Anträge/Große Anfragen/Beschlussempfehlungen: der TOC-Titel endet oft
 *    nur mit dem Einbringer („… und der Fraktion der AfD") und trägt den
 *    Inhalt gar nicht — dann übernimmt der Titel der verknüpften Drucksache
 *    (dip_ds_titles ist seit dem Titel-Backfill vollständig).
 *
 * Unbekannte Muster bleiben unverändert (kein Informationsverlust).
 */

export interface SplitTopTitle {
  /** z. B. "Erste Beratung", "Antrag" — null, wenn der Titel nicht zerlegbar ist. */
  stufe: string | null;
  kern: string;
}

const LESUNG =
  /^((?:Erste|Zweite und dritte|Zweite|Dritte|Vierte)\s+Beratung(?:\s+und\s+Schlussabstimmung)?)\s+des\s+(?:vo[nm]\s[\s\S]*?\s+)?(?:eingebrachten\s+)?Entwurfs\s+eines\s+([\s\S]+)$/;

/** „Dritten Gesetzes zur X" → „Drittes Gesetz zur X"; greift nur auf das Kopf-Substantiv. */
function genitivZuNominativ(genitiv: string): string {
  const m = genitiv.match(/^((?:\S+\s+){0,4}?)Gesetzes\b([\s\S]*)$/);
  if (!m) return genitiv;
  const adjektive = m[1]
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/en$/, "es"))
    .join(" ");
  return `${adjektive ? `${adjektive} ` : ""}Gesetz${m[2]}`;
}

export function splitTopTitle(title: string, dsTitel?: string | null): SplitTopTitle {
  const t = title.replace(/^[\s–—-]+/, "").trim();

  const lesung = t.match(LESUNG);
  if (lesung) return { stufe: lesung[1], kern: genitivZuNominativ(lesung[2]) };

  // Einbringer-Prosa ohne Inhalt → Drucksachen-Titel, falls vorhanden.
  if (dsTitel) {
    if (/^Beratung\s+des\s+Antrags\b/.test(t)) return { stufe: "Antrag", kern: dsTitel };
    if (/^Beratung\s+der\s+Beschlussempfehlung\b/.test(t))
      return { stufe: "Beschlussempfehlung", kern: dsTitel };
    if (/^Beratung\s+der\s+Antwort\s+der\s+Bundesregierung\s+auf\s+die\s+Große\s+Anfrage\b/.test(t))
      return { stufe: "Große Anfrage", kern: dsTitel };
  }

  return { stufe: null, kern: t };
}
