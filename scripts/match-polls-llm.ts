/**
 * LLM-assistierter Match für die 24 ungematchten Polls.
 * Für jede unmatched Poll: Top-15 Kandidaten-DS (filtered by date + thema)
 * an Haiku 4.5 schicken — wähle beste Match-DS oder "none".
 *
 * Cost-Estimate: 24 × ~3K Input + 50 Output × $1/M = ~$0.10
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

interface Poll { poll_id: number; poll_label: string; poll_date: string; }

// Ungematchte Polls
const matched = db.prepare(`SELECT DISTINCT poll_id FROM drucksache_polls`).all() as Array<{ poll_id: number }>;
const matchedIds = new Set(matched.map((m) => m.poll_id));
const allPolls = db.prepare(`
  SELECT DISTINCT poll_id, poll_label, poll_date FROM votes
  WHERE poll_label IS NOT NULL AND poll_date IS NOT NULL
`).all() as Poll[];
const unmatched = allPolls.filter((p) => !matchedIds.has(p.poll_id));

console.log(`📋 ${unmatched.length} ungematchte Polls zu matchen`);

interface Candidate { drucksache_nr: string; titel: string; publication_date: string; batch_class: string }

function getCandidates(p: Poll, limit: number = 25): Candidate[] {
  // Wider window — 90 Tage vor Poll, 7 Tage nach
  const pollMs = new Date(p.poll_date + "T00:00:00").getTime();
  const fromIso = new Date(pollMs - 90 * 86400000).toISOString().slice(0, 10);
  const toIso   = new Date(pollMs +  7 * 86400000).toISOString().slice(0, 10);

  // Top-Kandidaten via word-overlap in thema-Feld + batch_class
  return db.prepare(`
    SELECT a.drucksache_nr,
           (SELECT thema FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL LIMIT 1) AS titel,
           t.publication_date,
           a.batch_class
    FROM drucksache_analyses a
    JOIN drucksache_texts t ON t.drucksache_nr=a.drucksache_nr
    WHERE a.analyze_error IS NULL
      AND t.publication_date >= ? AND t.publication_date <= ?
      AND a.batch_class IN ('gross','mittel','klein')
      AND EXISTS (SELECT 1 FROM activities WHERE drucksache_nr=a.drucksache_nr AND thema IS NOT NULL)
    ORDER BY t.publication_date DESC
    LIMIT ?
  `).all(fromIso, toIso, limit) as Candidate[];
}

const ins = db.prepare(`
  INSERT OR REPLACE INTO drucksache_polls (drucksache_nr, poll_id, match_score, matched_via)
  VALUES (?, ?, ?, ?)
`);

let matched_count = 0;
let no_match = 0;

async function matchOne(p: Poll) {
  const candidates = getCandidates(p, 25);
  if (candidates.length === 0) { no_match++; console.log(`  · ${p.poll_id}: keine Kandidaten im Zeitfenster`); return; }

  const candidatesText = candidates.map((c, i) => `${i + 1}. [${c.drucksache_nr}] ${c.titel} (${c.batch_class}, ${c.publication_date})`).join("\n");

  const userPrompt = `Folgende namentliche Abstimmung wurde im Bundestag durchgeführt:

ABSTIMMUNG: "${p.poll_label}"
DATUM: ${p.poll_date}

Hier sind ${candidates.length} Drucksachen-Kandidaten aus dem 90-Tage-Fenster davor:

${candidatesText}

Welche Drucksache wurde am wahrscheinlichsten abgestimmt? Beachte:
- Bei "Ablehnung des [Antrag]" oder "Kein X" oder "Keine Wiedereinführung" → die abgelehnte Original-Drucksache (oft ein Antrag mit gegenteiliger Position)
- Bei "Beschlussempfehlung" → die zugehörige Vorlage
- Bei Haushaltsgesetz / Etat → die Haushalts-Drucksache
- Bei Bundeswehreinsatz → der Antrag der Bundesregierung zur Verlängerung

Antworte AUSSCHLIESSLICH mit der DS-Nummer (z.B. "21/3079") oder "NONE" wenn keine passt.`;

  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 30,
      messages: [{ role: "user", content: userPrompt }],
    });
    const text = (msg.content[0] as any)?.text?.trim() ?? "";
    const m = text.match(/(\d+\/\d+)/);
    if (m) {
      const dsNr = m[1];
      // Verify der Match ist in Kandidaten
      const found = candidates.find((c) => c.drucksache_nr === dsNr);
      if (!found) { console.log(`  · ${p.poll_id}: LLM erfand DS ${dsNr} (nicht in Kandidaten)`); no_match++; return; }
      ins.run(dsNr, p.poll_id, 0.85, "llm-haiku");
      matched_count++;
      console.log(`✓ ${p.poll_id} ${p.poll_label.slice(0, 60)}… → ${dsNr}`);
    } else {
      no_match++;
      console.log(`  · ${p.poll_id}: NONE (${p.poll_label.slice(0, 60)})`);
    }
  } catch (e: any) {
    console.log(`  ✖ ${p.poll_id}: ${e?.message?.slice(0, 80) ?? "err"}`);
    no_match++;
  }
}

async function main() {
  for (const p of unmatched) {
    await matchOne(p);
  }
  console.log(`\n=== Fertig ===`);
  console.log(`  Matched:  ${matched_count}`);
  console.log(`  NoMatch:  ${no_match}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
