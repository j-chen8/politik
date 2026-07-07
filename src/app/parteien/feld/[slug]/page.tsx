import { Fragment } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getFeldVergleich, getFeldVerhalten, getFeldAbstimmungen, type FeldVorlage } from "@/lib/db";
import { hasGold, getFeldVerhaltenGold } from "@/lib/gold-verhalten";
import { partyColors } from "@/lib/party-colors";
import { PARTEIEN } from "@/lib/partei-slug";
import { THEMENFELDER, slugToFeld } from "@/lib/themenfeld-slug";
import { getFeldMatrix } from "@/lib/partei-vergleich-matrix";
import { positionZumAntrag, POSITION_META } from "@/lib/vote-position";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ v?: string }>;
}

const PARTEI_ORDER = new Map(PARTEIEN.map((p, i) => [p.partei, i]));
const PARTEI_KURZ = new Map(PARTEIEN.map((p) => [p.partei, p.kurz]));

const richtungChip = (r: string) =>
  r === "ja"
    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
    : r === "nein"
      ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400"
      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300";

// Betreff entdoppeln ("Titel · Titel") und kürzen.
function cleanBetreff(s: string): string {
  const parts = [...new Set(s.split(" · ").map((x) => x.trim()).filter(Boolean))];
  const t = parts.join(" · ");
  return t.length > 170 ? t.slice(0, 168) + "…" : t;
}

function uniqVotes<T extends { voteId: number }>(vs: T[]): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const v of vs) if (!seen.has(v.voteId)) (seen.add(v.voteId), out.push(v));
  return out;
}
// Herkunft einer braunen Aussage: auf wie vielen verschiedenen Personen fußt sie,
// und sind es nur Bürgerfragen? Dient der ehrlichen Einordnung (Einzelstimme etc.).
function belegHerkunft(
  belege: { quelle: string; person: string | null }[],
): { named: string[]; hasDebate: boolean; onlyQa: boolean } | null {
  if (!belege?.length) return null;
  const named = [...new Set(belege.filter((b) => b.person).map((b) => b.person as string))];
  const hasDebate = belege.some((b) => b.quelle === "Rede" && !b.person);
  const onlyQa = belege.every((b) => b.quelle === "Q&A");
  return { named, hasDebate, onlyQa };
}
function herkunftLabel(h: { named: string[]; hasDebate: boolean; onlyQa: boolean }): string {
  const { named, hasDebate, onlyQa } = h;
  if (named.length === 0) return hasDebate ? "aus Bundestagsdebatte" : "";
  if (named.length === 1)
    return hasDebate
      ? `${named[0]} + Debatte`
      : onlyQa
        ? `Bürgerfrage · ${named[0]}`
        : `Einzelstimme · ${named[0]}`;
  return `${named.length} ${onlyQa ? "Bürgerfragen" : "Abgeordnete"}${hasDebate ? " + Debatte" : ""}`;
}

const richtungMark = (r: string) =>
  r === "ja"
    ? { glyph: "✓", cls: "text-emerald-600 dark:text-emerald-400" }
    : r === "nein"
      ? { glyph: "✗", cls: "text-rose-600 dark:text-rose-400" }
      : { glyph: "•", cls: "text-zinc-400 dark:text-zinc-500" };

// Datum (YYYY-MM-DD) aus einem Quellen-Label ziehen — fürs Ranking (jüngste zuerst).
const redeDatum = (label: string | null): string =>
  label?.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";

// Eine Quellen-Rede als Link (extern = Protokoll-Deeplink, intern = Next-Link).
function RedeLink({ url, label }: { url: string; label: string }) {
  return url.startsWith("http") ? (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-700 dark:text-blue-400 hover:underline"
    >
      {label}
    </a>
  ) : (
    <Link href={url} className="text-blue-700 dark:text-blue-400 hover:underline">
      {label}
    </Link>
  );
}

