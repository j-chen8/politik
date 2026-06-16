// Echte Daten für das Berlin-Themen-Blatt — das Pendant zu src/lib/themen-blatt.ts
// (Bund). Liefert dieselben Typen (DigitalBlattEcht, StrukturOber) und füttert die
// UNVERÄNDERTE Komponente VorschauThemen → identisches Design wie beim Bundestag.
//
// Korn (Stand 2026-06-16, Wohnen-Pilot):
//   - Drucksachen:  berlin_ds_unterthemen (LLM-Batch) × berlin_drucksachen_analyses
//                   × berlin_documents. Item-Tags = spezifische_tags[] des Batches.
//   - Reden:        berlin_rede_unterthemen (Stufe 8: erben über die debattierte DS)
//                   × berlin_speeches × berlin_speech_analyses.
//   - Abstimmungen: berlin_votes (Fraktions-Handzeichen), DS-Link über drucksache_dbids_json.
//
// BEKANNTE LÜCKEN (Berlin ≠ Bund, „dünnere Blatt-Stellen" laut SoP):
//   1. KEIN Gesetz-Verfahrensstand: Berlin hat keine DIP-Vorgänge → gesetze = []
//      (die Sektion blendet sich in VorschauThemen aus).
//   2. Votes = Handzeichen → keine Ja/Nein-Zahlen, nur Fraktionsvoten (wie BT-Digital).
//   3. Nur das Feld „Stadtentwicklung, Bauen & Wohnen" ist klassifiziert (Pilot) →
//      der Picker zeigt vorerst nur dieses Oberthema (wächst mit dem Global-Batch).
import { getDb } from "@/lib/db";
import { unterSlug } from "@/lib/themen-struktur";
import { TAXONOMIE_BERLIN } from "../../scripts/_lib/themen-taxonomie-berlin";
import { BERLIN_THEMENFELDER_ALLE } from "@/lib/berlin-themen-struktur";
import type {
  DigitalBlattEcht, EchtVote, EchtDoc, EchtKopf, EchtKopfRede, EchtSitzung,
  StrukturOber, StrukturUnter,
} from "@/lib/themen-blatt";

const FEED_LIMIT = 120;

// ── kleine Formatter (Spiegel der Bund-Helfer in themen-blatt.ts) ──
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
function fmtLang(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso.slice(0, 10) + "T00:00:00").toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
  } catch { return iso; }
}
function parseArr(json: string | null): string[] {
  if (!json) return [];
  try { const a = JSON.parse(json); return Array.isArray(a) ? a.map((t) => String(t).trim()).filter(Boolean) : []; }
  catch { return []; }
}
function cleanParty(s: string | null): string {
  return (s ?? "").replace(/­/g, "").trim();
}
// ── Anzeige-Kürzungen (Pendant zu anzeigeName/ANZEIGE_NAME im Bund) ──
// Der kanonische Name bleibt der DB-Schlüssel (berlin_ds_unterthemen, Joins, alte
// Slugs); hier nur kurze, scanbare Labels fürs UI. Regel wie BT: EIN starkes Wort,
// zweites nur wenn es wirklich ein zweites Ding ist; innerhalb des Felds eindeutig.
const UNTER_KURZ: Record<string, string> = {
  "Mietregulierung & Mieterschutz": "Mietregulierung",
  "Sozialer & landeseigener Wohnungsbau": "Sozialer Wohnungsbau",
  "Vergesellschaftung & Enteignung": "Vergesellschaftung",
  "Wohneigentum & Eigentumsförderung": "Wohneigentum",
  "Bauleitplanung & Bebauungspläne": "Bauleitplanung",
  "Landeseigene Liegenschaften & Grundstückspolitik": "Liegenschaften",
  "Stadtteilentwicklung & Quartiersmanagement": "Stadtteilentwicklung",
  "Kleingärten & Laubenkolonien": "Kleingärten",
  "Wohnungslosigkeit & Obdachlosenhilfe": "Wohnungslosigkeit",
  "Leerstand & Gebäudeverwahrlosung": "Leerstand",
  "Denkmalschutz & Baukultur": "Denkmalschutz",
  "Große Stadtentwicklungsprojekte": "Großprojekte",
};
const kurzUnter = (u: string): string => UNTER_KURZ[u] ?? u;
// Feld-Anzeige (Oberthema-Header): kurz statt des amtlichen Langnamens.
const FELD_KURZ: Record<string, string> = {
  "Stadtentwicklung, Bauen & Wohnen": "Bauen & Wohnen",
};
const kurzFeld = (label: string): string => FELD_KURZ[label] ?? label;

