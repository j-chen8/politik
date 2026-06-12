"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { DigitalBlattEcht, StrukturOber, StrukturUnter } from "@/lib/themen-blatt";
import { unterSlug as mkUnterSlug } from "@/lib/themen-struktur";
import { type LucideIcon, FileText, Mic, Vote, Landmark, X } from "lucide-react";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import { partyColor } from "@/lib/party-colors";

/**
 * DUMMY-VORSCHAU der Themen-Browse-Logik, um die Klick-Belohnung zu prüfen BEVOR
 * die LLM-Klassifikation läuft. Die Datenform hier IST die Spec.
 *
 * Leitlogik (User 2026-06-09, REVIDIERT): NUR NOCH 2 KLICK-FLÄCHEN statt 3 Ebenen —
 * die drei Ebenen waren das Durchklick-Problem. Auswahl (Feld → Unterthema) ist EIN
 * Master-Detail-Bildschirm: links die Oberthemen, rechts (Desktop) bzw. darunter
 * aufklappend (Mobile = Akkordeon) die Unterthemen des gewählten Felds. Beide bleiben
 * STILL — nur Namen, kein Inhalt. Auswahl ≠ Inhalt; „Menge"/Volumen NICHT foregrounded.
 *
 * Blatt = Unterthema. Erst HIER: Sitzungen + Abstimmungen + „Gerade aktiv". Spezifische
 * Themen sind FILTER darauf (keine eigenen Seiten): nur ~Anker sichtbar, Rest über
 * Eingrenzen-Suche / "mehr"; Tag-Klick re-fokussiert den Inhalt.
 *
 * Das NETZ (Querverbindungen) lebt NICHT am Blatt (User 2026-06-10 — eine
 * „Verbindet sich mit"-Sektion hier passte nicht): Es gehört auf die DOKUMENT-
 * Detailseite — eine Drucksache zeigt dort ihre spezifischen Themen X·Y·Z als
 * Chips, und DIE sind die Brücken zwischen den Feldern.
 */

// ── Datenmodell (= Daten-Spec) ──────────────────────────────────────────────
// worum/ergebnis nur bei Abstimmungen: „Worum geht es?" existiert als Feature (Vote-
// Kontext live seit 2026-05-15), das Ergebnis kommt aus den Vote-Daten — beides gratis.
// tags = die spezifischen Themen-Tags des Items (aus der geplanten Tag-Klassifikation).
type CatchItem = {
  titel: string; typ: "Drucksache" | "Rede" | "Abstimmung"; datum: string; einzeiler: string;
  worum?: string; ergebnis?: { ja: number; nein: number; enthaltung: number }; tags?: string[];
  // Für die In-Place-Vorschau (Karte expandiert aufs Grid, User 2026-06-11):
  // vorschau = längerer Abriss (echter Bau: LLM-Zusammenfassung, liegt für 4.811 BT-DS
  // vor); redner = wer die Rede hielt; stand/standDetail = DIP-Verfahrensstand
  // (echter Bau: dip_ds_vorgaenge, seit 2026-06-11 in der DB).
  vorschau?: string; redner?: string; stand?: 0 | 1 | 2 | 3; standDetail?: string;
  // echte Daten: stabile ID (Keys + &doc=-Param), ISO-Datum (Sortierung), Detail-Link,
  // Handzeichen-Fraktionsvoten + Ausgang
  id?: string; iso?: string; href?: string; fraktionen?: Record<string, string>; outcome?: string;
};
type Tag = { name: string; anker?: boolean; catch?: CatchItem[] };
// Wer das Thema im Plenum trägt — rein deskriptiv: Reden zum Feld / Reden gesamt
// (Spezialisierung zeigt sich, wird aber nicht etikettiert) + Ausschuss-Rolle als
// Kontext. Methodik existiert: scripts/analyse-themenfeld.ts (landtag-Branch) —
// Reden-Klassifikation × Stammdaten × committee_memberships, alles ID-Join, kein LLM.
// themen = die häufigsten spezifischen Themen der Feld-Reden dieser Person (derivativ
// aus der Tag-Klassifikation × redner_id — kein eigener LLM-Lauf).
type KopfRede = { id: string; datum: string; einzeiler: string; href: string; tags?: string[] };
type Kopf = { politicianId?: number; vorname: string; nachname: string; partei: string; reden: number; gesamt: number; rolle?: string; themen?: string[]; photoUrl?: string | null; letzteReden?: KopfRede[] };
// Blatt-Daten (aus dem Server-Loader, ad hoc zusammengesetzt)
type Unterthema = { name: string; voteThema?: string; beschreibung?: string; tags?: Tag[]; catch: CatchItem[]; koepfe?: Kopf[] };

// Plenarsitzungen mit Bezug zum Unterthema (echt: Sitzungen mit Feld-Reden)
type Sitzung = { nr: number; datum: string; tops: string; href?: string };

// Gesetzentwürfe im Verfahren (Dummy). Im echten Bau: dokumenttyp-Klassifikation
// (existiert) + Verfahrensstand aus der Drucksachen-Latenz-Pipeline (existiert:
// Antrag→Ausschuss→Plenum-Timeline pro DS). stand: 0=eingebracht · 1=im Ausschuss ·
// 2=vor Schlussabstimmung. Rein faktischer Verfahrensstand, keine Wertung.
// ⚠️ DATEN-EHRLICHKEIT (geprüft 2026-06-11): Der Verfahrensstand-Stepper braucht für
// den BUNDESTAG eine NEUE Datenquelle — im Bestand gibt es kaum typisierte Gesetz-
// entwürfe (3) und keine Überweisungs-/Beschlussempfehlungs-Daten; nur DS↔Abstimmung-
// Links (121, drucksache_polls) existieren. Saubere Quelle wäre die DIP-API des
// Bundestags (Vorgangsschritte: Überweisung, Beschlussempfehlung, Lesungen). Berlin
// hätte die Stationen heute schon (935 Beschlussempfehlungen + TOP-Daten). Der
// Stepper bleibt im Dummy als ZIEL-Spec — er ist der erste identifizierte Neu-Daten-
// Bedarf dieser Seite.
// Die Gesetzentwürfe-Reihe speist sich aus dem Dokumenten-Pool: Drucksachen mit
// `stand` (DIP-Verfahrensstand) = „im Verfahren". 4 Phasen wie der echte Stepper
// auf /aktivitaeten/[ds-nr] und die /gesetzentwuerfe-Seite (DIP-Vorgangsdaten):
// Eingebracht → Bundestag → Bundesrat → In Kraft; die Binnenphase („im Ausschuss",
// „Beschlussempfehlung liegt vor") + Wartezeit steht als standDetail am Punkt.
const GESETZ_STUFEN = ["Eingebracht", "Bundestag", "Bundesrat", "In Kraft"] as const;

const ANDERE_OBERTHEMEN: { name: string; teaser: string[] }[] = [
  { name: "Innere Sicherheit & Recht", teaser: ["Polizei", "Extremismus", "Justiz", "Datenschutz"] },
  { name: "Bauen & Wohnen", teaser: ["Mieten", "Wohnungsbau", "Bodenrecht"] },
  { name: "Verkehr & Infrastruktur", teaser: ["Bahn", "Straße", "E-Mobilität"] },
  { name: "Soziales & Gesundheit", teaser: ["Pflege", "Rente", "Krankenversicherung"] },
  { name: "Umwelt & Energie", teaser: ["Klimaschutz", "Energiewende", "Artenschutz"] },
  { name: "Migration & Integration", teaser: ["Asyl", "Aufenthaltsrecht", "Einbürgerung"] },
  { name: "Außen & Verteidigung", teaser: ["Bundeswehr", "NATO", "Ukraine"] },
  { name: "Bildung & Forschung", teaser: ["Schule", "Hochschule", "Wissenschaft"] },
];

// ── Bausteine ───────────────────────────────────────────────────────────────
// Inline-SVGs statt Emoji/Unicode-Glyphen (🔍/▾ rendern auf vielen Systemen als
// Tofu-Kästchen — sah billig aus).
function IconSearch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}
function IconChevron({ open, className = "" }: { open: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`${className} transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
function IconArrow({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Display-Schrift (Bricolage Grotesque, in page.tsx geladen) für Headlines.
const DISPLAY = "font-[family-name:var(--font-display)]";
// Weiche Flächen-Grammatik: Schatten + Radius statt Rahmen.
const SOFT_CARD = "rounded-3xl bg-white/90 shadow-[0_2px_24px_-14px_rgba(20,20,45,0.22)] ring-1 ring-zinc-900/[0.05] backdrop-blur-sm dark:bg-zinc-900/60 dark:ring-white/[0.06]";

function Teaser({ items }: { items: string[] }) {
  // Einzeilig + truncate → jede Karte hat dieselbe Untertitel-Höhe (kein 2-Zeilen-Umbruch).
  return <p className="mt-1.5 truncate text-[12.5px] leading-snug text-zinc-400 dark:text-zinc-500">{items.join(" · ")}</p>;
}

// Typ-Unterscheidung: icon-geführt + EIN dezenter Farbakzent (kein voller bunter Badge —
// volle Badges fand der User früher „überladen"). Icon trägt die Farbe, Text bleibt grau.
const TYP_META: Record<CatchItem["typ"], { Icon: LucideIcon; color: string }> = {
  Drucksache: { Icon: FileText, color: "text-zinc-500 dark:text-zinc-400" },
  Rede: { Icon: Mic, color: "text-zinc-500 dark:text-zinc-400" },
  Abstimmung: { Icon: Vote, color: "text-zinc-500 dark:text-zinc-400" },
};

function TypEyebrow({ c, className = "" }: { c: CatchItem; className?: string }) {
  const m = TYP_META[c.typ];
  return (
    <p className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 ${className}`}>
      <m.Icon className={`h-3.5 w-3.5 shrink-0 ${m.color}`} strokeWidth={2.25} />
      <span>{c.typ} · {c.datum}</span>
    </p>
  );
}

