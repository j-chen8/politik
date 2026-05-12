import { getDb, searchPoliticiansDb } from "@/lib/db";
import { expandQuery } from "@/lib/synonyms";
import { ensureSearchFTS, ftsMatchClause, FTS_TABLES } from "@/lib/search-fts";

export type SearchHitType = "politician" | "speech" | "topic" | "vote" | "drucksache";

export interface PoliticianHit {
  type: "politician";
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  party: string | null;
  photo_url: string | null;
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
  tonalitaet: string | null;
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
  snippet: string | null;       // Erste ~120 Zeichen der Zusammenfassung
  batch_class: string | null;   // klein/mittel/gross/antwort/regierung
}

export type SearchHit = PoliticianHit | SpeechHit | TopicHit | VoteHit | DrucksacheHit;

export interface SearchTotals {
  politicians: number;
  speeches: number;
  topics: number;
  votes: number;
  drucksachen: number;
}

export interface SearchResults {
  query: string;
  politicians: PoliticianHit[];
  speeches: SpeechHit[];
  topics: TopicHit[];
  votes: VoteHit[];
  drucksachen: DrucksacheHit[];
  total: number;
  /** Anzahl ALLER Treffer pro Typ (nicht nur die zurückgegebenen PER_TYPE_LIMIT) */
  totals: SearchTotals;
  /** Pro Typ: wieviele Treffer matchten NUR den Original-Begriff (ohne Synonym-Match). */
  totalsOriginal: SearchTotals;
  /** Synonym-Terms, die zur Erweiterung beigetragen haben (ohne Original) */
  expansions: string[];
  /** Labels der gematchten Synonym-Cluster — für UI-Chip-Anzeige */
  matchedClusters: string[];
}

const PER_TYPE_LIMIT = 6;

/**
 * SQLite's eingebautes LOWER() ist ASCII-only — `LOWER('ÖPNV')` ergibt `'ÖPNV'`, nicht `'öpnv'`.
 * Für die Suche bedeutet das: `%öpnv%` matched `'ÖPNV-Reform'` nicht. Workaround:
 * eigene Unicode-aware-Funktion registrieren (JS String#toLowerCase respektiert Umlaute).
 */
let lowerDeRegistered = false;
function ensureLowerDe(db: ReturnType<typeof getDb>) {
  if (lowerDeRegistered) return;
  db.function("lower_de", { deterministic: true }, (s: unknown) =>
    typeof s === "string" ? s.toLowerCase() : null
  );
  lowerDeRegistered = true;
}