// Drucksache-Detail-Link
const dsHref = (dbid: string) => `/parlamente/berlin/drucksache/${encodeURIComponent(dbid)}`;

// kerninhalt liegt je nach Klasse in verschiedenen JSON-Feldern (Berlin-Schema)
function kernText(r: { klasse: string; kerninhalt_json: string | null; kerninhalt_frage_json: string | null; kerninhalt_antwort_json: string | null }): string | null {
  const join = (a: string[]) => a.join(" · ");
  if (r.klasse === "anfrage_antwort") {
    const f = parseArr(r.kerninhalt_frage_json), a = parseArr(r.kerninhalt_antwort_json);
    const out = [f.length ? `Frage: ${join(f)}` : "", a.length ? `Antwort: ${join(a)}` : ""].filter(Boolean).join(" — ");
    return out || null;
  }
  const k = parseArr(r.kerninhalt_json);
  return k.length ? join(k) : null;
}

interface DsRow {
  dbid: string; klasse: string; zusammenfassung: string | null;
  kerninhalt_json: string | null; kerninhalt_frage_json: string | null; kerninhalt_antwort_json: string | null;
  spezifische_tags_json: string | null; titel: string | null; iso: string | null;
}

export function getBerlinThemenBlatt(feld: string, unterthema: string): DigitalBlattEcht {
  const db = getDb();

  // ── 1. Drucksachen des Unterthemas (LLM-Batch) ──
  const dsRowsRaw = db.prepare(`
    SELECT u.dbid, a.klasse, a.zusammenfassung,
           a.kerninhalt_json, a.kerninhalt_frage_json, a.kerninhalt_antwort_json,
           u.spezifische_tags_json,
           COALESCE(NULLIF(TRIM(d.titel),''), NULLIF(TRIM(d.abstract),''), a.derived_titel) AS titel,
           d.dok_datum AS iso
    FROM berlin_ds_unterthemen u
    JOIN berlin_drucksachen_analyses a ON a.dbid = u.dbid
    JOIN berlin_documents d ON d.dbid = u.dbid
    WHERE u.feld = ? AND EXISTS (SELECT 1 FROM json_each(u.unterthemen_json) je WHERE je.value = ?)
  `).all(feld, unterthema) as DsRow[];
  const dsRows = dsRowsRaw.map((r) => ({ ...r, tags: parseArr(r.spezifische_tags_json) }));
  const dsMap = new Map(dsRows.map((r) => [r.dbid, r]));

  // ── 2. Abstimmungen: Handzeichen-Votes, deren DS im Unterthema liegt ──
  const voteRows = db.prepare(`
    SELECT bv.datum AS iso, bv.outcome, bv.fraktion_votes_json, bv.drucksache_dbids_json
    FROM berlin_votes bv
    WHERE bv.outcome IN ('annahme','ablehnung') AND bv.error_type IS NULL
    ORDER BY bv.datum DESC
  `).all() as { iso: string | null; outcome: string; fraktion_votes_json: string | null; drucksache_dbids_json: string | null }[];
  const votes: EchtVote[] = [];
  for (const v of voteRows) {
    const dbids = parseArr(v.drucksache_dbids_json);
    const hit = dbids.find((d) => dsMap.has(d));
    if (!hit) continue;
    const ds = dsMap.get(hit)!;
    let fraktionen: Record<string, string> | null = null;
    try { fraktionen = v.fraktion_votes_json ? JSON.parse(v.fraktion_votes_json) : null; } catch { /* ignore */ }
    votes.push({
      id: `vote-${hit}-${v.iso ?? ""}`,
      titel: ds.titel ?? `Abstimmung zu Drucksache ${hit}`,
      iso: v.iso, datum: rel(v.iso),
      einzeiler: ds.zusammenfassung ?? "",
      worum: kernText(ds) ?? ds.zusammenfassung,
      outcome: v.outcome === "annahme" ? "angenommen" : "abgelehnt",
      fraktionen, tags: ds.tags, href: dsHref(hit),
    });
  }

  // ── 3. Feed: Drucksachen (Berlin hat keinen DIP-Verfahrensstand → keine Gesetz-Reihe) ──
  const docs: EchtDoc[] = dsRows.map((ds) => ({
    id: `ds-${ds.dbid}`,
    typ: "Drucksache" as const,
    titel: ds.titel ?? `Drucksache ${ds.dbid}`,
    iso: ds.iso, datum: rel(ds.iso),
    einzeiler: ds.zusammenfassung ?? "", vorschau: kernText(ds) ?? ds.zusammenfassung,
    redner: null, tags: ds.tags, href: dsHref(ds.dbid),
  }));
  docs.sort((a, b) => (b.iso ?? "").localeCompare(a.iso ?? ""));
  const feed = docs.slice(0, FEED_LIMIT);

  // ── 4. Köpfe: Top-Redner:innen ZUM UNTERTHEMA (Reden erben via berlin_rede_unterthemen) ──
  const kopfRows = db.prepare(`
    SELECT ss.politician_id AS pid, p.first_name AS vorname, p.last_name AS nachname,
           COALESCE(pa.label, '') AS partei, p.photo_url,
           COUNT(DISTINCT ss.speech_id) AS reden,
           (SELECT COUNT(DISTINCT s2.speech_id) FROM berlin_speeches s2 WHERE s2.politician_id = ss.politician_id) AS gesamt
    FROM berlin_rede_unterthemen ru
    JOIN berlin_speeches ss ON ss.speech_id = ru.speech_id
    JOIN politicians p ON p.id = ss.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE ru.feld = ? AND ru.unterthema = ? AND ss.politician_id IS NOT NULL
    GROUP BY ss.politician_id
    ORDER BY reden DESC, nachname
  `).all(feld, unterthema) as { pid: number; vorname: string; nachname: string; partei: string; photo_url: string | null; reden: number; gesamt: number }[];
  const mehrfach = kopfRows.filter((k) => k.reden >= 2);
  const topKoepfe = (mehrfach.length >= 10 ? mehrfach : kopfRows).slice(0, 100);
  const pids = topKoepfe.map((k) => k.pid);

  const redenByPid = new Map<number, EchtKopfRede[]>();
  if (pids.length) {
    const redenRows = db.prepare(`
      SELECT ss.politician_id AS pid, ss.speech_id, ss.datum AS iso, ss.sitzung_nr,
             a.zusammenfassung_2_saetze AS zusammenfassung
      FROM berlin_rede_unterthemen ru
      JOIN berlin_speeches ss ON ss.speech_id = ru.speech_id
      LEFT JOIN berlin_speech_analyses a ON a.speech_id = ss.speech_id
      WHERE ru.feld = ? AND ru.unterthema = ?
        AND ss.politician_id IN (${pids.map(() => "?").join(",")})
        AND a.zusammenfassung_2_saetze IS NOT NULL AND a.zusammenfassung_2_saetze != ''
      GROUP BY ss.speech_id
      ORDER BY ss.datum DESC
    `).all(feld, unterthema, ...pids) as { pid: number; speech_id: string; iso: string | null; sitzung_nr: number | null; zusammenfassung: string | null }[];
    const tagVokabular = [...new Set(dsRows.flatMap((d) => d.tags))];
    for (const r of redenRows) {
      const list = redenByPid.get(r.pid) ?? [];
      if (list.length >= 1) continue; // genau EINE Rede je Kopf (wie Bund)
      const text = (r.zusammenfassung ?? "").toLowerCase();
      let voll = (r.zusammenfassung ?? "").trim().replace(/^[A-ZÄÖÜ][^()]{1,60}?\s*\([^)]{2,40}\)\s*/, "");
      voll = voll.charAt(0).toUpperCase() + voll.slice(1);
      list.push({
        id: r.speech_id, datum: rel(r.iso), iso: r.iso,
        einzeiler: voll.length > 800 ? voll.slice(0, 800) : voll,
        href: r.sitzung_nr != null ? `/parlamente/berlin/sitzung/${r.sitzung_nr}` : "#",
        tags: tagVokabular.filter((t) => t.length >= 4 && text.includes(t.toLowerCase())).slice(0, 3),
      });
      redenByPid.set(r.pid, list);
    }
  }
  const koepfe: EchtKopf[] = topKoepfe.map((k) => ({
    politicianId: k.pid, vorname: k.vorname, nachname: k.nachname, partei: cleanParty(k.partei),
    reden: k.reden, gesamt: k.gesamt, rolle: null, photoUrl: k.photo_url || null,
    letzteReden: redenByPid.get(k.pid) ?? [],
  }));

  // ── 5. Plenarsitzungen mit Reden zum Unterthema ──
  const sitzungRows = db.prepare(`
    SELECT ss.sitzung_nr AS nr, MAX(ss.datum) AS iso, COUNT(DISTINCT ss.speech_id) AS n
    FROM berlin_rede_unterthemen ru
    JOIN berlin_speeches ss ON ss.speech_id = ru.speech_id
    WHERE ru.feld = ? AND ru.unterthema = ? AND ss.sitzung_nr IS NOT NULL
    GROUP BY ss.sitzung_nr
    ORDER BY iso DESC
    LIMIT 8
  `).all(feld, unterthema) as { nr: number; iso: string | null; n: number }[];
  const sitzungen: EchtSitzung[] = sitzungRows.map((s) => ({
    nr: s.nr, datum: fmtLang(s.iso),
    tops: `${s.n} ${s.n === 1 ? "Rede" : "Reden"} zum Thema`,
    href: `/parlamente/berlin/sitzung/${s.nr}`,
  }));

  // ── 6. Spezifische Themen = die offenen Batch-Tags ──
  const tagCounts = new Map<string, number>();
  for (const ds of dsRows) for (const t of ds.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tags = [...tagCounts.entries()].map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, 20);

  const totalReden = (db.prepare(
    `SELECT COUNT(DISTINCT ru.speech_id) AS c FROM berlin_rede_unterthemen ru WHERE ru.feld = ? AND ru.unterthema = ?`
  ).get(feld, unterthema) as { c: number }).c;

  const zuletztIso = [dsRows.map((d) => d.iso), sitzungRows.map((s) => s.iso), votes.map((v) => v.iso)]
    .flat().filter(Boolean).sort().pop() ?? null;
  const topTags = tags.slice(0, 3).map((t) => t.name);
  const beschreibung = `${dsRows.length} ${dsRows.length === 1 ? "Vorgang" : "Vorgänge"} im Abgeordnetenhaus Berlin${topTags.length ? ` — am häufigsten: ${topTags.join(", ")}.` : "."}`;

  return {
    feld, unterthema: kurzUnter(unterthema),
    beschreibung, voteThema: null,
    zuletztAktiv: rel(zuletztIso),
    votes, gesetze: [], docs: feed, koepfe, sitzungen, tags,
    totalDs: dsRows.length, totalReden,
  };
}

