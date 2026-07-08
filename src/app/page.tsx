import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Shield, Landmark, Globe, Coins, Leaf, Briefcase, Building2, Users,
  Factory, GraduationCap, HeartPulse, Cpu, Drama, Wheat, Layers, Scale,
  ArrowRight, type LucideIcon,
} from "lucide-react";
import { Rail } from "@/components/Rail";
import { MediaAppearanceCard } from "@/components/MediaAppearanceCard";
import { TheseKachel, TheseZahl } from "@/components/AnalyseAufmacher";
import { getAufmacherPick, getBundestagLandingSnapshot, getFraktionSitze, type VoteIndexEntry } from "@/lib/db";
import { getVisibleAppearances } from "@/lib/media-appearances";
import { getThemenStruktur } from "@/lib/themen-blatt";
import { getDatenstand } from "@/lib/such-vorschlaege";
import Image from "next/image";
import { PARTEIEN } from "@/lib/partei-slug";

// Intrinsische Logo-Maße (aus der viewBox) — nur fürs Seitenverhältnis; gerendert
// wird auf fixe Höhe (h-6), die Breite läuft mit dem jeweiligen Logo mit.
const LOGO_DIMS: Record<string, [number, number]> = {
  "cdu-csu": [1368, 394],
  afd: [2678, 1690],
  spd: [408, 167],
  gruene: [321, 171],
  linke: [567, 127],
};

// Vertikaler Feinversatz pro Logo (px, + = nach unten). Das AfD-Logo hat den Text
// oben + den Pfeil darunter → beim Zentrieren der Box sitzt der „AfD"-Text höher
// als die reinen Wortmarken. Etwas runter, damit der Text auf einer Linie mit
// CDU/SPD/… liegt (der Pfeil ragt dann unten raus — vom User ausdrücklich ok).
const LOGO_NUDGE_Y: Record<string, number> = { afd: 6 };

// Dezente Line-Icons je gruppiertem Themen-Oberfeld (Slug aus getThemenStruktur).
// Rein dekorativ + neutral (Sachgebiet, keine Wertung) — als großes, ausgefadetes
// Eck-Motiv unten rechts. Fallback Layers.
const FELD_ICON: Record<string, LucideIcon> = {
  "innere-sicherheit-recht": Shield,
  "staat-verwaltung-demokratie": Landmark,
  "aussen-verteidigung-europa": Globe,
  "finanzen-steuern-haushalt": Coins,
  "umwelt-klima-energie": Leaf,
  "arbeit-soziales": Briefcase,
  "verkehr-bauen-wohnen": Building2,
  "migration-integration": Users,
  "wirtschaft-handel-industrie": Factory,
  "bildung-wissenschaft": GraduationCap,
  "gesundheit-pflege": HeartPulse,
  "digitalisierung-netzpolitik": Cpu,
  "gesellschaft-kultur-sport": Drama,
  "landwirtschaft-ernaehrung": Wheat,
};

// Mehrzeiliges Ellipsis-Clamp per Inline-Style (Tailwind v4/lightningcss verliert
// -webkit-box-orient bei line-clamp).
const lineClamp = (lines: number): CSSProperties => ({
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: lines,
  overflow: "hidden",
});

const cardCls =
  "flex h-full w-full flex-col gap-2.5 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600";

function dsHref(nr: string): string {
  return `/aktivitaeten/${nr.replace("/", "-")}`;
}

// Anzeige-Namen der News-Outlets (DB speichert Slugs, s. fetch-news-rss.ts).
const OUTLET_NAME: Record<string, string> = {
  faz: "FAZ", ntv: "ntv", spiegel: "Spiegel", tagesschau: "Tagesschau",
  tagesspiegel: "Tagesspiegel", taz: "taz", welt: "Welt", zeit: "Zeit",
};

