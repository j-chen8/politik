import { ContextualLink as Link } from "@/components/ContextualLink";
import { ArrowLeft } from "lucide-react";
import {
  getRedenTonalitaetByFraktion,
  getDrucksacheTonalitaetByFraktion,
  getDrucksacheMonthlyTrend,
  getTopicInitiativeMatrix,
} from "@/lib/db";
import { partyColor } from "@/lib/party-colors";
import { InitiativeMatrix } from "@/components/InitiativeMatrix";

export const metadata = {
  title: "Analyse — Was die Daten zeigen | Politik-Radar",
  description:
    "Vier empirische Befunde aus dem Plenum: Reden-Stil-Profile, Tonalität Kleiner Anfragen, Volumen-Asymmetrie und Trend, Themen-Profil pro Fraktion.",
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
  const initiativeMatrix = getTopicInitiativeMatrix();

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

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zur Startseite
        </Link>

        <div className="mb-12">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Analyse
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4">
            Was die Daten zeigen
          </h1>
          <p className="text-[16px] text-zinc-600 leading-relaxed max-w-2xl">
            Vier empirische Befunde aus dem aktuellen Datenbestand — nüchtern dokumentiert.
            Manche bestätigen, manche widersprechen dem ersten politischen Reflex.
          </p>
          <p className="text-[14px] text-zinc-500 leading-relaxed max-w-2xl mt-3">
            Alle Zahlen kommen aus der LLM-Klassifikation der Plenarreden und der Kleinen Anfragen
            (WP21, Stand{" "}
            <span className="num">{trend[trend.length - 1]?.monat ?? "—"}</span>). Methodische
            Grenzen — Themen-Confound, Speaker-Identity-Confound, fehlende
            Inter-Annotator-Studie — siehe{" "}
            <Link
              href="/methodik"
              className="text-[#1a3e72] hover:underline underline-offset-2"
            >
              Methodik
            </Link>
            .
          </p>
        </div>

        {/* === BEFUND 1: Reden-Stil-Profile === */}
        <section className="mb-16">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Befund 1 · Plenarreden
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 mb-3 leading-tight">
              Drei sehr unterschiedliche Stil-Profile in der Opposition.
            </h2>
            <p className="text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
              Statt „die Opposition ist konfrontativ" zeigen die Daten drei klar verschiedene
              rhetorische Profile. Jede Fraktion hat ihren eigenen dominanten Stil-Modus:
            </p>
            <ul className="mt-3 space-y-1.5 text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
              <li>
                · <strong className="text-zinc-950">AfD</strong> dominiert über{" "}
                <GlossarLink slug="polemisch">polemisch</GlossarLink> — direkte Schärfe, oft ohne
                Belege.
              </li>
              <li>
                · <strong className="text-zinc-950">Grüne</strong> dominieren über{" "}
                <GlossarLink slug="konfrontativ-faktenrhetorisch">
                  konfrontativ-faktenrhetorisch
                </GlossarLink>{" "}
                — Schärfe gegen Personen, mit nachprüfbaren Belegen.
              </li>
              <li>
                · <strong className="text-zinc-950">Linke</strong> dominiert über{" "}
                <GlossarLink slug="sozial-anklagend">sozial-anklagend</GlossarLink> — Anklage von
                Verhältnissen, weniger gegen einzelne Akteure.
              </li>
            </ul>
            <p className="mt-3 text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
              Der einfache „AfD wie Linke gleich konfrontativ"-Reflex stimmt nur, wenn man
              verschiedene Stil-Modi vermengt. Trennt man sie, hat jede Oppositions-Fraktion ihr
              eigenes rhetorisches Profil.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 sm:p-6">
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
              className="text-[#1a3e72] hover:underline underline-offset-2"
            >
              Methodik-Seite
            </Link>
            .
          </CaveatBox>
        </section>

        {/* === BEFUND 2: KA-Tonalität === */}
        <section className="mb-16">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Befund 2 · Kleine Anfragen
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 mb-3 leading-tight">
              Bei den Kleinen Anfragen ist die AfD <em className="not-italic">nicht</em>{" "}
              konfrontativer als Linke oder Grüne.
            </h2>
            <p className="text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
              Anteil der vom Modell als{" "}
              <GlossarLink slug="fordernd" variant="drucksachen">
                fordernd
              </GlossarLink>{" "}
              oder{" "}
              <GlossarLink slug="kritisch" variant="drucksachen">
                kritisch
              </GlossarLink>{" "}
              klassifizierten Kleinen Anfragen, je Hauptsteller-Fraktion. Der konfrontative
              Anteil liegt für AfD, Linke und Grüne im selben Korridor. Auffällig: der{" "}
              <GlossarLink slug="sachlich" variant="drucksachen">
                sachlich
              </GlossarLink>
              -Anteil ist bei der AfD am <strong className="text-zinc-950">höchsten</strong> —
              anders als beim Reden-Stil.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 sm:p-6">
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
              className="text-[#1a3e72] hover:underline underline-offset-2"
            >
              Glossar
            </Link>
            ). Der höhere sachlich-Anteil der AfD bedeutet nicht, dass die KAs neutral sind — er
            bezieht sich allein auf die Formulierung der Fragestellung.
          </CaveatBox>
        </section>

        {/* === BEFUND 3: Volumen + Trend === */}
        <section className="mb-16">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Befund 3 · Volumen und Verlauf
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 mb-3 leading-tight">
              Der Unterschied liegt im Volumen, nicht im Stil — und einen klaren Trend gibt es
              (noch) nicht.
            </h2>
            <p className="text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
              Die AfD stellt im Beobachtungszeitraum deutlich mehr Kleine Anfragen als Linke oder
              Grüne. Wer am sichtbarsten wirkt, schreibt nicht den schärfsten Ton — sondern den
              meisten. Der monatliche Konfrontativ-Anteil schwankt für alle drei
              Oppositions-Fraktionen ähnlich; ein belastbarer Trend (steigend / fallend) lässt
              sich aus 14 Monaten WP21 nicht ableiten.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white border border-zinc-200/70 rounded-2xl p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
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

            <div className="bg-white border border-zinc-200/70 rounded-2xl p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                Konfrontativ-Anteil je Monat
              </div>
              <TrendChart trend={trend} fraktionen={trendFraktionen} monthLabels={monthLabels} />
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-zinc-600">
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
        <section className="mb-16">
          <div className="mb-6">
            <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
              Befund 4 · Wer treibt welche Themen
            </div>
            <h2 className="text-[22px] sm:text-[26px] font-semibold tracking-[-0.02em] text-zinc-950 mb-3 leading-tight">
              Jede Fraktion hat ein Themen-Profil — und die Opposition bringt die meisten Initiativen ein.
            </h2>
            <p className="text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
              Jede der {initiativeMatrix.fields.length} Politikfelder-Zeilen zeigt, welche Fraktion wie
              viele eigene Initiativen (Anträge und Gesetzentwürfe) dazu eingebracht hat. Die Schwerpunkte
              unterscheiden sich deutlich — und die Zahlen pro Fraktion auch: Die Opposition bringt ein
              Vielfaches dessen ein, was die Regierungskoalition über Anträge einbringt (die regiert über
              Gesetze). Klassifikation auf die{" "}
              <Link href="/methodik" className="text-[#1a3e72] hover:underline underline-offset-2">
                abgeordnetenwatch-Politikfelder
              </Link>.
            </p>
          </div>

          <InitiativeMatrix data={initiativeMatrix} />

          <CaveatBox>
            Gezählt werden <strong>eingebrachte</strong> Initiativen, nicht beschlossene — die meisten
            Oppositionsanträge werden abgelehnt. Ein Politikfeld kann aus gegensätzlichen Richtungen
            bespielt werden: „Innere Sicherheit" umfasst sowohl Law-and-Order-Anträge als auch
            Grundrechts- und Polizei-Kritik — gleiches Feld, verschiedene Haltung. Die Themen-Zuordnung
            ist eine LLM-Klassifikation der Drucksachen-Inhalte; die verlinkte Drucksache ist immer die
            Quelle.
          </CaveatBox>
        </section>

        <div className="mt-16 border-t border-zinc-200/70 pt-8">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Wie ist das alles entstanden?
          </h2>
          <p className="text-[14px] text-zinc-700 leading-relaxed max-w-2xl">
            Die{" "}
            <Link
              href="/methodik"
              className="text-[#1a3e72] hover:underline underline-offset-2"
            >
              Methodik-Seite
            </Link>{" "}
            dokumentiert jede Pipeline mit Treffer- und Fehlerquoten, Modell-Wahl, bekannten
            Limitationen und Audit-Trail. Im{" "}
            <Link
              href="/glossar"
              className="text-[#1a3e72] hover:underline underline-offset-2"
            >
              Glossar
            </Link>{" "}
            stehen die Definitionen der einzelnen Tonalitäts- und Typ-Labels. Diese Seite hier
            zeigt, was die Pipelines <em>gefunden</em> haben — die Methodik-Seite zeigt,{" "}
            <em>wie zuverlässig</em> diese Funde sind.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Components
