/**
 * Batch-Variante der Medien-Auftritts-Pipeline.
 *
 * Submittet alle 7 weiteren MdB-Auftritte als einen Anthropic Message Batch.
 * 50 % günstiger als Live, asynchron (1-24h Wartezeit).
 *
 * Usage:
 *   npx tsx scripts/batch-media-analyses.ts --submit
 *   npx tsx scripts/batch-media-analyses.ts --status
 *   npx tsx scripts/batch-media-analyses.ts --apply
 */

import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { createHash } from "crypto";
import { parseVTT, captionsToProse, buildSystemPrompt, TOOL_SCHEMA } from "./_lib/media-analysis-shared";

// Load .env
const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const args = process.argv.slice(2);
const DO_SUBMIT = args.includes("--submit");
const DO_STATUS = args.includes("--status");
const DO_APPLY = args.includes("--apply");
const INCLUDE_IDX = args.indexOf("--include");
const INCLUDE_IDS: Set<string> | null = INCLUDE_IDX >= 0 && args[INCLUDE_IDX + 1]
  ? new Set(args[INCLUDE_IDX + 1].split(","))
  : null;

if (!DO_SUBMIT && !DO_STATUS && !DO_APPLY) {
  console.error("Usage: --submit | --status | --apply [--include id1,id2]");
  process.exit(1);
}

const MODEL = "claude-haiku-4-5";
const STATE_PATH = path.join(process.cwd(), ".batch-state-media-analyses.json");

/* ─── Auftritte ─────────────────────────────────────────────── */

interface Appearance {
  custom_id: string;          // Batch-Request-ID (= appearance-Id)
  politician_id: number;
  politician: string;
  host: string;
  publisher: string;
  episode_label: string;
  url: string;
  video_id: string;
  published_at: string;
  duration_label: string;
  format?: "podcast" | "tv";
  // Multi-Speaker (Talkshow-Modus): wenn gesetzt, anderer Prompt
  other_speakers?: string;    // z.B. "Sepp Müller (CDU), Eva Quadbeck (Journalistin)"
  politician_desc?: string;   // z.B. "Co-Vorsitzender Grüne, MdB"
}

