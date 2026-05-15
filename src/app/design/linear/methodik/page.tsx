import path from "path";
import fs from "fs";
import Link from "next/link";
import { ExternalLink, ArrowLeft, ListTree } from "lucide-react";
import { TONALITAET_DEFS, REDEN_TYP_DEFS } from "@/lib/glossar";
import { getMethodikCounts } from "@/lib/db";

const TOC_GROUPS: { label: string; items: { id: string; label: string; sub?: string }[] }[] = [
  {
    label: "Übersicht",
    items: [
      { id: "wirksamkeit", label: "Wirksamkeit auf einen Blick" },
      { id: "halluzinations-rate", label: "Was die Rate bedeutet", sub: "Lower Bound" },
      { id: "coverage-bias", label: "Coverage-Bias", sub: "Quellen-Asymmetrie" },
    ],
  },
  {
    label: "Lebensläufe (CV-Daten)",
    items: [
      { id: "cascade", label: "Specialist-Cascade", sub: "CV-Extraktion + Prüfung" },
      { id: "stufe-5", label: "Source-Coherence-Check" },
      { id: "phase-7", label: "Verifier-Modell-Wahl" },
    ],
  },
  {
    label: "Plenarbeiträge (Reden-Daten)",
    items: [
      { id: "plenarbeitrag-typen", label: "Was zählt als was?", sub: "Taxonomie" },
      { id: "reden-pipeline", label: "Reden-Pipeline", sub: "Reden + Vote-Topic" },
      { id: "glossar-tonalitaet", label: "Glossar — Tonalitäten" },
      { id: "tonalitaet-verteilung", label: "Tonalitäts-Verteilung", sub: "je Fraktion" },
      { id: "rede-audit", label: "Audit Rede-Analysen", sub: "20-Sample-Stichprobe" },
      { id: "glossar-redentyp", label: "Glossar — Reden-Typen" },
    ],
  },
  {
    label: "Voting + Drucksachen",
    items: [
      { id: "vote-drucksache-audit", label: "Vote-↔-Drucksache", sub: "Cross-Source-Audit" },
    ],
  },
  {
    label: "Audit & Ehrlichkeit",
    items: [
      { id: "audit-trail", label: "Audit-Trail" },
      { id: "ehrlichkeit", label: "Ehrlicher Hinweis" },
    ],
  },
];

export const metadata = {
  title: "Methodik & Wirksamkeit | Politik-Radar",
  description:
    "Wie das Multi-LLM-Konsens-System der Politik-Radar funktioniert — mit konkreten Wirksamkeits-Zahlen aus dem letzten Lauf.",
};

interface Stage5Stats {
  politiciansChecked: number;
  candidatePairs: number;
  conflictsFound: number;
  politiciansWithConflicts: number;
}

function readStage5Stats(filePath: string): Stage5Stats {
  const stats: Stage5Stats = { politiciansChecked: 0, candidatePairs: 0, conflictsFound: 0, politiciansWithConflicts: 0 };
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    for (const line of txt.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        stats.politiciansChecked += 1;
        stats.candidatePairs += obj?.totalChecked ?? 0;
        const conflicts = Array.isArray(obj?.conflicts) ? obj.conflicts.length : 0;
        stats.conflictsFound += conflicts;
        if (conflicts > 0) stats.politiciansWithConflicts += 1;
      } catch {}
    }
  } catch {}
  return stats;
}

interface VerifierCascadeStats {
  total: number;
  llamaAgreement: number;
  haikuAgreement: number;
  llamaEchtPrecision: number;
  llamaEchtRecall: number;
  haikuEchtPrecision: number;
  haikuEchtRecall: number;
  finalEcht: number;
  finalPraez: number;
  finalFp: number;
}

