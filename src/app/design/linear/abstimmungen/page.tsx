import { listAllVotesForIndex, type VoteIndexEntry } from "@/lib/db";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AbstimmungenIndex({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; type?: string; parlament?: string; show?: string }>;
}) {
  return <AbstimmungenIndexInner searchParams={searchParams} />;
}

async function AbstimmungenIndexInner({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; type?: string; parlament?: string; show?: string }>;
}) {
  const { q = "", year = "", type = "", parlament = "", show = "" } = await searchParams;
  const all = listAllVotesForIndex();

  // Default-View: nur Gesetze/Anträge. Petitionen + Personen-Wahlen nur wenn show explizit.
  const showPetitionen = show === "petitionen" || show === "alle";
  const showPersonenwahl = show === "personenwahl" || show === "alle";

  const baseFiltered = all.filter((p) => {
    if (p.subtype === "petition" && !showPetitionen) return false;
    if (p.subtype === "personenwahl" && !showPersonenwahl) return false;
    return true;
  });

  const years = Array.from(
    new Set(baseFiltered.map((p) => p.date?.slice(0, 4)).filter(Boolean) as string[])
  ).sort((a, b) => b.localeCompare(a));

  const filtered = baseFiltered.filter((p) => {
    if (year && p.date?.slice(0, 4) !== year) return false;
    if (type) {
      if (type === "namentlich" && p.type !== "namentlich") return false;
      if (type === "handzeichen" && p.type === "namentlich") return false;
    }
    if (parlament && p.parliament !== parlament) return false;
    if (q) {
      const haystack = (p.label ?? "").toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const counts = {
    namentlich: baseFiltered.filter((p) => p.type === "namentlich").length,
    handzeichenBundestag: baseFiltered.filter((p) => p.type === "handzeichen_bundestag").length,
    handzeichenBerlin: baseFiltered.filter((p) => p.type === "handzeichen_berlin").length,
    petitionen: all.filter((p) => p.subtype === "petition").length,
    personenwahl: all.filter((p) => p.subtype === "personenwahl").length,
  };

  return (
    <div className="page-wash">
      <div className="w-full max-w-5xl mx-auto px-5 pt-12 pb-24">
        {/* Header */}
        <div className="mb-10 fade-in-up">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Abstimmungen · Bundestag (WP 21) + Berlin-Abgeordnetenhaus (WP 19)
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-zinc-950 leading-tight mb-3">
            Wer hat wann wie abgestimmt?
          </h1>
          <p className="text-[14px] text-zinc-600 leading-relaxed max-w-2xl">
            <span className="num font-medium text-zinc-900">{counts.namentlich}</span> namentliche
            Abstimmungen (Bundestag, individuelle MdB-Stimmen), {" "}
            <span className="num font-medium text-zinc-900">{counts.handzeichenBundestag}</span>{" "}
            Plenums-Abstimmungen Bundestag (Fraktions-Ebene) und{" "}
            <span className="num font-medium text-zinc-900">{counts.handzeichenBerlin}</span>{" "}
            im Berliner Abgeordnetenhaus.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-3 fade-in-up fade-in-up-2 flex flex-wrap gap-2 text-[12px]">
          <FilterPill href={`?${show ? `show=${show}` : ""}`} active={!type && !parlament}>
            Alle ({baseFiltered.length})
          </FilterPill>
          <FilterPill href={`?type=namentlich${show ? `&show=${show}` : ""}`} active={type === "namentlich"}>
            Namentlich ({counts.namentlich})
          </FilterPill>
          <FilterPill href={`?type=handzeichen&parlament=Bundestag${show ? `&show=${show}` : ""}`} active={type === "handzeichen" && parlament === "Bundestag"}>
            Bundestag · Handzeichen ({counts.handzeichenBundestag})
          </FilterPill>
          <FilterPill href={`?type=handzeichen&parlament=Berlin${show ? `&show=${show}` : ""}`} active={type === "handzeichen" && parlament === "Berlin"}>
            Berlin · Handzeichen ({counts.handzeichenBerlin})
          </FilterPill>
        </div>

        {/* Subtype-Filter */}
        <div className="mb-6 flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-zinc-400 self-center mr-1">Auch zeigen:</span>
          <FilterPill href={`?${type ? `type=${type}&` : ""}${parlament ? `parlament=${parlament}&` : ""}${show === "petitionen" ? "" : "show=petitionen"}`} active={showPetitionen}>
            Petitions-Sammelübersichten ({counts.petitionen})
          </FilterPill>
          <FilterPill href={`?${type ? `type=${type}&` : ""}${parlament ? `parlament=${parlament}&` : ""}${show === "personenwahl" ? "" : "show=personenwahl"}`} active={showPersonenwahl}>
            Personen-Wahlen ({counts.personenwahl})
          </FilterPill>
          <FilterPill href={`?${type ? `type=${type}&` : ""}${parlament ? `parlament=${parlament}&` : ""}show=alle`} active={show === "alle"}>
            beides
          </FilterPill>
        </div>

        {/* Year filter */}
        {years.length > 1 && (
          <div className="mb-6 flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-zinc-400 self-center mr-1">Jahr:</span>
            <FilterPill href={`?${type ? `type=${type}&` : ""}${parlament ? `parlament=${parlament}&` : ""}`} active={!year}>
              alle
            </FilterPill>
            {years.map((y) => (
              <FilterPill
                key={y}
                href={`?${type ? `type=${type}&` : ""}${parlament ? `parlament=${parlament}&` : ""}year=${y}`}
                active={year === y}
              >
                {y}
              </FilterPill>
            ))}
          </div>
        )}

        {/* Liste */}
        <div className="space-y-2 fade-in-up fade-in-up-3">
          {filtered.map((p) => (
            <VoteCard key={p.id} v={p} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-[13px] text-zinc-500 py-12 border border-dashed border-zinc-200 rounded-2xl">
              Keine Abstimmung passt zu diesem Filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`px-2.5 py-1 rounded-md border transition-colors ${
        active
          ? "bg-zinc-900 text-white border-zinc-900"
          : "bg-white text-zinc-700 border-zinc-200 hover:border-zinc-400"
      }`}
    >
      {children}
    </Link>
  );
}

const FRAKTIONS_ORDER_BT = ["CDU/CSU", "SPD", "GRÜNE", "LINKE", "AfD"] as const;
const FRAKTIONS_ORDER_BERLIN = ["CDU", "SPD", "GRÜNE", "LINKE", "AfD", "FDP"] as const;

function votePillColor(vote: string): string {
  if (vote === "ja") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (vote === "nein") return "bg-rose-50 text-rose-800 border-rose-200";
  if (vote === "enthaltung") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-zinc-50 text-zinc-500 border-zinc-200";
}

function voteIcon(vote: string): string {
  return vote === "ja" ? "✓" : vote === "nein" ? "✗" : vote === "enthaltung" ? "—" : "?";
}

function VoteCard({ v }: { v: VoteIndexEntry }) {
  const passed = v.outcome === "angenommen";
  const fraktionsOrder = v.parliament === "Bundestag" ? FRAKTIONS_ORDER_BT : FRAKTIONS_ORDER_BERLIN;

  return (
    <Link
      href={v.detail_url}
      className="block border border-zinc-200/70 rounded-2xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors group"
    >
      <div className="flex items-start gap-4">
        {/* Datum + Outcome */}
        <div className="shrink-0 w-[90px]">
          <div className="text-[11.5px] font-mono text-zinc-500 num">
            {formatDate(v.date)}
          </div>
          <div
            className={`mt-1 inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 rounded border ${
              passed
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : v.outcome === "abgelehnt"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            {v.outcome_label}
          </div>
        </div>

        {/* Label + Stats */}
        <div className="flex-1 min-w-0">
          {/* Type-Badge */}
          <div className="flex items-center gap-2 mb-1.5 text-[10px] uppercase tracking-wider">
            <span className={`px-1.5 py-0.5 rounded font-medium ${
              v.type === "namentlich"
                ? "bg-violet-50 text-violet-700"
                : v.parliament === "Bundestag"
                ? "bg-blue-50 text-blue-700"
                : "bg-orange-50 text-orange-700"
            }`}>
              {v.type === "namentlich" ? "Namentlich" : "Handzeichen"} · {v.parliament}
            </span>
            {v.drucksache_nrn.length > 0 && (
              <span className="text-[10.5px] num text-zinc-400">
                Drs. {v.drucksache_nrn.slice(0, 3).join(", ")}
                {v.drucksache_nrn.length > 3 && ` +${v.drucksache_nrn.length - 3}`}
              </span>
            )}
          </div>

          <div className="text-[14px] font-medium text-zinc-950 leading-snug mb-2 group-hover:text-zinc-700 transition-colors line-clamp-2">
            {v.label ?? `Abstimmung #${v.id}`}
          </div>

          {/* Bei namentlich: Stimmen-Bar. Bei Handzeichen: Fraktions-Pills. */}
          {v.type === "namentlich" && v.yes !== null && v.no !== null && v.abstain !== null && (
            <NamentlichStats yes={v.yes} no={v.no} abstain={v.abstain} />
          )}
          {v.type !== "namentlich" && v.fraktion_votes && (
            <div className="flex flex-wrap gap-1">
              {fraktionsOrder.map((f) => {
                const vt = v.fraktion_votes?.[f] ?? "unbekannt";
                return (
                  <span
                    key={f}
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[10.5px] font-medium ${votePillColor(vt)}`}
                    title={`${f}: ${vt}`}
                  >
                    <span className="font-semibold">{f}</span>
                    <span>{voteIcon(vt)}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" strokeWidth={2.25} />
      </div>
    </Link>
  );
}

function NamentlichStats({ yes, no, abstain }: { yes: number; no: number; abstain: number }) {
  const total = yes + no + abstain;
  const yesPct = total > 0 ? (yes / total) * 100 : 0;
  const noPct = total > 0 ? (no / total) * 100 : 0;
  const abstainPct = total > 0 ? (abstain / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden flex">
        <div className="bg-emerald-500/80" style={{ width: `${yesPct}%` }} />
        <div className="bg-rose-500/80" style={{ width: `${noPct}%` }} />
        <div className="bg-amber-400/70" style={{ width: `${abstainPct}%` }} />
      </div>
      <div className="text-[11px] num text-zinc-500 shrink-0">
        <span className="text-emerald-700">{yes}</span>
        <span className="text-zinc-300 mx-1">·</span>
        <span className="text-rose-700">{no}</span>
        {abstain > 0 && (
          <>
            <span className="text-zinc-300 mx-1">·</span>
            <span className="text-amber-700">{abstain}</span>
          </>
        )}
      </div>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y.slice(2)}`;
}