const APPEARANCES: Appearance[] = [
  {
    custom_id: "banaszak-jung-naiv-825",
    politician_id: 145959,
    politician: "Felix Banaszak",
    host: "Tilo Jung",
    publisher: "Jung & Naiv",
    episode_label: "Folge #825",
    url: "https://www.youtube.com/watch?v=ZlYKFD5lh98",
    video_id: "ZlYKFD5lh98",
    published_at: "2026-05",
    duration_label: "ca. 2h 42min",
  },
  {
    custom_id: "van-aken-jung-naiv-745",
    politician_id: 78952,
    politician: "Jan van Aken",
    host: "Tilo Jung",
    publisher: "Jung & Naiv",
    episode_label: "Folge #745",
    url: "https://www.youtube.com/watch?v=ls0tBHgy_xI",
    video_id: "ls0tBHgy_xI",
    published_at: "2025-01",
    duration_label: "ca. 4-5h",
  },
  {
    custom_id: "lemke-jung-naiv-750",
    politician_id: 79199,
    politician: "Steffi Lemke",
    host: "Tilo Jung",
    publisher: "Jung & Naiv",
    episode_label: "Folge #750",
    url: "https://www.youtube.com/watch?v=UltuRRg_7LU",
    video_id: "UltuRRg_7LU",
    published_at: "2025-01",
    duration_label: "ca. 2h",
  },
  {
    custom_id: "scholz-jung-naiv-754",
    politician_id: 66924,
    politician: "Olaf Scholz",
    host: "Tilo Jung",
    publisher: "Jung & Naiv",
    episode_label: "Folge #754",
    url: "https://www.youtube.com/watch?v=kFPnPiNkrd8",
    video_id: "kFPnPiNkrd8",
    published_at: "2025-02",
    duration_label: "ca. 2h",
  },
  {
    custom_id: "seitz-jung-naiv-758",
    politician_id: 182873,
    politician: "Nora Seitz",
    host: "Tilo Jung",
    publisher: "Jung & Naiv",
    episode_label: "Folge #758",
    url: "https://www.youtube.com/watch?v=A0UprRwW110",
    video_id: "A0UprRwW110",
    published_at: "2025-03",
    duration_label: "ca. 2.5h",
  },
  {
    custom_id: "schwerdtner-jung-naiv-772",
    politician_id: 180854,
    politician: "Ines Schwerdtner",
    host: "Tilo Jung",
    publisher: "Jung & Naiv",
    episode_label: "Folge #772",
    url: "https://www.youtube.com/watch?v=Jyrk6_drMKo",
    video_id: "Jyrk6_drMKo",
    published_at: "2025-07",
    duration_label: "ca. 3.5h",
  },
  {
    custom_id: "aeikens-jung-naiv-790",
    politician_id: 182845,
    politician: "Anna Aeikens",
    host: "Tilo Jung",
    publisher: "Jung & Naiv",
    episode_label: "Folge #790",
    url: "https://www.youtube.com/watch?v=kfQQb8m48xQ",
    video_id: "kfQQb8m48xQ",
    published_at: "2025-11",
    duration_label: "ca. 2.5h",
  },
  {
    custom_id: "cademartori-jung-naiv-803",
    politician_id: 175436,
    politician: "Isabel Cademartori",
    host: "Tilo Jung",
    publisher: "Jung & Naiv",
    episode_label: "Folge #803",
    url: "https://www.youtube.com/watch?v=jkN15eRa4so",
    video_id: "jkN15eRa4so",
    published_at: "2026-01",
    duration_label: "ca. 2.5h",
  },
  // Talkshow (Multi-Speaker-Modus) — Discovery-Picks
  {
    custom_id: "schwerdtner-lanz-2025-10-15",
    politician_id: 180854,
    politician: "Ines Schwerdtner",
    host: "Markus Lanz",
    publisher: "Markus Lanz (ZDF)",
    episode_label: "Sendung vom 15.10.2025 (Folge #2137)",
    url: "https://www.zdf.de/video/talk/markus-lanz-114/markus-lanz-vom-15-oktober-2025-100",
    video_id: "markus-lanz-vom-15-oktober-2025-100",
    published_at: "2025-10-15",
    duration_label: "ca. 75 Min",
    format: "tv",
    other_speakers: "Eva Quadbeck (Chefredakteurin Redaktionsnetzwerk Deutschland, Journalistin), Claudia Major (Militär-Expertin, kommentiert Ukraine-Krieg)",
    politician_desc: "Co-Vorsitzende Die Linke seit 2024, MdB",
  },
  {
    custom_id: "chrupalla-lanz-2025-11-11",
    politician_id: 145755,
    politician: "Tino Chrupalla",
    host: "Markus Lanz",
    publisher: "Markus Lanz (ZDF)",
    episode_label: "Sendung vom 11.11.2025 (Folge #2148)",
    url: "https://www.zdf.de/video/talk/markus-lanz-114/markus-lanz-vom-11-november-2025-100",
    video_id: "markus-lanz-vom-11-november-2025-100",
    published_at: "2025-11-11",
    duration_label: "ca. 75 Min",
    format: "tv",
    other_speakers: "Wladimir Kara-Mursa (Kremlkritiker, russischer Oppositioneller), Florence Gaub (Zukunftsforscherin NATO Defense College), Justus Bender (stellv. Politikchef FAS, Journalist)",
    politician_desc: "Co-Vorsitzender AfD seit 2019, Fraktionsvorsitzender AfD-Bundestagsfraktion",
  },
  {
    custom_id: "lauterbach-lanz-2025-11-18",
    politician_id: 79215,
    politician: "Karl Lauterbach",
    host: "Markus Lanz",
    publisher: "Markus Lanz (ZDF)",
    episode_label: "Sendung vom 18.11.2025 (Folge #2151)",
    url: "https://www.zdf.de/video/talk/markus-lanz-114/markus-lanz-vom-18-november-2025-100",
    video_id: "markus-lanz-vom-18-november-2025-100",
    published_at: "2025-11-18",
    duration_label: "ca. 75 Min",
    format: "tv",
    other_speakers: "Karina Mößbauer (Chefkorrespondentin Politik The Pioneer, Journalistin), Hans-Werner Sinn (Ökonom, früherer Chef des Ifo-Instituts)",
    politician_desc: "Ex-Bundesgesundheitsminister 2021-2025, MdB SPD seit 2005, Gesundheitsökonom",
  },
  {
    custom_id: "linnemann-lanz-2025-10-14",
    politician_id: 79149,
    politician: "Carsten Linnemann",
    host: "Markus Lanz",
    publisher: "Markus Lanz (ZDF)",
    episode_label: "Sendung vom 14.10.2025 (Folge #2136)",
    url: "https://www.zdf.de/video/talk/markus-lanz-114/markus-lanz-vom-14-oktober-2025-100",
    video_id: "markus-lanz-vom-14-oktober-2025-100",
    published_at: "2025-10-14",
    duration_label: "ca. 75 Min",
    format: "tv",
    other_speakers: "Ulrike Herrmann (Wirtschaftsexpertin taz, Journalistin), Thomas Reichart (ZDF-Korrespondent Tel Aviv), Efrat Machikawa (Geiselangehörige, Nichte eines Gaza-Geisels)",
    politician_desc: "CDU-Generalsekretär seit 2022, MdB seit 2009, ehemaliger Vorsitzender Mittelstands- und Wirtschaftsunion",
  },
  {
    custom_id: "kloeckner-lanz-2025-10-22",
    politician_id: 110066,
    politician: "Julia Klöckner",
    host: "Markus Lanz",
    publisher: "Markus Lanz (ZDF)",
    episode_label: "Sendung vom 22.10.2025 (Folge #2140)",
    url: "https://www.zdf.de/video/talk/markus-lanz-114/markus-lanz-vom-22-oktober-2025-100",
    video_id: "markus-lanz-vom-22-oktober-2025-100",
    published_at: "2025-10-22",
    duration_label: "ca. 75 Min",
    format: "tv",
    other_speakers: "weitere Gäste — meist Journalist:innen + Experten",
    politician_desc: "Bundestagspräsidentin seit März 2025, CDU, ehemalige Bundeslandwirtschaftsministerin 2018-2021",
  },
  {
    custom_id: "banaszak-lanz-2026-05-20",
    politician_id: 145959,
    politician: "Felix Banaszak",
    host: "Markus Lanz",
    publisher: "Markus Lanz (ZDF)",
    episode_label: "Sendung vom 20.05.2026",
    url: "https://www.zdf.de/video/talk/markus-lanz-114/markus-lanz-vom-20-mai-2026-100",
    video_id: "markus-lanz-vom-20-mai-2026-100",
    published_at: "2026-05-20",
    duration_label: "1h 14min",
    format: "tv",
    other_speakers: "Sepp Müller (CDU, MdB, Wirtschaftspolitiker), Eva Quadbeck (Chefredakteurin Redaktionsnetzwerk Deutschland — Journalistin, kommentiert Politik), Sarah Tacke (ZDF-Reporterin — kommentiert ihre Bürgergeld-Dokumentation)",
    politician_desc: "Co-Vorsitzender Bündnis 90/Die Grünen seit 2024, MdB. Themen typisch: Ost-Wahlkämpfe 2025, AfD-Umgang, Bürgergeld-Reform aus Grünen-Perspektive. Spricht aus Opposition-Sicht, kritisch zur Merz-Regierung",
  },
  // ─── TEST 2026-06-02: andere Talkshows, ARD-Pfad validieren ───
  {
    custom_id: "gysi-maischberger-2026-05-12",
    politician_id: 79334,
    politician: "Gregor Gysi",
    host: "Sandra Maischberger",
    publisher: "maischberger (ARD)",
    episode_label: "Sendung vom 12.05.2026",
    url: "https://www.ardmediathek.de/video/Y3JpZDovL3dkci5kZS9CZWl0cmFnLXNvcGhvcmEtMThhNWJiNzEtOWIwNS00YjkxLWI5YjgtZTc1N2NmNTk0YjI1",
    video_id: "maischberger-2026-05-12",
    published_at: "2026-05-12",
    duration_label: "ca. 70 Min",
    format: "tv",
    other_speakers: "Thomas de Maizière (CDU, ehem. Bundesinnenminister) — diskutiert mit Gysi über Koalitionsstreit. Maischberger-Folgen haben mehrere getrennte Gesprächsblöcke; weitere Gäste können im Transkript vorkommen.",
    politician_desc: "Gregor Gysi, Die Linke, MdB, Alterspräsident des Bundestags; langjährige Galionsfigur der Linken, außenpolitisch profiliert, oppositionelle Perspektive.",
  },
  {
    custom_id: "kluessendorf-hartaberfair-2026-04-20",
    politician_id: 175503,
    politician: "Tim Klüssendorf",
    host: "Louis Klamroth",
    publisher: "hart aber fair (ARD)",
    episode_label: "Sendung vom 20.04.2026",
    url: "https://www.ardmediathek.de/video/Y3JpZDovL3dkci5kZS9CZWl0cmFnLXNvcGhvcmEtOTgxMDRlNjUtNGRhYi00ODEzLWIzNTYtM2QzMDAyZWM3YjEz",
    video_id: "hart-aber-fair-2026-04-20",
    published_at: "2026-04-20",
    duration_label: "ca. 75 Min",
    format: "tv",
    other_speakers: "Panel zu Spritpreisen und Tankrabatt, u.a. eine Unternehmerin; weitere Diskutant:innen aus Wirtschaft/Verbänden möglich.",
    politician_desc: "Tim Klüssendorf, SPD, MdB; Finanz- und Haushaltspolitiker. Vertritt die SPD-Position zu Energiepreisen und Entlastungen.",
  },
  {
    custom_id: "merz-miosga-2026-05-03",
    politician_id: 118559,
    politician: "Friedrich Merz",
    host: "Caren Miosga",
    publisher: "Caren Miosga (ARD)",
    episode_label: "Sendung vom 03.05.2026",
    url: "https://www.ardmediathek.de/video/Y3JpZDovL25kci5kZS8zZGFlMGExZS01MGYwLTQyZTYtYTc3Yy00MmFlZTQzNzVjZDBfZ2FuemVTZW5kdW5n",
    video_id: "caren-miosga-2026-05-03",
    published_at: "2026-05-03",
    duration_label: "ca. 45 Min",
    format: "tv",
    politician_desc: "Friedrich Merz, CDU, MdB, Bundeskanzler seit 2025. Einzelinterview (1-on-1) zum ersten Jahr seiner Kanzlerschaft.",
  },
];