function readVerifierCascadeStats(rootPath: string): VerifierCascadeStats {
  const stats: VerifierCascadeStats = {
    total: 0,
    llamaAgreement: 0, haikuAgreement: 0,
    llamaEchtPrecision: 0, llamaEchtRecall: 0,
    haikuEchtPrecision: 0, haikuEchtRecall: 0,
    finalEcht: 0, finalPraez: 0, finalFp: 0,
  };
  try {
    const finalLines = fs.readFileSync(path.join(rootPath, "final-verdicts-source-coherence.jsonl"), "utf-8").split("\n").filter(l => l.trim());
    const llamaLines = fs.readFileSync(path.join(rootPath, "llama-verdicts-source-coherence.jsonl"), "utf-8").split("\n").filter(l => l.trim());
    const haikuLines = fs.readFileSync(path.join(rootPath, "haiku-verdicts-source-coherence.jsonl"), "utf-8").split("\n").filter(l => l.trim());

    const finalMap = new Map<number, any>();
    for (const l of finalLines) { const o = JSON.parse(l); finalMap.set(o.id, o); }
    const llamaMap = new Map<number, any>();
    for (const l of llamaLines) { const o = JSON.parse(l); llamaMap.set(o.id, o); }
    const haikuMap = new Map<number, any>();
    for (const l of haikuLines) { const o = JSON.parse(l); haikuMap.set(o.id, o); }

    let llamaAgree = 0, haikuAgree = 0;
    let llamaTP = 0, llamaFP = 0, llamaFN = 0;
    let haikuTP = 0, haikuFP = 0, haikuFN = 0;

    for (const [id, f] of finalMap) {
      const l = llamaMap.get(id);
      const h = haikuMap.get(id);
      if (l && f.final_verdict === l.llama_verdict) llamaAgree += 1;
      if (h && f.final_verdict === h.haiku_verdict) haikuAgree += 1;
      if (f.final_verdict === "ECHT") {
        if (l?.llama_verdict === "ECHT") llamaTP += 1; else llamaFN += 1;
        if (h?.haiku_verdict === "ECHT") haikuTP += 1; else haikuFN += 1;
      } else {
        if (l?.llama_verdict === "ECHT") llamaFP += 1;
        if (h?.haiku_verdict === "ECHT") haikuFP += 1;
      }
      const fv = f.final_verdict;
      if (fv === "ECHT") stats.finalEcht += 1;
      else if (fv === "PRAEZISIERUNG") stats.finalPraez += 1;
      else if (fv === "FALSE_POSITIVE") stats.finalFp += 1;
    }

    stats.total = finalMap.size;
    stats.llamaAgreement = llamaAgree;
    stats.haikuAgreement = haikuAgree;
    stats.llamaEchtPrecision = llamaTP / Math.max(1, llamaTP + llamaFP);
    stats.llamaEchtRecall = llamaTP / Math.max(1, llamaTP + llamaFN);
    stats.haikuEchtPrecision = haikuTP / Math.max(1, haikuTP + haikuFP);
    stats.haikuEchtRecall = haikuTP / Math.max(1, haikuTP + haikuFN);
  } catch {}
  return stats;
}

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${((n / d) * 100).toFixed(1)}%`;
}

export default function LinearMethodikPage() {
  const root = process.cwd();
  const stage5 = readStage5Stats(path.join(root, "source-coherence.partial.jsonl"));
  const verifierCascade = readVerifierCascadeStats(root);
  const counts = getMethodikCounts();
  const typByKey = new Map(counts.speechTypeCounts.map(t => [t.typ, t.count]));
  const sayTyp = (key: string) => (typByKey.get(key) ?? 0).toLocaleString("de-DE");

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-6xl mx-auto px-5 py-12 fade-in-up">
        <Link
          href="/design/linear/datenquellen"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zu Datenquellen
        </Link>

        {/* Mobile: TOC am Anfang als ausklappbares Detail-Element */}
        <details className="lg:hidden mb-8 rounded-2xl border border-zinc-200/70 bg-white">
          <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-[12px] font-medium text-zinc-700">
            <ListTree className="w-3.5 h-3.5" strokeWidth={2.25} />
            Inhaltsverzeichnis
          </summary>
          <div className="px-4 pb-4">
            <TableOfContents />
          </div>
        </details>

        <div className="lg:flex lg:gap-12">
          <main className="lg:flex-1 lg:max-w-3xl">

        <div className="mb-12">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Auditierbar
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4">
            Methodik &amp; Wirksamkeit
          </h1>
          <p className="text-[16px] text-zinc-600 leading-relaxed max-w-2xl">
            Aus <span className="num text-zinc-950 font-medium">{counts.mdbsCvJson}</span> MdB-Profilen haben wir{" "}
            <span className="text-zinc-950 font-medium num">{counts.cvStatementsTotal.toLocaleString("de-DE")} strukturierte
            Lebenslauf-Aussagen</span> extrahiert — Ausbildung, Berufsstationen, politische Stationen, weitere
            Funktionen. Zusätzlich liefen <span className="num">{counts.sourceCoherenceChecked}</span> MdB-Profile
            durch eine Source-Coherence-Pipeline, die Wikipedia gegen die Politiker-Homepage abgleicht — daraus
            haben sich nach manueller Verifikation{" "}
            <Link href="/design/linear/quellen-diskrepanzen" className="text-zinc-950 font-medium underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
              {verifierCascade.finalEcht} echte Quellen-Diskrepanzen
            </Link>{" "}
            bestätigt. Parallel sind <span className="num">{counts.speechDistinctReden.toLocaleString("de-DE")}</span> Reden
            KI-analysiert und <span className="num">{Math.round((counts.quoteValidCount / Math.max(counts.quoteTotalCount, 1)) * 1000) / 10}%</span> der
            wörtlichen Zitate gegen den Roh-Text validiert.
          </p>
        </div>

        {/* Quick-Stats */}
        <section id="wirksamkeit" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Wirksamkeit auf einen Blick
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
            <BigStat value={counts.mdbsCvJson.toString()} label="MdB-Profile" sub="mit strukturiertem Lebenslauf" />
            <BigStat value={counts.cvStatementsTotal.toLocaleString("de-DE")} label="CV-Aussagen" sub="aus 4 Sektionen, einzeln auditierbar" />
            <BigStat value={counts.speechDistinctReden.toLocaleString("de-DE")} label="Reden KI-analysiert" sub={`${counts.speechSegments.toLocaleString("de-DE")} Segmente, Tonalität + Zitate + Forderungen`} />
            <BigStat value={verifierCascade.finalEcht.toString()} label="echte Quellen-Diskrepanzen" sub="Wikipedia ↔ Homepage" highlight />
          </div>
        </section>

        {/* Halluzinations-Rate als Lower Bound */}
        <section id="halluzinations-rate" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Was wir über Halluzinationen wissen — und was nicht
          </h2>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-5 max-w-3xl">
            <p className="text-[12.5px] text-amber-900 leading-relaxed">
              <strong>Wir haben keine veröffentlichungsreife Halluzinations-Rate für die aktuelle CV-Pipeline.</strong>{" "}
              Die Pipeline läuft seit April 2026 mit Claude Haiku 4.5 als Single-Pass-Extraktor; ein systematisches
              Recall-Sampling mit Ground-Truth-Annotation steht noch aus. Was wir haben: defensive Checks
              (Stammdaten-Konsistenz, Quellen-Link pro Aussage, Audit-Trail) und einen Reden-Audit auf 20 Sample-Polls
              <Link href="#rede-audit" className="underline underline-offset-2 decoration-amber-300 hover:decoration-amber-700">{" "}(siehe unten)</Link>.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 space-y-4 text-[14px] text-zinc-700 leading-relaxed">

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Was die Pipeline absichert</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <strong>Stammdaten-Konsistenz-Check:</strong> jede LLM-Aussage gegen harte unabhängige Wahrheits-Quellen (Wikidata, abgeordnetenwatch) geprüft — kein LLM prüft das LLM, sondern eine völlig andere Datenquelle.</li>
                <li>· <strong>Pro Aussage Quellen-Link:</strong> jede CV-Aussage hat eine Quellen-URL. Verbleibende Fehler sind durch Leser:innen mit einem Klick prüfbar und meldbar (Kontakt im <Link href="/design/linear/impressum" className="underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950">Impressum</Link>).</li>
                <li>· <strong>Audit-Trail:</strong> jeder Verifier-Befund mit Originaltext, neuem Text, Modell-Version und Zeitstempel in <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">cv_repair_log</code>.</li>
              </ul>
            </div>

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Was als nächstes nötig ist</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <strong className="text-zinc-950">Ground-Truth-Sampling</strong>: ≥ 200 zufällige CV-Aussagen durch menschliche Annotator:innen mit direkter Quellen-Verifikation. Liefert die echte Rate, nicht eine Lower Bound.</li>
                <li>· <strong className="text-zinc-950">Recall-Messung für die aktuelle Pipeline</strong>: Verifier-Recall-Test mit Opus 4.7 (manuell, als Annotations-Assistenz) oder Mensch als Ground Truth, analog zum empirischen Verifier-Vergleich unten.</li>
                <li>· <strong className="text-zinc-950">Externe Validierung</strong>: 1–2 Politikwissenschaftler:innen oder Datenjournalist:innen über eine zufällige Stichprobe drüberlesen lassen, bevor öffentlich zitiert wird.</li>
              </ul>
            </div>

          </div>
        </section>

        {/* Methodik im Detail */}
        <section id="cascade" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Specialist-Cascade — Live-Pipeline
          </h2>
          <p className="text-[13px] text-zinc-600 leading-relaxed mb-5 max-w-2xl">
            Statt ein Universal-Modell für alles zu verwenden, extrahiert ein starkes Modell breit
            (Generator) und kleine spezialisierte Modelle prüfen je <em>eine</em> Fehler-Klasse.
            Kleine Modelle sind günstig, aber chancenlos, wenn sie viele Dinge gleichzeitig leisten
            sollen — auf eine eng-definierte Frage fokussiert sind sie zuverlässig.
          </p>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-950 mt-2 mb-0">
              CV-Qualitäts-Pipeline (pro CV)
            </div>
            <p className="text-[12px] text-zinc-500 mb-1">
              Antwortet auf die Frage: Stimmt der extrahierte CV mit seiner Quelle überein?
            </p>
            <Step
              n="①"
              title="Generator"
              model="Haiku 4.5 (Anthropic)"
              family="Anthropic"
              desc={`Extrahiert aus Wikipedia-Volltext einen strukturierten JSON-CV mit Tool-Use-Schema — derzeit ${counts.mdbsCvJson} MdB-Profile. Bei verfügbarer Homepage-Vita zusätzliche Zweit-Extraktion mit identischem Modell (${counts.mdbsCvHomepage} MdBs). Beide Quellen werden in der Source-Coherence-Pipeline gegen einander geprüft.`}
              why="Strukturierte Extraktion mit vielen Feldern parallel ist eine breite Aufgabe — der Generator-Pass ist die einzige Stelle, an der das stärkere Modell sich lohnt. Identisches Modell für beide Quellen, damit der spätere Vergleich nicht von Modell-Unterschieden überlagert wird."
            />
            <Step
              n="②"
              title="Stammdaten-Konsistenz-Check"
              model="deterministisch — LLM-CV vs Wikidata + abgeordnetenwatch"
              family="—"
              desc="Vergleicht jede LLM-extrahierte Aussage gegen harte unabhängige Wahrheits-Quellen in der DB: Geburtsjahr (Wikidata), Partei-Zugehörigkeit (abgeordnetenwatch), Bundestag-Mandate. Wo das LLM diesen Wahrheiten widerspricht, ist das fast sicher Halluzination."
              why="Methodisches Goldstandard-Argument: kein LLM prüft das LLM, sondern eine völlig unabhängige Datenquelle. Deterministisch, reproduzierbar, kostet nichts laufend."
            />
            <Step
              n="③"
              title="Datums-Inspektor + deterministisches Repair"
              model="Mistral Small (Mistral AI) · Repair: kein LLM"
              family="Mistral AI"
              desc="Prüft jede Datums-Angabe gegen den Roh-Quelltext — eine eng definierte Frage pro Aussage. 13.542 Aussagen geprüft, 790 Issues identifiziert (426 falsch, 252 halluziniert, 112 fehlend). Repair anschließend deterministisch (clear_date / set_date / merge_entries) — Patches in cv_repair_log mit DB-Snapshot vorab."
              why="Klassisches Specialist-Pattern: kleines Modell auf eine Fehler-Klasse fokussiert. Andere Trainingsdaten als der Generator → fängt Halluzinations-Klassen, die der Generator selbst nicht sieht. Repair braucht keinen LLM, weil der Inspektor das korrekte Datum bereits liefert."
            />
            <Step
              n="④"
              title="Doubletten-Cascade"
              model="deterministischer Vorfilter → Llama 3.3 70B (first-pass) → Haiku 4.5 (Verifier)"
              family="Meta / Anthropic"
              desc="Pre-Filter (kein LLM) findet syntaktisch ähnliche Einträge im selben CV. Llama 3.3 70B macht den großzügigen ersten Pass (hohe Recall); jeder Llama-DUPLIKAT-Fall wird von Haiku 4.5 als zweiter, fremder Modell-Familie gegengeprüft. Konsens → Merge, Disagreement → beide Einträge bleiben sichtbar als verwandter Eintrag."
              why="Llama 70B als günstiger First-Pass mit hoher Recall; Haiku 4.5 als konservativer Cross-Vendor-Verifier (andere Familie → Bias-Schutz). Pre-Filter spart Cost: nur Verdachts-Pärchen gehen an die LLMs."
            />

            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-950 mt-6 mb-0">
              Source-Coherence-Pipeline (Wikipedia ↔ Homepage)
            </div>
            <p className="text-[12px] text-zinc-500 mb-1">
              Antwortet auf die andere Frage: Sagen zwei unabhängige Quellen dasselbe?
            </p>
            <Step
              n="⑤"
              title="Source-Coherence-Detection"
              model="gpt-oss-120b (Groq)"
              family="OpenAI"
              desc="Vergleicht Wikipedia-CV mit Homepage-CV und identifiziert Diskrepanz-Kandidaten (z.B. Wikipedia 2018, Homepage 2019). 563 MdBs mit beiden Quellen verglichen."
              why={`Eine fokussierte Frage: nicht "extrahiere alles", sondern "finde Unterschiede in zwei strukturierten Listen". Großes OSS-Modell auf Groq für einen Massen-Pass.`}
            />
            <Step
              n="⑥"
              title="Verifier + Halluzinations-Reparatur"
              model="Haiku 4.5 (Anthropic) · Repair: Llama 3.3 70B (Meta)"
              family="Anthropic / Meta"
              desc={`Klassifiziert jede Stufe-⑤-Diskrepanz gegen die Roh-Quelltexte: echte Quellen-Diskrepanz, Präzisierung, oder False-Positive? Bei "Extraktions-Fehler" folgt fokussierte Re-Extraktion durch Llama 70B aus dem Roh-Quelltext — Eintrag wird ersetzt oder gelöscht.`}
              why={`Empirisch validiert im Verifier-Vergleich unten: Llama 70B als Verifier ${(verifierCascade.llamaEchtRecall * 100).toFixed(0)} % ECHT-Recall, Haiku 4.5 erreicht ${(verifierCascade.haikuEchtRecall * 100).toFixed(0)} % — deutlich besseres Reasoning bei semantischen Welt-Wissens-Aufgaben. Repair durch andere Modell-Familie (Llama 70B) — fokussierte Single-Entry-Re-Extraktion ist Schema-Match, dafür reicht das größere Llama-Modell.`}
            />
            <Step
              n="⊕"
              title="Mensch-Final-Check"
              model="Opus 4.7 + User-Recherche"
              family="Mensch + Anthropic"
              desc="Bei den Stufe-⑥-Konflikten prüft ein Mensch jede Klassifikation gegen die Quellen, mit Opus 4.7 als Reasoning-Hilfe. Final-Verdict (ECHT / Präzisierung / False-Positive) landet öffentlich auf der Profilseite."
              why="Quellen-Diskrepanzen sind die folgenreichste Aussage der Plattform — keine Aussage ohne Mensch-Verifikation. Auch der beste Verifier-Cascade übersieht Einzelfälle (siehe Verifier-Vergleich unten)."
            />
          </div>

          <div className="mt-5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4">
            <h3 className="text-[12px] font-semibold text-zinc-950 mb-2">
              Warum Cascade statt Universal-Modell
            </h3>
            <ul className="space-y-1.5 text-[12.5px] text-zinc-600 leading-relaxed">
              <li><strong className="text-zinc-950">Modell-Familien-Diversität als Bias-Schutz.</strong> Generator und Inspektoren aus unterschiedlichen Familien (Anthropic, Mistral AI, Meta, OpenAI). Ein Inspektor aus anderer Familie detektiert eher die Fehler, die der Generator selbst übersieht.</li>
              <li><strong className="text-zinc-950">Empirie-getriebene Modell-Wahl pro Stufe.</strong> Siehe Verifier-Vergleich unten — Llama 70B vs Haiku 4.5 mit Opus als Ground Truth getestet.</li>
            </ul>
          </div>
        </section>

        {/* Detail Stufe 5 */}
        <section id="stufe-5" className="mb-10 scroll-mt-20">
          <h2 className="text-[15px] font-semibold text-zinc-950 mb-1">Source-Coherence-Check</h2>
          <p className="text-[13px] text-zinc-500 mb-4">
            Wikipedia-CV ↔ Homepage-CV pro Politiker:in verglichen. Diskrepanz-Kandidaten
            werden anschließend mit einem Verifier-Modell gegen die Roh-Quelltexte geprüft.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
            <BigStat value={stage5.politiciansChecked.toString()} label="Politiker:innen geprüft" sub={`von ${counts.mdbsCvHomepage} mit beiden Quellen (${pct(stage5.politiciansChecked, counts.mdbsCvHomepage)})`} />
            <BigStat value={stage5.candidatePairs.toString()} label="Aussage-Paare verglichen" sub="Wikipedia ↔ Homepage" />
            <BigStat value={stage5.conflictsFound.toString()} label="Diskrepanz-Kandidaten" sub={`bei ${stage5.politiciansWithConflicts} MdBs`} />
            <BigStat value={pct(stage5.conflictsFound, stage5.candidatePairs)} label="Diskrepanz-Quote" sub="der Paare" />
          </div>
        </section>

        {/* Verifier-Modell-Wahl — empirischer Vergleich */}
        <section id="phase-7" className="mb-10 scroll-mt-20">
          <h2 className="text-[15px] font-semibold text-zinc-950 mb-1">Verifier-Modell-Wahl — empirischer Vergleich</h2>
          <p className="text-[13px] text-zinc-500 mb-4">
            Nach Stage-5-Vollauf: {verifierCascade.total} Konflikt-Kandidaten. Welches Modell taugt
            als Verifier-Layer? Llama 3.3 70B (Free Tier) und Claude Haiku 4.5 mit identischem Prompt
            empirisch verglichen — Opus 4.7 manuell als Ground Truth.
          </p>
          <div className="border border-zinc-200/70 rounded-2xl bg-white overflow-hidden mb-4">
            <table className="w-full text-[14px]">
              <thead className="bg-zinc-50 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3 text-left">Verifier-Modell</th>
                  <th className="px-4 py-3 text-right">Agreement</th>
                  <th className="px-4 py-3 text-right">ECHT-Recall</th>
                  <th className="px-4 py-3 text-right">ECHT-Precision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr>
                  <td className="px-4 py-2.5">🟦 Llama 3.3 70B (Groq Free)</td>
                  <td className="px-4 py-2.5 text-right font-mono">{pct(verifierCascade.llamaAgreement, verifierCascade.total)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{(verifierCascade.llamaEchtRecall * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-right font-mono">{(verifierCascade.llamaEchtPrecision * 100).toFixed(1)}%</td>
                </tr>
                <tr className="bg-emerald-50/40">
                  <td className="px-4 py-2.5">🟩 Claude Haiku 4.5</td>
                  <td className="px-4 py-2.5 text-right font-mono">{pct(verifierCascade.haikuAgreement, verifierCascade.total)}</td>
                  <td className="px-4 py-2.5 text-right font-mono">{(verifierCascade.haikuEchtRecall * 100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5 text-right font-mono">{(verifierCascade.haikuEchtPrecision * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-[14px] text-zinc-700 leading-relaxed mb-4">
            <span className="font-medium text-zinc-950">Architektur-Lehre:</span>{" "}
            Source-Coherence ist semantische Reasoning-Aufgabe mit Welt-Wissens-Anteil — verschieden von
            Schema-Match-Tasks. Llama 3.3 70B reicht für Schema-Match („steht Datum X im Quelltext?"),
            ist aber für „kompatibel-vs-widersprüchlich"-Reasoning zu mild. Haiku 4.5 ist hier der
            angemessene Verifier-Layer (ca. $1.50/1000 Cases).
          </p>
          <div className="grid grid-cols-3 divide-x divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden mb-3">
            <BigStat value={verifierCascade.finalEcht.toString()} label="ECHT (final)" sub="echte Quellen-Widersprüche" highlight />
            <BigStat value={verifierCascade.finalPraez.toString()} label="Präzisierung" sub="kein echter Widerspruch" />
            <BigStat value={verifierCascade.finalFp.toString()} label="False Positive" sub="Stage-5 hat falsch geflaggt" />
          </div>
          <p className="text-[13px] text-zinc-600">
            Pipeline final: Stage 5 (gpt-oss-120b) → Haiku 4.5 Verifier → manueller Mensch-Last-Check (Opus 4.7 nur als Reasoning-Assistenz des Menschen, kein automatisierter Modell-Pass).{" "}
            <Link href="/design/linear/quellen-diskrepanzen" className="text-zinc-950 font-medium underline hover:no-underline">
              Vollständige Liste der {verifierCascade.finalEcht} echten Diskrepanzen →
            </Link>
          </p>
        </section>

        {/* Plenarbeitrag-Taxonomie */}
        <section id="plenarbeitrag-typen" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Plenarbeiträge — Was zählt als was?
          </h2>
          <p className="text-[13px] text-zinc-600 leading-relaxed mb-5 max-w-2xl">
            „Plenarbeitrag" ist auf der Plattform der Sammelbegriff für jede Wortmeldung im
            Plenum — von der vollwertigen Rede bis zur Zwischenfrage. Sechs Typen werden
            unterschieden, weil ihr politisches Gewicht und ihre journalistische Relevanz
            sehr verschieden sind. Eine Antwort in der Fragestunde ist keine Rede,
            eine Zwischenfrage erst recht nicht — wer das gleichsetzt, verfälscht das Bild.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200/70 bg-white">
            <table className="w-full text-[13px]">
              <thead className="bg-zinc-50/60 text-[10.5px] font-medium uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Typ</th>
                  <th className="text-left px-4 py-2.5 font-medium">Was es ist</th>
                  <th className="text-left px-4 py-2.5 font-medium">Roh-Typ in DB</th>
                  <th className="text-right px-4 py-2.5 font-medium">In WP21</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-950">Reden</td>
                  <td className="px-4 py-3 leading-snug">
                    Wortmeldungen in einer regulären Plenardebatte zu einem Tagesordnungspunkt.
                    Kern dessen, was umgangssprachlich „eine Bundestagsrede" heißt.
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-zinc-500">debatte</td>
                  <td className="px-4 py-3 text-right num text-zinc-700">{sayTyp("debatte")}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-950">Regierungserklärungen</td>
                  <td className="px-4 py-3 leading-snug">
                    Aussagen der Bundesregierung (Kanzler, Minister) zu politischen Vorhaben oder
                    Lagen. Eigene Kategorie wegen besonderem politischem Gewicht.
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-zinc-500">regierungserklaerung</td>
                  <td className="px-4 py-3 text-right num text-zinc-700">{sayTyp("regierungserklaerung")}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-950">Fragen</td>
                  <td className="px-4 py-3 leading-snug">
                    Fragen aus der Fragestunde an die Bundesregierung. Initiative liegt bei
                    der MdB, die fragt — keine Rede.
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-zinc-500">fragestunde_frage</td>
                  <td className="px-4 py-3 text-right num text-zinc-700">{sayTyp("fragestunde_frage")}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-950">Antworten</td>
                  <td className="px-4 py-3 leading-snug">
                    Antworten der Bundesregierung auf Fragen der Fragestunde. Reaktiv,
                    nicht initiativ — und wieder keine Rede im engen Sinn.
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-zinc-500">fragestunde_antwort</td>
                  <td className="px-4 py-3 text-right num text-zinc-700">{sayTyp("fragestunde_antwort")}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-950">Debattenbeiträge</td>
                  <td className="px-4 py-3 leading-snug">
                    Zwischenfragen während einer Rede und Kurzinterventionen — Live-Reaktionen,
                    nicht eigenständige Wortmeldungen.
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-zinc-500">zwischenfrage, kurzintervention</td>
                  <td className="px-4 py-3 text-right num text-zinc-700">{sayTyp("zwischenfrage_kurzintervention")}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-zinc-950">Erklärungen</td>
                  <td className="px-4 py-3 leading-snug">
                    Schriftliche oder mündliche Erklärungen nach §30/§31/§32 GO-BT — z.B. zur
                    eigenen Stimm-Begründung. Werden nicht ausgesprochen, aber zu Protokoll genommen.
                  </td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-zinc-500">erklaerung</td>
                  <td className="px-4 py-3 text-right num text-zinc-700">{sayTyp("erklaerung")}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4">
            <h3 className="text-[12px] font-semibold text-zinc-950 mb-2">
              Was passiert mit welchem Typ?
            </h3>
            <ul className="space-y-1.5 text-[12.5px] text-zinc-600 leading-relaxed">
              <li><strong className="text-zinc-950">Tonalitäts-Tagging und Bias-Audit</strong> laufen ausschließlich auf Reden und Regierungserklärungen — Fragen, Antworten und Debattenbeiträge sind zu kurz oder zu reaktiv für eine sinnvolle Stilanalyse.</li>
              <li><strong className="text-zinc-950">Quote-Validation</strong> (wörtliche Zitate gegen Roh-Text prüfen) gilt für die Reden-Pipeline; Methodologie-Doku in <code className="text-[11.5px] font-mono bg-white px-1.5 py-0.5 rounded border border-zinc-200">docs/summarization-methodology.md</code> (v2.1).</li>
              <li><strong className="text-zinc-950">Datenquellen</strong>: DIP-API liefert Aktivitäts-Metadaten, Plenarprotokoll-XMLs liefern den Volltext und die feinere Typisierung. Beide Seiten werden über Datum + Kategorie verschnitten — Plenar-Typisierung gewinnt beim Display, weil sie präziser ist (DIP führt z.B. alle Reden — auch Regierungserklärungen — als Aktivitätsart „Rede").</li>
              <li><strong className="text-zinc-950">Im Profil-Header</strong> einer MdB-Seite wird die Gesamtzahl aller Plenarbeiträge gezeigt, im Stats-Strip die feine Aufschlüsselung. So bleibt vergleichbar: 200 Plenarbeiträge sind nicht 200 Reden.</li>
            </ul>
          </div>
        </section>

        {/* Reden-Pipeline */}
        <section id="reden-pipeline" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Reden-Pipeline — wie wir Plenarreden analysieren
          </h2>
          <p className="text-[13px] text-zinc-600 leading-relaxed mb-5 max-w-2xl">
            Reden methodisch sind nicht wie CVs. Bei einem Lebenslauf ist die Failure-Mode
            <em> Halluzination</em> (erfundene Stationen) — schwarz/weiß prüfbar gegen die Quelle.
            Bei einer Rede ist die Failure-Mode <em>politische Verzerrung</em>: wertende Verben,
            schiefe Tonalitäts-Klassifikation, einseitige Zitat-Auswahl. Eine Rede-Analyse
            kann faktisch korrekt UND parteiisch gefärbt sein. Deswegen läuft die Reden-Pipeline
            mit zwei zusätzlichen Sicherungs-Schichten gegenüber der CV-Pipeline:
            wörtliche-Zitate-Validation und einem expliziten Bias-Audit-Schritt.
          </p>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-950 mt-2 mb-0">
              Reden-Analyse (pro Plenarrede)
            </div>
            <p className="text-[12px] text-zinc-500 mb-1">
              Antwortet auf die Frage: Was sagt diese Rede inhaltlich, wie ist die Tonalität, welche Forderungen werden aufgestellt — partei-neutral?
            </p>
            <Step
              n="①"
              title="Extraktion aus Plenarprotokoll-XML"
              model="deterministisch — XML-Parser, kein LLM"
              family="—"
              desc={`Bundestag stellt jede Sitzung als XML bereit. Der Parser extrahiert Reden mit Sprecher-ID (bt_redner_id), Partei, Tagesordnungspunkt-ID, Original-Volltext und Kommentaren in die Tabelle plenar_speeches. Aktuell ${counts.plenarSpeechesCount.toLocaleString("de-DE")} Reden mit 100 % topic_id-Zuordnung. Idempotent — erneuter Lauf bei neuer Sitzung holt nur Neues.`}
              why="Roh-Daten aus offizieller Quelle, keine LLM-Zwischenstation. Volltexte bleiben in der DB persistiert für spätere Re-Analysen mit neuen Methodologien."
            />
            <Step
              n="②"
              title="Generator — Reden-Analyse v2.1"
              model="Haiku 4.5 (Anthropic) · Tool-Use-Schema · Batch API"
              family="Anthropic"
              desc={`Pro Rede strukturiertes JSON gemäß Methodologie v2.1: Tonalität (11-Werte-Enum), Forderungen, 1-3 wörtliche Zitate, rhetorische Mittel, konkrete Zahlen, Anti-Halluzinations-Flags, Reden-Typ A-K, 2-Sätze-Zusammenfassung. Framing-Marker (wertende Etikettierung gegenüber genannten Gruppen) wird ebenfalls erzeugt, ist aber seit dem Audit am 2026-05-12 nicht mehr im UI sichtbar — 20-Sample-Audit zeigte ~35 % Halluzinations-/Modell-Prior-Quote bei diesem Feld. Two-Pass-Verifier ist die geplante Folgearbeit. Methodologie-Dokument wird als System-Prompt gecached. Aktuell ${counts.speechDistinctReden.toLocaleString("de-DE")} Reden in ${counts.speechSegments.toLocaleString("de-DE")} Segmenten analysiert, initialer Batch Cost ~$41,82.`}
              why="Strukturierte Mehrfeld-Extraktion mit klar definierten Feldern ist Schema-Match — Haiku 4.5 reicht. Tool-Use erzwingt JSON-Konformität. Batch API senkt Kosten um ~50 %. Methodologie als Prompt-Asset (versioniert: v1 → v2 partei-neutral → v2.1 mit Self-Check)."
            />
            <Step
              n="③"
              title="Quote-Validation (deterministisch)"
              model="Substring-Match gegen Original-Volltext"
              family="—"
              desc={`Pro Rede wird jedes wörtliche Zitat aus Schritt ② als Substring im Original-Volltext gesucht. Treffer → quote_valid_count++. Aktueller Stand: ${counts.quoteValidCount.toLocaleString("de-DE")} von ${counts.quoteTotalCount.toLocaleString("de-DE")} Zitaten validiert (${pct(counts.quoteValidCount, counts.quoteTotalCount)}). ${counts.redenWithVerifiedQuote.toLocaleString("de-DE")} von ${counts.speechDistinctReden.toLocaleString("de-DE")} Reden haben mindestens ein verifiziertes Zitat.`}
              why="Halluzinierte Zitate sind die folgenreichste Fehler-Klasse. Deterministisch + reproduzierbar — kein zweites LLM nötig. Ein Bürger sieht sofort: dieses Zitat steht so im Plenarprotokoll, oder nicht."
            />
            <Step
              n="④"
              title="Bias-Audit — Tier-A-Wortlisten-Scanner"
              model="deterministischer Scanner + Llama 3.1 8B als Inspector"
              family="Meta"
              desc={`Wortliste bekannt problematischer LLM-Editorialisierungs-Begriffe (z.B. „perfide", „scheinheilig", „Heuchelei", „entlarvt") wird gegen jede zusammenfassung_2_saetze und jeden forderungen_json-Eintrag geprüft. 425 Treffer im initialen Batch gefunden. Llama 3.1 8B klassifiziert pro Treffer: stand der Begriff im Original-Text (legitim) oder hat das LLM ihn hinzu-editiert (Bias)? Ergebnis: 400 von 425 als LLM-Editorialisierung klassifiziert (94 %).`}
              why="Quote-Validation prüft die Zitate, nicht die Summary-Sprache selbst. Ein zweiter Inspektor — andere Modell-Familie als der Generator — prüft genau die Wertungs-Wörter, die der Generator selbst nicht sieht."
            />
            <Step
              n="⑤"
              title="Bias-Korrektur — Re-Batch mit verschärftem Prompt"
              model="Haiku 4.5 (Anthropic) · v2.1-Prompt mit neutralitaets_self_check"
              family="Anthropic"
              desc={`Die 400 als Editorialisierung markierten Reden wurden in einem zweiten Batch mit verschärftem Prompt neu analysiert (v2.1 mit neutralitaets_self_check-Pflichtfeld). Auto-Mapping plus manueller Override haben ${counts.biasCorrectionsApplied} der ${counts.biasCorrectionsTotal} Re-Analysen ans Frontend gemerged (zusammenfassung_2_saetze_final, fix_source-Spalte für Audit); die restlichen ${counts.biasCorrectionsTotal - counts.biasCorrectionsApplied} liegen als Korrektur-Vorschlag in speech_analyses_v2_corrections und warten auf Spotcheck-Durchlauf.`}
              why={`Korrektur in eigener Pipeline mit explizitem Self-Check, in einer kleineren Probe (400 statt ${counts.speechDistinctReden.toLocaleString("de-DE")}). Sauberer als „besseren Prompt für alle, neu rechnen" — wir wissen genau, welche Reden warum revidiert wurden. Trade-off: Merge-Fortschritt nicht 100 % — siehe oben.`}
            />
            <Step
              n="⊕"
              title="Tonalitäts-Drift-Repair (deterministisch)"
              model="Mapping-Tabelle, kein LLM"
              family="—"
              desc={`Trotz JSON-Schema-Enum produziert das LLM in ~${counts.tonalitatsDriftRepaired} von ${counts.speechDistinctReden.toLocaleString("de-DE")} Fällen Tonalitäts-Werte außerhalb der 11 erlaubten Klassen (z.B. „polemisch_emotional"). Ein deterministisches Mapping-Skript (fix-tonalitaet-drift.ts) bügelt diese Drift in den nächstgelegenen Enum-Wert. Original wird als tonalitaet_original aufbewahrt — auditierbar.`}
              why="Tool-Use-Schema-Enum ist nicht 100 % zuverlässig — empirische Erkenntnis aus dem Vollauf. Determinstische Reparatur, kein zusätzlicher LLM-Call."
            />

            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-950 mt-6 mb-0">
              Vote-Topic-Mapping (pro namentlicher Abstimmung)
            </div>
            <p className="text-[12px] text-zinc-500 mb-1">
              Antwortet auf die Frage: Welche Reden gehören zu welcher Bundestags-Abstimmung — damit Aussage und Stimmverhalten nebeneinander zeigbar werden?
            </p>
            <Step
              n="①"
              title="Datums-Match (deterministisch)"
              model="SQL-Join über poll_date ↔ plenar_sessions.datum"
              family="—"
              desc={`Jede der ${counts.pollsCount} namentlichen Abstimmungen findet in einer konkreten Plenarsitzung statt. Sauberes ${counts.pollsCount}/${counts.pollsCount}-Match — keine Fehlzuordnung.`}
              why="Reine Daten-Operation, kein LLM nötig wenn die Datums-Felder sauber sind."
            />
            <Step
              n="②"
              title="Topic-Match mit Reden-Disambiguierung"
              model="Haiku 4.5 (Anthropic) · Multiple-Choice-Tool-Schema"
              family="Anthropic"
              desc={`Pro Vote werden alle TOPs der Session als Kandidaten geladen + die ersten 1-2 Reden-Zusammenfassungen pro TOP als Disambiguierungs-Kontext. Das LLM wählt einen oder zwei TOPs mit Confidence-Tag (high / medium / low / none). Cost ~$0,05 für 50 Polls. Endergebnis nach manuellem Vollspotcheck (2026-05-07): 90 % HIGH (45/50, 3 LLM-Fehler manuell korrigiert), 10 % NONE (5 Beschlussempfehlungen ohne Aussprache in derselben Session — strukturell nicht mappbar). Manuelle Korrekturen tragen audit-Tag „manual-opus-4.7-spotcheck-2026-05-07".`}
              why={`TOP-Titel sind oft formal-identisch (z.B. drei Bundeswehr-Mandate desselben Tages tragen alle den Titel „Beschlussempfehlung des Auswärtigen Ausschusses"). Reden-Summary-Kontext disambiguiert zuverlässig. Empirisch: erste Iteration ohne Kontext erreichte 0 % HIGH; mit 1-2 Reden-Summaries als Kontext 88 % HIGH. Bekannte Restschwäche: bei verbundenen Debatten (mehrere Anträge unter einem Aussprache-TOP, separat abgestimmt) wird der LLM manchmal von beiläufigen Erwähnungen in Reden in die Irre geleitet — daher hat ein Mensch alle 50 Mappings nachgeprüft und 3 Fehler korrigiert.`}
            />
          </div>

          <div className="mt-5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4">
            <h3 className="text-[12px] font-semibold text-zinc-950 mb-2">
              Warum die Reden-Pipeline mehr Sicherungen hat als die CV-Pipeline
            </h3>
            <ul className="space-y-1.5 text-[12.5px] text-zinc-600 leading-relaxed">
              <li><strong className="text-zinc-950">Failure-Mode ist Bias, nicht Faktenfehler.</strong> Eine Rede-Summary kann sachlich korrekt UND parteiisch gefärbt sein. Quote-Validation (Step ③) plus expliziter Bias-Audit (Step ④–⑤) prüfen genau das, was Schema-Konformität allein nicht abdeckt.</li>
              <li><strong className="text-zinc-950">Methodologie-Versionierung mit SHA.</strong> Reden ändern sich inhaltlich nicht — aber unsere Methodik schon. Jede Analyse trägt die Methodology-SHA, die sie erzeugt hat (auditierbares Vorher/Nachher).</li>
            </ul>
          </div>
        </section>

        {/* Glossar — Tonalitäten */}
        <section id="glossar-tonalitaet" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Glossar — Tonalitäten
          </h2>
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-5 max-w-3xl">
            <p className="text-[12.5px] text-amber-900 leading-relaxed">
              <strong>Wichtig — was diese Klassifikation bedeutet:</strong> Die
              Tonalitäten beschreiben die <em>rhetorische Form</em> einer Rede,
              nicht ihre inhaltliche Berechtigung. „Polemisch" ist keine
              Wertung der Position; „sachlich" ist keine Bestätigung der Inhalte.
              Eine polemische Rede kann politisch begründet sein, eine sachliche
              Rede inhaltlich falsch. Das Label klassifiziert <em>wie</em>{" "}
              gesprochen wird, nicht <em>was</em> richtig ist.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TONALITAET_DEFS.map((d) => (
              <div
                key={d.slug}
                id={`glossar-tonalitaet-${d.slug.replace(/_/g, "-")}`}
                className="bg-white border border-zinc-200/70 rounded-xl p-4 scroll-mt-24 [&:target]:ring-2 [&:target]:ring-zinc-900 [&:target]:border-zinc-900 transition-all"
              >
                <h3 className="text-[13px] font-semibold text-zinc-950 mb-1.5">
                  {d.label}
                </h3>
                <p className="text-[13px] text-zinc-700 leading-relaxed">
                  {d.long}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Tonalitäts-Verteilung je Fraktion */}
        <section id="tonalitaet-verteilung" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Tonalitäts-Verteilung je Fraktion
          </h2>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-5 max-w-3xl">
            <p className="text-[12.5px] text-amber-900 leading-relaxed">
              <strong>Methodische Limitation vorab:</strong> Die Tonalitäten sind ein
              LLM-pragmatisches Schema, kein etabliertes politikwissenschaftliches
              Coding-System (anders als z.B. CMP/Manifesto-Project). Eine
              <em> Inter-Annotator-Agreement-Studie</em> mit mindestens zwei
              unabhängigen menschlichen Codierer:innen liegt nicht vor — sie ist
              offene Folgearbeit. Die folgende Tabelle zeigt, wie <em>dieses Modell</em>{" "}
              die Reden klassifiziert, nicht, wie sie objektiv einzustufen wären.
              Konsistenz ist nicht Neutralität.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 mb-4 overflow-x-auto">
            <p className="text-[13px] text-zinc-600 mb-3">
              Anteil der jeweiligen Tonalität innerhalb der Fraktion. Basis:{" "}
              <strong className="text-zinc-950">11.101 Rede-Segmente aus 9.272 unterschiedlichen Plenar-Reden</strong>{" "}
              (eine Rede besteht aus 1–N inhaltlichen Segmenten, jedes mit eigener Tonalitäts-Klassifikation) in{" "}
              <code className="text-[11.5px] font-mono bg-zinc-100 px-1 rounded">speech_analyses_v2</code>.
            </p>
            <table className="text-[12px] w-full">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                  <th className="py-2 px-1.5 font-medium">Fraktion</th>
                  <th className="py-2 px-1.5 font-medium text-right">Segmente</th>
                  <th className="py-2 px-1.5 font-medium text-right">Sachlich</th>
                  <th className="py-2 px-1.5 font-medium text-right">Konfront.-bel.</th>
                  <th className="py-2 px-1.5 font-medium text-right">Polem.-sachl.</th>
                  <th className="py-2 px-1.5 font-medium text-right">Polemisch</th>
                  <th className="py-2 px-1.5 font-medium text-right">Defensiv-pragm.</th>
                  <th className="py-2 px-1.5 font-medium text-right">Bilanzierend</th>
                  <th className="py-2 px-1.5 font-medium text-right">Staatsmänn.</th>
                  <th className="py-2 px-1.5 font-medium text-right">Sozial-anklag.</th>
                  <th className="py-2 px-1.5 font-medium text-right">Mahnend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 num">
                <tr><td className="py-1.5 px-1.5">CDU/CSU</td><td className="py-1.5 px-1.5 text-right">2.394</td><td className="py-1.5 px-1.5 text-right">26,7 %</td><td className="py-1.5 px-1.5 text-right">21,8 %</td><td className="py-1.5 px-1.5 text-right">0,8 %</td><td className="py-1.5 px-1.5 text-right">0,3 %</td><td className="py-1.5 px-1.5 text-right">13,1 %</td><td className="py-1.5 px-1.5 text-right">25,2 %</td><td className="py-1.5 px-1.5 text-right">10,4 %</td><td className="py-1.5 px-1.5 text-right">0,0 %</td><td className="py-1.5 px-1.5 text-right">1,1 %</td></tr>
                <tr className="bg-amber-50/40"><td className="py-1.5 px-1.5">AfD</td><td className="py-1.5 px-1.5 text-right">2.341</td><td className="py-1.5 px-1.5 text-right">8,8 %</td><td className="py-1.5 px-1.5 text-right">10,9 %</td><td className="py-1.5 px-1.5 text-right font-semibold text-amber-900">27,6 %</td><td className="py-1.5 px-1.5 text-right font-semibold text-amber-900">46,9 %</td><td className="py-1.5 px-1.5 text-right">3,9 %</td><td className="py-1.5 px-1.5 text-right">0,0 %</td><td className="py-1.5 px-1.5 text-right">0,3 %</td><td className="py-1.5 px-1.5 text-right">0,2 %</td><td className="py-1.5 px-1.5 text-right">0,2 %</td></tr>
                <tr><td className="py-1.5 px-1.5">SPD</td><td className="py-1.5 px-1.5 text-right">1.478</td><td className="py-1.5 px-1.5 text-right">24,0 %</td><td className="py-1.5 px-1.5 text-right">25,1 %</td><td className="py-1.5 px-1.5 text-right">0,2 %</td><td className="py-1.5 px-1.5 text-right">0,1 %</td><td className="py-1.5 px-1.5 text-right">10,7 %</td><td className="py-1.5 px-1.5 text-right">23,0 %</td><td className="py-1.5 px-1.5 text-right">9,4 %</td><td className="py-1.5 px-1.5 text-right">1,7 %</td><td className="py-1.5 px-1.5 text-right">3,0 %</td></tr>
                <tr><td className="py-1.5 px-1.5">Grüne</td><td className="py-1.5 px-1.5 text-right">1.684</td><td className="py-1.5 px-1.5 text-right">21,2 %</td><td className="py-1.5 px-1.5 text-right font-semibold">57,6 %</td><td className="py-1.5 px-1.5 text-right">0,6 %</td><td className="py-1.5 px-1.5 text-right">0,7 %</td><td className="py-1.5 px-1.5 text-right">4,2 %</td><td className="py-1.5 px-1.5 text-right">0,7 %</td><td className="py-1.5 px-1.5 text-right">5,6 %</td><td className="py-1.5 px-1.5 text-right">3,0 %</td><td className="py-1.5 px-1.5 text-right">5,0 %</td></tr>
                <tr><td className="py-1.5 px-1.5">Linke</td><td className="py-1.5 px-1.5 text-right">1.142</td><td className="py-1.5 px-1.5 text-right">9,5 %</td><td className="py-1.5 px-1.5 text-right">32,5 %</td><td className="py-1.5 px-1.5 text-right">0,2 %</td><td className="py-1.5 px-1.5 text-right">0,5 %</td><td className="py-1.5 px-1.5 text-right">2,6 %</td><td className="py-1.5 px-1.5 text-right">0,1 %</td><td className="py-1.5 px-1.5 text-right">0,2 %</td><td className="py-1.5 px-1.5 text-right font-semibold">50,2 %</td><td className="py-1.5 px-1.5 text-right">2,6 %</td></tr>
                <tr><td className="py-1.5 px-1.5 text-zinc-500">Präsidium / o. Partei</td><td className="py-1.5 px-1.5 text-right">2.015</td><td className="py-1.5 px-1.5 text-right">26,9 %</td><td className="py-1.5 px-1.5 text-right">0,7 %</td><td className="py-1.5 px-1.5 text-right">0,0 %</td><td className="py-1.5 px-1.5 text-right">0,0 %</td><td className="py-1.5 px-1.5 text-right">57,8 %</td><td className="py-1.5 px-1.5 text-right">4,4 %</td><td className="py-1.5 px-1.5 text-right">9,3 %</td><td className="py-1.5 px-1.5 text-right">0,0 %</td><td className="py-1.5 px-1.5 text-right">0,5 %</td></tr>
              </tbody>
            </table>
            <p className="text-[11px] text-zinc-400 mt-2">Tonalitäten <em>emotional-persönlich</em> und <em>ironisch-jugendlich</em> mit jeweils &lt; 3 % in allen Fraktionen weggelassen — siehe <a href="/design/linear/methodik#glossar-tonalitaet" className="underline decoration-zinc-300 hover:decoration-zinc-950 hover:text-zinc-950">Glossar</a> für alle 11 Werte.</p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 space-y-3 text-[14px] text-zinc-700 leading-relaxed">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Was die Zahlen zeigen</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <strong className="text-zinc-950">AfD:</strong> Kombiniert 74,5 % polemisch / polemisch-sachlich; sachlich nur 8,8 % vs. 24-27 % bei CDU/SPD.</li>
                <li>· <strong className="text-zinc-950">Linke:</strong> 50,2 % sozial-anklagend dominiert (in keiner anderen Fraktion &gt; 3 %); zusätzlich 32,5 % konfrontativ-belegend.</li>
                <li>· <strong className="text-zinc-950">Grüne:</strong> 57,6 % konfrontativ-belegend dominiert.</li>
                <li>· <strong className="text-zinc-950">CDU/CSU + SPD:</strong> ähnliche Verteilung über sachlich / konfrontativ-belegend / bilanzierend-werbend / defensiv-pragmatisch — Regierungs-Mitte-Muster.</li>
                <li>· <strong className="text-zinc-950">Präsidium / Reden ohne Fraktion:</strong> 57,8 % defensiv-pragmatisch (Sitzungsleitung, Regierungsbänke).</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Was die Zahlen nicht zeigen</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· Keine Aussage <em>„X % der AfD-Reden sind objektiv polemisch"</em> — nur: <em>„... werden von diesem Modell als polemisch klassifiziert"</em>. Konsistente Vergabe ≠ unbestreitbare Codierung.</li>
                <li>· Keine Validität gegen ein etabliertes politikwissenschaftliches Coding-Schema (z.B. CMP).</li>
                <li>· Keine Inter-Annotator-Agreement-Studie — Cohen's Kappa unbekannt.</li>
                <li>· <strong className="text-zinc-950">Topic-Confound:</strong> Die Verteilung reflektiert teilweise den <em>Themen-Mix</em> der Fraktion. Wenn eine Fraktion überproportional zu Themen spricht, die das Modell systematisch in eine bestimmte Tonalitäts-Kategorie einordnet (z.B. Migration → polemisch, soziale Ungleichheit → sozial-anklagend), misst die Tabelle teilweise <em>was</em> die Fraktion bespricht, nicht nur <em>wie</em>. Eine themen-kontrollierte Auswertung steht aus.</li>
                <li>· <strong className="text-zinc-950">Speaker-Identity-Confound:</strong> Es ist unklar, in welchem Maße die Klassifikation die <em>Rhetorik der Rede selbst</em> reflektiert oder die <em>Vorerwartung des Modells an die Sprecher:in</em>. Beispiel: würde dieselbe Rede mit anderem Fraktions-Label anders klassifiziert? Ein Speaker-blind-Sanity-Check (Rede ohne Sprecher-Information durchs Modell) ist offene Folgearbeit.</li>
                <li>· Klassifikator-Bias möglich: ein auf öffentlichen Daten trainiertes LLM kann systematische Wahrnehmungs-Schiefen reproduzieren.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Offene Folgearbeit</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· IAA-Studie mit mindestens zwei unabhängigen menschlichen Codierer:innen (Cohen's Kappa).</li>
                <li>· Cross-Validation gegen ein Modell anderer Familie (Sanity-Check, kein IAA-Ersatz).</li>
                <li>· <strong className="text-zinc-950">Themen-kontrollierte Auswertung</strong> (Tonalitäts-Verteilung <em>innerhalb desselben Topics</em>, getrennt nach Fraktion) zur Trennung von Themen-Confound und Rhetorik-Confound.</li>
                <li>· <strong className="text-zinc-950">Speaker-blind-Sanity-Check</strong>: Stichprobe von Reden ohne Fraktions-Information durch dasselbe Modell laufen lassen; Klassifikations-Stabilität messen.</li>
                <li>· Stichproben-Audit der AfD-Polemisch-Klassifikationen (74,5 %) auf Plausibilität pro Rede.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Manueller Rede-Audit */}
        <section id="rede-audit" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Audit der Rede-Analyse-Outputs — 20-Sample-Stichprobe
          </h2>

          <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-5 max-w-3xl">
            <p className="text-[12.5px] text-amber-900 leading-relaxed">
              <strong>Was diese Stichprobe ist und nicht ist:</strong> 20 zufällig
              gewählte Rede-Segmente, stratifiziert nach Fraktion (4 je Fraktion ×
              5 Fraktionen), manuell durch den Projekt-Lead gegen Originaltext geprüft.
              Liefert eine <strong>Größenordnung</strong> und identifiziert Fehler-Klassen
              — keine statistische Power für %-Aussagen mit Konfidenzintervallen und kein
              Inter-Annotator-Agreement (nur ein Auditor). Belastbare Studie mit ≥ 100
              Segmenten und zwei unabhängigen Codierer:innen ist offene Folgearbeit.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 mb-4 overflow-x-auto">
            <p className="text-[13px] text-zinc-600 mb-3">
              Trefferquote der LLM-Outputs gegen Originaltext (✅ OK / ⚠️ teilweise / ❌ falsch):
            </p>
            <table className="text-[13px] w-full">
              <thead>
                <tr className="text-left text-[10.5px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                  <th className="py-2 px-2 font-medium">Dimension</th>
                  <th className="py-2 px-2 font-medium text-right">✅ OK</th>
                  <th className="py-2 px-2 font-medium text-right">⚠️ teils</th>
                  <th className="py-2 px-2 font-medium text-right">❌ falsch</th>
                  <th className="py-2 px-2 font-medium text-right">Trefferquote</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 num">
                <tr><td className="py-1.5 px-2"><strong>Wörtliche Zitate</strong></td><td className="py-1.5 px-2 text-right">20</td><td className="py-1.5 px-2 text-right">0</td><td className="py-1.5 px-2 text-right">0</td><td className="py-1.5 px-2 text-right font-semibold">100,0 %</td></tr>
                <tr><td className="py-1.5 px-2">Forderungen</td><td className="py-1.5 px-2 text-right">18</td><td className="py-1.5 px-2 text-right">2</td><td className="py-1.5 px-2 text-right">0</td><td className="py-1.5 px-2 text-right">90,0 %</td></tr>
                <tr><td className="py-1.5 px-2">Zusammenfassung</td><td className="py-1.5 px-2 text-right">18</td><td className="py-1.5 px-2 text-right">1</td><td className="py-1.5 px-2 text-right">1</td><td className="py-1.5 px-2 text-right">90,0 %</td></tr>
                <tr><td className="py-1.5 px-2">Tonalität</td><td className="py-1.5 px-2 text-right">17</td><td className="py-1.5 px-2 text-right">2</td><td className="py-1.5 px-2 text-right">1</td><td className="py-1.5 px-2 text-right">85,0 %</td></tr>
                <tr className="bg-amber-50/40"><td className="py-1.5 px-2"><strong>Framing-Marker</strong></td><td className="py-1.5 px-2 text-right">13</td><td className="py-1.5 px-2 text-right">4</td><td className="py-1.5 px-2 text-right">3</td><td className="py-1.5 px-2 text-right font-semibold text-amber-900">65,0 %</td></tr>
              </tbody>
            </table>
            <p className="text-[11px] text-zinc-500 mt-3">
              Gesamt-Overall pro Segment: 10× 5/5 perfekt · 6× 4/5 mit kleinen Schwächen · 4× 3/5 mit klaren Issues · keine &lt; 3/5.
            </p>
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-2xl p-5 space-y-3 text-[14px] text-zinc-700 leading-relaxed">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Befunde</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <strong className="text-zinc-950">Wörtliche Zitate sind die robusteste Schicht</strong> (100 % findbar). Die Quote-Validation-Pipeline funktioniert empirisch — kein halluziniertes Zitat in der Stichprobe.</li>
                <li>· <strong className="text-zinc-950">Forderungen und Zusammenfassungen sind solide</strong> (je 90 %). Schwächen entstehen bei Genre-Verwechslung (rhetorische Frage als „Forderung" markiert) oder Faktenfehlern, nicht durch Vollerfindung.</li>
                <li>· <strong className="text-zinc-950">Tonalität meist richtig</strong> (85 %); vereinzelte Fehlklassifikationen bei hybriden Reden (z.B. „mahnend + bilanzierend + konfrontativ" wird in eine Klasse gepresst) oder sehr kurzen Segmenten.</li>
                <li>· <strong className="text-amber-900">Framing-Marker sind die schwächste Dimension</strong> (65 % klar passend). Das Modell setzt vereinzelt themen-typische Marker, ohne dass der Text die Konzepte tatsächlich enthält — Modell-Prior-Halluzination. Beispiele: „frozen_assets" bei zwei Ukraine-Reden ohne Textbasis; „generalverdacht_buerokratiemonster" generisch bei Linken/AfD-Reden eingesetzt.</li>
                <li>· <strong className="text-zinc-950">Interne Konsistenz nicht garantiert:</strong> Sample 8205 hatte „1 Milliarde" in der Zusammenfassung, „1 Billion" in der „konkrete_zahlen"-Spalte. <strong>Folge-Sweep über alle 11.101 Segmente:</strong> 5 echte Größenordnungs-Verwechslungen identifiziert (~0,07 % der Segmente mit Zahl-Angabe) — Mieves war kein Eisberg, sondern Vertreter einer kleinen, dokumentierten Klasse. Pattern: in 4 von 5 Fällen ist die Prosa-Zusammenfassung falsch, das strukturierte Zahlen-Feld korrekt.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Konsequenzen für die Pipeline</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· Wörtliche Zitate, Forderungen und Zusammenfassungen sind <em>bewährte</em> Pipeline-Ausgaben für UI-Anzeige.</li>
                <li>· Tonalität ist <em>heuristisch</em> mit dem Disclaimer der Tonalitäts-Sektion oben.</li>
                <li>· Framing-Marker werden als <strong className="text-zinc-950">experimentelles Feature</strong> betrachtet, bis eine bessere Validierung vorliegt (engerer Prompt, Belegstellen-Forderung, oder Ersatz durch domänen-spezifische Klassifikation).</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-zinc-100 text-[12.5px] text-zinc-600">
              Rohdaten + alle 20 Bewertungen im Detail: <code className="text-[11.5px] font-mono bg-zinc-100 px-1 rounded">docs/rede-audit-samples.md</code> + <code className="text-[11.5px] font-mono bg-zinc-100 px-1 rounded">docs/rede-audit-findings.md</code> im{" "}
              <a href="https://github.com/j-chen8/politik" target="_blank" rel="noopener noreferrer" className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 inline-flex items-center gap-1 transition-colors">
                Repository
                <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
              </a>.
            </div>
          </div>
        </section>

        {/* Glossar — Reden-Typen */}
        <section id="glossar-redentyp" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Glossar — Reden-Typen (A–K)
          </h2>
          <p className="text-[14px] text-zinc-600 leading-relaxed mb-3 max-w-3xl">
            Ergänzend zur Tonalität klassifizieren wir den <em>Funktionstyp</em>{" "}
            jeder Rede. Eine einzelne Rede kann mehreren Typen zugeordnet sein
            (notiert als <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">A+B</code>).
          </p>
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl px-4 py-3 mb-5 max-w-3xl">
            <p className="text-[12.5px] text-amber-900 leading-relaxed">
              Auch hier gilt: die Typen beschreiben die <em>rhetorische Funktion</em>{" "}
              einer Rede, nicht ihre Qualität oder inhaltliche Richtigkeit. Etiketten
              wie „polemisch" oder „bilanzierend" sind deskriptiv gemeint —
              keine Bewertung der politischen Position.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {REDEN_TYP_DEFS.map((d) => (
              <div
                key={d.code}
                id={`glossar-redentyp-${d.code}`}
                className="bg-white border border-zinc-200/70 rounded-xl p-4 scroll-mt-24 [&:target]:ring-2 [&:target]:ring-zinc-900 [&:target]:border-zinc-900 transition-all"
              >
                <h3 className="text-[13px] font-semibold text-zinc-950 mb-1.5">
                  <span className="font-mono text-zinc-500 mr-2">{d.code}</span>
                  {d.label}
                </h3>
                <p className="text-[13px] text-zinc-700 leading-relaxed">
                  {d.long}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Vote-↔-Drucksache Cross-Source-Audit (2026-05-13) */}
        <section id="vote-drucksache-audit" className="mb-14 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Vote-↔-Drucksache — Cross-Source-Audit gegen Bundestag.de
          </h2>

          <p className="text-[15px] text-zinc-600 leading-relaxed mb-5 max-w-3xl">
            Welcher Antrag, welche Beschlussempfehlung gehört zu welcher namentlichen
            Abstimmung? Statt auf eine Heuristik zu vertrauen, ist die Zuordnung
            <strong className="text-zinc-950"> gegen Bundestag.de — die offizielle Quelle — verifiziert</strong>.
            Pipeline und Ergebnis-Tabellen sind dokumentiert in{" "}
            <code className="text-[12.5px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">docs/vote-drucksache-mapping-methodology.md</code>.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden mb-5">
            <BigStat value={`${counts.pollsCount}/${counts.pollsCount}`} label="Polls verifiziert" sub="100 % Coverage" />
            <BigStat value="121" label="Bundestag-Pages" sub="gecrawled (IDs 900-1020)" />
            <BigStat value="270" label="Drucksachen-Links" sub="vorher 57 (~5×)" highlight />
            <BigStat value="16" label="Korrektur-Fälle" sub="alte Heuristik daneben" />
          </div>

          <div className="bg-white border border-zinc-200/70 rounded-2xl p-6 space-y-4 text-[14px] text-zinc-700 leading-relaxed">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Vorgehen</div>
              <ol className="space-y-1.5 ml-1 text-[13.5px] list-decimal list-inside">
                <li><strong className="text-zinc-950">Crawl</strong> — {counts.bundestagAuditPagesCount} Bundestag.de-Abstimmungs-Pages parsen (Datum, Topic, Drucksachen aus <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">a-link__label</code>-Spans).</li>
                <li><strong className="text-zinc-950">Klassifikation</strong> — Topic-Match via Longest-Common-Substring (robust gegen deutsche Komposita) gegen unsere Polls.</li>
                <li><strong className="text-zinc-950">Manuelle Verifikation</strong> — pro Poll Topic-Lesung + Plausibilitäts-Check, gerade bei Bündel-Abstimmungen (mehrere Polls am gleichen Tag).</li>
                <li><strong className="text-zinc-950">Apply</strong> — alte 57 Mappings archiviert in <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">drucksache_polls_pre_bt_audit</code>, neue Bundestag-Liste mit <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">matched_via=&apos;bundestag_de_audit&apos;</code> eingefügt.</li>
              </ol>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Was der Audit aufgedeckt hat</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <strong className="text-zinc-950">33 / 50</strong> Polls: alte Heuristik hatte die richtige Drucksache (Bundestag hat zusätzliche Begleit-Drucksachen → übernommen).</li>
                <li>· <strong className="text-amber-900">16 / 50</strong> Polls: alte Heuristik hatte eine <em>falsche</em> Drucksache zugeordnet (typisch: spätere-WP-Nummern oder thematisch ähnliche Anträge). Bundestag-Liste hat diese korrigiert.</li>
                <li>· <strong className="text-zinc-950">1 / 50</strong> Polls: partielle Korrektur (eine DS ersetzt — Poll 6286 Verbrenner-Verbot, <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">21/1593</code> → <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">21/225</code>).</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Konsequenz für die UI</div>
              <p className="text-[13.5px]">
                Auf jeder Vote-Detail-Seite (<code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">/abstimmungen/&lt;poll_id&gt;</code>) erscheint die Sektion „Drucksachen zur Abstimmung" mit dem expliziten Hinweis, dass die Verknüpfung autoritativ aus Bundestag.de stammt. Die Plattform versteht sich als Analyse- und Aufbereitungs-Schicht über offiziellen Quellen — nicht als alternative Datenquelle.
              </p>
            </div>

            <div className="pt-2 border-t border-zinc-100">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Reproduzierbarkeit</div>
              <ul className="space-y-1 ml-1 text-[13px]">
                <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">scripts/audit-vote-drucksache-mapping.ts</code> — Crawler + Auto-Klassifikation</li>
                <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">scripts/auto-classify-vote-mapping.ts</code> — LCS-basiertes Topic-Matching</li>
                <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">scripts/apply-vote-bundestag-audit.ts</code> — Apply mit manuell verifiziertem 50-Poll-Mapping</li>
                <li>· DB-Tabellen: <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">audit_bundestag_polls</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">drucksache_polls</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">drucksache_polls_pre_bt_audit</code></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Audit-Trail */}
        <section id="audit-trail" className="mb-10 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Audit-Trail &amp; Reproduzierbarkeit
          </h2>
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-6 space-y-4 text-[14px] text-zinc-700 leading-relaxed">
            <p>Jede Entscheidung jedes Modells ist persistent gespeichert und öffentlich nachprüfbar:</p>

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                CV-Qualitäts-Pipeline
              </div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv-consistency-report.md</code> — Stammdaten-Konsistenz-Check: Widersprüche LLM-CV vs. Wikidata/abgeordnetenwatch</li>
                <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">inspect-dates.partial.jsonl</code> — Datums-Inspektor-Verdikte für 13.542 Aussagen aus 631 MdBs</li>
                <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">detect-duplicates.partial.jsonl</code> + <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">verify-duplicates.partial.jsonl</code> — Doubletten-Vorfilter + LLM-Verifikation mit Merge-Empfehlungen</li>
                <li>· DB-Tabelle <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_repair_log</code> — jeder angewandte Patch mit Originaltext, neuem Text, Modell-Audit, Zeitstempel</li>
              </ul>
            </div>

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Source-Coherence-Pipeline
              </div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">source-coherence.partial.jsonl</code> — alle Stufe-⑤-Vergleiche Wikipedia-CV ↔ Homepage-CV ({counts.sourceCoherenceChecked} Politiker:innen)</li>
                <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">haiku-/final-verdicts-source-coherence.jsonl</code> — Verifier-Cascade-Klassifikationen ({verifierCascade.total} Kandidaten) + Mensch-Final</li>
              </ul>
            </div>

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                Hygiene-Routinen + Stamm-Audit
              </div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <strong className="text-zinc-950">Sonstiges-Cleanup-Pass</strong> (3-Stufen-Cascade: HTML-Strip → Whitelist → Haiku 4.5) — Hygiene-Pass auf den „Sonstiges"-Block: {counts.sonstigesDrops} Drops + {counts.sonstigesFixes} HTML-Fixes appliziert; Audit in cv_repair_log mit <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">repair_version=&apos;homepage-sonstiges-cleanup-v1&apos;</code>.</li>
                <li>· DB-Spalten <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_model</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_homepage_model</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_summary_model</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_prompt_version</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_raw_llm_response</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">source_conflicts</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">source_coherence_checked_at</code> — vollständiger Verarbeitungs-Trail pro Aussage</li>
                <li>· Roh-Texte der Quellen (Wikipedia-Volltext, Bundestag-Bio, Homepage-Vita, Bundesregierung-Bio) werden zur LLM-Extraktion intern in der DB vorgehalten und <strong className="text-zinc-950">nicht öffentlich angezeigt</strong>; öffentlich ist nur die strukturierte Aggregation mit Link zur Originalquelle.</li>
              </ul>
            </div>

<p className="text-[13px] text-zinc-600 pt-2 border-t border-zinc-100">
              Alle Skripte zum Reproduzieren sind im{" "}
              <a href="https://github.com/j-chen8/politik" target="_blank" rel="noopener noreferrer" className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 inline-flex items-center gap-1 transition-colors">
                GitHub-Repository
                <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
              </a>: u.a.{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">seed-cv.ts</code>,{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">check-cv-consistency.ts</code>,{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">inspect-dates.ts</code>,{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">repair-cv-entries.ts</code>,{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">verify-duplicates.ts</code>,{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cleanup-sonstiges.ts</code>,{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">source-coherence-check.ts</code>,{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">verify-source-coherence-haiku.ts</code>,{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">fix-hallucinated-cv-entries.ts</code>.
            </p>
          </div>
        </section>

        {/* Coverage-Bias */}
        <section id="coverage-bias" className="mb-10 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Coverage-Bias der Quellen
          </h2>
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-6 space-y-4 text-[14px] text-zinc-700 leading-relaxed">
            <p>
              Ungleiche Quellen-Coverage erzeugt automatisch Mess-Bias. Wir prüfen daher
              die Verteilung der Quellen-Coverage für aktive MdB der 21. WP (629 Personen)
              gegen Fraktion, Geschlecht und Geburtsjahr-Kohorten — und vor allem:
              wir trennen <strong className="text-zinc-950">persönliche Homepages</strong> von <strong className="text-zinc-950">institutionellen Listings</strong> (Partei-/Fraktions-Profil-Seiten).
              Letztere wurden im Roh-Datensatz als „Homepage-URL" eingetragen, sind aber
              keine eigenständigen Vita-Seiten.
            </p>

            <div className="overflow-x-auto -mx-2">
              <table className="text-[13px] w-full">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wider text-zinc-500 border-b border-zinc-200">
                    <th className="py-2 px-2 font-medium">Fraktion</th>
                    <th className="py-2 px-2 font-medium text-right">MdB</th>
                    <th className="py-2 px-2 font-medium text-right">Wikipedia</th>
                    <th className="py-2 px-2 font-medium text-right">Bundestag-Bio</th>
                    <th className="py-2 px-2 font-medium text-right">Persönliche Homepage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 num">
                  <tr><td className="py-1.5 px-2">CDU/CSU</td><td className="py-1.5 px-2 text-right">208</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">91,3 %</td></tr>
                  <tr className="bg-amber-50/40"><td className="py-1.5 px-2">AfD</td><td className="py-1.5 px-2 text-right">150</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right font-semibold text-amber-900">69,3 %</td></tr>
                  <tr><td className="py-1.5 px-2">SPD</td><td className="py-1.5 px-2 text-right">120</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">91,7 %</td></tr>
                  <tr><td className="py-1.5 px-2">Bündnis 90/Die Grünen</td><td className="py-1.5 px-2 text-right">84</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">92,9 %</td></tr>
                  <tr className="bg-amber-50/40"><td className="py-1.5 px-2">Die Linke</td><td className="py-1.5 px-2 text-right">64</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right font-semibold text-amber-900">57,8 %</td></tr>
                  <tr><td className="py-1.5 px-2 text-zinc-500">fraktionslos</td><td className="py-1.5 px-2 text-right">3</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">100 %</td><td className="py-1.5 px-2 text-right">66,7 %</td></tr>
                </tbody>
              </table>
            </div>

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Befund</div>
              <ul className="space-y-1.5 ml-1 text-[13.5px]">
                <li>· <strong className="text-zinc-950">Wikipedia + Bundestag-Bio: 100 % Coverage über alle Fraktionen, Geschlechter, Alterskohorten.</strong> Keine systematische Verzerrung.</li>
                <li>· <strong className="text-zinc-950">Persönliche Homepage ist fraktional asymmetrisch — aus zwei verschiedenen Gründen:</strong></li>
                <li className="ml-4">· <strong className="text-amber-900">AfD (69,3 %):</strong> 28 von 150 AfD-MdB sind im Roh-Datensatz mit institutionellen Profil-Seiten verlinkt (<code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">afdbundestag.de/person/</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">afd.de/profil/</code>) statt eigener Vita-Seiten. Sie tauchen damit nicht im Wikipedia-↔-Homepage-Vergleich auf.</li>
                <li className="ml-4">· <strong className="text-amber-900">Die Linke (57,8 %):</strong> Linke-MdB betreiben häufiger keine persönlichen Homepages — vermutlich politkulturell (Kollektiv-Auftritte über Fraktion und Partei statt Personenmarke), kein Daten-Defekt. Weitere 4 sind mit <code className="text-[12px] font-mono bg-zinc-100 px-1 rounded">linksfraktion.de/abgeordnete/profil/...</code> als Listing verlinkt.</li>
                <li>· <strong className="text-zinc-950">CDU/CSU, SPD, Grüne:</strong> 91-93 % persönliche Coverage, kaum institutionelle Listings.</li>
              </ul>
            </div>

            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Konsequenz für die Pipeline</div>
              <p className="text-[13.5px]">
                Wikipedia- und Bundestag-Bio-basierte Auswertungen sind unverzerrt.{" "}
                <strong className="text-zinc-950">Quellen-Diskrepanz-Vergleiche Wikipedia ↔ Homepage</strong> unterrepräsentieren AfD-MdB (~31 % ohne erfasste persönliche Quelle) und Linke-MdB (~42 %) systematisch. Wir gleichen das <strong>nicht</strong> durch künstliche Gewichtung oder zusätzliche fraktionsspezifische Quellen aus — beides würde Bias durch die Hintertür einführen. Stattdessen ist die Asymmetrie hier offengelegt; Pipeline-Befunde zu AfD- und Linke-Politiker:innen tragen den expliziten Hinweis „2-Quellen-Vergleich nur in ~69 % / 58 % der Fälle möglich".
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/70 bg-amber-50/40 p-4">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-amber-900 mb-2">
                Bekannte Pipeline-Pathologien
              </div>
              <ul className="space-y-1.5 ml-1 text-[13px] text-zinc-700 leading-relaxed">
                <li>· <strong className="text-zinc-950">Stale-Page-Scraping (Orphan-URLs):</strong> bei mind. einem Fall (Bareiß) hat der Scraper eine alte Wahlkampf-Webseite gefolgt, die zum Scraping-Zeitpunkt noch unter der bekannten URL erreichbar war. Folge: gescrapte Vita-Sektionen referenzieren ein längst ausgelaufenes Mandat. Wir re-scrapen diese Fälle <em>nicht</em> automatisch; stattdessen sind sie mit cv_homepage_status markiert und im Profil-Display als „Datenstand" datiert.</li>
                <li>· <strong className="text-zinc-950">Leere oder Standard-Profil-Seiten:</strong> einige Homepage-URLs (insbesondere AfD-Standard-Layouts) liefern Stub-Seiten ohne strukturierten Vita-Block. Die Extraktion erzeugt dann ein leeres cv_homepage_json — wird im Source-Coherence-Vergleich übersprungen, aber als „2-Quellen-Vergleich nicht möglich" gekennzeichnet.</li>
                <li>· <strong className="text-zinc-950">Multi-Page-Biographien werden nicht traversiert:</strong> wenn eine Homepage einen Hub-Page mit Links zu Unter-Seiten („Werdegang", „Politische Stationen", „Engagements") betreibt, fetcht der Scraper nur den Hub. Folge: Teile der Vita gehen verloren oder das LLM extrahiert aus dem Hub-Layout halluzinierte Felder. Mindestens 1 dokumentierter Fall (Heiligenstadt: Hub + 3 Themen-Seiten).</li>
                <li>· <strong className="text-zinc-950">Source-Coherence-Recall ist niedrig:</strong> auf einer Bewertungsstichprobe lag der Recall des Wikipedia↔Homepage-Konflikt-Detectors bei ~13 %. Die Pipeline findet damit nur eine Minderheit der echten Diskrepanzen. Die hier öffentlich gezeigten Konflikte sind dokumentierte Treffer, nicht „die Gesamtmenge aller Diskrepanzen in der DB".</li>
                <li>· <strong className="text-zinc-950">Tonalitäts-Enum-Drift:</strong> trotz JSON-Schema-Enum gibt das LLM in ~{counts.tonalitatsDriftRepaired} Fällen Tonalitäts-Werte ausserhalb der erlaubten 11 Klassen aus. Wird deterministisch in den nächstgelegenen Enum-Wert gemappt (siehe Reden-Pipeline Step ⊕), Original bleibt als tonalitaet_original erhalten.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Ehrlichkeits-Hinweis */}
        <section id="ehrlichkeit" className="mb-10 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-6 scroll-mt-20">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-amber-800 mb-2">
            Ehrlicher Hinweis: Fehler werden minimiert, nicht eliminiert
          </h2>
          <p className="text-[14px] text-zinc-700 leading-relaxed">
            Auch dieses Verfahren kann Fehler nicht vollständig ausschließen. KI-Modelle
            können in Einzelfällen falsch entscheiden, Quelltexte können veraltet oder
            lückenhaft sein, manche Aussagen lassen sich aus den vorhandenen Quellen
            nicht eindeutig prüfen. Das Konsens-Verfahren reduziert das Fehlerrisiko
            deutlich — eine 100%-ige Korrektheit garantieren wir nicht. Bei jedem
            Eintrag ist die Quelle verlinkt, du kannst selbst nachprüfen. Wenn dir
            Fehler auffallen, melde sie bitte als Korrektur.
          </p>
        </section>

          </main>

          {/* Desktop: Sticky-Sidebar TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                <ListTree className="w-3 h-3" strokeWidth={2.25} />
                Auf dieser Seite
              </div>
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TableOfContents() {
  return (
    <nav className="space-y-5 text-[12.5px]">
      {TOC_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
            {group.label}
          </div>
          <ul className="space-y-0.5 border-l border-zinc-200">
            {group.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block pl-3 -ml-px border-l border-transparent hover:border-zinc-900 hover:text-zinc-950 text-zinc-600 py-1 leading-snug transition-colors"
                >
                  <span className="block font-medium">{item.label}</span>
                  {item.sub && (
                    <span className="block text-[11px] text-zinc-400">{item.sub}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function BigStat({
  value,
  label,
  sub,
  highlight,
}: {
  value: string;
  label: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-5 py-5">
      <div className={"num text-3xl font-semibold tracking-tight mb-0.5 " + (highlight ? "text-zinc-950" : "text-zinc-950")}>
        {value}
      </div>
      <div className="text-[12.5px] font-medium text-zinc-700">{label}</div>
      {sub && <div className="text-[11px] text-zinc-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Step({
  n,
  title,
  model,
  family,
  desc,
  why,
}: {
  n: string;
  title: string;
  model: string;
  family: string;
  desc: string;
  why?: string;
}) {
  return (
    <div className="bg-white border border-zinc-200/70 rounded-xl p-4 flex gap-3">
      <span className="text-zinc-400 font-mono text-xl shrink-0">{n}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
          <span className="font-semibold text-zinc-950 text-[14px]">{title}</span>
          <span className="text-[11.5px] text-zinc-500 font-mono">{model}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded">
            {family}
          </span>
        </div>
        <p className="text-[13px] text-zinc-600 leading-relaxed">{desc}</p>
        {why && (
          <p className="text-[11.5px] text-zinc-500 leading-relaxed mt-2 pt-2 border-t border-zinc-100">
            <strong className="text-zinc-700">Warum dieses Modell:</strong> {why}
          </p>
        )}
      </div>
    </div>
  );
}

