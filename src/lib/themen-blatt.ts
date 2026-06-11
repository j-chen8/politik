// Echte Daten für das Themen-Blatt „Digital" (/vorschau/themen) — ersetzt die
// Dummy-Daten der Vorschau, um sichtbar zu machen, welche Daten REICHEN und
// welche noch fehlen (Stand 2026-06-11).
//
// Korn-Proxy, solange die Unterthema/Tag-Klassifikation (Batch) nicht gelaufen ist:
//   - Drucksachen:  Roh-Tag `Digitalisierung` in drucksache_analyses.thema (588 DS)
//   - Reden:        item_topics aw_field „Medien, Kommunikation und Informationstechnik" (1.901)
//   - Abstimmungen: Handzeichen-Votes, deren Drucksachen den Roh-Tag tragen (54)
//   - Gesetzentwürfe: DIP-Vorgangsdaten (dip_vorgaenge/positionen, seit 2026-06-11)
//
// BEKANNTE LÜCKEN (bewusst sichtbar gelassen, das ist der Zweck der Übung):
//   1. Spezifische Themen = Co-Occurrence der Roh-Tags → feld-grob („Verwaltung",
//      „Datenschutz"), nicht KI/Krypto-fein → braucht den Tag-Batch.
//   2. Reden tragen keine Tags → fallen beim Tag-Filter raus.
//   3. Digital-Votes sind ALLE Handzeichen → keine Ja/Nein-Zahlen (nur Fraktions-
//      voten) und kein „Worum geht es?" (vote_context ist poll_id-/namentlich-only;
//      Ersatz = DS-Kerninhalt).
//   4. Feed lädt die neuesten 120 von ~2.500 — voller Bestand braucht die
//      server-seitige searchThema-Integration statt Client-Filterung.
//   5. Köpfe: „Spricht vor allem zu"-Chips fehlen (bräuchten Tag-Korn × redner_id).
import { getDb } from "@/lib/db";

const FELD_AW = "Medien, Kommunikation und Informationstechnik";
const ROH_TAG = "Digitalisierung";
const FEED_LIMIT = 120;

export interface EchtVote {
  id: string; titel: string; iso: string | null; datum: string; einzeiler: string;
  worum: string | null; outcome: "angenommen" | "abgelehnt";
  fraktionen: Record<string, string> | null; tags: string[]; href: string;
}
export interface EchtGesetz {
  id: string; titel: string; iso: string | null; datum: string; stand: 1 | 2; standDetail: string;
  einzeiler: string; vorschau: string | null; tags: string[]; href: string;
}
export interface EchtDoc {
  id: string; typ: "Drucksache" | "Rede"; titel: string; iso: string | null; datum: string;
  einzeiler: string; vorschau: string | null; redner: string | null; tags: string[]; href: string;
}
export interface EchtKopf {
  vorname: string; nachname: string; partei: string; reden: number; gesamt: number; rolle: string | null;
}
export interface EchtSitzung { nr: number; datum: string; tops: string; href: string }
export interface DigitalBlattEcht {
  zuletztAktiv: string | null;
  votes: EchtVote[];
  gesetze: EchtGesetz[];
  docs: EchtDoc[];
  koepfe: EchtKopf[];
  sitzungen: EchtSitzung[];
  tags: { name: string; count: number }[];
  totalDs: number; totalReden: number;
}