/** Baut "lower_de(col) LIKE ? OR lower_de(col) LIKE ? OR ..." mit n Platzhaltern */
function likeOr(column: string, n: number): string {
  return Array.from({ length: n }, () => `lower_de(${column}) LIKE ?`).join(" OR ");
}

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
    totals: { politicians: 0, speeches: 0, topics: 0, votes: 0, drucksachen: 0 },
    totalsOriginal: { politicians: 0, speeches: 0, topics: 0, votes: 0, drucksachen: 0 },
    expansions: [],
    matchedClusters: [],
  };
  if (query.length < 2) return empty;

  const { expansions, matchedClusters } = expandQuery(query);
  // Original-Pattern zuerst, dann Cluster-Synonyme — für Reden/Topics/Votes/Drucksachen.
  // Lowercase, weil die SQL-WHERE-Clause `lower_de(col) LIKE ?` matched.
  const patterns = [query, ...expansions].map((t) => `%${t.toLowerCase()}%`);
  const hasExpansions = expansions.length > 0;
  const originalPatterns = [patterns[0]];

  const db = getDb();
  ensureLowerDe(db);
  ensureSearchFTS(db);

  // FTS5-Match-Strings (für speeches + activities)
  const ftsAllTerms = ftsMatchClause([query, ...expansions]);
  const ftsOriginalOnly = ftsMatchClause([query]);

  // 1. Personen — KEINE Synonym-Erweiterung (Namen sind Eigennamen)
  // High-limit + slice, weil searchPoliticiansDb keinen separaten COUNT-Pfad exportiert
  // (Track-Isolation: db.ts nicht anfassen).
  const allPoliticians = searchPoliticiansDb(query, 1000);
  const politicians: PoliticianHit[] = allPoliticians.slice(0, PER_TYPE_LIMIT).map((p) => ({
    type: "politician",
    id: p.id,
    name: `${p.first_name} ${p.last_name}`.trim(),
    first_name: p.first_name,
    last_name: p.last_name,
    party: p.party_label,
    photo_url: p.photo_url,
    subtitle: [p.party_label, p.occupation].filter(Boolean).join(" · "),
  }));
  const totalPoliticians = allPoliticians.length;

  // 2. Themen aus plenar_topics (TOP-Titel)
  const topics = db
    .prepare(
      `SELECT pt.id, pt.topic_number, pt.title, pt.session_id, ps.datum,
              (SELECT COUNT(*) FROM plenar_speeches WHERE topic_id = pt.id) as speech_count
       FROM plenar_topics pt
       JOIN plenar_sessions ps ON pt.session_id = ps.id
       WHERE ${likeOr("pt.title", patterns.length)}
       ORDER BY ps.datum DESC, pt.topic_number
       LIMIT ?`
    )
    .all(...patterns, PER_TYPE_LIMIT) as {
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

  const totalTopics = (db
    .prepare(`SELECT COUNT(*) as n FROM plenar_topics pt WHERE ${likeOr("pt.title", patterns.length)}`)
    .get(...patterns) as { n: number }).n;
  const totalTopicsOriginal = hasExpansions
    ? (db
        .prepare(`SELECT COUNT(*) as n FROM plenar_topics pt WHERE ${likeOr("pt.title", 1)}`)
        .get(...originalPatterns) as { n: number }).n
    : totalTopics;

  // 3. Reden — FTS5 statt LIKE (vorher ~3s, jetzt <100ms)
  const speeches = ftsAllTerms
    ? (db
        .prepare(
          `SELECT sa.rede_id,
                  ps.speaker, ps.party,
                  sess.datum as speech_date,
                  pt.title as topic_title,
                  sa.zusammenfassung_2_saetze as snippet,
                  sa.tonalitaet
           FROM ${FTS_TABLES.speeches} fts
           JOIN speech_analyses_v2 sa ON sa.speech_id = fts.speech_id
           LEFT JOIN plenar_speeches ps ON sa.speech_id = ps.id
           LEFT JOIN plenar_sessions sess ON ps.session_id = sess.id
           LEFT JOIN plenar_topics pt ON ps.topic_id = pt.id
           WHERE fts.snippet MATCH ?
           ORDER BY sess.datum DESC
           LIMIT ?`
        )
        .all(ftsAllTerms, PER_TYPE_LIMIT) as {
        rede_id: string;
        speaker: string | null;
        party: string | null;
        speech_date: string | null;
        topic_title: string | null;
        snippet: string;
        tonalitaet: string | null;
      }[])
    : [];

  const speechHits: SpeechHit[] = speeches.map((s) => ({
    type: "speech",
    rede_id: s.rede_id,
    speaker: s.speaker ?? "Unbekannt",
    party: s.party,
    speech_date: s.speech_date,
    topic_title: s.topic_title,
    snippet: s.snippet,
    tonalitaet: s.tonalitaet,
  }));

  const totalSpeeches = ftsAllTerms
    ? (db
        .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?`)
        .get(ftsAllTerms) as { n: number }).n
    : 0;
  const totalSpeechesOriginal =
    hasExpansions && ftsOriginalOnly
      ? (db
          .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?`)
          .get(ftsOriginalOnly) as { n: number }).n
      : totalSpeeches;

  // 4. Votes via poll_label
  const votes = db
    .prepare(
      `SELECT DISTINCT poll_id, poll_label, poll_date
       FROM votes
       WHERE ${likeOr("poll_label", patterns.length)}
       ORDER BY poll_date DESC
       LIMIT ?`
    )
    .all(...patterns, PER_TYPE_LIMIT) as {
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

  const totalVotes = (db
    .prepare(
      `SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE ${likeOr("poll_label", patterns.length)}`
    )
    .get(...patterns) as { n: number }).n;
  const totalVotesOriginal = hasExpansions
    ? (db
        .prepare(`SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE ${likeOr("poll_label", 1)}`)
        .get(...originalPatterns) as { n: number }).n
    : totalVotes;

  // 5. Drucksachen — neue FTS5-Tabelle drucksachen_fts mit titel (= echter DS-Titel
  // aus activities.thema) + zusammenfassung + kerninhalt + thema_tags.
  // Ein Hit pro Drucksache (dedup'd auf drucksache_nr-Ebene).
  const drucksachen = ftsAllTerms
    ? (db
        .prepare(
          `SELECT fts.drucksache_nr, fts.titel, fts.zusammenfassung,
                  an.batch_class,
                  COALESCE(t.publication_date, (SELECT datum FROM activities WHERE drucksache_nr=fts.drucksache_nr LIMIT 1)) AS datum
           FROM ${FTS_TABLES.drucksachen} fts
           LEFT JOIN drucksache_analyses an ON an.drucksache_nr = fts.drucksache_nr
           LEFT JOIN drucksache_texts t ON t.drucksache_nr = fts.drucksache_nr
           WHERE ${FTS_TABLES.drucksachen} MATCH ?
           ORDER BY datum DESC
           LIMIT ?`
        )
        .all(ftsAllTerms, PER_TYPE_LIMIT) as {
        drucksache_nr: string;
        titel: string;
        zusammenfassung: string;
        batch_class: string | null;
        datum: string | null;
      }[])
    : [];

  const drucksacheHits: DrucksacheHit[] = drucksachen.map((d) => {
    const fullSummary = d.zusammenfassung ?? "";
    const snippet = fullSummary.length > 140 ? fullSummary.slice(0, 137) + "…" : fullSummary;
    return {
      type: "drucksache",
      id: d.drucksache_nr,
      title: d.titel || `Drucksache ${d.drucksache_nr}`,
      drucksache_nr: d.drucksache_nr,
      vorgangstyp: null,
      date: d.datum,
      snippet: snippet || null,
      batch_class: d.batch_class,
    };
  });

  const totalDrucksachen = ftsAllTerms
    ? (db
        .prepare(
          `SELECT COUNT(*) as n FROM ${FTS_TABLES.drucksachen}
           WHERE ${FTS_TABLES.drucksachen} MATCH ?`
        )
        .get(ftsAllTerms) as { n: number }).n
    : 0;
  const totalDrucksachenOriginal =
    hasExpansions && ftsOriginalOnly
      ? (db
          .prepare(
            `SELECT COUNT(*) as n FROM ${FTS_TABLES.activities} fts
             JOIN activities a ON a.id = fts.activity_id
             WHERE fts.titel MATCH ? AND a.drucksache_nr IS NOT NULL`
          )
          .get(ftsOriginalOnly) as { n: number }).n
      : totalDrucksachen;

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
    totals: {
      politicians: totalPoliticians,
      speeches: totalSpeeches,
      topics: totalTopics,
      votes: totalVotes,
      drucksachen: totalDrucksachen,
    },
    totalsOriginal: {
      // Personen-Suche kennt keine Synonym-Erweiterung → original == total
      politicians: totalPoliticians,
      speeches: totalSpeechesOriginal,
      topics: totalTopicsOriginal,
      votes: totalVotesOriginal,
      drucksachen: totalDrucksachenOriginal,
    },
    expansions,
    matchedClusters,
  };
}

