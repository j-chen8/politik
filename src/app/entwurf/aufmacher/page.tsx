/**
 * ENTWURF — „Aufmacher des Tages", gespeist vom MANUELLEN Pick (/entwurf/picker)
 * aus dem täglichen Salienz-Ranking. Vorschau-Route, ändert die echte `/` NICHT.
 * Echte Daten. Sagt/Tut verworfen → kein getEntwurfHero mehr.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Rail } from "@/components/Rail";
import { MediaAppearanceCard } from "@/components/MediaAppearanceCard";
import { getAufmacherPick, getBundestagLandingSnapshot, getFraktionSitze } from "@/lib/db";
import { getVisibleAppearances } from "@/lib/media-appearances";
import { getThemenStruktur } from "@/lib/themen-blatt";
import { VoteBar, VoteCard, GesetzCard, AnfrageCard, ParteienRow, cardCls } from "../_bausteine";

export default function EntwurfAufmacher() {
  const pick = getAufmacherPick();
  const s = getBundestagLandingSnapshot();
  const sitze = getFraktionSitze();
  const interviews = getVisibleAppearances().sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, 12);
  const foto = interviews[0];
  const namentlich = s.latestVotes.filter((v) => v.type === "namentlich");
  const knappste = namentlich.length ? namentlich.reduce((a, b) => (Math.abs(a.yes - a.no) <= Math.abs(b.yes - b.no) ? a : b)) : null;

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-6 py-8 sm:px-9 lg:px-12">
      <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" /> Aufmacher des Tages
      </p>

      {pick ? (
        <Link href={`/parteien/feld/${pick.slug}`} className="group flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-card p-7">
          <span className="text-[12px] font-bold uppercase tracking-wider text-muted">{pick.themenfeld}</span>
          {pick.headline && <h1 className="text-[26px] font-semibold leading-tight text-foreground sm:text-[30px]">{pick.headline}</h1>}
          {pick.summary && <p className="max-w-3xl text-[16px] leading-relaxed text-foreground/90">{pick.summary}</p>}
          {pick.ds && (
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <p className="text-[12px] uppercase tracking-wider text-muted">Im Bundestag dazu</p>
              <p className="text-[15px] font-medium text-foreground">{pick.ds.titel}</p>
              <p className="num text-[12px] text-muted">Drucksache {pick.ds.nr}{pick.ds.datum ? ` · ${pick.ds.datum}` : ""}</p>
            </div>
          )}
          {pick.vote && (
            <div className="rounded-xl border border-border bg-background/60 p-4">
              <p className="text-[15px] font-medium text-foreground">{pick.vote.label}</p>
              <div className="mt-2"><VoteBar yes={pick.vote.yes} no={pick.vote.no} abstain={pick.vote.abstain} real size="lg" /></div>
            </div>
          )}
          <span className="inline-flex w-fit items-center gap-1 text-[13px] font-medium text-muted group-hover:text-foreground">Feld auflösen <ArrowRight className="h-3.5 w-3.5" /></span>
        </Link>
      ) : (
        <div className="rounded-3xl border border-dashed border-border bg-card p-7">
          <p className="text-[15px] text-muted">Aufmacher noch nicht gesetzt — im <Link href="/entwurf/picker" className="font-medium text-foreground underline">Picker</Link> aus dem Tages-Ranking wählen.</p>
        </div>
      )}

      {/* Schlaglichter */}
      <section className="grid gap-4 md:grid-cols-2">
        {foto && <MediaAppearanceCard appearance={foto} />}
        {knappste && (
          <div className={cardCls}>
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted">Knappste Abstimmung</p>
            <p className="text-[15px] font-semibold leading-snug text-foreground">{knappste.label}</p>
            <div className="mt-auto pt-2">
              <VoteBar yes={knappste.yes} no={knappste.no} abstain={knappste.abstain} real />
              <p className="num mt-1 text-[12px] text-muted">Abstand: {Math.abs(knappste.yes - knappste.no)} Stimmen</p>
            </div>
          </div>
        )}
      </section>

      {/* Türen */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">Themenfelder</h2>
        <div className="flex flex-wrap gap-2">
          {getThemenStruktur().map((t) => (
            <Link key={t.slug} href={`/themen?feld=${encodeURIComponent(t.slug)}`} className="rounded-full border border-border bg-card px-3.5 py-2 text-[14px] font-medium text-foreground transition-colors hover:border-zinc-300 dark:hover:border-zinc-600">{t.name}</Link>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">Parteien</h2>
        <ParteienRow />
      </section>

      {/* Stöber-Regale */}
      <Rail title="Zuletzt abgestimmt" href="/abstimmungen" cardWidth="w-[340px]" items={s.latestVotes.map((v) => <VoteCard key={v.id} v={v} sitze={sitze} compact />)} />
      <Rail title="Neue Gesetzentwürfe" href="/gesetze" cardWidth="w-[300px]" items={s.latestGesetzentwuerfe.map((g) => <GesetzCard key={g.drucksacheNr} g={g} />)} />
      <Rail title="Aktuelle Interview-Analysen" href="/medien" cardWidth="w-[320px]" items={interviews.map((a) => <MediaAppearanceCard key={a.id} appearance={a} />)} />
      <Rail title="Neue Kleine Anfragen" href="/anfragen" cardWidth="w-[320px]" items={s.latestAnfragen.map((a) => <AnfrageCard key={a.drucksacheNr} a={a} />)} />
    </div>
  );
}
