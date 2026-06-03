/**
 * TopicTrendChart — Zeitreihe pro Bürger-Thema (hand-gerollte SVG, kein Chart-Lib).
 * Zwei Panels mit geteilter Zeitachse (getrennte Einheiten, damit nichts vermischt):
 *   oben:  Bürger-Sorge % (Politbarometer, Linie) — der Input
 *   unten: Parlament — Anfragen/Monat (helle Balken) + Gesetzgebung/Monat (blau)
 *          — die Reaktion (Gesetzgebung ist absolut klein → bewusst sichtbar gemacht)
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
  const bandW = Math.min(step * 0.34, 12);

  // Panel-Geometrie
  const aTop = 14;
  const aH = 78; // Sorge
  const aBot = aTop + aH;
  const bTop = aBot + 30;
  const bH = 64; // Parlament
  const bBot = bTop + bH;
  const H = bBot + 26;

  const maxConcern = concern ? Math.max(10, ...concern.map((v) => v ?? 0)) : 0;
  const yC = (v: number) => aBot - (v / maxConcern) * aH;
  const maxAct = Math.max(1, ...anfragen, ...handeln);
  const yB = (v: number) => bBot - (v / maxAct) * bH;

  const concernPts =
    concern && concern.some((v) => v != null)
      ? concern.map((v, i) => (v == null ? null : `${x(i).toFixed(1)},${yC(v).toFixed(1)}`)).filter(Boolean).join(" ")
      : null;

  const tickEvery = n > 10 ? 3 : 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Zeitreihe Sorge vs. Parlamentsaktivität">
      {/* Panel A: Sorge % */}
      <text x={padL} y={aTop - 2} className="fill-zinc-500" fontSize="9.5" fontWeight="600">
        Bürger-Sorge (%)
      </text>
      {/* y-Gitter Sorge: 0 + max */}
      {[0, maxConcern].map((v) => (
        <g key={`ay${v}`}>
          <line x1={padL} y1={yC(v)} x2={W - padR} y2={yC(v)} className="stroke-zinc-100" strokeWidth="1" />
          <text x={padL - 4} y={yC(v) + 3} textAnchor="end" className="fill-zinc-400" fontSize="8">
            {Math.round(v)}
          </text>
        </g>
      ))}
      {concernPts ? (
        <>
          <polyline points={concernPts} fill="none" className="stroke-[#1a3e72]" strokeWidth="2" strokeLinejoin="round" />
          {concern!.map((v, i) =>
            v == null ? null : <circle key={i} cx={x(i)} cy={yC(v)} r="2.2" className="fill-[#1a3e72]" />,
          )}
        </>
      ) : (
        <text x={W / 2} y={aTop + aH / 2} textAnchor="middle" className="fill-zinc-300" fontSize="10">
          keine Umfrage-Reihe für dieses Thema (Politbarometer fragt offen)
        </text>
      )}

      {/* Panel B: Parlament */}
      <text x={padL} y={bTop - 4} className="fill-zinc-500" fontSize="9.5" fontWeight="600">
        Parlament je Monat
      </text>
      <line x1={padL} y1={bBot} x2={W - padR} y2={bBot} className="stroke-zinc-200" strokeWidth="1" />
      {months.map((m, i) => {
        const aH2 = bBot - yB(anfragen[i] ?? 0);
        const hH2 = bBot - yB(handeln[i] ?? 0);
        return (
          <g key={m}>
            {/* Anfragen (hell) */}
            <rect x={x(i) - bandW} y={yB(anfragen[i] ?? 0)} width={bandW} height={Math.max(0, aH2)} className="fill-zinc-300" rx="1" />
            {/* Gesetzgebung (blau) */}
            <rect x={x(i)} y={yB(handeln[i] ?? 0)} width={bandW} height={Math.max(0, hH2)} className="fill-[#1a3e72]" rx="1" />
            {/* x-Label */}
            {i % tickEvery === 0 && (
              <text x={x(i)} y={H - 8} textAnchor="middle" className="fill-zinc-400" fontSize="8">
                {monthLabel(m)}
              </text>
            )}
          </g>
        );
      })}

      {/* Legende */}
      <g transform={`translate(${padL}, ${H - 1})`}>
        <rect x="0" y="-8" width="8" height="8" className="fill-zinc-300" rx="1" />
        <text x="11" y="-1" className="fill-zinc-500" fontSize="8.5">Anfragen (Kontrolle)</text>
        <rect x="118" y="-8" width="8" height="8" className="fill-[#1a3e72]" rx="1" />
        <text x="129" y="-1" className="fill-zinc-500" fontSize="8.5">Gesetzgebung</text>
      </g>
    </svg>
  );
}
