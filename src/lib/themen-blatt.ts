// Echte Daten für das Themen-Blatt „Digital" (/vorschau/themen) — ersetzt die
// Dummy-Daten der Vorschau, um sichtbar zu machen, welche Daten REICHEN und
// welche noch fehlen (Stand 2026-06-11).
//
// Korn seit dem Unterthemen-Batch (msgbatch_014rmgoQWEz9JMbD43N2vrB4, 2026-06-11):
//   - Drucksachen:  ds_unterthemen, Cluster „Digital- & KI-Wirtschaft", kern_im_feld=1
//                   (66 DS) — Item-Tags = die offenen spezifische_tags[] des Batches
//   - Reden:        noch item_topics aw_field „Medien, Kommunikation und Informations-
//                   technik" (1.901) — erben die Unterthemen später via inherited_ds
//   - Abstimmungen: Handzeichen-Votes, deren Drucksachen im Cluster liegen
//   - Gesetzentwürfe: DIP-Vorgangsdaten (dip_vorgaenge/positionen)
//
// VERBLEIBENDE LÜCKEN:
//   1. Reden tragen noch keine Unterthemen/Tags; Reden-Korn = Feld, nicht Cluster.
//      NUR eigen-klassifizierte Reden (origin rede_summary/title_llm, 248 von 1.901):
//      inherited_ds vererbt am DEBATTEN-Korn pauschal alle Felder aller debattierten
//      DS (bis zu 11 Felder/Rede — Energiesteuer-Reden landeten auf Digital, User-
//      Fund 2026-06-11). Ein künftiger Erben-Lauf muss am Reden↔DS-Paar ansetzen.
//   2. Digital-Votes sind ALLE Handzeichen → keine Ja/Nein-Zahlen (nur Fraktions-
//      voten) und kein „Worum geht es?" (Ersatz = DS-Kerninhalt).
//   3. Feed lädt die neuesten 120 — voller Bestand braucht die server-seitige
//      searchThema-Integration statt Client-Filterung.
//   4. Köpfe: „Spricht vor allem zu"-Chips fehlen (Tag-Korn × redner_id, nach Erben-Lauf).
import { getDb } from "@/lib/db";
import { OBERTHEMEN, TAXONOMIE, unterSlug, anzeigeName, istGemergt, mergeKey, mergeQuellen, mergeZiel } from "@/lib/themen-struktur";

const FEED_LIMIT = 120;

// Vote-Topic-Label je Cluster für den /abstimmungen?thema=-Deep-Link (Roh-Label-
// Welt der Abstimmungsseite; wächst kuratiert, fehlt = kein Link, nur Zählung)
const VOTE_THEMA: Record<string, string> = {
  "Digital- & KI-Wirtschaft": "Digitalisierung",
};

