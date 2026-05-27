import { listAllVotesForIndex, type VoteIndexEntry } from "@/lib/db";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export default function AbstimmungenIndex({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; type?: string; show?: string }>;
}) {
  return <AbstimmungenIndexInner searchParams={searchParams} />;
}

async function AbstimmungenIndexInner({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; type?: string; show?: string }>;
}) {
  const { q = "", year = "", type = "", show = "" } = await searchParams;
  const all = listAllVotesForIndex();

  // Default-View: nur Gesetze/Anträge. Petitions-Sammelübersichten + Personen-
  // Wahlen sind formal Handzeichen-Votes, aber inhaltlich Routine-Vorgänge —
  // die User muss sie explizit anfordern.
  const showPetitionen = show === "petitionen" || show === "alle";
  const showPersonenwahl = show === "personenwahl" || show === "alle";

  const baseFiltered = all.filter((v) => {
    if (v.subtype === "petition" && !showPetitionen) return false;
    if (v.subtype === "personenwahl" && !showPersonenwahl) return false;
    return true;
  });

  const years = Array.from(
    new Set(baseFiltered.map((v) => v.date?.slice(0, 4)).filter(Boolean) as string[])
  ).sort((a, b) => b.localeCompare(a));

  const filtered = baseFiltered.filter((v) => {
    if (year && v.date?.slice(0, 4) !== year) return false;
    if (type === "namentlich" && v.type !== "namentlich") return false;
    if (type === "handzeichen" && v.type === "namentlich") return false;
    if (q) {
      const haystack = (v.label ?? "").toLowerCase();
      if (!haystack.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  const counts = {
    namentlich: baseFiltered.filter((v) => v.type === "namentlich").length,
    handzeichen: baseFiltered.filter((v) => v.type !== "namentlich").length,
    petitionen: all.filter((v) => v.subtype === "petition").length,
    personenwahl: all.filter((v) => v.subtype === "personenwahl").length,
  };

  return (
    <div className="page-wash">
      <div className="w-full max-w-5xl mx-auto px-5 pt-12 pb-24">
        {/* Header */}
        <div className="mb-10 fade-in-up">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Abstimmungen · Bundestag · Wahlperiode 21
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-zinc-950 leading-tight mb-3">
            Wer hat wann wie abgestimmt — und was wurde gesagt?
          </h1>
          <p className="text-[14px] text-zinc-600 leading-relaxed max-w-2xl">
            <span className="num font-medium text-zinc-900">{counts.namentlich.toLocaleString("de-DE")}</span>{" "}
            namentliche Abstimmungen mit individuellen MdB-Stimmen plus{" "}
            <span className="num font-medium text-zinc-900">{counts.handzeichen}</span>{" "}
            Handzeichen-Votes auf Fraktions-Ebene — alle seit Beginn der Wahlperiode.
          </p>
        </div>

        {/* Type-Filter */}
        <div className="mb-3 fade-in-up fade-in-up-2 flex flex-wrap gap-2 text-[12px]">
          <FilterPill href={`?${show ? `show=${show}` : ""}`} active={!type}>
            Alle ({baseFiltered.length})
          </FilterPill>
          <FilterPill href={`?type=namentlich${show ? `&show=${show}` : ""}`} active={type === "namentlich"}>
            Namentlich ({counts.namentlich})
          </FilterPill>
          <FilterPill href={`?type=handzeichen${show ? `&show=${show}` : ""}`} active={type === "handzeichen"}>
            Handzeichen ({counts.handzeichen})
          </FilterPill>
        </div>

        {/* Subtype-Filter (Petitionen + Personenwahlen sind per default ausgeblendet) */}
        <div className="mb-6 flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-zinc-400 self-center mr-1">Auch zeigen:</span>
          <FilterPill
            href={`?${type ? `type=${type}&` : ""}${
              show === "petitionen" ? "" : "show=petitionen"
            }`}
            active={showPetitionen}
          >
            Petitions-Sammelübersichten ({counts.petitionen})
          </FilterPill>
          <FilterPill
            href={`?${type ? `type=${type}&` : ""}${
              show === "personenwahl" ? "" : "show=personenwahl"
            }`}
            active={showPersonenwahl}
          >
            Personen-Wahlen ({counts.personenwahl})
          </FilterPill>
          <FilterPill
            href={`?${type ? `type=${type}&` : ""}show=alle`}
            active={show === "alle"}
          >
            beides
          </FilterPill>
        </div>

        {/* Such- + Jahresfilter */}
        <form className="mb-8 fade-in-up fade-in-up-2" action="" method="get">
          {type && <input type="hidden" name="type" value={type} />}
          {show && <input type="hidden" name="show" value={show} />}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[260px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"
                strokeWidth={2.25}
              />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={`Suche im Vote-Titel — z.B. „Familie", „Bundeswehr", „Steuer"…`}
                className="w-full pl-9 pr-3 py-2 text-[13.5px] border border-zinc-200/80 rounded-xl bg-white focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
            <select
              name="year"
              defaultValue={year}
              className="text-[13px] py-2 px-3 border border-zinc-200/80 rounded-xl bg-white focus:outline-none focus:border-zinc-400 transition-colors"
            >
              <option value="">alle Jahre</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="text-[13px] font-medium px-4 py-2 rounded-xl bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
            >
              Filtern
            </button>
            {(q || year) && (
              <Link
                href={`?${type ? `type=${type}&` : ""}${show ? `show=${show}` : ""}`}
                className="text-[12px] text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                Zurücksetzen
              </Link>
            )}
          </div>
          <div className="text-[11.5px] text-zinc-500 mt-2 num">
            {filtered.length} von {baseFiltered.length} angezeigt
          </div>
        </form>

        {/* Liste */}
        <div className="space-y-2 fade-in-up fade-in-up-3">
          {filtered.map((v) => (
            <VoteCard key={v.id} v={v} />
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

function FilterPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
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

const FRAKTIONS_ORDER = ["CDU/CSU", "SPD", "GRÜNE", "LINKE", "AfD"] as const;

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

  return (
    <Link
      href={v.detail_url}
      className="block border border-zinc-200/70 rounded-2xl bg-white px-5 py-4 hover:bg-zinc-50/60 hover:border-zinc-300 transition-colors group"
    >
      <div className="flex items-start gap-4">
        {/* Datum + Outcome */}
        <div className="shrink-0 w-[90px]">
          <div className="text-[11.5px] font-mono text-zinc-500 num">{formatDate(v.date)}</div>
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
            <span
              className={`px-1.5 py-0.5 rounded font-medium ${
                v.type === "namentlich"
                  ? "bg-violet-50 text-violet-700"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {v.type === "namentlich" ? "Namentlich" : "Handzeichen"}
            </span>
            {v.subtype === "petition" && (
              <span className="px-1.5 py-0.5 rounded font-medium bg-zinc-100 text-zinc-600">
                Petition
              </span>
            )}
            {v.subtype === "personenwahl" && (
              <span className="px-1.5 py-0.5 rounded font-medium bg-zinc-100 text-zinc-600">
                Personenwahl
              </span>
            )}
            {v.drucksache_nrn.length > 0 && (
              <span className="text-[10.5px] num text-zinc-400 normal-case tracking-normal">
                Drs.{" "}
                {v.drucksache_nrn.slice(0, 3).join(", ")}
                {v.drucksache_nrn.length > 3 && ` +${v.drucksache_nrn.length - 3}`}
              </span>
            )}
          </div>

          <div className="text-[14px] font-medium text-zinc-950 leading-snug mb-2 group-hover:text-zinc-700 transition-colors line-clamp-2">
            {v.label ?? `Abstimmung #${v.id}`}
          </div>

          {/* Bei namentlich: Stimmen-Bar + Reden-Verknüpfung. Bei Handzeichen:
              Fraktions-Pills mit ja/nein/enthaltung. */}
          {v.type === "namentlich" ? (
            <>
              <NamentlichStats yes={v.yes} no={v.no} abstain={v.abstain} />
              <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
                {v.has_topic_match === 1 ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="num">{v.speech_count}</span> Reden verknüpft
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-zinc-400">
                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    ohne Reden-Verknüpfung
                  </span>
                )}
                {v.match_confidence === "high" && (
                  <span className="text-emerald-700">Match: hoch</span>
                )}
                {v.match_confidence === "medium" && (
                  <span className="text-amber-700">Match: mittel</span>
                )}
              </div>
            </>
          ) : v.fraktion_votes ? (
            <div className="flex flex-wrap gap-1">
              {FRAKTIONS_ORDER.map((f) => {
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
          ) : (
            <div className="text-[11px] text-zinc-400 italic">
              Fraktions-Voten nicht erfasst
            </div>
          )}
        </div>

        <ArrowRight
          className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
          strokeWidth={2.25}
        />
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
