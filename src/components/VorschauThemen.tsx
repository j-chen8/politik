"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { type LucideIcon, FileText, Mic, Vote, Landmark } from "lucide-react";

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
 * Blatt = Unterthema. Erst HIER: „Gerade aktiv" + „Verbindet sich mit". Spezifische
 * Themen sind FILTER darauf (keine eigenen Seiten): nur ~Anker sichtbar, Rest über
 * Eingrenzen-Suche / "mehr"; Tag-Klick re-fokussiert Inhalt + Verbindungen.
 */

// ── Datenmodell (= Daten-Spec) ──────────────────────────────────────────────
type CatchItem = { titel: string; typ: "Drucksache" | "Rede" | "Abstimmung"; datum: string; einzeiler: string };
// Eine Kante ist eine TÜR, kein Label: `brücke` = das real verbindende Dokument
// (das Mit-Vorkommen, das die Verbindung trägt) — gibt dem Klick „Scent".
type Brücke = { titel: string; typ: CatchItem["typ"]; datum: string };
type Edge = { ziel: string; brücke?: Brücke };
type Tag = { name: string; anker?: boolean; catch?: CatchItem[]; edges?: Edge[] };
type Unterthema = { name: string; beschreibung?: string; tags?: Tag[]; catch: CatchItem[]; edges: Edge[]; ausgebaut?: boolean };
type Oberthema = { name: string; teaser: string[]; unter: Unterthema[]; catch: CatchItem[]; edges: Edge[] };

// ── Dummy-Daten ─────────────────────────────────────────────────────────────
const DIGITAL_TAGS: Tag[] = [
  {
    name: "Künstliche Intelligenz", anker: true,
    edges: [
      { ziel: "Forschung", brücke: { titel: "KI-Gigafactory: Förderrahmen für Rechenzentren", typ: "Drucksache", datum: "vor 3 Tagen" } },
      { ziel: "Gesundheit", brücke: { titel: "KI in der Pflegedokumentation — Entlastung oder Risiko?", typ: "Rede", datum: "vor 2 Wochen" } },
      { ziel: "Verteidigung", brücke: { titel: "KI-gestützte Aufklärung — ethische Leitplanken", typ: "Drucksache", datum: "vor 3 Wochen" } },
      { ziel: "Bildung", brücke: { titel: "KI an Schulen — Pilotprogramm der Länder", typ: "Rede", datum: "vor 1 Monat" } },
      { ziel: "Innere Sicherheit", brücke: { titel: "Biometrische Gesichtserkennung — Einsatzgrenzen", typ: "Abstimmung", datum: "vor 2 Wochen" } },
    ],
    catch: [
      { titel: "KI-Gigafactory: Förderrahmen für Rechenzentren", typ: "Drucksache", datum: "vor 3 Tagen", einzeiler: "Bundesmittel für europäische KI-Recheninfrastruktur." },
      { titel: "Einsatz von KI in der Bundesverwaltung", typ: "Rede", datum: "vor 1 Woche", einzeiler: "Debatte über Chancen und Leitplanken." },
    ],
  },
  {
    name: "Cybersicherheit", anker: true,
    edges: [
      { ziel: "Innere Sicherheit", brücke: { titel: "NIS-2-Umsetzung: Meldepflichten für KRITIS", typ: "Drucksache", datum: "vor 5 Tagen" } },
      { ziel: "Verteidigung", brücke: { titel: "Cyber-Abwehr der Bundeswehr — Aufwuchs", typ: "Rede", datum: "vor 2 Wochen" } },
      { ziel: "Datenschutz", brücke: { titel: "Vorratsdatenspeicherung — Cyber-Bezug", typ: "Abstimmung", datum: "vor 3 Wochen" } },
    ],
    catch: [{ titel: "NIS-2-Umsetzung: Meldepflichten für KRITIS", typ: "Drucksache", datum: "vor 5 Tagen", einzeiler: "Nationale Umsetzung der EU-Cybersicherheitsrichtlinie." }],
  },
  {
    name: "Krypto-Assets", anker: true,
    edges: [
      { ziel: "Finanzen", brücke: { titel: "MiCAR-Umsetzung: Krypto-Aufsicht", typ: "Drucksache", datum: "vor 10 Tagen" } },
      { ziel: "Innere Sicherheit", brücke: { titel: "Geldwäsche über Krypto-Assets — Ermittlungsbefugnisse", typ: "Drucksache", datum: "vor 3 Wochen" } },
    ],
    catch: [{ titel: "MiCAR-Umsetzung: Krypto-Aufsicht", typ: "Drucksache", datum: "vor 10 Tagen", einzeiler: "Nationale Umsetzung der EU-Kryptomärkte-Verordnung." }],
  },
  { name: "Rechenzentren & Cloud", anker: true },
  { name: "Startups & Wagniskapital", anker: true },
  { name: "Breitband & Netzausbau", anker: true },
  { name: "Plattform-Regulierung", anker: true },
  { name: "Halbleiter", anker: true },
  // ── langer Schwanz (nur über Suche / „mehr" erreichbar) ──
  { name: "Deepfakes" }, { name: "Digitale Identität" }, { name: "Drohnen" }, { name: "Quantentechnologie" },
  { name: "Open Source" }, { name: "Datenökonomie" }, { name: "E-Commerce" }, { name: "Digitale Verwaltung" },
  { name: "Telekommunikation" }, { name: "Smart City" }, { name: "Autonomes Fahren" }, { name: "Gaming" },
  { name: "Digitale Souveränität" }, { name: "Gigafactory & Batterien" },
];