// Weiche Karte: viel Radius, sanfter Schatten, hebt beim Hover an. Typ als Icon+Farbe.
// Klick öffnet die In-Place-Vorschau (kein Seitenwechsel) — Bleib-auf-der-Seite-Regel.
function CatchCard({ c, onOpen }: { c: CatchItem; onOpen?: () => void }) {
  return (
    <div role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(); } }}
      className={`group flex min-h-[180px] cursor-pointer flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_-18px_rgba(20,20,45,0.32)] ${SOFT_CARD}`}>
      <TypEyebrow c={c} />
      <p className="mt-2.5 line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">{c.titel}</p>
      <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.einzeiler}</p>
    </div>
  );
}

// In-Place-Vorschau (User 2026-06-11): Klick auf eine Karte expandiert sie auf die
// Fläche des 3×4-Grids — man bleibt auf der Seite, die Sektionshöhe bleibt stabil
// (gleiche Logik wie die Ghost-Zellen). Erst der bewusste CTA-Klick führt auf die
// Detailseite. Schließen: X, Esc oder Browser-Back (Zustand lebt als &doc= in der
// URL → teilbar). ‹ › blättert durch die Einträge der aktuellen Liste (Scan-Flow,
// ersetzt schließen-suchen-klicken). Inhalt rechnet sich aus Bestand: LLM-Zusammen-
// fassung (vorschau), Tag-Klassifikation (tags), DIP-Verfahrensstand (stand), Redner.
function DocPreview({ c, pos, total, onClose, onPrev, onNext }: {
  c: CatchItem; pos: number; total: number; onClose: () => void; onPrev: () => void; onNext: () => void;
}) {
  const navBtn = "flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 ring-1 ring-zinc-900/10 transition hover:bg-zinc-900/[0.05] hover:text-zinc-700 dark:ring-white/15 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200";
  return (
    <div key={c.titel} className={`fade-quick relative mt-6 flex min-h-[780px] flex-col p-8 md:p-10 ${SOFT_CARD}`}>
      <div className="flex items-start justify-between gap-4">
        <TypEyebrow c={c} />
        <button onClick={onClose} aria-label="Vorschau schließen"
          className="-mr-2 -mt-2 rounded-full p-2 text-zinc-400 transition hover:bg-zinc-900/[0.06] hover:text-zinc-700 dark:hover:bg-white/[0.08] dark:hover:text-zinc-200">
          <X className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>
      <h3 className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-[1.65rem] font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">{c.titel}</h3>
      {c.redner && (
        <p className="mt-2.5 text-[13.5px] text-zinc-500 dark:text-zinc-400">
          Rede von <span className="font-semibold text-zinc-700 dark:text-zinc-200">{c.redner}</span>
        </p>
      )}
      <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-300">{c.vorschau ?? c.worum ?? c.einzeiler}</p>
      {c.ergebnis && <div className="mt-7 max-w-md"><ErgebnisBar e={c.ergebnis} /></div>}
      {c.stand != null && (
        <div className="mt-7">
          <p className="flex items-center gap-2.5">
            <StandDots stand={c.stand} />
            <span className="text-[12.5px] font-medium text-zinc-600 dark:text-zinc-300">{GESETZ_STUFEN[c.stand]}</span>
          </p>
          {c.standDetail && <p className="mt-1.5 text-[12.5px] text-zinc-400">{c.standDetail}</p>}
        </div>
      )}
      <TagChips tags={c.tags} className="mt-5" />
      <div className="mt-auto flex items-center justify-between gap-4 pt-10">
        <Link href={c.href ?? "#"} className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-zinc-900 transition hover:gap-2.5 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300">
          Zur {c.typ}<IconArrow className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <button onClick={onPrev} aria-label="vorheriger Eintrag" className={navBtn}><IconArrow className="h-4 w-4 rotate-180" /></button>
          <span className="text-[12px] tabular-nums text-zinc-400">{pos} / {total}</span>
          <button onClick={onNext} aria-label="nächster Eintrag" className={navBtn}><IconArrow className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

// Spezifische Themen-Tags eines Items als leise Chips (gleiche Form wie im Köpfe-
// Detail-Feld) — zeigen, in welchem Themen-Korn Abstimmung/Gesetzentwurf hängen.
function TagChips({ tags, className = "" }: { tags?: string[]; className?: string }) {
  if (!tags?.length) return null;
  return (
    <span className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((t) => (
        <span key={t} className="rounded-full bg-zinc-900/[0.04] px-2.5 py-1 text-[11.5px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">{t}</span>
      ))}
    </span>
  );
}

// Abstimmungs-Ergebnis als gestapelter Balken + Zahlen-Legende. Reine Fakten (Ja/Nein/
// Enthaltung), konventionelle Signalfarben, kein Framing. `slim` = Mini-Variante für Zeilen.
function ErgebnisBar({ e, slim = false }: { e: NonNullable<CatchItem["ergebnis"]>; slim?: boolean }) {
  const total = e.ja + e.nein + e.enthaltung;
  const pct = (n: number) => `${(100 * n) / total}%`;
  return (
    <div>
      <div className={`flex overflow-hidden rounded-full ${slim ? "h-1.5" : "h-2.5"}`}>
        <span style={{ width: pct(e.ja) }} className="bg-emerald-500" />
        <span style={{ width: pct(e.nein) }} className="bg-rose-400" />
        <span style={{ width: pct(e.enthaltung) }} className="bg-zinc-300 dark:bg-zinc-600" />
      </div>
      {!slim && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /><b className="font-semibold text-zinc-700 dark:text-zinc-200">{e.ja}</b> Ja</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-400" /><b className="font-semibold text-zinc-700 dark:text-zinc-200">{e.nein}</b> Nein</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-zinc-300 dark:bg-zinc-600" /><b className="font-semibold text-zinc-700 dark:text-zinc-200">{e.enthaltung}</b> Enthaltungen</span>
        </div>
      )}
    </div>
  );
}

// Featured = die AKTUELLE Abstimmung zum Thema, prominent oben (Blog-Form). Wird nur
// gerendert, wenn es überhaupt eine Abstimmung gibt — sonst weggelassen. Trägt als
// einzige Karte volle Tiefe: „Worum geht es?" + Ergebnis-Balken (beide aus Bestand).
function FeaturedVote({ c }: { c: CatchItem }) {
  return (
    <Link href={c.href ?? "#"} className={`group flex flex-col overflow-hidden p-8 ring-1 ring-zinc-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_56px_-20px_rgba(20,20,45,0.34)] md:p-9 ${SOFT_CARD}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {/* Typ-Wort raus — die Sektions-Überschrift sagt schon „Abstimmungen"; „Aktuell"
            begründet nur, warum DIESE Karte groß ist (die neueste). Icon trägt den Typ. */}
        <Vote className="h-4 w-4 shrink-0" strokeWidth={2.25} />Aktuell · {c.datum}
      </p>
      <p className={`${DISPLAY} mt-3 text-[1.45rem] font-bold leading-[1.12] tracking-[-0.02em] text-zinc-900 md:text-[1.7rem] dark:text-zinc-50`}>{c.titel}</p>
      {c.worum ? (
        <>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Worum geht es?</p>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.worum}</p>
        </>
      ) : (
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.einzeiler}</p>
      )}
      {(c.ergebnis || c.fraktionen) && (
        <div className="mt-auto pt-6">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Ergebnis{c.outcome ? ` · ${c.outcome}` : ""}</p>
          {c.ergebnis ? <ErgebnisBar e={c.ergebnis} /> : <FraktionRow f={c.fraktionen!} />}
        </div>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-zinc-900 dark:text-zinc-100">Zur Abstimmung<IconArrow className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
        <TagChips tags={c.tags} />
      </div>
    </Link>
  );
}

// Kompakte Abstimmungs-Zeile für die rechte Liste (ältere Votes). Text-forward, Hairline-
// getrennt (divide-y am Container), grüner Vote-Akzent wie die Featured-Karte.
function VoteRow({ c }: { c: CatchItem }) {
  return (
    // flex-1: die (zwei) Zeilen teilen sich die Spaltenhöhe — die rechte Liste füllt
    // damit immer exakt die Höhe der Featured-Karte, egal wie lang die Texte sind
    <Link href={c.href ?? "#"} className="group flex flex-1 flex-col justify-center py-5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <Vote className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />{c.datum}{c.outcome ? ` · ${c.outcome}` : ""}
      </p>
      <p className="mt-1.5 line-clamp-2 text-[14.5px] font-semibold leading-snug text-zinc-900 transition group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">{c.titel}</p>
      <p className="mt-1.5 line-clamp-4 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.einzeiler}</p>
      {c.ergebnis ? <div className="mt-3"><ErgebnisBar e={c.ergebnis} slim /></div>
        : c.fraktionen ? <div className="mt-3"><FraktionRow f={c.fraktionen} slim /></div> : null}
      <TagChips tags={c.tags} className="mt-3" />
    </Link>
  );
}

// Handzeichen-Votes haben keine Ja/Nein-Zahlen — nur Fraktionsvoten (Daten-Lücke:
// individuelle Stimmen gibt es nur bei namentlichen Abstimmungen). Daten-Farben
// wie auf /abstimmungen: grün = ja, rot = nein, amber = enthaltung.
const FRAKTIONS_ORDER = ["CDU/CSU", "SPD", "GRÜNE", "LINKE", "AfD"];
function FraktionRow({ f, slim = false }: { f: Record<string, string>; slim?: boolean }) {
  const pill = (vt: string) =>
    vt === "ja" ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
    : vt === "nein" ? "bg-rose-50 text-rose-800 ring-rose-200"
    : vt === "enthaltung" ? "bg-amber-50 text-amber-800 ring-amber-200"
    : "bg-zinc-50 text-zinc-500 ring-zinc-200";
  const icon = (vt: string) => (vt === "ja" ? "✓" : vt === "nein" ? "✗" : vt === "enthaltung" ? "—" : "?");
  const keys = [...FRAKTIONS_ORDER.filter((k) => f[k]), ...Object.keys(f).filter((k) => !FRAKTIONS_ORDER.includes(k))];
  return (
    <span className={`flex flex-wrap ${slim ? "gap-1" : "gap-1.5"}`}>
      {keys.map((k) => (
        <span key={k} title={`${k}: ${f[k]}`}
          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-medium ring-1 ${slim ? "text-[10px]" : "text-[10.5px]"} ${pill(f[k])}`}>
          <span className="font-semibold">{k}</span><span>{icon(f[k])}</span>
        </span>
      ))}
    </span>
  );
}

