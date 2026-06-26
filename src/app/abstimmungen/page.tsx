import { listAllVotesForIndex, type VoteIndexEntry } from "@/lib/db";
import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";

export default function AbstimmungenIndex({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; type?: string; show?: string; thema?: string }>;
}) {
  return <AbstimmungenIndexInner searchParams={searchParams} />;
}

async function AbstimmungenIndexInner({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; year?: string; type?: string; show?: string; thema?: string }>;
}) {
  const { q = "", year = "", type = "", show = "", thema = "" } = await searchParams;
  const all = listAllVotesForIndex();
  // Themen-Deep-Link (?thema=…): Filter auf die Topic-Labels der Votes — Einstieg
  // von den Themenseiten („alle Abstimmungen zum Thema X"), gleiches Muster wie
  // /politiker?partei=. Exaktes Label, case-insensitiv. Bleibt beim Weiterfiltern
  // (Typ/Jahr/Suche) aktiv, ✕ am Kontext-Chip hebt ihn auf.
  const themaQS = thema ? `thema=${encodeURIComponent(thema)}&` : "";

  // Default-View: nur Gesetze/Anträge. Petitions-Sammelübersichten + Personen-
  // Wahlen sind formal Handzeichen-Votes, aber inhaltlich Routine-Vorgänge —
  // die User muss sie explizit anfordern.
  const showPetitionen = show === "petitionen" || show === "alle";
  const showPersonenwahl = show === "personenwahl" || show === "alle";

  const subtypeFiltered = all.filter((v) => {
    if (v.subtype === "petition" && !showPetitionen) return false;
    if (v.subtype === "personenwahl" && !showPersonenwahl) return false;
    return true;
  });
  const baseFiltered = subtypeFiltered.filter(
    (v) => !thema || v.topics.some((t) => t.toLowerCase() === thema.toLowerCase())
  );

  // Themen-Dropdown: alle Topic-Labels der (subtype-gefilterten) Votes mit Anzahl,
  // alphabetisch — Quelle sind dieselben Labels wie die Chips auf den Karten.
  const themenCounts = new Map<string, number>();
  for (const v of subtypeFiltered) for (const t of v.topics) themenCounts.set(t, (themenCounts.get(t) ?? 0) + 1);
  const themen = Array.from(themenCounts.entries()).sort((a, b) => a[0].localeCompare(b[0], "de"));

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
      <div className="w-full page-shell">
        {/* Header */}
        <div className="mb-10 fade-in-up">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Abstimmungen · Bundestag · Wahlperiode 21
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.025em] text-zinc-950 dark:text-zinc-50 leading-tight mb-3">
            Wer hat wann wie abgestimmt — und was wurde gesagt?
          </h1>
          <p className="text-[14px] text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
            <span className="num font-medium text-zinc-900 dark:text-zinc-100">{counts.namentlich.toLocaleString("de-DE")}</span>{" "}
            namentliche Abstimmungen mit individuellen MdB-Stimmen plus{" "}
            <span className="num font-medium text-zinc-900 dark:text-zinc-100">{counts.handzeichen}</span>{" "}
            Handzeichen-Votes auf Fraktions-Ebene — alle seit Beginn der Wahlperiode.
          </p>
        </div>

        {/* Themen-Kontext (Deep-Link von Themenseiten) */}
        {thema && (
          <div className="mb-4 fade-in-up fade-in-up-2 flex flex-wrap items-center gap-2 text-[12px]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 px-3 py-1 font-medium text-violet-700 dark:text-violet-400 ring-1 ring-violet-200 dark:ring-violet-900/50">
              Thema: {thema}
              <Link href={`?${type ? `type=${type}&` : ""}${show ? `show=${show}` : ""}`}
                className="text-violet-400 transition-colors hover:text-violet-700 dark:hover:text-violet-400" aria-label="Themen-Filter aufheben">✕</Link>
            </span>
          </div>
        )}

        {/* Type-Filter */}
        <div className="mb-3 fade-in-up fade-in-up-2 flex flex-wrap gap-2 text-[12px]">
          <FilterPill href={`?${themaQS}${show ? `show=${show}` : ""}`} active={!type}>
            Alle ({baseFiltered.length})
          </FilterPill>
          <FilterPill href={`?${themaQS}type=namentlich${show ? `&show=${show}` : ""}`} active={type === "namentlich"}>
            Namentlich ({counts.namentlich})
          </FilterPill>
          <FilterPill href={`?${themaQS}type=handzeichen${show ? `&show=${show}` : ""}`} active={type === "handzeichen"}>
            Handzeichen ({counts.handzeichen})
          </FilterPill>
        </div>

        {/* Subtype-Filter (Petitionen + Personenwahlen sind per default ausgeblendet) */}
        <div className="mb-6 flex flex-wrap gap-1.5 text-[11px]">
          <span className="text-zinc-400 dark:text-zinc-500 self-center mr-1">Auch zeigen:</span>
          <FilterPill
            href={`?${themaQS}${type ? `type=${type}&` : ""}${
              show === "petitionen" ? "" : "show=petitionen"
            }`}
            active={showPetitionen}
          >
            Petitions-Sammelübersichten ({counts.petitionen})
          </FilterPill>
          <FilterPill
            href={`?${themaQS}${type ? `type=${type}&` : ""}${
              show === "personenwahl" ? "" : "show=personenwahl"
            }`}
            active={showPersonenwahl}
          >
            Personen-Wahlen ({counts.personenwahl})
          </FilterPill>
          <FilterPill
            href={`?${themaQS}${type ? `type=${type}&` : ""}show=alle`}
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
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500"
                strokeWidth={2.25}
              />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder={`Suche im Vote-Titel — z.B. „Familie", „Bundeswehr", „Steuer"…`}
                className="w-full pl-9 pr-3 py-2 text-[13.5px] border border-border rounded-xl bg-card focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
              />
            </div>
            <select
              name="thema"
              defaultValue={thema}
              className="max-w-[260px] text-[13px] py-2 px-3 border border-border rounded-xl bg-card focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
            >
              <option value="">alle Themen</option>
              {themen.map(([t, n]) => (
                <option key={t} value={t}>
                  {t} ({n})
                </option>
              ))}
            </select>
            <select
              name="year"
              defaultValue={year}
              className="text-[13px] py-2 px-3 border border-border rounded-xl bg-card focus:outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
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
                href={`?${themaQS}${type ? `type=${type}&` : ""}${show ? `show=${show}` : ""}`}
                className="text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
              >
                Zurücksetzen
              </Link>
            )}
          </div>
          <div className="text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-2 num">
            {filtered.length} von {baseFiltered.length} angezeigt
          </div>
        </form>

        {/* Liste */}
        <div className="space-y-2 fade-in-up fade-in-up-3">
          {filtered.map((v) => (
            <VoteCard key={v.id} v={v} />
          ))}
          {filtered.length === 0 && (
            <div className="text-center text-[13px] text-zinc-500 dark:text-zinc-400 py-12 border border-dashed border-border rounded-2xl">
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
          ? "bg-zinc-900 text-white border-zinc-900 dark:border-zinc-100"
          : "bg-card text-zinc-700 dark:text-zinc-300 border-border hover:border-zinc-400 dark:hover:border-zinc-500"
      }`}
    >
      {children}
    </Link>
  );
}

const FRAKTIONS_ORDER = ["CDU/CSU", "SPD", "GRÜNE", "LINKE", "AfD"] as const;

function votePillColor(vote: string): string {
  if (vote === "ja") return "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50";
  if (vote === "nein") return "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/50";
  if (vote === "enthaltung") return "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50";
  return "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-border";
}

function voteIcon(vote: string): string {
  return vote === "ja" ? "✓" : vote === "nein" ? "✗" : vote === "enthaltung" ? "—" : "?";
}

function VoteCard({ v }: { v: VoteIndexEntry }) {
  const passed = v.outcome === "angenommen";

  return (
    <Link
      href={v.detail_url}
      className="block border border-border rounded-2xl bg-card px-5 py-4 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group"
    >
      <div className="flex items-start gap-4">
        {/* Datum + Outcome */}
        <div className="shrink-0 w-[90px]">
          <div className="text-[11.5px] font-mono text-zinc-500 dark:text-zinc-400 num">{formatDate(v.date)}</div>
          <div
            className={`mt-1 inline-flex items-center text-[10.5px] font-semibold px-1.5 py-0.5 rounded border ${
              passed
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50"
                : v.outcome === "abgelehnt"
                  ? "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-900/50"
                  : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-900/50"
            }`}
          >
            {v.outcome_label}
          </div>
        </div>

        {/* Label + Stats */}
        <div className="flex-1 min-w-0">
          {/* Type-Badge + Topic-Chips */}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span
              className={`text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium ${
                v.type === "namentlich"
                  ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
              }`}
            >
              {v.type === "namentlich" ? "Namentlich" : "Handzeichen"}
            </span>
            {v.subtype === "petition" && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                Petition
              </span>
            )}
            {v.subtype === "personenwahl" && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                Personenwahl
              </span>
            )}
            {/* Topic-Chips — aw `field_topics` für namentliche, DS.thema für Handzeichen */}
            {v.topics.slice(0, 4).map((t) => (
              <span
                key={t}
                className="text-[11px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium"
              >
                {t}
              </span>
            ))}
            {v.topics.length > 4 && (
              <span className="text-[11px] text-zinc-400 dark:text-zinc-500">+{v.topics.length - 4}</span>
            )}
            {v.drucksache_nrn.length > 0 && !labelMentionsDs(v.label, v.drucksache_nrn) && (
              <span className="text-[10.5px] num text-zinc-400 dark:text-zinc-500 normal-case tracking-normal ml-auto">
                Drs.{" "}
                {v.drucksache_nrn.slice(0, 3).join(", ")}
                {v.drucksache_nrn.length > 3 && ` +${v.drucksache_nrn.length - 3}`}
              </span>
            )}
          </div>

          <div className="text-[14px] font-medium text-zinc-950 dark:text-zinc-50 leading-snug mb-2 group-hover:text-zinc-700 dark:group-hover:text-zinc-300 transition-colors line-clamp-2">
            {v.label ?? `Abstimmung #${v.id}`}
          </div>

          {/* Bei namentlich: Stimmen-Bar + Reden-Verknüpfung. Bei Handzeichen:
              Fraktions-Pills mit ja/nein/enthaltung. */}
          {v.type === "namentlich" ? (
            <>
              <NamentlichStats yes={v.yes} no={v.no} abstain={v.abstain} />
              <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                {v.has_topic_match === 1 ? (
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="num">{v.speech_count}</span> Reden verknüpft
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-zinc-400 dark:text-zinc-500">
                    <span className="w-1 h-1 rounded-full bg-zinc-300" />
                    ohne Reden-Verknüpfung
                  </span>
                )}
                {v.match_confidence === "high" && (
                  <span className="text-emerald-700 dark:text-emerald-400">Match: hoch</span>
                )}
                {v.match_confidence === "medium" && (
                  <span className="text-amber-700 dark:text-amber-400">Match: mittel</span>
                )}
              </div>
            </>
          ) : v.fraktion_votes ? (
            <div className="flex flex-wrap items-center gap-1">
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
              {v.beschlussAblehnung && (
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 ml-1">
                  Position zum Antrag
                </span>
              )}
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
              Fraktions-Voten nicht erfasst
            </div>
          )}
        </div>

        <ArrowRight
          className="w-4 h-4 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5"
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
      <div className="flex-1 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
        <div className="bg-emerald-500/80" style={{ width: `${yesPct}%` }} />
        <div className="bg-rose-500/80" style={{ width: `${noPct}%` }} />
        <div className="bg-amber-400/70" style={{ width: `${abstainPct}%` }} />
      </div>
      <div className="text-[11px] num text-zinc-500 dark:text-zinc-400 shrink-0">
        <span className="text-emerald-700 dark:text-emerald-400">{yes}</span>
        <span className="text-zinc-300 dark:text-zinc-600 mx-1">·</span>
        <span className="text-rose-700 dark:text-rose-400">{no}</span>
        {abstain > 0 && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600 mx-1">·</span>
            <span className="text-amber-700 dark:text-amber-400">{abstain}</span>
          </>
        )}
      </div>
    </div>
  );
}

/** Wenn das Label bereits eine der DS-Nummern enthält ("Antrag · Drucksache
 *  21/0563"), ist der separate Drs.-Meta-Tag redundant — dann nicht rendern. */
function labelMentionsDs(label: string | null, dsNrn: string[]): boolean {
  if (!label) return false;
  return dsNrn.some((nr) => label.includes(nr));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y.slice(2)}`;
}
