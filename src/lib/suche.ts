import { getDb, searchPoliticiansDb, searchBerlinPoliticiansDb } from "@/lib/db";
import { expandQuery } from "@/lib/synonyms";
import { ensureSearchFTS, ftsMatchClause, FTS_TABLES } from "@/lib/search-fts";
import { topicBySlug } from "@/lib/citizen-topics";

export type SearchHitType = "politician" | "speech" | "topic" | "vote" | "drucksache" | "qa";

export interface PoliticianHit {
  type: "politician";
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  party: string | null;
  photo_url: string | null;
  subtitle: string;
  /** true = ehemaliges MdB (kein aktuelles Mandat) — wird mit „ehem."-Badge gezeigt. */
  isFormer?: boolean;
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
  /** Bei Berlin-Suche: Detail-URL führt auf die Sitzungs-Seite (Berlin hat keine Redner-Seite,
   *  und Senator:innen/Präsidium haben kein Politiker-Profil). */
  detail_url?: string;
  politician_id?: number | null;
  parliament?: "bundestag" | "berlin";
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
  /** Bei Berlin-Suche: Detail-URL führt via dbid auf Berlin-DS-Page. */
  detail_url?: string;
  parliament?: "bundestag" | "berlin";
}

/** Berlin-spezifischer Speech-Hit: andere Detail-URL (speech_id) + Politiker-Verknüpfung. */
export interface BerlinSpeechHit {
  type: "speech";
  speech_id: string;
  politician_id: number | null;
  speech_date: string | null;
  snippet: string;
  parliament: "berlin";
}

export interface QaHit {
  type: "qa";
  pair_id: number;
  drucksache_nr: string;
  paar_index: number;
  fragesteller_name: string | null;
  fragesteller_party: string | null;
  fragesteller_politician_id: number | null;
  frage: string | null;
  antwort_snippet: string | null;  // Erste ~140 Zeichen der Antwort
  date: string | null;
  /** Bei Berlin: Detail-URL führt via dbid auf die Berlin-DS-Seite (statt /aktivitaeten). */
  detail_url?: string;
  parliament?: "bundestag" | "berlin";
}

export type SearchHit = PoliticianHit | SpeechHit | TopicHit | VoteHit | DrucksacheHit | QaHit;

export interface SearchTotals {
  politicians: number;
  speeches: number;
  topics: number;
  votes: number;
  drucksachen: number;
  qa: number;
}

export interface SearchResults {
  query: string;
  politicians: PoliticianHit[];
  speeches: SpeechHit[];
  topics: TopicHit[];
  votes: VoteHit[];
  drucksachen: DrucksacheHit[];
  qa: QaHit[];
  total: number;
  /** Anzahl ALLER Treffer pro Typ im AKTUELLEN Modus (exakt bzw. erweitert) */
  totals: SearchTotals;
  /** Pro Typ: wieviele Treffer matchten NUR den Original-Begriff (ohne Synonym-Match). */
  totalsOriginal: SearchTotals;
  /** Pro Typ: wieviele Treffer es MIT Synonym-Erweiterung gäbe — für den „+N verwandte"-Hinweis im Exakt-Modus. */
  totalsExpanded: SearchTotals;
  /** Ob die Synonym-Erweiterung aktiv war (true) oder nur exakt gesucht wurde (false). */
  expand: boolean;
  /** Synonym-Terms, die zur Erweiterung beigetragen haben (ohne Original) */
  expansions: string[];
  /** Labels der gematchten Synonym-Cluster — für UI-Chip-Anzeige */
  matchedClusters: string[];
  /** Exakter Treffer per Drucksachen-Nummer (z.B. „21/1350") — gepinnt über den Sektionen. */
  directHit: DrucksacheHit | null;
}

const PER_TYPE_LIMIT = 6;

// Such-Helfer (lower_de, word_match) sind zentral an der Connection registriert — siehe getDb().

/** Baut "word_match(col, ?) OR word_match(col, ?) ..." mit n Platzhaltern (Wortanfang-Match). */
function wordMatchOr(column: string, n: number): string {
  return Array.from({ length: n }, () => `word_match(${column}, ?)`).join(" OR ");
}

/**
 * Erkennt eine Bundestags-Drucksachen-Nummer (WP/laufnummer, z.B. „21/1350") in der Query.
 * Toleriert Präfixe wie „BT-Drs.", „Drs.", „Drucksache" und Leerzeichen um den Slash.
 * Gibt die normalisierte Nummer „WP/nr" zurück oder null.
 */
function extractDrucksacheNr(query: string): string | null {
  const m = query.match(/\b(\d{1,2})\s*\/\s*(\d{1,6})\b/);
  return m ? `${m[1]}/${m[2]}` : null;
}

/** Direkter Lookup einer Drucksache per Nummer (Equality, keine Volltextsuche). */
function lookupDrucksacheByNr(
  db: ReturnType<typeof getDb>,
  nr: string
): DrucksacheHit | null {
  const row = db
    .prepare(
      `SELECT fts.drucksache_nr, fts.titel, fts.zusammenfassung,
              an.batch_class,
              COALESCE(t.publication_date, (SELECT datum FROM activities WHERE drucksache_nr=fts.drucksache_nr LIMIT 1)) AS datum
       FROM ${FTS_TABLES.drucksachen} fts
       LEFT JOIN drucksache_analyses an ON an.drucksache_nr = fts.drucksache_nr
       LEFT JOIN drucksache_texts t ON t.drucksache_nr = fts.drucksache_nr
       WHERE fts.drucksache_nr = ?
       LIMIT 1`
    )
    .get(nr) as
    | {
        drucksache_nr: string;
        titel: string;
        zusammenfassung: string;
        batch_class: string | null;
        datum: string | null;
      }
    | undefined;
  if (!row) return null;
  const fullSummary = row.zusammenfassung ?? "";
  const snippet = fullSummary.length > 140 ? fullSummary.slice(0, 137) + "…" : fullSummary;
  return {
    type: "drucksache",
    id: row.drucksache_nr,
    title: row.titel || `Drucksache ${row.drucksache_nr}`,
    drucksache_nr: row.drucksache_nr,
    vorgangstyp: null,
    date: row.datum,
    snippet: snippet || null,
    batch_class: row.batch_class,
  };
}

