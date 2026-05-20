/**
 * Vote↔Drucksache-Mapping gegen die AUTORITATIVE bundestag.de-Open-Data-
 * Filterlist namentlicher Abstimmungen (484422-484422).
 *
 * Hintergrund: Der alte SPA-Detailseiten-Scraper ist tot; der DIP-Hybrid war
 * ein Ersatz. Diese Filterlist ist die *echte* autoritative Quelle — pro
 * namentlicher Abstimmung: Datum, Titel, Subjekt-Drucksachen, Ergebnis
 * (Ja/Nein/Enthalten). Gleiche Mechanik wie fetch-plenar-xmls.ts.
 *
 * Befund 2026-05-19: Die Filterlist listet PRO Roll-Call die präzisen ~2
 * Subjekt-DS — die alten "verifizierten" 15-DS-Blöcke waren Über-Aggregation.
 *
 * Join bundestag-Eintrag → abgeordnetenwatch poll_id:
 *   primär Datum + Stimm-Vektor (Ja/Nein/Enth aus `votes` — quasi eindeutig),
 *   bestätigt per DS-Overlap + Titel-Tokens.
 *
 *   (default)   --diff : read-only; pro Poll bestehend vs. bundestag.de
 *   --apply            : drucksache_polls/audit_bundestag_polls autoritativ
 *                        neu (alte → drucksache_polls_pre_bt_filterlist)
 *   --json             : Maschinen-Output des Diffs
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const ENV = path.join(process.cwd(), ".env");
if (fs.existsSync(ENV))
  for (const l of fs.readFileSync(ENV, "utf-8").split("\n")) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }

const FL = "https://www.bundestag.de/ajax/filterlist/de/parlament/plenum/abstimmung/484422-484422";
const APPLY = process.argv.includes("--apply");
const JSON_OUT = process.argv.includes("--json");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface BtEntry {
  dateIso: string;
  title: string;
  ds: string[];
  ja: number | null;
  nein: number | null;
  enth: number | null;
}

function parsePage(html: string): BtEntry[] {
  const out: BtEntry[] = [];
  const segs = html
    .split(/(?=<div class="bt-teaser-text">)/)
    .filter((s) => s.includes("bt-teaser-haupttext"));
  for (const s of segs) {
    const dm = s.match(/bt-date">(\d{2})\.(\d{2})\.(\d{4})/);
    if (!dm) continue;
    const dateIso = `${dm[3]}-${dm[2]}-${dm[1]}`;
    const flat = s
      .replace(/<[^>]+>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const titleRaw = flat.split(/\(Drucksachen?|Bildinformationen/)[0];
    const title = titleRaw.replace(/^\d{2}\.\d{2}\.\d{4}\s*/, "").trim().slice(0, 240);
    const ds = [...new Set((s.match(/\b2[01]\/\d{3,5}\b/g) || []))].sort();
    const num = (re: RegExp) => {
      const m = s.match(re);
      return m ? parseInt(m[1], 10) : null;
    };
    out.push({
      dateIso,
      title,
      ds,
      ja: num(/bt-legend-ja">\s*<span>(\d+)/),
      nein: num(/bt-legend-nein">\s*<span>(\d+)/),
      enth: num(/bt-legend-enthalten">\s*<span>(\d+)/),
    });
  }
  return out;
}

async function fetchAll(stopBefore: string): Promise<BtEntry[]> {
  const all: BtEntry[] = [];
  for (let off = 0; off < 600; off += 10) {
    let html = "";
    for (let a = 0; a < 4; a++) {
      const res = await fetch(`${FL}?limit=10&offset=${off}&noFilterSet=true`, {
        headers: { "User-Agent": "politik-vote-map/1.0" },
      });
      if (res.ok) { html = await res.text(); break; }
      await sleep(1500 * (a + 1));
    }
    const page = parsePage(html);
    if (page.length === 0) break;
    all.push(...page);
    // Filterlist ist neueste-zuerst → sobald alle Einträge älter als nötig: stop
    if (page.every((e) => e.dateIso < stopBefore)) break;
    await sleep(500);
  }
  return all;
}

// Filterlist-Title kommt im Format "Themengebiet TitelText" — z.B. "Arbeit
// Änderung des Siebten Buches…". Der Themengebiet-Prefix ist ein Single-Word
// aus geschlossener Liste; entfernen bevor Token-Overlap, sonst dominieren
// generische Themen-Wörter ("Arbeit", "Finanzen") die Match-Logik.
const BT_THEMENGEBIETE = new Set([
  "arbeit", "soziales", "finanzen", "wirtschaft", "inneres", "verkehr",
  "umwelt", "gesundheit", "bildung", "verteidigung", "auswärtiges",
  "auswaertiges", "justiz", "landwirtschaft", "energie", "kultur",
  "digitales", "europa", "haushalt", "klimaschutz",
]);
function stripThemengebiet(s: string): string {
  const m = s.match(/^(\S+)\s+(.+)$/);
  if (m && BT_THEMENGEBIETE.has(m[1].toLowerCase())) return m[2];
  return s;
}

function tok(s: string): Set<string> {
  // Umlaute & ß normalisieren — bundestag.de und abgeordnetenwatch nutzen
  // teils unterschiedliche Schreibung („stärkere" vs. „staerkere").
  const norm = s
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9 ]/g, " ");
  return new Set(norm.split(/\s+/).filter((w) => w.length >= 4));
}
function tovr(a: string, b: string): number {
  const ta = tok(a), tb = tok(b);
  if (!ta.size || !tb.size) return 0;
  let n = 0;
  for (const t of ta) if (tb.has(t)) n++;
  return n / Math.min(ta.size, tb.size);
}