function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Strippt den Boilerplate-Vorspann von Gesetzentwurfs-Titeln ("Gesetz zur/zum/
 * über/für …", auch ordinal "Erstes Gesetz …" und "Entwurf eines Gesetzes …"),
 * damit auf der Karte der aussagekräftige Teil steht statt der Floskel. Greift
 * nur, wenn ein sinnvoller Rest übrig bleibt — sonst bleibt der Originaltitel.
 */
function kuerzeGesetzTitel(titel: string): string {
  // Führende Ellipsen/Satzzeichen abschneiden, sonst greift der ^-Anker nicht
  // (manche Titel kommen als "… Gesetz zur …").
  const t = titel.trim().replace(/^[\s.…–—-]+/, "");
  const m =
    /^(?:Entwurf eines Gesetzes|(?:Erstes |Zweites |Drittes |Viertes |Fünftes |Sechstes |Siebtes |Achtes )?Gesetz)\s+(?:zur|zum|zu|über|für)\s+(.+)$/i.exec(
      t
    );
  if (m && m[1] && m[1].length >= 8) {
    return m[1].charAt(0).toUpperCase() + m[1].slice(1);
  }
  return t;
}

/**
 * Stimmen-Balken: Ja (grün) / Nein (rot) / Enthaltung (grau) als Farbverhältnis.
 * Datenvisualisierung, kein Schmuck — neutral.
 * - `real=true` (namentliche Abstimmung): echte Roll-Call-Zahlen darunter.
 * - `real=false` (Handzeichen): nach Fraktionsstärke gewichtet → KEINE Kopfzahlen
 *   (gäbe es nicht), nur der Hinweis „≈ nach Fraktionsstärke".
 */
function VoteBar({
  yes, no, abstain, real, flip,
}: { yes: number; no: number; abstain: number; real: boolean; flip?: boolean }) {
  const total = yes + no + abstain || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;
  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div style={{ width: pct(yes) }} className="bg-emerald-500/85" />
        <div style={{ width: pct(no) }} className="bg-red-500/85" />
        <div style={{ width: pct(abstain) }} className="bg-zinc-300 dark:bg-zinc-600" />
      </div>
      {real ? (
        <div className="num mt-1.5 flex items-center gap-3 text-[11.5px]">
          <span className="text-emerald-700 dark:text-emerald-400">{yes} Ja</span>
          <span className="text-red-700 dark:text-red-400">{no} Nein</span>
          {abstain > 0 && <span className="text-muted">{abstain} Enth.</span>}
        </div>
      ) : (
        <div className="mt-1.5 text-[11px] text-muted">
          {flip ? "Position zum Antrag · ≈ nach Fraktionsstärke" : "≈ nach Fraktionsstärke"}
        </div>
      )}
    </div>
  );
}

/**
 * Balken-Zahlen je Vote: namentlich = echte Roll-Call-Zahlen; Handzeichen =
 * aus den Fraktions-Positionen nach Sitzen gewichtet (real=false). Null, wenn
 * keine Datenbasis (Handzeichen ohne fraktion_votes).
 */
function balkenZahlen(
  v: VoteIndexEntry,
  sitze: Record<string, number>
): { yes: number; no: number; abstain: number; real: boolean } | null {
  if (v.type === "namentlich") {
    return { yes: v.yes, no: v.no, abstain: v.abstain, real: true };
  }
  if (v.fraktion_votes) {
    let yes = 0, no = 0, abstain = 0;
    for (const [frak, pos] of Object.entries(v.fraktion_votes)) {
      const size = sitze[frak] ?? 0;
      if (pos === "ja") yes += size;
      else if (pos === "nein") no += size;
      else if (pos === "enthaltung") abstain += size;
    }
    if (yes + no + abstain > 0) return { yes, no, abstain, real: false };
  }
  return null;
}

/**
 * Startseite im App-Shell-Layout (Content-first, kein Marketing-Hero): mehrere
 * horizontale „Regale" aus Karten (Spotify-Muster), chronologisch gefüllt =
 * neutral. Linke Leiste + Topbar-Suche liefert AppShell (via SiteChrome auf `/`).
 */
