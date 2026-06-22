/**
 * MANUELL (Claude Code, kein LLM) — Abstimmungen → Themenfeld-Crosswalk.
 *
 * Deterministisch über bestehende amtliche Signal-Kette:
 *   bundestag_votes.drucksache_nrn_json → ds_unterthemen.feld (kern_im_feld=1)
 *
 * Regel:
 *  - Drucksache-Nummern werden zero-pad-normalisiert (21/0623 → 21/623), sonst Join-Verfehlung.
 *  - ds_unterthemen-Zeilen sind nach Priorität geordnet (rowid) → erstes Kern-Feld = Primär-Sachfeld.
 *  - PRIMÄR = erstes Kern-Feld der ERSTEN referenzierten Drucksache mit Kern-Feld.
 *  - NEBEN  = alle weiteren Kern-Felder (Reihenfolge nach erstem Auftreten = rang).
 *  - Verfahrens-Votes (Wahl der Mitglieder, Geschäftsordnung, Petitions-Sammelübersichten)
 *    haben kein Sachfeld → kein Eintrag (korrekt).
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");

db.exec(`
  DROP TABLE IF EXISTS vote_themenfeld;
  CREATE TABLE vote_themenfeld (
    vote_id        INTEGER NOT NULL,
    feld           TEXT    NOT NULL,
    primaer        INTEGER NOT NULL,   -- 1 = Primär-Sachfeld, 0 = Nebenfeld
    rang           INTEGER NOT NULL,   -- 1-basiert, Reihenfolge der Felder
    via_drucksache TEXT    NOT NULL,   -- welche DS das Feld beigesteuert hat
    vote_subtype   TEXT,               -- gesetz | petition | personenwahl
    verfahren      INTEGER NOT NULL,   -- 1 = Verfahrens-Vote (Petition/Personenwahl), 0 = Sach-Vote
    PRIMARY KEY (vote_id, feld)
  );
  CREATE INDEX idx_vt_feld ON vote_themenfeld(feld);
  CREATE INDEX idx_vt_primaer ON vote_themenfeld(feld, primaer, verfahren);
`);

// Verfahrens-Subtypen: Petitions-Sammelübersichten + Personenwahlen (Wahl von Mitgliedern,
// Wahlvorschläge) sind keine inhaltlichen Sachentscheidungen, blähen sonst „Politisches Leben" auf.
const VERFAHREN_SUBTYPES = new Set(["petition", "personenwahl"]);

const norm = (d: string) => {
  const m = String(d).match(/^(\d+)\/0*(\d+)$/);
  return m ? `${m[1]}/${m[2]}` : String(d);
};

const kernFelder = db.prepare(
  "SELECT feld FROM ds_unterthemen WHERE drucksache_nr=? AND kern_im_feld=1 ORDER BY rowid"
);
const ins = db.prepare(
  "INSERT OR IGNORE INTO vote_themenfeld (vote_id, feld, primaer, rang, via_drucksache, vote_subtype, verfahren) VALUES (?,?,?,?,?,?,?)"
);

const votes = db.prepare(
  "SELECT vote_id, drucksache_nrn_json, vote_subtype FROM bundestag_votes"
).all() as any[];

let mitFeld = 0,
  ohneFeld = 0,
  ohneDS = 0;
const feldAnzahlHist: Record<number, number> = {};

const tx = db.transaction(() => {
  for (const v of votes) {
    let ds: string[] = [];
    try {
      ds = JSON.parse(v.drucksache_nrn_json || "[]");
    } catch {}
    if (!ds.length) {
      ohneDS++;
      continue;
    }
    // Felder in Reihenfolge sammeln (erstes Auftreten gewinnt), Primär = erstes überhaupt
    const reihen: { feld: string; ds: string }[] = [];
    const gesehen = new Set<string>();
    for (const d of ds) {
      const dn = norm(d);
      for (const r of kernFelder.all(dn) as any[]) {
        if (!gesehen.has(r.feld)) {
          gesehen.add(r.feld);
          reihen.push({ feld: r.feld, ds: dn });
        }
      }
    }
    if (!reihen.length) {
      ohneFeld++;
      continue;
    }
    mitFeld++;
    feldAnzahlHist[reihen.length] = (feldAnzahlHist[reihen.length] || 0) + 1;
    const verfahren = VERFAHREN_SUBTYPES.has(v.vote_subtype) ? 1 : 0;
    reihen.forEach((x, i) => {
      ins.run(v.vote_id, x.feld, i === 0 ? 1 : 0, i + 1, x.ds, v.vote_subtype, verfahren);
    });
  }
});
tx();

console.log(`Votes gesamt: ${votes.length}`);
console.log(`  → mit Sachfeld: ${mitFeld}`);
console.log(`  → mit DS aber ohne klassifiziertes Kern-Feld: ${ohneFeld}`);
console.log(`  → ganz ohne DS-Referenz (Verfahren): ${ohneDS}`);
console.log(`Felder pro Vote (Anzahl→Votes):`, JSON.stringify(feldAnzahlHist));

const zeilen = db.prepare("SELECT COUNT(*) n FROM vote_themenfeld").get() as any;
const prim = db.prepare("SELECT COUNT(*) n FROM vote_themenfeld WHERE primaer=1").get() as any;
console.log(`\nvote_themenfeld: ${zeilen.n} Zeilen, davon ${prim.n} Primär`);

const verf = db.prepare("SELECT COUNT(DISTINCT vote_id) n FROM vote_themenfeld WHERE verfahren=1").get() as any;
const sach = db.prepare("SELECT COUNT(DISTINCT vote_id) n FROM vote_themenfeld WHERE verfahren=0").get() as any;
console.log(`  davon Verfahrens-Votes (Petition/Personenwahl): ${verf.n}`);
console.log(`  davon Sach-Votes (Gesetz/Antrag/Beschluss): ${sach.n}`);

console.log(`\n=== Primärfeld-Verteilung — NUR Sach-Votes (verfahren=0) ===`);
const verteilung = db.prepare(
  "SELECT feld, COUNT(*) n FROM vote_themenfeld WHERE primaer=1 AND verfahren=0 GROUP BY feld ORDER BY n DESC"
).all() as any[];
for (const r of verteilung) console.log(`  ${String(r.n).padStart(3)}  ${r.feld}`);
