import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "politik.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

export function initDb() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS parliaments (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL,
      label_external TEXT,
      type TEXT NOT NULL DEFAULT 'landtag',
      api_url TEXT
    );

    CREATE TABLE IF NOT EXISTS parliament_periods (
      id INTEGER PRIMARY KEY,
      parliament_id INTEGER NOT NULL REFERENCES parliaments(id),
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'legislature',
      start_date TEXT,
      end_date TEXT,
      api_url TEXT
    );

    CREATE TABLE IF NOT EXISTS parties (
      id INTEGER PRIMARY KEY,
      label TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS politicians (
      id INTEGER PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      title TEXT,
      sex TEXT,
      year_of_birth INTEGER,
      education TEXT,
      occupation TEXT,
      residence TEXT,
      photo_url TEXT,
      party_id INTEGER REFERENCES parties(id),
      abgeordnetenwatch_url TEXT,
      api_url TEXT
    );

    CREATE TABLE IF NOT EXISTS mandates (
      id INTEGER PRIMARY KEY,
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      parliament_period_id INTEGER NOT NULL REFERENCES parliament_periods(id),
      label TEXT,
      type TEXT,
      start_date TEXT,
      end_date TEXT,
      constituency TEXT,
      list_position INTEGER,
      mandate_won TEXT,
      fraction TEXT,
      fraction_role TEXT,
      api_url TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_mandates_politician ON mandates(politician_id);
    CREATE INDEX IF NOT EXISTS idx_mandates_period ON mandates(parliament_period_id);
    CREATE INDEX IF NOT EXISTS idx_politicians_party ON politicians(party_id);
    CREATE INDEX IF NOT EXISTS idx_politicians_name ON politicians(last_name, first_name);

    -- Votes (from Abgeordnetenwatch API)
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL REFERENCES mandates(id),
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      poll_id INTEGER NOT NULL,
      poll_label TEXT,
      poll_url TEXT,
      poll_date TEXT,
      vote TEXT NOT NULL,
      reason_no_show TEXT,
      fraction_id INTEGER,
      fraction_label TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_votes_politician ON votes(politician_id);
    CREATE INDEX IF NOT EXISTS idx_votes_poll ON votes(poll_id);

    -- Sidejobs (from Abgeordnetenwatch API)
    CREATE TABLE IF NOT EXISTS sidejobs (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL REFERENCES mandates(id),
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      label TEXT NOT NULL,
      income_level TEXT,
      income INTEGER,
      income_total INTEGER,
      interval TEXT,
      created INTEGER,
      organization TEXT,
      additional_information TEXT,
      category TEXT,
      data_change_date TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sidejobs_politician ON sidejobs(politician_id);

    -- Committee Memberships (from Abgeordnetenwatch API)
    CREATE TABLE IF NOT EXISTS committee_memberships (
      id INTEGER PRIMARY KEY,
      mandate_id INTEGER NOT NULL REFERENCES mandates(id),
      politician_id INTEGER NOT NULL REFERENCES politicians(id),
      committee_id INTEGER NOT NULL,
      committee_label TEXT NOT NULL,
      committee_role TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_committee_memberships_politician ON committee_memberships(politician_id);
  `);

  return db;
}

// ── Query helpers ──

export interface PoliticianRow {
  id: number;
  first_name: string;
  last_name: string;
  title: string | null;
  sex: string | null;
  year_of_birth: number | null;
  education: string | null;
  occupation: string | null;
  residence: string | null;
  photo_url: string | null;
  party_id: number | null;
  party_label: string | null;
  abgeordnetenwatch_url: string | null;
  qid_wikidata: string | null;
  homepage_url: string | null;
  twitter_handle: string | null;
  instagram_handle: string | null;
  bio_summary: string | null;
  bio_url: string | null;
  bio_source: string | null;
}

export interface MandateRow {
  id: number;
  politician_id: number;
  parliament_period_id: number;
  period_label: string;
  parliament_label: string;
  parliament_type: string;
  label: string | null;
  type: string | null;
  start_date: string | null;
  end_date: string | null;
  constituency: string | null;
  fraction: string | null;
}

export function searchPoliticiansDb(query: string, limit = 30): PoliticianRow[] {
  const db = getDb();
  const term = `%${query}%`;
  return db
    .prepare(
      `SELECT p.*, pa.label as party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       WHERE p.last_name LIKE ? OR p.first_name LIKE ?
         OR (p.first_name || ' ' || p.last_name) LIKE ?
       ORDER BY p.last_name, p.first_name
       LIMIT ?`
    )
    .all(term, term, term, limit) as PoliticianRow[];
}

export function getPoliticianDb(id: number): PoliticianRow | undefined {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, pa.label as party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       WHERE p.id = ?`
    )
    .get(id) as PoliticianRow | undefined;
}

export function getMandatesForPoliticianDb(politicianId: number): MandateRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT m.*, pp.label as period_label, par.label as parliament_label, par.type as parliament_type
       FROM mandates m
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       JOIN parliaments par ON pp.parliament_id = par.id
       WHERE m.politician_id = ?
       ORDER BY pp.start_date DESC`
    )
    .all(politicianId) as MandateRow[];
}

export function getPoliticiansByParliament(parliamentId: number, periodId?: number): PoliticianRow[] {
  const db = getDb();
  const sql = periodId
    ? `SELECT DISTINCT p.*, pa.label as party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       JOIN mandates m ON m.politician_id = p.id
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = ? AND pp.id = ? AND m.type = 'mandate'
       ORDER BY p.last_name, p.first_name`
    : `SELECT DISTINCT p.*, pa.label as party_label
       FROM politicians p
       LEFT JOIN parties pa ON p.party_id = pa.id
       JOIN mandates m ON m.politician_id = p.id
       JOIN parliament_periods pp ON m.parliament_period_id = pp.id
       WHERE pp.parliament_id = ? AND m.type = 'mandate'
       ORDER BY p.last_name, p.first_name`;
  return (periodId ? db.prepare(sql).all(parliamentId, periodId) : db.prepare(sql).all(parliamentId)) as PoliticianRow[];
}

export function getDbStats(): { politicians: number; mandates: number; parliaments: number; parties: number } {
  const db = getDb();
  return {
    politicians: (db.prepare("SELECT COUNT(*) as c FROM politicians").get() as { c: number }).c,
    mandates: (db.prepare("SELECT COUNT(*) as c FROM mandates").get() as { c: number }).c,
    parliaments: (db.prepare("SELECT COUNT(*) as c FROM parliaments").get() as { c: number }).c,
    parties: (db.prepare("SELECT COUNT(DISTINCT id) as c FROM parties").get() as { c: number }).c,
  };
}

// ── For Politiker-Tabelle ──

export interface PoliticianListRow extends PoliticianRow {
  parliament_label: string | null;
  parliament_type: string | null;
  fraction: string | null;
  constituency: string | null;
  activity_count: number;
}

export interface ListParams {
  query?: string;
  parliamentId?: number;
  partyId?: number;
  limit?: number;
  offset?: number;
}

export function listPoliticians(params: ListParams): { rows: PoliticianListRow[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (params.query) {
    conditions.push(`(p.last_name LIKE ? OR p.first_name LIKE ? OR (p.first_name || ' ' || p.last_name) LIKE ?)`);
    const term = `%${params.query}%`;
    args.push(term, term, term);
  }
  if (params.parliamentId) {
    conditions.push(`par.id = ?`);
    args.push(params.parliamentId);
  }
  if (params.partyId) {
    conditions.push(`p.party_id = ?`);
    args.push(params.partyId);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  const countSql = `
    SELECT COUNT(DISTINCT p.id) as c
    FROM politicians p
    LEFT JOIN parties pa ON p.party_id = pa.id
    LEFT JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
    LEFT JOIN parliament_periods pp ON m.parliament_period_id = pp.id
    LEFT JOIN parliaments par ON pp.parliament_id = par.id
    ${where}
  `;
  const total = (db.prepare(countSql).get(...args) as { c: number }).c;

  const dataSql = `
    SELECT DISTINCT p.*, pa.label as party_label,
      par.label as parliament_label, par.type as parliament_type,
      m.fraction, m.constituency,
      (SELECT COUNT(*) FROM activities act WHERE act.politician_id = p.id) as activity_count
    FROM politicians p
    LEFT JOIN parties pa ON p.party_id = pa.id
    LEFT JOIN mandates m ON m.politician_id = p.id AND m.type = 'mandate'
    LEFT JOIN parliament_periods pp ON m.parliament_period_id = pp.id
    LEFT JOIN parliaments par ON pp.parliament_id = par.id
    ${where}
    ORDER BY p.last_name, p.first_name
    LIMIT ? OFFSET ?
  `;
  const rows = db.prepare(dataSql).all(...args, limit, offset) as PoliticianListRow[];

  return { rows, total };
}

export function getAllParliaments(): { id: number; label: string; type: string }[] {
  const db = getDb();
  return db.prepare("SELECT id, label, type FROM parliaments ORDER BY type, label").all() as { id: number; label: string; type: string }[];
}

export function getAllParties(): { id: number; label: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT pa.id, pa.label, COUNT(p.id) as count
       FROM parties pa
       JOIN politicians p ON p.party_id = pa.id
       GROUP BY pa.id
       ORDER BY count DESC`
    )
    .all() as { id: number; label: string; count: number }[];
}