export function search(rawQuery: string, expand: boolean = false): SearchResults {
  const query = rawQuery.trim();
  const zero: SearchTotals = { politicians: 0, speeches: 0, topics: 0, votes: 0, drucksachen: 0, qa: 0 };
  const empty: SearchResults = {
    query,
    politicians: [],
    speeches: [],
    topics: [],
    votes: [],
    drucksachen: [],
    qa: [],
    total: 0,
    totals: { ...zero },
    totalsOriginal: { ...zero },
    totalsExpanded: { ...zero },
    expand,
    expansions: [],
    matchedClusters: [],
    directHit: null,
  };
  if (query.length < 2) return empty;

  const { expansions, matchedClusters } = expandQuery(query);
  const hasExpansions = expansions.length > 0;

  // AKTIVE Begriffe: im Exakt-Modus NUR der Original-Begriff, im Erweitert-Modus + Synonyme.
  // Rohe Begriffe (kein %…%) — word_match() macht das Wortanfang-Matching selbst.
  const activeTerms = expand ? [query, ...expansions] : [query];
  const patterns = activeTerms.map((t) => t.toLowerCase());
  const originalPatterns = [query.toLowerCase()];
  const fullPatterns = [query, ...expansions].map((t) => t.toLowerCase());

  const db = getDb();
  ensureSearchFTS(db);

  // FTS5-Match-Strings
  const ftsActive = ftsMatchClause(activeTerms); // gezeigte Treffer (exakt oder erweitert)
  const ftsAllTerms = ftsMatchClause([query, ...expansions]); // für „erweitert"-Zähler
  const ftsOriginalOnly = ftsMatchClause([query]); // für „exakt"-Zähler
  // Ranking-Tier: im Erweitert-Modus Reden/Drucksachen mit ORIGINAL-Begriff zuerst,
  // dann die nur über Synonyme gematchten. Im Exakt-Modus sind ohnehin alle Tier 0.
  const ftsTierMatch = ftsOriginalOnly ?? ftsActive;

  // Exakter Drucksachen-Nummer-Treffer (gepinnt über den Sektionen) — z.B. „21/1350".
  const dsNr = extractDrucksacheNr(query);
  const directHit = dsNr ? lookupDrucksacheByNr(db, dsNr) : null;

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
    isFormer: !!p.is_former,
  }));
  const totalPoliticians = allPoliticians.length;

  // 2. Themen aus plenar_topics (TOP-Titel)
  const topics = db
    .prepare(
      `SELECT pt.id, pt.topic_number, pt.title, pt.session_id, ps.datum,
              (SELECT COUNT(*) FROM plenar_speeches WHERE topic_id = pt.id) as speech_count
       FROM plenar_topics pt
       JOIN plenar_sessions ps ON pt.session_id = ps.id
       WHERE ${wordMatchOr("pt.title", patterns.length)}
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

  const totalTopicsOriginal = (db
    .prepare(`SELECT COUNT(*) as n FROM plenar_topics pt WHERE ${wordMatchOr("pt.title", 1)}`)
    .get(...originalPatterns) as { n: number }).n;
  const totalTopicsExpanded = hasExpansions
    ? (db
        .prepare(`SELECT COUNT(*) as n FROM plenar_topics pt WHERE ${wordMatchOr("pt.title", fullPatterns.length)}`)
        .get(...fullPatterns) as { n: number }).n
    : totalTopicsOriginal;

  // 3. Reden — FTS5 statt LIKE (vorher ~3s, jetzt <100ms)
  const speeches = ftsActive
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
           ORDER BY (CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?) THEN 0 ELSE 1 END), sess.datum DESC
           LIMIT ?`
        )
        .all(ftsActive, ftsTierMatch, PER_TYPE_LIMIT) as {
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

  const totalSpeechesOriginal = ftsOriginalOnly
    ? (db
        .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?`)
        .get(ftsOriginalOnly) as { n: number }).n
    : 0;
  const totalSpeechesExpanded =
    hasExpansions && ftsAllTerms
      ? (db
          .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?`)
          .get(ftsAllTerms) as { n: number }).n
      : totalSpeechesOriginal;

  // 4. Votes via poll_label
  const votes = db
    .prepare(
      `SELECT DISTINCT poll_id, poll_label, poll_date
       FROM votes
       WHERE ${wordMatchOr("poll_label", patterns.length)}
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

  const totalVotesOriginal = (db
    .prepare(`SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE ${wordMatchOr("poll_label", 1)}`)
    .get(...originalPatterns) as { n: number }).n;
  const totalVotesExpanded = hasExpansions
    ? (db
        .prepare(
          `SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE ${wordMatchOr("poll_label", fullPatterns.length)}`
        )
        .get(...fullPatterns) as { n: number }).n
    : totalVotesOriginal;

  // 5. Drucksachen — neue FTS5-Tabelle drucksachen_fts mit titel (= echter DS-Titel
  // aus activities.thema) + zusammenfassung + kerninhalt + thema_tags.
  // Ein Hit pro Drucksache (dedup'd auf drucksache_nr-Ebene).
  const drucksachen = ftsActive
    ? (db
        .prepare(
          `SELECT fts.drucksache_nr, fts.titel, fts.zusammenfassung,
                  an.batch_class,
                  COALESCE(t.publication_date, (SELECT datum FROM activities WHERE drucksache_nr=fts.drucksache_nr LIMIT 1)) AS datum
           FROM ${FTS_TABLES.drucksachen} fts
           LEFT JOIN drucksache_analyses an ON an.drucksache_nr = fts.drucksache_nr
           LEFT JOIN drucksache_texts t ON t.drucksache_nr = fts.drucksache_nr
           WHERE ${FTS_TABLES.drucksachen} MATCH ?
           ORDER BY (CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.drucksachen} WHERE ${FTS_TABLES.drucksachen} MATCH ?) THEN 0 ELSE 1 END), datum DESC
           LIMIT ?`
        )
        .all(ftsActive, ftsTierMatch, PER_TYPE_LIMIT) as {
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

  const totalDrucksachenOriginal = ftsOriginalOnly
    ? (db
        .prepare(
          `SELECT COUNT(*) as n FROM ${FTS_TABLES.drucksachen}
           WHERE ${FTS_TABLES.drucksachen} MATCH ?`
        )
        .get(ftsOriginalOnly) as { n: number }).n
    : 0;
  const totalDrucksachenExpanded =
    hasExpansions && ftsAllTerms
      ? (db
          .prepare(
            `SELECT COUNT(*) as n FROM ${FTS_TABLES.drucksachen}
             WHERE ${FTS_TABLES.drucksachen} MATCH ?`
          )
          .get(ftsAllTerms) as { n: number }).n
      : totalDrucksachenOriginal;

  // 6. Fragen & Antworten — Schriftliche-Fragen-Einzelpaare (qa_fts über
  // frage_text + antwort_text + fragesteller_name). Ein Hit pro Paar.
  const qa = ftsActive
    ? (db
        .prepare(
          `SELECT qa.id AS pair_id, qa.drucksache_nr, qa.paar_index,
                  qa.fragesteller_name, qa.fragesteller_party, qa.fragesteller_politician_id,
                  qa.frage_text, qa.antwort_text,
                  COALESCE(qa.antwort_datum_iso, (SELECT publication_date FROM drucksache_texts WHERE drucksache_nr = qa.drucksache_nr)) AS datum
           FROM ${FTS_TABLES.qa} fts
           JOIN drucksache_qa_paare qa ON qa.id = fts.pair_id
           WHERE ${FTS_TABLES.qa} MATCH ?
           ORDER BY (CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.qa} WHERE ${FTS_TABLES.qa} MATCH ?) THEN 0 ELSE 1 END), datum DESC
           LIMIT ?`
        )
        .all(ftsActive, ftsTierMatch, PER_TYPE_LIMIT) as {
        pair_id: number;
        drucksache_nr: string;
        paar_index: number;
        fragesteller_name: string | null;
        fragesteller_party: string | null;
        fragesteller_politician_id: number | null;
        frage_text: string | null;
        antwort_text: string | null;
        datum: string | null;
      }[])
    : [];

  const qaHits: QaHit[] = qa.map((r) => {
    const ans = r.antwort_text ?? "";
    return {
      type: "qa",
      pair_id: r.pair_id,
      drucksache_nr: r.drucksache_nr,
      paar_index: r.paar_index,
      fragesteller_name: r.fragesteller_name,
      fragesteller_party: r.fragesteller_party,
      fragesteller_politician_id: r.fragesteller_politician_id,
      frage: r.frage_text,
      antwort_snippet: ans ? (ans.length > 140 ? ans.slice(0, 137) + "…" : ans) : null,
      date: r.datum,
    };
  });

  const totalQaOriginal = ftsOriginalOnly
    ? (db
        .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.qa} WHERE ${FTS_TABLES.qa} MATCH ?`)
        .get(ftsOriginalOnly) as { n: number }).n
    : 0;
  const totalQaExpanded =
    hasExpansions && ftsAllTerms
      ? (db
          .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.qa} WHERE ${FTS_TABLES.qa} MATCH ?`)
          .get(ftsAllTerms) as { n: number }).n
      : totalQaOriginal;

  // Personen-Suche kennt keine Synonym-Erweiterung → original == expanded.
  const totalsOriginal: SearchTotals = {
    politicians: totalPoliticians,
    speeches: totalSpeechesOriginal,
    topics: totalTopicsOriginal,
    votes: totalVotesOriginal,
    drucksachen: totalDrucksachenOriginal,
    qa: totalQaOriginal,
  };
  const totalsExpanded: SearchTotals = {
    politicians: totalPoliticians,
    speeches: totalSpeechesExpanded,
    topics: totalTopicsExpanded,
    votes: totalVotesExpanded,
    drucksachen: totalDrucksachenExpanded,
    qa: totalQaExpanded,
  };

  // Den gepinnten Direkt-Treffer aus der normalen DS-Liste entfernen (kein Doppel).
  const drucksachenOut = directHit
    ? drucksacheHits.filter((d) => d.drucksache_nr !== directHit.drucksache_nr)
    : drucksacheHits;

  return {
    query,
    politicians,
    speeches: speechHits,
    topics: topicHits,
    votes: voteHits,
    drucksachen: drucksachenOut,
    qa: qaHits,
    total:
      (directHit ? 1 : 0) +
      politicians.length +
      speechHits.length +
      topicHits.length +
      voteHits.length +
      drucksachenOut.length +
      qaHits.length,
    totals: expand ? totalsExpanded : totalsOriginal,
    totalsOriginal,
    totalsExpanded,
    expand,
    expansions,
    matchedClusters,
    directHit,
  };
}

export type SearchType = "politicians" | "speeches" | "topics" | "votes" | "drucksachen" | "qa";

export interface SearchByTypeResult {
  query: string;
  type: SearchType;
  page: number;
  pageSize: number;
  total: number;
  /** Anzahl Treffer, die den Original-Begriff direkt enthalten (ohne Synonym-Match). */
  totalOriginal: number;
  /** Anzahl Treffer MIT Synonym-Erweiterung — für den „+N verwandte"-Hinweis. */
  totalExpanded: number;
  /** Ob die Synonym-Erweiterung aktiv war. */
  expand: boolean;
  /** Sortierung: nach Datum (neueste zuerst) oder nach Relevanz (bm25). */
  sort: "date" | "relevance";
  items: SearchHit[];
  expansions: string[];
  matchedClusters: string[];
}

export function searchByType(
  rawQuery: string,
  type: SearchType,
  page: number = 1,
  pageSize: number = 50,
  expand: boolean = false,
  sort: "date" | "relevance" = "date",
  klasse: string | null = null
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
    totalExpanded: 0,
    expand,
    sort,
    items: [],
    expansions: [],
    matchedClusters: [],
  };
  if (query.length < 2) return empty;

  const { expansions, matchedClusters } = expandQuery(query);
  const hasExpansions = expansions.length > 0;
  // Aktive Begriffe: exakt (nur Original) bzw. erweitert (+ Synonyme).
  // Rohe Begriffe (kein %…%) — word_match() macht das Wortanfang-Matching selbst.
  const activeTerms = expand ? [query, ...expansions] : [query];
  const activePatterns = activeTerms.map((t) => t.toLowerCase());
  const originalPatterns = [query.toLowerCase()];
  const fullPatterns = [query, ...expansions].map((t) => t.toLowerCase());

  const db = getDb();
  ensureSearchFTS(db);

  const ftsActive = ftsMatchClause(activeTerms);
  const ftsAllTerms = ftsMatchClause([query, ...expansions]);
  const ftsOriginalOnly = ftsMatchClause([query]);
  // Original-Treffer zuerst, dann Synonym-only — siehe search() oben.
  const ftsTierMatch = ftsOriginalOnly ?? ftsActive;

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
      isFormer: !!p.is_former,
      }));
      return {
        ...empty,
        total: all.length,
        totalOriginal: all.length, // Personen kennen keine Synonym-Expansion
        totalExpanded: all.length,
        items,
        expansions,
        matchedClusters,
      };
    }
    case "topics": {
      const totalOriginal = (db
        .prepare(`SELECT COUNT(*) as n FROM plenar_topics pt WHERE ${wordMatchOr("pt.title", 1)}`)
        .get(...originalPatterns) as { n: number }).n;
      const totalExpanded = hasExpansions
        ? (db
            .prepare(`SELECT COUNT(*) as n FROM plenar_topics pt WHERE ${wordMatchOr("pt.title", fullPatterns.length)}`)
            .get(...fullPatterns) as { n: number }).n
        : totalOriginal;
      const total = expand ? totalExpanded : totalOriginal;
      const rows = db
        .prepare(
          `SELECT pt.id, pt.topic_number, pt.title, pt.session_id, ps.datum,
                  (SELECT COUNT(*) FROM plenar_speeches WHERE topic_id = pt.id) as speech_count
           FROM plenar_topics pt
           JOIN plenar_sessions ps ON pt.session_id = ps.id
           WHERE ${wordMatchOr("pt.title", activePatterns.length)}
           ORDER BY ps.datum DESC, pt.topic_number
           LIMIT ? OFFSET ?`
        )
        .all(...activePatterns, safePageSize, offset) as {
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
      return { ...empty, total, totalOriginal, totalExpanded, items, expansions, matchedClusters };
    }
    case "speeches": {
      if (!ftsActive) return empty;
      const totalOriginal = ftsOriginalOnly
        ? (db
            .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?`)
            .get(ftsOriginalOnly) as { n: number }).n
        : 0;
      const totalExpanded =
        hasExpansions && ftsAllTerms
          ? (db
              .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?`)
              .get(ftsAllTerms) as { n: number }).n
          : totalOriginal;
      const total = expand ? totalExpanded : totalOriginal;
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
           ORDER BY (CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.speeches} WHERE snippet MATCH ?) THEN 0 ELSE 1 END), ${sort === "relevance" ? `bm25(${FTS_TABLES.speeches}), ` : ""}sess.datum DESC
           LIMIT ? OFFSET ?`
        )
        .all(ftsActive, ftsTierMatch, safePageSize, offset) as {
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
      return { ...empty, total, totalOriginal, totalExpanded, items, expansions, matchedClusters };
    }
    case "votes": {
      const totalOriginal = (db
        .prepare(
          `SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE ${wordMatchOr("poll_label", 1)}`
        )
        .get(...originalPatterns) as { n: number }).n;
      const totalExpanded = hasExpansions
        ? (db
            .prepare(
              `SELECT COUNT(DISTINCT poll_id) as n FROM votes WHERE ${wordMatchOr("poll_label", fullPatterns.length)}`
            )
            .get(...fullPatterns) as { n: number }).n
        : totalOriginal;
      const total = expand ? totalExpanded : totalOriginal;
      const rows = db
        .prepare(
          `SELECT DISTINCT poll_id, poll_label, poll_date
           FROM votes
           WHERE ${wordMatchOr("poll_label", activePatterns.length)}
           ORDER BY poll_date DESC
           LIMIT ? OFFSET ?`
        )
        .all(...activePatterns, safePageSize, offset) as {
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
      return { ...empty, total, totalOriginal, totalExpanded, items, expansions, matchedClusters };
    }
    case "drucksachen": {
      if (!ftsActive) return empty;
      // Optionaler Klasse-Filter (Drucksachen-Typ: gross=Gesetzentwurf, klein=Kleine Anfrage, …).
      const klFilter = klasse ? " AND an.batch_class = ?" : "";
      const klFrom = klasse
        ? `${FTS_TABLES.drucksachen} fts LEFT JOIN drucksache_analyses an ON an.drucksache_nr = fts.drucksache_nr`
        : FTS_TABLES.drucksachen;
      const dsCount = (matchClause: string): number => {
        const sql = `SELECT COUNT(*) as n FROM ${klFrom} WHERE ${FTS_TABLES.drucksachen} MATCH ?${klFilter}`;
        const params = klasse ? [matchClause, klasse] : [matchClause];
        return (db.prepare(sql).get(...params) as { n: number }).n;
      };
      const totalOriginal = ftsOriginalOnly ? dsCount(ftsOriginalOnly) : 0;
      const totalExpanded =
        hasExpansions && ftsAllTerms ? dsCount(ftsAllTerms) : totalOriginal;
      const total = expand ? totalExpanded : totalOriginal;
      // Sortierung: relevance = bm25 (Titel-Gewicht 4, Zus. 2, Kern 1, Tags 2) als Tiebreaker nach Tier; sonst Datum.
      const dsOrder = `(CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.drucksachen} WHERE ${FTS_TABLES.drucksachen} MATCH ?) THEN 0 ELSE 1 END), ${sort === "relevance" ? `bm25(${FTS_TABLES.drucksachen}, 0.0, 4.0, 2.0, 1.0, 2.0), ` : ""}datum DESC`;
      const itemParams: (string | number | null)[] = klasse
        ? [ftsActive, klasse, ftsTierMatch, safePageSize, offset]
        : [ftsActive, ftsTierMatch, safePageSize, offset];
      const rows = db
        .prepare(
          `SELECT fts.drucksache_nr, fts.titel, fts.zusammenfassung,
                  an.batch_class,
                  COALESCE(t.publication_date, (SELECT datum FROM activities WHERE drucksache_nr=fts.drucksache_nr LIMIT 1)) AS datum
           FROM ${FTS_TABLES.drucksachen} fts
           LEFT JOIN drucksache_analyses an ON an.drucksache_nr = fts.drucksache_nr
           LEFT JOIN drucksache_texts t ON t.drucksache_nr = fts.drucksache_nr
           WHERE ${FTS_TABLES.drucksachen} MATCH ?${klFilter}
           ORDER BY ${dsOrder}
           LIMIT ? OFFSET ?`
        )
        .all(...itemParams) as {
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
      return { ...empty, total, totalOriginal, totalExpanded, items, expansions, matchedClusters };
    }
    case "qa": {
      if (!ftsActive) return empty;
      const totalOriginal = ftsOriginalOnly
        ? (db
            .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.qa} WHERE ${FTS_TABLES.qa} MATCH ?`)
            .get(ftsOriginalOnly) as { n: number }).n
        : 0;
      const totalExpanded =
        hasExpansions && ftsAllTerms
          ? (db
              .prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.qa} WHERE ${FTS_TABLES.qa} MATCH ?`)
              .get(ftsAllTerms) as { n: number }).n
          : totalOriginal;
      const total = expand ? totalExpanded : totalOriginal;
      // Sortierung: relevance = bm25 (Frage 2, Antwort 1, Fragesteller 3) als Tiebreaker nach Tier; sonst Datum.
      const qaOrder = `(CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.qa} WHERE ${FTS_TABLES.qa} MATCH ?) THEN 0 ELSE 1 END), ${sort === "relevance" ? `bm25(${FTS_TABLES.qa}, 2.0, 1.0, 3.0), ` : ""}datum DESC`;
      const rows = db
        .prepare(
          `SELECT qa.id AS pair_id, qa.drucksache_nr, qa.paar_index,
                  qa.fragesteller_name, qa.fragesteller_party, qa.fragesteller_politician_id,
                  qa.frage_text, qa.antwort_text,
                  COALESCE(qa.antwort_datum_iso, (SELECT publication_date FROM drucksache_texts WHERE drucksache_nr = qa.drucksache_nr)) AS datum
           FROM ${FTS_TABLES.qa} fts
           JOIN drucksache_qa_paare qa ON qa.id = fts.pair_id
           WHERE ${FTS_TABLES.qa} MATCH ?
           ORDER BY ${qaOrder}
           LIMIT ? OFFSET ?`
        )
        .all(ftsActive, ftsTierMatch, safePageSize, offset) as {
        pair_id: number;
        drucksache_nr: string;
        paar_index: number;
        fragesteller_name: string | null;
        fragesteller_party: string | null;
        fragesteller_politician_id: number | null;
        frage_text: string | null;
        antwort_text: string | null;
        datum: string | null;
      }[];
      const items: QaHit[] = rows.map((r) => {
        const ans = r.antwort_text ?? "";
        return {
          type: "qa",
          pair_id: r.pair_id,
          drucksache_nr: r.drucksache_nr,
          paar_index: r.paar_index,
          fragesteller_name: r.fragesteller_name,
          fragesteller_party: r.fragesteller_party,
          fragesteller_politician_id: r.fragesteller_politician_id,
          frage: r.frage_text,
          antwort_snippet: ans ? (ans.length > 140 ? ans.slice(0, 137) + "…" : ans) : null,
          date: r.datum,
        };
      });
      return { ...empty, total, totalOriginal, totalExpanded, items, expansions, matchedClusters };
    }
  }
}

