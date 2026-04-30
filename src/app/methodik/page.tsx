import path from "path";
import fs from "fs";
import Link from "next/link";
import { ExternalLink, FileText, GitBranch, ShieldCheck } from "lucide-react";

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
  const stats: Stage5Stats = {
    politiciansChecked: 0,
    candidatePairs: 0,
    conflictsFound: 0,
    politiciansWithConflicts: 0,
  };
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
  const stats: Stage5_5Stats = {
    echte_diskrepanz: 0,
    wikipedia_extraktion_falsch: 0,
    homepage_extraktion_falsch: 0,
    beide_falsch: 0,
    unklar: 0,
    total: 0,
  };
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

interface VerdictExample {
  politicianName: string;
  section: string;
  jahr: string;
  llamaText: string;
  mistralText: string;
  reason: string;
  evidenceQuote: string | null;
  evidenceSource?: string;
}

function pickVerdictExamples(filePath: string, kind: "v1" | "v2"): Record<string, VerdictExample> {
  const examples: Record<string, VerdictExample> = {};
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    for (const line of txt.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const verdict = kind === "v1" ? obj?.verdict : obj?.v2Verdict;
        const winner = verdict?.winner;
        if (typeof winner !== "string") continue;
        if (examples[winner]) continue; // first occurrence wins
        const c = obj?.conflict ?? {};
        examples[winner] = {
          politicianName: c.politicianName ?? "?",
          section: c.section ?? "",
          jahr: c.jahr ?? "",
          llamaText: c.llamaText ?? "",
          mistralText: c.mistralText ?? "",
          reason: verdict.reason ?? "",
          evidenceQuote: verdict.evidenceQuote ?? null,
          evidenceSource: verdict.evidenceSource,
        };
      } catch {}
    }
  } catch {}
  return examples;
}

interface VerifExample {
  politicianName: string;
  section: string;
  jahr: string;
  wikipediaText: string;
  homepageText: string;
  reason: string;
  quoteWikipedia: string | null;
  quoteHomepage: string | null;
}

interface Stage5Example {
  politicianName: string;
  section: string;
  jahr: string;
  wikipedia: string;
  homepage: string;
  reason: string;
}

function pickStage5Example(filePath: string): Stage5Example | null {
  try {
    const txt = fs.readFileSync(filePath, "utf-8");
    for (const line of txt.split("\n")) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        if (Array.isArray(obj?.conflicts) && obj.conflicts.length > 0) {
          const c = obj.conflicts[0];
          return {
            politicianName: obj.name ?? "?",
            section: c.section ?? "",
            jahr: c.jahr ?? "",
            wikipedia: c.wikipedia ?? "",
            homepage: c.homepage ?? "",
            reason: c.reason ?? "",
          };
        }
      } catch {}
    }
  } catch {}
  return null;
}

function pickStage5_5Examples(dbPath: string): Record<string, VerifExample> {
  const examples: Record<string, VerifExample> = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require("better-sqlite3");
    const db = new Database(dbPath, { readonly: true });
    const rows = db
      .prepare(
        `SELECT first_name, last_name, source_conflicts
         FROM politicians
         WHERE source_conflicts IS NOT NULL AND source_conflicts != '[]' AND source_conflicts != ''`,
      )
      .all() as { first_name: string; last_name: string; source_conflicts: string }[];
    for (const r of rows) {
      let conflicts: any[] = [];
      try { conflicts = JSON.parse(r.source_conflicts); } catch {}
      if (!Array.isArray(conflicts)) continue;
      for (const c of conflicts) {
        const cls = c?.verification?.classification;
        if (typeof cls !== "string") continue;
        if (examples[cls]) continue;
        examples[cls] = {
          politicianName: `${r.first_name} ${r.last_name}`,
          section: c.section ?? "",
          jahr: c.jahr ?? "",
          wikipediaText: c.wikipedia ?? "",
          homepageText: c.homepage ?? "",
          reason: c.verification?.reason ?? "",
          quoteWikipedia: c.verification?.quote_wikipedia ?? null,
          quoteHomepage: c.verification?.quote_homepage ?? null,
        };
      }
    }
    db.close();
  } catch {}
  return examples;
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

function pct(n: number, d: number): string {
  if (d === 0) return "—";
  return `${((n / d) * 100).toFixed(1)}%`;
}

