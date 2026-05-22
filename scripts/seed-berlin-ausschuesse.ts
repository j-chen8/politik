/**
 * Berlin-Pilot: scrapt die Ausschuss-Mitgliedschaften der 19. WP von der
 * offiziellen Seite des Abgeordnetenhauses (parlament-berlin.de) und schreibt
 * sie nach committee_memberships.
 *
 * abgeordnetenwatch hat für Berlin 0 Ausschuss-Mitgliedschaften. Die
 * offizielle Seite listet pro Ausschuss alle ordentlichen Mitglieder samt
 * Rolle (Vorsitz / stellv. Vorsitz / Schriftführung / Sprecher:in).
 * Stellvertretende Mitglieder führt die HTML-Seite nicht — fehlen also bewusst.
 *
 * Mitgliedschaft = Fakt (nicht urheberrechtlich geschützt). committee_id /
 * membership-id werden synthetisch im Bereich 92xxx / 92_000_000+ vergeben,
 * kollisionsfrei zu den abgeordnetenwatch-Daten (committee_id ≤ 6484).
 *
 * Run: npx tsx scripts/seed-berlin-ausschuesse.ts [--dry-run]
 */

import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");
const BASE = "https://www.parlament-berlin.de";
const OVERVIEW = `${BASE}/das-parlament/ausschuesse`;
const USER_AGENT = "politik-radar/1.0 (https://github.com/opoi1/politik)";
const BERLIN_PARLIAMENT_ID_LOCAL = 2;
const COMMITTEE_ID_BASE = 92_000;       // synthetische committee_id
const MEMBERSHIP_ID_BASE = 92_000_000;  // synthetische membership-id
const DELAY_MS = 400;

const DRY_RUN = process.argv.includes("--dry-run");

// ── Helpers ──

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/&szlig;/g, "ß").replace(/&auml;/g, "ä").replace(/&ouml;/g, "ö")
    .replace(/&uuml;/g, "ü").replace(/&Auml;/g, "Ä").replace(/&Ouml;/g, "Ö")
    .replace(/&Uuml;/g, "Ü");
}

