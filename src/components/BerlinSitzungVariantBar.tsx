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
    <div className="flex flex-wrap gap-1.5 mb-5 p-1 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/40">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-400 px-2 py-1 shrink-0">
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
                ? "bg-card border border-amber-300 dark:border-amber-800/50 shadow-sm"
                : "border border-transparent hover:bg-amber-100/40 dark:hover:bg-amber-900/40"
            }`}
          >
            <span className={`font-semibold ${active ? "text-zinc-950 dark:text-zinc-50" : "text-zinc-700 dark:text-zinc-300"}`}>
              {v.label}
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{v.sub}</span>
          </Link>
        );
      })}
    </div>
  );
}