// ── Activities ──

export interface ActivityRow {
  id: string;
  politician_id: number | null;
  aktivitaetsart: string;
  typ: string | null;
  wahlperiode: number | null;
  titel: string;
  thema: string | null;
  datum: string | null;
  dokumentart: string | null;
  vorgangstyp: string | null;
  drucksache_nr: string | null;
  drucksache_typ: string | null;
  pdf_url: string | null;
  herausgeber: string | null;
  urheber: string | null;
}

export function getActivitiesForPolitician(politicianId: number, limit = 50): ActivityRow[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM activities
       WHERE politician_id = ?
       ORDER BY datum DESC
       LIMIT ?`
    )
    .all(politicianId, limit) as ActivityRow[];
}

export function getActivityStatsForPolitician(politicianId: number): { art: string; count: number }[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT aktivitaetsart as art, COUNT(*) as count
       FROM activities
       WHERE politician_id = ?
       GROUP BY aktivitaetsart
       ORDER BY count DESC`
    )
    .all(politicianId) as { art: string; count: number }[];
}

export function getActivityCountForPolitician(politicianId: number): number {
  const db = getDb();
  return (db.prepare("SELECT COUNT(*) as c FROM activities WHERE politician_id = ?").get(politicianId) as { c: number }).c;
}

export function getSpeechSummaryInfo(lastName: string, title?: string | null): { speaker: string; count: number } | null {
  const db = getDb();
  try {
    // Try exact last name match, with optional title prefix
    const pattern = title
      ? `${title}%${lastName}`
      : `%${lastName}`;
    const row = db.prepare(
      "SELECT speaker, COUNT(*) as count FROM speech_summaries WHERE speaker LIKE ? GROUP BY speaker ORDER BY count DESC LIMIT 1"
    ).get(pattern) as { speaker: string; count: number } | undefined;
    return row && row.count > 0 ? row : null;
  } catch {
    return null;
  }
}

