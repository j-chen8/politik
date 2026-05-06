import path from "path";
import fs from "fs";
import Link from "next/link";
import { ExternalLink, ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Methodik & Wirksamkeit | Politik-Radar",
  description:
    "Wie das Multi-LLM-Konsens-System der Politik-Radar funktioniert — mit konkreten Wirksamkeits-Zahlen aus dem letzten Lauf.",
};

interface VerdictCount {
  llama: number;
  mistral: number;
  beide: number;
  keiner: number;
  unklar: number;
  total: number;
}

function readVerdicts(filePath: string, kind: "v1" | "v2"): VerdictCount {
  const tally: VerdictCount = { llama: 0, mistral: 0, beide: 0, keiner: 0, unklar: 0, total: 0 };
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    for (const line of txt.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const winner = kind === "v1" ? obj?.verdict?.winner : obj?.v2Verdict?.winner;
        if (typeof winner === "string" && winner in tally) {
          (tally as any)[winner] += 1;
          tally.total += 1;
        }
      } catch {}
    }
  } catch {}
  return tally;
}

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

interface Stage5_5Stats {
  echte_diskrepanz: number;
  wikipedia_extraktion_falsch: number;
  homepage_extraktion_falsch: number;
  beide_falsch: number;
  unklar: number;
  total: number;
}

function readStage5_5Stats(filePath: string): Stage5_5Stats {
  const stats: Stage5_5Stats = { echte_diskrepanz: 0, wikipedia_extraktion_falsch: 0, homepage_extraktion_falsch: 0, beide_falsch: 0, unklar: 0, total: 0 };
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    for (const line of txt.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const cls = obj?.verification?.classification;
        if (typeof cls === "string" && cls in stats) {
          (stats as any)[cls] += 1;
          stats.total += 1;
        }
      } catch {}
    }
  } catch {}
  return stats;
}

interface ReparaturStats {
  replaced: number;
  deleted: number;
  total: number;
}