// ============================================================
// Berlin-Pilot: scope-getrennte Suche über berlin_speeches_fts +
// berlin_drucksachen_fts. Eigene Funktion statt Scope-Param, damit
// Bundes-Pfad track-isoliert bleibt.
// ============================================================

export type BerlinSearchType = "speeches" | "drucksachen" | "politicians" | "qa";

/** Erstes Element eines (ggf. LLM-stringifizierten) JSON-Arrays — für Q&A-Frage/Antwort-Snippets. */
function firstBullet(json: string | null): string | null {
  if (!json) return null;
  try {
    let v: unknown = JSON.parse(json);
    if (typeof v === "string") v = JSON.parse(v); // doppelt-stringifiziert (LLM-Array-Drift)
    if (Array.isArray(v) && v.length) return String(v[0]).trim() || null;
  } catch { /* kein valides JSON → null */ }
  return null;
}

type BerlinQaRow = {
  dbid: string; dokNr: string | null; datum: string | null;
  zusammenfassung: string | null; frageJson: string | null; antwortJson: string | null;
};

/**
 * Berlin-Q&A als QaHit auf DOKUMENT-Korn: jede `anfrage_antwort`-Drucksache = ein Q&A-Hit
 * (Urheber = Fragesteller, erste Frage-Bullet = Frage, Link → Berlin-DS-Seite). Anders als beim
 * Bundestag (Paar-Korn) gibt es pro Berliner Anfrage genau einen Urheber, daher kein Paar-Split.
 */
