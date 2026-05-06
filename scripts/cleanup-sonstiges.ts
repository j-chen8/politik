/**
 * 3-Stufen-Cleanup für cv_homepage_json.sonstiges:
 *
 *   Stufe 1: HTML-Entity-Decode (deterministisch)
 *   Stufe 2: Whitelist-Heuristik (deterministisch) → KEEP_AUTO_MITGLIEDSCHAFT
 *   Stufe 3: Haiku-4.5-Klassifikator (LLM) für Rest → 7 Klassen
 *
 * Konservativer Default: bei Unsicherheit KEEP, lieber etwas Müll behalten als
 * echte Items wegwerfen.
 *
 * Audit-Trail: cv_repair_log mit repair_version='homepage-sonstiges-cleanup-v1'.
 *
 * Run:
 *   npx tsx scripts/cleanup-sonstiges.ts                # Dry-Run
 *   npx tsx scripts/cleanup-sonstiges.ts --apply        # tatsächlich
 *   npx tsx scripts/cleanup-sonstiges.ts --limit 50     # nur 50 MdBs (zum Testen)
 */

import Database from "better-sqlite3";
import Anthropic from "@anthropic-ai/sdk";
import path from "path";
import fs from "fs";

const ENV_PATH = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV_PATH)) {
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const DB_PATH = path.join(process.cwd(), "politik.db");
const APPLY = process.argv.includes("--apply");
const LIMIT_IDX = process.argv.indexOf("--limit");
const LIMIT = LIMIT_IDX > -1 ? parseInt(process.argv[LIMIT_IDX + 1], 10) : 0;
const VERSION = "homepage-sonstiges-cleanup-v1";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY fehlt in .env");
  process.exit(1);
}
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = "claude-haiku-4-5";

// ── Stufe 1: HTML-Decode ─────────────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
  "&uuml;": "ü", "&Uuml;": "Ü",
  "&auml;": "ä", "&Auml;": "Ä",
  "&ouml;": "ö", "&Ouml;": "Ö",
  "&szlig;": "ß",
  "&amp;": "&",
  "&quot;": "\"",
  "&apos;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
};

function htmlDecode(s: string): { decoded: string; changed: boolean } {
  let out = s;
  for (const [k, v] of Object.entries(HTML_ENTITIES)) {
    out = out.split(k).join(v);
  }
  return { decoded: out, changed: out !== s };
}

// ── Stufe 2: Whitelist-Heuristik ─────────────────────────────────

const KEEP_PATTERNS: RegExp[] = [
  /\be\.\s?V\.?\s*$/i,         // endet mit e.V.
  /\bMitglied(schaft|er)?\b/i,
  /\bVorsitz(end[er]+)?\b/i,
  /\bStellvertret/i,
  /\bSchatzmeister/i,
  /\bSchriftführer/i,
  /\bBeisitzer/i,
  /\bStiftung/i,
  /\bKuratorium/i,
  /\bAusschuss/i,
  /\bBeirat/i,
  /\bParlamentariergruppe/i,
  /\bParlamentskreis/i,
  /\bArbeitskreis/i,
  /\bArbeitsgemeinschaft/i,
  /\bStipendiat/i,
  /\bFreiwillige.{0,3}Feuerwehr/i,
  /\bRettungs/i,
  /\bGewerkschaft/i,
  /\bDelegation/i,
  /\bObmann\b/i,
  /\bObfrau\b/i,
  /\bSchirmherr/i,
  /\bGründungs(mitglied|partner)/i,
  /\bFördermitglied/i,
  /\bEhren(mitglied|vorsitz|kreis|bürger)/i,
  /\bAkademie\b/i,
  /\bVerein\b/i,
  /\bVerband\b/i,
  /\bKommission\b/i,
  /\bKreisrat\b/i,
  /\bGemeinderat\b/i,
  /\bStadtrat\b/i,
  /\bBundestag\b/i,
  /\bLandtag\b/i,
  /\bAussch(uss|üsse)/i,
  /\bRichterwahl/i,
  /\bBundeswehr-?Sozialwerk/i,
  /\bGenossenschaft/i,
  /\bFörderverein/i,
  /\bFreundeskreis/i,
  /\bBürgerinitiative/i,
  /\bBürgerverein/i,
  /\bHeimatverein/i,
  /\bIG\s+(Metall|BCE|BAU|CE|Medien)/i,
  /\bver\.di\b/i,
  /\bDLRG\b/i,
  /\bAWO\b/i,
  /\bThemis\b/i,
  /\bAmnesty\b/i,
  /\bPräsident/i,
  /\bVizepräsident/i,
  /\bSchutz(gemeinschaft|verband)/i,
  /\bAusgebildete/i,
];