export interface ActivityWithPolitician extends ActivityRow {
  pol_first_name: string | null;
  pol_last_name: string | null;
  pol_party: string | null;
}

// ── Votes, Sidejobs, Committees (local DB) ──

export interface VoteRow {
  id: number;
  mandate_id: number;
  politician_id: number;
  poll_id: number;
  poll_label: string | null;
  poll_url: string | null;
  poll_date: string | null;
  vote: string;
  reason_no_show: string | null;
  fraction_id: number | null;
  fraction_label: string | null;
}

export function getVotesForPoliticianDb(politicianId: number, limit = 200): VoteRow[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM votes WHERE politician_id = ? ORDER BY poll_date DESC LIMIT ?`
  ).all(politicianId, limit) as VoteRow[];
}

export interface VoteStats {
  totalPolls: number;
  attended: number;
  attendanceRate: number;
  votedYes: number;
  votedNo: number;
  abstained: number;
  noShow: number;
}

export function computeVoteStatsDb(votes: VoteRow[]): VoteStats {
  const totalPolls = votes.length;
  const attended = votes.filter((v) => v.vote !== "no_show").length;
  return {
    totalPolls,
    attended,
    attendanceRate: totalPolls > 0 ? (attended / totalPolls) * 100 : 0,
    votedYes: votes.filter((v) => v.vote === "yes").length,
    votedNo: votes.filter((v) => v.vote === "no").length,
    abstained: votes.filter((v) => v.vote === "abstain").length,
    noShow: votes.filter((v) => v.vote === "no_show").length,
  };
}

export interface SidejobRow {
  id: number;
  mandate_id: number;
  politician_id: number;
  label: string;
  income_level: string | null;
  income: number | null;
  income_total: number | null;
  interval: string | null;
  created: number;
  organization: string | null;
  additional_information: string | null;
  category: string | null;
  data_change_date: string | null;
}

export function getSidejobsForPoliticianDb(politicianId: number): SidejobRow[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM sidejobs WHERE politician_id = ? ORDER BY created DESC`
  ).all(politicianId) as SidejobRow[];
}