function stripTags(s: string): string {
  return decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/ß/g, "ss")
    .replace(/[''‚'"„""«»]/g, "")
    .replace(/[-‐‑‒–—]/g, " ")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTitle(name: string): string {
  // Führende akademische / Mandats-Titel abschneiden (z. B. "Prof. Dr. Martin
  // Pätzold" → "Martin Pätzold"). \b scheitert nach dem Punkt — daher als
  // Token-Lauf am Wortanfang gematcht.
  return name
    .replace(/^(?:(?:Prof\.|Dr\.|Dipl\.[A-Za-zÄÖÜäöü-]*\.?|Mag\.|h\.c\.|MdB|MdL|MdA|MdEP)\s*)+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchHtml(url: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (res.status === 429) { await sleep(8000); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (attempt === 2) throw e;
      await sleep(2000);
    }
  }
  return "";
}

// ── Rollen-Klassifikation ──

const ROLE_PRIO = ["chairperson", "vice_chairperson", "schriftfuehrer", "spokesperson", "member"];

function classifyPosition(pos: string): string | null {
  const p = pos.toLowerCase();
  if (/vorsitzend/.test(p)) return /stellv|stv\.?/.test(p) ? "vice_chairperson" : "chairperson";
  // eigener Wert (NICHT abgeordnetenwatchs "foreperson" = Obmann/Obfrau)
  if (/schriftführer/.test(p)) return "schriftfuehrer";
  if (/sprecher/.test(p)) return "spokesperson";
  return null;
}

/** Aus mehreren Positionsangaben die höchstrangige Rolle wählen. */
function pickRole(positions: string[]): string {
  let best = "member";
  for (const pos of positions) {
    const r = classifyPosition(pos);
    if (r && ROLE_PRIO.indexOf(r) < ROLE_PRIO.indexOf(best)) best = r;
  }
  return best;
}

// ── Parsing ──

interface ScrapedMember {
  name: string;
  role: string;
}

function parseCommittee(html: string): { title: string; members: ScrapedMember[] } {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  const title = h1 ? stripTags(h1[1]) : "(unbekannt)";

  const members: ScrapedMember[] = [];
  for (const block of html.split(/<article class="person-list-wrapper">/).slice(1)) {
    const nameM = block.match(/person-list-name"[^>]*>([\s\S]*?)<\/a>/);
    if (!nameM) continue;
    const name = stripTitle(stripTags(nameM[1]));
    if (!name) continue;
    const posUl = block.match(/person-list-positions[^>]*>([\s\S]*?)<\/ul>/);
    const positions = posUl
      ? [...posUl[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => stripTags(m[1]))
      : [];
    members.push({ name, role: pickRole(positions) });
  }
  return { title, members };
}

// ── Main ──

async function main() {
  console.log("→ Ausschuss-Übersicht laden…");
  const overview = await fetchHtml(OVERVIEW);
  const slugs = Array.from(
    new Set([...overview.matchAll(/\/Ausschuesse\/(19-[a-z0-9-]+)/g)].map((m) => m[1]))
  ).sort();
  console.log(`  ${slugs.length} Ausschüsse`);

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 30000"); // toleriert parallel laufende Schreiber

  // Berlin-MdL: Name → { politician_id, mandate_id }
  const locals = db
    .prepare(
      `SELECT p.id AS pid, m.id AS mid, p.first_name, p.last_name
       FROM politicians p
       JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = ?`
    )
    .all(BERLIN_PARLIAMENT_ID_LOCAL) as { pid: number; mid: number; first_name: string; last_name: string }[];
  const byName = new Map<string, { pid: number; mid: number }>();
  const byLastFirst = new Map<string, { pid: number; mid: number }[]>();
  for (const l of locals) {
    const entry = { pid: l.pid, mid: l.mid };
    byName.set(normalize(`${l.first_name} ${l.last_name}`), entry);
    // Fallback-Schlüssel: letztes Nachnamens-Wort + erstes Vornamens-Wort
    // (deckt Mittelnamen/Initialen ab, z. B. "Gunnar N. Lindemann").
    const lw = normalize(l.last_name).split(" ").slice(-1)[0];
    const fw = normalize(l.first_name).split(" ")[0];
    const key = `${lw}|${fw}`;
    (byLastFirst.get(key) ?? byLastFirst.set(key, []).get(key)!).push(entry);
  }
  const lookup = (name: string): { pid: number; mid: number } | undefined => {
    const exact = byName.get(normalize(name));
    if (exact) return exact;
    const toks = normalize(name).split(" ").filter(Boolean);
    if (toks.length < 2) return undefined;
    const cands = byLastFirst.get(`${toks[toks.length - 1]}|${toks[0]}`);
    return cands && cands.length === 1 ? cands[0] : undefined; // nur eindeutige Treffer
  };

  // Scrapen
  interface Row { membershipId: number; mandateId: number; politicianId: number;
                  committeeId: number; committeeLabel: string; role: string; }
  const rows: Row[] = [];
  const unmatched = new Set<string>();
  let memberSeq = 0;

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    const committeeId = COMMITTEE_ID_BASE + i + 1;
    const html = await fetchHtml(`${BASE}/Ausschuesse/${slug}`);
    const { title, members } = parseCommittee(html);
    let matched = 0;
    for (const m of members) {
      const loc = lookup(m.name);
      if (!loc) { unmatched.add(`${m.name} [${slug}]`); continue; }
      matched++;
      rows.push({
        membershipId: MEMBERSHIP_ID_BASE + ++memberSeq,
        mandateId: loc.mid,
        politicianId: loc.pid,
        committeeId,
        committeeLabel: title,
        role: m.role,
      });
    }
    console.log(`  [${i + 1}/${slugs.length}] ${title}: ${matched}/${members.length} MdL`);
    if (i < slugs.length - 1) await sleep(DELAY_MS);
  }

  const roleCounts: Record<string, number> = {};
  for (const r of rows) roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1;
  console.log(`\n  ${rows.length} Mitgliedschaften, Rollen: ${JSON.stringify(roleCounts)}`);
  console.log(`  ${unmatched.size} nicht gematchte Namen (Nicht-MdL / Senator:innen)`);
  if (unmatched.size) for (const u of unmatched) console.log(`    · ${u}`);

  if (DRY_RUN) {
    console.log("\n[DRY RUN] kein DB-Schreibzugriff.");
    db.close();
    return;
  }

  // Idempotent: Berlin-Bereich (committee_id ≥ 92000) ersetzen
  const tx = db.transaction(() => {
    db.prepare(`DELETE FROM committee_memberships WHERE committee_id >= ?`).run(COMMITTEE_ID_BASE);
    const ins = db.prepare(
      `INSERT INTO committee_memberships
         (id, mandate_id, politician_id, committee_id, committee_label, committee_role)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    for (const r of rows) {
      ins.run(r.membershipId, r.mandateId, r.politicianId, r.committeeId, r.committeeLabel, r.role);
    }
  });
  tx();

  console.log(`\n=== Fertig === ${rows.length} Ausschuss-Mitgliedschaften geschrieben.`);
  db.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