export default async function FeldVergleichPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { v } = await searchParams;
  const kurz = v !== "full"; // Default kompakt; ?v=full zeigt die ausführliche Synthese
  const feld = slugToFeld(slug);
  if (!feld) notFound();

  const eintraege = getFeldVergleich(feld).sort(
    (a, b) =>
      (PARTEI_ORDER.get(a.partei) ?? 99) - (PARTEI_ORDER.get(b.partei) ?? 99),
  );
  if (eintraege.length === 0) notFound();

  const matrix = getFeldMatrix(feld);
  const parteien = eintraege.map((e) => e.partei);

  // "Tut"-Schicht: Gold-Volltext-Extraktion (wörtliche Belege, korrigiertes
  // Primär-Feld) sobald für dieses Feld vorhanden, sonst die alte Synthese.
  const verhalten = hasGold(feld) ? getFeldVerhaltenGold(feld, kurz) : getFeldVerhalten(feld);

  // Referenz-Apparat: EINE Nummer PRO PUNKT (nicht pro Einzelbeleg) — sonst stehen
  // bis zu 50 Fußnoten in einer Zelle. Der Quellen-Eintrag listet ALLE Reden des
  // Punkts. ref (rede_id/frage_url) -> {url, label} aus den aufgelösten Belegen.
  const refInfo = new Map<
    string,
    { url: string | null; label: string | null; zitat: string | null; verifiziert: boolean }
  >();
  if (matrix)
    for (const asp of matrix.aspekte)
      for (const p of parteien)
        for (const b of verhalten[asp.label]?.[p]?.belege ?? []) {
          if (!b.quelleId) continue;
          const prev = refInfo.get(b.quelleId);
          // Erststand gewinnt — außer ein späterer Beleg ist wörtlich verifiziert,
          // dann zeigen wir lieber dessen geprüftes Zitat.
          if (!prev || (!prev.verifiziert && b.verifiziert))
            refInfo.set(b.quelleId, {
              url: b.quelleUrl,
              label: b.quelleLabel,
              zitat: b.zitat || null,
              verifiziert: b.verifiziert,
            });
        }

  type QuellRede = {
    url: string;
    label: string;
    zitat: string | null;
    verifiziert: boolean;
  };
  type QuellEintrag = {
    n: number;
    partei: string;
    punkt: string;
    reden: QuellRede[];
  };
  const quellen: QuellEintrag[] = [];
  const punktNum = new Map<string, number>(); // "aspekt|partei|index" -> n
  if (matrix)
    for (const asp of matrix.aspekte)
      for (const p of parteien)
        (verhalten[asp.label]?.[p]?.punkte ?? []).forEach((pt, idx) => {
          const reden: QuellRede[] = pt.refs
            .map((r) => refInfo.get(r))
            .filter((x): x is NonNullable<typeof x> => !!x && !!x.url)
            .map((x) => ({
              url: x.url as string,
              label: x.label || x.url!,
              zitat: x.zitat,
              verifiziert: x.verifiziert,
            }))
            // Wörtlich belegte zuerst, dann die jüngsten Reden oben.
            .sort(
              (a, b) =>
                Number(b.verifiziert) - Number(a.verifiziert) ||
                redeDatum(b.label).localeCompare(redeDatum(a.label)),
            );
          if (!reden.length) return;
          const n = quellen.length + 1;
          punktNum.set(`${asp.label}|${p}|${idx}`, n);
          quellen.push({ n, partei: p, punkt: pt.text, reden });
        });
  // Abstimmungen aus der manuell verifizierten Klassifikation: vote_aspekt koppelt
  // jeden Sach-Vote (verfahren=0) an einen Gold-Aspekt; feldweite Votes ohne Aspekt
  // (Haushalt/Immunität …) zeigen wir separat. Voller Fraktions-Roll-Call je Vote.
  const { proAspekt, feldweit } = getFeldAbstimmungen(feld);
  const hatVotes =
    Object.values(proAspekt).some((vl) => vl.length > 0) || feldweit.length > 0;
  const KNOWN = new Set(["ja", "nein", "enthaltung", "enthalten"]);
  // Vorlagen eines Aspekts, zu denen Partei p tatsächlich eine Stimme abgegeben hat.
  const zellenVotes = (aspLabel: string, p: string) =>
    (proAspekt[aspLabel] ?? [])
      .map((vl) => ({ ...vl, richtung: vl.fraktionen[p] }))
      .filter((vl) => vl.richtung && KNOWN.has(vl.richtung.toLowerCase()));

  // Eine Vorlage als Listeneintrag mit vollständigem Fraktions-Roll-Call (für die
  // „Wie die Fraktionen abgestimmt haben"-Sektion, je Aspekt und feldweit gleich).
  // Bei Beschlussempfehlung-auf-Ablehnung zeigen wir die Sachposition (dafür/dagegen)
  // statt der gegenläufigen Rohstimme und benennen das Verfahren.
  const voteLi = (g: FeldVorlage) => (
    <li key={g.voteId} className="text-[12.5px] leading-snug">
      <span className="text-zinc-700 dark:text-zinc-300">
        {g.url ? (
          <Link href={g.url} className="hover:text-zinc-900 dark:hover:text-zinc-100 hover:underline">
            {cleanBetreff(g.betreff)}
          </Link>
        ) : (
          cleanBetreff(g.betreff)
        )}
      </span>
      {g.beschlussAblehnung && (
        <span className="ml-1.5 text-[10.5px] font-medium text-amber-700 dark:text-amber-400">
          · über Beschlussempfehlung (Ablehnung empfohlen) → Position zum Antrag
        </span>
      )}
      <span className="mt-1 flex flex-wrap gap-1.5">
        {parteien
          .filter((p) => g.fraktionen[p] && KNOWN.has(g.fraktionen[p].toLowerCase()))
          .map((p) => {
            const { bg, fg } = partyColors(p);
            const r = g.fraktionen[p];
            const pos = g.beschlussAblehnung ? positionZumAntrag(r, true) : null;
            const label = pos ? POSITION_META[pos].label : r;
            const chipCls = pos
              ? pos === "dafuer"
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                : pos === "dagegen"
                  ? "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              : richtungChip(r);
            return (
              <span
                key={p}
                className="inline-flex items-center overflow-hidden rounded"
                title={g.beschlussAblehnung ? `${p}: ${label} (Rohstimme zur Empfehlung: ${r})` : undefined}
              >
                <span
                  className="px-1.5 py-px text-[10.5px] font-semibold"
                  style={{ backgroundColor: bg, color: fg }}
                >
                  {PARTEI_KURZ.get(p) ?? p}
                </span>
                <span className={`num px-1.5 py-px text-[10.5px] font-semibold ${chipCls}`}>
                  {label}
                </span>
              </span>
            );
          })}
      </span>
    </li>
  );

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        {/* Brotkrumen */}
        <div className="mb-6 text-[12px] text-zinc-400 dark:text-zinc-500">
          <Link href="/parteien" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
            Parteien
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-500 dark:text-zinc-400">Vergleich</span>
        </div>

        {/* Header */}
        <header className="mb-6">
          <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Was die Parteien wollen
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-3xl">
            {feld}
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-zinc-600 dark:text-zinc-300">
            {matrix ? (
              <>
                Verglichen nach einzelnen Aspekten.{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">Normale Schrift</span> = Position
                laut Wahlprogramm 2025.{" "}
                <span className="font-medium text-amber-700 dark:text-amber-400">Braun</span> = ergänzt aus
                Reden &amp; Bürgerfragen (Pilot, synthetisiert).
                <span className="mt-2 block text-[12.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">Normale Schrift</span> ist die{" "}
                  <span className="font-medium">Partei</span> (Wahlprogramm).{" "}
                  <span className="font-medium text-amber-700 dark:text-amber-400">Braun</span> und die
                  Abstimmungen zeigen die <span className="font-medium">Fraktion</span> im
                  Bundestag: Reden geben meist die intern abgestimmte Fraktionslinie
                  wieder, Bürgerfragen beantworten einzelne Abgeordnete. Ein starkes
                  Signal für die Position — aber Fraktion und Partei sind nicht dasselbe
                  und nicht gleichzusetzen.{" "}
                  <span className="text-zinc-400 dark:text-zinc-500">
                    „keine Aussage" in der Reden-Zeile heißt: in den ausgewerteten Reden
                    keine klare Aussage gefunden — nicht zwingend, dass die Fraktion dazu
                    keine Position hat.
                  </span>
                </span>
              </>
            ) : (
              "Die Kernforderungen aller Parteien in diesem Themenfeld — laut Wahlprogramm zur Bundestagswahl 2025. Für Details und Belege jede Partei aufklappen."
            )}
          </p>
        </header>

        {/* Themenfeld-Umschalter (zugleich Sprung-Nav über alle Felder) */}
        <nav className="mb-8 flex flex-wrap gap-1.5" aria-label="Anderes Themenfeld">
          {THEMENFELDER.map((t) => {
            const aktiv = t.feld === feld;
            return (
              <Link
                key={t.slug}
                href={`/parteien/feld/${t.slug}`}
                aria-current={aktiv ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
                  aktiv
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-card text-zinc-600 dark:text-zinc-300 border border-border hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                {t.kurz}
              </Link>
            );
          })}
        </nav>

        {/* Synthese-Detailgrad umschalten (nur wo Gold-Synthese vorliegt) */}
        {matrix && hasGold(feld) && (
          <div className="mb-4 flex items-center gap-2 text-[12px]">
            <span className="text-zinc-400 dark:text-zinc-500">„aus Reden“-Stichpunkte:</span>
            <span className="inline-flex overflow-hidden rounded-full border border-border">
              <Link
                href={`/parteien/feld/${slug}`}
                aria-current={kurz ? "page" : undefined}
                className={`px-3 py-1 font-medium transition-colors ${
                  kurz ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-card text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                Kompakt
              </Link>
              <Link
                href={`/parteien/feld/${slug}?v=full`}
                aria-current={!kurz ? "page" : undefined}
                className={`px-3 py-1 font-medium transition-colors ${
                  !kurz ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-card text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                }`}
              >
                Ausführlich
              </Link>
            </span>
          </div>
        )}

        {matrix ? (
          /* ---- Aspekt-Matrix. Kein w-screen-Ausbruch mehr: der rechnete mit
             zentrierter Seite und schnitt seit der App-Shell (linke Leiste)
             die letzte Partei-Spalte unscrollbar ab. Der Container scrollt
             selbst horizontal, wenn die Spalten nicht passen. ---- */
          <div>
            {/* snap-x: seitliches Wischen rastet an Partei-Spalten ein;
                scroll-pl-28 = Breite der Sticky-Label-Spalte, damit die
                eingerastete Spalte nicht unter den Labels verschwindet. */}
            <div className="mx-auto max-w-[88rem] snap-x snap-mandatory scroll-pl-28 overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 w-28 min-w-28 bg-card px-3 py-3 text-[11px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Aspekt
                  </th>
                  {parteien.map((p) => {
                    const { bg, fg } = partyColors(p);
                    return (
                      <th
                        key={p}
                        className="min-w-[240px] snap-start px-3 py-3 align-bottom lg:min-w-[170px]"
                      >
                        <span
                          className="inline-block rounded-md px-2 py-0.5 text-[12px] font-semibold"
                          style={{ backgroundColor: bg, color: fg }}
                        >
                          {PARTEI_KURZ.get(p) ?? p}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {matrix.aspekte.map((asp, ri) => {
                  const zebra = ri % 2 === 1;
                  const rowBg = zebra ? "bg-zinc-50/40 dark:bg-zinc-800/40" : "";
                  // Sticky-Zellen brauchen OPAKEN Hintergrund (Inhalt scrollt
                  // darunter durch) — je Modus, NIE hartkodiert hell (#fafafa
                  // war der Dark-Mode-Bug: weiße Flecken in der Tabelle).
                  const thBg = zebra ? "bg-zinc-50 dark:bg-zinc-800" : "bg-card";
                  const sep = "border-t border-border"; // trennt Aspekt-Blöcke
                  const stick = "sticky left-0 z-10 w-28 min-w-28";
                  return (
                    <Fragment key={asp.label}>
                      {/* Themen-Überschrift über den drei Bändern */}
                      <tr className={rowBg}>
                        <th
                          colSpan={parteien.length + 1}
                          className={`${sep} ${thBg} px-4 pt-4 pb-2 text-left text-[13px] font-semibold leading-snug text-zinc-800 dark:text-zinc-200`}
                        >
                          {/* Überschrift spannt die volle Tabellenbreite → würde
                              horizontal mitscrollen; sticky pinnt den Text links. */}
                          <span className="sticky left-4 inline-block max-w-[calc(100vw-4rem)]">
                            {asp.label}
                          </span>
                        </th>
                      </tr>
                      {/* Band 1 — Wahlprogramm (schwarz) */}
                      <tr className={rowBg}>
                        <th
                          scope="row"
                          className={`${stick} ${thBg} border-t border-border px-3 py-1.5 align-top text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500`}
                        >
                          Wahlprogramm
                        </th>
                        {parteien.map((p) => (
                          <td
                            key={p}
                            className="border-l border-t border-border px-3 py-1.5 align-top"
                          >
                            {asp.zellen[p] ? (
                              <span className="block text-[12.5px] leading-snug text-zinc-700 dark:text-zinc-300">
                                {asp.zellen[p]}
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-300 dark:text-zinc-600">
                                n/a
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                      {/* Zeile 2 — aus Reden/Q&A (braun) */}
                      <tr className={rowBg}>
                        <th
                          scope="row"
                          className={`${stick} ${thBg} border-t border-border px-3 py-1.5 align-top text-[10px] font-medium uppercase tracking-wide text-amber-600/80 dark:text-amber-400/80`}
                        >
                          aus Reden
                        </th>
                        {parteien.map((p) => {
                          const beh = verhalten[asp.label]?.[p];
                          return (
                            <td
                              key={p}
                              className="border-l border-t border-border px-3 py-1.5 align-top"
                            >
                              {beh && beh.punkte.length > 0 ? (
                                <span className="block border-l-2 border-amber-300 dark:border-amber-800/50 pl-2">
                                  {beh.punkte.map((pt, pi) => {
                                    const n = punktNum.get(`${asp.label}|${p}|${pi}`);
                                    return (
                                      <span
                                        key={pi}
                                        className="block text-[12.5px] italic leading-snug text-amber-800 dark:text-amber-400"
                                      >
                                        {beh.punkte.length > 1 && (
                                          <span className="mr-1 not-italic text-amber-400">•</span>
                                        )}
                                        {pt.text}
                                        {n != null && (
                                          <a
                                            href={`#q${n}`}
                                            className="num ml-0.5 align-super text-[9px] not-italic text-blue-600 dark:text-blue-400 hover:underline"
                                          >
                                            [{n}]
                                          </a>
                                        )}
                                      </span>
                                    );
                                  })}
                                </span>
                              ) : (
                                <span
                                  className="text-[11px] text-zinc-300 dark:text-zinc-600"
                                  title="Keine klare Aussage in den ausgewerteten Reden gefunden — nicht zwingend, dass die Fraktion dazu keine Position hat."
                                >
                                  keine Aussage
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Zeile 3 — Abstimmungen (Stichpunkte) */}
                      <tr className={rowBg}>
                        <th
                          scope="row"
                          className={`${stick} ${thBg} border-t border-border px-3 pt-1.5 pb-5 align-top text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500`}
                        >
                          abgestimmt
                        </th>
                        {parteien.map((p) => {
                          const zv = uniqVotes(zellenVotes(asp.label, p));
                          return (
                            <td
                              key={p}
                              className="border-l border-t border-border px-3 pt-1.5 pb-5 align-top"
                            >
                              {zv.length > 0 && (
                                <span className="block space-y-0.5">
                                  {zv.slice(0, 5).map((vt, i) => {
                                    // Bei Beschlussempfehlung-auf-Ablehnung die Sachposition
                                    // markieren (Rohstimme ist gegenläufig), sonst die Rohstimme.
                                    const m = vt.beschlussAblehnung
                                      ? (() => {
                                          const pos = positionZumAntrag(vt.richtung, true);
                                          return pos === "dafuer"
                                            ? { glyph: "✓", cls: "text-emerald-600 dark:text-emerald-400" }
                                            : pos === "dagegen"
                                              ? { glyph: "✗", cls: "text-rose-600 dark:text-rose-400" }
                                              : { glyph: "•", cls: "text-zinc-400 dark:text-zinc-500" };
                                        })()
                                      : richtungMark(vt.richtung);
                                    const inner = (
                                      <>
                                        <span className={`mr-1 font-semibold ${m.cls}`}>
                                          {m.glyph}
                                        </span>
                                        {vt.kurz ?? cleanBetreff(vt.betreff)}
                                      </>
                                    );
                                    return (
                                      <span
                                        key={i}
                                        className="block text-[11px] leading-snug text-zinc-500 dark:text-zinc-400"
                                      >
                                        {vt.url ? (
                                          <Link
                                            href={vt.url}
                                            title={cleanBetreff(vt.betreff)}
                                            className="hover:text-zinc-800 dark:hover:text-zinc-200 hover:underline"
                                          >
                                            {inner}
                                          </Link>
                                        ) : (
                                          <span title={cleanBetreff(vt.betreff)}>{inner}</span>
                                        )}
                                      </span>
                                    );
                                  })}
                                  {zv.length > 5 && (
                                    <span className="block text-[10px] text-zinc-400 dark:text-zinc-500">
                                      +{zv.length - 5} weitere
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        ) : (
          /* ---- Fallback: Spalten je Partei (Felder ohne Matrix) ---- */
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {eintraege.map(({ partei, pos }) => {
              const { bg, fg } = partyColors(partei);
              const hatKompakt = pos.kompakt.length > 0;
              return (
                <section
                  key={partei}
                  className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div
                    className="px-4 py-2.5 text-[13px] font-semibold"
                    style={{ backgroundColor: bg, color: fg }}
                  >
                    {PARTEI_KURZ.get(partei) ?? partei}
                  </div>
                  <div className="flex-1 px-4 py-4">
                    {hatKompakt ? (
                      <ul className="space-y-2">
                        {pos.kompakt.map((b, i) => (
                          <li
                            key={i}
                            className="flex gap-2 text-[13px] leading-snug text-zinc-700 dark:text-zinc-300"
                          >
                            <span
                              className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ backgroundColor: bg }}
                              aria-hidden
                            />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {pos.position}
                      </p>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* "Tut"-Schicht: tatsächliches Abstimmungsverhalten der Fraktionen */}
        {hatVotes && matrix && (
          <section className="mt-10">
            <h2 className="mb-1 text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">
              Wie die Fraktionen abgestimmt haben
            </h2>
            <p className="mb-4 max-w-2xl text-[12px] leading-relaxed text-zinc-400 dark:text-zinc-500">
              Tatsächliches Abstimmungsverhalten im Bundestag zu Vorlagen dieses Feldes.
              Klick öffnet die namentliche Abstimmung im Plenarprotokoll.
            </p>
            <div className="space-y-5">
              {matrix.aspekte
                .filter((asp) => (proAspekt[asp.label]?.length ?? 0) > 0)
                .map((asp) => (
                  <div key={asp.label}>
                    <div className="mb-2 text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200">
                      {asp.label}
                    </div>
                    <ul className="space-y-2.5">{proAspekt[asp.label].map(voteLi)}</ul>
                  </div>
                ))}
              {/* Sach-Votes des Feldes ohne kuratierten Aspekt (Haushalt, Immunität,
                  Verfahren ohne Synthese-Anknüpfung) — separat, nicht unterschlagen. */}
              {feldweit.length > 0 && (
                <div>
                  <div className="mb-2 text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200">
                    Weitere Abstimmungen im Feld
                  </div>
                  <ul className="space-y-2.5">{feldweit.map(voteLi)}</ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Quellen-Apparat: EINKLAPPBAR, ein Eintrag pro Punkt mit allen seinen Reden */}
        {quellen.length > 0 && (
          <details className="group mt-10 border-t border-border pt-5">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">
              <span className="text-zinc-400 dark:text-zinc-500 transition-transform group-open:rotate-90">›</span>
              Quellen ({quellen.length}) — Reden &amp; Bürgerfragen hinter den braunen
              Punkten
            </summary>
            <p className="mb-3 mt-2 max-w-2xl text-[12px] leading-relaxed text-zinc-400 dark:text-zinc-500">
              Pro <span className="text-amber-700 dark:text-amber-400">braunem</span> Punkt ein Eintrag mit
              allen belegenden Reden (Protokoll-Deeplink) bzw. Bürgerfragen. Die Punkte sind
              synthetisiert, sinngemäß; mit{" "}
              <span className="font-medium text-emerald-700 dark:text-emerald-400">wörtlich</span> markierte Stellen
              sind im Protokoll wortgleich geprüft.
            </p>
            <ol className="space-y-2">
              {quellen.map((q) => {
                const zitate = q.reden
                  .filter((r) => r.verifiziert && r.zitat)
                  .slice(0, 2);
                return (
                  <li
                    key={q.n}
                    id={`q${q.n}`}
                    className="scroll-mt-20 text-[12px] leading-relaxed target:bg-blue-50 dark:target:bg-blue-950/40"
                  >
                    <span className="num mr-1.5 text-zinc-400 dark:text-zinc-500">{q.n}.</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {PARTEI_KURZ.get(q.partei) ?? q.partei}: „{q.punkt}“
                    </span>
                    {/* Wörtlich verifizierte Zitate zuerst — im Protokoll geprüft */}
                    {zitate.map((r, i) => (
                      <span key={`z${i}`} className="mt-1 block pl-5 text-zinc-600 dark:text-zinc-300">
                        <span className="mr-1 rounded bg-emerald-50 dark:bg-emerald-950/40 px-1 py-px text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                          wörtlich
                        </span>
                        „{r.zitat}“ — <RedeLink url={r.url} label={r.label} />
                      </span>
                    ))}
                    {/* Alle Fundstellen: Top-8 sichtbar, Rest aufklappbar (nichts entfällt) */}
                    <span className="mt-0.5 block pl-5">
                      <span className="text-zinc-400 dark:text-zinc-500">Fundstellen: </span>
                      {q.reden.slice(0, 8).map((r, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-zinc-300 dark:text-zinc-600"> · </span>}
                          <RedeLink url={r.url} label={r.label} />
                        </span>
                      ))}
                      {q.reden.length > 8 && (
                        <details className="mt-1">
                          <summary className="cursor-pointer list-none text-blue-600 dark:text-blue-400 hover:underline">
                            +{q.reden.length - 8} weitere Fundstellen
                          </summary>
                          <span className="mt-0.5 block">
                            {q.reden.slice(8).map((r, i) => (
                              <span key={i}>
                                {i > 0 && <span className="text-zinc-300 dark:text-zinc-600"> · </span>}
                                <RedeLink url={r.url} label={r.label} />
                              </span>
                            ))}
                          </span>
                        </details>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </details>
        )}

        {/* Volltext & Belege je Partei (immer, unter dem Vergleich) */}
        <h2 className="mb-3 mt-8 text-[13px] font-semibold tracking-tight text-zinc-700 dark:text-zinc-300">
          Volltext &amp; Belege je Partei
        </h2>
        <div className="space-y-2">
          {eintraege.map(({ partei, pos }) => {
            const { bg, fg } = partyColors(partei);
            const verif = pos.belege.filter((b) => b.verifiziert).length;
            return (
              <details
                key={partei}
                className="group/b overflow-hidden rounded-xl border border-border bg-card"
              >
                <summary className="list-none flex cursor-pointer select-none items-center gap-2.5 px-4 py-3">
                  <ChevronDown
                    className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 transition-transform -rotate-90 group-open/b:rotate-0"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                  <span
                    className="rounded-md px-2 py-0.5 text-[12px] font-semibold"
                    style={{ backgroundColor: bg, color: fg }}
                  >
                    {PARTEI_KURZ.get(partei) ?? partei}
                  </span>
                  {pos.belege.length > 0 && (
                    <span className="num text-[11px] text-zinc-400 dark:text-zinc-500">
                      {pos.belege.length} Belege
                    </span>
                  )}
                </summary>
                <div className="px-4 pb-4 pl-11">
                  <p className="text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-300">
                    {pos.position}
                  </p>
                  {pos.belege.length > 0 && (
                    <ul className="mt-3 space-y-2.5">
                      {pos.belege.map((b, i) => (
                        <li
                          key={i}
                          className="border-l-2 border-border pl-3 text-[12.5px] leading-relaxed text-zinc-600 dark:text-zinc-300"
                        >
                          <span className="text-zinc-800 dark:text-zinc-200">„{b.zitat}“</span>
                          {b.verifiziert && b.seite != null && (
                            <span className="num ml-1.5 whitespace-nowrap text-[11px] text-zinc-400 dark:text-zinc-500">
                              S. {b.seite}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {verif < pos.belege.length && (
                    <p className="mt-2.5 text-[11px] text-zinc-400 dark:text-zinc-500">
                      Zitate ohne Seitenzahl sind sinngemäß zusammengefasst, nicht
                      wortgleich.
                    </p>
                  )}
                </div>
              </details>
            );
          })}
        </div>

        <p className="mt-8 text-[12px] leading-relaxed text-zinc-400 dark:text-zinc-500">
          {matrix
            ? "„n/a“ heißt: im Wahlprogramm dieser Partei nicht behandelt — nicht zwingend Ablehnung. Geplant: solche Lücken aus Reden, Bürgerfragen und Abstimmungen ergänzen. Quelle: offizielle Wahlprogramme zur BTW 2025, Belege geprüft."
            : "Quelle: offizielle Wahlprogramme zur Bundestagswahl 2025, extraktiv und ohne Wertung; Belege mit geprüfter Fundstelle."}
        </p>
      </div>
    </div>
  );
}
