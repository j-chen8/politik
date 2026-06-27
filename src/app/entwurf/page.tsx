/**
 * Übersicht der Startseiten-ENTWÜRFE — nur Vorschau (:3001), ändert die echte `/` nicht.
 */
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const ENTWUERFE = [
  { slug: "aufmacher", rang: "Platz 1 · Empfehlung", name: "Aufmacher des Tages", desc: "Ein großer Sagt-vs-Tut-Aufmacher als Blickfang + Bewegungsmesser, darunter Schlaglichter, Türen und kompakte Stöber-Regale. Catch mit Auffangnetz." },
  { slug: "bruchlinie", rang: "Platz 2", name: "Die Bruchlinie · Sagt ≠ Tut", desc: "Konflikt als Leitmotiv: großer grün/rot-Split-Hero, dann nur zugespitzte Reihen (knappste Votes, Gewinner/Verlierer), Türen als Sockel. Maximale Distinktion, höheres Risiko." },
  { slug: "bento", rang: "Platz 3", name: "Magazin-Bento", desc: "Asymmetrisches Kachel-Raster verschiedener Größen statt gleichförmiger Regale, Inhaltstypen gemischt. Rhythmus durch Größe." },
];

export default function EntwurfIndex() {
  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6 px-6 py-10 sm:px-9">
      <header>
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground sm:text-[30px]">Startseiten-Entwürfe</h1>
        <p className="mt-1 text-[15px] text-muted">Drei Catch-first-Richtungen zum Vergleich. Nur Vorschau — die echte Startseite bleibt unverändert.</p>
      </header>
      <div className="flex flex-col gap-3">
        {ENTWUERFE.map((e) => (
          <Link key={e.slug} href={`/entwurf/${e.slug}`}
            className="group flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600">
            <span className="text-[12px] font-bold uppercase tracking-wider text-muted">{e.rang}</span>
            <span className="flex items-center gap-2 text-[19px] font-semibold text-foreground">{e.name} <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" /></span>
            <p className="text-[14.5px] leading-relaxed text-muted">{e.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
