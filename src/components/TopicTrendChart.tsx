/**
 * TopicTrendChart — Zeitreihe pro Bürger-Thema (hand-gerollte SVG, kein Chart-Lib).
 * Durchgehend Balken. Zwei Panels mit geteilter Zeitachse (getrennte Einheiten):
 *   oben:  Bürger-Sorge % (Politbarometer) — der Input
 *   unten: Anfragen/Monat (Kontrolle) + Gesetzgebung/Monat (Handeln) — die Reaktion
 * Rein deskriptiv: Korrelation ≠ Kausalität, Politik reagiert mit Verzug.
 */

interface Props {
  months: string[]; // "YYYY-MM"
  concern: (number | null)[] | null; // % je Monat, oder null wenn keine Reihe
  anfragen: number[];
  handeln: number[];
}

function monthLabel(m: string): string {
  const [y, mo] = m.split("-");
  return `${mo}/${y.slice(2)}`;
}

export function TopicTrendChart({ months, concern, anfragen, handeln }: Props) {
  const W = 660;
  const padL = 30;
  const padR = 12;
  const plotW = W - padL - padR;
  const n = months.length;
  const band = plotW / n;
  const cx = (i: number) => padL + (i + 0.5) * band;

  // Panel-Geometrie
  const aTop = 16;
  const aH = 76; // Sorge
  const aBot = aTop + aH;
  const bTop = aBot + 30;
  const bH = 66; // Parlament
  const bBot = bTop + bH;
  const H = bBot + 28;

  const maxConcern = concern ? Math.max(10, ...concern.map((v) => v ?? 0)) : 0;
  const maxAct = Math.max(1, ...anfragen, ...handeln);

  const wA = Math.min(band * 0.6, 22); // Sorge-Balkenbreite
  const wB = Math.min(band * 0.32, 11); // gruppierte Balkenbreite unten
  const tickEvery = n > 10 ? 3 : 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Zeitreihe Sorge vs. Parlamentsaktivität">
      {/* Panel A: Sorge % */}
      <text x={padL} y={aTop - 4} className="fill-zinc-500" fontSize="9.5" fontWeight="600">
        Bürger-Sorge (%)
      </text>
      {[0, maxConcern].map((v) => (
        <g key={`ay${v}`}>
          <line x1={padL} y1={aBot - (v / maxConcern) * aH} x2={W - padR} y2={aBot - (v / maxConcern) * aH} className="stroke-zinc-100" strokeWidth="1" />
          <text x={padL - 4} y={aBot - (v / maxConcern) * aH + 3} textAnchor="end" className="fill-zinc-400" fontSize="8">
            {Math.round(v)}
          </text>
        </g>
      ))}
      {concern && concern.some((v) => v != null) ? (
        concern.map((v, i) =>
          v == null ? null : (
            <rect key={`c${i}`} x={cx(i) - wA / 2} y={aBot - (v / maxConcern) * aH} width={wA} height={(v / maxConcern) * aH} className="fill-[#1a3e72]" rx="1" />
          ),
        )
      ) : (
        <text x={W / 2} y={aTop + aH / 2} textAnchor="middle" className="fill-zinc-300" fontSize="10">
          keine Umfrage-Reihe für dieses Thema (Politbarometer fragt offen)
        </text>
      )}

      {/* Panel B: Parlament (gruppierte Balken) */}
      <text x={padL} y={bTop - 6} className="fill-zinc-500" fontSize="9.5" fontWeight="600">
        Parlament je Monat (Anzahl)
      </text>
      {[0, maxAct].map((v) => (
        <g key={`by${v}`}>
          <line x1={padL} y1={bBot - (v / maxAct) * bH} x2={W - padR} y2={bBot - (v / maxAct) * bH} className="stroke-zinc-100" strokeWidth="1" />
          <text x={padL - 4} y={bBot - (v / maxAct) * bH + 3} textAnchor="end" className="fill-zinc-400" fontSize="8">
            {Math.round(v)}
          </text>
        </g>
      ))}
      <line x1={padL} y1={bBot} x2={W - padR} y2={bBot} className="stroke-zinc-200" strokeWidth="1" />
      {months.map((m, i) => (
        <g key={m}>
          {/* Anfragen (grau) links */}
          <rect x={cx(i) - wB - 0.5} y={bBot - (anfragen[i] / maxAct) * bH} width={wB} height={(anfragen[i] / maxAct) * bH} className="fill-zinc-400" rx="1" />
          {/* Gesetzgebung (blau) rechts */}
          <rect x={cx(i) + 0.5} y={bBot - (handeln[i] / maxAct) * bH} width={wB} height={(handeln[i] / maxAct) * bH} className="fill-[#1a3e72]" rx="1" />
          {i % tickEvery === 0 && (
            <text x={cx(i)} y={bBot + 14} textAnchor="middle" className="fill-zinc-400" fontSize="8">
              {monthLabel(m)}
            </text>
          )}
        </g>
      ))}

      {/* Legende */}
      <g transform={`translate(${padL}, ${H - 2})`}>
        <rect x="0" y="-8" width="9" height="9" className="fill-zinc-400" rx="1" />
        <text x="13" y="-1" className="fill-zinc-500" fontSize="8.5">Anfragen (Kontrolle)</text>
        <rect x="125" y="-8" width="9" height="9" className="fill-[#1a3e72]" rx="1" />
        <text x="138" y="-1" className="fill-zinc-500" fontSize="8.5">Gesetzgebung (Handeln)</text>
      </g>
    </svg>
  );
}