// Verfahrensstand als Mini-Stepper: 3 Punkte (eingebracht → Ausschuss → Schluss-
// abstimmung), gefüllt bis zum aktuellen Stand. Daneben benennt der Text die Stufe.
function StandDots({ stand }: { stand: number }) {
  return (
    <span className="flex items-center" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <Fragment key={i}>
          {i > 0 && <span className={`h-[2px] w-4 ${i <= stand ? "bg-zinc-500 dark:bg-zinc-400" : "bg-zinc-200 dark:bg-zinc-700"}`} />}
          <span className={`h-2 w-2 rounded-full ${i <= stand ? "bg-zinc-800 dark:bg-zinc-200" : "bg-zinc-300 dark:bg-zinc-600"}`} />
        </Fragment>
      ))}
    </span>
  );
}

// Gesetzentwurf-Karte: Eyebrow (Typ + Datum), Titel, unten bündig der Verfahrens-
// stand-Stepper. Nimmt ein Pool-Item (Drucksache mit `stand`) — gleiche Datenquelle
// wie der Feed.
function GesetzCard({ c }: { c: CatchItem }) {
  return (
    <Link href={c.href ?? "#"} className={`group flex min-h-[180px] cursor-pointer flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_-18px_rgba(20,20,45,0.32)] ${SOFT_CARD}`}>
      {/* Typ-Wort raus — die Reihen-Überschrift sagt schon „Gesetzentwürfe"; Icon + Datum reichen */}
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />{c.datum}
      </p>
      {/* feste 2-Zeilen-Höhe: kurze Titel reservieren die zweite Zeile, lange werden
          gekappt → Tags + Stepper liegen in allen Karten auf derselben Ebene */}
      <p className="mt-2 min-h-[2.75em] text-[14.5px] font-semibold leading-snug text-zinc-900 transition line-clamp-2 group-hover:text-zinc-600 dark:text-zinc-50 dark:group-hover:text-zinc-300">{c.titel}</p>
      <TagChips tags={c.tags} className="mt-2.5" />
      {/* Fest zweizeilig (einheitlich über alle Karten): Zeile 1 = Stepper + Phase,
          Zeile 2 = Binnenphase/Wartezeit — reserviert auch ohne Detail, kein Umbruch-Flackern. */}
      <div className="mt-auto pt-3">
        <p className="flex items-center gap-2.5">
          <StandDots stand={c.stand ?? 0} />
          <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-300">{GESETZ_STUFEN[c.stand ?? 0]}</span>
        </p>
        <p className="mt-1.5 min-h-[17px] text-[12px] leading-snug text-zinc-400">{c.standDetail ?? ""}</p>
      </div>
    </Link>
  );
}

// Plenarsitzungen als Endlos-Karussell. Desktop: zeigt ~3 Karten, an beiden Rändern teasern
// die Nachbarkarten an (angeschnitten) → „hier geht's weiter"; flankiert von je einem Pfeil.
// LOOP: die Liste wird verdreifacht und die Scroll-Position bleibt in der MITTLEREN Kopie —
// driftet sie in eine Außenkopie, springt sie nach dem Scroll-Ende um exakt eine Kopie-Breite
// zurück (identische Pixel → unsichtbar). So läuft es in beide Richtungen endlos. Mobile:
// natives Wischen (Karten 260px), gleicher Loop.
// perView 3 (Default) = volle Breite mit Edge-Sliver-Teasern; perView 2 = kompakte
// Variante für die halbe Reihe (keine Sliver — die Pfeile sind dort der „mehr"-Hinweis,
// und das Landmark-Icon wandert auf die Titel-Karte daneben statt auf jede Karte).
function SitzungenShelf({ sitzungen, perView = 3 }: { sitzungen: Sitzung[]; perView?: 2 | 3 }) {
  const compact = perView === 2;
  const scrollRef = useRef<HTMLDivElement>(null);
  const copyW = useRef(0);       // Breite EINER Kopie (n Karten + Lücken), exakt gemessen
  const stride = useRef(0);      // Breite einer Karte + Lücke
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const n = sitzungen.length;
  // Seiten-Indikator (–1– / –2– …): Seite = führende Karte / perView, aus der
  // Scroll-Position abgeleitet (Loop-fest via mod n).
  const [page, setPage] = useState(0);
  const pages = Math.ceil(n / perView);
  const updatePage = () => {
    const el = scrollRef.current;
    if (!el || !stride.current) return;
    const lead = Math.round((el.scrollLeft + (compact ? 0 : 28)) / stride.current);
    setPage(Math.min(pages - 1, Math.floor((((lead % n) + n) % n) / perView)));
  };

  const measure = () => {
    const el = scrollRef.current;
    if (!el || el.children.length < n + 1) return;
    const kids = el.children as HTMLCollectionOf<HTMLElement>;
    copyW.current = kids[n].offsetLeft - kids[0].offsetLeft;
    stride.current = kids[1].offsetLeft - kids[0].offsetLeft;
  };

  // Nach dem Scroll-Ende zurück in die mittlere Kopie holen (instant = unsichtbar).
  const recenter = () => {
    const el = scrollRef.current;
    const w = copyW.current;
    if (!el || !w) return;
    if (el.scrollLeft > w * 1.5) el.scrollLeft -= w;
    else if (el.scrollLeft < w * 0.5) el.scrollLeft += w;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();
    // Start in der mittleren Kopie; bei perView 3 um die Sliver-Breite (scroll-pl, 28px)
    // versetzt → snap rastet so, dass immer 3 volle Karten + je ein Sliver stehen
    el.scrollLeft = copyW.current - (compact ? 0 : 28);
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const onScroll = () => {
    updatePage();
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(recenter, 120);
  };

  const step = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth, behavior: "smooth" }); // eine Seite (~3 Karten)
  };

  // Flankierender Pfeil — Desktop only, neben den Karten. Loopt (nie ausgegraut).
  // Standardmäßig extrem transparent; voll sichtbar, sobald man über die Reihe hovert
  // (group/shelf) — der direkte Pfeil-Hover gibt zusätzlich Scale + Farbe.
  const arrowBtn = "hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-[0_6px_22px_-6px_rgba(20,20,45,0.4)] ring-1 ring-zinc-900/[0.06] backdrop-blur-sm opacity-15 transition duration-200 group-hover/shelf:opacity-100 hover:scale-105 hover:text-zinc-900 md:flex dark:bg-zinc-800/95 dark:text-zinc-200 dark:ring-white/10 dark:hover:text-zinc-50";

  return (
    <div>
    <div className="group/shelf flex items-center gap-3 md:gap-4">
      <button onClick={() => step(-1)} aria-label="nach links" className={arrowBtn}>
        <IconArrow className="h-4 w-4 rotate-180" />
      </button>
      <div ref={scrollRef} onScroll={onScroll}
        className={`flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${compact ? "" : "scroll-pl-7 [mask-image:linear-gradient(to_right,transparent,black_2.25rem,black_calc(100%-2.25rem),transparent)]"}`}>
        {[...sitzungen, ...sitzungen, ...sitzungen].map((s, i) => (
          <Link key={`${s.nr}-${i}`} href={s.href ?? "#"} aria-hidden={i < n || i >= n * 2 ? true : undefined}
            className={`group flex w-[260px] shrink-0 snap-start items-start gap-3.5 transition duration-300 hover:shadow-[0_16px_36px_-18px_rgba(20,20,45,0.3)] ${compact ? "p-4 md:w-[calc((100%-0.75rem)/2)]" : "p-5 md:w-[calc((100%-5rem)/3)]"} ${SOFT_CARD}`}>
            {!compact && (
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900/[0.05] text-zinc-500 dark:bg-white/[0.07] dark:text-zinc-400">
                <Landmark className="h-[18px] w-[18px]" strokeWidth={2} />
              </span>
            )}
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 whitespace-nowrap text-[14.5px] font-semibold text-zinc-900 dark:text-zinc-50">
                Sitzung {s.nr}<IconArrow className="h-4 w-4 shrink-0 text-zinc-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </span>
              <span className="block text-[12px] text-zinc-400">{s.datum}</span>
              <span className="mt-1.5 block truncate text-[12.5px] leading-snug text-zinc-500 dark:text-zinc-400">{s.tops}</span>
            </span>
          </Link>
        ))}
      </div>
      <button onClick={() => step(1)} aria-label="nach rechts" className={arrowBtn}>
        <IconArrow className="h-4 w-4" />
      </button>
    </div>
    {pages > 1 && (
      <p className="mt-3 text-center text-[12px] tracking-[0.2em] text-zinc-300 dark:text-zinc-600" aria-hidden>
        –<span className="mx-1 font-semibold text-zinc-500 dark:text-zinc-300">{page + 1}</span>–
      </p>
    )}
    </div>
  );
}

// Personen, die das Thema im Plenum tragen — als zentrierte Avatar-Reihe (User 2026-06-10):
// nur die Bilder, Hover/Fokus vergrößert + blendet den Nachnamen ein und schaltet das
// Detail-Feld darunter um (Partei · Reden · Rolle). Default = Person mit den meisten
// Reden, damit das Feld nie leer ist; Klick/Tap übernimmt auf Touch. KEIN „Experten"-
// Etikett, nur Fakten. Avatar = App-Konvention (Foto, sonst Partei-Farb-Initialen).
// Kurzformen für Partei-Chips + Bildunterschriften (voller Name sprengt die Breite).
const PARTEI_KURZ: Record<string, string> = { "BÜNDNIS 90/DIE GRÜNEN": "Grüne" };

const kopfKey = (p: Kopf) => `${p.vorname} ${p.nachname}`;

