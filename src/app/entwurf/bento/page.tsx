/**
 * ENTWURF 3 — „Magazin-Bento" (Platz 3). Asymmetrisches Kachel-Raster verschiedener
 * Größen statt gleichförmiger Regale; Inhaltstypen gemischt. Echte Daten.
 */
import Link from "next/link";
import { Scale, ArrowRight } from "lucide-react";
import { MediaAppearanceCard } from "@/components/MediaAppearanceCard";
import { getBundestagLandingSnapshot, getFraktionSitze } from "@/lib/db";
import { getVisibleAppearances } from "@/lib/media-appearances";
import { getThemenStruktur } from "@/lib/themen-blatt";
import {
  VoteBar, balkenZahlen, ParteiLogo, getEntwurfHero, FELD_KURZ,
  dsHref, kuerzeGesetzTitel, formatDate, cardCls,
} from "../_bausteine";

const tile = "flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-card p-4 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600";

export default function EntwurfBento() {
  const s = getBundestagLandingSnapshot();
  const sitze = getFraktionSitze();
  const hero = getEntwurfHero();
  const themen = getThemenStruktur().slice(0, 6);
  const foto = getVisibleAppearances().sort((a, b) => b.published_at.localeCompare(a.published_at))[0];
  const votes = s.latestVotes.slice(0, 4);
  const g0 = s.latestGesetzentwuerfe[0];
  const a0 = s.latestAnfragen[0];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-6 py-8 sm:px-9 lg:px-12">
      <p className="mb-5 text-[15px] text-muted">
        <span className="font-semibold text-foreground">Was der Bundestag gerade tut</span> · Gesetze · Anträge · Abstimmungen · Reden
      </p>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6 [grid-auto-rows:minmax(150px,auto)]">
        {/* SAGT vs TUT — große Ankerkachel */}
        {hero && (
          <Link href={`/parteien/feld/${hero.slug}`} className="group col-span-2 row-span-2 flex flex-col overflow-hidden rounded-2xl border border-border lg:col-span-3">
            <div className="flex items-center justify-between bg-foreground px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-background">
              <span>Sagt vs Tut</span><span className="opacity-70">{FELD_KURZ.get(hero.feld) ?? hero.feld}</span>
            </div>
            <div className="grid flex-1 sm:grid-cols-2">
              <div className="flex flex-col gap-2 bg-emerald-50/70 p-4 dark:bg-emerald-950/20">
                <span className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Sagt</span>
                <div className="h-6"><ParteiLogo slug={hero.parteiSlug} partei={hero.partei} className="h-6" /></div>
                <p className="text-[15px] font-semibold leading-snug text-foreground" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 4, overflow: "hidden" }}>„{hero.zitat}"</p>
              </div>
              <div className="flex flex-col gap-2 border-t border-border bg-red-50/60 p-4 dark:bg-red-950/20 sm:border-l sm:border-t-0">
                <span className="text-[11px] font-bold uppercase text-red-700 dark:text-red-400">Tut</span>
                <p className="text-[13.5px] font-medium leading-snug text-foreground" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" }}>{hero.betreff}</p>
                <div className="mt-auto"><VoteBar yes={hero.bar.yes} no={hero.bar.no} abstain={hero.bar.abstain} real={false} flip={hero.beschlussAblehnung} /></div>
                <p className="text-[13px] font-bold text-foreground">stimmte {hero.richtungEffektiv === "dafür" ? <span className="text-emerald-600 dark:text-emerald-400">DAFÜR</span> : <span className="text-red-600 dark:text-red-400">DAGEGEN</span>}</p>
              </div>
            </div>
          </Link>
        )}

        {/* Foto-Interview — hochkant */}
        {foto && <div className="col-span-2 row-span-2"><MediaAppearanceCard appearance={foto} /></div>}

        {/* Erste Abstimmung — schmal hoch */}
        {votes[0] && (() => { const b = balkenZahlen(votes[0], sitze); return (
          <Link href={votes[0].detail_url} className={`${tile} col-span-2 row-span-2 lg:col-span-1`}>
            <span className="text-[11px] font-bold uppercase text-muted">Abstimmung</span>
            <p className="text-[14px] font-semibold leading-snug text-foreground" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 4, overflow: "hidden" }}>{votes[0].label}</p>
            <div className="mt-auto">{b && <VoteBar yes={b.yes} no={b.no} abstain={b.abstain} real={b.real} flip={votes[0].type !== "namentlich" && votes[0].beschlussAblehnung} />}</div>
          </Link>
        ); })()}

        {/* Gesetz — breit */}
        {g0 && (
          <Link href={dsHref(g0.drucksacheNr)} className={`${tile} col-span-2`}>
            <span className="text-[11px] font-bold uppercase text-muted">Neuer Gesetzentwurf</span>
            <p className="text-[15px] font-semibold leading-snug text-foreground">{kuerzeGesetzTitel(g0.titel)}</p>
            <p className="num mt-auto text-[12px] text-muted">{g0.datum && formatDate(g0.datum)} · Drs. {g0.drucksacheNr}</p>
          </Link>
        )}

        {/* Anfrage — breit */}
        {a0 && (
          <Link href={dsHref(a0.drucksacheNr)} className={`${tile} col-span-2`}>
            <span className="text-[11px] font-bold uppercase text-muted">Kleine Anfrage</span>
            <p className="text-[15px] font-semibold leading-snug text-foreground" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{a0.titel}</p>
            <p className="num mt-auto text-[12px] text-muted">{a0.fraktion} · Drs. {a0.drucksacheNr}</p>
          </Link>
        )}

        {/* zweite Abstimmung */}
        {votes[1] && (() => { const b = balkenZahlen(votes[1], sitze); return (
          <Link href={votes[1].detail_url} className={`${tile} col-span-2`}>
            <span className="text-[11px] font-bold uppercase text-muted">Abstimmung</span>
            <p className="text-[14px] font-semibold leading-snug text-foreground" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{votes[1].label}</p>
            <div className="mt-auto">{b && <VoteBar yes={b.yes} no={b.no} abstain={b.abstain} real={b.real} flip={votes[1].type !== "namentlich" && votes[1].beschlussAblehnung} />}</div>
          </Link>
        ); })()}

        {/* Themen-Mini-Kacheln */}
        {themen.map((t) => (
          <Link key={t.slug} href={`/themen?feld=${encodeURIComponent(t.slug)}`} className={`${tile} col-span-1`}>
            <span className="text-[11px] font-bold uppercase text-muted">Thema</span>
            <p className="text-[14px] font-semibold leading-snug text-foreground" style={{ display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3, overflow: "hidden" }}>{t.name}</p>
          </Link>
        ))}

        {/* Parteien-Kachel */}
        <Link href="/parteien/feld/arbeit" className={`${tile} col-span-2 justify-between`}>
          <span className="text-[11px] font-bold uppercase text-muted">Parteien · vergleichen</span>
          <div className="flex flex-wrap items-center gap-2">
            {["cdu-csu", "afd", "spd", "gruene", "linke"].map((sl) => (
              <span key={sl} className="flex h-7 items-center rounded bg-white px-1.5 ring-1 ring-black/10"><ParteiLogo slug={sl} partei={sl} className="h-4" /></span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-[13px] font-medium text-muted"><Scale className="h-4 w-4" /> Alle vergleichen <ArrowRight className="h-3.5 w-3.5" /></span>
        </Link>
      </div>
    </div>
  );
}