export interface CommitteeMembershipRow {
  id: number;
  mandate_id: number;
  politician_id: number;
  committee_id: number;
  committee_label: string;
  committee_role: string | null;
}

export function getCommitteeMembershipsForPoliticianDb(politicianId: number): CommitteeMembershipRow[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM committee_memberships WHERE politician_id = ? ORDER BY committee_label`
  ).all(politicianId) as CommitteeMembershipRow[];
}

export function getIncomeRange(level: string | null): string {
  const levels: Record<string, string> = {
    "1": "1.000 – 3.500 €",
    "2": "3.500 – 7.000 €",
    "3": "7.000 – 15.000 €",
    "4": "15.000 – 30.000 €",
    "5": "30.000 – 75.000 €",
    "6": "75.000 – 100.000 €",
    "7": "100.000 – 150.000 €",
    "8": "150.000 – 250.000 €",
    "9": "über 250.000 €",
    "10": "unter 1.000 €",
  };
  return levels[level || ""] || "Keine Angabe";
}

// ── Combined Parliamentary Work (DIP + Plenar merged) ──

export interface ParlamentarischeArbeit {
  id: string;
  quelle: "dip" | "plenar" | "kombiniert";
  datum: string | null;
  typ: string;              // Unified type label
  kategorie: string;        // For filtering: "rede" | "frage" | "debattenbeitrag" | "erklaerung" | "gesetzgebung" | "bericht"
  thema: string | null;     // DIP thema or Plenar kontext
  zusammenfassung: string | null;  // Only from Plenar
  drucksache_nr: string | null;
  pdf_url: string | null;
  source_url: string | null;       // Plenar PDF
  sitzung: number | null;
}

function kategorieForDip(art: string): string {
  if (art === "Rede" || art === "Rede (zu Protokoll gegeben)") return "rede";
  if (art.includes("Anfrage") || art === "Frage" || art === "Zusatzfrage") return "frage";
  if (art === "Antwort" || art === "Einleitende Ausführungen und Beantwortung") return "frage";
  if (art === "Kurzintervention" || art === "Zwischenfrage" || art === "Erwiderung" || art === "Zur Geschäftsordnung BT") return "debattenbeitrag";
  if (art.includes("Erklärung")) return "erklaerung";
  if (art === "Antrag" || art === "Gesetzentwurf" || art === "Änderungsantrag" || art === "Entschließungsantrag") return "gesetzgebung";
  if (art === "Berichterstattung") return "bericht";
  return "sonstige";
}

function kategorieForPlenar(typ: string): string {
  if (typ === "debatte" || typ === "regierungserklaerung") return "rede";
  if (typ === "fragestunde_frage" || typ === "fragestunde_antwort") return "frage";
  if (typ === "zwischenfrage" || typ === "kurzintervention") return "debattenbeitrag";
  if (typ === "erklaerung") return "erklaerung";
  return "rede";
}

function typLabelForPlenar(typ: string): string {
  const map: Record<string, string> = {
    debatte: "Rede",
    regierungserklaerung: "Regierungserklärung",
    fragestunde_frage: "Frage (Fragestunde)",
    fragestunde_antwort: "Antwort (Fragestunde)",
    zwischenfrage: "Zwischenfrage",
    kurzintervention: "Kurzintervention",
    erklaerung: "Erklärung",
  };
  return map[typ] || "Rede";
}

export function getParlamentarischeArbeit(
  politicianId: number,
  speakerName: string | null,
  limit = 200
): { items: ParlamentarischeArbeit[]; stats: Record<string, number> } {
  const db = getDb();

  // 1. Load DIP activities
  const dipRows = db.prepare(
    `SELECT * FROM activities WHERE politician_id = ? ORDER BY datum DESC LIMIT ?`
  ).all(politicianId, limit) as ActivityRow[];

  // 2. Load Plenar summaries
  type PlenarRow = SpeechSummary & { speaker: string; speech_text_preview: string };
  let plenarRows: PlenarRow[] = [];
  if (speakerName) {
    plenarRows = db.prepare(`
      SELECT * FROM speech_summaries
      WHERE speaker = ?
        AND zusammenfassung NOT LIKE '%lediglich%'
        AND zusammenfassung NOT LIKE '%nicht möglich%'
        AND zusammenfassung NOT LIKE '%nicht zu entnehmen%'
        AND zusammenfassung NOT LIKE '%nicht erkennbar%'
        AND zusammenfassung NOT LIKE '%nicht feststellbar%'
        AND zusammenfassung NOT LIKE '%nicht ableitbar%'
        AND zusammenfassung NOT LIKE '%keine inhaltliche%'
      ORDER BY sitzung DESC, speech_index ASC
      LIMIT ?
    `).all(speakerName, limit) as PlenarRow[];
  }

  // 3. Index plenar rows by date+kategorie for matching
  const plenarByDateKat = new Map<string, PlenarRow[]>();
  for (const p of plenarRows) {
    if (!p.datum) continue;
    const key = `${p.datum}|${kategorieForPlenar(p.typ)}`;
    if (!plenarByDateKat.has(key)) plenarByDateKat.set(key, []);
    plenarByDateKat.get(key)!.push(p);
  }
  const matchedPlenarIds = new Set<number>();

  // 4. Build items — merge DIP with matching Plenar
  const items: ParlamentarischeArbeit[] = [];

  for (const a of dipRows) {
    const dipKat = kategorieForDip(a.aktivitaetsart);
    const key = a.datum ? `${a.datum}|${dipKat}` : null;
    const matchingPlenar = key ? plenarByDateKat.get(key) : undefined;

    if (matchingPlenar && matchingPlenar.length > 0) {
      // Take first unmatched plenar entry for this date+kategorie
      const plenar = matchingPlenar.find(p => !matchedPlenarIds.has(p.id)) || null;
      if (plenar) {
        matchedPlenarIds.add(plenar.id);
        items.push({
          id: `kombi-${a.id}-${plenar.id}`,
          quelle: "kombiniert",
          datum: a.datum,
          typ: a.aktivitaetsart,
          kategorie: dipKat,
          thema: a.thema || plenar.kontext,
          zusammenfassung: plenar.zusammenfassung,
          drucksache_nr: a.drucksache_nr,
          pdf_url: a.pdf_url,
          source_url: plenar.source_url,
          sitzung: plenar.sitzung,
        });
        continue;
      }
    }

    // No match — DIP only
    items.push({
      id: `dip-${a.id}`,
      quelle: "dip",
      datum: a.datum,
      typ: a.aktivitaetsart,
      kategorie: dipKat,
      thema: a.thema,
      zusammenfassung: null,
      drucksache_nr: a.drucksache_nr,
      pdf_url: a.pdf_url,
      source_url: null,
      sitzung: null,
    });
  }

  // 5. Add unmatched Plenar entries (no DIP counterpart)
  for (const p of plenarRows) {
    if (matchedPlenarIds.has(p.id)) continue;
    items.push({
      id: `plenar-${p.id}`,
      quelle: "plenar",
      datum: p.datum,
      typ: typLabelForPlenar(p.typ),
      kategorie: kategorieForPlenar(p.typ),
      thema: p.kontext,
      zusammenfassung: p.zusammenfassung,
      drucksache_nr: null,
      pdf_url: null,
      source_url: p.source_url,
      sitzung: p.sitzung,
    });
  }

  // 6. Sort chronologically (newest first)
  items.sort((a, b) => {
    const da = a.datum || "0000";
    const db2 = b.datum || "0000";
    if (da !== db2) return db2.localeCompare(da);
    // Combined first, then DIP, then Plenar
    const order = { kombiniert: 0, dip: 1, plenar: 2 };
    return (order[a.quelle] ?? 1) - (order[b.quelle] ?? 1);
  });

  // 7. Compute stats
  const stats: Record<string, number> = {};
  for (const item of items) {
    stats[item.kategorie] = (stats[item.kategorie] || 0) + 1;
  }

  return { items, stats };
}

export interface ActivityListParams {
  query?: string;
  art?: string;
  limit?: number;
  offset?: number;
}

export function listActivities(params: ActivityListParams): { rows: ActivityWithPolitician[]; total: number } {
  const db = getDb();
  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (params.query) {
    conditions.push(`(a.thema LIKE ? OR a.titel LIKE ?)`);
    const term = `%${params.query}%`;
    args.push(term, term);
  }
  if (params.art) {
    conditions.push(`a.aktivitaetsart = ?`);
    args.push(params.art);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = params.limit ?? 30;
  const offset = params.offset ?? 0;

  const total = (db.prepare(`SELECT COUNT(*) as c FROM activities a ${where}`).get(...args) as { c: number }).c;

  const rows = db.prepare(
    `SELECT a.*, p.first_name as pol_first_name, p.last_name as pol_last_name, pa.label as pol_party
     FROM activities a
     LEFT JOIN politicians p ON a.politician_id = p.id
     LEFT JOIN parties pa ON p.party_id = pa.id
     ${where}
     ORDER BY a.datum DESC
     LIMIT ? OFFSET ?`
  ).all(...args, limit, offset) as ActivityWithPolitician[];

  return { rows, total };
}

export function getActivityTypes(): { art: string; count: number }[] {
  const db = getDb();
  return db.prepare(
    `SELECT aktivitaetsart as art, COUNT(*) as count FROM activities GROUP BY aktivitaetsart ORDER BY count DESC`
  ).all() as { art: string; count: number }[];
}

// ── Politician Notes (Sonderfälle) ──

export interface PoliticianNote {
  id: number;
  politician_id: number | null;
  speaker_name: string | null;
  kategorie: string;
  titel: string;
  inhalt: string;
  datum_von: string | null;
  datum_bis: string | null;
}

export function getNotesForPolitician(politicianId: number): PoliticianNote[] {
  const db = getDb();
  return db.prepare(
    `SELECT * FROM politician_notes WHERE politician_id = ? ORDER BY datum_von DESC`
  ).all(politicianId) as PoliticianNote[];
}

// ── Plenar-Protokolle ──

export interface PlenarSessionRow {
  id: number;
  wahlperiode: number;
  sitzung: number;
  datum: string | null;
  speech_count: number;
  speaker_count: number;
}

export function getPlenarSessions(): PlenarSessionRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.*,
      COUNT(sp.id) as speech_count,
      COUNT(DISTINCT sp.speaker) as speaker_count
    FROM plenar_sessions s
    LEFT JOIN plenar_speeches sp ON sp.session_id = s.id
    GROUP BY s.id
    ORDER BY s.sitzung DESC
  `).all() as PlenarSessionRow[];
}