export default function Startseite() {
  // Manuell gepickter Tages-Aufmacher aus dem Salienz-Ranking (/entwurf/picker);
  // null ohne frischen Pick (48h-Verfall in getAufmacherPick) → Block entfällt.
  const pick = getAufmacherPick();
  const s = getBundestagLandingSnapshot();
  const interviews = getVisibleAppearances()
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, 14);
  const themen = getThemenStruktur();

  const sitze = getFraktionSitze();

  // ── Karten je Regal ──────────────────────────────────────────────────
  const voteCards = s.latestVotes.map((v) => {
    const balken = balkenZahlen(v, sitze);
    return (
      <Link key={v.id} href={v.detail_url} className={cardCls}>
        <p className="text-[16.5px] font-semibold leading-snug text-foreground">
          {v.label}
        </p>
        <div className="mt-auto flex flex-col gap-2.5 pt-3">
          {balken && (
            <VoteBar
              yes={balken.yes}
              no={balken.no}
              abstain={balken.abstain}
              real={balken.real}
              flip={v.type !== "namentlich" && v.beschlussAblehnung}
            />
          )}
          <div className="flex items-center gap-2 text-[12.5px] text-muted">
            {v.date && <span className="num">{formatDate(v.date)}</span>}
            <span
              className={`ml-auto rounded px-1.5 py-0.5 text-[12px] font-semibold uppercase tracking-wider ${
                v.outcome === "angenommen"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : v.outcome === "abgelehnt"
                  ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {v.outcome_label}
            </span>
          </div>
        </div>
      </Link>
    );
  });

  const gesetzCards = s.latestGesetzentwuerfe.map((g) => (
    <Link key={g.drucksacheNr} href={dsHref(g.drucksacheNr)} className={cardCls}>
      {/* Kein lineClamp: Gesetz-Titel sollen vollständig stehen (User-Wunsch).
          Karten sind items-stretch → die Reihe wächst auf den längsten Titel. */}
      <p className="text-[16.5px] font-semibold leading-snug text-foreground">
        {kuerzeGesetzTitel(g.titel)}
      </p>
      <div className="num mt-auto flex flex-wrap items-center gap-1.5 pt-3 text-[12.5px] text-muted">
        {g.datum && <span>{formatDate(g.datum)}</span>}
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <span>Drs. {g.drucksacheNr}</span>
        {g.einbringer && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="normal-case">{g.einbringer}</span>
          </>
        )}
      </div>
    </Link>
  ));

  const anfrageCards = s.latestAnfragen.map((a) => (
    <Link key={a.drucksacheNr} href={dsHref(a.drucksacheNr)} className={cardCls}>
      <p className="text-[16.5px] font-semibold leading-snug text-foreground">
        {a.titel}
      </p>
      {a.zusammenfassung && (
        <p className="text-[15px] leading-relaxed text-muted" style={lineClamp(3)}>
          {a.zusammenfassung}
        </p>
      )}
      <div className="num mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-[12.5px] text-muted">
        {a.datum && <span>{formatDate(a.datum)}</span>}
        <span className="text-zinc-300 dark:text-zinc-600">·</span>
        <span>Drs. {a.drucksacheNr}</span>
        {a.fraktion && (
          <>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <span className="normal-case">{a.fraktion}</span>
          </>
        )}
      </div>
    </Link>
  ));

  const interviewCards = interviews.map((a) => <MediaAppearanceCard key={a.id} appearance={a} />);

  // Parteien-Türreihe: echte Partei-Logos (Bundestags-Reihenfolge), direkt
  // anklickbar → /parteien/<slug>. Alle fünf Logos sind Wortmarken (enthalten
  // den Parteinamen) → nur Logo, der Name steckt im aria-label/title. Auf
  // heller Platte, die AUCH im Dark Mode hell bleibt — sonst verschwinden die
  // schwarzen Logo-Teile (CDU, AfD).
  // FAIRNESS: jede Kachel exakt GLEICH GROSS (gleiche Breite + Höhe), Logo
  // mittig zentriert und auf dieselbe optische Höhe normiert (h-7). Schmalere
  // Logos bekommen seitlich mehr Luft — gleiche Höhe = gleiche Wirkung, gleiche
  // Box = neutrale Gleichbehandlung (keine Partei kriegt einen größeren Button).
  const parteienChips = PARTEIEN.map((p) => {
    const [w, h] = LOGO_DIMS[p.slug];
    const dy = LOGO_NUDGE_Y[p.slug] ?? 0;
    return (
      <Link
        key={p.slug}
        href={`/parteien/${p.slug}`}
        aria-label={p.partei}
        title={p.partei}
        className="flex h-16 w-full items-center justify-center rounded-xl bg-white px-4 shadow-sm ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:shadow-md dark:ring-white/15 sm:w-[184px]"
      >
        <Image
          src={`/parties/${p.slug}.svg`}
          alt=""
          aria-hidden
          width={w}
          height={h}
          className="block h-auto max-h-11 w-auto max-w-full object-contain"
          style={dy ? { transform: `translateY(${dy}px)` } : undefined}
          unoptimized
        />
      </Link>
    );
  });

  // Themenfelder-Regal = die „Beliebtes Radio"-Reihe: Einstieg zum Stöbern.
  // Kein Untertitel mehr — stattdessen ein großes, dezent ausgefadetes Line-Icon
  // unten rechts angeschnitten (overflow-hidden) als grafisches Motiv.
  const themenCards = themen.map((t) => {
    const Icon = FELD_ICON[t.slug] ?? Layers;
    return (
      <Link
        key={t.slug}
        href={`/themen?feld=${encodeURIComponent(t.slug)}`}
        className="group relative flex h-full min-h-[132px] w-full flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
      >
        <p className="relative z-10 text-[17px] font-semibold leading-snug text-foreground" style={lineClamp(3)}>
          {t.name}
        </p>
        <Icon
          aria-hidden
          strokeWidth={1.5}
          className="pointer-events-none absolute -bottom-5 -right-4 h-28 w-28 text-zinc-300/90 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:text-zinc-300 dark:text-zinc-700/70 dark:group-hover:text-zinc-600"
        />
      </Link>
    );
  });

  return (
    <div className="mx-auto flex w-full max-w-[2400px] flex-col gap-9 px-6 py-8 sm:px-9 lg:px-12">
      {/* Orientierung als EINE Zeile (kein Hero-Block): H1 erklärt den Ort, Inhalt
          beginnt sofort darunter. Türen (Themen + Parteien) zuerst, direkt klickbar. */}
      <header className="-mb-1">
        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-foreground sm:text-[30px]">
          Was der Bundestag gerade tut
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          Gesetze, Anträge, Abstimmungen und Reden — transparent und lesbar.
        </p>
      </header>

      {/* ── Aufmacher des Tages ────────────────────────────────────────────
          Manuell aus dem Salienz-Ranking gepickt (Nachricht des Tages).
          VOLLE Breite wie die Regale (User-Wunsch 07.07.), innen zweispaltig:
          links Story (Headline/Summary/Quellen → Parteienvergleich), rechts
          die Weiterführungs-Boxen (Analyse/Drucksache/Vote) an einer dezenten
          Trennlinie. Ohne Boxen bleibt die Karte einspaltig-schmal (max-w-3xl).
          ZWEI Klickzonen (verschachtelte <a> sind verboten): Headline/Summary +
          Fußzeile → Parteienvergleich zum Feld; Boxen → jeweilige Detailseite.
          Ohne Pick/nach 48h entfällt der Block einfach. */}
      {pick && (() => {
        // „Unsere Analyse" wandert in die These-Kachel, wenn es beide gibt —
        // die Box-Spalte trägt dann nur noch Drucksache/Vote.
        const boxen = Boolean(pick.ds || pick.vote || (!pick.these && pick.analyseUrl));
        const zeile = Boolean(pick.these) || boxen;
        return (
        <section className="-mt-2 overflow-hidden rounded-2xl border border-border bg-card">
        <div
          className={
            zeile
              ? // Bento-Prinzip statt Breiten-Deckel (Ultrawide-Lehre): die Zeile
                // wird mit Kacheln GEFÜLLT, nichts dehnt. Kein Zeilen-Padding —
                // die These-Kachel füllt die linke Hälfte randlos (volle Höhe),
                // die übrigen Zonen bringen ihr Padding selbst mit.
                "flex flex-col lg:flex-row"
              : "flex max-w-3xl flex-col gap-2.5 p-5"
          }
        >
          {/* „Worum es geht" — Catcher (gleiche Kachel wie Analyse-/Kommissions-
              Seiten, randlos eingepasst), klickt zur Analyse. Ohne Analyse-Seite
              ist die Kachel bewusst KEIN Link — es gibt kein ehrliches Ziel. */}
          {pick.these && (() => {
            const kachel = (
              <TheseKachel rahmen={false} className="flex-1 p-5 sm:p-6">
                {/* Kein eigener „Unsere Analyse"-Text hier — die Fußzeile der
                    Story trägt ihn schon (User: nicht doppelt). Die Kachel
                    selbst bleibt klickbar. */}
                <TheseZahl
                  wert={pick.these.wert}
                  text={pick.these.text}
                  zahlClass="text-[34px] sm:text-[38px]"
                />
              </TheseKachel>
            );
            const zone = "flex lg:min-w-[300px] lg:grow-0 lg:basis-[360px]";
            return pick.analyseUrl
              ? <Link href={pick.analyseUrl} className={`group/th ${zone}`}>{kachel}</Link>
              : <div className={zone}>{kachel}</div>;
          })()}

          <div className={`flex min-w-0 flex-col gap-2.5 ${zeile ? "flex-1 p-5 sm:p-6 min-[1920px]:max-w-3xl" : ""}`}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">{pick.themenfeld}</p>
            {/* Headline → Analyse (falls vorhanden). Der frühere Parteienvergleichs-
                Link versprach „was die Parteien DAZU sagen" — das wissen wir für
                eine Tages-Story nicht (Feld-Vergleich ≠ Reaktion auf die Story). */}
            {(() => {
              const inner = (
                <>
                  {pick.headline && (
                    <p className={`font-semibold leading-snug tracking-[-0.01em] text-foreground ${pick.analyseUrl ? "group-hover:underline group-hover:decoration-zinc-300 group-hover:underline-offset-4 dark:group-hover:decoration-zinc-600" : ""} ${boxen ? "text-[21px] sm:text-[24px]" : "text-[19px]"}`}>
                      {pick.headline}
                    </p>
                  )}
                  {pick.summary && (
                    <p className="max-w-2xl text-[15px] leading-relaxed text-muted" style={lineClamp(3)}>
                      {pick.summary}
                    </p>
                  )}
                </>
              );
              return pick.analyseUrl
                ? <Link href={pick.analyseUrl} className="group flex flex-col gap-2.5">{inner}</Link>
                : <div className="flex flex-col gap-2.5">{inner}</div>;
            })()}
            {/* Quell-Artikel (je Outlet einer): bei Stories OHNE Bundestags-Dokument
                (z.B. Kabinettsphase) der einzige Weg zur vollen Geschichte.
                ≥1920px übernimmt der Pressespiegel rechts diese Rolle. */}
            {pick.quellen.length > 0 && (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-muted min-[1920px]:hidden">
                <span>Mehr dazu bei:</span>
                {pick.quellen.map((q) => (
                  <a
                    key={q.link}
                    href={q.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={q.title}
                    className="font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-2 hover:text-foreground hover:decoration-zinc-400 dark:text-zinc-300 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
                  >
                    {OUTLET_NAME[q.outlet] ?? q.outlet}
                  </a>
                ))}
              </p>
            )}
            {pick.analyseUrl && (
              <Link
                href={pick.analyseUrl}
                className="mt-auto inline-flex w-fit items-center gap-1 pt-1 text-[13.5px] font-medium text-muted transition-colors hover:text-foreground"
              >
                Unsere Analyse <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          {boxen && (
            <div className="flex flex-col justify-center gap-2.5 border-t border-border-soft p-5 sm:p-6 lg:w-[400px] lg:shrink-0 lg:border-l lg:border-t-0">
              {!pick.these && pick.analyseUrl && (
                <Link
                  href={pick.analyseUrl}
                  className="group/an rounded-xl border border-border bg-background/60 px-3.5 py-2.5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Unsere Analyse</p>
                  <p className="flex items-center gap-1 text-[14px] font-medium leading-snug text-foreground group-hover/an:underline group-hover/an:decoration-zinc-300 group-hover/an:underline-offset-2 dark:group-hover/an:decoration-zinc-600">
                    Zahlen, Hintergrund und offene Punkte im Überblick
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </p>
                </Link>
              )}
              {pick.ds && (
                <Link
                  href={dsHref(pick.ds.nr)}
                  className="group/ds rounded-xl border border-border bg-background/60 px-3.5 py-2.5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Im Bundestag dazu</p>
                  <p className="text-[14px] font-medium leading-snug text-foreground group-hover/ds:underline group-hover/ds:decoration-zinc-300 group-hover/ds:underline-offset-2 dark:group-hover/ds:decoration-zinc-600">{pick.ds.titel}</p>
                  <p className="num flex items-center gap-1 text-[12px] text-muted">
                    Drucksache {pick.ds.nr}{pick.ds.datum ? ` · ${formatDate(pick.ds.datum)}` : ""}
                    <ArrowRight className="h-3 w-3" />
                  </p>
                </Link>
              )}
              {pick.vote && (
                <Link
                  href={`/abstimmungen/${pick.vote.pollId}`}
                  className="group/vote rounded-xl border border-border bg-background/60 px-3.5 py-2.5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                  <p className="text-[14px] font-medium leading-snug text-foreground group-hover/vote:underline group-hover/vote:decoration-zinc-300 group-hover/vote:underline-offset-2 dark:group-hover/vote:decoration-zinc-600">{pick.vote.label}</p>
                  <div className="mt-1.5"><VoteBar yes={pick.vote.yes} no={pick.vote.no} abstain={pick.vote.abstain} real /></div>
                </Link>
              )}
            </div>
          )}

          {/* Pressespiegel (nur sehr breite Screens): die Schlagzeilen des
              gepickten Clusters in voller Länge — füllt die Breite mit
              story-verbundenem Inhalt statt Leerstand (Bento-Lehre). */}
          {zeile && pick.quellen.length > 0 && (
            <div className="hidden min-w-0 flex-1 flex-col justify-center gap-2.5 border-l border-border-soft p-5 sm:p-6 min-[1920px]:flex">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Pressespiegel</p>
              {pick.quellen.slice(0, 4).map((q) => (
                <a
                  key={q.link}
                  href={q.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/pq flex min-w-0 flex-col"
                >
                  <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
                    {OUTLET_NAME[q.outlet] ?? q.outlet}
                    {/* pubdate ist voll-ISO (mit Uhrzeit) — formatDate erwartet nur den Datumsteil */}
                    {q.datum && <span className="num ml-1.5 font-normal normal-case tracking-normal">· {formatDate(q.datum.slice(0, 10))}</span>}
                  </span>
                  <span
                    className="text-[13.5px] font-medium leading-snug text-foreground group-hover/pq:underline group-hover/pq:decoration-zinc-300 group-hover/pq:underline-offset-2 dark:group-hover/pq:decoration-zinc-600"
                    style={lineClamp(2)}
                  >
                    {q.title}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* ── Reaktionen der Fraktionen: PMs als Erstquelle (kein Medienzitat),
            deterministisch gematcht (Headline-Tokens, ab Vortag, max. 1 je
            Fraktion, Reihenfolge = Fraktionsstärke). Fehlt eine Fraktion, hat
            sie (noch) keine passende PM — auch das ist Information, aber wir
            zeigen nur Belegbares. Ohne Treffer entfällt das Band. ── */}
        {pick.reaktionen.length > 0 && (() => {
          {/* Gegenüberstellung nach Rolle (User-Wunsch, ohne Band-Überschrift):
              links Regierung + Koalitionsfraktionen der 21. WP, rechts die
              Opposition — ZEILENWEISE gepaart, damit sich die Stimmen auf
              gleicher Höhe gegenüberstehen. Faktische Zuordnung, keine Wertung. */}
          const KOALITION = new Set(["Bundesregierung", "CDU/CSU", "SPD"]);
          const koal = pick.reaktionen.filter((r) => KOALITION.has(r.fraktion));
          const opp = pick.reaktionen.filter((r) => !KOALITION.has(r.fraktion));
          const eintrag = (r: (typeof pick.reaktionen)[0]) => (
            <a
              key={r.link}
              href={r.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group/re flex min-w-0 flex-col"
            >
              <span className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
                {r.fraktion}
                {r.datum && <span className="num ml-1.5 font-normal normal-case tracking-normal">· {formatDate(r.datum.slice(0, 10))}</span>}
              </span>
              {/* Wörtliches Kern-Zitat (kuratiert) vor Titel — der Titel trägt
                  den Kern bei manchen Häusern selbst (dann kein Zitat nötig). */}
              <span
                className="text-[13.5px] font-medium leading-snug text-foreground group-hover/re:underline group-hover/re:decoration-zinc-300 group-hover/re:underline-offset-2 dark:group-hover/re:decoration-zinc-600"
                title={r.zitat ? r.titel : undefined}
              >
                {r.zitat ? <>„{r.zitat}“</> : r.titel}
              </span>
            </a>
          );
          const zeilen = Math.max(koal.length, opp.length);
          return (
            <div className="border-t border-border-soft p-5 sm:px-6 sm:py-4">
              {/* Desktop: Zeilen-Paare auf gleicher Höhe (Grid-Rows gleichen aus) */}
              <div className="hidden gap-x-10 gap-y-4 lg:grid lg:grid-cols-2">
                <p className="border-r border-border-soft pr-10 text-[10.5px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Regierung &amp; Koalition</p>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">Opposition</p>
                {Array.from({ length: zeilen }).flatMap((_, i) => [
                  <div key={`k${i}`} className="min-w-0 border-r border-border-soft pr-10">{koal[i] ? eintrag(koal[i]) : null}</div>,
                  <div key={`o${i}`} className="min-w-0">{opp[i] ? eintrag(opp[i]) : null}</div>,
                ])}
              </div>
              {/* Mobil: nach Gruppe gestapelt */}
              <div className="flex flex-col gap-4 lg:hidden">
                {([["Regierung & Koalition", koal], ["Opposition", opp]] as const).filter(([, rs]) => rs.length > 0).map(([label, rs]) => (
                  <div key={label} className="flex min-w-0 flex-col gap-2.5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">{label}</p>
                    {rs.map(eintrag)}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
        </section>
        );
      })()}

      <Rail
        title="Themenfelder"
        href="/themen"
        hrefLabel="Alle Themen"
        items={themenCards}
        cardWidth="w-[270px]"
      />

      {/* Parteien-Türreihe — zweiter Einstieg neben den Themen. */}
      <section className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3 px-1">
          <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">Parteien</h2>
        </div>
        {/* Mobil 2-spaltiges Raster (fixe 184px-Kacheln würden einzeln umbrechen
            → langer Turm), ab sm die Desktop-Reihe mit fixen, fairen Kachelmaßen. */}
        <div className="grid grid-cols-2 gap-3 px-1 sm:flex sm:flex-wrap">
          {parteienChips}
          {/* „Alle vergleichen"-Kachel: KEIN Logo (keine 6. Partei) → bewusst
              gedämpfte Optik + Icon, damit sie als Aktion statt als Partei liest.
              Verlinkt DIREKT in eine echte Vergleichsansicht (alle Parteien zum
              Feld „Arbeit" nebeneinander), statt auf die Hub-Seite — so landet man
              sofort im Vergleich. Von dort sind die anderen Felder erreichbar. */}
          <Link
            href="/parteien/feld/arbeit"
            aria-label="Alle Parteien vergleichen"
            className="flex h-16 w-full items-center justify-center gap-2 rounded-xl bg-slate-100 text-[14.5px] font-semibold text-foreground shadow-sm ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 dark:ring-white/15 sm:w-[184px]"
          >
            <Scale className="h-[18px] w-[18px] text-muted" aria-hidden />
            Alle vergleichen
          </Link>
        </div>
      </section>

      <Rail
        title="Zuletzt abgestimmt"
        href="/abstimmungen"
        items={voteCards}
        cardWidth="w-[420px]"
      />
      <Rail
        title="Neue Gesetzentwürfe"
        href="/gesetze"
        items={gesetzCards}
        cardWidth="w-[420px]"
      />
      <Rail
        title="Aktuelle Interview-Analysen"
        href="/medien"
        items={interviewCards}
      />
      <Rail
        title="Neue Kleine Anfragen"
        href="/anfragen"
        items={anfrageCards}
      />

      <p className="num pt-2 text-[12px] text-muted">
        Daten zuletzt aktualisiert: {getDatenstand()}
      </p>
    </div>
  );
}