/* ─── Submit ────────────────────────────────────────────────── */

async function submit() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const tmpDir = path.join(process.cwd(), ".tmp-media");
  const requests: any[] = [];
  const transcriptShas: Record<string, { sha: string; chars: number; lines: number }> = {};

  // Filter: nur ausgewählte custom_ids submitten (wenn --include angegeben)
  const toSubmit = INCLUDE_IDS
    ? APPEARANCES.filter(a => INCLUDE_IDS.has(a.custom_id))
    : APPEARANCES;
  if (toSubmit.length === 0) {
    console.error(`Keine Appearances passen zu --include ${[...(INCLUDE_IDS ?? [])].join(",")}`);
    process.exit(1);
  }
  console.log(`Submitting ${toSubmit.length} Appearances:`);

  for (const a of toSubmit) {
    // Untertitel: ZDF nutzt .deu., YouTube .de-orig.
    const isZdf = /zdf\.de\//.test(a.url) || /ardmediathek\.de\//.test(a.url);
    const subSuffix = isZdf ? ".deu.vtt" : ".de-orig.vtt";
    const vttPath = path.join(tmpDir, `${a.video_id}${subSuffix}`);
    if (!fs.existsSync(vttPath)) {
      console.error(`VTT fehlt: ${vttPath}`);
      process.exit(1);
    }
    const parsed = parseVTT(fs.readFileSync(vttPath, "utf-8"));
    const transcript = captionsToProse(parsed);
    const sha = createHash("sha256").update(transcript).digest("hex").slice(0, 16);
    transcriptShas[a.custom_id] = { sha, chars: transcript.length, lines: parsed.lines.length };
    const speakerInfo = parsed.hasSpeakerMarkers
      ? ` · Speaker: ${Object.entries(parsed.speakerCounts).map(([k,v]) => `${k}:${v}`).join(", ")}`
      : a.other_speakers ? " [MULTI-SPEAKER]" : "";
    console.log(`  ✓ ${a.custom_id}: ${parsed.lines.length} Lines, ${transcript.length.toLocaleString()} Zeichen (${a.duration_label})${speakerInfo}`);

    requests.push({
      custom_id: a.custom_id,
      params: {
        model: MODEL,
        max_tokens: 32000,
        system: buildSystemPrompt({
          politician: a.politician,
          host: a.host,
          otherSpeakers: a.other_speakers,
          politicianDesc: a.politician_desc,
          hasSpeakerTags: parsed.hasSpeakerMarkers,
          speakerCounts: parsed.speakerCounts,
        }),
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "tool", name: "analyze_appearance" },
        messages: [{ role: "user", content: `TRANSKRIPT:\n\n${transcript}` }],
      },
    });
  }

  console.log(`\n→ Submitte Batch mit ${requests.length} Requests an Anthropic ...`);
  const batch = await client.messages.batches.create({ requests });
  console.log(`✓ Batch-ID: ${batch.id}`);
  console.log(`✓ Status: ${batch.processing_status}`);
  console.log(`✓ Expires: ${batch.expires_at}`);

  fs.writeFileSync(STATE_PATH, JSON.stringify({
    batch_id: batch.id,
    submitted_at: new Date().toISOString(),
    appearances: toSubmit,
    transcript_shas: transcriptShas,
  }, null, 2));
  console.log(`✓ State gespeichert: ${STATE_PATH}`);
  console.log(`\nNächste Schritte:`);
  console.log(`  npx tsx scripts/batch-media-analyses.ts --status`);
  console.log(`  npx tsx scripts/batch-media-analyses.ts --apply   # wenn ended`);
}

