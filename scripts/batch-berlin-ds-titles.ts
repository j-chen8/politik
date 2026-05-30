/**
 * Erzeugt prägnante Titel für titellose Berlin-Drucksachen aus deren Zusammenfassung
 * via Anthropic Batch API (Haiku 4.5). Schreibt in berlin_drucksachen_analyses.derived_titel.
 * Submit → Poll → Retrieve in einem Lauf.
 *
 * Lauf: npx tsx scripts/batch-berlin-ds-titles.ts
 * Danach: npx tsx scripts/rebuild-berlin-drucksachen-fts.ts  (Titel in den Suchindex)
 */
import Anthropic from "@anthropic-ai/sdk";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

// .env laden (minimal, wie die anderen Batch-Skripte)
const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 60;
const POLL_S = 15;
const POLL_CAP = 160; // ~40 min

const KLASSE_LABEL: Record<string, string> = {
  anfrage_antwort: "Schriftliche Anfrage",
  antrag: "Antrag",
  gesetzentwurf: "Gesetzentwurf",
  vorlage_senat: "Senats-Vorlage / Mitteilung",
  beschlussempfehlung: "Beschlussempfehlung",
  beschlussempfehlung_regex: "Beschlussempfehlung",
};

const SYSTEM = `Du erzeugst prägnante, neutrale Titel für Drucksachen des Berliner Abgeordnetenhauses.
Aus der Zusammenfassung machst du EINEN kurzen Titel (höchstens 12 Wörter), der den Gegenstand klar benennt.
Beginne mit dem Dokumenttyp, Doppelpunkt, dann Gegenstand und ggf. die Handlung (annehmen/ablehnen/fordern/streichen …).
Beispiele:
- Beschlussempfehlung: „Berliner Open-Source-Gesetz" ablehnen
- Antrag: Abkehr von der Berliner Olympia-Bewerbung
- Änderungsantrag: „grundsätzlich" aus dem Altenhilfegesetz streichen
- Zwischenbericht: Campus für Demokratie auf dem früheren Stasi-Gelände
Regeln: neutral und faktisch, keine Wertung, KEINE Drucksachen-Nummer im Titel, keine umschließenden Anführungszeichen, kein Schlusspunkt. Antworte NUR mit dem Titel.`;

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY fehlt");
  const db = new Database(path.join(process.cwd(), "politik.db"));
  db.pragma("journal_mode = WAL");

  const rows = db.prepare(`
    SELECT a.dbid, a.klasse, a.zusammenfassung
    FROM berlin_drucksachen_analyses a
    JOIN berlin_documents bd ON bd.dbid = a.dbid
    WHERE (bd.titel IS NULL OR TRIM(bd.titel)='')
      AND (bd.abstract IS NULL OR bd.abstract NOT LIKE '%siehe Drucksache%')
      AND a.derived_titel IS NULL
      AND a.zusammenfassung IS NOT NULL AND TRIM(a.zusammenfassung) <> ''
  `).all() as { dbid: string; klasse: string; zusammenfassung: string }[];

  console.log(`Zu titeln: ${rows.length} Drucksachen`);
  if (rows.length === 0) { db.close(); return; }

  const client = new Anthropic({ apiKey });
  const requests = rows.map((r) => ({
    custom_id: r.dbid,
    params: {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [{ type: "text" as const, text: SYSTEM, cache_control: { type: "ephemeral" as const } }],
      messages: [{
        role: "user" as const,
        content: `Dokumenttyp: ${KLASSE_LABEL[r.klasse] ?? r.klasse}\nZusammenfassung: ${r.zusammenfassung.slice(0, 1200)}`,
      }],
    },
  }));

  const batch = await client.messages.batches.create({ requests: requests as any });
  console.log(`Batch ${batch.id} submitted (${requests.length} requests)`);

  let b = await client.messages.batches.retrieve(batch.id);
  for (let i = 0; i < POLL_CAP && b.processing_status !== "ended"; i++) {
    await new Promise((res) => setTimeout(res, POLL_S * 1000));
    b = await client.messages.batches.retrieve(batch.id);
    const c = b.request_counts;
    process.stdout.write(`  [${(i + 1) * POLL_S}s] ${b.processing_status} succeeded=${c.succeeded} errored=${c.errored}\r`);
  }
  if (b.processing_status !== "ended") {
    console.log(`\nNoch nicht fertig — Batch-ID ${batch.id} (später retrieven).`);
    db.close(); return;
  }
  console.log(`\nBatch ended. Schreibe Titel…`);

  const upd = db.prepare(`UPDATE berlin_drucksachen_analyses SET derived_titel=? WHERE dbid=?`);
  let written = 0, errored = 0;
  for await (const entry of await client.messages.batches.results(batch.id)) {
    if (entry.result.type !== "succeeded") { errored++; continue; }
    const block = entry.result.message.content.find((x: any) => x.type === "text") as { text: string } | undefined;
    let title = (block?.text ?? "").trim().replace(/^["„»]|["“«]$/g, "").replace(/\.$/, "").trim();
    if (title.length < 4) { errored++; continue; }
    if (title.length > 160) title = title.slice(0, 157).trimEnd() + "…";
    upd.run(title, entry.custom_id);
    written++;
  }
  console.log(`✓ ${written} Titel geschrieben, ${errored} Fehler.`);
  db.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
