/**
 * Geteilte Bausteine für die drei Startseiten-ENTWÜRFE (/entwurf/*).
 * Server-Modul (keine Client-Hooks). Reine Vorschau — ändert die echte `/` NICHT.
 * Alles aus echten Daten (kein Fake); die Sagt-vs-Tut-Heuristik ist bewusst simpel
 * (erste belegte Partei-Position + eine reale Stimme im selben Feld) — der „schärfste
 * Widerspruch"-Algorithmus ist eine noch offene Frage und hier nicht nachgebaut.
 */
import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Scale } from "lucide-react";
import {
  getFraktionSitze,
  getFeldVergleich,
  getFeldAbstimmungen,
  getVoteOutcomeMap,
  type VoteIndexEntry,
} from "@/lib/db";
import { PARTEIEN } from "@/lib/partei-slug";
import { THEMENFELDER, slugToFeld } from "@/lib/themenfeld-slug";

/* ── Logo-Maße (gespiegelt aus page.tsx) ─────────────────────────────── */
const LOGO_DIMS: Record<string, [number, number]> = {
  "cdu-csu": [1368, 394], afd: [2678, 1690], spd: [408, 167],
  gruene: [321, 171], linke: [567, 127],
};
const LOGO_NUDGE_Y: Record<string, number> = { afd: 6 };
const PARTEI_SLUG = new Map(PARTEIEN.map((p) => [p.partei, p.slug]));

/* ── Helfer ──────────────────────────────────────────────────────────── */
export const cardCls =
  "flex h-full w-full flex-col gap-2.5 overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600";

export const lineClamp = (lines: number): CSSProperties => ({
  display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines, overflow: "hidden",
});

export function dsHref(nr: string): string {
  return `/aktivitaeten/${nr.replace("/", "-")}`;
}

