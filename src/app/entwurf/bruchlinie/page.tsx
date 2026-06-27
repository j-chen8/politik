/**
 * ENTWURF 2 — „Die Bruchlinie · Sagt ≠ Tut" (Platz 2). Konflikt als Leitmotiv:
 * großer Split-Hero, dann nur zugespitzte Reihen, Türen als Sockel. Echte Daten.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Rail } from "@/components/Rail";
import { getBundestagLandingSnapshot, getFraktionSitze } from "@/lib/db";
import { getThemenStruktur } from "@/lib/themen-blatt";
import {
  VoteBar, VoteCard, ParteienRow, ParteiLogo,
  getEntwurfHero, lagerAusFraktionen, FELD_KURZ, cardCls,
} from "../_bausteine";

export default function EntwurfBruchlinie() {
  const s = getBundestagLandingSnapshot();
  const sitze = getFraktionSitze();
  const hero = getEntwurfHero();
  const lager = hero ? lagerAusFraktionen(hero.fraktionen) : null;
  const knappste = [...s.latestVotes.filter((v) => v.type === "namentlich")]
    .sort((a, b) => Math.abs(a.yes - a.no) - Math.abs(b.yes - b.no))
    .slice(0, 8);

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-9 px-6 py-8 sm:px-9 lg:px-12">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-foreground">Der Widerspruch der Woche</p>

      {/* SPLIT-HERO: SAGT ≠ TUT */}
      {hero ? (
        <Link href={`/parteien/feld/${hero.slug}`} className="group relative grid overflow-hidden rounded-3xl border-2 border-foreground/10 md:grid-cols-2">
          {/* SAGT (grün) */}
          <div className="flex flex-col gap-4 bg-emerald-50 p-7 dark:bg-emerald-950/30 md:p-9">
            <span className="text-[12px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Sagt — im Programm</span>
            <div className="h-8"><ParteiLogo slug={hero.parteiSlug} partei={hero.partei} className="h-8" /></div>
            <p className="text-[22px] font-semibold leading-snug text-foreground md:text-[25px]">„{hero.zitat}"</p>
            {hero.seite && <p className="num mt-auto text-[12px] text-emerald-800/70 dark:text-emerald-300/60">Wahlprogramm, S. {hero.seite}</p>}
          </div>
          {/* TUT (rot) */}
          <div className="flex flex-col gap-4 border-t-2 border-foreground/10 bg-red-50 p-7 dark:bg-red-950/30 md:border-l-2 md:border-t-0 md:p-9">
            <span className="text-[12px] font-bold uppercase tracking-wider text-red-700 dark:text-red-400">Tut — so abgestimmt</span>
            <p className="text-[16px] font-medium leading-snug text-foreground">{hero.betreff}</p>
            <p className="text-[19px] font-bold text-foreground">
              {hero.partei} stimmte{" "}
              <span className={hero.richtungEffektiv === "dafür" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>
                {hero.richtungEffektiv === "dafür" ? "DAFÜR" : hero.richtungEffektiv === "dagegen" ? "DAGEGEN" : "ENTHALTEN"}
              </span>
            </p>
            <div className="mt-auto"><VoteBar yes={hero.bar.yes} no={hero.bar.no} abstain={hero.bar.abstain} real={false} flip={hero.beschlussAblehnung} size="lg" /></div>
            <span className="inline-flex w-fit items-center gap-1 text-[13px] font-medium text-muted transition-colors group-hover:text-foreground">
              Feld: {FELD_KURZ.get(hero.feld) ?? hero.feld} — Widerspruch auflösen <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
          {/* ≠ in der Mitte */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-foreground/15 bg-background text-[26px] font-black text-foreground shadow-lg">≠</span>
          </div>
        </Link>
      ) : (
        <div className={cardCls}><p className="text-muted">Kein Sagt-vs-Tut-Fall verfügbar.</p></div>
      )}

      {/* AUF DER KIPPE */}
      {knappste.length > 0 && (
        <Rail title="Auf der Kippe — die knappsten Abstimmungen" href="/abstimmungen" cardWidth="w-[340px]"
          items={knappste.map((v) => <VoteCard key={v.id} v={v} sitze={sitze} />)} />
      )}

      {/* GEWINNER & VERLIERER */}
      {lager && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted">Gewinner & Verlierer der letzten Abstimmung</p>
          <p className="mt-1 text-[15px] font-medium leading-snug text-foreground">{hero?.betreff}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50/70 p-4 dark:bg-emerald-950/20">
              <p className="mb-2 text-[12px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Dafür</p>
              <div className="flex flex-wrap gap-2">{lager.dafuer.map((p) => <span key={p.slug} className="flex h-9 items-center rounded-lg bg-white px-2 ring-1 ring-black/10"><ParteiLogo slug={p.slug} partei={p.partei} className="h-5" /></span>)}</div>
            </div>
            <div className="rounded-2xl bg-red-50/60 p-4 dark:bg-red-950/20">
              <p className="mb-2 text-[12px] font-bold uppercase text-red-700 dark:text-red-400">Dagegen</p>
              <div className="flex flex-wrap gap-2">{lager.dagegen.map((p) => <span key={p.slug} className="flex h-9 items-center rounded-lg bg-white px-2 ring-1 ring-black/10"><ParteiLogo slug={p.slug} partei={p.partei} className="h-5" /></span>)}</div>
            </div>
          </div>
        </section>
      )}

      {/* TÜREN als Sockel */}
      <div className="mt-2 border-t border-border pt-6">
        <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-muted">Lieber stöbern</p>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {getThemenStruktur().map((t) => (
              <Link key={t.slug} href={`/themen?feld=${encodeURIComponent(t.slug)}`}
                className="rounded-full border border-border bg-card px-3.5 py-2 text-[14px] font-medium text-foreground transition-colors hover:border-zinc-300 dark:hover:border-zinc-600">{t.name}</Link>
            ))}
          </div>
          <ParteienRow />
        </div>
      </div>
    </div>
  );
}