function matchesWhitelist(text: string): boolean {
  for (const p of KEEP_PATTERNS) if (p.test(text)) return true;
  return false;
}

// ── Stufe 3: Haiku-Klassifikator ─────────────────────────────────

const CLASSES = ["KEEP_MITGLIEDSCHAFT", "KEEP_HOBBY", "KEEP_PUBLIKATION", "KEEP_AUSZEICHNUNG", "DROP_LIEBLINGS_X", "DROP_NEWS_BLOG", "DROP_HEADER"] as const;
type ClsType = (typeof CLASSES)[number];

const SYSTEM_PROMPT = `Du klassifizierst Einträge der CV-Sektion "sonstiges" eines deutschen Politikers, extrahiert aus dessen persönlicher Webseite. Aufgabe: pro Eintrag genau eine von 7 Klassen wählen.

KEEP-Klassen (im CV behalten):
- KEEP_MITGLIEDSCHAFT: formelle Mitgliedschaft, Funktion, Beirat, Stiftung, Verein, Gewerkschaft, Ausschuss, Parlamentariergruppe
- KEEP_HOBBY: Hobby, Sport-Aktivität, Lieblings-Verein, Mehrgenre-Liste (z.B. "Klassik, Indie, Hip-Hop"), persönliches Interesse als Aktivität
- KEEP_PUBLIKATION: konkrete Veröffentlichung mit Titel/Verlag (Buch, Aufsatz)
- KEEP_AUSZEICHNUNG: Preis, Orden, Ehrennadel, Stipendium

DROP-Klassen (raus aus CV):
- DROP_LIEBLINGS_X: bloßer Personen-/Buch-/Pflanzen-/Getränk-/Wort-Name als Lieblings-X (z.B. "Henning Mankell", "Sonnenblume", "Mineralwasser", "Twende", "Whoopy Goldberg", "Tansania" als Lieblings-Reiseziel)
- DROP_NEWS_BLOG: Blog-Post-Titel, Pressemitteilung, Veranstaltungs-Notiz, Kampagnen-Slogan, politische Statement-Titel (z.B. "Stadtbild-Debatte", "Meine Reise nach X", "75 Jahre THW", "Ja zum Stadtteilpark", "X kommt!", "feministische Haltung prägt meine Außenpolitik")
- DROP_HEADER: leere Pseudo-Sektions-Überschrift OHNE eigenen Inhalt (z.B. allein "Mitgliedschaften im Deutschen Bundestag", "Gesellschaftspolitisches Engagement", leerer String)

KRITISCH — diese Fälle sind KEEP, NICHT DROP:
- "Mitgliedschaften: X, Y, Z" mit ECHTEN Vereinen/Organisationen im Doppelpunkt-Teil → KEEP_MITGLIEDSCHAFT (Mega-Liste, behalten als ein Eintrag)
- Politische Funktionen / Mandate / Kandidaturen ("Direktkandidat", "MdB seit X", "Stadtrat", "Kreisvorsitzender Partei", "Landrat") → KEEP_MITGLIEDSCHAFT
- "Promotion" / "Diplom" / "Habilitation" alleinstehend → KEEP_MITGLIEDSCHAFT (Bildungsabschluss; auch wenn er besser in 'ausbildung' wäre — erstmal nicht wegwerfen)
- "Verheiratet" / Familienstand allein → DROP_HEADER (persönliche Notiz, kein CV-Item)
- "geboren am X in Y" → DROP_HEADER (Geburts-Info, gehört nicht in sonstiges)

Wichtig:
- Bei UNSICHERHEIT → konservativ KEEP_MITGLIEDSCHAFT oder KEEP_HOBBY wählen
- "1. FC Köln" alleinstehend = KEEP_HOBBY (Lieblings-Verein als Aktivität)
- "Henning Mankell" alleinstehend = DROP_LIEBLINGS_X (nur Personen-Name)
- Karriere-Anekdoten ("Pizza-Ausfahrer in der Goldenen Taverne") = KEEP_HOBBY
- "Urlaub im Wohnwagen" = KEEP_HOBBY (Reise-/Freizeitaktivität)
- Sport-Anekdoten ("Bungee-Sprung", "Tandemsprung beim Geburtstag", "Radtour von X nach Y") = DROP_NEWS_BLOG (Veranstaltungs-Notiz, kein Hobby)

Antworte NUR mit JSON: {"klasse": "...", "begründung": "<1 Satz>"}`;

