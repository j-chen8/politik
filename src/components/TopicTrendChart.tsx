/**
 * TopicTrendChart — Zeitreihe pro Bürger-Thema (hand-gerollte SVG, kein Chart-Lib).
 * Durchgehend Linien. Zwei Panels mit geteilter Zeitachse (getrennte Einheiten):
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
  const step = n > 1 ? plotW / (n - 1) : plotW;
  const x = (i: number) => padL + i * step;

  // Panel-Geometrie
  const aTop = 16;
  const aH = 76; // Sorge
  const aBot = aTop + aH;
  const bTop = aBot + 30;
  const bH = 66; // Parlament
  const bBot = bTop + bH;
  const H = bBot + 28;

  const maxConcern = concern ? Math.max(10, ...concern.map((v) => v ?? 0)) : 0;
  const yC = (v: number) => aBot - (v / maxConcern) * aH;
  const maxAct = Math.max(1, ...anfragen, ...handeln);
  const yB = (v: number) => bBot - (v / maxAct) * bH;

  const line = (vals: (number | null)[], y: (v: number) => number) =>
    vals.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`)).filter(Boolean).join(" ");

  const hasConcern = concern && concern.some((v) => v != null);
  const tickEvery = n > 10 ? 3 : 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Zeitreihe Sorge vs. Parlamentsaktivität">
      {/* Panel A: Sorge % */}
      <text x={padL} y={aTop - 4} className="fill-zinc-500" fontSize="9.5" fontWeight="600">
        Bürger-Sorge (%)
      </text>
      {[0, maxConcern].map((v) => (
        <g key={`ay${v}`}>
          <line x1={padL} y1={yC(v)} x2={W - padR} y2={yC(v)} className="stroke-zinc-100" strokeWidth="1" />
          <text x={padL - 4} y={yC(v) + 3} textAnchor="end" className="fill-zinc-400" fontSize="8">
            {Math.round(v)}
          </text>
        </g>
      ))}
      {hasConcern ? (
        <>
          <polyline points={line(concern!, yC)} fill="none" className="stroke-[#1a3e72]" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          {concern!.map((v, i) => (v == null ? null : <circle key={i} cx={x(i)} cy={yC(v)} r="2" className="fill-[#1a3e72]" />))}
        </>
      ) : (
        <text x={W / 2} y={aTop + aH / 2} textAnchor="middle" className="fill-zinc-300" fontSize="10">
          keine Umfrage-Reihe für dieses Thema (Politbarometer fragt offen)
        </text>
      )}

      {/* Panel B: Parlament (Linien) */}
      <text x={padL} y={bTop - 6} className="fill-zinc-500" fontSize="9.5" fontWeight="600">
        Parlament je Monat (Anzahl)
      </text>
      {[0, maxAct].map((v) => (
        <g key={`by${v}`}>
          <line x1={padL} y1={yB(v)} x2={W - padR} y2={yB(v)} className="stroke-zinc-100" strokeWidth="1" />
          <text x={padL - 4} y={yB(v) + 3} textAnchor="end" className="fill-zinc-400" fontSize="8">
            {Math.round(v)}
          </text>
        </g>
      ))}
      {/* Anfragen (hell/grau) */}
      <polyline points={line(anfragen, yB)} fill="none" className="stroke-zinc-400" strokeWidth="1.75" strokeLinejoin="round" strokeLinecap="round" />
      {anfragen.map((v, i) => (
        <circle key={`a${i}`} cx={x(i)} cy={yB(v)} r="1.8" className="fill-zinc-400" />
      ))}
      {/* Gesetzgebung (blau) */}
      <polyline points={line(handeln, yB)} fill="none" className="stroke-[#1a3e72]" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {handeln.map((v, i) => (
        <circle key={`h${i}`} cx={x(i)} cy={yB(v)} r="2" className="fill-[#1a3e72]" />
      ))}
      {/* x-Labels */}
      {months.map((m, i) =>
        i % tickEvery === 0 ? (
          <text key={`x${m}`} x={x(i)} y={bBot + 14} textAnchor="middle" className="fill-zinc-400" fontSize="8">
            {monthLabel(m)}
          </text>
        ) : null,
      )}

      {/* Legende */}
      <g transform={`translate(${padL}, ${H - 2})`}>
        <line x1="0" y1="-3" x2="14" y2="-3" className="stroke-zinc-400" strokeWidth="2" />
        <text x="18" y="0" className="fill-zinc-500" fontSize="8.5">Anfragen (Kontrolle)</text>
        <line x1="128" y1="-3" x2="142" y2="-3" className="stroke-[#1a3e72]" strokeWidth="2" />
        <text x="146" y="0" className="fill-zinc-500" fontSize="8.5">Gesetzgebung (Handeln)</text>
      </g>
    </svg>
  );
}