export function getTopPlenarSpeakers(limit = 25): { speaker: string; party: string | null; role: string | null; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT speaker,
      COALESCE(party, role) as party,
      role,
      COUNT(*) as count
    FROM plenar_speeches
    GROUP BY speaker
    ORDER BY count DESC
    LIMIT ?
  `).all(limit) as any[];
}

export function getPlenarPartyStats(): { party: string; count: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT party, COUNT(*) as count
    FROM plenar_speeches
    WHERE party IS NOT NULL
    AND party NOT IN ('EU', 'GEAS-Anpassungsgesetz', 'Tariftreuegesetz', 'Zusatzpunkt 5')
    GROUP BY party
    ORDER BY count DESC
  `).all() as any[];
}

// ── Ausschuss-Protokolle ──

export interface AusschussSessionRow {
  id: number;
  protokoll_nr: string | null;
  sitzung_nr: number | null;
  ausschuss: string;
  typ: string | null;
  datum: string | null;
  vorsitz: string | null;
  attendee_count: number;
  topic_count: number;
}

export function getAusschussSessions(): AusschussSessionRow[] {
  const db = getDb();
  return db.prepare(`
    SELECT s.*,
      (SELECT COUNT(*) FROM ausschuss_attendees WHERE session_id = s.id) as attendee_count,
      (SELECT COUNT(*) FROM ausschuss_topics WHERE session_id = s.id) as topic_count
    FROM ausschuss_sessions s
    WHERE s.ausschuss != 'Unbekannt'
    ORDER BY s.datum DESC NULLS LAST, s.sitzung_nr DESC
  `).all() as AusschussSessionRow[];
}