const WIRTSCHAFT: Oberthema = {
  name: "Wirtschaft",
  teaser: ["Energie", "Industrie", "Digital", "Außenhandel", "Verbraucherschutz"],
  edges: [
    { ziel: "Energie", brücke: { titel: "Strompreis-Entlastung für die Industrie", typ: "Abstimmung", datum: "vor 1 Woche" } },
    { ziel: "Finanzen", brücke: { titel: "Sondervermögen Infrastruktur — Mittelabfluss", typ: "Drucksache", datum: "vor 2 Wochen" } },
    { ziel: "Arbeitsmarkt", brücke: { titel: "Fachkräfteeinwanderung — Punktesystem", typ: "Rede", datum: "vor 3 Wochen" } },
    { ziel: "Außenpolitik", brücke: { titel: "Lieferkettengesetz — Bürokratie-Entlastung", typ: "Drucksache", datum: "vor 2 Wochen" } },
  ],
  catch: [
    { titel: "KI-Gigafactory: Förderrahmen für Rechenzentren", typ: "Drucksache", datum: "vor 3 Tagen", einzeiler: "Bundesmittel für den Aufbau europäischer KI-Recheninfrastruktur." },
    { titel: "Strompreis-Entlastung für die Industrie", typ: "Abstimmung", datum: "vor 1 Woche", einzeiler: "Namentliche Abstimmung über den Industriestrompreis." },
    { titel: "Lieferkettengesetz — Bürokratie-Entlastung", typ: "Drucksache", datum: "vor 2 Wochen", einzeiler: "Antrag zur Vereinfachung der Sorgfaltspflichten." },
  ],
  unter: [
    { name: "Digital", ausgebaut: true, tags: DIGITAL_TAGS,
      beschreibung: "Netzpolitik des Bundestags — von künstlicher Intelligenz und Cybersicherheit über Rechenzentren und Breitbandausbau bis zu Krypto-Aufsicht und Plattform-Regulierung.",
      edges: [
        { ziel: "Forschung", brücke: { titel: "KI-Gigafactory: Förderrahmen für Rechenzentren", typ: "Drucksache", datum: "vor 3 Tagen" } },
        { ziel: "Datenschutz", brücke: { titel: "Cloud-Souveränität für die Verwaltung", typ: "Rede", datum: "vor 3 Wochen" } },
        { ziel: "Innere Sicherheit", brücke: { titel: "Deepfakes im Wahlkampf — Kennzeichnungspflicht", typ: "Drucksache", datum: "vor 4 Tagen" } },
        { ziel: "Gesundheit", brücke: { titel: "KI in der Pflegedokumentation — Entlastung oder Risiko?", typ: "Rede", datum: "vor 2 Wochen" } },
        { ziel: "Verteidigung", brücke: { titel: "Cyber-Abwehr der Bundeswehr — Aufwuchs", typ: "Rede", datum: "vor 2 Wochen" } },
        { ziel: "Bildung", brücke: { titel: "KI an Schulen — Pilotprogramm der Länder", typ: "Rede", datum: "vor 1 Monat" } },
      ],
      catch: [
        { titel: "Deepfakes im Wahlkampf — Kennzeichnungspflicht", typ: "Drucksache", datum: "vor 4 Tagen", einzeiler: "Antrag zur Pflicht-Kennzeichnung KI-generierter Medien im politischen Wettbewerb." },
        { titel: "NIS-2-Umsetzung: Meldepflichten für KRITIS", typ: "Drucksache", datum: "vor 5 Tagen", einzeiler: "Nationale Umsetzung der EU-Cybersicherheitsrichtlinie für kritische Infrastruktur." },
        { titel: "KI-Gigafactory: Förderrahmen für Rechenzentren", typ: "Drucksache", datum: "vor 1 Woche", einzeiler: "Bundesmittel für den Aufbau europäischer KI-Recheninfrastruktur." },
        { titel: "MiCAR-Umsetzung: Krypto-Aufsicht", typ: "Drucksache", datum: "vor 10 Tagen", einzeiler: "Nationale Umsetzung der EU-Kryptomärkte-Verordnung." },
        { titel: "Breitbandausbau im ländlichen Raum — Sachstand", typ: "Rede", datum: "vor 2 Wochen", einzeiler: "Aktuelle Stunde zum Stand des Gigabit-Ausbaus." },
        { titel: "Cloud-Souveränität für die Verwaltung", typ: "Rede", datum: "vor 3 Wochen", einzeiler: "Debatte über die Abhängigkeit von US-Cloud-Anbietern." },
        { titel: "Plattform-Regulierung: DSA-Durchsetzung", typ: "Abstimmung", datum: "vor 3 Wochen", einzeiler: "Namentliche Abstimmung zur nationalen DSA-Durchsetzungsstelle." },
        { titel: "KI-Verordnung — nationale Begleitgesetzgebung", typ: "Drucksache", datum: "vor 3 Wochen", einzeiler: "Anpassung des nationalen Rechts an den EU AI Act." },
        { titel: "Gigabit-Förderung 2.0 — Mittelabfluss", typ: "Drucksache", datum: "vor 1 Monat", einzeiler: "Kleine Anfrage zum Abruf der Breitband-Fördermittel." },
        { titel: "Digitale Identität: eID-Wallet-Pilot", typ: "Drucksache", datum: "vor 1 Monat", einzeiler: "Sachstand zur staatlichen Identitäts-Wallet." },
        { titel: "Rechenzentren — Energieeffizienz-Auflagen", typ: "Rede", datum: "vor 1 Monat", einzeiler: "Debatte über Abwärme-Nutzung und Effizienzpflichten." },
        { titel: "Open-Source-Strategie der Verwaltung", typ: "Rede", datum: "vor 5 Wochen", einzeiler: "Aussprache zur Reduzierung von Software-Abhängigkeiten." },
        { titel: "Quantentechnologie — Forschungsförderung", typ: "Drucksache", datum: "vor 6 Wochen", einzeiler: "Antrag zum Ausbau der nationalen Quanten-Forschung." },
        { titel: "Halbleiter-Resilienz — EU Chips Act Umsetzung", typ: "Drucksache", datum: "vor 6 Wochen", einzeiler: "Nationale Maßnahmen zur Chip-Versorgungssicherheit." },
        { titel: "Online-Plattformen — Haftung bei Manipulation", typ: "Rede", datum: "vor 7 Wochen", einzeiler: "Debatte über Verantwortung für manipulierte Inhalte." },
        { titel: "Vorratsdatenspeicherung — Quick Freeze", typ: "Abstimmung", datum: "vor 2 Monaten", einzeiler: "Abstimmung über das anlassbezogene Einfrieren von Daten." },
        { titel: "Startups — Wagniskapital-Dachfonds", typ: "Drucksache", datum: "vor 2 Monaten", einzeiler: "Aufstockung der staatlichen Beteiligung an VC-Fonds." },
        { titel: "Smart-City-Förderprogramm — Sachstand", typ: "Rede", datum: "vor 2 Monaten", einzeiler: "Bericht zum Stand der kommunalen Digitalprojekte." },
        { titel: "Autonomes Fahren — Zulassungsrahmen", typ: "Drucksache", datum: "vor 2 Monaten", einzeiler: "Verordnung zum Regelbetrieb fahrerloser Fahrzeuge." },
        { titel: "Cyberabwehr — Befugnisse für aktive Maßnahmen", typ: "Abstimmung", datum: "vor 3 Monaten", einzeiler: "Kontroverse Abstimmung über sogenannte Hackbacks." },
        { titel: "Telekommunikation — Routerfreiheit", typ: "Drucksache", datum: "vor 3 Monaten", einzeiler: "Antrag zur Sicherung der freien Endgerätewahl." },
      ],
    },
    { name: "Energie", tags: [{ name: "Strompreis" }, { name: "Gasversorgung" }, { name: "Netzentgelte" }], edges: [], catch: [] },
    { name: "Industrie", tags: [{ name: "Stahl" }, { name: "Automobil" }, { name: "Ansiedlung" }], edges: [], catch: [] },
    { name: "Außenhandel", tags: [{ name: "Zölle" }, { name: "Kritische Rohstoffe" }, { name: "China" }], edges: [], catch: [] },
    { name: "Verbraucherschutz", tags: [{ name: "Produktsicherheit" }, { name: "Verbraucherrechte" }], edges: [], catch: [] },
    { name: "Förderung", tags: [{ name: "Bürgschaften" }, { name: "Sondervermögen" }], edges: [], catch: [] },
    { name: "Mittelstand", tags: [{ name: "Handwerk" }, { name: "Gründung" }], edges: [], catch: [] },
    { name: "Fachkräfte", tags: [{ name: "Fachkräftemangel" }, { name: "Zuwanderung" }], edges: [], catch: [] },
    { name: "Lieferketten", tags: [{ name: "Lieferkettengesetz" }, { name: "Sorgfaltspflicht" }], edges: [], catch: [] },
    { name: "Konjunktur", tags: [{ name: "Wachstum" }, { name: "Jahreswirtschaftsbericht" }], edges: [], catch: [] },
  ],
};

