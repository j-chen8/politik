import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import {
  getBundestagWahlkreiseByPlz,
  getBerlinWahlkreiseByPlz,
  normalizePlz,
  type PlzLookupResult,
  type WahlkreisAbgeordnete,
  type WahlkreisTreffer,
} from "@/lib/plz";

export const metadata = {
  title: "Mein Abgeordneter — Politik-Radar",
  description:
    "Postleitzahl eingeben und sehen, wer dich im Bundestag vertritt: Direktmandat und Abgeordnete deiner Region über die Landesliste.",
};

const MONATE = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];
/** "2025-05-07" → "Mai 2025"; leere/ungültige Eingabe → "". */
function formatMonthYear(iso: string | null | undefined): string {
  const m = iso?.match(/^(\d{4})-(\d{2})/);
  if (!m) return "";
  const monthIdx = parseInt(m[2], 10) - 1;
  return monthIdx >= 0 && monthIdx < 12 ? `${MONATE[monthIdx]} ${m[1]}` : "";
}

function AbgCard({ a, primary = false }: { a: WahlkreisAbgeordnete; primary?: boolean }) {
  return (
    <Link
      href={`/politiker/${a.id}`}
      className={`flex items-center gap-3 rounded-xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm transition ${
        primary ? "p-4" : "p-3"
      }`}
    >
      <PoliticianAvatar
        photoUrl={a.photoUrl}
        firstName={a.firstName}
        lastName={a.lastName}
        party={a.party}
        size={primary ? "lg" : "md"}
      />
      <div className="min-w-0">
        <div
          className={`font-semibold tracking-[-0.01em] text-zinc-950 truncate ${
            primary ? "text-lg" : "text-[15px]"
          }`}
        >
          {a.title ? `${a.title} ` : ""}
          {a.firstName} {a.lastName}
        </div>
        {a.party && <div className="text-[13px] text-zinc-500 truncate">{a.party}</div>}
      </div>
    </Link>
  );
}

function WahlkreisBlock({ t, showShare }: { t: WahlkreisTreffer; showShare: boolean }) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Wahlkreis {t.wkrNr} · {t.wkrName}
        </h2>
        {showShare && (
          <span className="shrink-0 text-[11px] text-zinc-500">
            {Math.round(t.flaechenanteil * 100)} % deiner PLZ
          </span>
        )}
      </div>

      {t.direkt ? (
        <div className="mb-4">
          <div className="text-[13px] text-zinc-600 mb-2">Direkt gewählt im Wahlkreis</div>
          <AbgCard a={t.direkt} primary />
        </div>
      ) : t.formerDirekt ? (
        <div className="mb-4">
          <div className="text-[13px] text-zinc-600 mb-2">Direkt gewählt im Wahlkreis</div>
          <AbgCard a={t.formerDirekt.abg} primary />
          <div className="mt-2 bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 text-[13.5px] text-zinc-700 leading-relaxed">
            Diese Person hat ihr Mandat
            {formatMonthYear(t.formerDirekt.endDate) ? ` (${formatMonthYear(t.formerDirekt.endDate)})` : ""}{" "}
            niedergelegt — der frei gewordene Sitz wird über die Landesliste nachbesetzt
            (in Berlin nicht wahlkreisgebunden). Im Profil siehst du die aktuelle Funktion.
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-4 text-[13.5px] text-zinc-700 leading-relaxed">
          In diesem Wahlkreis hat die Person mit den meisten Erststimmen durch die
          Wahlrechtsreform <strong className="text-zinc-950">keinen Sitz</strong> erhalten.
          Deine Region wird über die Landesliste vertreten.
        </div>
      )}

      {t.liste.length > 0 && (
        <div>
          <div className="text-[13px] text-zinc-600 mb-2">
            Weitere Abgeordnete aus dem Wahlkreis (über die Landesliste)
          </div>
          <div className="grid gap-2">
            {t.liste.map((a) => (
              <AbgCard key={a.id} a={a} />
            ))}
          </div>
        </div>
      )}

      {!t.direkt && t.liste.length === 0 && (
        <div className="text-[14px] text-zinc-500">
          Für diesen Wahlkreis liegen aktuell keine sitzenden Abgeordneten vor.
        </div>
      )}
    </section>
  );
}

