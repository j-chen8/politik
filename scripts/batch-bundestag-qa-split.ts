/**
 * Phase C: Bundestag Kleine/Große Anfrage — Antwort-Dokumente auf Berlin-Q&A-
 * Schema heben. Pro Antwort-Doc (batch_class=antwort, mit referenced_drucksache_nr)
 * extrahiert Haiku getrennt: kerninhalt_frage[] + kerninhalt_antwort[] +
 * antwort_charakter (substantiell/teilantwortend/ausweichend). Schreibt NUR die
 * neuen Spalten in drucksache_analyses (bestehende Analyse unberührt).
 *
 * Aufruf:  --dry-run   Vorschau + Kosten, kein API-Call
 *          --submit     Batch einreichen, Batch-ID ausgeben
 *          --poll <id>  Ergebnisse abholen + in DB schreiben
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const ENV_PATH = path.join(process.cwd(), ".env");
for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
const MODEL = "claude-haiku-4-5-20251001";
const DB_PATH = "politik.db";
const MAX_CHARS = 520_000; // ~130K Tokens Sicherheits-Cap (Haiku-Kontext 200K)
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const SUBMIT = argv.includes("--submit");
const POLL = argv.includes("--poll") ? argv[argv.indexOf("--poll") + 1] : null;

const toCid = (nr: string) => "ds_" + nr.replace(/\//g, "_");
const fromCid = (cid: string) => cid.replace(/^ds_/, "").replace(/_/g, "/");

const SYSTEM = `Du analysierst eine Bundestags-Drucksache: die ANTWORT der Bundesregierung auf eine Kleine oder Große Anfrage (Fragen + Antworten sind im Text enthalten).

STRIKTE REGELN:
- Antworte ausschließlich auf Deutsch, nur über das Tool.
- Halte dich strikt an den Text. Erfinde nichts. Neutrale, faktenbasierte Sprache, KEINE bewertenden Adjektive.
- Zugeschriebene Sprache: "die Fraktion fragt", "die Bundesregierung antwortet, dass …".
- Bürger:innen sollen verstehen: WAS wurde gefragt, WIE hat die Bundesregierung geantwortet, ist die Antwort substanziell oder ausweichend.`;

const TOOL = {
  name: "analyse_anfrage_antwort",
  description: "Frage/Antwort-Analyse einer Bundestags-Anfrage-Antwort.",
  input_schema: {
    type: "object" as const,
    required: ["kerninhalt_frage", "kerninhalt_antwort", "antwort_charakter"],
    properties: {
      kerninhalt_frage: {
        type: "array", items: { type: "string" }, minItems: 1, maxItems: 6,
        description: 'JSON-Array von 1-6 Strings: die zentralen Fragen/Fragenbereiche, thematisch gruppiert. KEIN XML, KEINE Newlines im String.',
      },
      kerninhalt_antwort: {
        type: "array", items: { type: "string" }, minItems: 1, maxItems: 6,
        description: 'JSON-Array von 1-6 Strings: die konkrete Antwort-Substanz (Zahlen/Fakten oder Verweise/Datenlücken). KEIN XML.',
      },
      antwort_charakter: {
        type: "string", enum: ["substantiell", "teilantwortend", "ausweichend"],
        description: "substantiell = konkrete Zahlen/Fakten zu (fast) allen Fragen; teilantwortend = manche Fragen offen/verwiesen; ausweichend = v.a. Verweise/Geheimhaltung/Datenlücken.",
      },
    },
  },
};

function buildRequest(row: { drucksache_nr: string; full_text: string }) {
  const text = row.full_text.length > MAX_CHARS ? row.full_text.slice(0, MAX_CHARS) + "\n[…gekürzt…]" : row.full_text;
  return {
    custom_id: toCid(row.drucksache_nr),
    params: {
      model: MODEL,
      max_tokens: 1200,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [{ role: "user", content: `Drucksache ${row.drucksache_nr} (Antwort der Bundesregierung):\n\n${text}` }],
    },
  };
}

function selectRows(db: Database.Database) {
  return db.prepare(`
    SELECT t.drucksache_nr, t.full_text
    FROM drucksache_texts t
    WHERE t.batch_class='antwort' AND t.referenced_drucksache_nr IS NOT NULL
      AND t.drucksache_nr LIKE '21/%' AND t.full_text IS NOT NULL
    ORDER BY t.drucksache_nr
  `).all() as { drucksache_nr: string; full_text: string }[];
}

async function main() {
  const db = new Database(DB_PATH);
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  if (POLL) {
    const stream = await client.messages.batches.results(POLL);
    const upd = db.prepare(`UPDATE drucksache_analyses SET kerninhalt_frage_json=?, kerninhalt_antwort_json=?, antwort_charakter=? WHERE drucksache_nr=?`);
    let ok = 0, err = 0, noRow = 0;
    for await (const item of stream as any) {
      const nr = fromCid(item.custom_id);
      if (item.result?.type !== "succeeded") { err++; continue; }
      const block = item.result.message.content.find((c: any) => c.type === "tool_use");
      if (!block) { err++; continue; }
      const inp = block.input;
      const r = upd.run(JSON.stringify(inp.kerninhalt_frage ?? []), JSON.stringify(inp.kerninhalt_antwort ?? []), inp.antwort_charakter ?? null, nr);
      if (r.changes === 0) noRow++; else ok++;
    }
    console.log(`Retrieve: ok=${ok} err=${err} (kein drucksache_analyses-Row: ${noRow})`);
    db.close();
    return;
  }

  const rows = selectRows(db);
  const requests = rows.map(buildRequest);
  const inTok = rows.reduce((a, r) => a + Math.ceil(Math.min(r.full_text.length, MAX_CHARS) / 4), 0);
  console.log(`Docs: ${rows.length} | Input ~${(inTok/1e6).toFixed(2)}M Tok | Kosten ~$${(inTok/1e6*0.5 + rows.length*700/1e6*2.5).toFixed(2)} (Haiku Batch)`);

  if (DRY) {
    console.log("--dry-run. Beispiel-Request:");
    console.log(JSON.stringify(requests[0], null, 2).slice(0, 1200) + "\n…");
    db.close();
    return;
  }
  if (!SUBMIT) { console.log("Weder --dry-run noch --submit noch --poll. Abbruch."); db.close(); return; }

  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`✓ Batch eingereicht. ID: ${batch.id}  Status: ${batch.processing_status}`);
  console.log(`Poll:  npx tsx scripts/batch-bundestag-qa-split.ts --poll ${batch.id}`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