// ── Picker-Struktur: Berlin-Felder als Oberthemen → Unterthemen mit Live-Bestand ──
// Jedes Politik-/Querschnittsfeld ist ein Oberthema; seine Unterthemen = TAXONOMIE_BERLIN.
// Nur Oberthemen mit ≥1 klassifiziertem Unterthema werden gezeigt (Pilot = nur Wohnen;
// wächst automatisch mit dem Global-Batch).
export function getBerlinThemenStruktur(): StrukturOber[] {
  const db = getDb();
  const rows = db.prepare(
    `SELECT dbid, feld, unterthemen_json, spezifische_tags_json FROM berlin_ds_unterthemen`
  ).all() as { dbid: string; feld: string; unterthemen_json: string; spezifische_tags_json: string }[];
  const dsIso = new Map(
    (db.prepare(`SELECT u.dbid, d.dok_datum AS iso FROM (SELECT DISTINCT dbid FROM berlin_ds_unterthemen) u JOIN berlin_documents d ON d.dbid = u.dbid`)
      .all() as { dbid: string; iso: string | null }[]).map((r) => [r.dbid, r.iso])
  );
  const redeIso = db.prepare(`
    SELECT ru.feld, ru.unterthema, MAX(ss.datum) AS iso
    FROM berlin_rede_unterthemen ru JOIN berlin_speeches ss ON ss.speech_id = ru.speech_id
    GROUP BY ru.feld, ru.unterthema
  `).all() as { feld: string; unterthema: string; iso: string | null }[];

  const key = (feld: string, u: string) => `${feld}${u}`;
  const docs = new Map<string, Set<string>>();
  const tagCount = new Map<string, Map<string, number>>();
  const maxIso = new Map<string, string>();
  const bump = (k: string, iso: string | null | undefined) => { if (iso && iso > (maxIso.get(k) ?? "")) maxIso.set(k, iso); };
  for (const r of rows) {
    const tags = parseArr(r.spezifische_tags_json);
    for (const u of parseArr(r.unterthemen_json)) {
      if (u === "Sonstiges") continue;
      const k = key(r.feld, u);
      let set = docs.get(k); if (!set) { set = new Set(); docs.set(k, set); }
      set.add(r.dbid);
      bump(k, dsIso.get(r.dbid));
      let tc = tagCount.get(k); if (!tc) { tc = new Map(); tagCount.set(k, tc); }
      for (const t of tags) tc.set(t, (tc.get(t) ?? 0) + 1);
    }
  }
  for (const r of redeIso) bump(key(r.feld, r.unterthema), r.iso);

  const ober = BERLIN_THEMENFELDER_ALLE.map((f) => {
    const unterthemen: (StrukturUnter & { _iso: string | null })[] = (TAXONOMIE_BERLIN[f.label] ?? []).map((u) => {
      const k = key(f.label, u);
      const topTags = [...(tagCount.get(k) ?? new Map<string, number>()).entries()]
        .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
      const iso = maxIso.get(k) ?? null;
      return { name: kurzUnter(u), slug: unterSlug(kurzUnter(u)), feld: f.label, count: docs.get(k)?.size ?? 0, topTags, zuletzt: iso ? rel(iso) : null, _iso: iso };
    }).sort((a, b) => b.count - a.count);
    const oberIso = unterthemen.reduce<string | null>((m, u) => (u._iso && u._iso > (m ?? "") ? u._iso : m), null);
    return {
      name: kurzFeld(f.label), slug: f.key, zuletzt: oberIso ? rel(oberIso) : null,
      unterthemen: unterthemen.map(({ _iso, ...u }) => u),
      _hasData: unterthemen.some((u) => u.count > 0),
    };
  });
  // Nur Oberthemen mit klassifizierten Daten (Pilot = Wohnen)
  return ober.filter((o) => o._hasData).map(({ _hasData, ...o }) => o);
}

// Slug → (feld, unterthema) — Berlin kennt keine Merges/Anzeige-Umbenennungen.
export function resolveBerlinUnter(oberSlug: string, slug: string): { feld: string; unterthema: string } | null {
  const f = BERLIN_THEMENFELDER_ALLE.find((x) => x.key === oberSlug);
  if (!f) return null;
  for (const u of TAXONOMIE_BERLIN[f.label] ?? [])
    // Kurz-Slug (neu) ODER kanonischer Lang-Slug (alte/geteilte URLs bleiben gültig)
    if (unterSlug(kurzUnter(u)) === slug || unterSlug(u) === slug) return { feld: f.label, unterthema: u };
  return null;
}
