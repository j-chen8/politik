import { ContextualLink as Link } from "@/components/ContextualLink";
import { ArrowLeft, ListTree } from "lucide-react";
import {
  getRedenTonalitaetByFraktion,
  getDrucksacheTonalitaetByFraktion,
  getDrucksacheMonthlyTrend,
  getGesetzgebungsFunnel,
  type GesetzgebungsFunnelRow,
  getGesetzesdauer,
  getTopicInitiativeMatrix,
} from "@/lib/db";
import { partyColor } from "@/lib/party-colors";
import { InitiativeMatrix } from "@/components/InitiativeMatrix";

// Dokument-Analysen (Vor-Parlaments-Analysen u.ä.): eigene Unterseiten von
// /analyse — hier ist ihre dauerhafte Heimat, damit sie nicht verwaisen, wenn
// der Startseiten-Aufmacher weiterzieht. Bei neuer Analyse: Eintrag ergänzen.
const DOKUMENT_ANALYSEN = [
  {
    href: "/analyse/haushalt-2027",
    art: "Vor-Parlaments-Analyse",
    titel: "Bundeshaushalt 2027 — der Entwurf im Überblick",
    teaser: "203,7 Mrd. € neue Schulden, die Schuldenregel-Mechanik, die größten Verschiebungen je Einzelplan — aus der Kabinettsfassung, vor der Drucksache.",
    stand: "08. Juli 2026",
  },
];

export const metadata = {
  title: "Analyse — Was die Daten zeigen | Politik-Radar",
  description:
    "Sechs empirische Befunde aus dem Plenum: Reden-Stil-Profile, Tonalität Kleiner Anfragen, Volumen-Asymmetrie, Themen-Profil pro Fraktion, Gesetzgebungs-Trichter und Gesetzes-Tempo.",
};

const FRAKTION_ORDER = ["CDU/CSU", "SPD", "Grüne", "Linke", "AfD"];

const PARTY_KEY: Record<string, string> = {
  "CDU/CSU": "cdu",
  SPD: "spd",
  Grüne: "grün",
  Linke: "linke",
  AfD: "afd",
};

function fmtPct(x: number): string {
  return `${x.toFixed(1).replace(".", ",")} %`;
}

function fmtNum(x: number): string {
  return x.toLocaleString("de-DE");
}