// ============================================================================

function CaveatBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-amber-50/50 border border-amber-200 rounded-xl px-4 py-3 mt-4 max-w-2xl">
      <p className="text-[12.5px] text-amber-900 leading-relaxed">{children}</p>
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
      className="font-semibold text-zinc-950 underline decoration-zinc-300 hover:decoration-zinc-700 underline-offset-2"
    >
      {children}
    </Link>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="mt-4 pt-3 border-t border-zinc-100 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-zinc-600">
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
        <div className="text-[13px] font-semibold text-zinc-950">{fraktion}</div>
        <div className="text-[11px] text-zinc-500 num">
          {fmtNum(total)} Segmente · dominant{" "}
          <span className="font-semibold text-zinc-700">
            {DOMINANT_LABEL[dominantSlug] ?? dominantSlug} {fmtPct(dominantPct)}
          </span>
        </div>
      </div>
      <div className="h-6 w-full flex rounded-md overflow-hidden bg-zinc-100">
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
        <div className="text-[13px] font-semibold text-zinc-950">{fraktion}</div>
        <div className="text-[11px] text-zinc-500 num">
          {fmtNum(total)} Anfragen ·{" "}
          <span className="font-semibold text-emerald-700">
            sachlich {fmtPct(sachlichPct)}
          </span>{" "}
          ·{" "}
          <span className="font-semibold text-purple-700">
            konfrontativ {fmtPct(konfrontPct)}
          </span>
        </div>
      </div>
      <div className="h-6 w-full flex rounded-md overflow-hidden bg-zinc-100">
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
        <div className="text-[13px] font-medium text-zinc-800">{fraktion}</div>
        <div className="text-[12px] font-semibold text-zinc-950 num">{fmtNum(total)}</div>
      </div>
      <div className="h-3 w-full rounded-sm bg-zinc-100 overflow-hidden">
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