function KoepfeStrip({ koepfe }: { koepfe: Kopf[] }) {
  // Partei-Filter: rein deskriptive Eingrenzung (Gleichbehandlung — Chips entstehen
  // aus den Daten, Reihenfolge = Reihenfolge des Auftretens in der Lautstärke-Liste).
  const [partei, setPartei] = useState<string | null>(null);
  // EINZEILIG, kein Umbruch (User; „alle anzeigen"-Toggle wieder VERWORFEN — zerschoss
  // die Sektion): Endlos-Karussell wie die Sitzungs-Reihe. IMMER GENAU 5 volle Karten —
  // Kartenbreite = calc((100% − 2 Sliver − 4 Lücken)/5), dadurch sind die Edge-Teaser
  // links und rechts IMMER exakt gleich breit (symmetrisch, minimal). Gefilterte
  // Kurz-Listen (≤5) brauchen kein Karussell und stehen statisch zentriert.
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const parteien = [...new Set(koepfe.map((p) => p.partei))];
  const shown = partei ? koepfe.filter((p) => p.partei === partei) : koepfe;
  const k = shown.find((p) => kopfKey(p) === activeKey) ?? shown[0];
  const n = shown.length;
  const carousel = n > 5;

  const scrollRef = useRef<HTMLDivElement>(null);
  const copyW = useRef(0);
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const measure = () => {
    const el = scrollRef.current;
    if (!el || el.children.length < n + 1) return;
    const kids = el.children as HTMLCollectionOf<HTMLElement>;
    copyW.current = kids[n].offsetLeft - kids[0].offsetLeft;
  };
  const recenter = () => {
    const el = scrollRef.current;
    const w = copyW.current;
    if (!el || !w) return;
    if (el.scrollLeft > w * 1.5) el.scrollLeft -= w;
    else if (el.scrollLeft < w * 0.5) el.scrollLeft += w;
  };
  useEffect(() => {
    if (!carousel) return;
    const el = scrollRef.current;
    if (!el) return;
    measure();
    el.scrollLeft = copyW.current - 32;
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, carousel]);
  const onScroll = () => {
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(recenter, 120);
  };
  const step = (dir: 1 | -1) => scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: "smooth" });
  const arrowBtn = "hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-[0_6px_22px_-6px_rgba(20,20,45,0.4)] ring-1 ring-zinc-900/[0.06] backdrop-blur-sm opacity-15 transition duration-200 group-hover/shelf:opacity-100 hover:scale-105 hover:text-zinc-900 md:flex dark:bg-zinc-800/95 dark:text-zinc-200 dark:ring-white/10 dark:hover:text-zinc-50";

  const chip = (sel: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition ${sel
      ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20"
      : "bg-zinc-900/[0.05] text-zinc-600 hover:bg-zinc-900/[0.09] dark:bg-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.12]"}`;

  const renderKopf = (p: Kopf, i: number, clone = false) => {
    const sel = kopfKey(p) === kopfKey(k);
    // Hover/Fokus wählt fürs Detail-Feld aus (Desktop-Seite); KLICK führt zum
    // Profil (User 2026-06-11) — Dummy-Köpfe ohne id bleiben reine Auswahl-Buttons.
    const Tag: any = p.politicianId ? Link : "button";
    return (
      <Tag key={`${kopfKey(p)}-${i}`} aria-hidden={clone || undefined}
        {...(p.politicianId ? { href: `/politiker/${p.politicianId}` } : { onClick: () => setActiveKey(kopfKey(p)) })}
        onMouseEnter={() => setActiveKey(kopfKey(p))} onFocus={() => setActiveKey(kopfKey(p))}
        className={`flex w-40 shrink-0 snap-start flex-col items-center outline-none ${carousel ? "md:w-[calc((100%-9rem)/5)]" : ""}`}>
        <span className={`rounded-3xl transition-transform duration-300 ${sel ? "scale-[1.06] ring-2 ring-zinc-900/60 ring-offset-2 ring-offset-white dark:ring-zinc-200/70 dark:ring-offset-zinc-950" : "hover:scale-[1.04]"}`}>
          <PoliticianAvatar photoUrl={p.photoUrl ?? null} firstName={p.vorname} lastName={p.nachname} party={p.partei} size="2xl" />
        </span>
        <span className={`mt-3 block max-w-full truncate text-[13.5px] font-semibold transition-colors ${sel ? "text-zinc-900 dark:text-zinc-50" : "text-zinc-600 dark:text-zinc-300"}`}>{p.nachname}</span>
        <span className="block max-w-full truncate text-[11.5px] text-zinc-400">{PARTEI_KURZ[p.partei] ?? p.partei}</span>
      </Tag>
    );
  };

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center justify-center gap-2">
        <button onClick={() => { setPartei(null); setActiveKey(null); }} className={chip(!partei)}>Alle</button>
        {parteien.map((p) => (
          <button key={p} onClick={() => { setPartei(p === partei ? null : p); setActiveKey(null); }} className={chip(partei === p)}>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: partyColor(p) }} />
            {PARTEI_KURZ[p] ?? p}
          </button>
        ))}
      </div>
      {carousel ? (
        <div className="group/shelf flex items-center gap-3 md:gap-4">
          <button onClick={() => step(-1)} aria-label="nach links" className={arrowBtn}>
            <IconArrow className="h-4 w-4 rotate-180" />
          </button>
          {/* Rand-Fade exakt auf die 32px-Sliver abgestimmt (transparent → voll bei
              2.5rem): die Teaser-Köpfe lösen sich zum Rand hin auf, die 5 vollen Karten
              bleiben unberührt. (Sitzungs-Lehre: Maske breiter als der Sliver
              verschluckt ihn — hier ist der Sliver 32px, die Maske endet bei 40px.) */}
          <div ref={scrollRef} onScroll={onScroll}
            className="flex min-w-0 flex-1 snap-x snap-mandatory scroll-pl-8 gap-5 overflow-x-auto py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_2.5rem,black_calc(100%-2.5rem),transparent)]">
            {[...shown, ...shown, ...shown].map((p, i) => renderKopf(p, i, i < n || i >= n * 2))}
          </div>
          <button onClick={() => step(1)} aria-label="nach rechts" className={arrowBtn}>
            <IconArrow className="h-4 w-4" />
          </button>
        </div>
      ) : (
        // py-4 identisch zum Karussell-Scroller → der Abstand Filter↔Bilder springt
        // beim Wechsel Karussell ⇄ gefilterte Kurzreihe nicht (User-Befund).
        <div className="flex flex-wrap items-start justify-center gap-5 py-4 md:gap-8">
          {shown.map((p, i) => renderKopf(p, i))}
        </div>
      )}
      {/* Detail-Feld: die KARTE bleibt stehen, nur der INHALT crossfaded beim
          Personen-Wechsel (key auf dem inneren Wrapper — Karte mit key remountete
          sichtbar mit, das irritierte). min-h fängt Höhen-Differenzen ab. */}
      {/* feste Höhe: Text auf exakt 3 Zeilen geklemmt + Tag-Zeile immer reserviert →
          die Karte atmet beim Personenwechsel nicht (User 2026-06-11; 370px = 5 Text-Zeilen + 2-zeilige Ausschuss-Rolle) */}
      <div className={`mx-auto mt-7 min-h-[370px] max-w-2xl p-6 text-center ${SOFT_CARD}`}>
      <div key={kopfKey(k)} className="fade-quick">
        <p className="text-[15.5px] font-semibold text-zinc-900 dark:text-zinc-50">{k.vorname} {k.nachname}</p>
        <p className="mt-1 text-[12.5px] text-zinc-400">{k.partei}{k.rolle ? ` · ${k.rolle}` : ""}</p>
        <p className="mt-1.5 text-[13px] text-zinc-500 dark:text-zinc-400">
          Thema in <span className="font-semibold text-zinc-700 dark:text-zinc-200">{k.reden}</span> von {k.gesamt} Reden
        </p>
        {(k.themen?.length ?? 0) > 0 && (
          <>
            <p className="mt-3.5 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">Spricht vor allem zu</p>
            <p className="mt-1.5 flex flex-wrap justify-center gap-1.5">
              {k.themen!.map((t) => (
                <span key={t} className="rounded-full bg-zinc-900/[0.04] px-2.5 py-1 text-[11.5px] font-medium text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400">{t}</span>
              ))}
            </p>
          </>
        )}
        {/* Reden leben HIER bei der Person, nicht im Feed — Debatten-Kontexte taugen
            nicht als Karten-Titel (User 2026-06-11); die Person rahmt, die Zusammen-
            fassung trägt den Inhalt, der Link führt in die Sitzung. */}
        {(k.letzteReden?.length ?? 0) > 0 && (
          <>
            <p className="mt-4 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">Letzte Reden zum Thema</p>
            <div className="mt-2 space-y-1.5 text-left">
              {k.letzteReden!.map((r) => (
                <Link key={r.id} href={r.href}
                  className="group/rede block rounded-xl bg-zinc-900/[0.03] px-3.5 py-2.5 transition hover:bg-zinc-900/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.08]">
                  <span className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                    <Mic className="h-3 w-3 shrink-0" strokeWidth={2.25} />{r.datum}
                  </span>
                  <span className="mt-0.5 min-h-[8.15em] line-clamp-5 text-[12.5px] leading-relaxed text-zinc-600 transition group-hover/rede:text-zinc-900 dark:text-zinc-300 dark:group-hover/rede:text-zinc-100">{r.einzeiler}</span>
                  <span className="mt-1.5 flex min-h-[22px] flex-wrap gap-1.5">
                    {r.tags?.map((t) => (
                      <span key={t} className="rounded-full bg-zinc-900/[0.05] px-2 py-0.5 text-[10.5px] font-medium text-zinc-500 dark:bg-white/[0.07] dark:text-zinc-400">{t}</span>
                    ))}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
      </div>
    </div>
  );
}

// Dezente Sektions-Leiste am rechten Rand (nur am Blatt): drei Striche = drei Scroll-
// Stufen, der aktive ist länger + dunkel. Klick springt sanft zur Sektion.
function SectionRail({ active, labels, onJump }: { active: number; labels: string[]; onJump: (i: number) => void }) {
  return (
    <div className="fixed right-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-2.5 md:flex" aria-hidden>
      {labels.map((l, i) => (
        <button key={l} title={l} onClick={() => onJump(i)}
          className={`w-[3px] rounded-full transition-all duration-300 ${i === active ? "h-9 bg-zinc-900 dark:bg-zinc-100" : "h-5 bg-zinc-300/70 hover:bg-zinc-400 dark:bg-zinc-700"}`} />
      ))}
    </div>
  );
}

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-baseline justify-between">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-zinc-700 dark:text-zinc-200">{children}</h3>
      {hint && <span className="rounded-full bg-zinc-900/[0.04] px-2.5 py-0.5 text-[11px] font-medium text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500">{hint}</span>}
    </div>
  );
}

// ── Hauptkomponente ─────────────────────────────────────────────────────────
// URL ist die Quelle der Wahrheit (?feld=…&unter=…&thema=…). Geklickt wird über die
// native History-API → echte, teilbare URL + Back-Button, ABER kein Reload und kein
// Server-Roundtrip (Next synct pushState mit useSearchParams). Im echten Bau werden
// diese drei Parameter 1:1 zu Pfad-Segmenten /themen/<feld>/<unter>?thema=…
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Dummy-Behelf: Tag-Name in Wortanfänge zerlegen (≥4 Buchstaben, auf 6 gekappt = grobes
// Stemming: „Rechenzentren"→„rechen" trifft „Rechenzentren — Energieeffizienz") und damit
// den Dokumenten-Pool des Unterthemas filtern. Ersetzt im Dummy die echte Tag-Klassifikation.
function tagCatchFallback(tagName: string, pool: CatchItem[]): CatchItem[] {
  const tokens = tagName.toLowerCase().split(/[^a-zäöüß0-9]+/).filter((w) => w.length >= 4).map((w) => w.slice(0, 6));
  return pool.filter((c) => {
    const hay = `${c.titel} ${c.einzeiler}`.toLowerCase();
    return tokens.some((t) => hay.includes(t));
  });
}

// Eine vereinte Oberthemen-Liste fürs Master-Detail: Wirtschaft ist ausgebaut (echte
// Unterthemen-Objekte), die übrigen tragen nur ihre Teaser-Namen als Picker.
// Kurzformen nur für den Kachel-Scent (sonst sprengen lange Namen die Karte). Der
// volle Name bleibt überall sonst (Filter-Chip am Blatt etc.).
const KURZ: Record<string, string> = { "Künstliche Intelligenz": "KI" };

// Echte Digital-Daten (Server-Loader src/lib/themen-blatt.ts) → ein gemischter,
// datums-sortierter CatchItem-Pool: Votes + laufende GE (mit Stand) + Dokumente.
function echtToCatch(e: DigitalBlattEcht): CatchItem[] {
  const items: CatchItem[] = [
    ...e.votes.map((v): CatchItem => ({
      id: v.id, titel: v.titel, typ: "Abstimmung", datum: v.datum, einzeiler: v.einzeiler,
      worum: v.worum ?? undefined, tags: v.tags, iso: v.iso ?? undefined, href: v.href,
      fraktionen: v.fraktionen ?? undefined, outcome: v.outcome,
    })),
    ...e.gesetze.map((g): CatchItem => ({
      id: g.id, titel: g.titel, typ: "Drucksache", datum: g.datum, einzeiler: g.einzeiler,
      vorschau: g.vorschau ?? undefined, tags: g.tags, iso: g.iso ?? undefined, href: g.href,
      stand: g.stand, standDetail: g.standDetail,
    })),
    ...e.docs.map((d): CatchItem => ({
      id: d.id, titel: d.titel, typ: d.typ, datum: d.datum, einzeiler: d.einzeiler,
      vorschau: d.vorschau ?? undefined, redner: d.redner ?? undefined, tags: d.tags,
      iso: d.iso ?? undefined, href: d.href,
    })),
  ];
  return items.sort((a, b) => (b.iso ?? "").localeCompare(a.iso ?? ""));
}

// Passiver Vorschau-Ticker: alle spezifischen Themen laufen als Laufband durch (reine
// Scent-Vorschau, NICHT klickbar → kein Moving-Target-Problem). Zwei Kopien für die
// nahtlose Schleife; Rand-Fade via mask-image, damit es weich ausläuft statt hart
// abzuschneiden. Respektiert prefers-reduced-motion (steht dann still).
function ScentTicker({ items, paused }: { items: string[]; paused: boolean }) {
  const text = items.join("  ·  ");
  return (
    <div className="mt-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]" aria-hidden>
      {/* Pause beim Hovern per Inline-Style — Tailwind v4/Lightning CSS verschluckt
          eine `.group:hover .ticker-track`-Regel, also steuern wir es aus React. */}
      <div className="ticker-track flex whitespace-nowrap text-[12.5px] text-zinc-400 dark:text-zinc-500" style={{ animationPlayState: paused ? "paused" : "running" }}>
        <span className="pr-6">{text}</span>
        <span className="pr-6">{text}</span>
      </div>
    </div>
  );
}

// Unterthema-Karte: alle klickbar (echte Daten überall seit dem globalen Lauf).
// Scent-Ticker = Top-Tags des Clusters, Count-Badge = Live-Bestand.
function UnterCard({ u, onPick }: { u: StrukturUnter; onPick: (slug: string) => void }) {
  const [paused, setPaused] = useState(true);
  const scent = u.topTags.map((t) => KURZ[t] ?? t);
  const leer = u.count === 0;
  return (
    <button onClick={() => onPick(u.slug)}
      onMouseEnter={() => setPaused(false)} onMouseLeave={() => setPaused(true)}
      className={`group flex items-center justify-between gap-3 p-5 text-left transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(20,20,45,0.34)] ${leer ? "opacity-55" : "ring-2 ring-zinc-900/10 dark:ring-white/15"} ${SOFT_CARD}`}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="flex items-baseline gap-2">
          <span className="min-w-0 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">{u.name}</span>
          <span className="shrink-0 text-[11px] font-medium tabular-nums text-zinc-400">{u.count}</span>
        </span>
        {scent.length > 0 && <ScentTicker items={scent} paused={paused} />}
      </span>
      <IconArrow className="h-5 w-5 shrink-0 text-zinc-500 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
    </button>
  );
}

// Detail-Spalte: die Unterthemen des gewählten Oberthemas — STILL (Namen + Scent),
// alle klickbar, sortiert nach Bestand (neutral: Volumen).
function DetailPane({ ober, onPick, className = "" }: { ober: StrukturOber; onPick: (slug: string) => void; className?: string }) {
  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {ober.unterthemen.map((u) => <UnterCard key={`${u.feld}-${u.slug}`} u={u} onPick={onPick} />)}
      </div>
    </div>
  );
}

export function VorschauThemen({ struktur, blatt }: { struktur: StrukturOber[]; blatt: DigitalBlattEcht | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feld = searchParams.get("feld");
  const unterSlug = searchParams.get("unter");
  const activeTag = searchParams.get("thema");
  // Seite ist Teil der URL → teilbare/bookmarkbare Feed-Tiefe (&page=2)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  // ephemere UI-Zustände bleiben lokal (gehören nicht in eine teilbare URL)
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [searchFocus, setSearchFocus] = useState(false);

  // Ansicht aus der URL ableiten: Blatt, wenn der Server für ?feld=&unter= Daten
  // aufgelöst hat (Picker-Klicks aufs Blatt navigieren via Router → Server lädt).
  const isLeaf = !!blatt && !!unterSlug && mkUnterSlug(blatt.unterthema) === unterSlug;
  const FELDER = struktur.map((o) => ({ name: o.name, slug: o.slug, teaser: o.unterthemen.slice(0, 4).map((u) => KURZ[u.name] ?? u.name), ober: o }));
  const selFeld = feld ? FELDER.find((f) => f.slug === feld) ?? null : null;

  // beim Wechsel von Feld/Unterthema die ephemeren UI-Zustände zurücksetzen
  useEffect(() => { setQuery(""); setShowAll(false); }, [feld, unterSlug]);

  // Scroll-Anker für den Tag-Wechsel: über der Themen-Leiste kommen/gehen Sektionen
  // (z. B. Abstimmungen, wenn ein Tag keine hat) → die Seite wird kürzer/länger und
  // alles rutscht — fühlt sich wie Auto-Scroll an, obwohl scrollY gleich bleibt.
  // Deshalb: vor dem Wechsel die Viewport-Position der Leiste merken (pickTag), nach
  // dem Re-Render die Differenz wegscrollen → die Leiste bleibt optisch exakt stehen.
  const themenRef = useRef<HTMLDivElement>(null);
  const anchorTopRef = useRef<number | null>(null);
  function pickTag(next: string | null, replace = false) {
    anchorTopRef.current = themenRef.current?.getBoundingClientRect().top ?? null;
    nav({ thema: next }, replace);
  }
  useLayoutEffect(() => {
    if (anchorTopRef.current == null) return;
    const now = themenRef.current?.getBoundingClientRect().top;
    if (now != null) window.scrollBy(0, now - anchorTopRef.current);
    anchorTopRef.current = null;
  }, [activeTag]);

  // Dokument-Vorschau: Zustand lebt als &doc= in der URL (teilbar, Back schließt);
  // Esc schließt zusätzlich zu X und Browser-Back
  const docParam = searchParams.get("doc");
  useEffect(() => {
    if (!docParam) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") nav({ doc: null, page: searchParams.get("page") }); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [docParam, searchParams]);

  // 3-Screen-Mechanik (nur am Blatt): Paging am Sektionsende statt Stop-dann-Snap.
  // Das Mausrad wird NUR am Ende des Freibereichs einer Sektion abgefangen
  // (preventDefault): Die Seite bleibt stehen, das Rad-Delta zählt als Intent —
  // ab einer Raste (WHEEL_COMMIT) startet direkt die smooth-Fahrt zur nächsten/
  // vorigen Kante. Der Zwischenraum wird nie nativ gescrollt (User 2026-06-11:
  // „das Scrolling soll gar nicht stattfinden"). Innerhalb über-viewport-hoher
  // Sektionen und hinter der letzten Kante (Feed, Footer) bleibt Scrollen nativ.
  // Hochscrollen pagt symmetrisch an der Oberkante jeder Sektion. Nach jeder Fahrt
  // schluckt ein kurzer Cooldown den Trackpad-Nachlauf (sonst kettet Momentum
  // mehrere Sektionen aneinander). Scrollbar/Tastatur lösen kein wheel aus → für
  // sie bleibt der debounced Settle-Assist als Fallback. Derselbe Scroll-Listener
  // bestimmt die aktive Sektion für die Rand-Leiste.
  const screen1Ref = useRef<HTMLDivElement>(null);
  const screen2Ref = useRef<HTMLDivElement>(null);
  const screen3Ref = useRef<HTMLDivElement>(null);
  const screenRefs = [screen1Ref, screen2Ref, screen3Ref];
  const [activeScreen, setActiveScreen] = useState(0);
  useEffect(() => {
    if (!isLeaf) return;
    const refs = [screen1Ref, screen2Ref, screen3Ref];
    const OFFSET = 96;        // = scroll-mt-24 der Sektionen (Kante ruht unter der Navbar)
    const COMMIT_PX = 80;     // Fallback-Assist: so viel Rest-Position heißt „weiter"
    const WHEEL_COMMIT = 60;  // so viel Rad-Delta heißt „weiter" (1 Maus-Raste ≈ 100–120)
    const COOLDOWN_MS = 300;  // schluckt Trackpad-Momentum nach einer Fahrt
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lastY = window.scrollY;
    let dir = 1;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let animating = false;
    let animTarget = 0;
    let animStart = 0;
    let acc = 0;             // akkumuliertes Rad-Delta der laufenden Geste
    let lastWheelT = 0;
    let cooldownUntil = 0;

    // Kanten live messen — Layout ändert sich durch Filter/Pagination
    const measureStops = (y: number) => [0, ...[screen2Ref, screen3Ref].map((r) =>
      r.current ? Math.round(r.current.getBoundingClientRect().top + y - OFFSET) : Infinity)];
    const freeOf = (i: number) =>
      Math.max(0, (refs[i].current?.offsetHeight ?? 0) - (window.innerHeight - OFFSET));
    const go = (target: number) => {
      animating = true;
      animTarget = target;
      animStart = performance.now();
      window.scrollTo({ top: target, behavior: "smooth" });
    };

    // Paging direkt am Rad: greift, BEVOR gescrollt wird
    const onWheel = (e: WheelEvent) => {
      if (reduced || e.ctrlKey) return; // ctrl+Rad = Browser-Zoom, nie anfassen
      const now = performance.now();
      if (animating) {
        // Fahrt läuft → Rad schlucken (deterministisch ankommen); Notausstieg falls
        // die Animation still gestorben ist (z. B. Tab-Wechsel)
        if (now - animStart > 1200) { animating = false; cooldownUntil = now + COOLDOWN_MS; }
        else { e.preventDefault(); return; }
      }
      if (now < cooldownUntil) { e.preventDefault(); return; }
      const y = window.scrollY;
      const stops = measureStops(y);
      let i = 0;
      while (i + 1 < stops.length && y >= stops[i + 1] - 2) i++;
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; // Zeilen-Modus (Firefox) normalisieren
      // Gesten-Pause oder Richtungswechsel resettet den Akkumulator
      if (now - lastWheelT > 250 || (acc !== 0 && Math.sign(delta) !== Math.sign(acc))) acc = 0;
      lastWheelT = now;
      if (delta > 0) {
        // runter: ab dem Ende des Freibereichs übernimmt die Fahrt
        const next = stops[i + 1];
        if (next != null && isFinite(next) && y >= stops[i] + freeOf(i) - 2) {
          e.preventDefault();
          acc += delta;
          if (acc >= WHEEL_COMMIT) { acc = 0; go(next); }
        }
      } else if (delta < 0) {
        // hoch: an der Oberkante einer Sektion übernimmt die Fahrt zur vorigen Ruhelage
        if (i > 0 && y <= stops[i] + 2) {
          e.preventDefault();
          acc += delta;
          if (-acc >= WHEEL_COMMIT) { acc = 0; go(stops[i - 1] + freeOf(i - 1)); }
        }
      }
    };

    // Fallback für Eingaben ohne wheel-Event (Scrollbar-Drag, Tastatur): erst wenn
    // die Bewegung vorbei ist (debounced), in der Übergangszone nachziehen
    const settle = () => {
      if (animating) return;
      const y = window.scrollY;
      const stops = measureStops(y);
      let i = 0;
      while (i + 1 < stops.length && y >= stops[i + 1]) i++;
      const next = stops[i + 1];
      if (next == null || !isFinite(next)) return; // hinter der letzten Kante = frei
      const free = freeOf(i);
      const into = y - stops[i];
      if (into <= free + 2) return; // Sektion wird noch gelesen → nicht eingreifen
      const back = stops[i] + free; // Ruhelage der aktuellen Sektion
      const target = dir >= 0
        ? (into - free >= COMMIT_PX ? next : back)
        : (next - y >= COMMIT_PX ? back : next);
      if (Math.abs(target - y) <= 2) return;
      go(target);
    };

    const onScroll = () => {
      const yNow = window.scrollY;
      if (yNow !== lastY) dir = yNow > lastY ? 1 : -1;
      lastY = yNow;
      const mid = yNow + window.innerHeight / 2;
      let a = 0;
      refs.forEach((r, i) => { if (r.current && r.current.offsetTop <= mid) a = i; });
      setActiveScreen(a);
      if (animating && Math.abs(yNow - animTarget) <= 2) {
        // angekommen → Cooldown gegen nachlaufendes Momentum
        animating = false;
        cooldownUntil = performance.now() + COOLDOWN_MS;
        return;
      }
      if (reduced || animating) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, 140);
    };
    onScroll();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, [isLeaf]);


  // URL setzen: Blatt-Wechsel (neues ?unter=) braucht Server-Daten → Router-Soft-
  // Navigation (Page lädt das Blatt); alles andere (Tag/Seite/Doc, Picker-Feld,
  // Blatt→Picker) bleibt reines pushState ohne Roundtrip.
  function nav(patch: Record<string, string | null>, replace = false) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) p.delete(k); else p.set(k, v); }
    // Jede Navigation, die nicht selbst die Seite setzt, springt auf Seite 1 zurück
    if (!("page" in patch)) p.delete("page");
    const qs = p.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    if (typeof patch.unter === "string" && patch.unter !== unterSlug) { router.push(url); return; }
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  return (
    <div>
      {/* Sektions-Leiste MUSS außerhalb der fade-in-up-Sektion leben: deren Animations-
          Transform (fill forwards) macht sie sonst zum Containing Block und `fixed`
          klebt an der Sektion statt am Viewport. */}
      {isLeaf && (
        <SectionRail active={activeScreen} labels={["Abstimmungen", "Plenum", "Spezifische Themen"]}
          onJump={(i) => screenRefs[i].current?.scrollIntoView({ behavior: "smooth", block: "start" })} />
      )}

      {/* Breadcrumb — nur am Blatt nötig; im Picker ist die linke Spalte die Navigation */}
      {isLeaf && (
        <nav className="mb-5 flex items-center gap-2 text-[13px] text-zinc-400">
          <button onClick={() => nav({ feld: null, unter: null, thema: null })} className="transition hover:text-zinc-900 dark:hover:text-zinc-100">Themen</button>
          <span className="text-zinc-300">/</span>
          <button onClick={() => nav({ feld, unter: null, thema: null })} className="transition hover:text-zinc-900 dark:hover:text-zinc-100">{selFeld?.name ?? "Oberthema"}</button>
          <span className="text-zinc-300">/</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{blatt?.unterthema}</span>
        </nav>
      )}

      {/* ── PICKER: Oberthemen (links) + Unterthemen (rechts/Akkordeon) in EINEM Schritt ── */}
      {!isLeaf && (
        <section className="fade-in-up">
          <h2 className={`${DISPLAY} text-[2.3rem] font-bold leading-[1.05] tracking-[-0.025em] text-zinc-950 dark:text-zinc-50`}>Was beschäftigt<br />den Bundestag?</h2>
          <p className="mt-3 text-[15px] text-zinc-500">Wähl ein Feld — die Unterthemen erscheinen daneben.</p>

          <div className="mt-8 md:flex md:items-start md:gap-6">
            {/* Linke Spalte: alle Oberthemen. Ist ein Feld gewählt, klappt die Spalte nach LINKS
                weg (Breite → schmaler Streifen), und die Unterthemen rechts klappen in den Platz
                auf. Hover über den Streifen (group/rail + eigenes :hover) öffnet die Liste wieder. */}
            <div className={`rail group/rail relative shrink-0 overflow-hidden transition-[width] duration-500 ease-out ${feld ? "w-full md:w-9 md:hover:w-[240px]" : "w-full md:w-[240px]"}`}>
              {/* feste Breite → beim Wegklappen reflowt/bricht der Text NICHT; der Streifen
                  clippt ihn nur (overflow-hidden). Weggeklappt schimmert die Liste GANZ schwach
                  durch (Geist der Anfangsbuchstaben) → teasert „hier sind noch Felder"; Hover holt
                  sie voll zurück. Nur Desktop — mobil bleibt die Liste immer voll sichtbar. */}
              <div className={`flex w-full shrink-0 flex-col gap-2 opacity-100 transition-opacity duration-300 md:w-[240px] ${feld ? "md:opacity-[0.14] md:group-hover/rail:opacity-100" : ""}`}>
                {FELDER.map((f) => {
                  const sel = feld === f.slug;
                  return (
                    <Fragment key={f.slug}>
                      <button onClick={() => nav({ feld: sel ? null : f.slug, unter: null, thema: null })}
                        className={`group flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-left transition ${sel
                          ? "bg-zinc-900/[0.07] text-zinc-950 dark:bg-white/[0.12] dark:text-zinc-50"
                          : "text-zinc-600 hover:bg-zinc-900/[0.045] dark:text-zinc-400 dark:hover:bg-white/[0.06]"}`}>
                        <span className="flex min-w-0 flex-col">
                          <span className={`text-[15px] ${sel ? "font-semibold" : "font-medium"}`}>{f.name}</span>
                          <Teaser items={f.teaser} />
                        </span>
                        <IconChevron open={sel} className="h-4 w-4 shrink-0 text-zinc-400 md:hidden" />
                        <IconArrow className={`hidden h-4 w-4 shrink-0 text-zinc-500 transition md:block ${sel ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                      </button>
                      {/* Mobile = Akkordeon: Detail klappt unter dem gewählten Feld auf */}
                      {sel && selFeld && <DetailPane key={f.slug} ober={selFeld.ober} onPick={(u) => nav({ feld: f.slug, unter: u, thema: null })} className="panel-expand mb-2 mt-1 px-1 md:hidden" />}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* Rechte Spalte (Desktop): Unterthemen klappen in den frei werdenden Platz auf */}
            <div className="hidden min-w-0 flex-1 md:block">
              {selFeld ? (
                <DetailPane key={selFeld.slug} ober={selFeld.ober} onPick={(u) => nav({ feld: selFeld.slug, unter: u, thema: null })} className="panel-expand" />
              ) : (
                <div className={`panel-expand flex h-full min-h-[180px] items-center justify-center p-8 text-center text-[13.5px] text-zinc-400 ${SOFT_CARD}`}>
                  Wähl links ein Feld — hier erscheinen seine Unterthemen.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── BLATT: Unterthema (mit Tag-Filter) ── */}
      {isLeaf && (() => {
        // Blatt vollständig aus den Server-Daten (globaler Klassifikations-Lauf)
        const u: Unterthema = {
          name: blatt!.unterthema,
          voteThema: blatt!.voteThema ?? undefined,
          beschreibung: blatt!.beschreibung,
          catch: echtToCatch(blatt!),
          tags: blatt!.tags.map((t, i): Tag => ({ name: t.name, anker: i < 8 })),
          koepfe: blatt!.koepfe.map((k) => ({ ...k, rolle: k.rolle ?? undefined })),
        };
        const sitzungen = blatt!.sitzungen;
        const allTags = u.tags ?? [];
        const anchors = allTags.filter((t) => t.anker);
        const hiddenCount = allTags.length - anchors.length;
        const q = query.trim().toLowerCase();
        // Chips zeigen Anker (Toggle = alle): Die Suche filtert die Chip-Liste NICHT mehr —
        // Themen findet man über die Vervollständigung im Suchfeld.
        const visible = showAll ? allTags : (anchors.length ? anchors : allTags);

        // Vervollständigung: ähnelt das Suchwort einem spezifischen Thema, wird es als
        // Option angeboten (Klick = Chip setzen = exakter Filter). Wer sie ignoriert,
        // sucht einfach im Volltext weiter — keine Vorab-Entscheidung nötig.
        const tagSuggestions = q.length >= 2
          ? allTags.filter((t) => t.name.toLowerCase().includes(q) && t.name !== activeTag).slice(0, 5)
          : [];

        // Items eines Tags: 1) kuratierte Dummy-Liste, 2) ECHTE Klassifikation
        // (item.tags-Mitgliedschaft — der Normalfall mit echten Daten), 3) Wortanfang-
        // Fallback für Dummy-Tags ohne Liste. Reden tragen (noch) keine Tags und
        // fallen beim Tag-Filter raus — bekannte Lücke bis zum Tag-Batch.
        const tagItems = (name: string): CatchItem[] => {
          const t = allTags.find((x) => x.name === name);
          if (t?.catch?.length) return t.catch;
          const byTag = u.catch.filter((c) => c.tags?.includes(name));
          return byTag.length ? byTag : tagCatchFallback(name, u.catch);
        };
        const baseCatch = activeTag ? tagItems(activeTag) : u.catch;

        // Volltextsuche mit Tag-Vorrang: Einträge, die ein zum Suchwort passendes Thema
        // als Tag TRAGEN, stehen als Block VOR reinen Text-Treffern; innerhalb beider
        // Blöcke bleibt neueste-zuerst. Klassifikation = präziseres Signal, Datum =
        // Ordnung — keine Relevanz-Wertung. Echte Engine: searchThema(slug, q) in
        // suche.ts (geparkt, filtert item_topics + Textmatch).
        const tagHitTitles = new Set<string>();
        if (q) for (const t of allTags) {
          if (!t.name.toLowerCase().includes(q)) continue;
          tagItems(t.name).forEach((c) => tagHitTitles.add(c.titel));
        }
        const tagHits = q ? baseCatch.filter((c) => tagHitTitles.has(c.titel)) : [];
        const textHits = q ? baseCatch.filter((c) => !tagHitTitles.has(c.titel) && `${c.titel} ${c.einzeiler}`.toLowerCase().includes(q)) : [];
        const shownCatch = q ? [...tagHits, ...textHits] : baseCatch;

        // Screen 1 hat FESTE Kapazität (User 2026-06-11), der Überlauf lebt im jeweiligen
        // Spezial-Werkzeug — der Feed mischt ihn NICHT (ein Klick entfernt = redundant):
        // Abstimmungen: Featured (neueste) + max 3 ältere rechts, alle weiteren auf
        // /abstimmungen?thema=… (Themen-Filter existiert dort). Gesetzentwürfe:
        // neueste 3 in der Reihe, alle auf /gesetzentwuerfe (DIP-Liste mit Binnenphase
        // + Wartezeit). Reine Recency, keine Brisanz-Wertung.
        const votes = shownCatch.filter((c) => c.typ === "Abstimmung");
        const featuredVote = votes[0] ?? null;
        // 2 ältere rechts (User 2026-06-11: echte Inhalte sind höher als die Dummies —
        // 3 Zeilen streckten Screen 1 weit über den Viewport)
        const olderVotes = votes.slice(1, 3);
        const voteOverflow = Math.max(0, votes.length - 3);
        const imVerfahren = shownCatch.filter((c) => c.typ === "Drucksache" && c.stand != null);
        const gesetzRow = imVerfahren.slice(0, 3);
        const gesetzOverflow = imVerfahren.length - gesetzRow.length;
        const rest = shownCatch.filter((c) => c.typ !== "Abstimmung" && c.stand == null);
        // Heute schon mit echten Treffern: Handzeichen-Votes tragen das Drucksachen-
        // Roh-Thema („Digitalisierung", 46 Votes); der Tag-Batch vereinheitlicht später
        const alleVotesHref = `/abstimmungen?thema=${encodeURIComponent(u.voteThema ?? u.name)}`;
        const PAGE_SIZE = 12;
        const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
        const safePage = Math.min(page, totalPages);
        const pageItems = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

        // Transparenz statt unsichtbarer Magie: der Hint sagt, WARUM die Liste so
        // sortiert ist (Tag-Träger vorn, Text-Treffer dahinter).
        const feedHint = q
          ? (tagHits.length
              ? `${tagHits.length} mit passendem Thema vorn · ${textHits.length} im Text`
              : `${shownCatch.length} Treffer im Text`)
          : activeTag ? `gefiltert: ${activeTag}` : `${allTags.length} Themen · neueste zuerst`;

        // In-Place-Vorschau: &doc= (Titel-Slug) gegen die aktuelle Dokumentliste auflösen.
        // page wird beim Öffnen/Schließen/Blättern explizit durchgereicht, damit nav()
        // sie nicht auf Seite 1 zurückwirft.
        const openDoc = docParam ? rest.find((c) => (c.id ?? slugify(c.titel)) === docParam) ?? null : null;
        const openIdx = openDoc ? rest.indexOf(openDoc) : -1;
        const keepPage = searchParams.get("page");
        const stepDoc = (d: 1 | -1) => {
          if (openIdx < 0) return;
          const n = rest[(openIdx + d + rest.length) % rest.length];
          nav({ doc: n.id ?? slugify(n.titel), page: keepPage }, true); // replace: Blättern spammt die History nicht
        };

        return (
          // ── 3 Scroll-Stufen (User 2026-06-10): Screen 1 = Kopf + Abstimmungen (füllt
          // den ersten Viewport), Screen 2 = Köpfe + Sitzungen, Screen 3 = Spezifische
          // Themen + Feed. min-h statt scroll-snap — Scrollen bleibt frei (kein Hijack).
          <section className="fade-in-up">
            {/* justify-start, NICHT center: der Breadcrumb steht außerhalb darüber —
                Zentrierung riss eine komische Lücke zwischen Breadcrumb und Titel auf.
                Restluft sammelt sich stattdessen unten (liest sich als „mehr beim Scrollen"). */}
            <div ref={screen1Ref} className="flex min-h-[calc(100dvh-180px)] flex-col justify-start gap-6">
            <header>
              <h2 className={`${DISPLAY} text-[2.6rem] font-bold leading-[1.02] tracking-[-0.03em] text-zinc-950 md:text-[3.6rem] dark:text-zinc-50`}>{u.name}</h2>
              {u.beschreibung && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">{u.beschreibung}</p>}
              {shownCatch[0] && <p className="mt-2.5 text-[12.5px] text-zinc-400">Zuletzt aktiv {shownCatch[0].datum}</p>}
            </header>

            {/* Screen-1-Inhalt, Reihe 1 — Abstimmungen als bewährtes Paar: links die
                Featured-Abstimmung („Worum geht es?" + Ergebnis-Balken), rechts die
                älteren als Liste mit Slim-Balken. */}
            {featuredVote && (
              <div className="fade-in-up fade-in-up-2">
                {/* next/link, NICHT <a>: harte Navigation + Browser-Back lieferte eine
                    un-hydratisierte Seite (tote Klicks, kein Paging) — Soft-Navigation
                    hält die React-App am Leben, Back ist ein Router-Schritt. */}
                <SectionLabel hint={voteOverflow > 0
                  ? <Link href={alleVotesHref} className="transition hover:text-zinc-900 dark:hover:text-zinc-100">die 3 neuesten · alle {votes.length} ansehen →</Link>
                  : `${votes.length} ${votes.length === 1 ? "Abstimmung" : "Abstimmungen"}`}>Abstimmungen zum Thema</SectionLabel>
                {olderVotes.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-[3fr_2fr] md:gap-6">
                    <FeaturedVote c={featuredVote} />
                    <div className={`flex flex-col px-6 [&>*]:border-zinc-900/[0.06] dark:[&>*]:border-white/[0.07] [&>*+*]:border-t ${SOFT_CARD}`}>
                      {olderVotes.map((v) => <VoteRow key={v.id ?? v.titel} c={v} />)}
                    </div>
                  </div>
                ) : (
                  <FeaturedVote c={featuredVote} />
                )}
              </div>
            )}

            {/* Reihe 2 — Gesetzentwürfe als volle Karten-Reihe mit Verfahrensstand-
                Stepper: gleiches Gewicht für „was im Verfahren ist". */}
            {gesetzRow.length > 0 && (
              <div className="fade-in-up fade-in-up-3">
                <SectionLabel hint={gesetzOverflow > 0
                  ? <Link href="/gesetzentwuerfe" className="transition hover:text-zinc-900 dark:hover:text-zinc-100">die 3 neuesten · alle {imVerfahren.length} ansehen →</Link>
                  : `${imVerfahren.length} im Verfahren`}>Aktuelle Gesetzentwürfe</SectionLabel>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {gesetzRow.map((c) => <GesetzCard key={c.id ?? c.titel} c={c} />)}
                </div>
              </div>
            )}
            </div>

            {/* ── Screen 2: Sprecher + Sitzungen untereinander, vertikal zentriert (User:
                „da wir jetzt Platz haben") — Köpfe groß (xl) mit Name/Partei-Unterschrift
                + Detail-Feld inkl. Themen-Chips, Sitzungen wieder als volles 3er-Karussell. */}
            {/* pb > pt: gewichtet den Inhalt nach OBEN statt exakt mittig (User) */}
            <div ref={screen2Ref} className="flex min-h-[calc(100dvh-120px)] scroll-mt-24 flex-col justify-center gap-12 pt-4 pb-24">
              {(u.koepfe?.length ?? 0) > 0 && (
                <div>
                  <SectionLabel hint="nach Anzahl der Reden">Wer dazu im Plenum spricht</SectionLabel>
                  <KoepfeStrip koepfe={u.koepfe!} />
                </div>
              )}
              {sitzungen.length > 0 && (
                <div>
                  <SectionLabel hint={`${sitzungen.length} Sitzungen`}>Plenarsitzungen zum Thema</SectionLabel>
                  <SitzungenShelf sitzungen={sitzungen} />
                </div>
              )}
            </div>

            {/* ── Screen 3: Gerade aktiv mit Themen-Filterleiste — EIN Block (zweite Scroll-Stufe) ── */}
            <div ref={screen3Ref} className="min-h-[calc(100dvh-120px)] scroll-mt-24 py-8">
            <div ref={themenRef} className="fade-in-up fade-in-up-4">
              <SectionLabel hint={feedHint}>Gerade aktiv</SectionLabel>
              {/* EIN Suchfeld für beides: Volltext im Feed; ähnelt das Wort einem
                  spezifischen Thema, bietet das Dropdown die Vervollständigung an
                  (Klick = Chip setzen). Freitext ohne Auswahl rankt Tag-Träger vorn. */}
              <div className="relative z-20 mb-3.5">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); if (page > 1) nav({ page: null }, true); }}
                  onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                  placeholder={`in ${u.name} suchen — Wort oder spezifisches Thema…`}
                  className="w-full rounded-2xl bg-zinc-900/[0.04] py-3 pl-11 pr-4 text-[14px] text-zinc-800 placeholder:text-zinc-400 transition focus:bg-white focus:shadow-[0_2px_20px_-8px_rgba(20,20,45,0.25)] focus:outline-none focus:ring-2 focus:ring-zinc-400/60 dark:bg-white/[0.06] dark:text-zinc-100 dark:focus:bg-zinc-900"
                />
                {searchFocus && tagSuggestions.length > 0 && (
                  <div className="absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white shadow-[0_18px_44px_-16px_rgba(20,20,45,0.3)] ring-1 ring-zinc-900/10 dark:bg-zinc-900 dark:ring-white/15">
                    {tagSuggestions.map((t) => {
                      const count = tagItems(t.name).length;
                      return (
                        // onMouseDown verhindert den Input-Blur, damit der Klick noch ankommt
                        <button key={t.name} onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { pickTag(t.name); setQuery(""); setSearchFocus(false); }}
                          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50 dark:hover:bg-white/[0.06]">
                          <span className="flex items-center gap-2.5">
                            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-zinc-600 dark:bg-white/[0.1] dark:text-zinc-300">Thema</span>
                            <span className="text-[13.5px] font-medium text-zinc-800 dark:text-zinc-100">{t.name}</span>
                          </span>
                          <span className="text-[12px] text-zinc-400">{count} Einträge</span>
                        </button>
                      );
                    })}
                    <p className="border-t border-zinc-900/[0.06] px-4 py-2 text-[11.5px] text-zinc-400 dark:border-white/[0.08]">weitertippen = Volltextsuche nach „{query.trim()}“</p>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => pickTag(null)}
                  className={`rounded-full px-4 py-2 text-[13.5px] font-medium transition ${!activeTag ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20" : "bg-zinc-900/[0.05] text-zinc-700 hover:bg-zinc-900/[0.09] dark:bg-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.12]"}`}>
                  Alle
                </button>
                {visible.map((t) => {
                  const sel = activeTag === t.name;
                  return (
                    <button key={t.name} onClick={() => pickTag(sel ? null : t.name)}
                      className={`rounded-full px-4 py-2 text-[13.5px] font-medium transition ${sel ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20" : "bg-zinc-900/[0.05] text-zinc-700 hover:bg-zinc-900/[0.09] dark:bg-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.12]"}`}>
                      {t.name}
                    </button>
                  );
                })}
                {hiddenCount > 0 && (
                  <button onClick={() => setShowAll((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13.5px] font-semibold text-zinc-700 transition hover:bg-zinc-900/[0.05] dark:text-zinc-300 dark:hover:bg-white/[0.08]">
                    {showAll ? "weniger" : `${hiddenCount} weitere`}<IconChevron open={showAll} className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {openDoc ? (
                <DocPreview c={openDoc} pos={openIdx + 1} total={rest.length}
                  onClose={() => nav({ doc: null, page: keepPage })}
                  onPrev={() => stepDoc(-1)} onNext={() => stepDoc(1)} />
              ) : shownCatch.length ? (
                <>
                  {/* Die neueste Abstimmung steht oben in „Zuletzt abgestimmt" und ist hier
                      (via rest = shownCatch ohne featuredVote) NICHT doppelt; ältere Votes
                      mischen sich nach Datum normal in den Feed. */}
                  {pageItems.length > 0 && (
                    // key = Filter+Seite → bei Seitenwechsel remountet das Grid und fadet schnell rein.
                    // Leere Slots werden mit Ghost-Zellen auf PAGE_SIZE aufgefüllt (gestrichelt,
                    // kaum sichtbar) → das 4×3-Raster und damit die Seiten-Höhe bleiben beim
                    // Filtern/Blättern konstant, egal ob 2 oder 12 Treffer (User 2026-06-10).
                    <div key={`${activeTag ?? ""}-${safePage}`} className="fade-quick mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {pageItems.map((c) => <CatchCard key={c.id ?? c.titel} c={c} onOpen={() => nav({ doc: c.id ?? slugify(c.titel), page: keepPage })} />)}
                      {Array.from({ length: PAGE_SIZE - pageItems.length }, (_, i) => (
                        <div key={`ghost-${i}`} aria-hidden className="min-h-[180px] rounded-3xl border-2 border-dashed border-zinc-900/[0.05] dark:border-white/[0.05]" />
                      ))}
                    </div>
                  )}
                  {/* Pagination 1..X — Klick auf die Zahl zeigt die jeweilige Seite; Seite steht in der URL (&page=) */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-between">
                      <button onClick={() => nav({ page: safePage - 1 <= 1 ? null : String(safePage - 1) })} disabled={safePage === 1}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] text-zinc-500 transition hover:bg-zinc-900/[0.05] disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/[0.06]">
                        <IconArrow className="h-4 w-4 rotate-180" />Zurück
                      </button>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                          <button key={n} onClick={() => nav({ page: n === 1 ? null : String(n) })}
                            className={`h-9 w-9 rounded-lg text-[13px] transition ${n === safePage
                              ? "bg-zinc-900 font-semibold text-white shadow-md shadow-zinc-900/20"
                              : "text-zinc-600 ring-1 ring-zinc-900/10 hover:bg-zinc-900/[0.05] dark:text-zinc-300 dark:ring-white/15 dark:hover:bg-white/[0.06]"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => nav({ page: String(safePage + 1) })} disabled={safePage === totalPages}
                        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[13px] text-zinc-500 transition hover:bg-zinc-900/[0.05] disabled:opacity-40 disabled:hover:bg-transparent dark:hover:bg-white/[0.06]">
                        Weiter<IconArrow className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // Nur noch Dummy-Artefakt (Long-Tail-Tag ohne Pool-Treffer): mit echten
                // Daten existiert ein Tag nur, wenn Items ihn tragen — nie leer. Hinweis
                // belegt den ersten Slot, Ghosts halten die 4×3-Form.
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <p className={`flex min-h-[180px] items-center justify-center p-6 text-center text-[12.5px] leading-relaxed text-zinc-400 ${SOFT_CARD}`}>
                    {q
                      ? <>Keine Treffer für „{query.trim()}" — weder als Thema noch im Text.</>
                      : <>Im Dummy keine Beispiel-Einträge für „{activeTag}".<br />Mit echten Daten gibt es ein Tag nur, wenn Dokumente es tragen — diese Ansicht wäre nie leer.</>}
                  </p>
                  {Array.from({ length: PAGE_SIZE - 1 }, (_, i) => (
                    <div key={`ghost-${i}`} aria-hidden className="min-h-[180px] rounded-3xl border-2 border-dashed border-zinc-900/[0.05] dark:border-white/[0.05]" />
                  ))}
                </div>
              )}
            </div>
            </div>
          </section>
        );
      })()}
    </div>
  );
}
