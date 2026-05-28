/**
 * Batch-Version von generate-berlin-top-summaries.ts.
 * Submit + Poll + Retrieve in einem Lauf. 50 % Cost-Discount via Anthropic Batch API.
 *
 * Reuse: System-Prompt, Tool, buildUserMessage werden 1:1 kopiert aus dem
 * Live-Skript, um Drift zu vermeiden. Bei Prompt-Änderungen BEIDE updaten.
 *
 * Usage:
 *   npx tsx scripts/batch-berlin-top-summaries.ts --sitzung 85 --confirm
 *   npx tsx scripts/batch-berlin-top-summaries.ts --sitzung 85          (dry-run)
 *   npx tsx scripts/batch-berlin-top-summaries.ts --retrieve <batch_id>
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
const PROMPT_VERSION = "berlin-top-summary-v4-keyfacts";

const argv = process.argv.slice(2);
const SITZ_IDX = argv.indexOf("--sitzung");
const SITZUNG = SITZ_IDX >= 0 ? parseInt(argv[SITZ_IDX + 1], 10) : null;
const ALL = argv.includes("--all");
const RETRIEVE_IDX = argv.indexOf("--retrieve");
const RETRIEVE_BATCH = RETRIEVE_IDX >= 0 ? argv[RETRIEVE_IDX + 1] : null;
const CONFIRM = argv.includes("--confirm");
const FORCE = argv.includes("--force");

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY fehlt");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

const STATE_DIR = path.join(process.cwd(), "scripts/state");
if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });

// ── 1:1 aus generate-berlin-top-summaries.ts ──
const SYSTEM_PROMPT = `Du synthetisierst die Debatte zu EINEM Tagesordnungspunkt einer Plenarsitzung des Berliner Abgeordnetenhauses, als Lese-Hilfe für Bürger:innen + Journalist:innen, die keine Zeit haben alle Reden zu lesen.

STRIKTE INHALTS-REGELN:
- Antworte ausschließlich auf Deutsch.
- Nutze AUSSCHLIESSLICH die bereitgestellten Reden-Zusammenfassungen, konkreten Zahlen und Forderungen als Quellen. Kein Welt- oder Modellwissen, keine Erfindungen.
- Neutrale, faktenbasierte Sprache. KEINE bewertenden Adjektive ("umstritten", "weitreichend", "sinnvoll", "fragwürdig"), KEINE Empfehlungen, KEINE eigene Bewertung der Positionen.
- Zugeschriebene Sprache: "Die SPD-Fraktion fordert …", "Senator X erklärt …", "Die Opposition kritisiert, dass …". NIE eine Position als „die Wahrheit" framen.
- Fraktionen FAIR repräsentieren: wenn mehrere Fraktionen gesprochen haben, ALLE Kern-Positionen erwähnen.
- ANTI-DRIFT: Schreibe ausschließlich über DIESEN TOP. Nicht über andere TOPs der Sitzung generalisieren.
- Zahlen STETS MIT KONTEXT: "5.300 Polizeikräfte am 1. Mai 2026", nicht "5.300 Kräfte". Eine Zahl allein ist wertlos.
- Forderungen STETS MIT TRÄGER: "Die LINKE fordert Crowdmanagement-Verstärkung", nicht "Crowdmanagement-Verstärkung".
- Ausgangsmaterial sind LLM-Zusammenfassungen + Sub-Achsen pro Rede — können Tippfehler aus PDF-Extraktion enthalten. Korrigiere offensichtliche Schreibfehler.

AUSGABE-STRUKTUR — ein Feld via Tool.

**key_facts** (PFLICHT, Array aus 3–6 Objekten mit 'text' + 'refs'):

Pro Eintrag:
- **text**: EIN prägnanter Satz, ~150–250 Zeichen. Akteur + Fakt + ggf. Kontext-Zahl, verbunden mit Em-Dash ("—") oder Doppelpunkt. Muss OHNE Kenntnis der Debatte lesbar sein.
- **refs**: 1–3 Reden-Nummern (1-based, gemäß der nummerierten Liste im User-Prompt), die DIESEN Bullet am stärksten belegen.

LÄNGE/STIL — STRENG:
- EIN Satz pro Bullet, nicht drei. Wer Details will, klickt die Refs.
- Verdichten statt aufzählen: "Die SPD-Fraktion und Senatorin X verteidigen Y" statt "Die SPD-Fraktion X. Senatorin Y. Beide Z."
- Em-Dash-Pattern bevorzugen: "Fakt mit Akteur und Zahl — Konsequenz oder Kontrast."
- KEINE Mehrsatz-Bullets, die mehrere Themen kombinieren. Wenn Bullet zu lang würde: in zwei Bullets splitten (jedes ein klarer Punkt).
- KEINE Meta-Bullets wie "Die Debatte war umstritten." — immer konkret mit Akteur+Fakt.

ANZAHL — DYNAMISCH aber zurückhaltend:
- Einfacher TOP (klare Botschaft): 3 Bullets.
- Multi-Fraktion-Debatte mit klaren Konflikten: 4-5 Bullets.
- Multi-Themen-TOP (Fragestunde, Prioritäten, Sammel-TOP): 5-6 Bullets — je ein Bullet pro substanziellem Sub-Thema.
- Maximal 6. Lieber 5 verdichtete als 7 aufgeblähte.

BULLET 1 = wichtigstes Outcome / Hauptkonflikt ("Antrag der SPD angenommen mit Koalitions-Mehrheit, AfD und LINKE dagegen.").

REGELN für refs:
- 1–3 Reden, die den Bullet AM STÄRKSTEN tragen — nicht alle, die das Thema streifen.
- Mehrere Wortbeiträge desselben Sprechers zum selben Punkt: alle Indizes (z. B. refs=[6,7,8]).
- Konsens-Bullets: je 1 Beleg-Rede pro Fraktion.
- Refs müssen gültige Indizes (1 bis Anzahl Reden) sein.

BEISPIEL für die richtige Form (TOP "Aktuelle Stunde" zu 1. Mai-Bilanz):
[
  { "text": "Der 1. Mai 2026 verlief mit 5.300 Polizeikräften, 87 Festnahmen und 15 verletzten Polizeibeamten — die Koalition wertet das als Erfolg der Berliner Deeskalationsstrategie.", "refs": [1, 9] },
  { "text": "Die AfD widerspricht der Erfolgserzählung mit eigenen Zahlen: Strafverfahren stiegen von 39 (2024) auf 121 (2026) — eine Verdreifachung, die der Senat in seiner Bilanz nicht thematisiere.", "refs": [5] },
  { "text": "Müllbilanz: 350 Kubikmeter Hinterlassenschaften (fast doppelt so viel wie 2025) wurden von 170 BSR-Mitarbeitern eingesammelt — Senatorin Spranger appelliert an Feiernde, Verpackungen mitzunehmen.", "refs": [6, 9] },
  { "text": "GRÜNE und LINKE nutzen die Aktuelle Stunde für breitere Sozialkritik: LINKE-Sprecherin Eralp nennt Vonovias 1 Mrd. Euro Aktionärsausschüttung und fordert Wegners Ablösung.", "refs": [3, 4] },
  { "text": "Die AfD fordert in drei Wortbeiträgen Nulltoleranzpolitik, sofortige Bußgelder und restriktivere Auslegung des Versammlungsrechts — DJ-Pult-Partys sollten nicht mehr als politische Demonstration zählen.", "refs": [6, 7, 8] }
]

Beachte: 5 Bullets, jeder EIN Satz, Em-Dash-Pattern, refs konkret.

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

interface TopRow {
  marker: string;
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

function loadTops(sitzung: number): TopRow[] {
  const topRows = db.prepare(`
    SELECT top_marker, top_titel, MIN(start_line) AS first_line
    FROM berlin_speeches
    WHERE sitzung_nr = ?
      AND top_titel IS NOT NULL AND top_titel != ''
      AND top_marker IS NOT NULL AND top_marker != ''
    GROUP BY top_marker, top_titel
    ORDER BY first_line
  `).all(sitzung) as { top_marker: string; top_titel: string; first_line: number }[];

  return topRows.map((t) => {
    const reden = db.prepare(`
      SELECT bs.speaker_name,
             COALESCE(NULLIF(bs.speaker_party,''),
                      CASE WHEN pa.label LIKE 'BÜNDNIS%' THEN 'GRÜNE'
                           WHEN pa.label = 'Die Linke' THEN 'LINKE'
                           ELSE pa.label END) AS party,
             bsa.zusammenfassung_2_saetze AS zusammenfassung,
             bsa.konkrete_zahlen_json, bsa.forderungen_json
      FROM berlin_speeches bs
      LEFT JOIN berlin_speech_analyses bsa ON bsa.speech_id = bs.speech_id
      LEFT JOIN politicians p ON p.id = bs.politician_id
      LEFT JOIN parties pa ON pa.id = p.party_id
      WHERE bs.sitzung_nr=? AND bs.top_marker=? AND bs.top_titel=?
        AND bs.is_praesidium = 0
        AND bsa.zusammenfassung_2_saetze IS NOT NULL AND bsa.zusammenfassung_2_saetze != ''
      ORDER BY bs.order_in_session
    `).all(sitzung, t.top_marker, t.top_titel) as {
      speaker_name: string; party: string | null; zusammenfassung: string;
      konkrete_zahlen_json: string | null; forderungen_json: string | null;
    }[];
    return {
      marker: t.top_marker,
      titel: t.top_titel,
      reden: reden.map((r) => ({
        speaker: r.speaker_name, party: r.party, zusammenfassung: r.zusammenfassung,
        konkrete_zahlen: safeJsonArray(r.konkrete_zahlen_json),
        forderungen: safeJsonArray(r.forderungen_json),
      })),
    };
  });
}

function buildUserMessage(top: TopRow): string {
  const lines = [
    `Tagesordnungspunkt: TOP ${top.marker} – ${top.titel}`,
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

function customId(sitzung: number, marker: string): string {
  return `s${sitzung}-top-${marker}`.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 64);
}

function listSitzungenWithReden(): number[] {
  const rows = db.prepare(
    `SELECT DISTINCT bs.sitzung_nr AS nr FROM berlin_speeches bs
     JOIN berlin_pdf_texts t ON t.pdf_filename LIKE '%p19-' || printf('%03d', bs.sitzung_nr) || '-wp%'
     WHERE bs.sitzung_nr IS NOT NULL AND t.full_text IS NOT NULL
     ORDER BY bs.sitzung_nr`,
  ).all() as { nr: number }[];
  return rows.map((r) => r.nr);
}

async function submit() {
  if (SITZUNG === null && !ALL) { console.error("--sitzung <nr> oder --all erforderlich"); process.exit(1); }

  const sitzungen = ALL ? listSitzungenWithReden() : [SITZUNG!];
  console.log(`\n${sitzungen.length} Sitzung(en) zu verarbeiten`);

  // Skip TOPs die bereits v4-Synthesen haben (außer --force)
  let existing: { sitzung_nr: number; top_marker: string; top_titel: string }[] = [];
  if (!FORCE) {
    existing = db.prepare(
      `SELECT sitzung_nr, top_marker, top_titel FROM berlin_top_summaries
       WHERE prompt_version=? AND key_facts_json IS NOT NULL`,
    ).all(PROMPT_VERSION) as { sitzung_nr: number; top_marker: string; top_titel: string }[];
  }
  const skipSet = new Set(existing.map((e) => `${e.sitzung_nr}::${e.top_marker}::${e.top_titel}`));

  // Alle TOPs sammeln über alle Sitzungen
  type RequestWithMeta = {
    custom_id: string;
    sitzung_nr: number;
    top: TopRow;
    params: ReturnType<typeof buildParams>;
  };
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

  const allRequests: RequestWithMeta[] = [];
  for (const s of sitzungen) {
    const tops = loadTops(s).filter((t) => t.reden.length > 0);
    const todo = tops.filter((t) => !skipSet.has(`${s}::${t.marker}::${t.titel}`));
    for (const t of todo) {
      allRequests.push({
        custom_id: `s${s}-${customId(s, t.marker)}`,
        sitzung_nr: s,
        top: t,
        params: buildParams(t),
      });
    }
    if (todo.length > 0) console.log(`  Sitzung ${s}: ${todo.length}/${tops.length} TOPs (skip ${tops.length - todo.length} done)`);
  }

  console.log(`\nGesamt: ${allRequests.length} Requests aus ${sitzungen.length} Sitzungen`);
  if (allRequests.length === 0) { console.log("Nichts zu tun."); return; }

  const apiRequests = allRequests.map((r) => ({ custom_id: r.custom_id, params: r.params }));
  const payloadKb = (JSON.stringify(apiRequests).length / 1024).toFixed(1);
  console.log(`Payload: ${(parseInt(payloadKb) / 1024).toFixed(2)} MB`);

  if (!CONFIRM) {
    console.log(`\nDry-run — füge --confirm hinzu, um Batch zu submitten.`);
    return;
  }

  const t0 = Date.now();
  const batch = await client.messages.batches.create({ requests: apiRequests as any }); // eslint-disable-line @typescript-eslint/no-explicit-any
  console.log(`\n✓ batch_id: ${batch.id} · status: ${batch.processing_status} · ${Date.now() - t0}ms`);

  const stateFileName = ALL ? `top-summaries-all.json` : `top-summaries-s${SITZUNG}.json`;
  const stateFile = path.join(STATE_DIR, stateFileName);
  const state = {
    batch_id: batch.id,
    sitzung_nr: ALL ? "all" : SITZUNG,
    n_requests: allRequests.length,
    custom_ids: allRequests.map((r) => r.custom_id),
    top_keys: allRequests.map((r) => ({ sitzung_nr: r.sitzung_nr, marker: r.top.marker, titel: r.top.titel, reden_count: r.top.reden.length })),
    submitted_at: new Date().toISOString(),
    model: MODEL,
    prompt_version: PROMPT_VERSION,
  };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`State: ${stateFile}`);
  console.log(`\nRetrieve: npx tsx scripts/batch-berlin-top-summaries.ts --retrieve ${batch.id}`);
}

async function retrieve(batchId: string) {
  // Finde state-file
  const candidates = fs.readdirSync(STATE_DIR).filter((f) => f.startsWith("top-summaries-"));
  let state: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any
  let stateFile = "";
  for (const f of candidates) {
    const fp = path.join(STATE_DIR, f);
    const s = JSON.parse(fs.readFileSync(fp, "utf-8"));
    if (s.batch_id === batchId) { state = s; stateFile = fp; break; }
  }
  if (!state) { console.error(`Kein State-File für batch ${batchId} gefunden in ${STATE_DIR}`); process.exit(1); }

  console.log(`Polling batch ${batchId} (Sitzung ${state.sitzung_nr}, ${state.n_requests} requests)...`);

  let batch = await client.messages.batches.retrieve(batchId);
  while (batch.processing_status === "in_progress") {
    process.stdout.write(`  status=${batch.processing_status} ... (${batch.request_counts.processing} processing, ${batch.request_counts.succeeded} done)\r`);
    await new Promise((r) => setTimeout(r, 15000));
    batch = await client.messages.batches.retrieve(batchId);
  }
  console.log(`\n✓ status: ${batch.processing_status}`);
  console.log(`  succeeded=${batch.request_counts.succeeded} errored=${batch.request_counts.errored} canceled=${batch.request_counts.canceled}`);

  // custom_id → top_key. top_key kann sitzung_nr enthalten (Multi-Sitzungs-Batch)
  // ODER state.sitzung_nr ist global (Single-Sitzungs-Batch, legacy).
  const idToTop = new Map<string, { sitzung_nr: number; marker: string; titel: string; reden_count: number }>();
  for (let i = 0; i < state.custom_ids.length; i++) {
    const tk = state.top_keys[i];
    idToTop.set(state.custom_ids[i], {
      sitzung_nr: tk.sitzung_nr ?? state.sitzung_nr, // pro top_key oder globaler Fallback
      marker: tk.marker,
      titel: tk.titel,
      reden_count: tk.reden_count,
    });
  }

  let success = 0, fail = 0;
  let totalIn = 0, totalOut = 0;
  const insert = db.prepare(`
    INSERT OR REPLACE INTO berlin_top_summaries
      (sitzung_nr, top_marker, top_titel, zusammenfassung, lead, body, key_facts_json, reden_count, model, prompt_version, input_tokens, output_tokens)
    VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?)
  `);

  for await (const result of await client.messages.batches.results(batchId)) {
    const top = idToTop.get(result.custom_id);
    if (!top) { console.log(`  ! unknown custom_id ${result.custom_id}`); continue; }
    if (result.result.type !== "succeeded") {
      console.log(`  ✗ ${result.custom_id}: ${result.result.type}`);
      fail++; continue;
    }
    const msg = result.result.message;
    const toolUse = msg.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      console.log(`  ✗ ${result.custom_id}: no tool_use (stop=${msg.stop_reason})`);
      fail++; continue;
    }
    // LLM-Array-Drift: Haiku 4.5 schickt manchmal stringifiziertes JSON statt Array.
    // (siehe Memory: feedback-llm-array-drift, ~3% der Outputs)
    // Mehrstufiger Parse: direkt → typographische Quotes sanitisieren → fail
    let kfRaw: unknown = (toolUse.input as { key_facts?: unknown }).key_facts;
    if (typeof kfRaw === "string") {
      // Versuch 1: direkt parsen
      try { kfRaw = JSON.parse(kfRaw); } catch { /* fallthrough */ }
      // Versuch 2: typographische Quotes („…") sanitisieren, NBSP → space
      if (typeof kfRaw === "string") {
        const sanitized = (kfRaw as string)
          .replace(/[„""‚'']/g, '"')
          .replace(/[ ]/g, " ");
        try { kfRaw = JSON.parse(sanitized); } catch { /* fallthrough */ }
      }
      // Versuch 3: Strukturelle Extraktion. Haupt-Bruch ist eine unescaped ASCII-
      // Schluss-Quote im Text (z.B. „Notlösung" — dt. Öffner + ASCII-Schluss), die
      // den JSON-String vorzeitig terminiert. Wir ankern auf das rigide
      // {"text":"…","refs":[…]}-Schema und ziehen text+refs lazy bis zum
      // ","refs":-Boundary — immun gegen innere Quotes.
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
    if (!Array.isArray(kfRaw)) {
      const preview = typeof kfRaw === "string" ? (kfRaw as string).slice(0, 200) : "";
      console.log(`  ✗ ${result.custom_id}: empty/non-array key_facts (got ${typeof kfRaw}) len=${typeof kfRaw === "string" ? (kfRaw as string).length : 0}`);
      console.log(`     preview: ${preview}`);
      console.log(`     trailing: ${typeof kfRaw === "string" ? (kfRaw as string).slice(-200) : ""}`);
      fail++; continue;
    }
    const input = { key_facts: kfRaw as Array<{ text?: unknown; refs?: unknown }> };
    const keyFacts: { text: string; refs: number[] }[] = [];
    for (const raw of input.key_facts) {
      if (!raw || typeof raw !== "object") continue;
      const text = typeof (raw as any).text === "string" ? (raw as any).text.trim() : ""; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!text) continue;
      const refsRaw = Array.isArray((raw as any).refs) ? (raw as any).refs : []; // eslint-disable-line @typescript-eslint/no-explicit-any
      const refs: number[] = [];
      for (const r of refsRaw) {
        if (typeof r === "number" && Number.isInteger(r) && r >= 1 && r <= top.reden_count && !refs.includes(r)) refs.push(r);
      }
      keyFacts.push({ text, refs });
    }
    if (keyFacts.length === 0) { console.log(`  ✗ ${result.custom_id}: no valid key_facts`); fail++; continue; }

    insert.run(top.sitzung_nr, top.marker, top.titel, JSON.stringify(keyFacts), top.reden_count, MODEL, PROMPT_VERSION,
               msg.usage.input_tokens, msg.usage.output_tokens);
    totalIn += msg.usage.input_tokens;
    totalOut += msg.usage.output_tokens;
    console.log(`  ✓ ${result.custom_id} · ${keyFacts.length} key_facts (${msg.usage.input_tokens}↓ ${msg.usage.output_tokens}↑)`);
    success++;
  }

  // Batch-Preis = 50 % von Live. Haiku 4.5: $1/$5 per million → batch $0.5/$2.5
  const cost = (totalIn / 1_000_000) * 0.5 + (totalOut / 1_000_000) * 2.5;
  console.log(`\nFertig. ${success} success, ${fail} fail. ${totalIn}↓ + ${totalOut}↑ tokens = ~$${cost.toFixed(4)} (Batch-Preis)`);
  fs.writeFileSync(stateFile, JSON.stringify({ ...state, retrieved_at: new Date().toISOString(), success, fail, total_input_tokens: totalIn, total_output_tokens: totalOut }, null, 2));
}

if (RETRIEVE_BATCH) {
  retrieve(RETRIEVE_BATCH).catch((e) => { console.error(e); process.exit(1); });
} else {
  submit().catch((e) => { console.error(e); process.exit(1); });
}
