/**
 * Generiert pro TOP einer Berliner Plenarsitzung eine 3-5-Sätze-Synthese aus den
 * bereits vorhandenen Reden-Zusammenfassungen. Eingabe ist kompakt (nicht die
 * Volltext-Reden), Ausgabe wird in berlin_top_summaries gecached.
 *
 * Aufruf:
 *   npx tsx scripts/generate-berlin-top-summaries.ts --sitzung 85 --write
 *   npx tsx scripts/generate-berlin-top-summaries.ts --sitzung 85          (dry-run)
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
const WRITE = argv.includes("--write");
const FORCE = argv.includes("--force");

if (!SITZUNG || !Number.isFinite(SITZUNG)) {
  console.error("Usage: --sitzung <nr> [--write]");
  process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY fehlt");
  process.exit(1);
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS berlin_top_summaries (
    sitzung_nr INTEGER NOT NULL,
    top_marker TEXT NOT NULL,
    top_titel TEXT NOT NULL,
    zusammenfassung TEXT,  -- legacy v1/v2 (Volltext); für v3+ NULL
    lead TEXT,             -- v3+: 2-3 Sätze Kern (max 350 Z.)
    body TEXT,             -- v3+: optional 0-6 Sätze Details (max 800 Z.) — NULL bei Routine
    reden_count INTEGER NOT NULL,
    model TEXT NOT NULL,
    prompt_version TEXT NOT NULL,
    input_tokens INTEGER,
    output_tokens INTEGER,
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sitzung_nr, top_marker, top_titel)
  )
`);

// ALTER for existing DBs (no-op if columns already exist)
try { db.exec(`ALTER TABLE berlin_top_summaries ADD COLUMN lead TEXT`); } catch {}
try { db.exec(`ALTER TABLE berlin_top_summaries ADD COLUMN body TEXT`); } catch {}
try { db.exec(`ALTER TABLE berlin_top_summaries ADD COLUMN key_facts_json TEXT`); } catch {}

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
- KEINE typografischen Anführungszeichen („…", ‚…') im text-Feld — verwende stattdessen einfache 'Apostrophe' oder gar keine Quotes (besser umformulieren: statt »der Antrag sei „unseriös"« → »der Antrag sei unseriös«).

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

const TOOL: Anthropic.Tool = {
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
            text: {
              type: "string",
              description: "Eigenständiger Fakt-Satz, ohne Kenntnis der Debatte lesbar. Akteur + Fakt + ggf. Kontext-Zahl.",
            },
            refs: {
              type: "array",
              items: { type: "integer", minimum: 1 },
              minItems: 1,
              maxItems: 3,
              description: "1-3 Reden-Nummern (1-based, gemäß User-Prompt-Liste), die diesen Bullet am stärksten belegen.",
            },
          },
          required: ["text", "refs"],
        },
        description: "PFLICHT. 2-8 Bullets mit Text + Reden-Belegen.",
      },
    },
    required: ["key_facts"],
  },
};

interface TopRow {
  marker: string;
  titel: string;
  reden: {
    speaker: string;
    party: string | null;
    zusammenfassung: string;
    konkrete_zahlen: string[];
    forderungen: string[];
  }[];
}

function safeJsonArray(s: string | null): string[] {
  if (!s) return [];
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed)) return parsed.filter((x) => typeof x === "string");
    if (typeof parsed === "string") {
      try {
        const inner = JSON.parse(parsed);
        if (Array.isArray(inner)) return inner.filter((x) => typeof x === "string");
      } catch {}
    }
    return [];
  } catch {
    return [];
  }
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
             COALESCE(NULLIF(bs.speaker_party, ''),
                      CASE WHEN pa.label LIKE 'BÜNDNIS%' THEN 'GRÜNE'
                           WHEN pa.label = 'Die Linke' THEN 'LINKE'
                           ELSE pa.label END) AS party,
             bsa.zusammenfassung_2_saetze AS zusammenfassung,
             bsa.konkrete_zahlen_json,
             bsa.forderungen_json
      FROM berlin_speeches bs
      LEFT JOIN berlin_speech_analyses bsa ON bsa.speech_id = bs.speech_id
      LEFT JOIN politicians p ON p.id = bs.politician_id
      LEFT JOIN parties pa ON pa.id = p.party_id
      WHERE bs.sitzung_nr = ? AND bs.top_marker = ? AND bs.top_titel = ?
        AND bs.speech_type != 'praesidium'
        AND bsa.zusammenfassung_2_saetze IS NOT NULL
        AND bsa.zusammenfassung_2_saetze != ''
      ORDER BY bs.order_in_session
    `).all(sitzung, t.top_marker, t.top_titel) as {
      speaker_name: string; party: string | null; zusammenfassung: string;
      konkrete_zahlen_json: string | null; forderungen_json: string | null;
    }[];

    return {
      marker: t.top_marker,
      titel: t.top_titel,
      reden: reden.map((r) => ({
        speaker: r.speaker_name,
        party: r.party,
        zusammenfassung: r.zusammenfassung,
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
    "Reden (chronologisch). Pro Rede: 2-Satz-Zusammenfassung + konkrete Zahlen (Beleg-Anker aus dem Originaltext) + Forderungen (Träger ist die jeweilige Fraktion/der jeweilige Sprecher).",
    "",
  ];
  for (let i = 0; i < top.reden.length; i++) {
    const r = top.reden[i];
    const speakerLine = r.party ? `${r.speaker} (${r.party})` : r.speaker;
    lines.push(`${i + 1}. ${speakerLine}: ${r.zusammenfassung}`);
    if (r.konkrete_zahlen.length > 0) {
      lines.push(`   Zahlen: ${r.konkrete_zahlen.join(" | ")}`);
    }
    if (r.forderungen.length > 0) {
      lines.push(`   Forderungen: ${r.forderungen.join(" | ")}`);
    }
  }
  lines.push("");
  lines.push("Synthetisiere diese Debatte: key_facts (2-7 Bullets, dynamisch) + optional body. Alle Fraktionen fair repräsentiert. Jeder Bullet kontext-vollständig.");
  return lines.join("\n");
}

interface KeyFactOut { text: string; refs: number[] }

async function summarize(top: TopRow): Promise<{ keyFacts: KeyFactOut[]; inT: number; outT: number }> {
  const maxRef = top.reden.length;
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    tools: [TOOL],
    tool_choice: { type: "tool", name: "synthesize_top" },
    messages: [{ role: "user", content: buildUserMessage(top) }],
  });

  const toolUse = msg.content.find((c) => c.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(`No tool_use returned for TOP ${top.marker} (stop_reason=${msg.stop_reason})`);
  }
  const input = toolUse.input as { key_facts?: Array<{ text?: unknown; refs?: unknown }> };
  if (!input.key_facts || !Array.isArray(input.key_facts) || input.key_facts.length === 0) {
    throw new Error(`Empty key_facts for TOP ${top.marker} (stop_reason=${msg.stop_reason}, out_tokens=${msg.usage.output_tokens})`);
  }

  const keyFacts: KeyFactOut[] = [];
  for (const raw of input.key_facts) {
    if (!raw || typeof raw !== "object") continue;
    const text = typeof raw.text === "string" ? raw.text.trim() : "";
    if (!text) continue;
    const refsRaw = Array.isArray(raw.refs) ? raw.refs : [];
    // Filtere ungültige Refs (außerhalb 1..maxRef, nicht-integer, Duplikate)
    const refs: number[] = [];
    for (const r of refsRaw) {
      if (typeof r === "number" && Number.isInteger(r) && r >= 1 && r <= maxRef && !refs.includes(r)) {
        refs.push(r);
      }
    }
    keyFacts.push({ text, refs });
  }
  if (keyFacts.length === 0) {
    throw new Error(`No valid key_facts after filtering for TOP ${top.marker}`);
  }

  return {
    keyFacts,
    inT: msg.usage.input_tokens,
    outT: msg.usage.output_tokens,
  };
}

function alreadyDoneAtV4(sitzung: number, marker: string, titel: string): boolean {
  // v3-Rows zählen NICHT als done; nur v4-Rows mit key_facts.
  const row = db.prepare(
    `SELECT prompt_version, key_facts_json FROM berlin_top_summaries
     WHERE sitzung_nr=? AND top_marker=? AND top_titel=?`,
  ).get(sitzung, marker, titel) as { prompt_version: string; key_facts_json: string | null } | undefined;
  if (!row) return false;
  return row.prompt_version === PROMPT_VERSION && !!row.key_facts_json;
}

async function main() {
  const tops = loadTops(SITZUNG!);
  console.log(`\nSitzung ${SITZUNG}: ${tops.length} TOPs gefunden`);
  for (const t of tops) {
    console.log(`  TOP ${t.marker} · ${t.titel}: ${t.reden.length} Reden`);
  }
  console.log("");

  if (!WRITE) {
    console.log("DRY-RUN — fehlendes --write Flag, keine API-Calls\n");
    return;
  }

  let totalInT = 0, totalOutT = 0;
  for (const top of tops) {
    if (top.reden.length === 0) {
      console.log(`SKIP TOP ${top.marker}: keine Reden`);
      continue;
    }
    if (!FORCE && alreadyDoneAtV4(SITZUNG!, top.marker, top.titel)) {
      console.log(`SKIP TOP ${top.marker}: bereits v4 in DB (mit --force überschreiben)`);
      continue;
    }
    process.stdout.write(`TOP ${top.marker} (${top.reden.length} Reden) ... `);
    try {
      const { keyFacts, inT, outT } = await summarize(top);
      totalInT += inT;
      totalOutT += outT;
      db.prepare(`
        INSERT OR REPLACE INTO berlin_top_summaries
          (sitzung_nr, top_marker, top_titel, zusammenfassung, lead, body, key_facts_json, reden_count, model, prompt_version, input_tokens, output_tokens)
        VALUES (?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?)
      `).run(SITZUNG, top.marker, top.titel, JSON.stringify(keyFacts), top.reden.length, MODEL, PROMPT_VERSION, inT, outT);
      console.log(`✓ ${inT}↓ ${outT}↑ · ${keyFacts.length} key_facts`);
      for (const f of keyFacts) console.log(`    • ${f.text} [${f.refs.join(",")}]`);
    } catch (e) {
      console.log(`✗ ${e}`);
    }
  }

  const cost = (totalInT / 1_000_000) * 1.0 + (totalOutT / 1_000_000) * 5.0;
  console.log(`\nFertig. Total: ${totalInT}↓ + ${totalOutT}↑ tokens = ~$${cost.toFixed(4)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