function mapBerlinQaHits(db: ReturnType<typeof getDb>, rows: BerlinQaRow[]): QaHit[] {
  const askerStmt = db.prepare(
    `SELECT p.id AS pid, p.first_name, p.last_name, pa.label AS party
     FROM berlin_document_persons bdp
     JOIN politicians p ON p.id = bdp.politician_id
     LEFT JOIN parties pa ON pa.id = p.party_id
     WHERE bdp.dbid = ? AND bdp.role = 'urheber' LIMIT 1`
  );
  return rows.map((r) => {
    const a = askerStmt.get(r.dbid) as { pid: number; first_name: string; last_name: string; party: string | null } | undefined;
    const frage = firstBullet(r.frageJson) ?? r.zusammenfassung ?? null;
    const ans = firstBullet(r.antwortJson);
    return {
      type: "qa" as const,
      pair_id: 0,            // Berlin: kein Paar-Korn → kein pair_id
      drucksache_nr: r.dokNr ?? r.dbid,
      paar_index: 0,
      fragesteller_name: a ? `${a.first_name} ${a.last_name}`.trim() : null,
      fragesteller_party: a?.party ?? null,
      fragesteller_politician_id: a?.pid ?? null,
      frage,
      antwort_snippet: ans ? (ans.length > 140 ? ans.slice(0, 137) + "…" : ans) : null,
      date: r.datum,
      detail_url: `/parlamente/berlin/drucksache/${r.dbid}`,
      parliament: "berlin" as const,
    };
  });
}

