/**
 * V2 LLM-Matcher mit aggressiverem Prompt.
 * Lehne NONE nur dann, wenn KEINE plausible thematische Verbindung existiert.
 * Akzeptiere auch Gegen-Anträge bei "Ablehnung X" / "Keine Y"-Polls.
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
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

const matched = db.prepare(`SELECT DISTINCT poll_id FROM drucksache_polls`).all() as Array<{ poll_id: number }>;
const matchedIds = new Set(matched.map((m) => m.poll_id));
const unmatched = (db.prepare(`SELECT DISTINCT poll_id, poll_label, poll_date FROM votes WHERE poll_label IS NOT NULL AND poll_date IS NOT NULL`).all() as any[]).filter((p) => !matchedIds.has(p.poll_id));

console.log(`📋 ${unmatched.length} ungematchte Polls (V2-Run)`);

const ins = db.prepare(`INSERT OR REPLACE INTO drucksache_polls VALUES (?, ?, ?, ?)`);
let matched_count = 0, no_match = 0;

async function matchOne(p: { poll_id: number; poll_label: string; poll_date: string }) {
  const pollMs = new Date(p.poll_date + "T00:00:00").getTime();
  const fromIso = new Date(pollMs - 180 * 86400000).toISOString().slice(0, 10);
  const toIso   = new Date(pollMs +  14 * 86400000).toISOString().slice(0, 10);

  const candidates = db.prepare(`
    SELECT a.drucksache_nr,
           (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL LIMIT 1) AS titel,
           t.publication_date, a.batch_class
    FROM drucksache_analyses a
    JOIN drucksache_texts t ON t.drucksache_nr=a.drucksache_nr
    WHERE a.analyze_error IS NULL
      AND t.publication_date BETWEEN ? AND ?
      AND a.batch_class IN ('gross','mittel','klein')
      AND EXISTS (SELECT 1 FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL)
    ORDER BY t.publication_date DESC LIMIT 40
  `).all(fromIso, toIso) as Array<{ drucksache_nr: string; titel: string; publication_date: string; batch_class: string }>;

  if (candidates.length === 0) { no_match++; console.log(`  · ${p.poll_id}: keine Kandidaten`); return; }

  const list = candidates.map((c, i) => `${i + 1}. [${c.drucksache_nr}] ${c.titel} — ${c.batch_class}/${c.publication_date}`).join("\n");

  const prompt = `Du verknüpfst eine namentliche Abstimmung mit der zugrunde liegenden Bundestags-Drucksache.

ABSTIMMUNG #${p.poll_id}: "${p.poll_label}"
DATUM: ${p.poll_date}

KANDIDATEN (180 Tage davor):
${list}

ANLEITUNG — sei MUTIG beim Matchen:
- "Ablehnung X" / "Keine Wiedereinführung Y" / "Kein Stopp Z": das ist die Abstimmung ÜBER den Original-Antrag mit der genau jener Forderung. Wähle den Antrag der das Gegenteil fordert.
- "Beschlussempfehlung" zu einem Thema: die zugehörige Vorlage suchen.
- "Mietwuchergesetz" / "Verbrenner-Verbot" / etc.: Titel-Match auch über Synonyme akzeptieren.
- Haushaltsgesetz / Etat → suche Haushalts-DS oder Etat-Posten-DS.
- "NONE" NUR wenn wirklich KEINER der Kandidaten thematisch passt.

Antworte AUSSCHLIESSLICH mit der DS-Nummer (z.B. "21/2168") oder "NONE".`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 30,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (msg.content[0] as any)?.text?.trim() ?? "";
    const m = text.match(/(\d+\/\d+)/);
    if (m) {
      const dsNr = m[1];
      const found = candidates.find((c) => c.drucksache_nr === dsNr);
      if (!found) { console.log(`  · ${p.poll_id}: LLM erfand DS ${dsNr}`); no_match++; return; }
      ins.run(dsNr, p.poll_id, 0.75, "llm-haiku-v2");
      matched_count++;
      console.log(`✓ ${p.poll_id} ${p.poll_label.slice(0, 60)}… → ${dsNr}`);
    } else {
      no_match++;
      console.log(`  · ${p.poll_id}: NONE (${p.poll_label.slice(0, 60)})`);
    }
  } catch (e: any) {
    console.log(`  ✖ ${p.poll_id}: ${e?.message?.slice(0, 80)}`);
    no_match++;
  }
}

async function main() {
  for (const p of unmatched) await matchOne(p);
  console.log(`\n=== Fertig ===\n  Matched: ${matched_count}\n  NoMatch: ${no_match}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