// Plenarsitzungen mit Bezug zum Unterthema (Dummy). Im echten Bau: Sitzungen, deren
// Tagesordnungspunkte das Thema tragen → Link auf /protokolle/sitzung/<nr>.
type Sitzung = { nr: number; datum: string; tops: string };
const DIGITAL_SITZUNGEN: Sitzung[] = [
  { nr: 198, datum: "12. Juni 2026", tops: "KI-Verordnung · NIS-2 · Deepfakes" },
  { nr: 195, datum: "28. Mai 2026", tops: "Breitbandausbau · Gigabit-Förderung" },
  { nr: 191, datum: "14. Mai 2026", tops: "MiCAR · Krypto-Aufsicht" },
  { nr: 188, datum: "30. April 2026", tops: "Plattform-Regulierung · DSA" },
  { nr: 184, datum: "16. April 2026", tops: "Cyberabwehr · KRITIS-Schutz" },
  { nr: 180, datum: "2. April 2026", tops: "Rechenzentren · Energieeffizienz" },
  { nr: 176, datum: "19. März 2026", tops: "Quantentechnologie · Halbleiter" },
  { nr: 172, datum: "5. März 2026", tops: "Open Source · Digitale Verwaltung" },
];

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
  Drucksache: { Icon: FileText, color: "text-violet-500 dark:text-violet-400" },
  Rede: { Icon: Mic, color: "text-sky-500 dark:text-sky-400" },
  Abstimmung: { Icon: Vote, color: "text-emerald-500 dark:text-emerald-400" },
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
function CatchCard({ c }: { c: CatchItem }) {
  return (
    <div className={`group flex min-h-[180px] cursor-pointer flex-col p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_-18px_rgba(20,20,45,0.32)] ${SOFT_CARD}`}>
      <TypEyebrow c={c} />
      <p className="mt-2.5 text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">{c.titel}</p>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.einzeiler}</p>
    </div>
  );
}

