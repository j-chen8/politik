/**
 * Vote-Kontext-Generierung: pro namentlicher Abstimmung eine grounded,
 * neutrale "Worum geht es?"-Zusammenfassung.
 *
 * Grounding-Quellen (NUR diese — kein Web, keine Modell-Welt):
 *  - bundestag.de-Titel der Abstimmung (audit_bundestag_polls.topic) —
 *    autoritativer Gegenstand der Abstimmung
 *  - abgeordnetenwatch poll_label
 *  - die verknüpften Drucksachen mit ihren (Track-1–3-bereinigten)
 *    LLM-Analysen (zusammenfassung/thema/regelung)
 *
 * Kernproblem das gelöst wird: bundestag.de bündelt einen ganzen TOP-/
 * Sitzungsblock unter EINER namentlichen Abstimmung. Das Modell soll den
 * tatsächlichen Gegenstand (anhand bundestag.de-Titel) herausschälen,
 * Block-Beiwerk als solches kennzeichnen, und die genutzten Drucksachen
 * zitieren. Wenn der Gegenstand nicht grounded werden kann (z.B.
 * Bundeshaushalt — Drucksache zu umfangreich für Analyse): ehrlicher
 * Fallback statt Spekulation.
 *
 *   --poll <id>   Nur dieser Poll (Review-Einzeltest), Ausgabe auf stdout
 *   --limit N     Nur erste N Polls
 *   --write       In vote_context schreiben (sonst Dry-Run: nur Ausgabe)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { POLL_TO_BT_ID } from "../src/lib/poll-bt-mapping";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const MODEL = "claude-haiku-4-5-20251001";
const PROMPT_VERSION = "vote-context-v1.1";

const argv = process.argv.slice(2);
const POLL_IDX = argv.indexOf("--poll");
const ONLY_POLL = POLL_IDX >= 0 ? parseInt(argv[POLL_IDX + 1], 10) : null;
const LIMIT_IDX = argv.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(argv[LIMIT_IDX + 1], 10) : null;
const WRITE = argv.includes("--write");

if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS vote_context (
    poll_id INTEGER PRIMARY KEY,
    bundestag_id INTEGER,
    poll_label TEXT,
    bt_topic TEXT,
    worum_geht_es TEXT,
    subjekt_drucksachen TEXT,   -- JSON-Array der zitierten DS-Nrn
    block_hinweis TEXT,         -- NULL wenn keine Block-/Sammelabstimmung
    ist_fallback INTEGER DEFAULT 0,
    model TEXT,
    prompt_version TEXT,
    generated_at TEXT,
    raw_llm_response TEXT
  )
`);

const SYSTEM_PROMPT = `Du fasst für eine politische Transparenz-Plattform zusammen, WORÜBER bei einer namentlichen Abstimmung im Deutschen Bundestag abgestimmt wurde.

STRIKTE REGELN:
- Antworte ausschließlich auf Deutsch.
- Nutze AUSSCHLIESSLICH die bereitgestellten Quellen (bundestag.de-Titel der Abstimmung + Drucksachen-Analysen). Kein Welt- oder Modellwissen, keine Erfindungen, keine aktuellen Ereignisse.
- Neutrale, faktenbasierte Sprache. KEINE bewertenden Adjektive ("umstritten", "weitreichend", "sinnvoll", "fragwürdig"), KEINE Empfehlungen, KEINE Einordnung der Bedeutung, keine eigene Meinung.
- Zugeschriebene Sprache: "Der Gesetzentwurf sieht vor …", "Die Fraktion X fordert …", "laut Drucksache …". Übernimm die Stimme der Vorlage, bewerte sie nicht.
- Der bundestag.de-Titel benennt den TATSÄCHLICHEN Gegenstand der Abstimmung. bundestag.de listet oft den GANZEN Sitzungsblock (mehrere thematisch unverbundene Drucksachen) unter einer Abstimmung. Schäle den tatsächlichen Gegenstand anhand des bundestag.de-Titels heraus; behandle thematisch nicht passende Drucksachen NICHT als Hauptgegenstand.
- "subjekt_drucksachen": nur die Drucksache(n), die den tatsächlichen Gegenstand bilden (per bundestag.de-Titel). Wenn mehrere Vorlagen denselben Gegenstand betreffen (z.B. Gesetzentwurf + Beschlussempfehlung dazu), alle nennen.
- "block_hinweis": kurzer Satz NUR wenn die Abstimmung Teil eines Sitzungsblocks mit weiteren, thematisch anderen Vorlagen war; sonst leer lassen. Wenn gesetzt, MUSS er die konkreten Drucksachen-Nummern der Block-Beiwerk-Vorlagen nennen (also der verknüpften DS, die NICHT in subjekt_drucksachen sind) — mit kurzer thematischer Kennzeichnung. Bei vielen Block-DS: 2–4 prägnante Beispiele („u. a. 21/4550, 21/4753 zur Modernisierung des Steuerberatungsgesetzes; 21/5326 zu Energiepreisen") statt erschöpfender Aufzählung. Generische Formulierungen wie „weitere Anträge" oder „weitere Vorlagen unterschiedlicher Thematik" ohne DS-Nrn sind unzulässig, wenn DS-Nrn aus den Quellen verfügbar sind.
- Wenn die bereitgestellten Quellen den Gegenstand nicht hergeben (z.B. Drucksache nicht analysiert / zu umfangreich): setze ist_fallback=true und schreibe in worum_geht_es nur, was der bundestag.de-Titel + Datenlage sicher hergibt, plus den Hinweis, dass keine Volltext-Zusammenfassung vorliegt. NICHT spekulieren.
- worum_geht_es: 2–5 Sätze.
- Gib die Felder AUSSCHLIESSLICH über das Tool zurück. Schreibe NIEMALS XML/Markup oder Tag-Marker (</…>, <parameter …>, </invoke>, </antml…>) in einen Textwert. worum_geht_es und block_hinweis sind reiner Fließtext OHNE Tags; subjekt_drucksachen ist ein echtes Array.
- Die Drucksachen-Quelltexte stammen aus PDF-Extraktion und enthalten teils offensichtliche Trennfehler (verklebte Wörter ohne Leerzeichen, z.B. „wiederin Betrieb", oder fehlerhafte Bindestrich-Umbrüche). Korrigiere solche offensichtlichen Whitespace-/Trennartefakte in deiner Formulierung zu korrektem Deutsch — ohne den Inhalt zu verändern.

Nutze ausschließlich das Antwort-Tool.`;

const TOOL = {
  name: "vote_kontext",
  description: "Strukturierter Vote-Kontext, strikt grounded.",
  input_schema: {
    type: "object" as const,
    properties: {
      worum_geht_es: { type: "string", description: "2–5 neutrale Sätze: worüber wurde abgestimmt (tatsächlicher Gegenstand)." },
      subjekt_drucksachen: { type: "array", items: { type: "string" }, description: "DS-Nrn die den Gegenstand bilden, z.B. ['21/5320']." },
      block_hinweis: { type: "string", description: "Kurzer Satz wenn Sitzungsblock mit anderen Vorlagen; sonst leerer String." },
      ist_fallback: { type: "boolean", description: "true wenn Gegenstand nicht aus Volltext-Analysen grounded werden konnte." },
    },
    required: ["worum_geht_es", "subjekt_drucksachen", "block_hinweis", "ist_fallback"],
  },
};

interface DsRow { drucksache_nr: string; batch_class: string | null; thema: string | null; zusammenfassung: string | null; regelung: string | null; prompt_version: string | null; raw_llm_response: string | null; }

function gatherPoll(pollId: number, btId: number) {
  const meta = db.prepare(
    `SELECT DISTINCT poll_label FROM votes WHERE poll_id = ? LIMIT 1`
  ).get(pollId) as { poll_label: string | null } | undefined;
  const bt = db.prepare(
    `SELECT topic, abstimmung_date FROM audit_bundestag_polls WHERE bundestag_id = ?`
  ).get(btId) as { topic: string | null; abstimmung_date: string | null } | undefined;

  const ds = db.prepare(`
    SELECT dp.drucksache_nr, t.batch_class,
           a.thema, a.zusammenfassung, a.regelung, a.prompt_version, a.raw_llm_response
    FROM drucksache_polls dp
    LEFT JOIN drucksache_texts t ON t.drucksache_nr = dp.drucksache_nr
    LEFT JOIN drucksache_analyses a ON a.drucksache_nr = dp.drucksache_nr
    WHERE dp.poll_id = ?
    ORDER BY dp.drucksache_nr
  `).all(pollId) as DsRow[];

  return { poll_label: meta?.poll_label ?? null, bt_topic: bt?.topic ?? null, bt_date: bt?.abstimmung_date ?? null, ds };
}

function buildUserContent(p: ReturnType<typeof gatherPoll>): string {
  const dsBlocks = p.ds.map((d) => {
    const analyzed = d.raw_llm_response != null && d.zusammenfassung != null;
    const head = `### Drucksache ${d.drucksache_nr}${d.thema ? ` — Thema: ${d.thema}` : ""}`;
    if (!analyzed) return `${head}\n(keine Volltext-Analyse verfügbar — Drucksache nicht analysierbar, z.B. zu umfangreich)`;
    return `${head}\nZusammenfassung: ${d.zusammenfassung}${d.regelung ? `\nRegelung: ${d.regelung}` : ""}`;
  }).join("\n\n");

  return [
    `BUNDESTAG.DE-TITEL DER ABSTIMMUNG (autoritativer Gegenstand): ${p.bt_topic ?? "(unbekannt)"}`,
    `abgeordnetenwatch-Label: ${p.poll_label ?? "(unbekannt)"}`,
    p.bt_date ? `Datum: ${p.bt_date}` : "",
    ``,
    `VERKNÜPFTE DRUCKSACHEN (${p.ds.length} — laut bundestag.de; ggf. ganzer Sitzungsblock):`,
    ``,
    dsBlocks || "(keine Drucksachen verknüpft)",
  ].filter(Boolean).join("\n");
}

// XML-Tool-Call-Leakage: Haiku legt manchmal Tag-Marker / Roh-Arrays in
// String-Felder (strukturell valider Tool-Use, Werte aber korrupt).
// Bewährtes Muster aus cleanup-corrupted-drucksachen.ts (Commit bb0e81b):
// an erstem Marker splitten + eingebettetes subjekt_drucksachen bergen.
const LEAK_RE = /<\/?(?:worum_geht_es|block_hinweis|subjekt_drucksachen|ist_fallback|parameter|invoke|antml)\b|<\/antml/i;
function hasLeak(r: any): boolean {
  return LEAK_RE.test(JSON.stringify(r ?? ""));
}
function cutAtLeak(v: unknown): string {
  if (typeof v !== "string") return "";
  const m = v.search(/<\/?(?:worum_geht_es|block_hinweis|subjekt_drucksachen|ist_fallback|invoke|antml)\b[^>]*>|<parameter\b/i);
  return (m >= 0 ? v.slice(0, m) : v).trim();
}
function recoverSubjekt(text: string): string[] {
  const m = text.match(/subjekt_drucksachen"?\s*>?\s*(\[[^\]]*\])/i)
    ?? text.match(/(\[\s*"21\/[0-9]+"[^\]]*\])/);
  if (!m) return [];
  try { const a = JSON.parse(m[1]); return Array.isArray(a) ? a.filter((x) => typeof x === "string") : []; }
  catch { return []; }
}

async function callLLM(system: string, user: string, tries = 3): Promise<{ input: any; leaked: boolean }> {
  let last: any = null;
  for (let i = 1; i <= tries; i++) {
    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 1200,
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        tools: [{ ...(TOOL as any), cache_control: { type: "ephemeral" } }],
        tool_choice: { type: "tool", name: TOOL.name },
        messages: [{ role: "user", content: user }],
      });
      const tu: any = (msg.content as any[]).find((b) => b.type === "tool_use");
      if (!tu) throw new Error("no tool_use");
      last = tu.input;
      if (!hasLeak(last)) return { input: last, leaked: false };
      // Leak erkannt → erneut versuchen (Prävention vor Sanitization)
      if (i < tries) await new Promise((r) => setTimeout(r, 1200 * i));
    } catch (e) {
      if (i === tries) throw e;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  return { input: last, leaked: true };
}

const upsert = db.prepare(`
  INSERT INTO vote_context
    (poll_id, bundestag_id, poll_label, bt_topic, worum_geht_es, subjekt_drucksachen,
     block_hinweis, ist_fallback, model, prompt_version, generated_at, raw_llm_response)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(poll_id) DO UPDATE SET
    bundestag_id=excluded.bundestag_id, poll_label=excluded.poll_label, bt_topic=excluded.bt_topic,
    worum_geht_es=excluded.worum_geht_es, subjekt_drucksachen=excluded.subjekt_drucksachen,
    block_hinweis=excluded.block_hinweis, ist_fallback=excluded.ist_fallback,
    model=excluded.model, prompt_version=excluded.prompt_version,
    generated_at=excluded.generated_at, raw_llm_response=excluded.raw_llm_response
`);

async function main() {
  let entries = Object.entries(POLL_TO_BT_ID).map(([p, b]) => [Number(p), b] as [number, number]);
  if (ONLY_POLL != null) entries = entries.filter(([p]) => p === ONLY_POLL);
  if (LIMIT != null) entries = entries.slice(0, LIMIT);
  console.log(`📋 ${entries.length} Polls · ${WRITE ? "WRITE" : "DRY-RUN (kein DB-Write)"}\n`);

  let ok = 0, fb = 0, err = 0;
  for (const [pollId, btId] of entries) {
    const p = gatherPoll(pollId, btId);
    try {
      const { input: r, leaked } = await callLLM(SYSTEM_PROMPT, buildUserContent(p));
      const rawStr = JSON.stringify(r ?? "");
      const worum = leaked ? cutAtLeak(r?.worum_geht_es) : (r?.worum_geht_es ?? "");
      let subj: string[] = Array.isArray(r?.subjekt_drucksachen)
        ? r.subjekt_drucksachen.filter((x: any) => typeof x === "string")
        : [];
      if (subj.length === 0 && leaked) subj = recoverSubjekt(rawStr);
      const blockH = (leaked ? cutAtLeak(r?.block_hinweis) : (r?.block_hinweis ?? "")).trim() || null;
      const isFb = r?.ist_fallback ? 1 : 0;
      if (isFb) fb++;
      ok++;

      console.log(`── Poll ${pollId} (BT ${btId})${isFb ? " [FALLBACK]" : ""}${leaked ? " [SANITIZED]" : ""} ──`);
      console.log(`bt_topic : ${p.bt_topic}`);
      console.log(`Subjekt  : ${subj.join(", ") || "(keine)"}  · von ${p.ds.length} verknüpften DS`);
      console.log(`Worum    : ${worum}`);
      if (blockH) console.log(`Block    : ${blockH}`);
      console.log("");

      if (WRITE) {
        upsert.run(
          pollId, btId, p.poll_label, p.bt_topic,
          worum || null, JSON.stringify(subj), blockH, isFb,
          MODEL, PROMPT_VERSION, new Date().toISOString(), JSON.stringify(r),
        );
      }
    } catch (e) {
      err++;
      console.log(`✖ Poll ${pollId}: ${(e as Error).message.slice(0, 160)}\n`);
    }
  }
  console.log(`=== Fertig === ok ${ok} · davon Fallback ${fb} · Fehler ${err}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