/** Berlin-Vollliste: gleiche Shape wie searchByType, damit SearchFullList (scope=berlin) sie 1:1 rendert. */
export function searchBerlinByType(
  rawQuery: string,
  type: BerlinSearchType,
  page = 1,
  pageSize = 50,
  expand = false,
  sort: "date" | "relevance" = "date",
  klasse: string | null = null
): SearchByTypeResult {
  const query = rawQuery.trim();
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(200, Math.floor(pageSize)));
  const offset = (safePage - 1) * safePageSize;
  const empty: SearchByTypeResult = {
    query, type, page: safePage, pageSize: safePageSize,
    total: 0, totalOriginal: 0, totalExpanded: 0, expand, sort,
    items: [], expansions: [], matchedClusters: [],
  };
  if (query.length < 2) return empty;

  const { expansions, matchedClusters } = expandQuery(query);
  const hasExpansions = expansions.length > 0;
  const db = getDb();
  ensureSearchFTS(db);
  // Exakt-Default: nur der Original-Begriff; Synonyme nur bei expand=true (wie Bund).
  const ftsActive = ftsMatchClause(expand ? [query, ...expansions] : [query]);
  const ftsOriginalOnly = ftsMatchClause([query]);
  const ftsExpandedAll = ftsMatchClause([query, ...expansions]);
  if (!ftsActive && type !== "politicians") return empty;

  if (type === "politicians") {
    // Berlin-Scope: Personen mit Berlin-Mandat (aktiv ODER ehemalig, is_former-Flag).
    // NICHT searchPoliticiansDb (Bundestag) — sonst verschwinden Berliner aus der
    // Berlin-Suche, sobald das Bundestags-Leck zu ist. Siehe searchBerlinPoliticiansDb.
    const all = searchBerlinPoliticiansDb(query, 10000);
    const items: PoliticianHit[] = all.slice(offset, offset + safePageSize).map((p) => ({
      type: "politician", id: p.id,
      name: `${p.first_name} ${p.last_name}`.trim(),
      first_name: p.first_name, last_name: p.last_name,
      party: p.party_label, photo_url: p.photo_url,
      subtitle: [p.party_label, p.occupation].filter(Boolean).join(" · "),
      isFormer: !!p.is_former,
    }));
    // Personen kennen keine Synonym-Expansion → alle drei Zähler gleich.
    return { ...empty, total: all.length, totalOriginal: all.length, totalExpanded: all.length, items, expansions, matchedClusters };
  }

  // Synonym-Zähler (exakt vs. erweitert) — gleiche Tabelle für beide Treffer-Typen.
  const countBerlin = (table: string, fts: string | null) => fts
    ? (db.prepare(`SELECT COUNT(*) as n FROM ${table} WHERE ${table} MATCH ?`).get(fts) as { n: number }).n
    : 0;

  if (type === "speeches") {
    const total = countBerlin(FTS_TABLES.berlinSpeeches, ftsActive);
    const totalOriginal = countBerlin(FTS_TABLES.berlinSpeeches, ftsOriginalOnly);
    const totalExpanded = hasExpansions ? countBerlin(FTS_TABLES.berlinSpeeches, ftsExpandedAll) : totalOriginal;
    const rows = db
      .prepare(
        `SELECT fts.speech_id, fts.politician_id, fts.datum,
                bs.speaker_name, bs.speaker_party, bs.sitzung_nr,
                snippet(${FTS_TABLES.berlinSpeeches}, 0, '', '', '…', 32) AS snippet_text
         FROM ${FTS_TABLES.berlinSpeeches} fts
         JOIN berlin_speeches bs ON bs.speech_id = fts.speech_id
         WHERE ${FTS_TABLES.berlinSpeeches} MATCH ?
         ORDER BY ${sort === "relevance" ? `bm25(${FTS_TABLES.berlinSpeeches})` : "fts.datum DESC"}
         LIMIT ? OFFSET ?`
      )
      .all(ftsActive!, safePageSize, offset) as Array<{
        speech_id: string; politician_id: number | null; datum: string | null;
        speaker_name: string; speaker_party: string | null; sitzung_nr: number; snippet_text: string;
      }>;
    const items: SpeechHit[] = rows.map((r) => ({
      type: "speech",
      rede_id: r.speech_id,
      speaker: r.speaker_name || "Unbekannt",
      party: r.speaker_party || null,
      speech_date: r.datum,
      topic_title: null,
      snippet: r.snippet_text,
      tonalitaet: null,
      detail_url: `/parlamente/berlin/redner/${encodeURIComponent(r.speaker_name)}`,
      politician_id: r.politician_id,
      parliament: "berlin",
    }));
    return { ...empty, total, totalOriginal, totalExpanded, items, expansions, matchedClusters };
  }

  if (type === "qa") {
    // Berlin-Q&A (schriftliche Anfragen) als eigener Ergebnistyp — Dokument-Korn.
    const qaCount = (fts: string | null) => fts
      ? (db.prepare(
          `SELECT COUNT(*) as n FROM ${FTS_TABLES.berlinDrucksachen}
           WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ? AND klasse = 'anfrage_antwort'`
        ).get(fts) as { n: number }).n
      : 0;
    const total = qaCount(ftsActive);
    const totalOriginal = qaCount(ftsOriginalOnly);
    const totalExpanded = hasExpansions ? qaCount(ftsExpandedAll) : totalOriginal;
    // NULLs ans Ende in BEIDEN Sortier-Richtungen (wie Bundestag-Q&A).
    const qaOrder = sort === "relevance"
      ? `bm25(${FTS_TABLES.berlinDrucksachen})`
      : "bd.dok_datum IS NULL, bd.dok_datum DESC";
    const rows = db.prepare(
      `SELECT fts.dbid, bd.dok_nr AS dokNr, bd.dok_datum AS datum,
              a.zusammenfassung, a.kerninhalt_frage_json AS frageJson, a.kerninhalt_antwort_json AS antwortJson
       FROM ${FTS_TABLES.berlinDrucksachen} fts
       JOIN berlin_drucksachen_analyses a ON a.dbid = fts.dbid
       LEFT JOIN berlin_documents bd ON bd.dbid = fts.dbid
       WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ? AND fts.klasse = 'anfrage_antwort'
       ORDER BY ${qaOrder}
       LIMIT ? OFFSET ?`
    ).all(ftsActive!, safePageSize, offset) as BerlinQaRow[];
    const items = mapBerlinQaHits(db, rows);
    return { ...empty, total, totalOriginal, totalExpanded, items, expansions, matchedClusters };
  }

  // type === "drucksachen" — nur legislative DS (anfrage_antwort ist eigener qa-Typ),
  // optionaler Klasse-Filter (gesetzentwurf/antrag/…) + Sortierung
  const dsCount = (fts: string | null) => fts
    ? (db.prepare(
        `SELECT COUNT(*) as n FROM ${FTS_TABLES.berlinDrucksachen}
         WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ? AND klasse != 'anfrage_antwort'${klasse ? " AND klasse = ?" : ""}`
      ).get(...(klasse ? [fts, klasse] : [fts])) as { n: number }).n
    : 0;
  const total = dsCount(ftsActive);
  const totalOriginal = dsCount(ftsOriginalOnly);
  const totalExpanded = hasExpansions ? dsCount(ftsExpandedAll) : totalOriginal;
  const dsOrder = sort === "relevance"
    ? `bm25(${FTS_TABLES.berlinDrucksachen})`
    : "bd.dok_datum IS NULL, bd.dok_datum DESC";
  const rows = db
    .prepare(
      `SELECT fts.dbid, fts.klasse, COALESCE(NULLIF(TRIM(fts.titel),''), bda.derived_titel) AS titel, fts.zusammenfassung, bd.dok_nr, bd.dok_datum
       FROM ${FTS_TABLES.berlinDrucksachen} fts
       LEFT JOIN berlin_documents bd ON bd.dbid = fts.dbid
       LEFT JOIN berlin_drucksachen_analyses bda ON bda.dbid = fts.dbid
       WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ? AND fts.klasse != 'anfrage_antwort'${klasse ? " AND fts.klasse = ?" : ""}
       ORDER BY ${dsOrder}
       LIMIT ? OFFSET ?`
    )
    .all(...(klasse ? [ftsActive!, klasse, safePageSize, offset] : [ftsActive!, safePageSize, offset])) as Array<{
    dbid: string; klasse: string; titel: string | null; zusammenfassung: string;
    dok_nr: string | null; dok_datum: string | null;
  }>;
  const items: DrucksacheHit[] = rows.map((d) => {
    const fullSummary = d.zusammenfassung ?? "";
    const snippet = fullSummary.length > 140 ? fullSummary.slice(0, 137) + "…" : fullSummary;
    return {
      type: "drucksache",
      id: d.dbid,
      title: d.titel || `Berlin-Drucksache ${d.dok_nr ?? d.dbid}`,
      drucksache_nr: d.dok_nr,
      vorgangstyp: d.klasse,
      date: d.dok_datum,
      snippet: snippet || null,
      batch_class: d.klasse,
      detail_url: `/parlamente/berlin/drucksache/${d.dbid}`,
      parliament: "berlin",
    };
  });
  return { ...empty, total, totalOriginal, totalExpanded, items, expansions, matchedClusters };
}