// Ausschuss-Stichwort je Feld für die Rollen-Zeile der Köpfe (LIKE-Match auf
// committee_label; fehlt = keine Ausschuss-Rolle angezeigt)
const AUSSCHUSS_KEYWORD: Record<string, string> = {
  "Wirtschaft": "%Wirtschaft%",
  "Medien, Kommunikation und Informationstechnik": "%Digital%",
  "Gesundheit": "%Gesundheit%",
  "Verteidigung": "%Verteidigung%",
  "Innere Sicherheit": "%Inneres%",
  "Recht": "%Recht%",
  "Öffentliche Finanzen, Steuern und Abgaben": "%Finanz%",
  "Verkehr": "%Verkehr%",
  "Umwelt": "%Umwelt%",
  "Energie": "%Energie%",
  "Arbeit und Beschäftigung": "%Arbeit%",
  "Soziale Sicherung": "%Arbeit%",
  "Bildung und Erziehung": "%Bildung%",
  "Wissenschaft, Forschung und Technologie": "%Forschung%",
  "Migration und Aufenthaltsrecht": "%Inneres%",
  "Außenpolitik und internationale Beziehungen": "%Auswärtig%",
  "Europapolitik und Europäische Union": "%Europäische Union%",
  "Entwicklungspolitik": "%wirtschaftliche Zusammenarbeit%",
  "Landwirtschaft und Ernährung": "%Landwirtschaft%",
  "Kultur": "%Kultur%",
  "Sport, Freizeit und Tourismus": "%Sport%",
  "Raumordnung, Bau- und Wohnungswesen": "%Wohnen%",
  "Staat und Verwaltung": "%Inneres%",
  "Gesellschaftspolitik, soziale Gruppen": "%Familie%",
  "Politisches Leben, Parteien": "%Wahlprüfung%",
};

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
export interface EchtKopfRede { id: string; datum: string; iso: string | null; einzeiler: string; href: string; tags: string[] }
export interface EchtKopf {
  politicianId: number; vorname: string; nachname: string; partei: string; reden: number; gesamt: number; rolle: string | null;
  photoUrl: string | null;
  // die letzten Reden zum Thema — Reden hängen an den KÖPFEN, nicht im Feed
  letzteReden: EchtKopfRede[];
}
export interface EchtSitzung { nr: number; datum: string; tops: string; href: string }
export interface DigitalBlattEcht {
  feld: string; unterthema: string;
  beschreibung: string; voteThema: string | null;
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
function parseTags(json: string | null): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.map((t) => String(t).trim()).filter(Boolean) : [];
  } catch { return []; }
}
// kerninhalt ist teils als JSON-Array (Stichpunkte) gespeichert → lesbarer Fließtext
function parseKern(s: string | null): string | null {
  if (!s) return null;
  const t = s.trim();
  // Literal-"null"/Platzhalter aus der LLM-Analyse nicht als Text durchreichen
  if (t === "" || t.toLowerCase() === "null" || t === "—" || t === "-") return null;
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
// Debatten-Kontexte tragen TOP-Nummern-Präfixe („17\t", „7\ta)\t", „–\t") und teils
// den formalen Volltext „Beratung des Antrags der Abgeordneten A, B, C, weiterer
// Abgeordneter und der Fraktion X" → als Karten-Titel kürzen.
function cleanKontext(s: string | null): string | null {
  if (!s) return null;
  // TOP-Nummer/Buchstabe/Spiegelstrich sind TAB-getrennte Präfix-Segmente („17⇥a)⇥–⇥Text")
  const parts = s.split("\t").map((p) => p.trim()).filter(Boolean);
  const t = parts[parts.length - 1] ?? "";
  // „…eingebrachten Entwurfs eines Gesetzes zur X" → das Thema steckt im Genitiv
  const gesetz = t.match(/Entwurfs eines (.+)$/i);
  if (gesetz) return `Entwurf eines ${gesetz[1].trim()}`;
  // „Beratung des Antrags der Abgeordneten A, B, … und der Fraktion X" → kompakt
  // (der formale String trägt KEIN Thema — die Zusammenfassung darunter schon)
  const antrag = t.match(/Beratung des Antrags der (?:Abgeordneten .*? und der )?(Fraktion(?:en)? .+)$/i);
  if (antrag) return `Debatte: Antrag der ${antrag[1].trim()}`;
  return t || null;
}

export type ThemenBlattEcht = DigitalBlattEcht;

export function getThemenBlatt(feldAw: string, unterthemaName: string): DigitalBlattEcht {
  const db = getDb();

  // ── 1. Digital-Drucksachen = Batch-Klassifikation (ds_unterthemen) ──
  // Cluster „Digital- & KI-Wirtschaft" + kern_im_feld=1 (Items, deren KERN im Feld
  // liegt — kern=0 ist die Rollup-Putzliste). Item-Tags = spezifische_tags[] des
  // Batches (KI, Halbleiter, Rechenzentren …) statt der groben Roh-Tag-Felder.
  // Merge-Gruppe: das Ziel-Paar + alle hineingemergten Quell-Cluster (Anzeige-
  // Merges, themen-struktur.ts) — Pool = Vereinigung, dedupliziert nach DS-Nr,
  // bei Doppel-Klassifikation gewinnt die Zeile des Ziel-Felds (Reihenfolge).
  const paare = [{ feld: feldAw, unterthema: unterthemaName }, ...mergeQuellen(feldAw, unterthemaName)];
  const dsRowsAll = db.prepare(`
    SELECT da.drucksache_nr AS nr, da.zusammenfassung, da.kerninhalt, da.dokumenttyp,
      du.feld AS du_feld, du.spezifische_tags_json,
      (SELECT COALESCE(a.thema, a.titel) FROM activities a WHERE a.drucksache_nr = da.drucksache_nr LIMIT 1) AS titel,
      COALESCE(
        (SELECT MIN(a.datum) FROM activities a WHERE a.drucksache_nr = da.drucksache_nr AND a.datum IS NOT NULL),
        (SELECT dt.publication_date FROM drucksache_texts dt WHERE dt.drucksache_nr = da.drucksache_nr)
      ) AS iso
    FROM ds_unterthemen du
    JOIN drucksache_analyses da ON da.drucksache_nr = du.drucksache_nr
    WHERE (${paare.map(() => "(du.feld = ? AND EXISTS (SELECT 1 FROM json_each(du.unterthemen_json) je WHERE je.value = ?))").join(" OR ")})
      AND da.analyze_error IS NULL
  `).all(...paare.flatMap((p) => [p.feld, p.unterthema])) as {
    nr: string; zusammenfassung: string | null; kerninhalt: string | null;
    dokumenttyp: string | null; du_feld: string; spezifische_tags_json: string | null;
    titel: string | null; iso: string | null;
  }[];
  const feldRang = new Map(paare.map((p, i) => [p.feld, i]));
  const dsRowsRaw = [...dsRowsAll]
    .sort((a, b) => (feldRang.get(a.du_feld) ?? 99) - (feldRang.get(b.du_feld) ?? 99))
    .filter(((seen) => (r: { nr: string }) => !seen.has(r.nr) && !!seen.add(r.nr))(new Set<string>()));
  const dsRows = dsRowsRaw.map((r) => ({ ...r, tags: parseTags(r.spezifische_tags_json) }));
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
      fraktionen, tags: ds.tags, href: `/aktivitaeten/${dsNr.replace("/", "-")}`,
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
      tags: ds.tags, href: `/aktivitaeten/${g.nr.replace("/", "-")}`,
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
      redner: null, tags: ds.tags, href: `/aktivitaeten/${ds.nr.replace("/", "-")}`,
    });
  }
  // Reden sind NICHT im Feed: Debatten-Kontexte taugen nicht als Karten-Titel
  // („Nun komme ich zu Tagesordnungspunkt 1“, User 2026-06-11) — sie hängen
  // stattdessen als „letzte Reden zum Thema“ an den Köpfen (Screen 2).
  docs.sort((a, b) => (b.iso ?? "").localeCompare(a.iso ?? ""));
  const feed = docs.slice(0, FEED_LIMIT);

  // ── 5. Köpfe: Top-Redner:innen im Feld (Lautstärke-Sicht, parteiübergreifend) ──
  const kopfRows = db.prepare(`
    SELECT ss.politician_id AS pid, p.first_name AS vorname, p.last_name AS nachname,
           COALESCE(pa.label, '') AS partei, p.photo_url,
           COUNT(DISTINCT ss.rede_id) AS reden,
           (SELECT COUNT(DISTINCT s2.rede_id) FROM speech_summaries s2 WHERE s2.politician_id = ss.politician_id) AS gesamt,
           (SELECT cm.committee_role || '§' || cm.committee_label FROM committee_memberships cm
             WHERE cm.politician_id = ss.politician_id AND cm.committee_label LIKE @like LIMIT 1) AS ausschuss
    FROM item_topics it
    JOIN speech_summaries ss ON ss.rede_id = it.item_id
    JOIN politicians p ON p.id = ss.politician_id
    LEFT JOIN parties pa ON pa.id = p.party_id
    WHERE it.source = 'bt_rede' AND it.aw_field = @feld
      AND it.origin IN ('rede_summary','title_llm') AND ss.politician_id IS NOT NULL
    GROUP BY ss.politician_id
    ORDER BY reden DESC
    LIMIT 10
  `).all({ feld: feldAw, like: AUSSCHUSS_KEYWORD[feldAw] ?? "\u0000kein-match" }) as { pid: number; vorname: string; nachname: string; partei: string; photo_url: string | null; reden: number; gesamt: number; ausschuss: string | null }[];
  // Die letzten 2 eigen-klassifizierten Reden je Top-Kopf (Datum + Zusammenfassung
  // + Link zur Sitzung) — hier braucht es keinen Debatten-Titel, die Person rahmt.
  const pids = kopfRows.map((k) => k.pid);
  const redenRows = pids.length ? db.prepare(`
    SELECT ss.politician_id AS pid, ss.rede_id, ss.datum AS iso, ss.zusammenfassung, ss.sitzung
    FROM item_topics it
    JOIN speech_summaries ss ON ss.rede_id = it.item_id
    WHERE it.source = 'bt_rede' AND it.aw_field = ?
      AND it.origin IN ('rede_summary','title_llm')
      AND ss.politician_id IN (${pids.map(() => "?").join(",")})
      AND ss.zusammenfassung IS NOT NULL AND ss.zusammenfassung != ''
    GROUP BY ss.rede_id
    ORDER BY ss.datum DESC
  `).all(feldAw, ...pids) as { pid: number; rede_id: string; iso: string | null; zusammenfassung: string | null; sitzung: number | null }[] : [];
  // Tag-Scent per TEXTMATCH gegen das Cluster-Tag-Vokabular (deterministisch,
  // kein LLM) — Platzhalter, bis Reden echte Tags tragen (Erben-Lauf am
  // Reden↔DS-Paar). „wenn getagt": nur zeigen, was wörtlich vorkommt.
  const tagVokabular = [...new Set(dsRows.flatMap((d) => d.tags))];
  const redenByPid = new Map<number, EchtKopfRede[]>();
  for (const r of redenRows) {
    const list = redenByPid.get(r.pid) ?? [];
    if (list.length >= 1) { continue; } // genau EINE Rede je Kopf (User 2026-06-11)
    const text = (r.zusammenfassung ?? "").toLowerCase();
    // Hard-Cap als zweite Verteidigung neben dem UI-line-clamp (echte Summaries
    // können lang sein); Link zielt auf den rede_id-Anker der Sitzungsseite.
    // Führenden „Name (Partei) "-Vorspann strippen — die Karte zeigt die Person
    // schon (Avatar + Name), der Platz gehört dem Inhalt (User 2026-06-11).
    let voll = (r.zusammenfassung ?? "").trim().replace(/^[A-ZÄÖÜ][^()]{1,60}?\s*\([^)]{2,40}\)\s*/, "");
    voll = voll.charAt(0).toUpperCase() + voll.slice(1);
    list.push({
      id: r.rede_id, datum: rel(r.iso), iso: r.iso,
      // KEIN eigenes „…" mehr: das UI-line-clamp setzt die Ellipse exakt ans
      // Zeilenende (Server-Cap nur noch Payload-Hygiene, greift nie sichtbar)
      einzeiler: voll.length > 800 ? voll.slice(0, 800) : voll,
      href: r.sitzung != null ? `/protokolle/sitzung/${r.sitzung}#rede-${encodeURIComponent(r.rede_id)}` : "#",
      tags: tagVokabular.filter((t) => t.length >= 4 && text.includes(t.toLowerCase())).slice(0, 3),
    });
    redenByPid.set(r.pid, list);
  }

  const ROLE_DE: Record<string, string> = { member: "Mitglied", chairperson: "Vorsitz", alternate_member: "stellv. Mitglied" };
  // Regierungsämter fehlen in den Stammdaten (occupation = stale Vorberuf) —
  // kuratierte Mini-Liste als Brücke, bis eine echte Kabinettsliste beschafft ist
  // (Beschaffungsliste 2026-06-11). Amt schlägt Ausschuss-Rolle.
  const REGIERUNGSAMT: Record<number, string> = {
    900003: "Bundesminister für Digitales und Staatsmodernisierung",
  };
  const koepfe: EchtKopf[] = kopfRows.map((k) => {
    let rolle: string | null = REGIERUNGSAMT[k.pid] ?? null;
    if (!rolle && k.ausschuss) {
      const [role, label] = k.ausschuss.split("§");
      rolle = `${ROLE_DE[role] ?? role} im ${label}`;
    }
    return { politicianId: k.pid, vorname: k.vorname, nachname: k.nachname, partei: cleanParty(k.partei), reden: k.reden, gesamt: k.gesamt, rolle, photoUrl: k.photo_url || null, letzteReden: redenByPid.get(k.pid) ?? [] };
  });

  // ── 6. Plenarsitzungen mit Feld-Reden ──
  const sitzungRows = db.prepare(`
    SELECT ss.sitzung AS nr, MAX(ss.datum) AS iso, COUNT(DISTINCT ss.rede_id) AS n
    FROM item_topics it
    JOIN speech_summaries ss ON ss.rede_id = it.item_id
    WHERE it.source = 'bt_rede' AND it.aw_field = ?
      AND it.origin IN ('rede_summary','title_llm') AND ss.sitzung IS NOT NULL
    GROUP BY ss.sitzung
    ORDER BY iso DESC
    LIMIT 8
  `).all(feldAw) as { nr: number; iso: string | null; n: number }[];
  const sitzungen: EchtSitzung[] = sitzungRows.map((s) => ({
    nr: s.nr, datum: fmtLang(s.iso),
    tops: `${s.n} ${s.n === 1 ? "Rede" : "Reden"} zum Thema`,
    href: `/protokolle/sitzung/${s.nr}`,
  }));

  // ── 7. Spezifische Themen = die offenen Batch-Tags der Cluster-Items ──
  // (KI, Halbleiter, Rechenzentren, Digitale Souveränität … — das feine Korn)
  const tagCounts = new Map<string, number>();
  for (const ds of dsRows) for (const t of ds.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const tags = Array.from(tagCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const zuletztIso = [dsRows.map((d) => d.iso), redenRows.map((r) => r.iso), votes.map((v) => v.iso)]
    .flat().filter(Boolean).sort().pop() ?? null;
  const totalReden = (db.prepare(
    `SELECT COUNT(DISTINCT item_id) AS c FROM item_topics WHERE source = 'bt_rede' AND aw_field = ? AND origin IN ('rede_summary','title_llm')`
  ).get(feldAw) as { c: number }).c;

  // Neutral abgeleitete Kopf-Zeile (kuratierte Beschreibungen sind eine bekannte
  // Lücke — bis dahin: reine Bestandsbeschreibung, keine Wertung)
  const topTags = tags.slice(0, 3).map((t) => t.name);
  const beschreibung = `${dsRows.length} ${dsRows.length === 1 ? "Vorgang" : "Vorgänge"} der 21. Wahlperiode im Bundestag${topTags.length ? ` — am häufigsten: ${topTags.join(", ")}.` : "."}`;

  return {
    // Anzeige-Name (nach Merge ggf. umbenannt) — Slug-Checks im Client laufen
    // gegen genau diesen Namen, resolveUnter akzeptiert beide Slug-Formen.
    feld: feldAw, unterthema: anzeigeName(unterthemaName),
    beschreibung, voteThema: VOTE_THEMA[unterthemaName] ?? null,
    zuletztAktiv: rel(zuletztIso),
    votes, gesetze, docs: feed, koepfe, sitzungen, tags,
    totalDs: dsRows.length, totalReden,
  };
}

// ── Picker-Struktur: 14 Oberthemen → Unterthemen mit Live-Bestand + Tag-Scent ──
export interface StrukturUnter { name: string; slug: string; feld: string; count: number; topTags: string[] }
export interface StrukturOber { name: string; slug: string; unterthemen: StrukturUnter[] }

export function getThemenStruktur(): StrukturOber[] {
  const db = getDb();
  // Eine Abfrage, Aggregation in JS (~11k Zeilen, schnell genug pro Request).
  // Anzeige-Merges: Quell-Cluster zählen aufs Ziel (kanonischer mergeKey); Counts
  // sind DS-dedupliziert (eine DS, die in Quelle UND Ziel klassifiziert ist,
  // zählt einmal) — deshalb Sets statt Zähler.
  const rows = db.prepare(
    "SELECT drucksache_nr AS nr, feld, unterthemen_json, spezifische_tags_json FROM ds_unterthemen"
  ).all() as { nr: string; feld: string; unterthemen_json: string; spezifische_tags_json: string }[];
  const docs = new Map<string, Set<string>>();
  const tagCount = new Map<string, Map<string, number>>();
  for (const r of rows) {
    const tags = parseTags(r.spezifische_tags_json);
    for (const u of parseTags(r.unterthemen_json)) {
      const ziel = mergeZiel(r.feld, u);
      const key = ziel ? mergeKey(ziel.feld, ziel.unterthema) : mergeKey(r.feld, u);
      let set = docs.get(key);
      if (!set) { set = new Set(); docs.set(key, set); }
      if (set.has(r.nr)) continue; // DS schon über die andere Merge-Hälfte gezählt
      set.add(r.nr);
      let tc = tagCount.get(key);
      if (!tc) { tc = new Map(); tagCount.set(key, tc); }
      for (const t of tags) tc.set(t, (tc.get(t) ?? 0) + 1);
    }
  }
  return OBERTHEMEN.map((o) => ({
    name: o.name, slug: o.slug,
    unterthemen: o.felder.flatMap((feld) =>
      (TAXONOMIE[feld] ?? []).filter((u) => !istGemergt(feld, u)).map((u) => {
        const key = mergeKey(feld, u);
        const topTags = [...(tagCount.get(key) ?? new Map<string, number>()).entries()]
          .sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t);
        return { name: anzeigeName(u), slug: unterSlug(anzeigeName(u)), feld, count: docs.get(key)?.size ?? 0, topTags };
      })
    ).sort((a, b) => b.count - a.count),
  }));
}