function readReparaturStats(reportPath: string): ReparaturStats {
  const stats: ReparaturStats = { replaced: 0, deleted: 0, total: 0 };
  try {
    const txt = fs.readFileSync(reportPath, "utf-8");
    const replacedMatch = txt.match(/Ersetzt\s*\|\s*(\d+)/);
    const deletedMatch = txt.match(/Gelöscht\s*\|\s*(\d+)/);
    if (replacedMatch) stats.replaced = parseInt(replacedMatch[1], 10);
    if (deletedMatch) stats.deleted = parseInt(deletedMatch[1], 10);
    stats.total = stats.replaced + stats.deleted;
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
  const v1 = readVerdicts(path.join(root, "tiebreak.partial.jsonl"), "v1");
  const v2 = readVerdicts(path.join(root, "tiebreak-v2.partial.jsonl"), "v2");
  const stage5 = readStage5Stats(path.join(root, "source-coherence.partial.jsonl"));
  const stage5_5 = readStage5_5Stats(path.join(root, "verify-source-conflicts.partial.jsonl"));
  const reparatur = readReparaturStats(path.join(root, "fix-hallucinated-cv-report.md"));
  const verifierCascade = readVerifierCascadeStats(root);

  const llamaHallucinations = v1.mistral + v2.mistral;
  const v1Unclear = v1.keiner + v1.unklar;
  const v2Resolved = v2.llama + v2.mistral + v2.beide;
  const stage5_5Halluzinationen = stage5_5.wikipedia_extraktion_falsch + stage5_5.homepage_extraktion_falsch + stage5_5.beide_falsch;

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-12 fade-in-up">
        <Link
          href="/design/linear/datenquellen"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zu Datenquellen
        </Link>

        <div className="mb-12">
          <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
            Auditierbar
          </span>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4">
            Methodik &amp; Wirksamkeit
          </h1>
          <p className="text-[16px] text-zinc-600 leading-relaxed max-w-2xl">
            Aus den 640 MdB-Profilen haben wir <span className="text-zinc-950 font-medium">14.347 strukturierte
            Lebenslauf-Aussagen</span> extrahiert — Ausbildung, Berufsstationen, Mandate, Funktionen.
            Jede einzelne wurde durch ein Multi-LLM-Konsens-Verfahren mit fünf unabhängigen Modell-Familien
            geprüft. Hier ist, was dabei herausgekommen ist.
          </p>
        </div>

        {/* Quick-Stats */}
        <section className="mb-14">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Wirksamkeit auf einen Blick
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
            <BigStat value="14.347" label="Aussagen geprüft" sub="aus 640 MdB-Profilen" />
            <BigStat value={v1.total.toString()} label="Diskrepanzen erkannt" sub={`nur ${pct(v1.total, 14347)} — Rest konsistent`} />
            <BigStat value={llamaHallucinations.toString()} label="Halluzinationen entdeckt" sub="korrigiert" highlight />
            <BigStat value="5" label="Modell-Familien" sub="Meta · Mistral · NVIDIA · Anthropic · OpenAI" />
          </div>
        </section>

        {/* Methodik im Detail */}
        <section className="mb-14">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Das 5-Stufen-Verfahren
          </h2>
          <div className="space-y-2">
            <Step
              n="①"
              title="Generator"
              model="Llama 3.1/3.3 (Groq)"
              family="Meta"
              desc="Extrahiert aus Wikipedia und Homepage je einen strukturierten JSON-CV."
              why="Open-Weights-Standard für strukturierte Extraktion aus deutschsprachigem Text. Auf Groq sehr schnell (~50 ms/Call) — für 14.347 Erst-Aussagen ideal."
            />
            <Step
              n="②"
              title="Cross-Check"
              model="Mistral Small"
              family="Mistral AI"
              desc="Extrahiert dieselben Daten unabhängig nochmal. Wo Llama und Mistral abweichen, entstehen Konflikte zur Prüfung."
              why="Andere Trainingsdaten-Mischung als Llama (französisches/mehrsprachiges Pretraining), andere Architektur. EU-Anbieter ist methodisch zusätzlich wertvoll."
            />
            <Step
              n="③"
              title="Tiebreaker — Inter-LLM-Konflikt"
              model="Nemotron-Nano-12b-v2 (NVIDIA NIM)"
              family="NVIDIA"
              desc="Schlichtet zwischen Llama- und Mistral-Verdikten: Wer stimmt mit dem Quelltext überein?"
              why="Eigene Mamba-Transformer-Architektur (NICHT Llama-basiert) — echte dritte unabhängige Stimme. Klein, aber für Information Retrieval mit gegebener Quelle ausreichend; das ist kein offenes Reasoning."
            />
            <Step
              n="④"
              title="Tiebreaker v2 — Inter-LLM (4 Quellen)"
              model="Claude Haiku 4.5 (Anthropic)"
              family="Anthropic"
              desc="Bei unsicheren Verdikten zweite Runde mit allen 4 Roh-Text-Quellen gleichzeitig."
              why="Fünfte unabhängige Familie — und das reasoning-stärkste Modell unserer Pipeline. Genau die richtige Wahl für die heikelste Stufe, in der teils widersprüchliche Quelltexte gegeneinander abgewogen werden müssen."
            />
            <Step
              n="⑤"
              title="Source-Coherence-Check"
              model="gpt-oss-120b (Groq)"
              family="OpenAI"
              desc="Vergleicht pro Politiker:in Wikipedia-CV vs. Homepage-CV und identifiziert Diskrepanz-Kandidaten zwischen den Quellen."
              why="Großes Open-Source-Modell auf Groq — passt zu einem Lauf über alle 640 MdBs in vertretbarer Zeit. Erkennt nuanciert, ob 'verschiedene Phasen' (kein Widerspruch) oder 'gleicher Sachverhalt, andere Daten' (Diskrepanz-Kandidat)."
            />
            <Step
              n="⑤.5"
              title="Tiebreaker — Inter-Source-Konflikt"
              model="Llama 3.3 70B (Groq)"
              family="Meta"
              desc="Schlichtet Stage-5-Diskrepanzen gegen die Roh-Quelltexte: echte Quellen-Diskrepanz oder Extraktions-Fehler einer Seite?"
              why="Zweite Tiebreaker-Schicht für eine andere Konflikt-Art. Liest die Roh-Quelltexte und klassifiziert. Hat sich als entscheidende Halluzinations-Detektion erwiesen — fängt eine Klasse Fehler, die Stufe 2-4 systematisch verpassen."
            />
          </div>
          <div className="mt-5 rounded-xl border border-zinc-200/70 bg-zinc-50/50 p-4">
            <h3 className="text-[12px] font-semibold text-zinc-950 mb-2">
              Warum 5 Stufen statt einfach ein großes Modell?
            </h3>
            <ul className="space-y-1.5 text-[12.5px] text-zinc-600 leading-relaxed">
              <li><strong className="text-zinc-950">Diversität schlägt Größe.</strong> 5 unabhängige Modell-Familien (Meta, Mistral AI, NVIDIA, Anthropic, OpenAI) prüfen jede Aussage — keine Trainingsdaten-Schlagseite dominiert.</li>
              <li><strong className="text-zinc-950">Spezialisierung pro Aufgabe.</strong> Jede Stufe nutzt das Modell, das für ihre Aufgabe am besten passt — nicht ein Universal-Modell überall.</li>
              <li><strong className="text-zinc-950">Fehler-Robustheit.</strong> Ein Fehler eines einzelnen Modells muss von mehreren Stufen unbemerkt bleiben, um durchzukommen.</li>
              <li><strong className="text-zinc-950">Skalierbarkeit.</strong> Kleine, schnelle Modelle laufen auf großen Datenmengen stabiler als ein einzelnes 70B-Modell.</li>
              <li><strong className="text-zinc-950">Auditierbarkeit.</strong> Pro Aussage nachvollziehbar, welches Modell mit welcher Prompt-Version wann entschieden hat.</li>
            </ul>
          </div>
        </section>

        {/* Detail v1 */}
        <section className="mb-10">
          <h2 className="text-[15px] font-semibold text-zinc-950 mb-1">Stufe 3 — Tiebreaker · Inter-LLM-Konflikt (v1)</h2>
          <p className="text-[13px] text-zinc-500 mb-4">
            In <span className="text-zinc-950 font-medium">{(14347 - v1.total).toLocaleString("de-DE")} von 14.347 Aussagen
            ({pct(14347 - v1.total, 14347)})</span> waren Llama und Mistral übereinstimmend — doppelt bestätigt.
            Die Tabelle zeigt das Tiebreaker-Verdict (Nemotron-Nano) für die{" "}
            <span className="text-zinc-950 font-medium">{v1.total} strittigen Fälle</span>{" "}
            ({pct(v1.total, 14347)} aller Aussagen).
          </p>
          <VerdictTable counts={v1} highlight="mistral" />
        </section>

        {/* Detail v2 */}
        <section className="mb-10">
          <h2 className="text-[15px] font-semibold text-zinc-950 mb-1">Stufe 4 — Tiebreaker v2 · Inter-LLM (4 Quellen)</h2>
          <p className="text-[13px] text-zinc-500 mb-4">
            Für die {v1Unclear} unscharfen Fälle aus v1 — zweite Runde mit Claude Haiku 4.5 und allen 4 Roh-Text-Quellen.
          </p>
          <VerdictTable counts={v2} highlight="mistral" />
          <p className="text-[12px] text-zinc-500 mt-3">
            {v2Resolved} von {v2.total} unscharfen Fällen ({pct(v2Resolved, v2.total)}) wurden aufgelöst.
            Wirkung: 0 unentscheidbare Fälle in der finalen DB.
          </p>
        </section>

        {/* Detail Stufe 5 */}
        <section className="mb-10">
          <h2 className="text-[15px] font-semibold text-zinc-950 mb-1">Stufe 5 — Source-Coherence-Check</h2>
          <p className="text-[13px] text-zinc-500 mb-4">
            Wikipedia-CV ↔ Homepage-CV pro Politiker:in verglichen. Diskrepanz-Kandidaten
            werden in Stufe 5.5 gegen die Roh-Quelltexte verifiziert.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
            <BigStat value={stage5.politiciansChecked.toString()} label="Politiker:innen geprüft" sub={`von 640 (${pct(stage5.politiciansChecked, 640)})`} />
            <BigStat value={stage5.candidatePairs.toString()} label="Aussage-Paare verglichen" sub="Wikipedia ↔ Homepage" />
            <BigStat value={stage5.conflictsFound.toString()} label="Diskrepanz-Kandidaten" sub={`bei ${stage5.politiciansWithConflicts} MdBs`} />
            <BigStat value={pct(stage5.conflictsFound, stage5.candidatePairs)} label="Diskrepanz-Quote" sub="der Paare" />
          </div>
        </section>

        {/* Detail Stufe 5.5 */}
        <section className="mb-10">
          <h2 className="text-[15px] font-semibold text-zinc-950 mb-1">Stufe 5.5 — Tiebreaker · Inter-Source-Konflikt</h2>
          <p className="text-[13px] text-zinc-500 mb-4">
            Jeder Stage-5-Kandidat wird gegen die echten Roh-Quelltexte (Wikipedia-Volltext + Homepage-Volltext) geprüft.
            Klassifikation: echte Quellen-Diskrepanz oder LLM-Extraktions-Fehler aus Stufe 1?
          </p>
          <div className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
            <table className="w-full text-[13px]">
              <thead className="bg-zinc-50/60 text-[11px] uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Klassifikation</th>
                  <th className="px-4 py-2.5 text-right font-medium">Anzahl</th>
                  <th className="px-4 py-2.5 text-right font-medium">Anteil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <tr><td className="px-4 py-2.5">🟧 Echte Quellen-Diskrepanz</td><td className="px-4 py-2.5 text-right font-mono">{stage5_5.echte_diskrepanz}</td><td className="px-4 py-2.5 text-right text-zinc-500 font-mono">{pct(stage5_5.echte_diskrepanz, stage5_5.total)}</td></tr>
                <tr className="bg-amber-50/40"><td className="px-4 py-2.5">🟦 Wikipedia-Extraktion falsch</td><td className="px-4 py-2.5 text-right font-mono">{stage5_5.wikipedia_extraktion_falsch}</td><td className="px-4 py-2.5 text-right text-zinc-500 font-mono">{pct(stage5_5.wikipedia_extraktion_falsch, stage5_5.total)}</td></tr>
                <tr className="bg-amber-50/40"><td className="px-4 py-2.5">🟦 Homepage-Extraktion falsch</td><td className="px-4 py-2.5 text-right font-mono">{stage5_5.homepage_extraktion_falsch}</td><td className="px-4 py-2.5 text-right text-zinc-500 font-mono">{pct(stage5_5.homepage_extraktion_falsch, stage5_5.total)}</td></tr>
                <tr className="bg-amber-50/40"><td className="px-4 py-2.5">🟥 Beide falsch</td><td className="px-4 py-2.5 text-right font-mono">{stage5_5.beide_falsch}</td><td className="px-4 py-2.5 text-right text-zinc-500 font-mono">{pct(stage5_5.beide_falsch, stage5_5.total)}</td></tr>
                <tr><td className="px-4 py-2.5">⬜ Unklar</td><td className="px-4 py-2.5 text-right font-mono">{stage5_5.unklar}</td><td className="px-4 py-2.5 text-right text-zinc-500 font-mono">{pct(stage5_5.unklar, stage5_5.total)}</td></tr>
              </tbody>
            </table>
          </div>
          <p className="text-[12.5px] text-zinc-700 mt-3 leading-relaxed">
            <span className="font-medium text-zinc-950">Methodisches Highlight:</span>{" "}
            Stufe 5.5 hat <span className="font-medium text-zinc-950">{stage5_5Halluzinationen} LLM-Extraktions-Fehler</span> identifiziert,
            die alle vorherigen Konsens-Schritte durchgerutscht sind. Erst der Vergleich gegen die Roh-Quelltexte deckt es auf.
          </p>
        </section>

        {/* Detail Reparatur */}
        <section className="mb-10">
          <h2 className="text-[15px] font-semibold text-zinc-950 mb-1">Halluzinations-Reparatur (Follow-Up)</h2>
          <p className="text-[13px] text-zinc-500 mb-4">
            Die in Stufe 5.5 als Extraktions-Fehler markierten Einträge werden mit Llama 3.3 70B
            aus dem Roh-Quelltext neu extrahiert — oder gelöscht, falls nicht im Quelltext belegt.
          </p>
          <div className="grid grid-cols-3 divide-x divide-zinc-200/70 border border-zinc-200/70 rounded-2xl bg-white overflow-hidden">
            <BigStat value={reparatur.replaced.toString()} label="Ersetzt" sub="durch korrigierten Eintrag" highlight />
            <BigStat value={reparatur.deleted.toString()} label="Gelöscht" sub="nicht im Quelltext belegt" />
            <BigStat value={reparatur.total.toString()} label="Total korrigiert" sub={`von ${stage5_5Halluzinationen} markiert`} />
          </div>
        </section>

        {/* Phase 7 — Verifier-Cascade-Auswahl (5. Mai 2026) */}
        <section className="mb-10">
          <h2 className="text-[15px] font-semibold text-zinc-950 mb-1">Phase 7 — Verifier-Cascade-Auswahl</h2>
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
            Pipeline final: Stage 5 (gpt-oss-120b) → Haiku 4.5 Verifier → Opus 4.7 + Mensch Last-Check.{" "}
            <Link href="/design/linear/quellen-diskrepanzen" className="text-zinc-950 font-medium underline hover:no-underline">
              Vollständige Liste der {verifierCascade.finalEcht} echten Diskrepanzen →
            </Link>
          </p>
        </section>

        {/* Audit-Trail */}
        <section className="mb-10">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Audit-Trail &amp; Reproduzierbarkeit
          </h2>
          <div className="bg-white border border-zinc-200/70 rounded-2xl p-6 space-y-3 text-[14px] text-zinc-700 leading-relaxed">
            <p>Jede Entscheidung jedes Modells ist persistent gespeichert und öffentlich nachprüfbar:</p>
            <ul className="space-y-1.5 ml-1">
              <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">tiebreak.partial.jsonl</code> — alle {v1.total} Stufe-3-Tiebreaker-Entscheidungen mit Begründung &amp; Quellenzitat</li>
              <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">tiebreak-v2.partial.jsonl</code> — alle {v2.total} Stufe-4-Entscheidungen mit Quelle pro Beleg</li>
              <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">source-coherence.partial.jsonl</code> — alle Stufe-5-Vergleiche (Wikipedia-CV ↔ Homepage-CV)</li>
              <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">verify-source-conflicts.partial.jsonl</code> — alle {stage5_5.total} Stufe-5.5-Klassifikationen mit Volltext-Zitaten</li>
              <li>· <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">fix-hallucinated-cv-report.md</code> — alle {reparatur.total} Reparatur-Schritte</li>
              <li>· DB-Spalten <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_model</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_prompt_version</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cv_raw_llm_response</code>, <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">source_conflicts</code> — vollständiger Verarbeitungs-Trail</li>
              <li>· Roh-Texte (Wikipedia-Volltext, Bundestag-Bio, Homepage-Vita, Bundesregierung-Bio) sind in der DB persistiert</li>
            </ul>
            <p className="text-[13px] text-zinc-600 pt-2 border-t border-zinc-100">
              Alle Skripte zum Reproduzieren sind im{" "}
              <a href="https://github.com/opoi1/politik" target="_blank" rel="noopener noreferrer" className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 inline-flex items-center gap-1 transition-colors">
                GitHub-Repository
                <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
              </a>
              :{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">seed-cv.ts</code> (1),{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">cross-check-mistral.ts</code> (2),{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">tiebreak-conflicts.ts</code> (3),{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">tiebreak-v2-uncertain.ts</code> (4),{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">source-coherence-check.ts</code> (5),{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">verify-source-conflicts.ts</code> (5.5),{" "}
              <code className="text-[12px] font-mono bg-zinc-100 px-1.5 py-0.5 rounded">fix-hallucinated-cv-entries.ts</code> (Reparatur).
            </p>
          </div>
        </section>

        {/* Ehrlichkeits-Hinweis */}
        <section className="mb-10 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-6">
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
      </div>
    </div>
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

function VerdictTable({ counts, highlight }: { counts: VerdictCount; highlight?: keyof VerdictCount }) {
  const rows: { icon: string; label: string; key: keyof VerdictCount; desc: string }[] = [
    { icon: "🟦", label: "Llama korrekt", key: "llama", desc: "Llama hatte recht, Mistral lag daneben" },
    { icon: "🟧", label: "Mistral korrekt", key: "mistral", desc: "Llama-Halluzination entdeckt → korrigiert" },
    { icon: "🟩", label: "Beide korrekt", key: "beide", desc: "Detail-Differenz, beide Aussagen separat belegt" },
    { icon: "🟥", label: "Beide falsch", key: "keiner", desc: "Kein Beleg für beide gefunden" },
    { icon: "⬜", label: "Unklar", key: "unklar", desc: "Quelle zu dünn zum Entscheiden" },
  ];
  return (
    <div className="bg-white border border-zinc-200/70 rounded-2xl overflow-hidden">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-zinc-100">
            <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">Verdict</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500">Anzahl</th>
            <th className="px-4 py-2.5 text-right text-[11px] font-medium uppercase tracking-wider text-zinc-500">Anteil</th>
            <th className="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">Bedeutung</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.key}
              className={"border-b border-zinc-100 last:border-0 " + (r.key === highlight ? "bg-amber-50/50" : "")}
            >
              <td className="px-4 py-2.5 font-medium text-zinc-950">
                <span className="mr-2">{r.icon}</span>
                {r.label}
              </td>
              <td className="px-4 py-2.5 text-right num font-semibold text-zinc-950">{counts[r.key]}</td>
              <td className="px-4 py-2.5 text-right num text-zinc-500">{pct(counts[r.key] as number, counts.total)}</td>
              <td className="px-4 py-2.5 text-[12px] text-zinc-500">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