/**
 * Kombinierte Berlin-Suche — SearchResults-kompatibel, damit dieselbe CommandPalette
 * (scope="berlin") sie rendern kann. Berlin kennt nur 3 Typen: Personen, Reden,
 * Drucksachen (topics/votes bleiben leer). Exakt-Default + Opt-in-Synonym wie Bund.
 * Reden routen aufs Politiker-Profil (Berlin hat keine eigene Redner-Seite).
 */
export function searchBerlin(rawQuery: string, expand: boolean = false): SearchResults {
  const query = rawQuery.trim();
  const zero: SearchTotals = { politicians: 0, speeches: 0, topics: 0, votes: 0, drucksachen: 0, qa: 0 };
  const empty: SearchResults = {
    query, politicians: [], speeches: [], topics: [], votes: [], drucksachen: [], qa: [],
    total: 0, totals: { ...zero }, totalsOriginal: { ...zero }, totalsExpanded: { ...zero },
    expand, expansions: [], matchedClusters: [], directHit: null,
  };
  if (query.length < 2) return empty;

  const { expansions, matchedClusters } = expandQuery(query);
  const hasExpansions = expansions.length > 0;
  const activeTerms = expand ? [query, ...expansions] : [query];

  const db = getDb();
  ensureSearchFTS(db);

  const ftsActive = ftsMatchClause(activeTerms);
  const ftsOriginalOnly = ftsMatchClause([query]);
  const ftsAllTerms = ftsMatchClause([query, ...expansions]);
  const ftsTierMatch = ftsOriginalOnly ?? ftsActive;

  // 1. Personen — Berlin-Scope (Berlin-Mandat, aktiv ODER ehemalig), keine Synonyme
  const allPoliticians = searchBerlinPoliticiansDb(query, 1000);
  const politicians: PoliticianHit[] = allPoliticians.slice(0, PER_TYPE_LIMIT).map((p) => ({
    type: "politician", id: p.id,
    name: `${p.first_name} ${p.last_name}`.trim(),
    first_name: p.first_name, last_name: p.last_name,
    party: p.party_label, photo_url: p.photo_url,
    subtitle: [p.party_label, p.occupation].filter(Boolean).join(" · "),
    isFormer: !!p.is_former,
  }));
  const totalPoliticians = allPoliticians.length;

  // 2. Reden (berlin_speeches_fts), Speaker via politicians-Join für SpeechHit-Shape
  const speeches: SpeechHit[] = ftsActive
    ? (db.prepare(
        `SELECT fts.speech_id, fts.politician_id, fts.datum,
                bs.speaker_name, bs.speaker_party, bs.sitzung_nr,
                snippet(${FTS_TABLES.berlinSpeeches}, 0, '', '', '…', 32) AS snippet_text
         FROM ${FTS_TABLES.berlinSpeeches} fts
         JOIN berlin_speeches bs ON bs.speech_id = fts.speech_id
         WHERE ${FTS_TABLES.berlinSpeeches} MATCH ?
         ORDER BY (CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.berlinSpeeches} WHERE ${FTS_TABLES.berlinSpeeches} MATCH ?) THEN 0 ELSE 1 END), fts.datum DESC
         LIMIT ?`
      ).all(ftsActive, ftsTierMatch, PER_TYPE_LIMIT) as Array<{
        speech_id: string; politician_id: number | null; datum: string | null;
        speaker_name: string; speaker_party: string | null; sitzung_nr: number; snippet_text: string;
      }>).map((r) => ({
        type: "speech" as const,
        rede_id: r.speech_id,
        speaker: r.speaker_name || "Unbekannt",
        party: r.speaker_party || null,
        speech_date: r.datum,
        topic_title: null,
        snippet: r.snippet_text,
        tonalitaet: null,
        detail_url: `/parlamente/berlin/redner/${encodeURIComponent(r.speaker_name)}`,
        politician_id: r.politician_id,
        parliament: "berlin" as const,
      }))
    : [];
  const countSpeeches = (fts: string | null) => fts
    ? (db.prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.berlinSpeeches} WHERE ${FTS_TABLES.berlinSpeeches} MATCH ?`).get(fts) as { n: number }).n
    : 0;
  const totalSpeechesOriginal = countSpeeches(ftsOriginalOnly);
  const totalSpeechesExpanded = hasExpansions ? countSpeeches(ftsAllTerms) : totalSpeechesOriginal;

  // 3. Drucksachen (berlin_drucksachen_fts) — nur legislative DS; anfrage_antwort ist eigener qa-Typ (s. 4.)
  const drucksachen: DrucksacheHit[] = ftsActive
    ? (db.prepare(
        `SELECT fts.dbid, fts.klasse, COALESCE(NULLIF(TRIM(fts.titel),''), bda.derived_titel) AS titel, fts.zusammenfassung, bd.dok_nr, bd.dok_datum
         FROM ${FTS_TABLES.berlinDrucksachen} fts
         LEFT JOIN berlin_documents bd ON bd.dbid = fts.dbid
         LEFT JOIN berlin_drucksachen_analyses bda ON bda.dbid = fts.dbid
         WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ? AND fts.klasse != 'anfrage_antwort'
         ORDER BY (CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.berlinDrucksachen} WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ?) THEN 0 ELSE 1 END), bd.dok_datum IS NULL, bd.dok_datum DESC
         LIMIT ?`
      ).all(ftsActive, ftsTierMatch, PER_TYPE_LIMIT) as Array<{
        dbid: string; klasse: string; titel: string | null; zusammenfassung: string;
        dok_nr: string | null; dok_datum: string | null;
      }>).map((d) => {
        const full = d.zusammenfassung ?? "";
        const snippet = full.length > 140 ? full.slice(0, 137) + "…" : full;
        return {
          type: "drucksache" as const,
          id: d.dbid,
          title: d.titel || `Berlin-Drucksache ${d.dok_nr ?? d.dbid}`,
          drucksache_nr: d.dok_nr,
          vorgangstyp: d.klasse,
          date: d.dok_datum,
          snippet: snippet || null,
          batch_class: d.klasse,
          detail_url: `/parlamente/berlin/drucksache/${d.dbid}`,
          parliament: "berlin" as const,
        };
      })
    : [];
  const countDs = (fts: string | null) => fts
    ? (db.prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.berlinDrucksachen} WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ? AND klasse != 'anfrage_antwort'`).get(fts) as { n: number }).n
    : 0;
  const totalDrucksachenOriginal = countDs(ftsOriginalOnly);
  const totalDrucksachenExpanded = hasExpansions ? countDs(ftsAllTerms) : totalDrucksachenOriginal;

  // 4. Fragen & Antworten (berlin_drucksachen_fts, klasse='anfrage_antwort') — eigener qa-Typ, Dokument-Korn
  const qaRows = ftsActive
    ? (db.prepare(
        `SELECT fts.dbid, bd.dok_nr AS dokNr, bd.dok_datum AS datum,
                a.zusammenfassung, a.kerninhalt_frage_json AS frageJson, a.kerninhalt_antwort_json AS antwortJson
         FROM ${FTS_TABLES.berlinDrucksachen} fts
         JOIN berlin_drucksachen_analyses a ON a.dbid = fts.dbid
         LEFT JOIN berlin_documents bd ON bd.dbid = fts.dbid
         WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ? AND fts.klasse = 'anfrage_antwort'
         ORDER BY (CASE WHEN fts.rowid IN (SELECT rowid FROM ${FTS_TABLES.berlinDrucksachen} WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ?) THEN 0 ELSE 1 END), bd.dok_datum IS NULL, bd.dok_datum DESC
         LIMIT ?`
      ).all(ftsActive, ftsTierMatch, PER_TYPE_LIMIT) as BerlinQaRow[])
    : [];
  const qaHits = mapBerlinQaHits(db, qaRows);
  const countQa = (fts: string | null) => fts
    ? (db.prepare(`SELECT COUNT(*) as n FROM ${FTS_TABLES.berlinDrucksachen} WHERE ${FTS_TABLES.berlinDrucksachen} MATCH ? AND klasse = 'anfrage_antwort'`).get(fts) as { n: number }).n
    : 0;
  const totalQaOriginal = countQa(ftsOriginalOnly);
  const totalQaExpanded = hasExpansions ? countQa(ftsAllTerms) : totalQaOriginal;

  const totalsOriginal: SearchTotals = {
    politicians: totalPoliticians, speeches: totalSpeechesOriginal, topics: 0, votes: 0, drucksachen: totalDrucksachenOriginal, qa: totalQaOriginal,
  };
  const totalsExpanded: SearchTotals = {
    politicians: totalPoliticians, speeches: totalSpeechesExpanded, topics: 0, votes: 0, drucksachen: totalDrucksachenExpanded, qa: totalQaExpanded,
  };

  return {
    query, politicians, speeches, topics: [], votes: [], drucksachen, qa: qaHits,
    total: politicians.length + speeches.length + drucksachen.length + qaHits.length,
    totals: expand ? totalsExpanded : totalsOriginal,
    totalsOriginal, totalsExpanded,
    expand, expansions, matchedClusters, directHit: null,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// Themen-Facette: alle Inhalte (Reden + Drucksachen + Abstimmungen) eines
// Citizen-Topics, gemischt und neueste zuerst — optional per Text eingegrenzt.
// Filtert über item_topics.aw_field (die klassifizierte Einheit), NICHT per
// Textsuche. Nur Themen MIT aw_field; themaMatch-only-Themen (Rente, Krieg)
// laufen über die normale Textsuche (Homepage routet sie als ?q=).
// ───────────────────────────────────────────────────────────────────────────

export interface SearchThemaResult {
  thema: string;
  label: string | null;
  query: string;
  page: number;
  pageSize: number;
  total: number;
  items: SearchHit[];
}

/** Wie viele Treffer je Typ maximal geholt werden (newest-first), bevor gemischt wird. */
const THEMA_FETCH_CAP = 200;

export function searchThema(
  slug: string,
  rawQuery: string,
  page: number = 1,
  pageSize: number = 50,
): SearchThemaResult {
  const query = rawQuery.trim();
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.max(1, Math.min(100, Math.floor(pageSize)));
  const topic = topicBySlug(slug);
  const fields = topic?.awFields ?? [];

  const base: SearchThemaResult = {
    thema: slug,
    label: topic?.label ?? null,
    query,
    page: safePage,
    pageSize: safePageSize,
    total: 0,
    items: [],
  };
  if (!topic || fields.length === 0) return base;

  const db = getDb();
  ensureSearchFTS(db);
  const fieldPH = fields.map(() => "?").join(",");
  const hasQuery = query.length >= 2;
  const fts = hasQuery ? ftsMatchClause([query]) : null;
  const wordPatterns = hasQuery ? [query.toLowerCase()] : [];

  // ── Reden (item_topics.source = bt_rede, item_id = rede_id) ──
  const speechRows = (
    hasQuery && fts
      ? db
          .prepare(
            `SELECT sa.rede_id, ps.speaker, ps.party, sess.datum AS speech_date,
                    pt.title AS topic_title, sa.zusammenfassung_2_saetze AS snippet, sa.tonalitaet
             FROM ${FTS_TABLES.speeches} f
             JOIN speech_analyses_v2 sa ON sa.speech_id = f.speech_id
             JOIN plenar_speeches ps ON sa.speech_id = ps.id
             JOIN item_topics it ON it.source='bt_rede' AND it.item_id = ps.rede_id AND it.aw_field IN (${fieldPH})
             LEFT JOIN plenar_sessions sess ON ps.session_id = sess.id
             LEFT JOIN plenar_topics pt ON ps.topic_id = pt.id
             WHERE f.snippet MATCH ?
             ORDER BY sess.datum DESC LIMIT ?`,
          )
          .all(...fields, fts, THEMA_FETCH_CAP)
      : db
          .prepare(
            `SELECT sa.rede_id, ps.speaker, ps.party, sess.datum AS speech_date,
                    pt.title AS topic_title, sa.zusammenfassung_2_saetze AS snippet, sa.tonalitaet
             FROM item_topics it
             JOIN plenar_speeches ps ON ps.rede_id = it.item_id
             JOIN speech_analyses_v2 sa ON sa.speech_id = ps.id
             LEFT JOIN plenar_sessions sess ON ps.session_id = sess.id
             LEFT JOIN plenar_topics pt ON ps.topic_id = pt.id
             WHERE it.source='bt_rede' AND it.aw_field IN (${fieldPH})
             ORDER BY sess.datum DESC LIMIT ?`,
          )
          .all(...fields, THEMA_FETCH_CAP)
  ) as {
    rede_id: string;
    speaker: string | null;
    party: string | null;
    speech_date: string | null;
    topic_title: string | null;
    snippet: string;
    tonalitaet: string | null;
  }[];

  // ── Drucksachen (source = bt_drucksache, item_id = drucksache_nr) ──
  const dsRows = (
    hasQuery && fts
      ? db
          .prepare(
            `SELECT f.drucksache_nr, f.titel, f.zusammenfassung, an.batch_class,
                    COALESCE(t.publication_date, (SELECT datum FROM activities WHERE drucksache_nr=f.drucksache_nr LIMIT 1)) AS datum
             FROM ${FTS_TABLES.drucksachen} f
             JOIN item_topics it ON it.source='bt_drucksache' AND it.item_id = f.drucksache_nr AND it.aw_field IN (${fieldPH})
             LEFT JOIN drucksache_analyses an ON an.drucksache_nr = f.drucksache_nr
             LEFT JOIN drucksache_texts t ON t.drucksache_nr = f.drucksache_nr
             WHERE ${FTS_TABLES.drucksachen} MATCH ?
             ORDER BY datum DESC LIMIT ?`,
          )
          .all(...fields, fts, THEMA_FETCH_CAP)
      : db
          .prepare(
            `SELECT f.drucksache_nr, f.titel, f.zusammenfassung, an.batch_class,
                    COALESCE(t.publication_date, (SELECT datum FROM activities WHERE drucksache_nr=f.drucksache_nr LIMIT 1)) AS datum
             FROM item_topics it
             JOIN ${FTS_TABLES.drucksachen} f ON f.drucksache_nr = it.item_id
             LEFT JOIN drucksache_analyses an ON an.drucksache_nr = f.drucksache_nr
             LEFT JOIN drucksache_texts t ON t.drucksache_nr = f.drucksache_nr
             WHERE it.source='bt_drucksache' AND it.aw_field IN (${fieldPH})
             ORDER BY datum DESC LIMIT ?`,
          )
          .all(...fields, THEMA_FETCH_CAP)
  ) as {
    drucksache_nr: string;
    titel: string;
    zusammenfassung: string;
    batch_class: string | null;
    datum: string | null;
  }[];

  // ── Abstimmungen (source = bt_vote, item_id = poll_id) ──
  const voteRows = db
    .prepare(
      `SELECT DISTINCT v.poll_id, v.poll_label, v.poll_date
       FROM votes v
       JOIN item_topics it ON it.source='bt_vote' AND CAST(v.poll_id AS TEXT) = it.item_id AND it.aw_field IN (${fieldPH})
       ${hasQuery ? `WHERE ${wordMatchOr("v.poll_label", wordPatterns.length)}` : ""}
       ORDER BY v.poll_date DESC LIMIT ?`,
    )
    .all(...fields, ...wordPatterns, THEMA_FETCH_CAP) as {
    poll_id: number;
    poll_label: string;
    poll_date: string | null;
  }[];

  // Hits bauen + nach rede_id/nr/poll_id deduplizieren (item_topics kann mehrere
  // aw_field-Zeilen pro Item haben → Doppel-Treffer bei Mehr-Feld-Themen).
  const seen = new Set<string>();
  const speechHits: SpeechHit[] = [];
  for (const s of speechRows) {
    const k = `s:${s.rede_id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    speechHits.push({
      type: "speech",
      rede_id: s.rede_id,
      speaker: s.speaker ?? "Unbekannt",
      party: s.party,
      speech_date: s.speech_date,
      topic_title: s.topic_title,
      snippet: s.snippet,
      tonalitaet: s.tonalitaet,
    });
  }
  const dsHits: DrucksacheHit[] = [];
  for (const d of dsRows) {
    const k = `d:${d.drucksache_nr}`;
    if (seen.has(k)) continue;
    seen.add(k);
    const full = d.zusammenfassung ?? "";
    dsHits.push({
      type: "drucksache",
      id: d.drucksache_nr,
      title: d.titel || `Drucksache ${d.drucksache_nr}`,
      drucksache_nr: d.drucksache_nr,
      vorgangstyp: null,
      date: d.datum,
      snippet: full.length > 140 ? full.slice(0, 137) + "…" : full || null,
      batch_class: d.batch_class,
    });
  }
  const voteHits: VoteHit[] = [];
  for (const v of voteRows) {
    const k = `v:${v.poll_id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    voteHits.push({ type: "vote", poll_id: v.poll_id, label: v.poll_label, poll_date: v.poll_date });
  }

  // Mischen + nach Datum (neueste zuerst, NULL ans Ende) sortieren.
  const dateOf = (h: SearchHit): string =>
    h.type === "speech" ? h.speech_date ?? "" : h.type === "drucksache" ? h.date ?? "" : h.type === "vote" ? h.poll_date ?? "" : "";
  const merged: SearchHit[] = [...speechHits, ...dsHits, ...voteHits].sort((a, b) => dateOf(b).localeCompare(dateOf(a)));

  // Exakte Gesamtzahl je Typ (NICHT aus dem gekappten Fetch — sonst falsche Grundzahl).
  const cnt = (sql: string, params: unknown[]): number =>
    (db.prepare(sql).get(...params) as { n: number }).n;

  const speechTotal =
    hasQuery && fts
      ? cnt(
          `SELECT COUNT(*) AS n FROM (SELECT DISTINCT ps.rede_id
             FROM ${FTS_TABLES.speeches} f
             JOIN speech_analyses_v2 sa ON sa.speech_id = f.speech_id
             JOIN plenar_speeches ps ON sa.speech_id = ps.id
             JOIN item_topics it ON it.source='bt_rede' AND it.item_id = ps.rede_id AND it.aw_field IN (${fieldPH})
             WHERE f.snippet MATCH ?)`,
          [...fields, fts],
        )
      : cnt(
          `SELECT COUNT(*) AS n FROM (SELECT DISTINCT ps.rede_id
             FROM item_topics it
             JOIN plenar_speeches ps ON ps.rede_id = it.item_id
             JOIN speech_analyses_v2 sa ON sa.speech_id = ps.id
             WHERE it.source='bt_rede' AND it.aw_field IN (${fieldPH}))`,
          [...fields],
        );

  const dsTotal =
    hasQuery && fts
      ? cnt(
          `SELECT COUNT(*) AS n FROM (SELECT DISTINCT it.item_id
             FROM ${FTS_TABLES.drucksachen} f
             JOIN item_topics it ON it.source='bt_drucksache' AND it.item_id = f.drucksache_nr AND it.aw_field IN (${fieldPH})
             WHERE ${FTS_TABLES.drucksachen} MATCH ?)`,
          [...fields, fts],
        )
      : cnt(
          `SELECT COUNT(*) AS n FROM (SELECT DISTINCT it.item_id
             FROM item_topics it
             JOIN ${FTS_TABLES.drucksachen} f ON f.drucksache_nr = it.item_id
             WHERE it.source='bt_drucksache' AND it.aw_field IN (${fieldPH}))`,
          [...fields],
        );

  const voteTotal = cnt(
    `SELECT COUNT(*) AS n FROM (SELECT DISTINCT v.poll_id
       FROM votes v
       JOIN item_topics it ON it.source='bt_vote' AND CAST(v.poll_id AS TEXT) = it.item_id AND it.aw_field IN (${fieldPH})
       ${hasQuery ? `WHERE ${wordMatchOr("v.poll_label", wordPatterns.length)}` : ""})`,
    [...fields, ...wordPatterns],
  );

  const offset = (safePage - 1) * safePageSize;
  return {
    ...base,
    total: speechTotal + dsTotal + voteTotal,
    items: merged.slice(offset, offset + safePageSize),
  };
}