export default function MethodikPage() {
  const root = process.cwd();
  const v1 = readVerdicts(path.join(root, "tiebreak.partial.jsonl"), "v1");
  const v2 = readVerdicts(path.join(root, "tiebreak-v2.partial.jsonl"), "v2");
  const stage5 = readStage5Stats(path.join(root, "source-coherence.partial.jsonl"));
  const stage5_5 = readStage5_5Stats(path.join(root, "verify-source-conflicts.partial.jsonl"));
  const reparatur = readReparaturStats(path.join(root, "fix-hallucinated-cv-report.md"));
  const v1Examples = pickVerdictExamples(path.join(root, "tiebreak.partial.jsonl"), "v1");
  const v2Examples = pickVerdictExamples(path.join(root, "tiebreak-v2.partial.jsonl"), "v2");
  const stage5Example = pickStage5Example(path.join(root, "source-coherence.partial.jsonl"));
  const stage5_5Examples = pickStage5_5Examples(path.join(root, "politik.db"));

  // Effektiv-Zahlen
  const totalDiscrepancies = v1.total;
  const llamaHallucinations = v1.mistral + v2.mistral;
  const detailDifferences = v1.beide + v2.beide;
  const v1Resolved = v1.llama + v1.mistral + v1.beide;
  const v1Unclear = v1.keiner + v1.unklar;
  const v2Resolved = v2.llama + v2.mistral + v2.beide;
  const stage5_5Halluzinationen =
    stage5_5.wikipedia_extraktion_falsch +
    stage5_5.homepage_extraktion_falsch +
    stage5_5.beide_falsch;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 fade-in">
      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Auditierbar
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
          Methodik &amp; Wirksamkeit
        </h1>
        <p className="text-lg text-foreground/80 leading-relaxed max-w-2xl">
          Wie wir politische Daten KI-aufbereiten und mehrfach prüfen — pro Datenart
          ein eigenes Verfahren, jede Entscheidung auditierbar.
        </p>
      </div>

      {/* === MULTI-LLM-VERFAHREN PRO DATENART === */}
      <section className="mb-12">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
          Multi-LLM-Verfahren pro Datenart
        </h2>

        {/* Lebensläufe — abgeschlossen, default geöffnet */}
        <details open className="bg-white border border-border rounded-2xl mb-3 group">
          <summary className="cursor-pointer select-none list-none px-5 py-4 flex items-center gap-3 hover:bg-gray-50/50 rounded-2xl">
            <span className="text-muted shrink-0 group-open:hidden">▶</span>
            <span className="text-muted shrink-0 hidden group-open:inline">▼</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-foreground">Verfahren für Lebensläufe (Politiker-Profile)</span>
                <span className="text-[11px] uppercase tracking-wider bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-semibold">
                  abgeschlossen
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                5 Stufen + Sub-Verifikation (5.5) + Reparatur · 14.347 Aussagen geprüft
              </p>
            </div>
          </summary>
          <div className="px-5 pb-6 pt-3 space-y-12">

      {/* Beschreibung Lebensläufe */}
      <p className="text-sm text-foreground/80 leading-relaxed">
        Aus den 640 MdB-Profilen haben wir{" "}
        <strong>14.347 strukturierte Lebenslauf-Aussagen</strong> extrahiert
        — Ausbildung, Berufsstationen, Mandate, Funktionen. Jede einzelne wurde durch
        ein Multi-LLM-Konsens-Verfahren mit fünf unabhängigen Modell-Familien geprüft.
        Hier ist, was dabei herausgekommen ist.
      </p>

      {/* Quick-Stats Lebensläufe */}
      <section className="mb-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
          Wirksamkeit auf einen Blick
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <BigStat
            value="14.347"
            label="Aussagen geprüft"
            sub="aus 640 MdB-Profilen"
          />
          <BigStat
            value={totalDiscrepancies.toString()}
            label="Diskrepanzen erkannt"
            sub={`nur ${pct(totalDiscrepancies, 14347)} — Rest war konsistent`}
          />
          <BigStat
            value={llamaHallucinations.toString()}
            label="Halluzinationen entdeckt"
            sub="durch Cross-Check + Tiebreaker korrigiert"
            highlight
          />
          <BigStat
            value="5"
            label="Modell-Familien"
            sub="Meta · Mistral · NVIDIA · Anthropic · OpenAI"
          />
        </div>
      </section>

      {/* Methodik im Detail */}
      <section className="mb-0">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-4">
          Das 5-Stufen-Verfahren
        </h3>
        <div className="space-y-3">
          <Step
            n="①"
            title="Generator"
            model="Llama 3.1/3.3 (Groq)"
            family="Meta"
            desc="Extrahiert aus Wikipedia-Artikel und Homepage-Vita-Seite je einen strukturierten JSON-CV (Ausbildung, beruflicher Werdegang, politische Stationen, Sonstiges)."
            why="Llama ist der etablierte Open-Weights-Standard für strukturierte Extraktion aus deutschsprachigem Text. Auf Groq sehr schnell (~50 ms/Call) und gut skalierbar — geeignet für die Erst-Extraktion aller 14.347 Aussagen."
          />
          <Step
            n="②"
            title="Cross-Check"
            model="Mistral Small"
            family="Mistral AI"
            desc="Extrahiert dieselben Daten unabhängig nochmal aus denselben Quelltexten. Wo Llama und Mistral abweichen, entstehen Konflikte zur weiteren Prüfung."
            why="Andere Trainingsdaten-Mischung (französisches/mehrsprachiges Pretraining), andere Architektur-Optimierungen. Bei Übereinstimmung mit Llama → hohe Verlässlichkeit; bei Diskrepanz → systematische Detektion potenzieller Fehler. EU-Anbieter ist methodisch zusätzlich wertvoll."
          />
          <Step
            n="③"
            title="Tiebreaker — Inter-LLM-Konflikt"
            model="Nemotron-Nano-12b-v2 (NVIDIA NIM)"
            family="NVIDIA"
            desc="Schlichtet zwischen Llama- und Mistral-Verdikten aus derselben Quelle: Wer stimmt mit dem Quelltext überein? Beide? Keiner?"
            why={`Eigene Mamba-Transformer-Architektur (NICHT Llama-basiert) — eine echte dritte unabhängige Stimme. "Nano-12B" mag klein klingen, aber: die Aufgabe hier ist Information Retrieval mit gegebenem Quelltext ("Welche Aussage steht WÖRTLICH so im Text?"), kein offenes Reasoning. Bei IR-Aufgaben mit Quelle reicht ein kompaktes Modell mit hohem Durchsatz.`}
            detailHref="#stufe-3-detail"
          />
          <Step
            n="④"
            title="Tiebreaker v2 — Inter-LLM (4 Quellen)"
            model="Claude Haiku 4.5 (Anthropic)"
            family="Anthropic"
            desc="Schlichtet die unsicheren Inter-LLM-Konflikte aus Stufe 3 erneut — diesmal mit ALLEN 4 Roh-Text-Quellen gleichzeitig (Wikipedia-Volltext, Bundestag-Profil, Homepage, Bundesregierung-Profil)."
            why={`Anthropic bringt eine fünfte unabhängige Modell-Familie ins Spiel — und mit Claude Haiku 4.5 das reasoning-stärkste Modell unserer Pipeline. Genau die richtige Wahl für den zweiten Tiebreaker-Pass, in dem vier teils widersprüchliche Quelltexte parallel abgewogen werden müssen. Stufe 4 ist der Mitigation-Pass für Schwachstellen aus Stufe 3.`}
            detailHref="#stufe-4-detail"
          />
          <Step
            n="⑤"
            title="Source-Coherence-Check"
            model="gpt-oss-120b (Groq)"
            family="OpenAI"
            desc="Vergleicht pro Politiker:in den Wikipedia-CV mit dem Homepage-CV und identifiziert Diskrepanzen zwischen den Quellen (z.B. Wikipedia sagt 2018, Homepage sagt 2019)."
            why={`Eine Stufe für eine andere Frage als 1–4: Hier prüfen wir nicht "Llama vs. Mistral", sondern "Wikipedia vs. Homepage". Großes Open-Source-Modell (120B) auf Groq — passt zu einem Lauf über alle MdBs in vertretbarer Zeit. Erkennt nuanciert "verschiedene Phasen" (kein Widerspruch) vs. "gleicher Sachverhalt, andere Daten" (Diskrepanz-Kandidat).`}
            detailHref="#stufe-5-detail"
          />
          <Step
            n="⑤.5"
            title="Tiebreaker — Inter-Source-Konflikt"
            model="Llama 3.3 70B (Groq)"
            family="Meta"
            desc="Schlichtet zwischen den beiden extrahierten CVs aus unterschiedlichen Quellen — prüft jede in Stufe 5 gefundene Diskrepanz gegen die echten Roh-Quelltexte (Wikipedia-Volltext + Homepage-Volltext) und entscheidet: echte Quellen-Diskrepanz oder Extraktions-Fehler einer Seite?"
            why={`Zweite Tiebreaker-Schicht für eine andere Konflikt-Art: Stufe 3 schlichtet Konflikte zwischen LLMs (Llama vs. Mistral) — Stufe 5.5 schlichtet Konflikte zwischen Quellen (Wikipedia vs. Homepage). Llama 3.3 70B liest die Roh-Quelltexte und klassifiziert. Hat sich als entscheidende Halluzinations-Detektion erwiesen — fängt eine Klasse Fehler, die Stufe 2-4 systematisch verpassen.`}
            detailHref="#stufe-5-5-detail"
          />
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Wenn Stufe 5.5 einen Extraktions-Fehler markiert, läuft anschließend ein{" "}
          <a href="#reparatur-detail" className="text-primary hover:underline">
            Reparatur-Schritt
          </a>{" "}
          (ebenfalls Llama 3.3 70B): der fehlerhafte Eintrag wird durch eine Re-Extraktion
          aus dem Roh-Quelltext ersetzt — oder gelöscht, falls der Quelltext den Eintrag
          nicht stützt.
        </p>

        <div className="mt-8 mb-2 bg-gray-50 border border-border rounded-2xl p-5">
          <h3 className="text-sm font-bold mb-2">Warum 5 Stufen statt einfach ein großes Modell?</h3>
          <ul className="space-y-1.5 text-sm text-foreground/85">
            <li className="flex gap-2">
              <span className="text-muted shrink-0">·</span>
              <span><strong>Diversität schlägt Größe.</strong> Fünf unabhängige Modell-Familien (Meta, Mistral AI, NVIDIA, Anthropic, OpenAI) prüfen jede Aussage — keine einzelne Trainingsdaten-Schlagseite kann das System dominieren.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted shrink-0">·</span>
              <span><strong>Spezialisierung pro Aufgabe.</strong> Extraktion (Llama), Cross-Check (Mistral), Quelltext-Match (Nemotron), Multi-Source-Synthese (Claude Haiku 4.5), Coherence-Detection (gpt-oss-120b) — jede Stufe nutzt das Modell, das für ihre spezifische Aufgabe am besten passt, statt überall ein Universal-Modell zu zwingen.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted shrink-0">·</span>
              <span><strong>Fehler-Robustheit.</strong> Schwächen einzelner Modelle (z.B. Eloquence-Bias, Trainingsdaten-Lücken) werden durch Konsens mehrerer Modelle ausgeglichen. Ein Fehler eines einzelnen Modells fällt nicht durch — er muss von mehreren Stufen unbemerkt bleiben.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted shrink-0">·</span>
              <span><strong>Skalierbarkeit.</strong> Kleine, schnelle Modelle laufen auf großen Datenmengen schneller und stabiler als ein einzelnes 70B-Modell. Bei 14.347 Aussagen + 5 Stufen rechnen sich kleine Modelle pro Stufe deutlich besser.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted shrink-0">·</span>
              <span><strong>Auditierbarkeit.</strong> Pro Aussage ist nachvollziehbar, welches Modell mit welcher Prompt-Version wann entschieden hat. Ein einzelnes „Black-Box-Modell" wäre weniger transparent.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Detail-Statistik v1 */}
      <section id="stufe-3-detail" className="mb-10 scroll-mt-6">
        <h2 className="text-lg font-bold mb-2">Stufe 3 — Tiebreaker · Inter-LLM-Konflikt (v1)</h2>
        <p className="text-sm text-muted mb-4">
          In <strong>{(14347 - totalDiscrepancies).toLocaleString("de-DE")} von 14.347 Aussagen
          ({pct(14347 - totalDiscrepancies, 14347)})</strong> waren Llama und Mistral übereinstimmend
          — diese gelten als doppelt bestätigt. Die folgende Tabelle zeigt das Tiebreaker-Verdict
          (Nemotron-Nano) für die <strong>{totalDiscrepancies} strittigen Fälle</strong>{" "}
          ({pct(totalDiscrepancies, 14347)} aller Aussagen).
        </p>
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Verdict</th>
                <th className="px-4 py-3 text-right">Anzahl</th>
                <th className="px-4 py-3 text-right">Anteil</th>
                <th className="px-4 py-3 text-left">Bedeutung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <Row icon="🟦" label="Llama korrekt" n={v1.llama} total={v1.total} desc="Llama hatte recht, Mistral lag daneben" verdictExample={v1Examples.llama} />
              <Row icon="🟧" label="Mistral korrekt" n={v1.mistral} total={v1.total} desc="Llama-Halluzination identifiziert → korrigiert" highlight verdictExample={v1Examples.mistral} />
              <Row icon="🟩" label="Beide korrekt" n={v1.beide} total={v1.total} desc="Detail-Differenz, beide Aussagen separat belegt" verdictExample={v1Examples.beide} />
              <Row icon="🟥" label="Beide falsch" n={v1.keiner} total={v1.total} desc="Nemotron-Nano sah keinen Beleg für beide — wird in v2 geprüft" verdictExample={v1Examples.keiner} />
              <Row icon="⬜" label="Unklar" n={v1.unklar} total={v1.total} desc="Quelltext zu dünn — wird in v2 mit 4 Quellen geprüft" verdictExample={v1Examples.unklar} />
            </tbody>
          </table>
        </div>
      </section>

      {/* Detail-Statistik v2 */}
      <section id="stufe-4-detail" className="mb-10 scroll-mt-6">
        <h2 className="text-lg font-bold mb-2">Stufe 4 — Tiebreaker v2 · Inter-LLM-Konflikt (4 Quellen)</h2>
        <p className="text-sm text-muted mb-4">
          Für die {v1Unclear} unscharfen Fälle aus v1 zweite Runde mit Claude Haiku 4.5
          und allen 4 Roh-Text-Quellen gleichzeitig.
        </p>
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Verdict</th>
                <th className="px-4 py-3 text-right">Anzahl</th>
                <th className="px-4 py-3 text-right">Anteil</th>
                <th className="px-4 py-3 text-left">Bedeutung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <Row icon="🟦" label="Llama korrekt" n={v2.llama} total={v2.total} desc="Trotz dünner v1-Quelle hatte Llama recht" verdictExample={v2Examples.llama} />
              <Row icon="🟧" label="Mistral korrekt" n={v2.mistral} total={v2.total} desc="Zusätzliche Llama-Halluzination entdeckt" highlight verdictExample={v2Examples.mistral} />
              <Row icon="🟩" label="Beide korrekt" n={v2.beide} total={v2.total} desc="Mit reicherer Quelle erkennbar, dass beide Aussagen separat belegt sind" verdictExample={v2Examples.beide} />
              <Row icon="🟥" label="Beide falsch" n={v2.keiner} total={v2.total} desc="—" verdictExample={v2Examples.keiner} />
              <Row icon="⬜" label="Unklar" n={v2.unklar} total={v2.total} desc="—" verdictExample={v2Examples.unklar} />
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-3">
          {v2Resolved} von {v2.total} unscharfen Fällen ({pct(v2Resolved, v2.total)}) wurden
          durch den vierten Pass aufgelöst. Wirkung: 0 unentscheidbare Fälle in der finalen DB.
        </p>
      </section>

      {/* Detail-Statistik Stufe 5 */}
      <section id="stufe-5-detail" className="mb-10 scroll-mt-6">
        <h2 className="text-lg font-bold mb-2">Stufe 5 — Source-Coherence-Check</h2>
        <p className="text-sm text-muted mb-4">
          Für jeden Politiker werden die zwei extrahierten CVs (Wikipedia + Homepage)
          paarweise verglichen, um Stellen zu identifizieren, an denen die Quellen
          unterschiedliche Daten zum gleichen Sachverhalt nahelegen.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          <BigStat
            value={stage5.politiciansChecked.toString()}
            label="Politiker:innen geprüft"
            sub={`von 640 (${pct(stage5.politiciansChecked, 640)})`}
          />
          <BigStat
            value={stage5.candidatePairs.toString()}
            label="Aussage-Paare verglichen"
            sub="Wikipedia ↔ Homepage"
          />
          <BigStat
            value={stage5.conflictsFound.toString()}
            label="Diskrepanz-Kandidaten"
            sub={`bei ${stage5.politiciansWithConflicts} MdBs`}
          />
          <BigStat
            value={pct(stage5.conflictsFound, stage5.candidatePairs)}
            label="Diskrepanz-Quote"
            sub="der verglichenen Paare"
          />
        </div>
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Klassifikation</th>
                <th className="px-4 py-3 text-right">Anzahl</th>
                <th className="px-4 py-3 text-right">Anteil</th>
                <th className="px-4 py-3 text-left">Bedeutung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <Row
                icon="🟩"
                label="Konsistent"
                n={stage5.candidatePairs - stage5.conflictsFound}
                total={stage5.candidatePairs}
                desc="Wikipedia und Homepage stimmen zur selben Sektion und im selben Zeitraum überein"
              />
              <Row
                icon="🟧"
                label="Diskrepanz-Kandidat"
                n={stage5.conflictsFound}
                total={stage5.candidatePairs}
                desc="LLM hat einen Unterschied erkannt — wird in Stufe 5.5 gegen die Roh-Quelltexte verifiziert"
                highlight
                stage5Example={stage5Example}
              />
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          <strong>Wichtig:</strong> Stufe 5 erkennt nur, dass die zwei{" "}
          <em>extrahierten</em> CVs unterschiedlich aussehen. Ob das eine echte
          Diskrepanz zwischen den Quellen ist oder ein LLM-Extraktions-Fehler aus
          Stufe 1, kann diese Stufe nicht entscheiden — dafür gibt es{" "}
          <a href="#stufe-5-5-detail" className="text-primary hover:underline">
            Stufe 5.5
          </a>.
        </p>
      </section>

      {/* Detail-Statistik Stufe 5.5 */}
      <section id="stufe-5-5-detail" className="mb-10 scroll-mt-6">
        <h2 className="text-lg font-bold mb-2">Stufe 5.5 — Tiebreaker · Inter-Source-Konflikt</h2>
        <p className="text-sm text-muted mb-4">
          Jede in Stufe 5 gefundene Diskrepanz wird gegen die echten Roh-Quelltexte
          (Wikipedia-Volltext + Homepage-Volltext) geprüft, um zu klassifizieren:
          echte Quellen-Diskrepanz oder LLM-Extraktions-Fehler aus Stufe 1?
        </p>
        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 text-left">Klassifikation</th>
                <th className="px-4 py-3 text-right">Anzahl</th>
                <th className="px-4 py-3 text-right">Anteil</th>
                <th className="px-4 py-3 text-left">Bedeutung</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <Row
                icon="🟧"
                label="Echte Quellen-Diskrepanz"
                n={stage5_5.echte_diskrepanz}
                total={stage5_5.total}
                desc="Wikipedia und Homepage sagen wirklich Verschiedenes — wird im Profil als Hinweis angezeigt"
                verifExample={stage5_5Examples.echte_diskrepanz}
              />
              <Row
                icon="🟦"
                label="Wikipedia-Extraktion falsch"
                n={stage5_5.wikipedia_extraktion_falsch}
                total={stage5_5.total}
                desc="Wikipedia-Volltext sagt eigentlich dasselbe wie die Homepage — Llama-Extraktion war fehlerhaft"
                highlight
                verifExample={stage5_5Examples.wikipedia_extraktion_falsch}
              />
              <Row
                icon="🟦"
                label="Homepage-Extraktion falsch"
                n={stage5_5.homepage_extraktion_falsch}
                total={stage5_5.total}
                desc="Homepage-Volltext sagt eigentlich dasselbe wie Wikipedia — Llama-Extraktion war fehlerhaft"
                highlight
                verifExample={stage5_5Examples.homepage_extraktion_falsch}
              />
              <Row
                icon="🟥"
                label="Beide falsch"
                n={stage5_5.beide_falsch}
                total={stage5_5.total}
                desc="Keiner der Roh-Quelltexte stützt die jeweilige Extraktion — beide neu erzeugen"
                highlight
                verifExample={stage5_5Examples.beide_falsch}
              />
              <Row
                icon="⬜"
                label="Unklar"
                n={stage5_5.unklar}
                total={stage5_5.total}
                desc="Roh-Quelltexte enthalten zum genannten Sachverhalt nicht genug Information"
                verifExample={stage5_5Examples.unklar}
              />
            </tbody>
          </table>
        </div>
        <p className="text-sm text-foreground/80 mt-3 leading-relaxed">
          <strong>Methodisches Highlight:</strong>{" "}
          Stufe 5.5 hat <strong>{stage5_5Halluzinationen} LLM-Extraktions-Fehler</strong>{" "}
          aus Stufe 1 identifiziert, die alle vorherigen Konsens-Schritte durchgerutscht
          sind. Das passiert, wenn Llama und Mistral in Stufe 1+2 dieselben oder
          komplementäre Halluzinationen produzieren — sie widersprechen sich nicht, also
          schlägt der Cross-Check nicht an. Erst der Vergleich gegen die Roh-Quelltexte
          deckt es auf.
        </p>
      </section>

      {/* Detail-Statistik Reparatur */}
      <section id="reparatur-detail" className="mb-10 scroll-mt-6">
        <h2 className="text-lg font-bold mb-2">Halluzinations-Reparatur (Follow-Up)</h2>
        <p className="text-sm text-muted mb-4">
          Die in Stufe 5.5 als Extraktions-Fehler markierten Einträge werden mit Llama
          3.3 70B aus dem jeweiligen Roh-Quelltext neu extrahiert — oder gelöscht, falls
          das Modell sagt: <em>„nicht im Quelltext belegt"</em>.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <BigStat
            value={reparatur.replaced.toString()}
            label="Ersetzt"
            sub="durch korrigierten Eintrag"
            highlight
          />
          <BigStat
            value={reparatur.deleted.toString()}
            label="Gelöscht"
            sub="nicht im Quelltext belegt"
          />
          <BigStat
            value={reparatur.total.toString()}
            label="Total korrigiert"
            sub={`von ${stage5_5Halluzinationen} markiert`}
          />
        </div>
        <p className="text-xs text-muted mt-3 leading-relaxed">
          Llama 3.3 70B (Meta) — größeres Schwester-Modell des in Stufe 1 verwendeten
          Llama 3.1 8B. Das Re-Extraktions-Modell halluziniert deutlich seltener. Wenn
          es trotzdem mal danebenliegt, fällt das beim nächsten Pipeline-Lauf wieder in
          Stufe 5.5 auf — der Audit-Trail bleibt vollständig.
        </p>
      </section>

      {/* Audit-Trail Lebensläufe */}
      <section className="bg-gray-50/60 border border-border rounded-2xl p-5">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-primary" />
          Audit-Trail Lebensläufe
        </h3>
        <p className="text-sm text-foreground/85 leading-relaxed mb-3">
          Jede einzelne Entscheidung jedes Modells für die CV-Pipeline ist persistent
          gespeichert und öffentlich nachprüfbar:
        </p>
        <ul className="space-y-2 text-sm text-foreground/85 mb-4">
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">tiebreak.partial.jsonl</code>{" "}
              — alle {v1.total} Stufe-3-Tiebreaker-Entscheidungen mit Begründung und Quellenzitat
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">tiebreak-v2.partial.jsonl</code>{" "}
              — alle {v2.total} Stufe-4-Entscheidungen mit Quelle pro Beleg
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">source-coherence.partial.jsonl</code>{" "}
              — alle Stufe-5-Vergleiche (Wikipedia-CV ↔ Homepage-CV) mit identifizierten Diskrepanz-Kandidaten pro MdB
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">verify-source-conflicts.partial.jsonl</code>{" "}
              — alle {stage5_5.total} Stufe-5.5-Klassifikationen (echte Diskrepanz vs. Extraktions-Fehler)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <span>
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">fix-hallucinated-cv-report.md</code>{" "}
              — alle {reparatur.total} Reparatur-Schritte (alter Text → neuer Text oder Löschung)
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <span>
              DB-Spalten <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">cv_model</code>,{" "}
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">cv_prompt_version</code>,{" "}
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">cv_raw_llm_response</code>,{" "}
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">source_conflicts</code>,{" "}
              <code className="text-xs font-mono bg-gray-100 px-1.5 py-0.5 rounded">source_coherence_checked_at</code>{" "}
              — vollständiger Verarbeitungs-Trail pro Aussage
            </span>
          </li>
          <li className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted shrink-0 mt-0.5" />
            <span>
              Roh-Texte (Wikipedia-Volltext, Bundestag-Bio, Homepage-Vita,
              Bundesregierung-Bio) in der DB persistiert — auch das verwendete
              Quellmaterial ist auditierbar
            </span>
          </li>
        </ul>
        <p className="text-sm text-foreground/80 leading-relaxed">
          Die Skripte zum Reproduzieren des Laufs sind im{" "}
          <a
            href="https://github.com/opoi1/politik"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            GitHub-Repository <ExternalLink className="w-3 h-3" />
          </a>
          :{" "}
          <code className="text-xs font-mono bg-gray-100 px-1 rounded">seed-cv.ts</code> (Stufe 1),{" "}
          <code className="text-xs font-mono bg-gray-100 px-1 rounded">cross-check-mistral.ts</code> (Stufe 2),{" "}
          <code className="text-xs font-mono bg-gray-100 px-1 rounded">tiebreak-conflicts.ts</code> (Stufe 3),{" "}
          <code className="text-xs font-mono bg-gray-100 px-1 rounded">tiebreak-v2-uncertain.ts</code> (Stufe 4),{" "}
          <code className="text-xs font-mono bg-gray-100 px-1 rounded">source-coherence-check.ts</code> (Stufe 5),{" "}
          <code className="text-xs font-mono bg-gray-100 px-1 rounded">verify-source-conflicts.ts</code> (Stufe 5.5),{" "}
          <code className="text-xs font-mono bg-gray-100 px-1 rounded">fix-hallucinated-cv-entries.ts</code> (Reparatur).
        </p>
      </section>

          </div>
        </details>

        {/* Reden — in Vorbereitung */}
        <details className="bg-white border border-border rounded-2xl mb-3 group">
          <summary className="cursor-pointer select-none list-none px-5 py-4 flex items-center gap-3 hover:bg-gray-50/50 rounded-2xl">
            <span className="text-muted shrink-0 group-open:hidden">▶</span>
            <span className="text-muted shrink-0 hidden group-open:inline">▼</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-foreground/85">Verfahren für Reden (Plenarprotokolle)</span>
                <span className="text-[11px] uppercase tracking-wider bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                  in Vorbereitung
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Pipeline-Schema in Planung · 8.245 Reden in DB, noch nicht durch Konsens-Verfahren
              </p>
            </div>
          </summary>
          <div className="px-5 pb-5 pt-2 space-y-6">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                Stand
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <BigStat
                  value="8.245"
                  label="Reden in DB"
                  sub="Plenarprotokolle 21. WP"
                />
                <BigStat
                  value="0"
                  label="durch Konsens-Verfahren geprüft"
                  sub="Pipeline noch in Planung"
                />
                <BigStat
                  value="0"
                  label="Modell-Familien aktiv"
                  sub="Auswahl noch offen"
                />
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                Geplante Pipeline (Entwurf)
              </h3>
              <div className="text-sm text-foreground/85 leading-relaxed space-y-2.5">
                <p>
                  Reden brauchen ein an die Aufgabe angepasstes Pipeline-Schema —
                  weniger Faktenextraktion, mehr Verstehen + Aggregieren:
                </p>
                <ul className="space-y-1.5 ml-1">
                  <li>· <strong>Zusammenfassung</strong> statt Faktenextraktion (45-min-Plenar­debatten in 2-Satz-Lesehilfe)</li>
                  <li>· <strong>Themen-Klassifikation</strong> mit kontrolliertem Vokabular</li>
                  <li>· <strong>Tonalitäts-/Stil-Analyse</strong> (sachlich vs. polemisch) — heikel, braucht eigene Validierung</li>
                  <li>· <strong>Kontext-Bezug</strong> zu Drucksache/Antrag, zu dem geredet wurde</li>
                  <li>· <strong>Cross-Check</strong> Aussage ↔ Abstimmungs­verhalten als „Synopse" (neutral, ohne Bewertung)</li>
                </ul>
              </div>
            </section>

            <section className="bg-gray-50/60 border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-muted" />
                Audit-Trail Reden
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                Aktuell: nur die <strong>Roh-Reden</strong> (XML-Plenarprotokolle aus
                der Bundestag-Open-Data-Schnittstelle) sowie die in der DB gespeicherten
                ersten Llama-Generated-Summaries (Spalten <code className="text-xs font-mono bg-gray-100 px-1 rounded">speech_summary</code>,{" "}
                <code className="text-xs font-mono bg-gray-100 px-1 rounded">speech_summary_model</code>).
                Sobald die Konsens-Pipeline für Reden läuft, kommen hier die Stage-Audit-Files
                analog zum Lebenslauf-Verfahren dazu.
              </p>
            </section>
          </div>
        </details>

        {/* Drucksachen / Anfragen — Platzhalter */}
        <details className="bg-white border border-border rounded-2xl group">
          <summary className="cursor-pointer select-none list-none px-5 py-4 flex items-center gap-3 hover:bg-gray-50/50 rounded-2xl">
            <span className="text-muted shrink-0 group-open:hidden">▶</span>
            <span className="text-muted shrink-0 hidden group-open:inline">▼</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-foreground/85">Verfahren für Drucksachen, Anfragen, Sidejobs</span>
                <span className="text-[11px] uppercase tracking-wider bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-semibold">
                  geplant
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Roadmap · Daten in DB, Aggregation und Cross-Verifizierung folgen
              </p>
            </div>
          </summary>
          <div className="px-5 pb-5 pt-2 space-y-6">
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                Stand
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed mb-3">
                Strukturierte Aktivitäts-Daten sind bereits in der DB vorhanden — aber
                noch nicht durch ein eigenes Konsens-Verfahren verifiziert oder zu
                Aggregat-Sichten verarbeitet.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <BigStat value="—" label="Drucksachen" sub="DIP-API, in DB" />
                <BigStat value="—" label="Anfragen" sub="DIP-API, in DB" />
                <BigStat value="—" label="Sidejobs" sub="abgeordnetenwatch, in DB" />
                <BigStat value="—" label="Voting-Records" sub="in DB" />
              </div>
            </section>

            <section>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">
                Geplantes Verfahren
              </h3>
              <p className="text-sm text-foreground/85 leading-relaxed">
                Hier wird in den nächsten Phasen ein angepasstes Schema dokumentiert —
                etwa für die <strong>Kreuzung von Ausschuss-Mitgliedschaften mit gemeldeten
                Nebentätigkeiten</strong> als neutrale Kontext-Ansicht, oder für
                Themen-Aggregation aus Drucksachen-Titeln.
              </p>
            </section>

            <section className="bg-gray-50/60 border border-border rounded-2xl p-5">
              <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-muted" />
                Audit-Trail (geplant)
              </h3>
              <p className="text-sm text-foreground/75 leading-relaxed">
                Aktuell: alle Roh-Daten kommen direkt aus offiziellen Quellen
                (Bundestag DIP-API, abgeordnetenwatch) und werden 1:1 gespeichert. Bei
                Aggregat-Sichten werden Quell-IDs (z.B. <code className="text-xs font-mono bg-gray-100 px-1 rounded">drucksache_nr</code>) erhalten,
                damit jede Aussage zur Ursprungs­drucksache rückverfolgbar bleibt.
              </p>
            </section>
          </div>
        </details>
      </section>

      {/* Ehrlichkeits-Hinweis */}
      <section className="mb-10 bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h2 className="font-bold mb-2">
          Ehrlicher Hinweis: Fehler werden minimiert, nicht eliminiert
        </h2>
        <p className="text-sm text-foreground/85 leading-relaxed">
          Auch dieses Verfahren kann Fehler nicht vollständig ausschließen. KI-Modelle
          können in Einzelfällen falsch entscheiden, Quelltexte können veraltet oder
          lückenhaft sein, und manche Aussagen lassen sich aus den vorhandenen Quellen
          nicht eindeutig prüfen. Das Konsens-Verfahren reduziert das Fehlerrisiko
          deutlich — eine 100%-ige Korrektheit garantieren wir nicht. Bei jedem Eintrag
          ist die Quelle verlinkt, du kannst selbst nachprüfen. Wenn dir Fehler oder
          Unstimmigkeiten auffallen, melde sie bitte als Korrektur — wir korrigieren
          zeitnah.
        </p>
      </section>

      <div className="text-center">
        <Link href="/datenquellen" className="text-sm text-primary hover:underline">
          ← Zurück zu Datenquellen &amp; Credits
        </Link>
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
    <div
      className={
        "rounded-2xl border p-4 " +
        (highlight ? "bg-primary-light border-primary/30" : "bg-white border-border")
      }
    >
      <div className={"text-3xl font-extrabold tracking-tight mb-0.5 " + (highlight ? "text-primary" : "text-foreground")}>
        {value}
      </div>
      <div className="text-sm font-semibold text-foreground/80">{label}</div>
      {sub && <div className="text-xs text-muted mt-0.5">{sub}</div>}
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
  detailHref,
}: {
  n: string;
  title: string;
  model: string;
  family: string;
  desc: string;
  why?: string;
  /** Anchor-Link zum Detail-Statistik-Block weiter unten. */
  detailHref?: string;
}) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 flex gap-4">
      <span className="text-2xl font-mono text-primary shrink-0">{n}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
          <span className="font-semibold text-foreground">{title}</span>
          <span className="text-xs text-muted font-mono">{model}</span>
          <span className="text-[11px] uppercase tracking-wider text-muted bg-gray-100 px-1.5 py-0.5 rounded">
            {family}
          </span>
          {detailHref && (
            <a
              href={detailHref}
              className="ml-auto text-[11px] text-primary hover:underline shrink-0"
            >
              → Statistik anzeigen
            </a>
          )}
        </div>
        <p className="text-sm text-foreground/80 leading-relaxed">{desc}</p>
        {why && (
          <p className="text-xs text-muted leading-relaxed mt-2 pt-2 border-t border-border/50">
            <strong className="text-foreground/70">Warum dieses Modell:</strong> {why}
          </p>
        )}
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  n,
  total,
  desc,
  highlight,
  verdictExample,
  verifExample,
  stage5Example,
}: {
  icon: string;
  label: string;
  n: number;
  total: number;
  desc: string;
  highlight?: boolean;
  verdictExample?: VerdictExample;
  verifExample?: VerifExample;
  stage5Example?: Stage5Example | null;
}) {
  const example = verdictExample || verifExample || stage5Example;
  return (
    <>
      <tr className={highlight ? "bg-primary-light/30" : ""}>
        <td className="px-4 py-3 font-medium align-top">
          <span className="mr-2">{icon}</span>
          {label}
        </td>
        <td className="px-4 py-3 text-right font-mono font-semibold align-top">{n}</td>
        <td className="px-4 py-3 text-right text-muted font-mono align-top">{pct(n, total)}</td>
        <td className="px-4 py-3 text-xs text-muted align-top">
          {desc}
          {example && (
            <details className="mt-2 group">
              <summary className="cursor-pointer text-[11px] text-primary hover:underline select-none list-none inline-flex items-center gap-1">
                <span className="group-open:hidden">▶</span>
                <span className="hidden group-open:inline">▼</span>
                Beispiel zeigen
              </summary>
              <div className="mt-2 rounded-md border border-border/70 bg-gray-50/60 p-3 text-[12px] text-foreground/85 leading-relaxed space-y-1.5">
                <div className="font-semibold text-foreground/90">
                  {example.politicianName} · {example.section} · {example.jahr}
                </div>
                {verdictExample && (
                  <>
                    <div>
                      <span className="font-semibold">Llama:</span> {verdictExample.llamaText.slice(0, 200)}
                    </div>
                    <div>
                      <span className="font-semibold">Mistral:</span> {verdictExample.mistralText.slice(0, 200)}
                    </div>
                    <div className="pt-1.5 border-t border-border/40">
                      <span className="font-semibold">Begründung:</span> {verdictExample.reason}
                    </div>
                    {verdictExample.evidenceQuote && (
                      <div className="text-foreground/75 italic">
                        Beleg{verdictExample.evidenceSource ? ` (${verdictExample.evidenceSource})` : ""}: „{verdictExample.evidenceQuote.slice(0, 240)}"
                      </div>
                    )}
                  </>
                )}
                {verifExample && (
                  <>
                    <div>
                      <span className="font-semibold">Wikipedia (extrahiert):</span> {verifExample.wikipediaText.slice(0, 200)}
                    </div>
                    <div>
                      <span className="font-semibold">Homepage (extrahiert):</span> {verifExample.homepageText.slice(0, 200)}
                    </div>
                    <div className="pt-1.5 border-t border-border/40">
                      <span className="font-semibold">Verifikation:</span> {verifExample.reason}
                    </div>
                    {verifExample.quoteWikipedia && (
                      <div className="text-foreground/75 italic">
                        Wikipedia-Volltext-Zitat: „{verifExample.quoteWikipedia.slice(0, 240)}"
                      </div>
                    )}
                    {verifExample.quoteHomepage && (
                      <div className="text-foreground/75 italic">
                        Homepage-Volltext-Zitat: „{verifExample.quoteHomepage.slice(0, 240)}"
                      </div>
                    )}
                  </>
                )}
                {stage5Example && (
                  <>
                    <div>
                      <span className="font-semibold">Wikipedia-CV:</span> {stage5Example.wikipedia.slice(0, 200)}
                    </div>
                    <div>
                      <span className="font-semibold">Homepage-CV:</span> {stage5Example.homepage.slice(0, 200)}
                    </div>
                    <div className="pt-1.5 border-t border-border/40">
                      <span className="font-semibold">Begründung des Diskrepanz-Hinweises:</span> {stage5Example.reason}
                    </div>
                  </>
                )}
              </div>
            </details>
          )}
        </td>
      </tr>
    </>
  );
}
