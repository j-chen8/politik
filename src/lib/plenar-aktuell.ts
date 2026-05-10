import { getDb } from "@/lib/db";

export interface PartyCount {
  party: string;
  count: number;
}

export interface RelatedPoll {
  poll_id: number;
  poll_label: string;
  poll_url: string | null;
}

export interface PlenarTopicSummary {
  topic_id: number;
  topic_number: string;
  title: string;
  speech_count: number;
  speaker_count: number;
  parties: PartyCount[];
}

export interface LatestPlenarWeek {
  session_id: number;
  sitzung: number;
  wahlperiode: number;
  datum: string | null;
  source_url: string | null;
  total_speeches: number;
  topic_count: number;
  party_total: PartyCount[];
  topics: PlenarTopicSummary[];
  related_polls: RelatedPoll[];
}

export function getLatestPlenarWeek(): LatestPlenarWeek | null {
  const db = getDb();

  const session = db
    .prepare(
      `SELECT id, sitzung, wahlperiode, datum, source_url
       FROM plenar_sessions
       WHERE datum IS NOT NULL
       ORDER BY datum DESC
       LIMIT 1`
    )
    .get() as
    | { id: number; sitzung: number; wahlperiode: number; datum: string | null; source_url: string | null }
    | undefined;

  if (!session) return null;

  const topicRows = db
    .prepare(
      `SELECT pt.id, pt.topic_number, pt.title,
              COUNT(ps.id) as speech_count,
              COUNT(DISTINCT ps.speaker) as speaker_count
       FROM plenar_topics pt
       LEFT JOIN plenar_speeches ps ON ps.topic_id = pt.id
       WHERE pt.session_id = ?
       GROUP BY pt.id
       HAVING speech_count > 0
       ORDER BY pt.topic_number`
    )
    .all(session.id) as {
    id: number;
    topic_number: string;
    title: string;
    speech_count: number;
    speaker_count: number;
  }[];

  const partyByTopicStmt = db.prepare(
    `SELECT party, COUNT(*) as count
     FROM plenar_speeches
     WHERE topic_id = ? AND party IS NOT NULL AND party != ''
     GROUP BY party
     ORDER BY count DESC`
  );

  const topics: PlenarTopicSummary[] = topicRows.map((row) => ({
    topic_id: row.id,
    topic_number: row.topic_number,
    title: row.title,
    speech_count: row.speech_count,
    speaker_count: row.speaker_count,
    parties: partyByTopicStmt.all(row.id) as PartyCount[],
  }));

  const partyTotal = db
    .prepare(
      `SELECT party, COUNT(*) as count
       FROM plenar_speeches
       WHERE session_id = ? AND party IS NOT NULL AND party != ''
       GROUP BY party
       ORDER BY count DESC`
    )
    .all(session.id) as PartyCount[];

  const totalSpeeches = (
    db.prepare(`SELECT COUNT(*) as c FROM plenar_speeches WHERE session_id = ?`).get(session.id) as { c: number }
  ).c;

  const polls = session.datum
    ? (db
        .prepare(
          `SELECT DISTINCT poll_id, poll_label, poll_url
           FROM votes
           WHERE poll_date = ?
           ORDER BY poll_id`
        )
        .all(session.datum) as RelatedPoll[])
    : [];

  return {
    session_id: session.id,
    sitzung: session.sitzung,
    wahlperiode: session.wahlperiode,
    datum: session.datum,
    source_url: session.source_url,
    total_speeches: totalSpeeches,
    topic_count: topics.length,
    party_total: partyTotal,
    topics,
    related_polls: polls,
  };
}
