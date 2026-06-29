/**
 * Leichte deutsche Text-Ähnlichkeit (Token + Trigramm) für die Salienz-Pipeline.
 * Geteilt von Story-Threading (Tage verketten) und Mail-„neu?"-Erkennung (inhaltlich,
 * unabhängig von der instabilen cluster_id). €0, deterministisch.
 */
const SPEC_LEN = 5; // ein gemeinsames Token ab dieser Länge gilt als "spezifisch" → trägt einen Treffer allein

// Generische Wörter, die allein keinen Bezug begründen (sonst klebt alles "in Deutschland").
// BEWUSST nur Geo/Institutions-/Zahl-Füllwörter — KEINE Themenwörter (debatte/streit bleiben Signal).
export const GENERIC = new Set("deutschland deutsche deutschen bundestag bundesregierung berlin regierung politik politische jahr jahre prozent millionen milliarden".split(" "));
export const STOP = new Set("der die das und in im für von mit zu auf ist am den des dem ein eine nach bei aus über als auch wie wird werden vor gegen mehr um".split(" "));

export function tokens(s: string): Set<string> {
  return new Set(
    s.toLowerCase().normalize("NFC").replace(/[^a-zäöüß0-9 ]/g, " ").split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w) && !GENERIC.has(w))
  );
}

function trigrams(w: string): Set<string> { const g = new Set<string>(); const p = `  ${w} `; for (let i = 0; i < p.length - 2; i++) g.add(p.slice(i, i + 3)); return g; }
function triJac(a: Set<string>, b: Set<string>): number { let inter = 0; for (const x of a) if (b.has(x)) inter++; const uni = a.size + b.size - inter; return uni ? inter / uni : 0; }

/** Gemeinsame Token aus a (exakt ODER trigramm-ähnlich, z.B. rente~rentenreform): Gesamtzahl + Zahl spezifischer (langer). */
export function sharedTokens(a: Set<string>, b: Set<string>): { total: number; specific: number } {
  let total = 0, specific = 0;
  for (const x of a) { let hit = false; const gx = trigrams(x); for (const y of b) { if (x === y || triJac(gx, trigrams(y)) >= 0.5) { hit = true; break; } } if (hit) { total++; if (x.length >= SPEC_LEN) specific++; } }
  return { total, specific };
}

/** Anschluss-Substrat zweier Token-Mengen: EIN spezifisches (langes) gemeinsames Token reicht, sonst >=2 beliebige. */
export function genugUeberlappung(a: Set<string>, b: Set<string>): boolean {
  const { total, specific } = sharedTokens(a, b);
  return specific >= 1 || total >= 2;
}

/** Sind zwei Leitthemen (roh) plausibel dieselbe Story? (ohne Feld-Gate) */
export function gleicheStory(aLeit: string, bLeit: string): boolean {
  return genugUeberlappung(tokens(aLeit), tokens(bLeit));
}
