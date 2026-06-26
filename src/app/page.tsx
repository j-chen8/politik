import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Shield, Landmark, Globe, Coins, Leaf, Briefcase, Building2, Users,
  Factory, GraduationCap, HeartPulse, Cpu, Drama, Wheat, Layers,
  type LucideIcon,
} from "lucide-react";
import { Rail } from "@/components/Rail";
import { MediaAppearanceCard } from "@/components/MediaAppearanceCard";
import { getBundestagLandingSnapshot, getFraktionSitze, type VoteIndexEntry } from "@/lib/db";
import { getVisibleAppearances } from "@/lib/media-appearances";
import { getThemenStruktur } from "@/lib/themen-blatt";
import { getDatenstand } from "@/lib/such-vorschlaege";

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
      <Rail
        title="Zuletzt abgestimmt"
        href="/abstimmungen"
        items={voteCards}
        cardWidth="w-[420px]"
      />
      <Rail
        title="Themenfelder"
        href="/themen"
        hrefLabel="Alle Themen"
        items={themenCards}
        cardWidth="w-[270px]"
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