export function getAusschussStats(): { ausschuss: string; sitzungen: number; anwesende: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT ausschuss,
      COUNT(*) as sitzungen,
      SUM((SELECT COUNT(*) FROM ausschuss_attendees WHERE session_id = s.id)) as anwesende
    FROM ausschuss_sessions s
    WHERE ausschuss != 'Unbekannt'
    GROUP BY ausschuss
    ORDER BY sitzungen DESC
  `).all() as any[];
}

export function getTopAusschussAttendees(limit = 20): { name: string; fraktion: string | null; sitzungen: number; ausschuesse: string }[] {
  const db = getDb();
  return db.prepare(`
    SELECT a.name, a.fraktion,
      COUNT(DISTINCT a.session_id) as sitzungen,
      GROUP_CONCAT(DISTINCT s.ausschuss) as ausschuesse
    FROM ausschuss_attendees a
    JOIN ausschuss_sessions s ON a.session_id = s.id
    WHERE s.ausschuss != 'Unbekannt'
    GROUP BY a.name
    ORDER BY sitzungen DESC
    LIMIT ?
  `).all(limit) as any[];
}

export function getProtokollOverview() {
  const db = getDb();
  return {
    plenarSessions: (db.prepare("SELECT COUNT(*) as c FROM plenar_sessions").get() as any).c,
    plenarSpeeches: (db.prepare("SELECT COUNT(*) as c FROM plenar_speeches").get() as any).c,
    plenarSpeakers: (db.prepare("SELECT COUNT(DISTINCT speaker) as c FROM plenar_speeches").get() as any).c,
    ausschussSessions: (db.prepare("SELECT COUNT(*) as c FROM ausschuss_sessions WHERE ausschuss != 'Unbekannt'").get() as any).c,
    ausschussAttendees: (db.prepare("SELECT COUNT(*) as c FROM ausschuss_attendees").get() as any).c,
    ausschussTopics: (db.prepare("SELECT COUNT(*) as c FROM ausschuss_topics").get() as any).c,
  };
}

// ── Redner-Detail ──

export interface SpeakerDetail {
  speaker: string;
  party: string | null;
  role: string | null;
  totalSpeeches: number;
  sessions: {
    sitzung: number;
    datum: string | null;
    sourceUrl: string | null;
    count: number;
  }[];
}

export function getSpeakerDetail(name: string): SpeakerDetail | null {
  const db = getDb();

  // Check if we have XML-based speech_summaries for this speaker (higher quality)
  let hasSummaries = false;
  try {
    const sumCheck = db.prepare("SELECT COUNT(*) as c FROM speech_summaries WHERE speaker = ?").get(name) as any;
    hasSummaries = sumCheck?.c > 0;
  } catch {}

  if (hasSummaries) {
    // Use speech_summaries as source of truth
    const sessions = db.prepare(`
      SELECT sitzung, datum,
        source_url as sourceUrl,
        COUNT(*) as count
      FROM speech_summaries
      WHERE speaker = ?
      GROUP BY sitzung
      ORDER BY sitzung DESC
    `).all(name) as any[];

    if (sessions.length === 0) return null;

    // Get party/role from first summary entry
    const info = db.prepare(`
      SELECT speaker, typ, kontext FROM speech_summaries
      WHERE speaker = ? ORDER BY sitzung DESC LIMIT 1
    `).get(name) as any;

    // Also check plenar_speeches for party/role info
    const pInfo = db.prepare(`
      SELECT party, role FROM plenar_speeches WHERE speaker = ? AND (party IS NOT NULL OR role IS NOT NULL) LIMIT 1
    `).get(name) as any;

    const totalSpeeches = sessions.reduce((sum: number, s: any) => sum + s.count, 0);

    return {
      speaker: name,
      party: pInfo?.party || null,
      role: pInfo?.role || null,
      totalSpeeches,
      sessions,
    };
  }

  // Fallback to plenar_speeches
  const summary = db.prepare(`
    SELECT speaker, party, role, COUNT(*) as totalSpeeches
    FROM plenar_speeches
    WHERE speaker = ?
    GROUP BY speaker
  `).get(name) as any;

  if (!summary) return null;

  const sessions = db.prepare(`
    SELECT s.sitzung, s.datum, s.source_url as sourceUrl, COUNT(*) as count
    FROM plenar_speeches sp
    JOIN plenar_sessions s ON sp.session_id = s.id
    WHERE sp.speaker = ?
    GROUP BY s.id
    ORDER BY s.sitzung DESC
  `).all(name) as any[];

  return {
    speaker: summary.speaker,
    party: summary.party,
    role: summary.role,
    totalSpeeches: summary.totalSpeeches,
    sessions,
  };
}

export function getAllSpeakers(): { speaker: string; party: string | null; role: string | null; count: number; sessions: number }[] {
  const db = getDb();
  return db.prepare(`
    SELECT speaker,
      MAX(party) as party,
      MAX(role) as role,
      COUNT(*) as count,
      COUNT(DISTINCT session_id) as sessions
    FROM plenar_speeches
    GROUP BY speaker
    ORDER BY count DESC
  `).all() as any[];
}

export interface SpeechSummary {
  id: number;
  sitzung: number;
  datum: string | null;
  speech_index: number;
  zusammenfassung: string | null;
  kontext: string | null;
  typ: string;
  source_url: string | null;
}

export function getSpeechSummaries(speakerName: string): SpeechSummary[] {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT * FROM speech_summaries
      WHERE speaker = ?
        AND zusammenfassung NOT LIKE '%lediglich%'
        AND zusammenfassung NOT LIKE '%nicht möglich%'
        AND zusammenfassung NOT LIKE '%nicht zu entnehmen%'
        AND zusammenfassung NOT LIKE '%nicht erkennbar%'
        AND zusammenfassung NOT LIKE '%nicht feststellbar%'
        AND zusammenfassung NOT LIKE '%nicht ableitbar%'
        AND zusammenfassung NOT LIKE '%keine inhaltliche%'
      ORDER BY sitzung DESC, speech_index ASC
    `).all(speakerName) as SpeechSummary[];
  } catch {
    return [];
  }
}

export function getAllSpeakersWithSummaries(): { speaker: string; party: string | null; count: number; sessions: number }[] {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT speaker,
        COUNT(*) as count,
        COUNT(DISTINCT sitzung) as sessions
      FROM speech_summaries
      GROUP BY speaker
      ORDER BY speaker COLLATE NOCASE ASC
    `).all() as any[];
  } catch {
    return [];
  }
}

export function getPlenarSessionDetail(sitzung: number) {
  const db = getDb();

  const session = db.prepare(`
    SELECT * FROM plenar_sessions WHERE sitzung = ?
  `).get(sitzung) as any;
  if (!session) return null;

  const topics = db.prepare(`
    SELECT * FROM plenar_topics WHERE session_id = ? ORDER BY topic_number
  `).all(session.id) as any[];

  const speeches = db.prepare(`
    SELECT speaker, party, role, COUNT(*) as count
    FROM plenar_speeches
    WHERE session_id = ?
    GROUP BY speaker
    ORDER BY count DESC
  `).all(session.id) as any[];

  return { ...session, topics, speeches };
}