export function formatDate(d: string): string {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export function kuerzeGesetzTitel(titel: string): string {
  const t = titel.trim().replace(/^[\s.…–—-]+/, "");
  const m =
    /^(?:Entwurf eines Gesetzes|(?:Erstes |Zweites |Drittes |Viertes |Fünftes |Sechstes |Siebtes |Achtes )?Gesetz)\s+(?:zur|zum|zu|über|für)\s+(.+)$/i.exec(t);
  if (m && m[1] && m[1].length >= 8) return m[1].charAt(0).toUpperCase() + m[1].slice(1);
  return t;
}

/* ── Stimmen-Balken ──────────────────────────────────────────────────── */
export function VoteBar({
  yes, no, abstain, real, flip, size = "sm",
}: { yes: number; no: number; abstain: number; real: boolean; flip?: boolean; size?: "sm" | "lg" }) {
  const total = yes + no + abstain || 1;
  const pct = (n: number) => `${(n / total) * 100}%`;
  const h = size === "lg" ? "h-3.5" : "h-2";
  return (
    <div>
      <div className={`flex ${h} overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800`}>
        <div style={{ width: pct(yes) }} className="bg-emerald-500/85" />
        <div style={{ width: pct(no) }} className="bg-red-500/85" />
        <div style={{ width: pct(abstain) }} className="bg-zinc-300 dark:bg-zinc-600" />
      </div>
      {real ? (
        <div className={`num mt-1.5 flex items-center gap-3 ${size === "lg" ? "text-[13px]" : "text-[11.5px]"}`}>
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

export function balkenZahlen(
  v: VoteIndexEntry, sitze: Record<string, number>,
): { yes: number; no: number; abstain: number; real: boolean } | null {
  if (v.type === "namentlich") return { yes: v.yes, no: v.no, abstain: v.abstain, real: true };
  if (v.fraktion_votes) {
    let yes = 0, no = 0, abstain = 0;
    for (const [frak, pos] of Object.entries(v.fraktion_votes)) {
      const size = sitze[frak] ?? 0;
      if (pos === "ja") yes += size; else if (pos === "nein") no += size; else if (pos === "enthaltung") abstain += size;
    }
    if (yes + no + abstain > 0) return { yes, no, abstain, real: false };
  }
  return null;
}

function barFromFraktionen(fraktionen: Record<string, string>, sitze: Record<string, number>) {
  let yes = 0, no = 0, abstain = 0;
  for (const [frak, pos] of Object.entries(fraktionen)) {
    const size = sitze[frak] ?? 0;
    if (pos === "ja") yes += size; else if (pos === "nein") no += size; else if (pos === "enthaltung") abstain += size;
  }
  return { yes, no, abstain };
}

/* ── Partei-Logo + Reihe ─────────────────────────────────────────────── */
export function ParteiLogo({ slug, partei, className = "h-7" }: { slug: string; partei: string; className?: string }) {
  const [w, h] = LOGO_DIMS[slug] ?? [100, 40];
  const dy = LOGO_NUDGE_Y[slug] ?? 0;
  return (
    <Image
      src={`/parties/${slug}.svg`} alt={partei} title={partei} width={w} height={h}
      className={`block w-auto max-w-full object-contain ${className}`}
      style={dy ? { transform: `translateY(${dy}px)` } : undefined} unoptimized
    />
  );
}

export function ParteienRow({ compare = true }: { compare?: boolean }) {
  return (
    <div className="flex flex-wrap gap-3">
      {PARTEIEN.map((p) => (
        <Link
          key={p.slug} href={`/parteien/${p.slug}`} aria-label={p.partei} title={p.partei}
          className="flex h-16 w-[160px] items-center justify-center rounded-xl bg-white px-4 shadow-sm ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:shadow-md dark:ring-white/15"
        >
          <ParteiLogo slug={p.slug} partei={p.partei} className="h-auto max-h-10" />
        </Link>
      ))}
      {compare && (
        <Link
          href="/parteien/feld/arbeit" aria-label="Alle Parteien vergleichen"
          className="flex h-16 w-[160px] items-center justify-center gap-2 rounded-xl bg-slate-100 text-[14px] font-semibold text-foreground shadow-sm ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-800 dark:ring-white/15"
        >
          <Scale className="h-[18px] w-[18px] text-muted" aria-hidden /> Alle vergleichen
        </Link>
      )}
    </div>
  );
}

/* ── Einzelkarten (für Regale UND Raster wiederverwendbar) ───────────── */
export function VoteCard({ v, sitze, compact }: { v: VoteIndexEntry; sitze: Record<string, number>; compact?: boolean }) {
  const balken = balkenZahlen(v, sitze);
  return (
    <Link href={v.detail_url} className={cardCls}>
      <p className={`font-semibold leading-snug text-foreground ${compact ? "text-[15px]" : "text-[16.5px]"}`}>{v.label}</p>
      <div className="mt-auto flex flex-col gap-2.5 pt-3">
        {balken && <VoteBar yes={balken.yes} no={balken.no} abstain={balken.abstain} real={balken.real} flip={v.type !== "namentlich" && v.beschlussAblehnung} />}
        <div className="flex items-center gap-2 text-[12.5px] text-muted">
          {v.date && <span className="num">{formatDate(v.date)}</span>}
          <span className={`ml-auto rounded px-1.5 py-0.5 text-[12px] font-semibold uppercase tracking-wider ${
            v.outcome === "angenommen" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : v.outcome === "abgelehnt" ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"}`}>{v.outcome_label}</span>
        </div>
      </div>
    </Link>
  );
}

export function GesetzCard({ g }: { g: { drucksacheNr: string; titel: string; datum: string | null; einbringer: string | null } }) {
  return (
    <Link href={dsHref(g.drucksacheNr)} className={cardCls}>
      <p className="text-[16.5px] font-semibold leading-snug text-foreground">{kuerzeGesetzTitel(g.titel)}</p>
      <div className="num mt-auto flex flex-wrap items-center gap-1.5 pt-3 text-[12.5px] text-muted">
        {g.datum && <span>{formatDate(g.datum)}</span>}
        <span className="text-zinc-300 dark:text-zinc-600">·</span><span>Drs. {g.drucksacheNr}</span>
        {g.einbringer && (<><span className="text-zinc-300 dark:text-zinc-600">·</span><span className="normal-case">{g.einbringer}</span></>)}
      </div>
    </Link>
  );
}

export function AnfrageCard({ a }: { a: { drucksacheNr: string; titel: string; zusammenfassung: string | null; datum: string | null; fraktion: string | null } }) {
  return (
    <Link href={dsHref(a.drucksacheNr)} className={cardCls}>
      <p className="text-[16.5px] font-semibold leading-snug text-foreground">{a.titel}</p>
      {a.zusammenfassung && <p className="text-[14.5px] leading-relaxed text-muted" style={lineClamp(3)}>{a.zusammenfassung}</p>}
      <div className="num mt-auto flex flex-wrap items-center gap-1.5 pt-1 text-[12.5px] text-muted">
        {a.datum && <span>{formatDate(a.datum)}</span>}
        {a.fraktion && (<><span className="text-zinc-300 dark:text-zinc-600">·</span><span>{a.fraktion}</span></>)}
        <span className="text-zinc-300 dark:text-zinc-600">·</span><span>Drs. {a.drucksacheNr}</span>
      </div>
    </Link>
  );
}

/* ── Sagt-vs-Tut-Hero-Daten (echt) ───────────────────────────────────── */
export type EntwurfHero = {
  feld: string; slug: string; partei: string; parteiSlug: string;
  zitat: string; seite: number | null; betreff: string; kurz: string | null;
  richtungEffektiv: "dafür" | "dagegen" | "enthalten";
  bar: { yes: number; no: number; abstain: number };
  fraktionen: Record<string, string>; beschlussAblehnung: boolean;
};

const HERO_KANDIDATEN = ["energie", "soziale-sicherung", "migration", "wohnen-bau", "verkehr", "wirtschaft", "arbeit", "finanzen-steuern"];

// Nur echte Sach-Entscheidungen taugen als „Tut" — Verfahrens-Votes (Überweisung,
// Vertagung) sind KEINE Position zum Antrag (siehe Überweisungs-Bug).
const SACH_OUTCOMES = new Set(["annahme", "annahme_geaendert", "ablehnung"]);

export function getEntwurfHero(): EntwurfHero | null {
  const sitze = getFraktionSitze();
  const outcomes = getVoteOutcomeMap();
  for (const slug of HERO_KANDIDATEN) {
    const feld = slugToFeld(slug);
    if (!feld) continue;
    const positionen = getFeldVergleich(feld);
    const abst = getFeldAbstimmungen(feld);
    // Verfahrens-Votes raus: nur Sach-Entscheidungen zählen als „Tut".
    const votes = [...Object.values(abst.proAspekt).flat(), ...abst.feldweit]
      .filter((v) => SACH_OUTCOMES.has(outcomes[v.voteId] ?? ""));
    if (!positionen.length || !votes.length) continue;
    for (const { partei, pos } of positionen) {
      const beleg = pos.belege.find((b) => b.verifiziert && b.zitat && b.zitat.length > 30);
      if (!beleg) continue;
      const vote = votes.find((v) => v.fraktionen[partei] === "ja" || v.fraktionen[partei] === "nein");
      if (!vote) continue;
      const roh = vote.fraktionen[partei];
      // Beschlussempfehlung zur Ablehnung → Stimme zum ANTRAG ist gegenläufig.
      const effektiv = vote.beschlussAblehnung ? (roh === "ja" ? "nein" : "ja") : roh;
      return {
        feld, slug, partei, parteiSlug: PARTEI_SLUG.get(partei) ?? "",
        zitat: beleg.zitat, seite: beleg.seite ?? null,
        betreff: vote.betreff, kurz: vote.kurz,
        richtungEffektiv: effektiv === "ja" ? "dafür" : effektiv === "nein" ? "dagegen" : "enthalten",
        bar: barFromFraktionen(vote.fraktionen, sitze),
        fraktionen: vote.fraktionen, beschlussAblehnung: vote.beschlussAblehnung,
      };
    }
  }
  return null;
}

/** Gewinner/Verlierer einer Abstimmung: Fraktionen nach Lager, Logos. */
export function lagerAusFraktionen(fraktionen: Record<string, string>): { dafuer: { partei: string; slug: string }[]; dagegen: { partei: string; slug: string }[] } {
  const dafuer: { partei: string; slug: string }[] = [];
  const dagegen: { partei: string; slug: string }[] = [];
  for (const p of PARTEIEN) {
    const r = fraktionen[p.partei];
    if (r === "ja") dafuer.push({ partei: p.partei, slug: p.slug });
    else if (r === "nein") dagegen.push({ partei: p.partei, slug: p.slug });
  }
  return { dafuer, dagegen };
}

export const FELD_KURZ = new Map(THEMENFELDER.map((t) => [t.feld, t.kurz]));