/* ─── Status ────────────────────────────────────────────────── */

async function status() {
  if (!fs.existsSync(STATE_PATH)) {
    console.error("State-File fehlt — erst --submit laufen lassen.");
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const batch = await client.messages.batches.retrieve(state.batch_id);
  console.log(`Batch-ID: ${batch.id}`);
  console.log(`Status:   ${batch.processing_status}`);
  console.log(`Requests: ${batch.request_counts.processing} in-progress, ${batch.request_counts.succeeded} succeeded, ${batch.request_counts.errored} errored, ${batch.request_counts.canceled} canceled, ${batch.request_counts.expired} expired`);
  console.log(`Created:  ${batch.created_at}`);
  console.log(`Expires:  ${batch.expires_at}`);
  if (batch.ended_at) console.log(`Ended:    ${batch.ended_at}`);
}

/* ─── Apply ─────────────────────────────────────────────────── */

async function apply() {
  if (!fs.existsSync(STATE_PATH)) {
    console.error("State-File fehlt.");
    process.exit(1);
  }
  const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const batch = await client.messages.batches.retrieve(state.batch_id);
  if (batch.processing_status !== "ended") {
    console.error(`Batch noch nicht ended (Status: ${batch.processing_status}). Erst --status checken.`);
    process.exit(1);
  }

  const outputDir = path.join(process.cwd(), "data", "media-analyses");
  fs.mkdirSync(outputDir, { recursive: true });

  const appearancesByCustomId = new Map<string, Appearance>(state.appearances.map((a: Appearance) => [a.custom_id, a]));
  let savedCount = 0;
  let errorCount = 0;

  // Hilfsfunktionen für Validation + Sort
  const sortThemesByStart = (themes: any[]): any[] => {
    const startSec = (range: string): number => {
      const m = range?.match(/^(\d{2}):(\d{2}):(\d{2})/);
      return m ? Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) : 0;
    };
    return [...themes].sort((a, b) => startSec(a.timestamp_range) - startSec(b.timestamp_range));
  };

  const validateQuotes = (themes: any[], transcript: string) => {
    const normalize = (s: string) => s.replace(/[„""„""]/g, '"').replace(/[—–-]/g, ' ').replace(/[.,;:!?()]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
    const tokenize = (s: string) => normalize(s).split(/\s+/).filter(w => w.length >= 3);
    const haystackText = normalize(transcript);
    const haystackTokens = new Set(tokenize(transcript));
    let validExact = 0, validFuzzy = 0, invalid = 0;
    for (const theme of themes) {
      for (const q of (theme.quotes ?? [])) {
        const needleText = normalize(q.text);
        if (haystackText.includes(needleText)) { validExact++; continue; }
        const needleTokens = tokenize(q.text);
        if (needleTokens.length === 0) { invalid++; continue; }
        const ratio = needleTokens.filter(t => haystackTokens.has(t)).length / needleTokens.length;
        if (ratio >= 0.80) validFuzzy++; else invalid++;
      }
    }
    return { valid_exact: validExact, valid_fuzzy: validFuzzy, invalid };
  };

  for await (const result of await client.messages.batches.results(state.batch_id)) {
    const a = appearancesByCustomId.get(result.custom_id);
    if (!a) { console.warn(`Unknown custom_id: ${result.custom_id}`); continue; }
    if (result.result.type !== "succeeded") {
      console.error(`✗ ${result.custom_id}: ${result.result.type} — ${JSON.stringify((result.result as any).error)}`);
      errorCount++;
      continue;
    }
    const msg = result.result.message;
    const toolUse = msg.content.find((b: any) => b.type === "tool_use");
    if (!toolUse) {
      console.error(`✗ ${result.custom_id}: kein tool_use Block`);
      errorCount++;
      continue;
    }
    const analysisResult: any = (toolUse as any).input;
    // FIX: LLM gibt themes manchmal als JSON-String statt Array (Tool-Use-Quirk).
    // Zwei Bug-Varianten:
    // a) themes ist direkt ein String (Aeikens-Fall)
    // b) themes ist Array<char> — der SDK hat den String char-by-char serialisiert
    const themes = analysisResult.themes;
    const isStringBug =
      typeof themes === "string" ||
      (Array.isArray(themes) && themes.length > 0 && typeof themes[0] === "string" && themes[0].length === 1);
    if (isStringBug) {
      const joined = typeof themes === "string" ? themes : themes.join("");
      const tryParse = (input: string) => {
        try { return JSON.parse(input); } catch { return null; }
      };
      // Versuch 1: direkt
      let parsed = tryParse(joined);
      // Versuch 2: German-Quote-Fix (ASCII " innerhalb deutscher „..."-Paare)
      if (!parsed) parsed = tryParse(joined.replace(/(„[^"„]*?)"/g, "$1“"));
      if (parsed) {
        analysisResult.themes = parsed;
        console.log(`  ⚠ ${result.custom_id}: themes war JSON-String/Char-Array, repariert (${parsed.length} Themen)`);
      } else {
        console.error(`  ✗ ${result.custom_id}: themes-JSON-String nicht parsbar — bleibt korrupt`);
      }
    }
    // Themen sortieren
    if (analysisResult.themes && Array.isArray(analysisResult.themes)) analysisResult.themes = sortThemesByStart(analysisResult.themes);

    // Transkript für Validation neu parsen
    const isZdf = /zdf\.de\//.test(a.url) || /ardmediathek\.de\//.test(a.url);
    const vttSuffix = isZdf ? ".deu.vtt" : ".de-orig.vtt";
    const vttPath = path.join(process.cwd(), ".tmp-media", `${a.video_id}${vttSuffix}`);
    const parsed = parseVTT(fs.readFileSync(vttPath, "utf-8"));
    const transcript = captionsToProse(parsed);
    const validation = validateQuotes(analysisResult.themes ?? [], transcript);
    const totalQuotes = validation.valid_exact + validation.valid_fuzzy + validation.invalid;
    const validPct = totalQuotes > 0 ? ((validation.valid_exact + validation.valid_fuzzy) / totalQuotes * 100).toFixed(1) : "n/a";

    // Antwort-Typ-Verteilung
    const answerTypeCounts: Record<string, number> = {};
    for (const t of (analysisResult.themes ?? [])) {
      const at = t.answer_type ?? "unknown";
      answerTypeCounts[at] = (answerTypeCounts[at] ?? 0) + 1;
    }

    const transcriptInfo = state.transcript_shas[a.custom_id];
    const tokensIn = msg.usage.input_tokens;
    const tokensOut = msg.usage.output_tokens;
    const costUSD = (tokensIn / 1_000_000) * 0.40 + (tokensOut / 1_000_000) * 2.0;  // Batch = 50 % Rabatt

    const output = {
      _meta: {
        url: a.url,
        video_id: a.video_id,
        politician: a.politician,
        host: a.host,
        publisher: a.publisher,
        transcript_sha: transcriptInfo.sha,
        transcript_chars: transcriptInfo.chars,
        caption_lines: transcriptInfo.lines,
        model: MODEL,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUSD,
        quote_validation: { ...validation, valid_pct: validPct },
        answer_type_distribution: answerTypeCounts,
        generated_at: new Date().toISOString(),
        batch_id: state.batch_id,
      },
      _methodology: {
        transcript_source: /ardmediathek\.de/.test(a.url) ? "ARD-Mediathek Redaktions-Untertitel (deu)"
          : /zdf\.de/.test(a.url) ? "ZDF-Mediathek Redaktions-Untertitel (deu)"
          : "YouTube Auto-Caption (de-orig)",
        transcript_caveat: /youtube\.com|youtu\.be/.test(a.url)
          ? "Auto-generated, ~5-10 % Eigennamen-Fehler erwartet, vom LLM still korrigiert."
          : "Redaktionelle Untertitel (Hörgeschädigten-Fassung), nah am Wortlaut; vereinzelt gekürzt/paraphrasiert.",
        classification_caveat: "Antwort-Typ-Klassifikation ist eine LLM-Auslegung, kein etabliertes politikwissenschaftliches Coding-Schema. Keine Inter-Annotator-Agreement-Studie. Ein Symmetrie-Audit über ≥ 20 Politiker:innen verschiedener Fraktionen ist erforderlich, BEVOR die Klassifikation öffentlich angezeigt wird.",
        ui_display_hint: "Bis Symmetrie-Audit abgeschlossen ist, sollten answer_type-Klassifikationen nur mit neutralen Begriffen ('Antwort zu anderem Bezugspunkt') angezeigt werden. Original-Zitat + question_asked müssen IMMER mit verlinkt sein.",
        methodology_version: "v0.1-phase2",
      },
      analysis: analysisResult,
    };

    const outPath = path.join(outputDir, `${a.custom_id}.json`);
    fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
    console.log(`✓ ${a.custom_id}: ${analysisResult.themes?.length ?? 0} Themen, ${validPct}% valid, $${costUSD.toFixed(4)}`);
    savedCount++;
  }

  console.log(`\n${savedCount} Analysen gespeichert, ${errorCount} Fehler.`);

  // Auch Index-JSON updaten
  const indexPath = path.join(process.cwd(), "data", "media-appearances.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
  const existingIds = new Set(index.appearances.map((x: any) => x.id));
  // Nur die in DIESEM Batch verarbeiteten Auftritte zum Index hinzufügen
  for (const a of state.appearances) {
    if (existingIds.has(a.custom_id)) continue;
    index.appearances.push({
      id: a.custom_id,
      politician_id: a.politician_id,
      politician_display: a.politician,
      format: a.format ?? "podcast",
      publisher: a.publisher,
      host: a.host,
      title: `${a.politician} bei ${a.publisher}`,
      episode_label: a.episode_label,
      url: a.url,
      published_at: a.published_at,
      duration_label: a.duration_label,
      video_id: a.video_id,
      analysis_file: `${a.custom_id}.json`,
    });
  }
  index._meta.last_updated = new Date().toISOString().split("T")[0];
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log(`✓ Index ${indexPath} aktualisiert (${index.appearances.length} Auftritte total)`);
}

/* ─── Main ──────────────────────────────────────────────────── */

(async () => {
  try {
    if (DO_SUBMIT) await submit();
    else if (DO_STATUS) await status();
    else if (DO_APPLY) await apply();
  } catch (e) {
    console.error("FAILED:", e);
    process.exit(1);
  }
})();
