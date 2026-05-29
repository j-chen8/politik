/**
 * „Das Wichtigste"-Synthese pro Tagesordnungspunkt (Bundestag) via Anthropic
 * Batch API (50 % Discount). Adaptiert von batch-berlin-top-summaries.ts.
 *
 * Erzeugt key_facts (3–6 Bullets mit text + refs) pro TOP aus den 2-Satz-
 * Reden-Zusammenfassungen + Zahlen + Forderungen. Schreibt nach plenar_top_summaries.
 *
 * Lehren aus Berlin (übernommen):
 *  - Keine Zeichen-Limits im Prompt (Haiku kann nicht zählen) → max_tokens + Tool-Schema.
 *  - LLM-Array-Drift (~3 %): mehrstufiges Retrieve-Parsing (direkt → sanitize → Regex).
 *  - refs gegen reden_count validieren.
 *  - System-Prompt cachen (ephemeral) → günstigerer Input.
 *  - refs sind 1-based Indizes in die NUR-mit-Zusammenfassung-Reden in speech_index-Reihenfolge.
 *
 * Usage:
 *   npx tsx scripts/batch-bundestag-top-summaries.ts --sitzung 36            (dry-run)
 *   npx tsx scripts/batch-bundestag-top-summaries.ts --sitzung 36 --confirm
 *   npx tsx scripts/batch-bundestag-top-summaries.ts --all --confirm
 *   npx tsx scripts/batch-bundestag-top-summaries.ts --retrieve <batch_id>
 *   (--sample zeigt eine Beispiel-User-Message und beendet sich)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const MODEL = "claude-haiku-4-5-20251001";
const PROMPT_VERSION = "bt-top-summary-v1-keyfacts";

const argv = process.argv.slice(2);
const SITZ_IDX = argv.indexOf("--sitzung");
const SITZUNG = SITZ_IDX >= 0 ? parseInt(argv[SITZ_IDX + 1], 10) : null;
const ALL = argv.includes("--all");
const RETRIEVE_IDX = argv.indexOf("--retrieve");
const RETRIEVE_BATCH = RETRIEVE_IDX >= 0 ? argv[RETRIEVE_IDX + 1] : null;
const CONFIRM = argv.includes("--confirm");
const FORCE = argv.includes("--force");
const SAMPLE = argv.includes("--sample");

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS plenar_top_summaries (
    topic_id INTEGER PRIMARY KEY,
    sitzung_nr INTEGER,
    top_titel TEXT,
    key_facts_json TEXT,
    reden_count INTEGER,
    model TEXT,
    prompt_version TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    generated_at TEXT
  )
`);

const STATE_DIR = path.join(process.cwd(), "scripts/state");
if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });

// ── System-Prompt (adaptiert von Berlin v4-keyfacts) ──
const SYSTEM_PROMPT = `Du synthetisierst die Debatte zu EINEM Tagesordnungspunkt einer Plenarsitzung des Deutschen Bundestages, als Lese-Hilfe für Bürger:innen + Journalist:innen, die keine Zeit haben alle Reden zu lesen.

STRIKTE INHALTS-REGELN:
- Antworte ausschließlich auf Deutsch.
- Nutze AUSSCHLIESSLICH die bereitgestellten Reden-Zusammenfassungen, konkreten Zahlen und Forderungen als Quellen. Kein Welt- oder Modellwissen, keine Erfindungen.
- Neutrale, faktenbasierte Sprache. KEINE bewertenden Adjektive ("umstritten", "weitreichend", "sinnvoll", "fragwürdig"), KEINE Empfehlungen, KEINE eigene Bewertung der Positionen.
- Zugeschriebene Sprache: "Die SPD-Fraktion fordert …", "Ministerin X erklärt …", "Die Opposition kritisiert, dass …". NIE eine Position als „die Wahrheit" framen.
- Fraktionen FAIR repräsentieren: wenn mehrere Fraktionen gesprochen haben, ALLE Kern-Positionen erwähnen.
- ANTI-DRIFT: Schreibe ausschließlich über DIESEN TOP. Nicht über andere TOPs der Sitzung generalisieren.
- Zahlen STETS MIT KONTEXT: "12 Mrd. Euro für den Verkehrshaushalt 2026", nicht "12 Mrd. Euro". Eine Zahl allein ist wertlos.
- Forderungen STETS MIT TRÄGER: "Die Linke fordert einen Mietendeckel", nicht "Mietendeckel".
- Ausgangsmaterial sind LLM-Zusammenfassungen + Sub-Achsen pro Rede — können Tippfehler aus PDF-Extraktion enthalten. Korrigiere offensichtliche Schreibfehler.

AUSGABE-STRUKTUR — ein Feld via Tool.

**key_facts** (PFLICHT, Array aus 3–6 Objekten mit 'text' + 'refs'):

Pro Eintrag:
- **text**: EIN prägnanter Satz, ~150–250 Zeichen. Akteur + Fakt + ggf. Kontext-Zahl, verbunden mit Em-Dash ("—") oder Doppelpunkt. Muss OHNE Kenntnis der Debatte lesbar sein.
- **refs**: 1–3 Reden-Nummern (1-based, gemäß der nummerierten Liste im User-Prompt), die DIESEN Bullet am stärksten belegen.

LÄNGE/STIL — STRENG:
- EIN Satz pro Bullet, nicht drei. Wer Details will, klickt die Refs.
- Verdichten statt aufzählen: "Die SPD-Fraktion und Ministerin X verteidigen Y" statt "Die SPD-Fraktion X. Ministerin Y. Beide Z."
- Em-Dash-Pattern bevorzugen: "Fakt mit Akteur und Zahl — Konsequenz oder Kontrast."
- KEINE Mehrsatz-Bullets, die mehrere Themen kombinieren. Wenn Bullet zu lang würde: in zwei Bullets splitten (jedes ein klarer Punkt).
- KEINE Meta-Bullets wie "Die Debatte war kontrovers." — immer konkret mit Akteur+Fakt.

ANZAHL — DYNAMISCH aber zurückhaltend:
- Einfacher TOP (klare Botschaft): 3 Bullets.
- Multi-Fraktion-Debatte mit klaren Konflikten: 4-5 Bullets.
- Multi-Themen-TOP (Befragung, Aktuelle Stunde, Sammel-TOP): 5-6 Bullets — je ein Bullet pro substanziellem Sub-Thema.
- Maximal 6. Lieber 5 verdichtete als 7 aufgeblähte.

BULLET 1 = wichtigstes Outcome / Hauptkonflikt ("Gesetzentwurf der Bundesregierung angenommen mit Koalitionsmehrheit, AfD und Linke dagegen.").

REGELN für refs:
- 1–3 Reden, die den Bullet AM STÄRKSTEN tragen — nicht alle, die das Thema streifen.
- Mehrere Wortbeiträge desselben Sprechers zum selben Punkt: alle Indizes (z. B. refs=[6,7,8]).
- Konsens-Bullets: je 1 Beleg-Rede pro Fraktion.
- Refs müssen gültige Indizes (1 bis Anzahl Reden) sein.

Gib AUSSCHLIESSLICH über das Tool zurück.`;

const TOOL = {
  name: "synthesize_top",
  description: "Liefert eine TOP-Synthese als key_facts-Bullets mit Reden-Belegquellen.",
  input_schema: {
    type: "object",
    properties: {
      key_facts: {
        type: "array",
        minItems: 3,
        maxItems: 6,
        items: {
          type: "object",
          properties: {
            text: { type: "string", description: "Eigenständiger Fakt-Satz." },
            refs: {
              type: "array",
              items: { type: "integer", minimum: 1 },
              minItems: 1,
              maxItems: 3,
            },
          },
          required: ["text", "refs"],
        },
      },
    },
    required: ["key_facts"],
  },
} as const;

const PARTY_LABEL_SQL = `CASE
  WHEN s.party IS NOT NULL AND s.party != '' THEN s.party
  WHEN s.role LIKE 'Bundesminister%' OR s.role LIKE 'Bundeskanzler%'
    OR s.role LIKE 'Staatssekret%' OR s.role LIKE 'Staatsminister%'
    OR s.role LIKE 'Parl. Staatssekret%' THEN 'Bundesregierung'
  WHEN s.role LIKE '%Präsident%' OR s.role LIKE 'Vizepräsident%' THEN 'Präsidium'
  ELSE 'ohne Fraktion'
END`;

interface TopRow {
  topicId: number;
  sitzungNr: number;
  titel: string;
  reden: { speaker: string; party: string | null; zusammenfassung: string; konkrete_zahlen: string[]; forderungen: string[] }[];
}

function safeJsonArray(s: string | null): string[] {
  if (!s) return [];
  try {
    const p = JSON.parse(s);
    if (Array.isArray(p)) return p.filter((x) => typeof x === "string");
    if (typeof p === "string") {
      try { const i = JSON.parse(p); if (Array.isArray(i)) return i.filter((x) => typeof x === "string"); } catch {}
    }
    return [];
  } catch { return []; }
}

const redenStmt = db.prepare(`
  SELECT s.speaker, ${PARTY_LABEL_SQL} AS party,
         v2.zusammenfassung_2_saetze AS zusammenfassung,
         v2.konkrete_zahlen_json, v2.forderungen_json
  FROM plenar_speeches s
  JOIN speech_analyses_v2 v2 ON v2.speech_id = s.id
  WHERE s.topic_id = ?
    AND v2.zusammenfassung_2_saetze IS NOT NULL AND v2.zusammenfassung_2_saetze != ''
  ORDER BY s.speech_index, s.segment_index
`);

function loadTops(sitzung: number | null): TopRow[] {
  const where = sitzung === null ? "" : "AND s.sitzung = ?";
  const topicRows = db.prepare(`
    SELECT pt.id AS topic_id, pt.title AS titel, s.sitzung AS sitzung_nr
    FROM plenar_topics pt JOIN plenar_sessions s ON s.id = pt.session_id
    WHERE EXISTS (
      SELECT 1 FROM plenar_speeches ps JOIN speech_analyses_v2 v2 ON v2.speech_id = ps.id
      WHERE ps.topic_id = pt.id AND v2.zusammenfassung_2_saetze IS NOT NULL AND v2.zusammenfassung_2_saetze != ''
    ) ${where}
    ORDER BY s.sitzung, pt.id
  `).all(...(sitzung === null ? [] : [sitzung])) as { topic_id: number; titel: string; sitzung_nr: number }[];

  return topicRows.map((t) => {
    const reden = redenStmt.all(t.topic_id) as {
      speaker: string; party: string | null; zusammenfassung: string;
      konkrete_zahlen_json: string | null; forderungen_json: string | null;
    }[];
    return {
      topicId: t.topic_id,
      sitzungNr: t.sitzung_nr,
      titel: t.titel,
      reden: reden.map((r) => ({
        speaker: r.speaker, party: r.party, zusammenfassung: r.zusammenfassung,
        konkrete_zahlen: safeJsonArray(r.konkrete_zahlen_json),
        forderungen: safeJsonArray(r.forderungen_json),
      })),
    };
  }).filter((t) => t.reden.length > 0);
}

function buildUserMessage(top: TopRow): string {
  const lines = [
    `Tagesordnungspunkt: ${top.titel}`,
    `Anzahl Wortbeiträge: ${top.reden.length}`,
    "",
    "Reden (chronologisch). Pro Rede: 2-Satz-Zusammenfassung + konkrete Zahlen + Forderungen.",
    "",
  ];
  for (let i = 0; i < top.reden.length; i++) {
    const r = top.reden[i];
    const sl = r.party ? `${r.speaker} (${r.party})` : r.speaker;
    lines.push(`${i + 1}. ${sl}: ${r.zusammenfassung}`);
    if (r.konkrete_zahlen.length) lines.push(`   Zahlen: ${r.konkrete_zahlen.join(" | ")}`);
    if (r.forderungen.length) lines.push(`   Forderungen: ${r.forderungen.join(" | ")}`);
  }
  lines.push("");
  lines.push("Synthetisiere: 3-6 key_facts (EIN Satz, em-dash, refs). Alle Fraktionen fair.");
  return lines.join("\n");
}

function buildParams(t: TopRow) {
  return {
    model: MODEL,
    max_tokens: 4000,
    system: [{ type: "text" as const, text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" as const } }],
    tools: [TOOL] as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    tool_choice: { type: "tool" as const, name: TOOL.name },
    messages: [{ role: "user" as const, content: buildUserMessage(t) }],
  };
}

async function submit() {
  if (SITZUNG === null && !ALL) { console.error("--sitzung <nr> oder --all erforderlich"); process.exit(1); }
  const tops = loadTops(ALL ? null : SITZUNG);

  if (SAMPLE) {
    const t = tops.find((x) => x.reden.length >= 4) ?? tops[0];
    console.log(`\n=== SAMPLE User-Message (TOP ${t.topicId}, S${t.sitzungNr}, ${t.reden.length} Reden) ===\n`);
    console.log(buildUserMessage(t).slice(0, 1800));
    return;
  }

  // Skip TOPs die bereits eine Synthese haben (außer --force)
  let skipSet = new Set<number>();
  if (!FORCE) {
    const done = db.prepare(`SELECT topic_id FROM plenar_top_summaries WHERE key_facts_json IS NOT NULL AND prompt_version=?`).all(PROMPT_VERSION) as { topic_id: number }[];
    skipSet = new Set(done.map((d) => d.topic_id));
  }
  const todo = tops.filter((t) => !skipSet.has(t.topicId));

  const apiRequests = todo.map((t) => ({ custom_id: `bt-top-${t.topicId}`, params: buildParams(t) }));
  const payloadMb = (JSON.stringify(apiRequests).length / 1048576).toFixed(2);
  console.log(`\nTOPs gesamt: ${tops.length} · zu verarbeiten: ${todo.length} (skip ${tops.length - todo.length} done) · Payload ${payloadMb} MB`);
  if (todo.length === 0) { console.log("Nichts zu tun."); return; }

  if (!CONFIRM) { console.log(`\nDry-run — füge --confirm hinzu, um Batch zu submitten.`); return; }
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const batch = await client.messages.batches.create({ requests: apiRequests as any }); // eslint-disable-line @typescript-eslint/no-explicit-any
  console.log(`\n✓ batch_id: ${batch.id} · status: ${batch.processing_status}`);

  const stateFile = path.join(STATE_DIR, `bt-top-summaries-${ALL ? "all" : "s" + SITZUNG}.json`);
  fs.writeFileSync(stateFile, JSON.stringify({
    batch_id: batch.id, scope: ALL ? "all" : SITZUNG, n_requests: todo.length,
    topic_ids: todo.map((t) => t.topicId),
    reden_counts: Object.fromEntries(todo.map((t) => [t.topicId, t.reden.length])),
    submitted_at: new Date().toISOString(), model: MODEL, prompt_version: PROMPT_VERSION,
  }, null, 2));
  console.log(`State: ${stateFile}\nRetrieve: npx tsx scripts/batch-bundestag-top-summaries.ts --retrieve ${batch.id}`);
}

async function retrieve(batchId: string) {
  if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const candidates = fs.readdirSync(STATE_DIR).filter((f) => f.startsWith("bt-top-summaries-"));
  let state: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let stateFile = "";
  for (const f of candidates) {
    const s = JSON.parse(fs.readFileSync(path.join(STATE_DIR, f), "utf-8"));
    if (s.batch_id === batchId) { state = s; stateFile = path.join(STATE_DIR, f); break; }
  }
  if (!state) { console.error(`Kein State-File für batch ${batchId}`); process.exit(1); }
  const redenCounts: Record<string, number> = state.reden_counts ?? {};

  let batch = await client.messages.batches.retrieve(batchId);
  while (batch.processing_status === "in_progress") {
    process.stdout.write(`  ${batch.request_counts.processing} processing, ${batch.request_counts.succeeded} done\r`);
    await new Promise((r) => setTimeout(r, 15000));
    batch = await client.messages.batches.retrieve(batchId);
  }
  console.log(`\n✓ ${batch.processing_status}: succeeded=${batch.request_counts.succeeded} errored=${batch.request_counts.errored}`);

  const insert = db.prepare(`
    INSERT OR REPLACE INTO plenar_top_summaries
      (topic_id, sitzung_nr, top_titel, key_facts_json, reden_count, model, prompt_version, input_tokens, output_tokens, generated_at)
    VALUES (@topic_id, (SELECT s.sitzung FROM plenar_sessions s JOIN plenar_topics pt ON pt.session_id=s.id WHERE pt.id=@topic_id),
            (SELECT title FROM plenar_topics WHERE id=@topic_id), @kf, @rc, @model, @pv, @in, @out, @at)
  `);

  let success = 0, fail = 0, totalIn = 0, totalOut = 0;
  for await (const result of await client.messages.batches.results(batchId)) {
    const topicId = parseInt(result.custom_id.replace("bt-top-", ""), 10);
    const redenCount = redenCounts[topicId] ?? 999;
    if (result.result.type !== "succeeded") { console.log(`  ✗ ${result.custom_id}: ${result.result.type}`); fail++; continue; }
    const msg = result.result.message;
    const toolUse = msg.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") { console.log(`  ✗ ${result.custom_id}: no tool_use (stop=${msg.stop_reason})`); fail++; continue; }

    // LLM-Array-Drift: mehrstufiger Parse (direkt → sanitize → struktureller Regex)
    let kfRaw: unknown = (toolUse.input as { key_facts?: unknown }).key_facts;
    if (typeof kfRaw === "string") {
      try { kfRaw = JSON.parse(kfRaw); } catch { /* */ }
      if (typeof kfRaw === "string") {
        const san = (kfRaw as string).replace(/[„""‚'']/g, '"').replace(/[ ]/g, " ");
        try { kfRaw = JSON.parse(san); } catch { /* */ }
      }
      if (typeof kfRaw === "string") {
        const recovered: { text: string; refs: number[] }[] = [];
        const re = /"text"\s*:\s*"([\s\S]*?)"\s*,\s*"refs"\s*:\s*\[([0-9,\s]*)\]/g;
        let mm: RegExpExecArray | null;
        while ((mm = re.exec(kfRaw as string)) !== null) {
          const text = mm[1].trim();
          const refs = mm[2].split(",").map((x) => parseInt(x.trim(), 10)).filter((n) => Number.isInteger(n));
          if (text) recovered.push({ text, refs });
        }
        if (recovered.length > 0) kfRaw = recovered;
      }
    }
    if (!Array.isArray(kfRaw)) { console.log(`  ✗ ${result.custom_id}: non-array key_facts (${typeof kfRaw})`); fail++; continue; }

    const keyFacts: { text: string; refs: number[] }[] = [];
    for (const raw of kfRaw as Array<{ text?: unknown; refs?: unknown }>) {
      if (!raw || typeof raw !== "object") continue;
      const text = typeof raw.text === "string" ? raw.text.trim() : "";
      if (!text) continue;
      const refsRaw = Array.isArray(raw.refs) ? raw.refs : [];
      const refs: number[] = [];
      for (const r of refsRaw) {
        if (typeof r === "number" && Number.isInteger(r) && r >= 1 && r <= redenCount && !refs.includes(r)) refs.push(r);
      }
      keyFacts.push({ text, refs });
    }
    if (keyFacts.length === 0) { console.log(`  ✗ ${result.custom_id}: no valid key_facts`); fail++; continue; }

    insert.run({ topic_id: topicId, kf: JSON.stringify(keyFacts), rc: redenCount, model: MODEL, pv: PROMPT_VERSION,
                 in: msg.usage.input_tokens, out: msg.usage.output_tokens, at: new Date().toISOString() });
    totalIn += msg.usage.input_tokens; totalOut += msg.usage.output_tokens; success++;
  }
  const cost = (totalIn / 1e6) * 0.5 + (totalOut / 1e6) * 2.5;
  console.log(`\nFertig. ${success} success, ${fail} fail. ${totalIn}↓ + ${totalOut}↑ = ~$${cost.toFixed(4)} (Batch)`);
  if (stateFile) fs.writeFileSync(stateFile, JSON.stringify({ ...state, retrieved_at: new Date().toISOString(), success, fail, total_input_tokens: totalIn, total_output_tokens: totalOut }, null, 2));
}

if (RETRIEVE_BATCH) retrieve(RETRIEVE_BATCH).catch((e) => { console.error(e); process.exit(1); });
else submit().catch((e) => { console.error(e); process.exit(1); });
