import Link from "next/link";

type Variant = "original" | "stories" | "feed" | "nowplaying";

const VARIANTS: { key: Variant; label: string; sub: string }[] = [
  { key: "original", label: "Original", sub: "Liste, eingeklappt" },
  { key: "stories", label: "Stories", sub: "Horizontaler Reel" },
  { key: "feed", label: "Feed", sub: "Filterbarer Stream" },
  { key: "nowplaying", label: "Now Playing", sub: "Hero + Queue" },
];

function pathFor(nr: number, v: Variant): string {
  const base = `/parlamente/berlin/sitzung/${nr}`;
  return v === "original" ? base : `${base}/${v}`;
}

interface Props {
  sitzungNr: number;
  current: Variant;
}

export function BerlinSitzungVariantBar({ sitzungNr, current }: Props) {
  return (
    <div className="flex flex-wrap gap-1.5 mb-5 p-1 rounded-xl border border-amber-200 bg-amber-50/60">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 px-2 py-1 shrink-0">
        Layout-Vergleich
      </span>
      {VARIANTS.map((v) => {
        const active = v.key === current;
        return (
          <Link
            key={v.key}
            href={pathFor(sitzungNr, v.key)}
            className={`flex flex-col items-start px-2.5 py-1 rounded-lg text-[11.5px] leading-tight transition-colors ${
              active
                ? "bg-white border border-amber-300 shadow-sm"
                : "border border-transparent hover:bg-amber-100/40"
            }`}
          >
            <span className={`font-semibold ${active ? "text-zinc-950" : "text-zinc-700"}`}>
              {v.label}
            </span>
            <span className="text-[10px] text-zinc-500">{v.sub}</span>
          </Link>
        );
      })}
    </div>
  );
}
