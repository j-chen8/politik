/**
 * AUDIT: Präzision der Berlin-Unterthemen-Klassifikation (Großstichprobe).
 *
 * Zieht N zufällige klassifizierte Drucksachen und lässt jede Zuordnung von einem
 * UNABHÄNGIGEN, stärkeren Modell (Sonnet 4.6) beurteilen — NICHT Haiku, sonst
 * bewertet der Klassifikator sich selbst. Der Judge bekommt MEHR Kontext als der
 * Klassifikator hatte (zusammenfassung + kerninhalt), nicht weniger.
 *
 * Rubrik je Zuordnung (Politikfeld ⟫ Unterthema):
 *   korrekt   = trifft einen echten inhaltlichen Kern der DS
 *   grenzfall = vertretbar, aber benachbartes Feld/Unterthema wäre besser
 *   falsch    = trifft den Inhalt nicht
 * Zusätzlich: fehlt ein klares Feld komplett? (Recall-Signal)
 *
 *   --limit N     Stichprobengröße (Default 300)
 *   --seed S      deterministischer Sample-Offset (Default 0)
 *   --estimate    nur Kosten, kein API-Call
 *   --concurrency K  parallele Calls (Default 8)
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import Anthropic from "@anthropic-ai/sdk";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const MODEL = "claude-sonnet-4-6";
const argv = process.argv.slice(2);
const num = (flag: string, def: number) => { const i = argv.indexOf(flag); return i >= 0 ? parseInt(argv[i + 1], 10) : def; };
const LIMIT = num("--limit", 300);
const SEED = num("--seed", 0);
const CONC = num("--concurrency", 8);
const ESTIMATE = argv.includes("--estimate");
const SEP = " ⟫ ";

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

type DS = {
  dbid: string; klasse: string; derived_titel: string | null; zusammenfassung: string;
  thema_json: string | null; kerninhalt_json: string | null;
  kerninhalt_frage_json: string | null; kerninhalt_antwort_json: string | null;
};

// Deterministische "zufällige" Stichprobe: sortiere nach Hash(dbid), nimm Fenster ab SEED.
const sampleDbids = (db.prepare(`
  SELECT DISTINCT dbid FROM berlin_ds_unterthemen
  ORDER BY substr(dbid || 'salt', -3, 1), substr(dbid, -2), dbid
  LIMIT ? OFFSET ?
`).all(LIMIT, SEED * LIMIT) as { dbid: string }[]).map((r) => r.dbid);

const getDS = db.prepare(`
  SELECT dbid, klasse, derived_titel, zusammenfassung, thema_json,
         kerninhalt_json, kerninhalt_frage_json, kerninhalt_antwort_json
  FROM berlin_drucksachen_analyses WHERE dbid = ?
`);
const getZuordnungen = db.prepare(`
  SELECT feld, unterthemen_json, spezifische_tags_json FROM berlin_ds_unterthemen WHERE dbid = ?
`);

function arr(json: string | null): string[] { if (!json) return []; try { const v = JSON.parse(json); return Array.isArray(v) ? v : []; } catch { return []; } }

function dsText(ds: DS): string {
  const parts: string[] = [];
  if (ds.derived_titel) parts.push(`TITEL: ${ds.derived_titel}`);
  parts.push(`KLASSE: ${ds.klasse}`);
  parts.push(`ZUSAMMENFASSUNG: ${ds.zusammenfassung}`);
  const ki = [...arr(ds.kerninhalt_json), ...arr(ds.kerninhalt_frage_json), ...arr(ds.kerninhalt_antwort_json)];
  if (ki.length) parts.push(`KERNINHALT:\n- ${ki.slice(0, 8).join("\n- ")}`);
  return parts.join("\n");
}

function zuordnungenOf(dbid: string): { label: string }[] {
  const rows = getZuordnungen.all(dbid) as { feld: string; unterthemen_json: string }[];
  const out: { label: string }[] = [];
  for (const r of rows) for (const u of arr(r.unterthemen_json)) out.push({ label: `${r.feld}${SEP}${u}` });
  return out;
}

const SYSTEM = `Du bist ein strenger, neutraler Prüfer für die thematische Klassifikation von Drucksachen des Berliner Abgeordnetenhauses.
Dir wird der Text einer Drucksache gegeben und eine Liste vergebener Zuordnungen im Format „Politikfeld ⟫ Unterthema".
Beurteile JEDE Zuordnung einzeln gegen den TATSÄCHLICHEN Inhalt:
- "korrekt": trifft einen echten inhaltlichen Kern der Drucksache (sowohl das Politikfeld als auch das Unterthema passen).
- "grenzfall": vertretbar, aber ein benachbartes Feld/Unterthema träfe den Kern erkennbar besser; oder nur Randbezug.
- "falsch": Politikfeld oder Unterthema treffen den Inhalt nicht.
Sei kalibriert, nicht großzügig: im Zweifel zwischen korrekt und grenzfall → grenzfall.
Nenne außerdem, ob ein klar zentrales Politikfeld der DS in den Zuordnungen FEHLT (Recall).
Grounde dich NUR im gegebenen Text.`;

const TOOL: Anthropic.Tool = {
  name: "bewerte",
  description: "Bewerte jede nummerierte Zuordnung GENAU EINMAL anhand ihrer Nummer + Recall-Lücke.",
  input_schema: {
    type: "object",
    properties: {
      bewertungen: {
        type: "array",
        description: "Genau ein Eintrag pro vorgegebener Zuordnungs-Nummer, keine erfundenen.",
        items: {
          type: "object",
          properties: {
            nr: { type: "integer", description: "die Nummer der bewerteten Zuordnung aus der Liste" },
            urteil: { type: "string", enum: ["korrekt", "grenzfall", "falsch"] },
            begruendung: { type: "string", description: "max 1 kurzer Satz" },
          },
          required: ["nr", "urteil", "begruendung"],
        },
      },
      fehlendes_feld: { type: "boolean", description: "true, wenn ein klar zentrales Politikfeld der DS in den Zuordnungen fehlt" },
    },
    required: ["bewertungen", "fehlendes_feld"],
  },
};

type Result = {
  dbid: string; klasse: string; nZuord: number;
  bewertungen: { zuordnung: string; urteil: string; begruendung: string }[];
  fehlendes_feld: boolean;
};

// Mappt rohe Judge-Antwort (per nr) auf die echten Zuordnungen; verwirft Halluzinationen/Dubletten.
function mapBewertungen(raw: { nr?: number; urteil?: string; begruendung?: string }[], zuord: { label: string }[]): Result["bewertungen"] {
  const seen = new Set<number>();
  const out: Result["bewertungen"] = [];
  for (const b of raw) {
    const nr = Number(b?.nr);
    if (!Number.isInteger(nr) || nr < 1 || nr > zuord.length || seen.has(nr)) continue;
    if (!["korrekt", "grenzfall", "falsch"].includes(b.urteil ?? "")) continue;
    seen.add(nr);
    out.push({ zuordnung: zuord[nr - 1].label, urteil: b.urteil!, begruendung: (b.begruendung ?? "").slice(0, 200) });
  }
  return out;
}

function userText(ds: DS, zuord: { label: string }[]): string {
  return `DRUCKSACHE:\n${dsText(ds)}\n\nVERGEBENE ZUORDNUNGEN (bewerte jede genau einmal über ihre Nummer):\n${zuord.map((z, i) => `${i + 1}. ${z.label}`).join("\n")}`;
}

if (ESTIMATE) {
  let chars = 0, nz = 0;
  for (const dbid of sampleDbids) {
    const ds = getDS.get(dbid) as DS | undefined; if (!ds) continue;
    const z = zuordnungenOf(dbid); nz += z.length;
    chars += SYSTEM.length + userText(ds, z).length;
  }
  const inTok = Math.round(chars / 4) + sampleDbids.length * 250;
  const outTok = sampleDbids.length * 220;
  const cost = (inTok / 1e6) * 3 + (outTok / 1e6) * 15;
  console.log(`ESTIMATE Audit: ${sampleDbids.length} DS · ${nz} Zuordnungen · ~${inTok.toLocaleString()} in / ~${outTok.toLocaleString()} out → ~$${cost.toFixed(2)} (Sonnet 4.6 live)`);
  process.exit(0);
}
if (!process.env.ANTHROPIC_API_KEY) { console.error("ANTHROPIC_API_KEY fehlt"); process.exit(1); }
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function judge(dbid: string): Promise<Result | null> {
  const ds = getDS.get(dbid) as DS | undefined; if (!ds) return null;
  const zuord = zuordnungenOf(dbid); if (!zuord.length) return null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const resp = await client.messages.create({
        model: MODEL, max_tokens: 1200, system: SYSTEM,
        tools: [TOOL], tool_choice: { type: "tool", name: "bewerte" },
        messages: [{ role: "user", content: userText(ds, zuord) }],
      });
      const block = resp.content.find((b) => b.type === "tool_use") as Anthropic.ToolUseBlock | undefined;
      const out = (block?.input ?? {}) as { bewertungen?: { nr?: number; urteil?: string; begruendung?: string }[]; fehlendes_feld?: boolean };
      return { dbid, klasse: ds.klasse, nZuord: zuord.length, bewertungen: mapBewertungen(out.bewertungen ?? [], zuord), fehlendes_feld: !!out.fehlendes_feld };
    } catch (e: unknown) {
      const wait = 1500 * (attempt + 1);
      process.stderr.write(`  retry ${dbid} (${(e as Error).message?.slice(0, 60)}) in ${wait}ms\n`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  return null;
}

async function main() {
  console.log(`AUDIT Unterthemen Berlin — ${sampleDbids.length} DS, Judge=${MODEL}, Conc=${CONC}\n`);
  const results: Result[] = [];
  let done = 0;
  const queue = [...sampleDbids];
  async function worker() {
    while (queue.length) {
      const dbid = queue.shift()!;
      const r = await judge(dbid);
      if (r) results.push(r);
      if (++done % 25 === 0) process.stderr.write(`  ${done}/${sampleDbids.length}\n`);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));

  // Aggregation
  let korrekt = 0, grenzfall = 0, falsch = 0, total = 0;
  let dsAllKorrekt = 0, dsMitFalsch = 0, dsFehlend = 0;
  const falschBeispiele: string[] = [];
  for (const r of results) {
    let hasFalsch = false, allK = true;
    for (const b of r.bewertungen) {
      total++;
      if (b.urteil === "korrekt") korrekt++;
      else if (b.urteil === "grenzfall") { grenzfall++; allK = false; }
      else { falsch++; allK = false; hasFalsch = true;
        if (falschBeispiele.length < 25) falschBeispiele.push(`${r.dbid} [${r.klasse}] ✗ ${b.zuordnung} — ${b.begruendung}`); }
    }
    if (allK && r.bewertungen.length) dsAllKorrekt++;
    if (hasFalsch) dsMitFalsch++;
    if (r.fehlendes_feld) dsFehlend++;
  }
  const pct = (n: number, d: number) => d ? (100 * n / d).toFixed(1) : "0.0";
  const out: string[] = [];
  out.push("═".repeat(64));
  out.push(`AUDIT-ERGEBNIS — ${results.length} DS bewertet, ${total} Zuordnungen`);
  out.push("─".repeat(64));
  out.push(`Pro Zuordnung:  korrekt ${korrekt} (${pct(korrekt, total)} %)  ·  grenzfall ${grenzfall} (${pct(grenzfall, total)} %)  ·  falsch ${falsch} (${pct(falsch, total)} %)`);
  out.push(`Pro Drucksache: alle korrekt ${dsAllKorrekt}/${results.length} (${pct(dsAllKorrekt, results.length)} %)  ·  mit ≥1 falsch ${dsMitFalsch} (${pct(dsMitFalsch, results.length)} %)`);
  out.push(`Recall: DS mit fehlendem zentralem Feld ${dsFehlend}/${results.length} (${pct(dsFehlend, results.length)} %)`);
  out.push("─".repeat(64));
  out.push(`FALSCH-Beispiele (max 25):`);
  for (const f of falschBeispiele) out.push("  " + f);
  out.push("═".repeat(64));
  const report = out.join("\n");
  console.log("\n" + report);
  const stamp = `audit-unterthemen-${results.length}ds-seed${SEED}.json`;
  fs.writeFileSync(stamp, JSON.stringify({ summary: { korrekt, grenzfall, falsch, total, dsAllKorrekt, dsMitFalsch, dsFehlend, n: results.length }, results }, null, 2));
  console.log(`\nDetails → ${stamp}`);
}
main();
