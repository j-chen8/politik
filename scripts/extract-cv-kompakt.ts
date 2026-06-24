/**
 * CV-Kompakt-Extraktion via Anthropic Message Batches API (Haiku 4.5).
 *
 * Zweck: Aus dem narrativen `cv_json` zwei SAUBERE Kompakt-Karten-Felder
 * normalisieren, die sich heuristisch nicht zuverlässig ableiten lassen:
 *   - hoechster_abschluss : höchster Bildungsgrad + Fach (z. B. "Dr. phil.,
 *                           Politikwissenschaft" / "Studium Jura (Staatsexamen)")
 *   - praegender_beruf    : der definierende NICHT-politische Beruf (z. B.
 *                           "Journalistin", "Rechtsanwalt"); null wenn keiner
 *   - beruf_status        : 'vorhanden' | 'keiner' (Karriere begann in der Politik)
 *
 * Strikt neutral: reine Faktnormalisierung, keine Wertung. Ergebnis landet in
 * Tabelle `cv_kompakt` (idempotent). getPoliticianKompakt liest sie bevorzugt,
 * Heuristik bleibt Fallback.
 *
 * Nutzung:
 *   npx tsx scripts/extract-cv-kompakt.ts            # Kosten-Vorschau, NICHT eingereicht
 *   npx tsx scripts/extract-cv-kompakt.ts --dry-run  # zusätzlich Beispiel-Request
 *   npx tsx scripts/extract-cv-kompakt.ts --submit   # tatsächlich submitten
 *   npx tsx scripts/extract-cv-kompakt.ts --poll <id># Batch retrieven + ingestieren
 *   --force  ignoriert vorhandene LLM-Ergebnisse (Re-Run); manuelle Web-Korrekturen
 *            (prompt_version 'manual%') bleiben dabei IMMER erhalten.
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

// .env laden (gleiches Muster wie run-drucksachen-batch.ts)
const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }

const MODEL = "claude-haiku-4-5-20251001";
const PROMPT_VERSION = "cv-kompakt-v2-bio";

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const SUBMIT = argv.includes("--submit");
const FORCE = argv.includes("--force");
const pollIdx = argv.indexOf("--poll");
const POLL_ID = pollIdx >= 0 ? argv[pollIdx + 1] : null;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS cv_kompakt (
    politician_id INTEGER PRIMARY KEY,
    hoechster_abschluss TEXT,
    praegender_beruf TEXT,
    beruf_status TEXT,
    beruf_kategorie TEXT,
    model TEXT,
    prompt_version TEXT,
    generated_at TEXT,
    raw_llm_response TEXT,
    error TEXT
  )
`);

const SYSTEM_PROMPT = `Du normalisierst deutsche Politiker-Lebensläufe in zwei knappe, sachliche Kartenfelder. Streng neutral: nur Fakten aus dem Lebenslauf umformen, KEINE Wertung, keine Interpretation, nichts erfinden.

Aus dem folgenden Biografie-Text (offizielle Bundestags-Bio oder Wikipedia) und dem Namenstitel ableiten. Ignoriere Platzhalter wie "<UNKNOWN>". Erfinde nichts — aber wenn der Text einen Beruf/eine Berufstätigkeit nennt (auch angestellte Tätigkeit, Referendariat, wissenschaftliche:r Mitarbeiter:in), nutze ihn:

1) hoechster_abschluss: der HÖCHSTE Bildungsabschluss mit Fach, kompakt.
   - Promotion → "Dr. <Zusatz>, <Fach>" (z. B. "Dr. phil., Politikwissenschaft"). Titel "Dr."/"Prof." bestätigt eine Promotion auch ohne expliziten Eintrag.
   - sonst Studium/Magister/Diplom/Staatsexamen/Master → "<Abschluss>, <Fach>" oder "Studium <Fach>".
   - sonst Ausbildung/Lehre → "Ausbildung <Beruf>".
   - höchstens Abitur/keine Angabe → null.
   - Maximal ~70 Zeichen, kein ganzer Satz.

2) praegender_beruf: der prägende NICHT-politische Beruf der Person (das, als was sie vor/außerhalb der Politik gearbeitet hat und bekannt ist), kurz und in normalisierter Form (z. B. "Journalistin", "Rechtsanwalt", "Ärztin", "Landwirt").
   - Mehrere Jobs → den definierenden/längsten/bekanntesten wählen, NICHT mechanisch den ersten oder letzten.
   - Mandate/Partei-/Fraktionsämter/Staatssekretär etc. zählen NICHT als Beruf.
   - Wenn die Person nie außerhalb der Politik gearbeitet hat (Karriere begann direkt in Partei/Mandat) → null.
   - Maximal ~50 Zeichen.

3) beruf_status: "vorhanden" wenn praegender_beruf gesetzt ist; "keiner" wenn die Person sicher keinen nicht-politischen Beruf hatte. Im Zweifel (zu wenig Information) trotzdem "keiner" nur wählen, wenn der Lebenslauf einen klaren Politik-Direkteinstieg zeigt — sonst praegender_beruf aus der Ausbildung ableiten, falls dort ein eindeutiger Beruf steht (z. B. Ausbildung zur Ärztin und keine andere Tätigkeit → "Ärztin").

4) beruf_kategorie: ordne den praegenden Beruf EINER der folgenden Kategorien zu (exakt eine, exakte Schreibweise): "Recht", "Wirtschaft & Management", "Wissenschaft & Bildung", "Medizin & Gesundheit", "Öffentlicher Dienst & Verwaltung", "Medien & Kommunikation", "Technik & Ingenieurwesen", "Handwerk & Landwirtschaft", "Soziales & Gemeinnützig", "Sonstiges". Wenn beruf_status="keiner" (kein nicht-politischer Beruf), dann beruf_kategorie = null.`;

const TOOL = {
  name: "cv_kompakt",
  description: "Gibt die normalisierten Kompakt-Karten-Felder zurück.",
  input_schema: {
    type: "object" as const,
    properties: {
      hoechster_abschluss: {
        type: ["string", "null"],
        description: "Höchster Bildungsabschluss + Fach, kompakt, oder null.",
      },
      praegender_beruf: {
        type: ["string", "null"],
        description: "Prägender nicht-politischer Beruf, kurz normalisiert, oder null.",
      },
      beruf_status: {
        type: "string",
        enum: ["vorhanden", "keiner"],
        description: "'vorhanden' wenn Beruf gesetzt; 'keiner' bei Politik-Direkteinstieg.",
      },
      beruf_kategorie: {
        type: ["string", "null"],
        enum: [
          "Recht", "Wirtschaft & Management", "Wissenschaft & Bildung",
          "Medizin & Gesundheit", "Öffentlicher Dienst & Verwaltung",
          "Medien & Kommunikation", "Technik & Ingenieurwesen",
          "Handwerk & Landwirtschaft", "Soziales & Gemeinnützig", "Sonstiges", null,
        ],
        description: "Sektor des prägenden Berufs (genau einer); null wenn beruf_status='keiner'.",
      },
    },
    required: ["hoechster_abschluss", "praegender_beruf", "beruf_status", "beruf_kategorie"],
  },
};

interface Row {
  id: number;
  cv: string;
  title: string | null;
  name: string;
}

function selectTodos(): Row[] {
  // Manuell web-recherchierte Korrekturen (prompt_version 'manual%') NIE überschreiben,
  // auch nicht bei --force. Ohne --force ohnehin nur Politiker ohne jede Zeile.
  const idem = FORCE
    ? "AND (k.politician_id IS NULL OR k.prompt_version NOT LIKE 'manual%')"
    : "AND k.politician_id IS NULL";
  return db
    .prepare(
      `SELECT p.id, COALESCE(p.bundestag_bio_text, p.bio_full_text) AS cv, p.title,
              p.first_name || ' ' || p.last_name AS name
       FROM politicians p
       LEFT JOIN cv_kompakt k ON k.politician_id = p.id AND k.error IS NULL
       WHERE COALESCE(p.bundestag_bio_text, p.bio_full_text) IS NOT NULL
         AND length(COALESCE(p.bundestag_bio_text, p.bio_full_text)) > 100 ${idem}`,
    )
    .all() as Row[];
}

function buildRequest(row: Row) {
  // Wikipedia-Volltexte können lang sein; Beruf/Ausbildung stehen früh → kappen.
  const bio = (row.cv ?? "").slice(0, 4000);
  const user = `Biografie-Text:\n${bio}\n\nNamenstitel: ${row.title ?? "—"}`;
  return {
    custom_id: `pol-${row.id}`,
    params: {
      model: MODEL,
      max_tokens: 300,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [{ ...TOOL, cache_control: { type: "ephemeral" } }],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: user }],
    },
  };
}

async function pollAndIngest(batchId: string) {
  let counts;
  for (;;) {
    const status = await client.messages.batches.retrieve(batchId);
    counts = status.request_counts;
    console.log(
      `[${new Date().toLocaleTimeString()}] ${status.processing_status} — ok ${counts.succeeded} / err ${counts.errored} / läuft ${counts.processing}`,
    );
    if (status.processing_status === "ended") break;
    await new Promise((r) => setTimeout(r, 30_000));
  }

  const upsert = db.prepare(
    `INSERT INTO cv_kompakt (politician_id, hoechster_abschluss, praegender_beruf, beruf_status, beruf_kategorie, model, prompt_version, generated_at, raw_llm_response, error)
     VALUES (@pid, @abschluss, @beruf, @status, @kat, @model, @pv, @ts, @raw, @err)
     ON CONFLICT(politician_id) DO UPDATE SET
       hoechster_abschluss=@abschluss, praegender_beruf=@beruf, beruf_status=@status,
       beruf_kategorie=@kat, model=@model, prompt_version=@pv, generated_at=@ts,
       raw_llm_response=@raw, error=@err`,
  );

  const stream = await client.messages.batches.results(batchId);
  let ok = 0;
  let err = 0;
  for await (const res of stream) {
    const pid = parseInt(res.custom_id.replace("pol-", ""), 10);
    const ts = new Date().toISOString();
    if (res.result.type !== "succeeded") {
      upsert.run({ pid, abschluss: null, beruf: null, status: null, kat: null, model: MODEL, pv: PROMPT_VERSION, ts, raw: null, err: res.result.type });
      err++;
      continue;
    }
    const block = res.result.message.content.find((c: any) => c.type === "tool_use") as any;
    const inp = block?.input ?? {};
    upsert.run({
      pid,
      abschluss: inp.hoechster_abschluss ?? null,
      beruf: inp.praegender_beruf ?? null,
      status: inp.beruf_status ?? null,
      kat: inp.beruf_kategorie ?? null,
      model: MODEL,
      pv: PROMPT_VERSION,
      ts,
      raw: JSON.stringify(inp),
      err: null,
    });
    ok++;
  }
  console.log(`✓ Ingestiert: ${ok} ok, ${err} Fehler.`);
}

async function main() {
  if (POLL_ID) {
    await pollAndIngest(POLL_ID);
    return;
  }

  const rows = selectTodos();
  const tokens = rows.reduce((s, r) => s + Math.ceil(Math.min(r.cv?.length ?? 0, 4000) / 4), 0);
  const sysTokens = Math.ceil(SYSTEM_PROMPT.length / 4);
  const inM = tokens / 1e6;
  // Haiku 4.5 Batch + Caching: ~$0.30/M Input (geblendet, wie run-drucksachen-batch),
  // Output ist hier winzig (~60 Tok/Req @ ~$2.50/M Batch).
  const outCost = ((rows.length * 60) / 1e6) * 2.5;
  const cost = inM * 0.3 + outCost;

  console.log(`📋 ${rows.length} Profile mit cv_json zu extrahieren`);
  console.log(`   System-Prompt ~${sysTokens} Tok (pro Request gecached)`);
  console.log(`   Input gesamt: ~${(tokens / 1e6).toFixed(2)} M Tokens (CV-Texte)`);
  console.log(`   Output: ~${rows.length * 60} Tok (2 kurze Felder/Req)`);
  console.log(`\n💶 Geschätzte Kosten (Haiku 4.5 Batch + Caching): ~$${cost.toFixed(2)}`);

  if (rows.length === 0) {
    console.log(`\nNichts zu tun (alle bereits extrahiert; --force für Re-Run).`);
    return;
  }

  if (DRY_RUN) {
    console.log(`\n--dry-run: kein API-Call. Beispiel-Request:`);
    console.log(JSON.stringify(buildRequest(rows[0]), null, 2).slice(0, 1800) + "\n…");
    return;
  }

  if (!SUBMIT) {
    console.log(`\nNICHT eingereicht. Zum Einreichen: npx tsx scripts/extract-cv-kompakt.ts --submit`);
    return;
  }

  console.log(`\n📤 ${rows.length} Requests an Anthropic Batch API …`);
  const batch = await client.messages.batches.create({ requests: rows.map(buildRequest) as any });
  console.log(`✓ Batch eingereicht. ID: ${batch.id}, Status: ${batch.processing_status}`);
  console.log(`Retrieve: npx tsx scripts/extract-cv-kompakt.ts --poll ${batch.id}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