/** Rendert die Wahlkreis-Treffer eines Lookups (mit Mehrdeutigkeit + Sliver-Politur). */
function ResultBlocks({ result }: { result: PlzLookupResult }) {
  const multi = result.treffer.length > 1;
  // Sliver-Politur: Rand-Wahlkreise (< 10 % PLZ-Fläche) dezent einklappen.
  const MINOR = 0.1;
  const haupt = multi ? result.treffer.filter((t) => t.flaechenanteil >= MINOR) : result.treffer;
  const rand = multi ? result.treffer.filter((t) => t.flaechenanteil < MINOR) : [];
  const haupted = haupt.length > 0 ? haupt : result.treffer;
  const randed = haupt.length > 0 ? rand : [];
  return (
    <div>
      {multi && (
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 mb-8 text-[13.5px] text-zinc-600 leading-relaxed">
          Deine Postleitzahl <strong className="text-zinc-950">{result.plz}</strong> liegt in{" "}
          <strong className="text-zinc-950">{result.treffer.length} Wahlkreisen</strong>.
          PLZ- und Wahlkreis-Grenzen verlaufen nicht deckungsgleich — wir zeigen alle,
          sortiert nach dem Flächenanteil deiner PLZ.
        </div>
      )}
      {haupted.map((t) => (
        <WahlkreisBlock key={t.wkrNr} t={t} showShare={multi} />
      ))}
      {randed.length > 0 && (
        <details className="group mb-4 -mt-2">
          <summary className="cursor-pointer list-none text-[13px] text-zinc-500 hover:text-zinc-800 transition-colors select-none">
            <span className="underline decoration-zinc-300 underline-offset-2">
              {randed.length === 1
                ? "1 weiterer Wahlkreis mit kleinem Flächenanteil"
                : `${randed.length} weitere Wahlkreise mit kleinem Flächenanteil`}
            </span>
            <span className="text-zinc-400 group-open:hidden"> anzeigen</span>
          </summary>
          <div className="mt-6">
            {randed.map((t) => (
              <WahlkreisBlock key={t.wkrNr} t={t} showShare />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// Institutionelle Akzentfarben zur Ebenen-Unterscheidung — bewusst NICHT
// partei-assoziiert (Indigo/Teal nutzt keine im Bundestag/AGH vertretene Partei).
const LEVEL_STYLES = {
  bt: { card: "border-indigo-200", header: "bg-indigo-50/70 border-indigo-200 text-indigo-900", dot: "bg-indigo-500" },
  berlin: { card: "border-teal-200", header: "bg-teal-50/70 border-teal-200 text-teal-900", dot: "bg-teal-500" },
} as const;

/** Eine Parlaments-Ebene als farblich abgesetzte Karte (für das Nebeneinander-Layout). */
function LevelCard({
  label,
  accent,
  result,
}: {
  label: string;
  accent: keyof typeof LEVEL_STYLES;
  result: PlzLookupResult;
}) {
  const s = LEVEL_STYLES[accent];
  return (
    <section className={`rounded-2xl border ${s.card} bg-white overflow-hidden`}>
      <div
        className={`flex items-center gap-2 px-5 py-3 border-b ${s.header} text-[12px] font-semibold uppercase tracking-wider`}
      >
        <span className={`inline-block w-2 h-2 rounded-full ${s.dot}`} aria-hidden />
        {label}
      </div>
      <div className="p-5">
        <ResultBlocks result={result} />
      </div>
    </section>
  );
}

export default async function WahlkreisPage({
  searchParams,
}: {
  searchParams: Promise<{ plz?: string }>;
}) {
  const { plz: raw } = await searchParams;
  const norm = normalizePlz(raw);
  const bt = norm ? getBundestagWahlkreiseByPlz(norm) : null;
  const berlin = norm ? getBerlinWahlkreiseByPlz(norm) : null;
  const invalid = raw != null && raw.trim() !== "" && !norm;
  const hasBt = bt != null && bt.treffer.length > 0;
  const hasBerlin = berlin != null && berlin.treffer.length > 0;
  const notFound = bt != null && bt.treffer.length === 0 && !hasBerlin;

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <div className="max-w-2xl">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          Wer vertritt mich?
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4 leading-[1.05]">
          Mein Abgeordneter
        </h1>
        <p className="text-[17px] text-zinc-600 leading-relaxed mb-8 max-w-xl">
          Postleitzahl eingeben und sehen, wer dich im Bundestag vertritt — und, wenn du
          in Berlin wohnst, auch im Abgeordnetenhaus. Mit Link zu Reden, Abstimmungen und Anfragen.
        </p>

        <form action="/wahlkreis" method="get" className="flex gap-2 mb-10 max-w-sm">
          <input
            type="text"
            name="plz"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={5}
            defaultValue={raw ?? ""}
            placeholder="z. B. 50667"
            aria-label="Postleitzahl"
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-[16px] tracking-wide outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
          />
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-5 py-3 text-[15px] font-medium text-white hover:bg-zinc-700 transition"
          >
            Finden
          </button>
        </form>

        {invalid && (
          <p className="text-[14px] text-zinc-500 mb-8">
            Bitte eine 5-stellige deutsche Postleitzahl eingeben.
          </p>
        )}

        {notFound && (
          <p className="text-[15px] text-zinc-600 mb-8">
            Für die Postleitzahl <strong className="text-zinc-950">{bt!.plz}</strong> konnten
            wir keinen Wahlkreis zuordnen. Bitte prüfe die Eingabe.
          </p>
        )}
        </div>

        {hasBt && hasBerlin ? (
          // Beide Ebenen: nebeneinander (ab md), farblich getrennt.
          <div className="grid gap-5 md:grid-cols-2 mb-12 items-start">
            <LevelCard label="Im Bundestag" accent="bt" result={bt!} />
            <LevelCard label="Im Abgeordnetenhaus von Berlin" accent="berlin" result={berlin!} />
          </div>
        ) : hasBt ? (
          <div className="max-w-2xl mb-12">
            <LevelCard label="Im Bundestag" accent="bt" result={bt!} />
          </div>
        ) : hasBerlin ? (
          <div className="max-w-2xl mb-12">
            <LevelCard label="Im Abgeordnetenhaus von Berlin" accent="berlin" result={berlin!} />
          </div>
        ) : null}

        <div className="max-w-2xl">
        <Link
          href="/wie-stimmen-sitze-werden"
          className="mt-2 flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3.5 hover:border-zinc-300 transition-colors group"
        >
          <div>
            <div className="text-[14.5px] font-medium text-zinc-950">
              Wie funktioniert der Bundestag?
            </div>
            <div className="text-[12.5px] text-zinc-500">
              Wie aus deiner Stimme ein Sitz wird — einfach erklärt
            </div>
          </div>
          <ArrowRight
            className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-zinc-950 transition-colors"
            strokeWidth={2.25}
          />
        </Link>

        {hasBerlin && (
          <Link
            href="/wie-stimmen-sitze-werden/berlin"
            className="mt-3 flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3.5 hover:border-zinc-300 transition-colors group"
          >
            <div>
              <div className="text-[14.5px] font-medium text-zinc-950">
                Wie funktioniert das Abgeordnetenhaus von Berlin?
              </div>
              <div className="text-[12.5px] text-zinc-500">
                Wie aus deiner Stimme ein Sitz wird — einfach erklärt
              </div>
            </div>
            <ArrowRight
              className="w-4 h-4 shrink-0 text-zinc-400 group-hover:text-zinc-950 transition-colors"
              strokeWidth={2.25}
            />
          </Link>
        )}

        <p className="text-[12px] text-zinc-400 leading-relaxed mt-12 border-t border-zinc-200 pt-6">
          PLZ→Wahlkreis-Zuordnung durch geometrischen Verschnitt der PLZ-Gebiete mit den
          Wahlkreis-Grenzen. Quellen: Bundestags-Wahlkreis-Geometrien © Die Bundeswahlleiterin,
          Statistisches Bundesamt, Wiesbaden 2024 (dl-de/by-2-0); Abgeordnetenhaus-Wahlkreise
          Berlin 2021 © Amt für Statistik Berlin-Brandenburg (CC-BY); PLZ-Gebiete von
          suche-postleitzahl.org auf Basis von OpenStreetMap (ODbL). Liegt eine PLZ über mehrere
          Wahlkreise, werden alle ausgewiesen.
        </p>
        </div>
      </div>
    </div>
  );
}
