"use client";

import { Fragment, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

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
type Unterthema = { name: string; tags?: Tag[]; catch: CatchItem[]; edges: Edge[]; ausgebaut?: boolean };
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
      edges: [
        { ziel: "Forschung", brücke: { titel: "KI-Gigafactory: Förderrahmen für Rechenzentren", typ: "Drucksache", datum: "vor 3 Tagen" } },
        { ziel: "Datenschutz", brücke: { titel: "Cloud-Souveränität für die Verwaltung", typ: "Rede", datum: "vor 3 Wochen" } },
        { ziel: "Innere Sicherheit", brücke: { titel: "Deepfakes im Wahlkampf — Kennzeichnungspflicht", typ: "Drucksache", datum: "vor 4 Tagen" } },
        { ziel: "Gesundheit", brücke: { titel: "KI in der Pflegedokumentation — Entlastung oder Risiko?", typ: "Rede", datum: "vor 2 Wochen" } },
        { ziel: "Verteidigung", brücke: { titel: "Cyber-Abwehr der Bundeswehr — Aufwuchs", typ: "Rede", datum: "vor 2 Wochen" } },
        { ziel: "Bildung", brücke: { titel: "KI an Schulen — Pilotprogramm der Länder", typ: "Rede", datum: "vor 1 Monat" } },
      ],
      catch: [
        { titel: "Deepfakes im Wahlkampf — Kennzeichnungspflicht", typ: "Drucksache", datum: "vor 4 Tagen", einzeiler: "Antrag zur Pflicht-Kennzeichnung KI-generierter Medien." },
        { titel: "MiCAR-Umsetzung: Krypto-Aufsicht", typ: "Drucksache", datum: "vor 10 Tagen", einzeiler: "Nationale Umsetzung der EU-Kryptomärkte-Verordnung." },
        { titel: "Cloud-Souveränität für die Verwaltung", typ: "Rede", datum: "vor 3 Wochen", einzeiler: "Debatte über Abhängigkeit von US-Cloud-Anbietern." },
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

// Weiche Karte: viel Radius, sanfter Schatten, hebt beim Hover an. Typ+Datum als
// leise Akzent-Eyebrow, der Titel trägt.
function CatchCard({ c }: { c: CatchItem }) {
  return (
    <div className={`group cursor-pointer p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_46px_-18px_rgba(20,20,45,0.32)] ${SOFT_CARD}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-500/90 dark:text-violet-400/90">{c.typ} · {c.datum}</p>
      <p className="mt-2 text-[15.5px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">{c.titel}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-400">{c.einzeiler}</p>
    </div>
  );
}

// Türen statt Labels: jede Kante zeigt das verbindende Dokument als Scent — nicht
// nur den Feld-Namen. Genau das Wikipedia-„Siehe auch"/NN-g-„Related"-Muster.
function EdgeDoors({ edges }: { edges: Edge[] }) {
  if (!edges.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {edges.map((e) => (
        <button key={e.ziel}
          className={`group flex flex-col p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-18px_rgba(20,20,45,0.3)] ${SOFT_CARD}`}>
          <span className="flex items-center gap-1.5 text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-200">
            {e.ziel}<IconArrow className="h-3.5 w-3.5 text-violet-400 transition group-hover:translate-x-0.5" />
          </span>
          {e.brücke && <span className="mt-1 truncate text-[12px] text-zinc-400 dark:text-zinc-500">{e.brücke.titel}</span>}
        </button>
      ))}
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

  // ephemere UI-Zustände bleiben lokal (gehören nicht in eine teilbare URL)
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [showConn, setShowConn] = useState(false);

  // Ansicht aus der URL ableiten: Blatt nur, wenn Wirtschaft + ausgebautes Unterthema.
  // Sonst = Master-Detail-Picker (Feld evtl. vorausgewählt).
  const unterIdx = unterSlug ? WIRTSCHAFT.unter.findIndex((u) => slugify(u.name) === unterSlug) : -1;
  const isLeaf = feld === "wirtschaft" && unterIdx >= 0 && !!WIRTSCHAFT.unter[unterIdx]?.ausgebaut;
  const selFeld = feld ? FELDER.find((f) => f.slug === feld) ?? null : null;

  // beim Wechsel von Feld/Unterthema die ephemeren UI-Zustände zurücksetzen
  useEffect(() => { setQuery(""); setShowAll(false); setShowConn(false); }, [feld, unterSlug]);

  // URL setzen, ohne neu zu laden; push = neuer History-Eintrag, replace = ersetzt
  function nav(patch: Record<string, string | null>, replace = false) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) { if (v === null) p.delete(k); else p.set(k, v); }
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
        const shownEdges = activeTag ? (activeObj?.edges ?? []) : u.edges;

        return (
          <section className="fade-in-up space-y-10">
            <header>
              <h2 className={`${DISPLAY} text-[2.6rem] font-bold leading-[1.02] tracking-[-0.03em] text-zinc-950 dark:text-zinc-50`}>{u.name}</h2>
              <p className="mt-3 text-[15px] text-zinc-500">Wähl ein konkretes Thema — oder lies, was gerade aktiv ist.</p>
            </header>

            <div className="fade-in-up fade-in-up-2">
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

            <div className="fade-in-up fade-in-up-3">
              <SectionLabel hint={activeTag ? `gefiltert: ${activeTag}` : "neueste zuerst"}>Gerade aktiv</SectionLabel>
              {shownCatch.length ? (
                <div className="grid gap-3 sm:grid-cols-3">{shownCatch.map((c) => <CatchCard key={c.titel} c={c} />)}</div>
              ) : (
                <p className={`px-5 py-8 text-center text-[13px] leading-relaxed text-zinc-400 ${SOFT_CARD}`}>
                  Vorschau: Inhalt nur für KI · Cybersicherheit · Krypto befüllt.<br />Mit echten Daten käme hier die auf „{activeTag}" gefilterte Liste.
                </p>
              )}
            </div>

            {/* Verbindungen sind Discovery, nicht Hauptinhalt → eingeklappt, auf Abruf */}
            {shownEdges.length > 0 && (
              <div className="fade-in-up fade-in-up-4">
                <button onClick={() => setShowConn((v) => !v)}
                  className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-zinc-700 transition hover:text-violet-600 dark:text-zinc-200">
                  {activeTag ? `Wo „${activeTag}" noch auftaucht` : `Wo „${u.name}" noch auftaucht`}
                  <IconChevron open={showConn} className="h-4 w-4 text-zinc-400" />
                </button>
                {showConn && <div className="mt-4"><EdgeDoors edges={shownEdges} /></div>}
              </div>
            )}

            <a className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-violet-600 dark:text-violet-400" href="#">
              {activeTag ? `Alle „${activeTag}"-Einträge` : "Alle Einträge ansehen"}<IconArrow className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </a>
          </section>
        );
      })()}
    </div>
  );
}
