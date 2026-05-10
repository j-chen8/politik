import { getDb, searchPoliticiansDb } from "@/lib/db";

export type SearchHitType = "politician" | "speech" | "topic" | "vote" | "drucksache";

export interface PoliticianHit {
  type: "politician";
  id: number;
  name: string;
  party: string | null;
  subtitle: string;
}

export interface SpeechHit {
  type: "speech";
  rede_id: string;
  speaker: string;
  party: string | null;
  speech_date: string | null;
  topic_title: string | null;
  snippet: string;
}

export interface TopicHit {
  type: "topic";
  topic_id: number;
  topic_number: string;
  title: string;
  session_id: number;
  session_date: string | null;
  speech_count: number;
}

export interface VoteHit {
  type: "vote";
  poll_id: number;
  label: string;
  poll_date: string | null;
}

export interface DrucksacheHit {
  type: "drucksache";
  id: string;
  title: string;
  drucksache_nr: string | null;
  vorgangstyp: string | null;
  date: string | null;
}

export type SearchHit = PoliticianHit | SpeechHit | TopicHit | VoteHit | DrucksacheHit;

export interface SearchResults {
  query: string;
  politicians: PoliticianHit[];
  speeches: SpeechHit[];
  topics: TopicHit[];
  votes: VoteHit[];
  drucksachen: DrucksacheHit[];
  total: number;
}

const PER_TYPE_LIMIT = 6;

export function search(rawQuery: string): SearchResults {
  const query = rawQuery.trim();
  const empty: SearchResults = {
    query,
    politicians: [],
    speeches: [],
    topics: [],
    votes: [],
    drucksachen: [],
    total: 0,
  };
  if (query.length < 2) return empty;

  const like = `%${query}%`;
  const db = getDb();

  // 1. Personen via existierender Visibility-Logik
  const politicians: PoliticianHit[] = searchPoliticiansDb(query, PER_TYPE_LIMIT).map((p) => ({
    type: "politician",
    id: p.id,
    name: `${p.first_name} ${p.last_name}`.trim(),
    party: p.party_label,
    subtitle: [p.party_label, p.occupation].filter(Boolean).join(" · "),
  }));

  // 2. Themen aus plenar_topics (TOP-Titel)
  const topics = db
    .prepare(
      `SELECT pt.id, pt.topic_number, pt.title, pt.session_id, ps.datum,
              (SELECT COUNT(*) FROM plenar_speeches WHERE topic_id = pt.id) as speech_count
       FROM plenar_topics pt
       JOIN plenar_sessions ps ON pt.session_id = ps.id
       WHERE pt.title LIKE ?
       ORDER BY ps.datum DESC, pt.topic_number
       LIMIT ?`
    )
    .all(like, PER_TYPE_LIMIT) as {
    id: number;
    topic_number: string;
    title: string;
    session_id: number;
    datum: string | null;
    speech_count: number;
  }[];

  const topicHits: TopicHit[] = topics.map((t) => ({
    type: "topic",
    topic_id: t.id,
    topic_number: t.topic_number,
    title: t.title,
    session_id: t.session_id,
    session_date: t.datum,
    speech_count: t.speech_count,
  }));

  // 3. Reden via speech_analyses_v2.zusammenfassung_2_saetze
  // Join mit plenar_speeches + plenar_sessions für Speaker/Datum
  const speeches = db
    .prepare(
      `SELECT sa.rede_id,
              ps.speaker, ps.party,
              sess.datum as speech_date,
              pt.title as topic_title,
              sa.zusammenfassung_2_saetze as snippet
       FROM speech_analyses_v2 sa
       LEFT JOIN plenar_speeches ps ON sa.speech_id = ps.id
       LEFT JOIN plenar_sessions sess ON ps.session_id = sess.id
       LEFT JOIN plenar_topics pt ON ps.topic_id = pt.id
       WHERE sa.zusammenfassung_2_saetze LIKE ?
       ORDER BY sess.datum DESC
       LIMIT ?`
    )
    .all(like, PER_TYPE_LIMIT) as {
    rede_id: string;
    speaker: string | null;
    party: string | null;
    speech_date: string | null;
    topic_title: string | null;
    snippet: string;
  }[];

  const speechHits: SpeechHit[] = speeches.map((s) => ({
    type: "speech",
    rede_id: s.rede_id,
    speaker: s.speaker ?? "Unbekannt",
    party: s.party,
    speech_date: s.speech_date,
    topic_title: s.topic_title,
    snippet: s.snippet,
  }));

  // 4. Votes via poll_label
  const votes = db
    .prepare(
      `SELECT DISTINCT poll_id, poll_label, poll_date
       FROM votes
       WHERE poll_label LIKE ?
       ORDER BY poll_date DESC
       LIMIT ?`
    )
    .all(like, PER_TYPE_LIMIT) as {
    poll_id: number;
    poll_label: string;
    poll_date: string | null;
  }[];

  const voteHits: VoteHit[] = votes.map((v) => ({
    type: "vote",
    poll_id: v.poll_id,
    label: v.poll_label,
    poll_date: v.poll_date,
  }));

  // 5. Drucksachen via activities.titel
  const drucksachen = db
    .prepare(
      `SELECT id, titel, drucksache_nr, vorgangstyp, datum
       FROM activities
       WHERE titel LIKE ? AND drucksache_nr IS NOT NULL
       ORDER BY datum DESC
       LIMIT ?`
    )
    .all(like, PER_TYPE_LIMIT) as {
    id: string;
    titel: string;
    drucksache_nr: string | null;
    vorgangstyp: string | null;
    datum: string | null;
  }[];

  const drucksacheHits: DrucksacheHit[] = drucksachen.map((d) => ({
    type: "drucksache",
    id: d.id,
    title: d.titel,
    drucksache_nr: d.drucksache_nr,
    vorgangstyp: d.vorgangstyp,
    date: d.datum,
  }));

  return {
    query,
    politicians,
    speeches: speechHits,
    topics: topicHits,
    votes: voteHits,
    drucksachen: drucksacheHits,
    total:
      politicians.length +
      speechHits.length +
      topicHits.length +
      voteHits.length +
      drucksacheHits.length,
  };
}