// Featured = die AKTUELLE Abstimmung zum Thema, prominent oben (Blog-Form). Wird nur
// gerendert, wenn es überhaupt eine Abstimmung gibt — sonst weggelassen.
function FeaturedVote({ c }: { c: CatchItem }) {
  return (
    <a href="#" className={`group block overflow-hidden p-7 ring-1 ring-emerald-500/15 transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_56px_-20px_rgba(20,20,45,0.34)] ${SOFT_CARD}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        <Vote className="h-4 w-4 shrink-0" strokeWidth={2.25} />Aktuelle Abstimmung · {c.datum}
      </p>
      <p className={`${DISPLAY} mt-2.5 text-[1.35rem] font-bold leading-[1.15] tracking-[-0.02em] text-zinc-900 dark:text-zinc-50`}>{c.titel}</p>
      <p className="mt-2.5 max-w-2xl text-[14.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.einzeiler}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-emerald-600 dark:text-emerald-400">Zur Abstimmung<IconArrow className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
    </a>
  );
}

// Kompakte Abstimmungs-Zeile für die rechte Liste (ältere Votes). Text-forward, Hairline-
// getrennt (divide-y am Container), grüner Vote-Akzent wie die Featured-Karte.
function VoteRow({ c }: { c: CatchItem }) {
  return (
    <a href="#" className="group block py-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
        <Vote className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />Abstimmung · {c.datum}
      </p>
      <p className="mt-1.5 text-[14.5px] font-semibold leading-snug text-zinc-900 transition group-hover:text-emerald-700 dark:text-zinc-50 dark:group-hover:text-emerald-300">{c.titel}</p>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.einzeiler}</p>
    </a>
  );
}

// Plenarsitzungen als Endlos-Karussell. Desktop: zeigt ~3 Karten, an beiden Rändern teasern
// die Nachbarkarten an (angeschnitten) → „hier geht's weiter"; flankiert von je einem Pfeil.
// LOOP: die Liste wird verdreifacht und die Scroll-Position bleibt in der MITTLEREN Kopie —
// driftet sie in eine Außenkopie, springt sie nach dem Scroll-Ende um exakt eine Kopie-Breite
// zurück (identische Pixel → unsichtbar). So läuft es in beide Richtungen endlos. Mobile:
// natives Wischen (Karten 260px), gleicher Loop.
function SitzungenShelf({ sitzungen }: { sitzungen: Sitzung[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const copyW = useRef(0);       // Breite EINER Kopie (n Karten + Lücken), exakt gemessen
  const stride = useRef(0);      // Breite einer Karte + Lücke
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const n = sitzungen.length;

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
    // Start in der mittleren Kopie, um die Sliver-Breite (scroll-pl, 28px) versetzt → snap
    // rastet jede Position so, dass immer 3 volle Karten + je ein schmaler Sliver stehen
    el.scrollLeft = copyW.current - 28;
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const onScroll = () => {
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
  const arrowBtn = "hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/95 text-zinc-700 shadow-[0_6px_22px_-6px_rgba(20,20,45,0.4)] ring-1 ring-zinc-900/[0.06] backdrop-blur-sm opacity-15 transition duration-200 group-hover/shelf:opacity-100 hover:scale-105 hover:text-violet-600 md:flex dark:bg-zinc-800/95 dark:text-zinc-200 dark:ring-white/10 dark:hover:text-violet-300";

  return (
    <div className="group/shelf flex items-center gap-3 md:gap-4">
      <button onClick={() => step(-1)} aria-label="nach links" className={arrowBtn}>
        <IconArrow className="h-4 w-4 rotate-180" />
      </button>
      <div ref={scrollRef} onScroll={onScroll}
        className="flex min-w-0 flex-1 snap-x snap-mandatory scroll-pl-7 gap-3 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[...sitzungen, ...sitzungen, ...sitzungen].map((s, i) => (
          <a key={`${s.nr}-${i}`} href="#" aria-hidden={i < n || i >= n * 2 ? true : undefined}
            className={`group flex w-[260px] shrink-0 snap-start items-start gap-3.5 p-5 transition duration-300 hover:shadow-[0_16px_36px_-18px_rgba(20,20,45,0.3)] md:w-[calc((100%-5rem)/3)] ${SOFT_CARD}`}>
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900/[0.05] text-zinc-500 dark:bg-white/[0.07] dark:text-zinc-400">
              <Landmark className="h-[18px] w-[18px]" strokeWidth={2} />
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[14.5px] font-semibold text-zinc-900 dark:text-zinc-50">
                Sitzung {s.nr}<IconArrow className="h-4 w-4 text-violet-400 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
              </span>
              <span className="block text-[12px] text-zinc-400">{s.datum}</span>
              <span className="mt-1.5 block truncate text-[12.5px] leading-snug text-zinc-500 dark:text-zinc-400">{s.tops}</span>
            </span>
          </a>
        ))}
      </div>
      <button onClick={() => step(1)} aria-label="nach rechts" className={arrowBtn}>
        <IconArrow className="h-4 w-4" />
      </button>
    </div>
  );
}

function SectionLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
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

// Eine vereinte Oberthemen-Liste fürs Master-Detail: Wirtschaft ist ausgebaut (echte
// Unterthemen-Objekte), die übrigen tragen nur ihre Teaser-Namen als Picker.
type Feld = { name: string; slug: string; ausgebaut: boolean; teaser: string[] };
const FELDER: Feld[] = [
  { name: WIRTSCHAFT.name, slug: slugify(WIRTSCHAFT.name), ausgebaut: true, teaser: WIRTSCHAFT.teaser },
  ...ANDERE_OBERTHEMEN.map((o) => ({ name: o.name, slug: slugify(o.name), ausgebaut: false, teaser: o.teaser })),
];

// Kurzformen nur für den Kachel-Scent (sonst sprengen lange Namen die Karte). Der
// volle Name bleibt überall sonst (Filter-Chip am Blatt etc.).
const KURZ: Record<string, string> = { "Künstliche Intelligenz": "KI" };

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

// Ausgebaute Karte (Digital): eigener Hover-State → pausiert den Vorschau-Ticker.
function BuiltUnterCard({ u, onPick }: { u: Unterthema; onPick: (unterSlug: string) => void }) {
  // Standard: still — erst beim Hovern läuft der Vorschau-Ticker los.
  const [paused, setPaused] = useState(true);
  const scent = (u.tags ?? []).map((t) => KURZ[t.name] ?? t.name);
  return (
    <button onClick={() => onPick(slugify(u.name))}
      onMouseEnter={() => setPaused(false)} onMouseLeave={() => setPaused(true)}
      className={`group flex items-center justify-between gap-3 p-5 text-left transition duration-300 ring-2 ring-violet-300/60 hover:-translate-y-1 hover:shadow-[0_22px_48px_-18px_rgba(124,58,237,0.42)] ${SOFT_CARD}`}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[16px] font-semibold text-zinc-900 dark:text-zinc-50">{u.name}</span>
        {scent.length > 0 && <ScentTicker items={scent} paused={paused} />}
      </span>
      <IconArrow className="h-5 w-5 shrink-0 text-violet-500 transition group-hover:translate-x-0.5" />
    </button>
  );
}

// Noch nicht ausgebautes Unterthema: gedämpfte, nicht klickbare Karte mit stillem Scent.
function StubUnterCard({ u }: { u: Unterthema }) {
  const tags = u.tags ?? [];
  const ankers = tags.filter((t) => t.anker);
  const scent = (ankers.length ? ankers : tags).slice(0, 2).map((t) => KURZ[t.name] ?? t.name);
  return (
    <div className={`flex items-center justify-between gap-3 p-5 text-left opacity-55 ${SOFT_CARD}`}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[16px] font-semibold text-zinc-400 dark:text-zinc-500">{u.name}</span>
        {scent.length > 0 && <span className="mt-0.5 truncate text-[12.5px] text-zinc-400 dark:text-zinc-500">{scent.join(" · ")}</span>}
      </span>
    </div>
  );
}

// Detail-Spalte: die Unterthemen des gewählten Felds. STILL — nur Namen, kein Inhalt.
// Nur Wirtschaft hat echte (klickbare) Unterthemen; sonst Teaser-Namen als Vorschau.
function DetailPane({ feld, onPick, className = "" }: { feld: Feld; onPick: (unterSlug: string) => void; className?: string }) {
  return (
    <div className={className}>
      {feld.ausgebaut ? (
        // Alle Unterthemen als Karten; das ausgebaute (Digital) ist die aktive Tür
        // (violetter Ring + Pfeil, hebt beim Hover), die übrigen gedämpft & noch tot.
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {WIRTSCHAFT.unter.map((u) =>
            u.ausgebaut
              ? <BuiltUnterCard key={u.name} u={u} onPick={onPick} />
              : <StubUnterCard key={u.name} u={u} />
          )}
        </div>
      ) : (
        // Light-Feld: Teaser-Namen als gedämpfte Karten (im echten Bau echte Unterthemen)
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {feld.teaser.map((t) => (
            <div key={t} className={`flex items-center p-5 text-left opacity-55 ${SOFT_CARD}`}>
              <span className="text-[16px] font-semibold text-zinc-400 dark:text-zinc-500">{t}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VorschauThemen() {
  const searchParams = useSearchParams();
  const feld = searchParams.get("feld");
  const unterSlug = searchParams.get("unter");
  const activeTag = searchParams.get("thema");
  // Seite ist Teil der URL → teilbare/bookmarkbare Feed-Tiefe (&page=2)
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  // ephemere UI-Zustände bleiben lokal (gehören nicht in eine teilbare URL)
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Ansicht aus der URL ableiten: Blatt nur, wenn Wirtschaft + ausgebautes Unterthema.
  // Sonst = Master-Detail-Picker (Feld evtl. vorausgewählt).
  const unterIdx = unterSlug ? WIRTSCHAFT.unter.findIndex((u) => slugify(u.name) === unterSlug) : -1;
  const isLeaf = feld === "wirtschaft" && unterIdx >= 0 && !!WIRTSCHAFT.unter[unterIdx]?.ausgebaut;
  const selFeld = feld ? FELDER.find((f) => f.slug === feld) ?? null : null;

  // beim Wechsel von Feld/Unterthema die ephemeren UI-Zustände zurücksetzen
  useEffect(() => { setQuery(""); setShowAll(false); }, [feld, unterSlug]);

  // URL setzen, ohne neu zu laden; push = neuer History-Eintrag, replace = ersetzt
  function nav(patch: Record<string, string | null>, replace = false) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) p.delete(k); else p.set(k, v); }
    // Jede Navigation, die nicht selbst die Seite setzt, springt auf Seite 1 zurück
    if (!("page" in patch)) p.delete("page");
    const qs = p.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    if (replace) window.history.replaceState(null, "", url);
    else window.history.pushState(null, "", url);
  }

  return (
    <div>
      {/* Breadcrumb — nur am Blatt nötig; im Picker ist die linke Spalte die Navigation */}
      {isLeaf && (
        <nav className="mb-7 flex items-center gap-2 text-[13px] text-zinc-400">
          <button onClick={() => nav({ feld: null, unter: null, thema: null })} className="transition hover:text-violet-500">Themen</button>
          <span className="text-zinc-300">/</span>
          <button onClick={() => nav({ feld: "wirtschaft", unter: null, thema: null })} className="transition hover:text-violet-500">Wirtschaft</button>
          <span className="text-zinc-300">/</span>
          <span className="font-medium text-zinc-700 dark:text-zinc-200">{WIRTSCHAFT.unter[unterIdx].name}</span>
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
                          ? "bg-violet-100/70 text-violet-950 dark:bg-violet-500/15 dark:text-violet-100"
                          : "text-zinc-600 hover:bg-zinc-900/[0.045] dark:text-zinc-400 dark:hover:bg-white/[0.06]"}`}>
                        <span className="flex min-w-0 flex-col">
                          <span className={`text-[15px] ${sel ? "font-semibold" : "font-medium"}`}>{f.name}</span>
                          <Teaser items={f.teaser} />
                        </span>
                        <IconChevron open={sel} className="h-4 w-4 shrink-0 text-violet-400 md:hidden" />
                        <IconArrow className={`hidden h-4 w-4 shrink-0 text-violet-500 transition md:block ${sel ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
                      </button>
                      {/* Mobile = Akkordeon: Detail klappt unter dem gewählten Feld auf */}
                      {sel && selFeld && <DetailPane key={f.slug} feld={selFeld} onPick={(u) => nav({ feld: f.slug, unter: u, thema: null })} className="panel-expand mb-2 mt-1 px-1 md:hidden" />}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            {/* Rechte Spalte (Desktop): Unterthemen klappen in den frei werdenden Platz auf */}
            <div className="hidden min-w-0 flex-1 md:block">
              {selFeld ? (
                <DetailPane key={selFeld.slug} feld={selFeld} onPick={(u) => nav({ feld: selFeld.slug, unter: u, thema: null })} className="panel-expand" />
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
        const u = WIRTSCHAFT.unter[unterIdx];
        const allTags = u.tags ?? [];
        const anchors = allTags.filter((t) => t.anker);
        const hiddenCount = allTags.length - anchors.length;
        const q = query.trim().toLowerCase();
        const visible = q ? allTags.filter((t) => t.name.toLowerCase().includes(q)) : showAll ? allTags : (anchors.length ? anchors : allTags);

        const activeObj = activeTag ? allTags.find((t) => t.name === activeTag) : null;
        const shownCatch = activeTag ? (activeObj?.catch ?? []) : u.catch;

        // Alle Abstimmungen zum Thema (shownCatch ist neueste-zuerst): die erste ist die
        // aktuellste → links als Featured, die übrigen rechts als kompakte Liste älterer
        // Abstimmungen. Reine Recency, keine Brisanz-Wertung.
        const votes = shownCatch.filter((c) => c.typ === "Abstimmung");
        const featuredVote = votes[0] ?? null;
        const olderVotes = votes.slice(1);
        // Votes leben komplett in der eigenen Sektion → „Gerade aktiv" zeigt nur Dokumente
        // (Drucksachen/Reden), keine Dopplung.
        const rest = shownCatch.filter((c) => c.typ !== "Abstimmung");
        const PAGE_SIZE = 12;
        const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
        const safePage = Math.min(page, totalPages);
        const pageItems = rest.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

        return (
          <section className="fade-in-up space-y-10">
            <header>
              <h2 className={`${DISPLAY} text-[2.6rem] font-bold leading-[1.02] tracking-[-0.03em] text-zinc-950 dark:text-zinc-50`}>{u.name}</h2>
              {u.beschreibung && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">{u.beschreibung}</p>}
              {shownCatch[0] && <p className="mt-2.5 text-[12.5px] text-zinc-400">Zuletzt aktiv {shownCatch[0].datum}</p>}
            </header>

            {/* Plenarsitzungen, die das Thema auf der Tagesordnung hatten → Link auf die Sitzung */}
            <div className="fade-in-up fade-in-up-2">
              <SectionLabel hint={`${DIGITAL_SITZUNGEN.length} Sitzungen`}>Plenarsitzungen mit Digital-Bezug</SectionLabel>
              <SitzungenShelf sitzungen={DIGITAL_SITZUNGEN} />
            </div>

            {/* Zuletzt abgestimmt = die NEUESTE Abstimmung zum Thema (Recency, keine Wertung).
                Eigene ruhige Sektion: Entscheidung getrennt von Dokumenten. Fehlt eine
                Abstimmung (z. B. unter einem Tag-Filter ohne Vote), fällt nur sie weg. */}
            {featuredVote && (
              <div className="fade-in-up fade-in-up-3">
                <SectionLabel hint={`${votes.length} ${votes.length === 1 ? "Abstimmung" : "Abstimmungen"}`}>Abstimmungen zum Thema</SectionLabel>
                {olderVotes.length > 0 ? (
                  // Links die aktuellste Abstimmung groß, rechts die älteren als kompakte Liste
                  <div className="grid gap-5 md:grid-cols-[3fr_2fr] md:gap-6">
                    <FeaturedVote c={featuredVote} />
                    <div className={`flex flex-col px-6 [&>*]:border-zinc-900/[0.06] dark:[&>*]:border-white/[0.07] [&>*+*]:border-t ${SOFT_CARD}`}>
                      {olderVotes.map((v) => <VoteRow key={v.titel} c={v} />)}
                    </div>
                  </div>
                ) : (
                  <FeaturedVote c={featuredVote} />
                )}
              </div>
            )}

            <div className="fade-in-up fade-in-up-4">
              <SectionLabel hint={`${allTags.length} Themen`}>Spezifische Themen</SectionLabel>
              {/* Eingrenzen-Suche — macht den ganzen Schwanz erreichbar, ohne ihn zu zeigen */}
              <div className="relative mb-3.5">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  value={query} onChange={(e) => { setQuery(e.target.value); if (activeTag) nav({ thema: null }, true); }}
                  placeholder="eingrenzen — z. B. Krypto, Halbleiter, Drohnen…"
                  className="w-full rounded-2xl bg-zinc-900/[0.04] py-3 pl-11 pr-4 text-[14px] text-zinc-800 placeholder:text-zinc-400 transition focus:bg-white focus:shadow-[0_2px_20px_-8px_rgba(20,20,45,0.25)] focus:outline-none focus:ring-2 focus:ring-violet-300/70 dark:bg-white/[0.06] dark:text-zinc-100 dark:focus:bg-zinc-900"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => nav({ thema: null })}
                  className={`rounded-full px-4 py-2 text-[13.5px] font-medium transition ${!activeTag ? "bg-violet-600 text-white shadow-md shadow-violet-600/25" : "bg-zinc-900/[0.05] text-zinc-700 hover:bg-zinc-900/[0.09] dark:bg-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.12]"}`}>
                  Alle
                </button>
                {visible.map((t) => {
                  const sel = activeTag === t.name;
                  return (
                    <button key={t.name} onClick={() => nav({ thema: sel ? null : t.name })}
                      className={`rounded-full px-4 py-2 text-[13.5px] font-medium transition ${sel ? "bg-violet-600 text-white shadow-md shadow-violet-600/25" : "bg-zinc-900/[0.05] text-zinc-700 hover:bg-zinc-900/[0.09] dark:bg-white/[0.07] dark:text-zinc-300 dark:hover:bg-white/[0.12]"}`}>
                      {t.name}
                    </button>
                  );
                })}
                {!q && hiddenCount > 0 && (
                  <button onClick={() => setShowAll((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13.5px] font-semibold text-violet-600 transition hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30">
                    {showAll ? "weniger" : `${hiddenCount} weitere`}<IconChevron open={showAll} className="h-3.5 w-3.5" />
                  </button>
                )}
                {q && !visible.length && <span className="px-1 py-2 text-[13.5px] text-zinc-400">kein Thema passt zu „{query}"</span>}
              </div>
            </div>

            <div className="fade-in-up fade-in-up-5">
              <SectionLabel hint={activeTag ? `gefiltert: ${activeTag}` : "neueste zuerst"}>Gerade aktiv</SectionLabel>
              {shownCatch.length ? (
                <>
                  {/* Die neueste Abstimmung steht oben in „Zuletzt abgestimmt" und ist hier
                      (via rest = shownCatch ohne featuredVote) NICHT doppelt; ältere Votes
                      mischen sich nach Datum normal in den Feed. */}
                  {pageItems.length > 0 && (
                    // key = Filter+Seite → bei Seitenwechsel remountet das Grid und fadet schnell rein
                    <div key={`${activeTag ?? ""}-${safePage}`} className="fade-quick mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {pageItems.map((c) => <CatchCard key={c.titel} c={c} />)}
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
                              ? "bg-violet-600 font-semibold text-white shadow-md shadow-violet-600/25"
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
                <p className={`px-5 py-8 text-center text-[13px] leading-relaxed text-zinc-400 ${SOFT_CARD}`}>
                  Vorschau: Inhalt nur für KI · Cybersicherheit · Krypto befüllt.<br />Mit echten Daten käme hier die auf „{activeTag}" gefilterte Liste.
                </p>
              )}
            </div>
          </section>
        );
      })()}
    </div>
  );
}
