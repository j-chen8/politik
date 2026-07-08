/**
 * Geteilte Aufmacher-Bausteine für Dokument-Analysen — Kommissionsberichte
 * (/kommissionen/[slug]) und Vor-Parlaments-Analysen (/analyse/haushalt-2027):
 * dunkle „Worum es geht"-These-Kachel, „Wen es trifft" mit Härte-Ampel,
 * Kennzahl-Kacheln, Quelle-Karte. Aus der Kommissions-Detailseite extrahiert
 * (07.07.2026), damit „gleiches Design" echte Wiederverwendung ist und beide
 * Seiten synchron bleiben. Erwartetes Grid des Aufrufers:
 * `grid grid-cols-2 gap-3 lg:grid-cols-6 [grid-auto-rows:minmax(92px,auto)]`.
 */
import Link from "next/link";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";

/** Ampel-Farbe je Art/Härte einer Maßnahme (Punkt vor Betroffenen-Gruppen). */
export const artDot = (art?: string) =>
  art === "Kürzung" ? "bg-red-400 dark:bg-red-500/80"
  : art === "Belastung" ? "bg-amber-400 dark:bg-amber-500/75"
  : art === "Entlastung" || art === "Ausweitung" ? "bg-emerald-400 dark:bg-emerald-500/75"
  : "bg-zinc-300 dark:bg-zinc-600";

/** Legenden-Text je Härte/Art — Aufrufer zeigen nur vorkommende Arten. */
export const ART_LEGENDE: Record<string, string> = {
  "Kürzung": "Kürzung (weniger / später)",
  "Belastung": "Belastung (mehr / neu zahlen)",
  "Entlastung": "Entlastung / mehr Leistung",
  "Ausweitung": "Ausweitung / mehr Leistung",
  "strukturell": "struktureller Umbau",
};

/** Dunkle Anker-Kachel „Worum es geht" — Inhalt kommt vom Aufrufer
 *  (typisch: <TheseZahl/>, alternativ Eckpunkte-Liste oder Fließtext).
 *  `className` überschreibt die Layout-Klassen (Default = Bento-Grid-Spans);
 *  `rahmen={false}` lässt Radius+Rand weg (randlos in eine Eltern-Karte
 *  eingepasst, z.B. linke Hälfte der Startseiten-Aufmacher-Karte).
 *  Die Optik (dunkle Platte + Label) bleibt überall identisch. */
export function TheseKachel({ children, className, rahmen = true }: { children: ReactNode; className?: string; rahmen?: boolean }) {
  return (
    <div className={`flex flex-col gap-4 bg-foreground p-5 text-background ${rahmen ? "rounded-2xl border border-border" : ""} ${className ?? "col-span-2 row-span-2 lg:col-span-4"}`}>
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] opacity-60">Worum es geht</span>
      <div className="flex flex-1 flex-col justify-center">{children}</div>
    </div>
  );
}

/** Leit-Kennzahl in der These-Kachel: eine große Zahl + ein Satz.
 *  `zahlClass` skaliert die Zahl für schmalere Container (Default = Bento-Größe). */
export function TheseZahl({ wert, text, zahlClass }: { wert: string; text: string; zahlClass?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <span className={`num font-bold leading-[0.95] ${zahlClass ?? "text-[44px] sm:text-[56px]"}`}>{wert}</span>
      <p className="max-w-xl text-[15px] leading-snug opacity-90 sm:text-[16px]">{text}</p>
    </div>
  );
}

export interface BetroffenZeile {
  gruppe: string;
  /** Art/Härte für die Ampel (Kürzung/Belastung/Entlastung/Ausweitung/…). */
  art?: string;
  /** Kurz-Label rechts, z.B. "+32,7 % Etat" oder "2× Belastung". */
  label?: string;
}

/** „Wen es trifft" — Betroffenen-Gruppen mit Härte-Ampel + dynamischer Legende. */
export function WenEsTrifftKachel({ zeilen }: { zeilen: BetroffenZeile[] }) {
  if (!zeilen.length) return null;
  const legendeArten = [...new Set(zeilen.map((z) => z.art))].filter(
    (a): a is string => Boolean(a) && Boolean(ART_LEGENDE[a as string])
  );
  return (
    <div className="col-span-2 row-span-2 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 lg:col-span-2">
      <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Wen es trifft</span>
      <div className="flex flex-1 flex-col justify-center gap-2.5">
        {zeilen.map((z) => (
          <div key={z.gruppe} className="flex items-baseline gap-2.5">
            <span className={`relative top-[3px] h-2.5 w-2.5 shrink-0 rounded-full ${artDot(z.art)}`} />
            <span className="text-[15px] font-medium leading-snug text-foreground">{z.gruppe}</span>
            {z.label && <span className="ml-auto shrink-0 text-[12px] text-muted">{z.label}</span>}
          </div>
        ))}
      </div>
      {legendeArten.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-border pt-2.5 text-[11px] text-muted">
          {legendeArten.map((art) => (
            <span key={art} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${artDot(art)}`} /> {ART_LEGENDE[art]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Zahlen-Kachel unterhalb der These — halbe Breite für lesbare Labels. */
export function KennzahlKachel({ wert, label }: { wert: string; label: string }) {
  return (
    <div className="col-span-2 flex flex-col justify-center gap-1 rounded-2xl border border-border bg-card p-4 lg:col-span-3">
      <span className="num text-[30px] font-semibold leading-none text-foreground">{wert}</span>
      <span className="text-[13px] leading-snug text-foreground/80">{label}</span>
    </div>
  );
}

/** Quelle-Karte am Seitenende: Link aufs Original-Dokument + Meta-Zeile. */
export function QuelleKarte({ href, titel, meta }: { href: string; titel: string; meta: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4">
      <FileText className="h-5 w-5 shrink-0 text-muted" />
      <div className="flex flex-col">
        <Link href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:underline">
          {titel}
        </Link>
        <span className="text-[12px] text-muted">{meta}</span>
      </div>
    </div>
  );
}