export default function AnalysePage() {
  const reden = getRedenTonalitaetByFraktion();
  const ka = getDrucksacheTonalitaetByFraktion();
  const trend = getDrucksacheMonthlyTrend();
  const funnel = getGesetzgebungsFunnel();
  const initiativeMatrix = getTopicInitiativeMatrix();
  const dauer = getGesetzesdauer();

  // === BEFUND 1: Reden-Stil-Profile ===
  // Jede Fraktion hat ein dominantes Stil-Profil — wir zeigen die Anteile
  // der fünf relevantesten Tonalitäten getrennt (KEINE Aggregation, weil
  // sozial-anklagend und konfrontativ-faktenrhetorisch verschiedene
  // Stoßrichtungen haben).
  const REDEN_STIL_KEYS = [
    "polemisch",
    "polemisch_sachlich",
    "konfrontativ_faktenrhetorisch",
    "sozial_anklagend",
    "sachlich",
  ] as const;
  const STIL_LABEL: Record<string, string> = {
    polemisch: "polemisch",
    polemisch_sachlich: "polemisch-sachlich",
    konfrontativ_faktenrhetorisch: "konfrontativ-faktenrhetorisch",
    sozial_anklagend: "sozial-anklagend",
    sachlich: "sachlich",
  };
  const redenByFraktion = FRAKTION_ORDER.map((f) => {
    const row = reden.find((r) => r.fraktion === f);
    if (!row) return null;
    const total = row.total;
    const subShares: Record<string, number> = {};
    for (const slug of REDEN_STIL_KEYS) {
      subShares[slug] = ((row.byTonalitaet[slug] ?? 0) / total) * 100;
    }
    // Dominanter Stil = Slug mit dem höchsten Anteil unter den fünf Stilen.
    const dominantSlug = REDEN_STIL_KEYS.reduce((best, slug) =>
      subShares[slug] > subShares[best] ? slug : best,
    );
    return {
      fraktion: f,
      total,
      dominantSlug,
      dominantPct: subShares[dominantSlug],
      shares: subShares,
    };
  }).filter(Boolean) as Array<{
    fraktion: string;
    total: number;
    dominantSlug: string;
    dominantPct: number;
    shares: Record<string, number>;
  }>;

  // === BEFUND 2: KA-Tonalität ===
  const KA_KONFRONT_SLUGS = ["fordernd", "kritisch"];
  const kaByFraktion = ka
    .map((row) => {
      const konfrontN = KA_KONFRONT_SLUGS.reduce(
        (acc, slug) => acc + (row.byTonalitaet[slug] ?? 0),
        0,
      );
      const sachlichN = row.byTonalitaet["sachlich"] ?? 0;
      const informierendN = row.byTonalitaet["informierend"] ?? 0;
      return {
        fraktion: row.fraktion,
        total: row.total,
        konfrontPct: (konfrontN / row.total) * 100,
        sachlichPct: (sachlichN / row.total) * 100,
        informierendPct: (informierendN / row.total) * 100,
      };
    })
    .sort((a, b) => b.total - a.total);

  // === BEFUND 3: Volumen + Trend ===
  // Volumen reuse aus kaByFraktion (total).
  // Trend: monatliche konfront_pct pro Fraktion. Wir nutzen die letzten 12
  // Monate für lesbare Skalierung; kürzere Reihen für Fraktionen mit
  // weniger Daten haben Lücken (skip statt Null).
  const monthLabels = trend.map((t) => t.monat);
  const trendFraktionen = ["AfD", "Grüne", "Linke"];

  const tocItems = [
    { id: "befund-1", label: "1 · Plenarreden", sub: "Drei Stil-Profile in der Opposition" },
    { id: "befund-2", label: "2 · Kleine Anfragen", sub: "AfD nicht konfrontativer als Linke und Grüne" },
    { id: "befund-3", label: "3 · Volumen und Verlauf", sub: "Mehr Masse, nicht mehr Schärfe" },
    { id: "befund-4", label: "4 · Themen", sub: "Wer treibt welche Themen" },
    { id: "befund-5", label: "5 · Gesetzgebung", sub: "Der Absender entscheidet über die Abstimmung" },
    { id: "befund-6", label: "6 · Tempo", sub: `Im Median ${dauer.medianTotal} Tage bis zur Verkündung` },
  ];

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zur Startseite
        </Link>

        {/* Mobile: TOC als ausklappbares Detail-Element (Methodik-Muster) */}
        <details className="lg:hidden mb-8 rounded-2xl border border-border bg-card">
          <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-[12px] font-medium text-zinc-700 dark:text-zinc-300">
            <ListTree className="w-3.5 h-3.5" strokeWidth={2.25} />
            Inhaltsverzeichnis
          </summary>
          <div className="px-4 pb-4">
            <AnalyseToc items={tocItems} />
          </div>
        </details>

        <div className="lg:flex lg:gap-12">
          <main className="lg:flex-1 min-w-0">

        <div className="mb-12">
          <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Analyse
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4">
            Was die Daten zeigen
          </h1>
          <p className="text-[16px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Sechs empirische Befunde aus dem aktuellen Datenbestand — nüchtern dokumentiert.
            Manche bestätigen, manche widersprechen dem ersten politischen Reflex.
          </p>
          <p className="text-[14px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-3">
            Befunde 1–4 beruhen auf der LLM-Klassifikation von Plenarreden, Kleinen Anfragen
            und Drucksachen, Befunde 5–6 auf den amtlichen DIP-Vorgangsdaten — dort ist keine
            KI im Spiel (WP21, Stand{" "}
            <span className="num">{trend[trend.length - 1]?.monat ?? "—"}</span>). Methodische
            Grenzen: siehe{" "}
            <Link
              href="/methodik"
              className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline underline-offset-2"
            >
              Methodik
            </Link>
            .
          </p>
        </div>

        {/* === DOKUMENT-ANALYSEN: Unterseiten von /analyse (dauerhafte Heimat) === */}
        {DOKUMENT_ANALYSEN.length > 0 && (
          <section className="mb-16">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
              Dokument-Analysen
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {DOKUMENT_ANALYSEN.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="group flex flex-col gap-1.5 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-zinc-300 dark:hover:border-zinc-600"
                >
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
                    {a.art} · Stand {a.stand}
                  </span>
                  <span className="text-[17px] font-semibold leading-snug text-foreground group-hover:underline group-hover:decoration-zinc-300 group-hover:underline-offset-4 dark:group-hover:decoration-zinc-600">
                    {a.titel}
                  </span>
                  <span className="text-[13.5px] leading-relaxed text-muted">{a.teaser}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* === BEFUND 1: Reden-Stil-Profile === */}
        <section id="befund-1" className="mb-16 scroll-mt-20">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Befund 1 · Plenarreden
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 mb-3 leading-tight">
              Drei sehr unterschiedliche Stil-Profile in der Opposition.
            </h2>
            <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Statt „die Opposition ist konfrontativ" zeigen die Daten drei verschiedene
              rhetorische Profile:
            </p>
            <ul className="mt-3 space-y-1.5 text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              <li>
                · <strong className="text-zinc-950 dark:text-zinc-50">AfD</strong> dominiert über{" "}
                <GlossarLink slug="polemisch">polemisch</GlossarLink> — direkte Schärfe, oft ohne
                Belege.
              </li>
              <li>
                · <strong className="text-zinc-950 dark:text-zinc-50">Grüne</strong> dominieren über{" "}
                <GlossarLink slug="konfrontativ-faktenrhetorisch">
                  konfrontativ-faktenrhetorisch
                </GlossarLink>{" "}
                — Schärfe gegen Personen, mit nachprüfbaren Belegen.
              </li>
              <li>
                · <strong className="text-zinc-950 dark:text-zinc-50">Linke</strong> dominiert über{" "}
                <GlossarLink slug="sozial-anklagend">sozial-anklagend</GlossarLink> — Anklage von
                Verhältnissen, weniger gegen einzelne Akteure.
              </li>
            </ul>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-4xl mx-auto">
            <div className="space-y-4">
              {redenByFraktion.map((row) => (
                <RedenStackedBar
                  key={row.fraktion}
                  fraktion={row.fraktion}
                  total={row.total}
                  dominantSlug={row.dominantSlug}
                  dominantPct={row.dominantPct}
                  shares={row.shares}
                />
              ))}
            </div>
            <Legend
              items={[
                { label: "polemisch", color: "#dc2626" },
                { label: "polemisch-sachlich", color: "#f97316" },
                { label: "konfrontativ-faktenrhetorisch", color: "#7c3aed" },
                { label: "sozial-anklagend", color: "#0891b2" },
                { label: "sachlich", color: "#10b981" },
              ]}
            />
          </div>

          <CaveatBox>
            Die Klassifikation reflektiert teilweise den Themen-Mix der Fraktion (Migration,
            Sozialpolitik etc.) — eine themen-kontrollierte Auswertung steht aus. Details und
            offene Folgearbeit auf der{" "}
            <Link
              href="/methodik#tonalitaet-caveats"
              className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline underline-offset-2"
            >
              Methodik-Seite
            </Link>
            .
          </CaveatBox>
        </section>

        {/* === BEFUND 2: KA-Tonalität === */}
        <section id="befund-2" className="mb-16 scroll-mt-20">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Befund 2 · Kleine Anfragen
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 mb-3 leading-tight">
              Bei den Kleinen Anfragen ist die AfD <em className="not-italic">nicht</em>{" "}
              konfrontativer als Linke oder Grüne.
            </h2>
            <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Anteil der vom Modell als{" "}
              <GlossarLink slug="fordernd" variant="drucksachen">
                fordernd
              </GlossarLink>{" "}
              oder{" "}
              <GlossarLink slug="kritisch" variant="drucksachen">
                kritisch
              </GlossarLink>{" "}
              klassifizierten Kleinen Anfragen je Hauptsteller-Fraktion: AfD, Linke und Grüne
              liegen im selben Korridor. Auffällig: der{" "}
              <GlossarLink slug="sachlich" variant="drucksachen">
                sachlich
              </GlossarLink>
              -Anteil ist bei der AfD am <strong className="text-zinc-950 dark:text-zinc-50">höchsten</strong> —
              anders als beim Reden-Stil.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-4xl mx-auto">
            <div className="space-y-5">
              {kaByFraktion.map((row) => (
                <KaCompositionBar
                  key={row.fraktion}
                  fraktion={row.fraktion}
                  total={row.total}
                  konfrontPct={row.konfrontPct}
                  sachlichPct={row.sachlichPct}
                  informierendPct={row.informierendPct}
                />
              ))}
            </div>
            <Legend
              items={[
                { label: "fordernd + kritisch (konfrontativ)", color: "#9333ea" },
                { label: "sachlich", color: "#10b981" },
                { label: "informierend", color: "#0891b2" },
              ]}
            />
          </div>

          <CaveatBox>
            „Konfrontativer Anteil" hier = <code className="font-mono text-[12px]">fordernd</code>{" "}
            + <code className="font-mono text-[12px]">kritisch</code> aus dem eigenen
            Drucksachen-Schema (vier Tonalitäten — Definitionen im{" "}
            <Link
              href="/glossar#tonalitaeten-drucksachen"
              className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline underline-offset-2"
            >
              Glossar
            </Link>
            ). Der höhere sachlich-Anteil der AfD bedeutet nicht, dass die KAs neutral sind — er
            bezieht sich allein auf die Formulierung der Fragestellung.
          </CaveatBox>
        </section>

        {/* === BEFUND 3: Volumen + Trend === */}
        <section id="befund-3" className="mb-16 scroll-mt-20">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Befund 3 · Volumen und Verlauf
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 mb-3 leading-tight">
              Der Unterschied liegt im Volumen, nicht im Stil — und einen klaren Trend gibt es
              (noch) nicht.
            </h2>
            <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Die AfD stellt deutlich mehr Kleine Anfragen als Linke oder Grüne — wer am
              sichtbarsten wirkt, schreibt nicht den schärfsten Ton, sondern den meisten. Ein
              belastbarer Trend lässt sich aus 14 Monaten WP21 nicht ableiten.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                Anzahl Kleine Anfragen (WP21)
              </div>
              <div className="space-y-3">
                {kaByFraktion.map((row) => (
                  <VolumeRow
                    key={row.fraktion}
                    fraktion={row.fraktion}
                    total={row.total}
                    max={Math.max(...kaByFraktion.map((r) => r.total))}
                  />
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
                Konfrontativ-Anteil je Monat
              </div>
              <TrendChart trend={trend} fraktionen={trendFraktionen} monthLabels={monthLabels} />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
                {trendFraktionen.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 h-[2px]"
                      style={{ backgroundColor: partyColor(PARTY_KEY[f]) }}
                    />
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <CaveatBox>
            WP21 begann am 25. März 2025; der Beobachtungszeitraum ist mit 14 Monaten zu kurz für
            eine Trend-Aussage. Eine belastbare Antwort auf die Frage, ob sich Kleine Anfragen
            historisch von Sachfragen zu Skandalisierungsanfragen verschoben haben, bräuchte den
            Datenbestand der WP18–20 — als offene Folgearbeit notiert.
          </CaveatBox>
        </section>

        {/* === BEFUND 4: Themen-Profil pro Fraktion === */}
        <section id="befund-4" className="mb-16 scroll-mt-20">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Befund 4 · Wer treibt welche Themen
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 mb-3 leading-tight">
              Jede Fraktion hat ein Themen-Profil — und die Opposition bringt die meisten Initiativen ein.
            </h2>
            <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {initiativeMatrix.fields.length} Politikfelder × 5 Fraktionen: Wer bringt wie viele
              eigene Anträge und Gesetzentwürfe wozu ein? Die Schwerpunkte unterscheiden sich
              deutlich — und die Opposition bringt ein Vielfaches der Koalition ein (die regiert
              über Gesetze). Umschaltbar auf die Kleinen Anfragen — das Kontrollinstrument, das
              fast nur die Opposition nutzt, weil die Koalition ihre Regierung direkt fragen
              kann. Klassifikation auf die{" "}
              <Link href="/methodik" className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline underline-offset-2">
                abgeordnetenwatch-Politikfelder
              </Link>.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <InitiativeMatrix data={initiativeMatrix} />
          </div>

          <CaveatBox>
            Gezählt werden <strong>eingebrachte</strong> Drucksachen, nicht beschlossene — die meisten
            Oppositionsanträge werden abgelehnt. Anträge/Gesetzentwürfe (Gestaltung) und Kleine
            Anfragen (Kontrolle) sind getrennte Modi, weil der KA-Vergleich mit der Koalition
            strukturell hinkt; „alle Drucksachen" enthält zusätzlich Unterrichtungen und Sonstiges.
            Ein Politikfeld kann aus gegensätzlichen Richtungen bespielt werden: „Innere Sicherheit"
            umfasst sowohl Law-and-Order-Anträge als auch Grundrechts- und Polizei-Kritik. Eine
            Drucksache kann mehrere Sachgebiete berühren (im Schnitt rund 2,6) und zählt dann in
            jedem mit — die Spaltensummen sind also Themen-Nennungen, nicht Drucksachen-Stückzahlen.
            Die Themen-Zuordnung ist eine LLM-Klassifikation; die verlinkte Drucksache ist immer die
            Quelle.
          </CaveatBox>
        </section>

        {/* === BEFUND 5: Gesetzgebungs-Trichter === */}
        <section id="befund-5" className="mb-16 scroll-mt-20">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Befund 5 · Gesetzgebung
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 mb-3 leading-tight">
              Ob ein Gesetzentwurf je zur Abstimmung kommt, entscheidet vor allem der Absender.
            </h2>
            <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Der Trichter vom Entwurf bis zum Beschluss, getrennt nach Einbringer (Art. 76 GG:
              Bundesregierung, Fraktionen, Bundesrat). Bundesregierung und Koalitionsfraktionen
              sind dasselbe Lager auf zwei Wegen: Regierungsentwürfe müssen vor der 1. Lesung
              sechs Wochen zum Bundesrat, Fraktionsentwürfe gehen direkt ins Plenum — Eiliges
              läuft deshalb oft als Fraktionsentwurf. Regierungs- und Koalitionsentwürfe werden
              nie abgelehnt; Oppositionsentwürfe bekommen meist ihre 1. Lesung, aber jede
              Schlussabstimmung endete mit Ablehnung. Länder-Initiativen erreichen das Plenum
              praktisch gar nicht:{" "}
              <strong className="text-zinc-950 dark:text-zinc-50">eine einzige 1. Lesung, null Abstimmungen</strong>
              {" "}— wartende Länder-Entwürfe liegen im Schnitt seit{" "}
              <span className="num font-semibold text-zinc-950 dark:text-zinc-50">
                {funnel.find((r) => r.einbringer.startsWith("Länder"))?.wartendSchnittTage ?? "—"}
              </span>{" "}
              Tagen ungelesen. Nichtbefassung ist die stillste Form der Ablehnung.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-4xl mx-auto">
            <div className="space-y-5">
              {funnel.map((row) => (
                <FunnelRow key={row.einbringer} row={row} />
              ))}
            </div>
            <Legend
              items={[
                { label: "eingebracht", color: "#e4e4e7" },
                { label: "1. Lesung erreicht", color: "#a1a1aa" },
                { label: "zur Abstimmung gekommen", color: "#1a3e72" },
                { label: "beschlossen", color: "#18181b" },
              ]}
            />
            <p className="mt-3 pt-3 border-t border-border text-[12.5px]">
              <Link
                href="/gesetzentwuerfe"
                className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline underline-offset-2 font-medium"
              >
                → Alle laufenden Gesetzentwürfe mit Verfahrensstand
              </Link>
            </p>
          </div>

          <CaveatBox>
            Schnappschuss einer laufenden Wahlperiode (14 Monate) — wartende Entwürfe können
            ihre Lesung noch bekommen, die Quoten sind kein Endstand. „Zur Abstimmung" umfasst
            auch Ablehnungen in der 2. Lesung (danach entfällt die 3., § 83 GO-BT).
            Länder-Initiativen, die schon im Bundesrat scheitern oder dort liegen, sind in
            „eingebracht" enthalten, erreichen aber nie die Spalte „im Bundestag". Historische
            Vergleichswerte über frühere Wahlperioden: Datenhandbuch des Deutschen Bundestages.
          </CaveatBox>
        </section>

        {/* === BEFUND 6: Gesetzes-Tempo === */}
        <section id="befund-6" className="mb-16 scroll-mt-20">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
              Befund 6 · Tempo
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 mb-3 leading-tight">
              Vom Entwurf zum Bundesgesetzblatt: im Median{" "}
              <span className="num">{dauer.medianTotal}</span> Tage.
            </h2>
            <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Alle <span className="num">{dauer.n}</span> bisher verkündeten Gesetze, gemessen
              von der ersten formalen Vorlage bis zur Verkündung — in drei etwa gleich langen
              Etappen. Der Einbringungsweg macht den Unterschied:{" "}
              {dauer.perEinbringer.map((e, i) => (
                <span key={e.name}>
                  {i > 0 && " · "}
                  <strong className="text-zinc-950 dark:text-zinc-50">{e.name}</strong> im Median{" "}
                  <span className="num font-semibold">{e.median}</span> Tage (
                  <span className="num">{e.n}</span> Gesetze)
                </span>
              ))}
              {" "}— der Bundesrats-Vorlauf aus Befund 5 in Zahlen.
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 max-w-4xl mx-auto">
            <EtappenBar etappen={dauer.etappen} />
            <DauerHistogramm bins={dauer.histogramm} />
          </div>

          <div className="mt-4 grid sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
            <DauerBeispiele titel="Die schnellsten" beispiele={dauer.schnellste} />
            <DauerBeispiele titel="Die langsamsten" beispiele={dauer.langsamste} />
          </div>

          <CaveatBox>
            Schnappschuss einer laufenden Wahlperiode: Gezählt werden nur bereits{" "}
            <strong>verkündete</strong> Gesetze — langsame Verfahren sind noch unterwegs und
            fehlen, die Werte sind daher eher eine Untergrenze. Startpunkt ist die erste
            formale Vorlage (bei Regierungsentwürfen die Zuleitung an den Bundesrat, nicht der
            Kabinettsbeschluss oder Referentenentwurf — die Vorarbeit in den Ministerien ist
            hier unsichtbar). Median statt Durchschnitt, damit einzelne Ausreißer das Bild
            nicht verzerren; die Etappen-Mediane sind unabhängig berechnet und summieren
            deshalb nicht exakt zur Gesamtdauer.
          </CaveatBox>
        </section>

        <div className="mt-16 border-t border-border pt-8">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">
            Wie ist das alles entstanden?
          </h2>
          <p className="text-[14px] text-zinc-700 dark:text-zinc-300 leading-relaxed">
            Die{" "}
            <Link
              href="/methodik"
              className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline underline-offset-2"
            >
              Methodik-Seite
            </Link>{" "}
            dokumentiert jede Pipeline mit Treffer- und Fehlerquoten, Modell-Wahl, bekannten
            Limitationen und Audit-Trail. Im{" "}
            <Link
              href="/glossar"
              className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline underline-offset-2"
            >
              Glossar
            </Link>{" "}
            stehen die Definitionen der einzelnen Tonalitäts- und Typ-Labels. Diese Seite hier
            zeigt, was die Pipelines <em>gefunden</em> haben — die Methodik-Seite zeigt,{" "}
            <em>wie zuverlässig</em> diese Funde sind.
          </p>
        </div>

          </main>

          {/* Desktop: Sticky-Sidebar TOC (Methodik-Muster) */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-1.5">
                <ListTree className="w-3 h-3" strokeWidth={2.25} />
                Auf dieser Seite
              </div>
              <AnalyseToc items={tocItems} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function AnalyseToc({ items }: { items: { id: string; label: string; sub: string }[] }) {
  return (
    <nav className="text-[12.5px]">
      <ul className="space-y-0.5 border-l border-border">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className="block pl-3 -ml-px border-l border-transparent hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-950 dark:hover:text-zinc-50 text-zinc-600 dark:text-zinc-300 py-1 leading-snug transition-colors"
            >
              <span className="block font-medium">{item.label}</span>
              <span className="block text-[11px] text-zinc-400 dark:text-zinc-500">{item.sub}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// ============================================================================
// Components
// ============================================================================

function CaveatBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50/50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3 mt-4 max-w-4xl mx-auto">
      <p className="text-[12.5px] text-amber-900 dark:text-amber-300 leading-relaxed">{children}</p>
    </div>
  );
}

interface GlossarLinkProps {
  slug: string;
  variant?: "reden" | "drucksachen";
  children: React.ReactNode;
}

function GlossarLink({ slug, variant = "reden", children }: GlossarLinkProps) {
  const anchor =
    variant === "drucksachen"
      ? `tonalitaeten-drucksachen-${slug}`
      : `tonalitaeten-reden-${slug}`;
  return (
    <Link
      href={`/glossar#${anchor}`}
      className="font-semibold text-zinc-950 dark:text-zinc-50 underline decoration-zinc-300 dark:decoration-zinc-600 hover:decoration-zinc-700 underline-offset-2"
    >
      {children}
    </Link>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-zinc-600 dark:text-zinc-300">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: it.color }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

interface RedenStackedBarProps {
  fraktion: string;
  total: number;
  dominantSlug: string;
  dominantPct: number;
  shares: Record<string, number>;
}

function RedenStackedBar({
  fraktion,
  total,
  dominantSlug,
  dominantPct,
  shares,
}: RedenStackedBarProps) {
  const segments = [
    { key: "polemisch", value: shares.polemisch ?? 0, color: "#dc2626" },
    { key: "polemisch_sachlich", value: shares.polemisch_sachlich ?? 0, color: "#f97316" },
    {
      key: "konfrontativ_faktenrhetorisch",
      value: shares.konfrontativ_faktenrhetorisch ?? 0,
      color: "#7c3aed",
    },
    { key: "sozial_anklagend", value: shares.sozial_anklagend ?? 0, color: "#0891b2" },
    { key: "sachlich", value: shares.sachlich ?? 0, color: "#10b981" },
  ];

  const DOMINANT_LABEL: Record<string, string> = {
    polemisch: "polemisch",
    polemisch_sachlich: "polemisch-sachlich",
    konfrontativ_faktenrhetorisch: "konfrontativ-faktenrhetorisch",
    sozial_anklagend: "sozial-anklagend",
    sachlich: "sachlich",
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 gap-3 flex-wrap">
        <div className="text-[13px] font-semibold text-zinc-950 dark:text-zinc-50">{fraktion}</div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 num">
          {fmtNum(total)} Segmente · dominant{" "}
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
            {DOMINANT_LABEL[dominantSlug] ?? dominantSlug} {fmtPct(dominantPct)}
          </span>
        </div>
      </div>
      <div className="h-6 w-full flex rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="h-full relative group"
            style={{ width: `${seg.value}%`, backgroundColor: seg.color }}
            title={`${seg.key}: ${fmtPct(seg.value)}`}
          >
            {seg.value >= 8 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white px-1 truncate">
                {fmtPct(seg.value)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface KaCompositionBarProps {
  fraktion: string;
  total: number;
  konfrontPct: number;
  sachlichPct: number;
  informierendPct: number;
}

function KaCompositionBar({
  fraktion,
  total,
  konfrontPct,
  sachlichPct,
  informierendPct,
}: KaCompositionBarProps) {
  const segments = [
    { key: "konfrontativ", value: konfrontPct, color: "#9333ea" },
    { key: "sachlich", value: sachlichPct, color: "#10b981" },
    { key: "informierend", value: informierendPct, color: "#0891b2" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="text-[13px] font-semibold text-zinc-950 dark:text-zinc-50">{fraktion}</div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 num">
          {fmtNum(total)} Anfragen ·{" "}
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
            sachlich {fmtPct(sachlichPct)}
          </span>{" "}
          ·{" "}
          <span className="font-semibold text-purple-700 dark:text-purple-400">
            konfrontativ {fmtPct(konfrontPct)}
          </span>
        </div>
      </div>
      <div className="h-6 w-full flex rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {segments.map((seg) => (
          <div
            key={seg.key}
            className="h-full relative"
            style={{ width: `${seg.value}%`, backgroundColor: seg.color }}
            title={`${seg.key}: ${fmtPct(seg.value)}`}
          >
            {seg.value >= 8 && (
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white px-1 truncate">
                {fmtPct(seg.value)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function FunnelRow({ row }: { row: GesetzgebungsFunnelRow }) {
  // Geschachtelte Anteils-Balken: jede Stufe ist Teilmenge der vorherigen.
  const pct = (n: number) => (row.gesamt > 0 ? (n / row.gesamt) * 100 : 0);
  const stufen = [
    { key: "eingebracht", value: 100, color: "#e4e4e7" },
    { key: "1. Lesung", value: pct(row.ersteLesung), color: "#a1a1aa" },
    { key: "zur Abstimmung", value: pct(row.zurAbstimmung), color: "#1a3e72" },
    { key: "beschlossen", value: pct(row.beschlossen), color: "#18181b" },
  ];

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5 gap-3 flex-wrap">
        <div className="text-[13px] font-semibold text-zinc-950 dark:text-zinc-50">{row.einbringer}</div>
        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 num">
          {fmtNum(row.gesamt)} eingebracht · {fmtNum(row.ersteLesung)} in 1. Lesung ·{" "}
          {fmtNum(row.zurAbstimmung)} abgestimmt ·{" "}
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">{fmtNum(row.beschlossen)} beschlossen</span>
          {row.abgelehnt > 0 && (
            <>
              {" "}· <span className="font-semibold text-rose-700 dark:text-rose-400">{fmtNum(row.abgelehnt)} abgelehnt</span>
            </>
          )}
        </div>
      </div>
      <div className="relative h-6 w-full rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {stufen.map((s) => (
          <div
            key={s.key}
            className="absolute inset-y-0 left-0 rounded-r-sm"
            style={{ width: `${s.value}%`, backgroundColor: s.color }}
            title={`${s.key}: ${fmtNum(Math.round((s.value / 100) * row.gesamt))} von ${fmtNum(row.gesamt)}`}
          />
        ))}
      </div>
      {row.wartendVorLesung > 0 && (
        <div className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500 num">
          {fmtNum(row.wartendVorLesung)} {row.wartendVorLesung === 1 ? "wartet" : "warten"} auf die 1. Lesung
          {row.wartendSchnittTage != null && <> — {row.wartendVorLesung === 1 ? "seit" : "im Schnitt seit"} {fmtNum(row.wartendSchnittTage)} Tagen</>}
        </div>
      )}
    </div>
  );
}

function VolumeRow({
  fraktion,
  total,
  max,
}: {
  fraktion: string;
  total: number;
  max: number;
}) {
  const width = (total / max) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <div className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200">{fraktion}</div>
        <div className="text-[12px] font-semibold text-zinc-950 dark:text-zinc-50 num">{fmtNum(total)}</div>
      </div>
      <div className="h-3 w-full rounded-sm bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-sm"
          style={{
            width: `${width}%`,
            backgroundColor: partyColor(PARTY_KEY[fraktion]),
          }}
        />
      </div>
    </div>
  );
}

interface TrendChartProps {
  trend: ReturnType<typeof getDrucksacheMonthlyTrend>;
  fraktionen: string[];
  monthLabels: string[];
}

function TrendChart({ trend, fraktionen, monthLabels }: TrendChartProps) {
  const W = 320;
  const H = 140;
  const PAD_L = 28;
  const PAD_R = 8;
  const PAD_T = 8;
  const PAD_B = 22;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const yMin = 0;
  const yMax = 100;

  const xFor = (i: number) =>
    PAD_L + (monthLabels.length > 1 ? (i / (monthLabels.length - 1)) * innerW : innerW / 2);
  const yFor = (v: number) => PAD_T + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Y-axis ticks */}
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="#f4f4f5"
            strokeWidth={1}
          />
          <text
            x={PAD_L - 4}
            y={yFor(v)}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize="9"
            fill="#a1a1aa"
          >
            {v}%
          </text>
        </g>
      ))}

      {/* X-axis labels — show every 2nd month for readability */}
      {monthLabels.map((m, i) =>
        i % 2 === 0 ? (
          <text
            key={m}
            x={xFor(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="8.5"
            fill="#71717a"
          >
            {m.slice(2)}
          </text>
        ) : null,
      )}

      {/* Lines per fraktion */}
      {fraktionen.map((f) => {
        const points = trend
          .map((t, i) => {
            const v = t.byFraktion[f];
            if (!v) return null;
            return { x: xFor(i), y: yFor(v.konfront_pct) };
          })
          .filter(Boolean) as { x: number; y: number }[];

        if (points.length === 0) return null;
        const d = points
          .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
          .join(" ");
        const color = partyColor(PARTY_KEY[f]);
        return (
          <g key={f}>
            <path d={d} fill="none" stroke={color} strokeWidth={1.5} />
            {points.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function EtappenBar({
  etappen,
}: {
  etappen: { bisLesung: number; parlament: number; bisVerkuendung: number };
}) {
  const segs = [
    { label: "Vorlage → 1. Lesung", tage: etappen.bisLesung, color: "#a1a1aa" },
    { label: "1. Lesung → Schlussabstimmung", tage: etappen.parlament, color: "#1a3e72" },
    { label: "Schlussabstimmung → Verkündung", tage: etappen.bisVerkuendung, color: "#18181b" },
  ];
  const sum = segs.reduce((s, x) => s + x.tage, 0) || 1;
  return (
    <div>
      <div className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        Median-Etappen (Tage)
      </div>
      <div className="h-7 w-full flex rounded-md overflow-hidden">
        {segs.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-center text-[11px] font-semibold text-white num"
            style={{ width: `${(s.tage / sum) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.tage} Tage`}
          >
            {s.tage}
          </div>
        ))}
      </div>
      <Legend items={segs.map((s) => ({ label: s.label, color: s.color }))} />
    </div>
  );
}

function DauerHistogramm({ bins }: { bins: { vonTage: number; n: number }[] }) {
  const max = Math.max(1, ...bins.map((b) => b.n));
  return (
    <div className="mt-6">
      <div className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        Verteilung der Gesamtdauer (30-Tage-Schritte)
      </div>
      <div className="flex items-end gap-[3px] h-20">
        {bins.map((b) => (
          <div key={b.vonTage} className="flex-1 flex flex-col items-center gap-1" title={`${b.vonTage}–${b.vonTage + 29} Tage: ${b.n} Gesetze`}>
            <span className="num text-[10px] text-zinc-500 dark:text-zinc-400 leading-none">{b.n || ""}</span>
            <div
              className="w-full rounded-t-sm bg-[#1a3e72] dark:bg-[#8fb3e6]"
              style={{ height: `${(b.n / max) * 56}px`, opacity: b.n ? 1 : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500 num mt-1 border-t border-border pt-1">
        <span>0</span>
        <span>{bins.length * 30} Tage</span>
      </div>
    </div>
  );
}

function DauerBeispiele({
  titel,
  beispiele,
}: {
  titel: string;
  beispiele: { titel: string; tage: number; dsNr: string | null }[];
}) {
  return (
    <div className="border border-border rounded-xl p-4 bg-zinc-50/40 dark:bg-zinc-800/40">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
        {titel}
      </div>
      <ul className="space-y-2">
        {beispiele.map((b) => (
          <li key={b.titel} className="text-[12.5px] leading-snug flex gap-2">
            <span className="num font-semibold text-zinc-950 dark:text-zinc-50 whitespace-nowrap">{b.tage} T.</span>
            {b.dsNr ? (
              <Link
                href={`/aktivitaeten/${b.dsNr.replace("/", "-")}`}
                className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 hover:underline"
              >
                {b.titel.length > 110 ? `${b.titel.slice(0, 110)}…` : b.titel}
              </Link>
            ) : (
              <span className="text-zinc-600 dark:text-zinc-300">{b.titel.length > 110 ? `${b.titel.slice(0, 110)}…` : b.titel}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