// "2026-05-21" → „vor 3 Wochen" (Display-Korn wie die Dummies)
function rel(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso.slice(0, 10) + "T00:00:00").getTime();
  if (Number.isNaN(t)) return iso;
  const tage = Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
  if (tage === 0) return "heute";
  if (tage === 1) return "gestern";
  if (tage < 14) return `vor ${tage} Tagen`;
  if (tage < 63) return `vor ${Math.round(tage / 7)} Wochen`;
  if (tage < 365) return `vor ${Math.round(tage / 30.44)} Monaten`;
  return `vor ${Math.round(tage / 365.25)} Jahren`;
}
function fmt(iso: string | null): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}.${m}.${y}` : iso;
}
function fmtLang(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}
function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso.slice(0, 10) + "T00:00:00").getTime()) / 86_400_000));
}
function splitTags(thema: string | null): string[] {
  return (thema ?? "").split(",").map((s) => s.trim()).filter((s) => s && s !== ROH_TAG);
}
// kerninhalt ist teils als JSON-Array (Stichpunkte) gespeichert → lesbarer Fließtext
function parseKern(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim();
  if (t.startsWith("[")) {
    try {
      const arr = JSON.parse(t);
      if (Array.isArray(arr)) return arr.filter(Boolean).join(" · ");
    } catch { /* roh lassen */ }
  }
  return s;
}
// Partei-Labels tragen teils Soft-Hyphens (BÜNDNIS 90/­DIE GRÜNEN) → säubern
function cleanParty(s: string | null): string {
  return (s ?? "").replace(/­/g, "").trim();
}

export function getDigitalBlatt(): DigitalBlattEcht {
  const db = getDb();

  // ── 1. Digital-Drucksachen mit Titel/Datum/Zusammenfassung ──
  // PRIMÄR-Tag (Digitalisierung an ERSTER Stelle, 197 DS): Die LLM-Tag-Reihenfolge
  // trägt Bedeutung — irgendwo-im-String (588 DS) holte auch Drittrang-Erwähnungen
  // aufs Blatt („Wirtschaft 2045" mit thema=Wirtschaft,Klimaschutz,Digitalisierung
  // als Featured-Vote, User-Befund 2026-06-11). Der Tag-Batch ersetzt den Proxy
  // durch kuratierte unterthema[]-Zuordnung (1–3, Multi-Feld bleibt möglich).
  const dsRows = db.prepare(`
    SELECT da.drucksache_nr AS nr, da.zusammenfassung, da.kerninhalt, da.thema, da.dokumenttyp,
      (SELECT COALESCE(a.thema, a.titel) FROM activities a WHERE a.drucksache_nr = da.drucksache_nr LIMIT 1) AS titel,
      COALESCE(
        (SELECT MIN(a.datum) FROM activities a WHERE a.drucksache_nr = da.drucksache_nr AND a.datum IS NOT NULL),
        (SELECT dt.publication_date FROM drucksache_texts dt WHERE dt.drucksache_nr = da.drucksache_nr)
      ) AS iso
    FROM drucksache_analyses da
    WHERE da.thema LIKE ? || '%' AND da.analyze_error IS NULL
  `).all(ROH_TAG) as {
    nr: string; zusammenfassung: string | null; kerninhalt: string | null; thema: string | null;
    dokumenttyp: string | null; titel: string | null; iso: string | null;
  }[];
  const dsMap = new Map(dsRows.map((r) => [r.nr, r]));
  // Titel-Lücke in activities: DIP führt für alle Gesetzgebungs-DS den amtlichen
  // Titel → bester Fallback (traf z. B. den neuesten Primär-Vote 21/1934)
  const dipTitel = new Map(
    (db.prepare(`
      SELECT dv.drucksache_nr AS nr, v.titel
      FROM dip_ds_vorgaenge dv JOIN dip_vorgaenge v ON v.id = dv.vorgang_id
      WHERE v.titel IS NOT NULL
    `).all() as { nr: string; titel: string }[]).map((r) => [r.nr, r.titel])
  );
  const dsTitel = (nr: string): string | null => dsMap.get(nr)?.titel ?? dipTitel.get(nr) ?? null;

  // ── 2. Abstimmungen: Handzeichen-Votes, deren DS den Roh-Tag trägt ──
  // LÜCKE: alle Digital-Votes sind Handzeichen → keine Ja/Nein-Zahlen, kein
  // vote_context-Worum; Ersatz = Kerninhalt/Zusammenfassung der Drucksache.
  const voteRows = db.prepare(`
    SELECT bv.datum AS iso, bv.outcome, bv.fraktion_votes_json, bv.drucksache_nrn_json
    FROM bundestag_votes bv
    WHERE bv.outcome IN ('annahme','ablehnung') AND bv.error_type IS NULL
    ORDER BY bv.datum DESC
  `).all() as { iso: string | null; outcome: string; fraktion_votes_json: string | null; drucksache_nrn_json: string | null }[];
  const votes: EchtVote[] = [];
  for (const v of voteRows) {
    let nrs: string[] = [];
    try { nrs = JSON.parse(v.drucksache_nrn_json ?? "[]"); } catch { /* ignore */ }
    const dsNr = nrs.find((n) => dsMap.has(n));
    if (!dsNr) continue;
    const ds = dsMap.get(dsNr)!;
    let fraktionen: Record<string, string> | null = null;
    try { fraktionen = v.fraktion_votes_json ? JSON.parse(v.fraktion_votes_json) : null; } catch { /* ignore */ }
    votes.push({
      id: `vote-${dsNr}-${v.iso ?? ""}`,
      titel: dsTitel(dsNr) ?? `Abstimmung zu Drucksache ${dsNr}`,
      iso: v.iso, datum: rel(v.iso),
      einzeiler: ds.zusammenfassung ?? "",
      worum: ds.kerninhalt ?? ds.zusammenfassung,
      outcome: v.outcome === "annahme" ? "angenommen" : "abgelehnt",
      fraktionen, tags: splitTags(ds.thema), href: `/aktivitaeten/${encodeURIComponent(dsNr)}`,
    });
  }
  // worum lesbar machen (kerninhalt kann JSON-Stichpunkte enthalten)
  for (const v of votes) v.worum = parseKern(v.worum);

  // ── 3. Gesetzentwürfe im Verfahren (DIP) — 4-Phasen-Stand + Binnenphase ──
  const geRows = db.prepare(`
    SELECT dv.drucksache_nr AS nr, v.beratungsstand, v.titel AS dip_titel,
      (SELECT MAX(p.datum) FROM dip_vorgang_positionen p
        WHERE p.vorgang_id = v.id AND p.vorgangsposition IN ('1. Beratung','1. Beratung (Gesetzentwurf)')) AS erste,
      (SELECT MAX(p.datum) FROM dip_vorgang_positionen p
        WHERE p.vorgang_id = v.id AND p.vorgangsposition IN ('Beschlussempfehlung und Bericht','Beschlussempfehlung','Bericht')) AS be,
      (SELECT MAX(p.datum) FROM dip_vorgang_positionen p WHERE p.vorgang_id = v.id) AS letzte
    FROM dip_ds_vorgaenge dv
    JOIN dip_vorgaenge v ON v.id = dv.vorgang_id
    JOIN drucksache_instrument di ON di.drucksache_nr = dv.drucksache_nr AND di.instrument = 'gesetzentwurf'
    WHERE v.beratungsstand NOT IN ('Verkündet','Abgelehnt','Für erledigt erklärt','Zurückgezogen','Einbringung abgelehnt','Bundesrat hat Zustimmung versagt')
    GROUP BY dv.drucksache_nr
  `).all() as { nr: string; beratungsstand: string | null; dip_titel: string | null; erste: string | null; be: string | null; letzte: string | null }[];
  const BR_STAENDE = new Set(["Verabschiedet", "Dem Bundesrat zugeleitet - Noch nicht beraten", "Im Vermittlungsverfahren", "Bundesrat hat zugestimmt"]);
  const gesetze: EchtGesetz[] = [];
  for (const g of geRows) {
    const ds = dsMap.get(g.nr);
    if (!ds) continue; // kein Digital-GE
    const inBr = BR_STAENDE.has(g.beratungsstand ?? "");
    let standDetail: string;
    if (inBr) {
      standDetail = (g.beratungsstand ?? "").replace(" - Noch nicht beraten", " · noch nicht beraten");
      if (g.letzte) standDetail += ` · seit ${fmt(g.letzte)} · ${daysSince(g.letzte)} Tage`;
    } else if (g.be) {
      standDetail = "Beschlussempfehlung liegt vor";
    } else if (g.erste) {
      standDetail = `im Ausschuss · seit ${fmt(g.erste)} · ${daysSince(g.erste)} Tage`;
    } else {
      standDetail = "vor der 1. Lesung";
    }
    gesetze.push({
      id: `ge-${g.nr}`,
      titel: ds.titel ?? g.dip_titel ?? `Gesetzentwurf ${g.nr}`,
      iso: ds.iso, datum: rel(ds.iso),
      stand: inBr ? 2 : 1, standDetail,
      einzeiler: ds.zusammenfassung ?? "", vorschau: parseKern(ds.kerninhalt) ?? ds.zusammenfassung,
      tags: splitTags(ds.thema), href: `/aktivitaeten/${encodeURIComponent(g.nr)}`,
    });
  }
  gesetze.sort((a, b) => (b.iso ?? "").localeCompare(a.iso ?? ""));
  const geNrs = new Set(geRows.map((g) => g.nr));

  // ── 4. Feed: Drucksachen (ohne laufende GE, die leben in der Reihe) + Reden ──
  const docs: EchtDoc[] = [];
  for (const ds of dsRows) {
    if (geNrs.has(ds.nr)) continue;
    docs.push({
      id: `ds-${ds.nr}`,
      typ: "Drucksache",
      titel: dsTitel(ds.nr) ?? `Drucksache ${ds.nr}`,
      iso: ds.iso, datum: rel(ds.iso),
      einzeiler: ds.zusammenfassung ?? "", vorschau: parseKern(ds.kerninhalt) ?? ds.zusammenfassung,
      redner: null, tags: splitTags(ds.thema), href: `/aktivitaeten/${encodeURIComponent(ds.nr)}`,
    });
  }
  const redeRows = db.prepare(`
    SELECT ss.rede_id, ss.speaker, ss.sitzung, ss.datum AS iso, ss.kontext, ss.zusammenfassung,
           COALESCE(pa.label, '') AS partei
    FROM item_topics it
    JOIN speech_summaries ss ON ss.rede_id = it.item_id
    LEFT JOIN politicians p ON p.id = ss.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE it.source = 'bt_rede' AND it.aw_field = ?
    GROUP BY ss.rede_id
    ORDER BY ss.datum DESC
    LIMIT 200
  `).all(FELD_AW) as { rede_id: string; speaker: string | null; sitzung: number | null; iso: string | null; kontext: string | null; zusammenfassung: string | null; partei: string }[];
  for (const r of redeRows) {
    const partei = cleanParty(r.partei);
    docs.push({
      id: `rede-${r.rede_id}`,
      typ: "Rede",
      titel: r.kontext ? r.kontext : `Rede von ${r.speaker ?? "unbekannt"}`,
      iso: r.iso, datum: rel(r.iso),
      einzeiler: r.zusammenfassung ?? "", vorschau: r.zusammenfassung,
      redner: r.speaker ? `${r.speaker}${partei ? ` (${partei})` : ""}` : null,
      // LÜCKE: Reden tragen keine spezifischen Tags (kommt mit dem Tag-Batch)
      tags: [],
      href: r.sitzung != null ? `/protokolle/sitzung/${r.sitzung}` : "#",
    });
  }
  docs.sort((a, b) => (b.iso ?? "").localeCompare(a.iso ?? ""));
  const feed = docs.slice(0, FEED_LIMIT);

  // ── 5. Köpfe: Top-Redner:innen im Feld (Lautstärke-Sicht, parteiübergreifend) ──
  const kopfRows = db.prepare(`
    SELECT p.first_name AS vorname, p.last_name AS nachname,
           COALESCE(pa.label, '') AS partei,
           COUNT(DISTINCT ss.rede_id) AS reden,
           (SELECT COUNT(DISTINCT s2.rede_id) FROM speech_summaries s2 WHERE s2.politician_id = ss.politician_id) AS gesamt,
           (SELECT cm.committee_role || '§' || cm.committee_label FROM committee_memberships cm
             WHERE cm.politician_id = ss.politician_id AND cm.committee_label LIKE '%Digital%' LIMIT 1) AS ausschuss
    FROM item_topics it
    JOIN speech_summaries ss ON ss.rede_id = it.item_id
    JOIN politicians p ON p.id = ss.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE it.source = 'bt_rede' AND it.aw_field = ? AND ss.politician_id IS NOT NULL
    GROUP BY ss.politician_id
    ORDER BY reden DESC
    LIMIT 10
  `).all(FELD_AW) as { vorname: string; nachname: string; partei: string; reden: number; gesamt: number; ausschuss: string | null }[];
  const ROLE_DE: Record<string, string> = { member: "Mitglied", chairperson: "Vorsitz", alternate_member: "stellv. Mitglied" };
  const koepfe: EchtKopf[] = kopfRows.map((k) => {
    let rolle: string | null = null;
    if (k.ausschuss) {
      const [role, label] = k.ausschuss.split("§");
      rolle = `${ROLE_DE[role] ?? role} im ${label}`;
    }
    return { vorname: k.vorname, nachname: k.nachname, partei: cleanParty(k.partei), reden: k.reden, gesamt: k.gesamt, rolle };
  });

  // ── 6. Plenarsitzungen mit Feld-Reden ──
  const sitzungRows = db.prepare(`
    SELECT ss.sitzung AS nr, MAX(ss.datum) AS iso, COUNT(DISTINCT ss.rede_id) AS n
    FROM item_topics it
    JOIN speech_summaries ss ON ss.rede_id = it.item_id
    WHERE it.source = 'bt_rede' AND it.aw_field = ? AND ss.sitzung IS NOT NULL
    GROUP BY ss.sitzung
    ORDER BY iso DESC
    LIMIT 8
  `).all(FELD_AW) as { nr: number; iso: string | null; n: number }[];
  const sitzungen: EchtSitzung[] = sitzungRows.map((s) => ({
    nr: s.nr, datum: fmtLang(s.iso),
    tops: `${s.n} ${s.n === 1 ? "Rede" : "Reden"} zum Thema`,
    href: `/protokolle/sitzung/${s.nr}`,
  }));

  // ── 7. Spezifische Themen: Co-Occurrence der Roh-Tags auf den Digital-DS ──
  // LÜCKE: feld-grob (Verwaltung/Datenschutz/…), nicht KI/Krypto-fein → Tag-Batch.
  const tagCounts = new Map<string, number>();
  for (const ds of dsRows) for (const t of splitTags(ds.thema)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const zuletztIso = [dsRows.map((d) => d.iso), redeRows.map((r) => r.iso), votes.map((v) => v.iso)]
    .flat().filter(Boolean).sort().pop() ?? null;
  const totalReden = (db.prepare(
    `SELECT COUNT(DISTINCT item_id) AS c FROM item_topics WHERE source = 'bt_rede' AND aw_field = ?`
  ).get(FELD_AW) as { c: number }).c;

  return {
    zuletztAktiv: rel(zuletztIso),
    votes, gesetze, docs: feed, koepfe, sitzungen, tags,
    totalDs: dsRows.length, totalReden,
  };
}