async function main() {
  const db = new Database(DB_PATH, { readonly: !APPLY });

  const polls = db
    .prepare(
      `SELECT v.poll_id,
              MIN(v.poll_date) AS poll_date,
              MIN(v.poll_label) AS poll_label,
              SUM(v.vote='yes') AS ja, SUM(v.vote='no') AS nein,
              SUM(v.vote='abstain') AS enth
       FROM votes v WHERE v.poll_date IS NOT NULL AND v.poll_date != ''
       GROUP BY v.poll_id ORDER BY v.poll_date`
    )
    .all() as any[];
  const existingDs = (pid: number) =>
    (db.prepare(`SELECT drucksache_nr FROM drucksache_polls WHERE poll_id=?`).all(pid) as any[])
      .map((r) => r.drucksache_nr).sort();

  const earliest = polls.reduce((m, p) => (p.poll_date < m ? p.poll_date : m), "9999");
  console.error(`Hole bundestag.de-Filterlist (bis ${earliest})…`);
  const bt = await fetchAll(earliest);
  console.error(`${bt.length} bundestag.de-Abstimmungen geparst.\n`);

  const byDate = new Map<string, BtEntry[]>();
  for (const e of bt) (byDate.get(e.dateIso) ?? byDate.set(e.dateIso, []).get(e.dateIso)!).push(e);

  // Polls nach Datum gruppieren — innerhalb eines Datums lösen wir das
  // Assignment-Problem global (1:1 zwischen Polls und bt-Einträgen), damit
  // nicht mehrere Polls denselben bt-Eintrag beanspruchen (alte Greedy-Logik
  // hat 6451 + 6455 beide auf "Sicherheitsbeauftragte" gemappt).
  const pollsByDate = new Map<string, typeof polls>();
  for (const p of polls) (pollsByDate.get(p.poll_date) ?? pollsByDate.set(p.poll_date, []).get(p.poll_date)!).push(p);

  const assignment = new Map<number, BtEntry | null>();
  for (const [date, dayPolls] of pollsByDate) {
    const cands = (byDate.get(date) ?? []).slice();
    // Berechne alle (poll, cand)-Scores pro Tag
    const pairs: { pollIdx: number; candIdx: number; score: number; titleScore: number }[] = [];
    for (let pi = 0; pi < dayPolls.length; pi++) {
      const p = dayPolls[pi];
      const exDs = new Set(existingDs(p.poll_id));
      for (let ci = 0; ci < cands.length; ci++) {
        const c = cands[ci];
        const tallyExact = c.ja === p.ja && c.nein === p.nein && c.enth === p.enth ? 1 : 0;
        const dsOv = c.ds.filter((d) => exDs.has(d)).length;
        const titleScore = tovr(stripThemengebiet(c.title), p.poll_label || "");
        // Title-Score dominiert (Faktor 1000), tally + dsOv nur als
        // Tiebreaker. Bei Block-Debatten (4 Polls am selben Tag) sind tallys
        // oft kreuzweise vertauscht und mit ähnlichen Werten — Title-Wörter
        // sind das einzig zuverlässige Diskriminans.
        const score = 1000 * titleScore + tallyExact + dsOv;
        pairs.push({ pollIdx: pi, candIdx: ci, score, titleScore });
      }
    }
    // Match-Validität für ein (poll, cand)-Paar (mind. EINES davon):
    //   a) Title-Overlap ≥ 0.15 (thematische Übereinstimmung)
    //   b) tally exakt + ≥1 gemeinsame DS (tally + DS = sicher)
    //   c) ≥2 gemeinsame DS (inhaltlich derselbe Roll-Call, auch wenn
    //      Titel-Wording divergiert — siehe 6511: bt nennt es „MFR",
    //      abgeordnetenwatch „LEADER", DS-Set ist aber identisch)
    const isValidPair = (pi: number, ci: number): boolean => {
      const pair = pairs.find((q) => q.pollIdx === pi && q.candIdx === ci);
      if (!pair) return false;
      const c = cands[ci];
      const p = dayPolls[pi];
      const tallyOk = c.ja === p.ja && c.nein === p.nein && c.enth === p.enth;
      const dsOv = c.ds.filter((d) => existingDs(p.poll_id).includes(d)).length;
      return pair.titleScore >= 0.15 || (tallyOk && dsOv >= 1) || dsOv >= 2;
    };
    const scoreOf = (pi: number, ci: number): number =>
      pairs.find((q) => q.pollIdx === pi && q.candIdx === ci)?.score ?? -Infinity;

    // Optimal-Assignment per Permutation, wenn N klein (≤7). Sonst Greedy
    // als Fallback. Block-Debatten haben i.d.R. ≤4 namentliche Abstimmungen
    // pro Tag, also fast immer Permutations-Pfad.
    let bestAssignment: Map<number, BtEntry | null> | null = null;
    if (dayPolls.length <= 7 && cands.length <= 7) {
      const N = dayPolls.length;
      const idxs = Array.from({ length: cands.length }, (_, i) => i);
      let bestTotal = -Infinity;
      const tryPerm = (chosen: (number | -1)[]) => {
        let total = 0;
        let valid = true;
        for (let pi = 0; pi < N; pi++) {
          const ci = chosen[pi];
          if (ci === -1) continue;
          if (!isValidPair(pi, ci)) { valid = false; break; }
          total += scoreOf(pi, ci);
        }
        if (!valid) return;
        if (total > bestTotal) {
          bestTotal = total;
          bestAssignment = new Map();
          for (let pi = 0; pi < N; pi++) {
            const ci = chosen[pi];
            bestAssignment.set(dayPolls[pi].poll_id, ci === -1 ? null : cands[ci]);
          }
        }
      };
      const enumerate = (pi: number, chosen: (number | -1)[], used: Set<number>) => {
        if (pi === N) { tryPerm(chosen); return; }
        // Option: poll pi bekommt keinen cand
        chosen[pi] = -1;
        enumerate(pi + 1, chosen, used);
        // Option: poll pi bekommt cand ci (alle noch nicht-genutzten cands)
        for (const ci of idxs) {
          if (used.has(ci)) continue;
          chosen[pi] = ci;
          used.add(ci);
          enumerate(pi + 1, chosen, used);
          used.delete(ci);
        }
      };
      enumerate(0, new Array(N).fill(-1), new Set());
    }

    if (bestAssignment) {
      for (const [pid, cand] of bestAssignment) assignment.set(pid, cand);
    } else {
      // Greedy Fallback für große Tage
      pairs.sort((a, b) => b.score - a.score);
      const usedP = new Set<number>(), usedC = new Set<number>();
      for (const pair of pairs) {
        if (usedP.has(pair.pollIdx) || usedC.has(pair.candIdx)) continue;
        if (!isValidPair(pair.pollIdx, pair.candIdx)) continue;
        assignment.set(dayPolls[pair.pollIdx].poll_id, cands[pair.candIdx]);
        usedP.add(pair.pollIdx);
        usedC.add(pair.candIdx);
      }
      for (let pi = 0; pi < dayPolls.length; pi++) {
        if (!usedP.has(pi)) assignment.set(dayPolls[pi].poll_id, null);
      }
    }
  }

  const rows: any[] = [];
  for (const p of polls) {
    const best = assignment.get(p.poll_id) ?? null;
    const btDs = best ? best.ds.slice().sort() : [];
    const ex = existingDs(p.poll_id);
    const exSet = new Set(ex), btSet = new Set(btDs);
    const removed = ex.filter((d) => !btSet.has(d));
    const added = btDs.filter((d) => !exSet.has(d));
    const status = !best
      ? "UNMATCHED"
      : added.length === 0 && removed.length === 0
      ? "EXAKT"
      : "DIFF";
    const tallyOk = best ? best.ja === p.ja && best.nein === p.nein && best.enth === p.enth : false;
    rows.push({
      poll_id: p.poll_id, date: p.poll_date, label: (p.poll_label || "").slice(0, 50),
      status, exCount: ex.length, btCount: btDs.length,
      btDs, removed, added, tallyOk,
      btTitle: best?.title?.slice(0, 70) ?? null,
    });
  }

  if (JSON_OUT) { console.log(JSON.stringify(rows, null, 2)); db.close(); return; }

  for (const r of rows) {
    console.log(
      `poll ${r.poll_id} ${r.date} [${r.status}] bestehend=${r.exCount} bt=${r.btCount}` +
        (r.status === "DIFF" ? `  +[${r.added.join(",")}] −[${r.removed.join(",")}]` : "") +
        (r.status !== "UNMATCHED" && !r.tallyOk ? "  ⚠️Stimm-Vektor≠" : "") +
        (r.status === "UNMATCHED" ? `  "${r.label}"` : "")
    );
  }
  const c = (s: string) => rows.filter((r) => r.status === s).length;
  const tallyMismatch = rows.filter((r) => r.status !== "UNMATCHED" && !r.tallyOk).length;
  console.log(
    `\nBilanz: ${c("EXAKT")} EXAKT · ${c("DIFF")} DIFF · ${c("UNMATCHED")} UNMATCHED · ` +
      `${tallyMismatch} mit abweichendem Stimm-Vektor (Join-Unsicherheit) · ${rows.length} Polls`
  );

  if (!APPLY) {
    console.log(`\nread-only. --apply schreibt (alte → drucksache_polls_pre_bt_filterlist).`);
    db.close();
    return;
  }

  // ---- APPLY ----
  const matched = rows.filter((r) => r.status !== "UNMATCHED" && r.btCount > 0);
  db.exec(`CREATE TABLE IF NOT EXISTS drucksache_polls_pre_bt_filterlist AS
           SELECT *, datetime('now') AS archived_at FROM drucksache_polls WHERE 0`);
  const bk = db.prepare(`SELECT COUNT(*) n FROM drucksache_polls_pre_bt_filterlist`).get() as any;
  if (bk.n === 0)
    db.exec(`INSERT INTO drucksache_polls_pre_bt_filterlist
             SELECT *, datetime('now') FROM drucksache_polls`);
  const checkDs = db.prepare(
    `SELECT 1 FROM drucksache_analyses WHERE drucksache_nr=? AND analyze_error IS NULL LIMIT 1`
  );
  const delPoll = db.prepare(`DELETE FROM drucksache_polls WHERE poll_id=?`);
  const insLink = db.prepare(
    `INSERT OR IGNORE INTO drucksache_polls (drucksache_nr,poll_id,match_score,matched_via) VALUES (?,?,1.0,'bundestag_filterlist')`
  );
  const upAudit = db.prepare(
    `INSERT INTO audit_bundestag_polls (bundestag_id,abstimmung_date,topic,drucksachen_json,http_status,fetched_at)
     VALUES (?,?,?,?,?,datetime('now'))
     ON CONFLICT(bundestag_id) DO UPDATE SET abstimmung_date=excluded.abstimmung_date,
       topic=excluded.topic, drucksachen_json=excluded.drucksachen_json, fetched_at=datetime('now')`
  );
  const changed: number[] = [];
  const tx = db.transaction(() => {
    for (const r of matched) {
      if (r.status === "DIFF") changed.push(r.poll_id);
      delPoll.run(r.poll_id);
      for (const d of r.btDs) if (checkDs.get(d)) insLink.run(d, r.poll_id);
      upAudit.run(r.poll_id, r.date, r.btTitle, JSON.stringify(r.btDs), 200);
    }
  });
  tx();
  console.log(
    `\n✓ APPLY: ${matched.length} Polls neu aus bundestag.de-Filterlist. ` +
      `Alte → drucksache_polls_pre_bt_filterlist. ${changed.length} mit geänderten DS → vote_context regen:\n  ${changed.join(", ")}`
  );
  db.close();
}
main();