interface ItemDecision {
  text: string;
  textOriginal: string;
  htmlChanged: boolean;
  decision: "KEEP_AUTO" | ClsType;
  reason: string;
  inputTokens?: number;
  outputTokens?: number;
}

async function classifyLLM(text: string): Promise<{ klasse: ClsType; begruendung: string; in: number; out: number }> {
  try {
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 256,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: `EINTRAG: "${text}"\n\nKlassifiziere und antworte als JSON.` }],
    });
    const content = resp.content.filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const m = content.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(m ? m[0] : content);
    const v = String(parsed.klasse ?? "").trim().toUpperCase();
    const klasse = (CLASSES as readonly string[]).includes(v) ? (v as ClsType) : "KEEP_MITGLIEDSCHAFT";
    return {
      klasse,
      begruendung: String(parsed.begründung ?? parsed.reason ?? "").slice(0, 200),
      in: resp.usage.input_tokens, out: resp.usage.output_tokens,
    };
  } catch (e: any) {
    return { klasse: "KEEP_MITGLIEDSCHAFT", begruendung: `LLM-Fehler: ${e.message?.slice(0, 80)}, konservativ KEEP`, in: 0, out: 0 };
  }
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  const db = new Database(DB_PATH);

  let sql = `SELECT id, first_name, last_name, cv_homepage_json
             FROM politicians
             WHERE cv_homepage_json IS NOT NULL`;
  if (LIMIT > 0) sql += ` LIMIT ${LIMIT}`;
  const rows = db.prepare(sql).all() as Array<{ id: number; first_name: string; last_name: string; cv_homepage_json: string }>;

  console.log(`${rows.length} MdBs zu prüfen\n`);

  const insertLog = db.prepare(`
    INSERT INTO cv_repair_log (politician_id, applied_at, repair_version, action,
      section, target_index, original_entry, new_entry, reason, audit)
    VALUES (?, ?, ?, ?, 'sonstiges', ?, ?, ?, ?, ?)
  `);
  const updateCv = db.prepare(`UPDATE politicians SET cv_homepage_json = ? WHERE id = ?`);

  const tally: Record<string, number> = {};
  const sampleDrops: Array<{ name: string; text: string; cls: string }> = [];
  let totalItems = 0, totalKept = 0, totalDropped = 0, totalHtmlFixed = 0;
  let totalIn = 0, totalOut = 0, llmCalls = 0;
  let mdbsTouched = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const cv = JSON.parse(r.cv_homepage_json);
    const sonstiges = cv.sonstiges as Array<{ jahr: string; text: string }> | undefined;
    if (!Array.isArray(sonstiges) || sonstiges.length === 0) continue;

    const decisions: ItemDecision[] = [];
    for (const item of sonstiges) {
      totalItems += 1;
      const { decoded, changed } = htmlDecode(item.text);
      if (changed) totalHtmlFixed += 1;

      let decision: ItemDecision["decision"];
      let reason: string;
      let inTok = 0, outTok = 0;

      if (matchesWhitelist(decoded)) {
        decision = "KEEP_AUTO";
        reason = "whitelist match";
      } else {
        const cls = await classifyLLM(decoded);
        decision = cls.klasse;
        reason = cls.begruendung;
        inTok = cls.in;
        outTok = cls.out;
        llmCalls += 1;
        totalIn += inTok;
        totalOut += outTok;
      }

      decisions.push({
        text: decoded,
        textOriginal: item.text,
        htmlChanged: changed,
        decision,
        reason,
        inputTokens: inTok,
        outputTokens: outTok,
      });

      tally[decision] = (tally[decision] ?? 0) + 1;
    }

    const newSonstiges = decisions
      .map((d, idx) => ({ d, idx, item: sonstiges[idx] }))
      .filter(({ d }) => d.decision === "KEEP_AUTO" || d.decision.startsWith("KEEP_"))
      .map(({ d, item }) => ({ jahr: item.jahr, text: d.text }));

    const droppedCount = sonstiges.length - newSonstiges.length;
    totalKept += newSonstiges.length;
    totalDropped += droppedCount;

    const changed = droppedCount > 0 || decisions.some(d => d.htmlChanged);
    if (changed) mdbsTouched += 1;

    if (APPLY && changed) {
      // Sammle DROP- und HTML-Fix-Audits
      for (let idx = 0; idx < decisions.length; idx++) {
        const d = decisions[idx];
        const orig = sonstiges[idx];
        if (d.decision.startsWith("DROP_")) {
          insertLog.run(
            r.id, new Date().toISOString(), VERSION, "drop_text",
            idx, JSON.stringify(orig), null,
            `${d.decision}: ${d.reason}`,
            JSON.stringify({ source: VERSION, stage: "llm-classifier" })
          );
        } else if (d.htmlChanged && d.decision !== "KEEP_AUTO") {
          insertLog.run(
            r.id, new Date().toISOString(), VERSION, "set_text",
            idx, JSON.stringify(orig), JSON.stringify({ jahr: orig.jahr, text: d.text }),
            `HTML-Decode + ${d.decision}`,
            JSON.stringify({ source: VERSION, stage: "html-decode" })
          );
        } else if (d.htmlChanged) {
          insertLog.run(
            r.id, new Date().toISOString(), VERSION, "set_text",
            idx, JSON.stringify(orig), JSON.stringify({ jahr: orig.jahr, text: d.text }),
            "HTML-Decode (whitelisted KEEP)",
            JSON.stringify({ source: VERSION, stage: "html-decode" })
          );
        }
      }
      cv.sonstiges = newSonstiges;
      updateCv.run(JSON.stringify(cv), r.id);
    }

    if (droppedCount > 0 && sampleDrops.length < 25) {
      for (let idx = 0; idx < decisions.length; idx++) {
        const d = decisions[idx];
        if (d.decision.startsWith("DROP_") && sampleDrops.length < 25) {
          sampleDrops.push({
            name: `${r.first_name} ${r.last_name}`,
            text: d.text,
            cls: d.decision,
          });
        }
      }
    }

    if ((i + 1) % 25 === 0 || i === rows.length - 1) {
      const cost = (totalIn / 1_000_000) * 1.0 + (totalOut / 1_000_000) * 5.0;
      console.log(`  [${i + 1}/${rows.length}] items=${totalItems} kept=${totalKept} dropped=${totalDropped} html_fixed=${totalHtmlFixed} llm_calls=${llmCalls} cost=$${cost.toFixed(4)}`);
    }
  }

  db.close();

  console.log("\n=== Klassifikations-Übersicht ===");
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(24)} ${v}`);
  }

  const cost = (totalIn / 1_000_000) * 1.0 + (totalOut / 1_000_000) * 5.0;
  console.log(`\n=== Stats ===`);
  console.log(`Total Items:         ${totalItems}`);
  console.log(`KEPT:                ${totalKept}`);
  console.log(`DROPPED:             ${totalDropped}`);
  console.log(`HTML-fixed:          ${totalHtmlFixed}`);
  console.log(`MdBs touched:        ${mdbsTouched}`);
  console.log(`LLM calls:           ${llmCalls}`);
  console.log(`Tokens (in/out):     ${totalIn} / ${totalOut}`);
  console.log(`Cost:                $${cost.toFixed(4)}`);

  console.log(`\n=== Stichprobe DROPS (max 25) ===`);
  for (const s of sampleDrops) {
    console.log(`  [${s.cls}] ${s.name}: "${s.text.slice(0, 100)}"`);
  }

  if (!APPLY) console.log(`\n→ Mit --apply tatsächlich anwenden`);
}

main().catch(e => { console.error(e); process.exit(1); });