export type SearchType = "politicians" | "speeches" | "topics" | "votes" | "drucksachen";

export interface SearchByTypeResult {
  query: string;
  type: SearchType;
  page: number;
  pageSize: number;
  total: number;
  /** Anzahl Treffer, die den Original-Begriff direkt enthalten (ohne Synonym-Match). */
  totalOriginal: number;
  items: SearchHit[];
  expansions: string[];
  matchedClusters: string[];
}

export function searchByType(
  rawQuery: string,
  type: SearchType,
  page: number = 1,
  pageSize: number = 50
): SearchByTypeResult {
  const query = rawQuery.trim();
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(200, Math.floor(pageSize)));
  const offset = (safePage - 1) * safePageSize;

  const empty: SearchByTypeResult = {
    query,
    type,
    page: safePage,
    pageSize: safePageSize,
    total: 0,
    totalOriginal: 0,
    items: [],
    expansions: [],
    matchedClusters: [],
  };
  if (query.length < 2) return empty;

  const { expansions, matchedClusters } = expandQuery(query);
  const patterns = [query, ...expansions].map((t) => `%${t.toLowerCase()}%`);
  const hasExpansions = expansions.length > 0;
  const originalPatterns = [patterns[0]];

  const db = getDb();
  ensureLowerDe(db);
  ensureSearchFTS(db);

  const ftsAllTerms = ftsMatchClause([query, ...expansions]);
  const ftsOriginalOnly = ftsMatchClause([query]);

  switch (type) {
    case "politicians": {
      // Personen ohne Synonym-Erweiterung
      const all = searchPoliticiansDb(query, 10000);
      const slice = all.slice(offset, offset + safePageSize);
      const items: PoliticianHit[] = slice.map((p) => ({
        type: "politician",
        id: p.id,
        name: `${p.first_name} ${p.last_name}`.trim(),
        first_name: p.first_name,
        last_name: p.last_name,
        party: p.party_label,
        photo_url: p.photo_url,
        subtitle: [p.party_label, p.occupation].filter(Boolean).join(" · "),
      }));
      return {
        ...empty,
        total: all.length,
        totalOriginal: all.length, // Personen kennen keine Synonym-Expansion
        items,
        expansions,
        matchedClusters,
      };
    }
    case "topics": {
      const total = (db
        .prepare(`SELECT COUNT(*) as n FROM plenar_topics pt WHERE ${likeOr("pt.title", patterns.length)}`)
        .get(...patterns) as { n: number }).n;
      const totalOriginal = hasExpansions
        ? (db
            .prepare(`SELECT COUNT(*) as n FROM plenar_topics pt WHERE ${likeOr("pt.title", 1)}`)
            .get(...originalPatterns) as { n: number }).n
        : total;
      const rows = db
        .prepare(
          `SELECT pt.id, pt.topic_number, pt.title, pt.session_id, ps.datum,
                  (SELECT COUNT(*) FROM plenar_speeches WHERE topic_id = pt.id) as speech_count
           FROM plenar_topics pt
           JOIN plenar_sessions ps ON pt.session_id = ps.id
           WHERE ${likeOr("pt.title", patterns.length)}
           ORDER BY ps.datum DESC, pt.topic_number
           LIMIT ? OFFSET ?`
        )
        .all(...patterns, safePageSize, offset) as {
        id: number;
        topic_number: string;
        title: string;
        session_id: number;
        datum: string | null;
        speech_count: number;
      }[];
      const items: TopicHit[] = rows.map((t) => ({
        type: "topic",
        topic_id: t.id,
        topic_number: t.topic_number,
        title: t.title,
        session_id: t.session_id,
        session_date: t.datum,
        speech_count: t.speech_count,
      }));
      return { ...empty, total, totalOriginal, items, expansions, matchedClusters };
    }
    case "speeches": {
      if (!ftsAllTerms) return empty;
      const total = (db
        .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?`)
        .get(ftsAllTerms) as { n: number }).n;
      const totalOriginal =
        hasExpansions && ftsOriginalOnly
          ? (db
              .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?`)
              .get(ftsOriginalOnly) as { n: number }).n
          : total;
      const rows = db
        .prepare(
          `SELECT sa.rede_id, ps.speaker, ps.party,
                  sess.datum as speech_date,
                  pt.title as topic_title,
                  sa.zusammenfassung_2_saetze as snippet,
                  sa.tonalitaet
           FROM ${FTS_TABLES.speeches} fts
           JOIN speech_analyses_v2 sa ON sa.speech_id = fts.speech_id
           LEFT JOIN plenar_speeches ps ON sa.speech_id = ps.id
           LEFT JOIN plenar_sessions sess ON ps.session_id = sess.id
           LEFT JOIN plenar_topics pt ON ps.topic_id = pt.id
           WHERE fts.snippet MATCH ?
           ORDER BY sess.datum DESC
           LIMIT ? OFFSET ?`
        )
        .all(ftsAllTerms, safePageSize, offset) as {
        rede_id: string;
        speaker: string | null;
        party: string | null;
        speech_date: string | null;
        topic_title: string | null;
        snippet: string;
        tonalitaet: string | null;
      }[];
      const items: SpeechHit[] = rows.map((s) => ({
        type: "speech",
        rede_id: s.rede_id,
        speaker: s.speaker ?? "Unbekannt",
        party: s.party,
        speech_date: s.speech_date,
        topic_title: s.topic_title,
        snippet: s.snippet,
        tonalitaet: s.tonalitaet,
      }));
      return { ...empty, total, totalOriginal, items, expansions, matchedClusters };
    }
    case "votes": {
      const total = (db
        .prepare(
          `SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE ${likeOr("poll_label", patterns.length)}`
        )
        .get(...patterns) as { n: number }).n;
      const totalOriginal = hasExpansions
        ? (db
            .prepare(
              `SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE ${likeOr("poll_label", 1)}`
            )
            .get(...originalPatterns) as { n: number }).n
        : total;
      const rows = db
        .prepare(
          `SELECT DISTINCT poll_id, poll_label, poll_date
           FROM votes
           WHERE ${likeOr("poll_label", patterns.length)}
           ORDER BY poll_date DESC
           LIMIT ? OFFSET ?`
        )
        .all(...patterns, safePageSize, offset) as {
        poll_id: number;
        poll_label: string;
        poll_date: string | null;
      }[];
      const items: VoteHit[] = rows.map((v) => ({
        type: "vote",
        poll_id: v.poll_id,
        label: v.poll_label,
        poll_date: v.poll_date,
      }));
      return { ...empty, total, totalOriginal, items, expansions, matchedClusters };
    }
    case "drucksachen": {
      if (!ftsAllTerms) return empty;
      const total = (db
        .prepare(
          `SELECT COUNT(*) as n FROM ${FTS_TABLES.drucksachen}
           WHERE ${FTS_TABLES.drucksachen} MATCH ?`
        )
        .get(ftsAllTerms) as { n: number }).n;
      const totalOriginal =
        hasExpansions && ftsOriginalOnly
          ? (db
              .prepare(
                `SELECT COUNT(*) as n FROM ${FTS_TABLES.drucksachen}
                 WHERE ${FTS_TABLES.drucksachen} MATCH ?`
              )
              .get(ftsOriginalOnly) as { n: number }).n
          : total;
      const rows = db
        .prepare(
          `SELECT fts.drucksache_nr, fts.titel, fts.zusammenfassung,
                  an.batch_class,
                  COALESCE(t.publication_date, (SELECT datum FROM activities WHERE drucksache_nr=fts.drucksache_nr LIMIT 1)) AS datum
           FROM ${FTS_TABLES.drucksachen} fts
           LEFT JOIN drucksache_analyses an ON an.drucksache_nr = fts.drucksache_nr
           LEFT JOIN drucksache_texts t ON t.drucksache_nr = fts.drucksache_nr
           WHERE ${FTS_TABLES.drucksachen} MATCH ?
           ORDER BY datum DESC
           LIMIT ? OFFSET ?`
        )
        .all(ftsAllTerms, safePageSize, offset) as {
        drucksache_nr: string;
        titel: string;
        zusammenfassung: string;
        batch_class: string | null;
        datum: string | null;
      }[];
      const items: DrucksacheHit[] = rows.map((d) => {
        const fullSummary = d.zusammenfassung ?? "";
        const snippet = fullSummary.length > 140 ? fullSummary.slice(0, 137) + "…" : fullSummary;
        return {
          type: "drucksache",
          id: d.drucksache_nr,
          title: d.titel || `Drucksache ${d.drucksache_nr}`,
          drucksache_nr: d.drucksache_nr,
          vorgangstyp: null,
          date: d.datum,
          snippet: snippet || null,
          batch_class: d.batch_class,
        };
      });
      return { ...empty, total, totalOriginal, items, expansions, matchedClusters };
    }
  }
}
