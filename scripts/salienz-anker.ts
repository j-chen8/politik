/**
 * Auto-Anker: schlägt pro markantem News-Cluster die Drucksache/Abstimmung vor,
 * die DENSELBEN Vorgang behandelt — als VORSCHLAG für den Picker (Mensch gibt OK),
 * nie ungeprüft auf die Seite.
 *
 * Zweistufig, damit das LLM nichts erfinden kann:
 *   (1) DETERMINISTISCH: FTS5-Kandidaten (drucksachen_fts, Prefix-Tokens aus
 *       Leitthema+Schlagzeilen, letzte 180 Tage) + Token-Match auf Vote-Labels.
 *   (2) MISTRAL (Free-Tier, €0): bounded choice — wählt AUS den Kandidaten oder
 *       null; Antwort wird gegen die Kandidatenliste validiert (Drift-Guard).
 *
 * Kein Kandidat / kein Match → NULL-Zeile (fail-quiet: Picker zeigt dann nichts
 * vor). News laufen dem Parlament oft voraus — „kein Anker" ist der Normalfall,
 * kein Fehler.
 *
 * Aufruf: npx tsx scripts/salienz-anker.ts [--date=YYYY-MM-DD] [--model=…] [--dry]
 */
import Database from "better-sqlite3";
import { ensureSalienzSchema } from "./_lib/salienz-schema";
import { MistralPool } from "./_lib/mistral";

const RUN_DATE = process.argv.find((a) => a.startsWith("--date="))?.split("=")[1] ?? new Date().toISOString().slice(0, 10);
// Large als Default: Small nahm im Audit 07.07. themenverwandte Anfragen als
// „derselbe Vorgang" (3/3 falsch); Large mit strengem Prompt: 0 Halluzinationen.
const MODEL = process.argv.find((a) => a.startsWith("--model="))?.split("=")[1] ?? "mistral-large-latest";
const DRY = process.argv.includes("--dry");
const DEBUG = process.argv.includes("--debug"); // Kandidatenlisten mit ausgeben (Audit)
const FENSTER_TAGE = 180; // Kandidaten-Rückschau: älter ist selten „dieselbe" Story

const db = new Database("politik.db");
ensureSalienzSchema(db);

// ── Tokens: Leitthema voll + Schlagzeilen-Wörter, die in ≥2 Titeln vorkommen
//    (Cross-Outlet-Begriffe = Kern der Story; Outlet-Eigenheiten fallen raus). ──
const STOP = new Set([
  "aber", "auch", "beim", "bereits", "dann", "dass", "diese", "dieser", "dieses", "durch",
  "eine", "einem", "einen", "einer", "eines", "gegen", "haben", "heute", "ihre", "immer",
  "jahr", "jahre", "jahren", "jetzt", "kann", "kein", "keine", "koennen", "können", "mehr",
  "nach", "nicht", "neue", "neuen", "neuer", "noch", "nur", "ohne", "schon", "sein", "seine",
  "sich", "sind", "soll", "sollen", "ueber", "über", "unter", "viele", "wegen", "weiter",
  "werden", "wieder", "wird", "will", "wollen", "zwischen", "deutschland", "deutsche", "deutschen",
  // Generische Schlagzeilen-Verben/Zahlwörter: tragen nichts zur Vorgangs-Suche bei,
  // verwässern aber bm25 (seltene Zufallstreffer wie „Verbändeabfrage" ranken hoch).
  "beschlossen", "beschließen", "beschließt", "könnte", "koennte", "verschoben", "warum",
  "nimmt", "kurz", "knapp", "fast", "lange", "zahlen", "steigen", "steigt", "sinkt", "erwartet",
  "weniger", "tausende", "reiche", "euro", "millionen", "milliarden", "prozent", "regierung",
]);
function tokens(leitthema: string, titles: { title: string }[]): string[] {
  const worte = (s: string) => (s.toLowerCase().match(/[a-zäöüß0-9][a-zäöüß0-9-]{3,}/gi) ?? []).filter((w) => !STOP.has(w));
  const kern = new Set(worte(leitthema));
  const zaehl = new Map<string, number>();
  for (const t of titles) for (const w of new Set(worte(t.title))) zaehl.set(w, (zaehl.get(w) ?? 0) + 1);
  // Bei kleinen Clustern (≤3 Titel) zählen ALLE Titel-Wörter: die ≥2-Schwelle
  // verlor sonst genau das entscheidende Wort (Audit-Fall „Gebäudemodernisierungs-
  // gesetz" stand nur in EINER von zwei Schlagzeilen → richtige DS nie Kandidat).
  const schwelle = titles.length <= 3 ? 1 : 2;
  for (const [w, n] of zaehl) if (n >= schwelle) kern.add(w);
  return [...kern].slice(0, 12);
}

// ── Stufe 1: deterministische Kandidaten ──
interface DsKandidat { nr: string; titel: string; typ: string | null; datum: string | null }
interface VoteKandidat { pollId: number; label: string; datum: string | null }

const dsStmt = db.prepare(`
  SELECT f.drucksache_nr AS nr,
         COALESCE((SELECT titel FROM dip_ds_titles t WHERE t.drucksache_nr = f.drucksache_nr), '') AS titel,
         da.dokumenttyp AS typ,
         (SELECT publication_date FROM drucksache_texts dt WHERE dt.drucksache_nr = f.drucksache_nr) AS datum
  FROM drucksachen_fts f
  JOIN drucksache_analyses da ON da.drucksache_nr = f.drucksache_nr AND da.analyze_error IS NULL
  WHERE drucksachen_fts MATCH ?
    AND (SELECT publication_date FROM drucksache_texts dt WHERE dt.drucksache_nr = f.drucksache_nr) >= date('now', ?)
  ORDER BY bm25(drucksachen_fts) LIMIT 10`);

function dsKandidaten(toks: string[]): DsKandidat[] {
  if (!toks.length) return [];
  // Prefix-Match fängt Flexion/Komposita-Anfänge ("elterngeld*" → Elterngeldes).
  const q = toks.map((t) => `"${t}"*`).join(" OR ");
  try {
    return (dsStmt.all(q, `-${FENSTER_TAGE} days`) as DsKandidat[]).filter((k) => k.titel);
  } catch { return []; } // kaputte FTS-Query (Sonderzeichen) → lieber keine Kandidaten
}

const pollRows = db.prepare(`
  SELECT poll_id AS pollId, MIN(poll_label) AS label, MAX(poll_date) AS datum
  FROM votes GROUP BY poll_id HAVING MAX(poll_date) >= date('now', ?)`).all(`-${FENSTER_TAGE} days`) as VoteKandidat[];

function voteKandidaten(toks: string[]): VoteKandidat[] {
  return pollRows
    .map((p) => ({ p, score: toks.filter((t) => p.label.toLowerCase().includes(t)).length }))
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.p);
}

// ── Stufe 2: bounded choice ──
async function waehleAnker(
  pool: MistralPool,
  cl: { leitthema: string; summary: string | null; titles: { outlet: string; title: string }[] },
  ds: DsKandidat[], polls: VoteKandidat[],
): Promise<{ ds_nr: string | null; poll_id: number | null; begruendung: string | null }> {
  const user = [
    `Nachrichten-Story von heute (mehrere Redaktionen):`,
    `Leitthema: ${cl.leitthema}`,
    cl.summary ? `Zusammenfassung: ${cl.summary}` : "",
    `Schlagzeilen:`,
    ...cl.titles.slice(0, 6).map((t) => `- [${t.outlet}] ${t.title}`),
    ``,
    ds.length ? `Kandidaten-Drucksachen (Bundestag, letzte ${FENSTER_TAGE} Tage):` : `(keine Drucksachen-Kandidaten)`,
    ...ds.map((k) => `- ${k.nr} (${k.typ ?? "?"}${k.datum ? `, ${k.datum}` : ""}): ${k.titel}`),
    polls.length ? `Kandidaten-Abstimmungen (namentlich):` : `(keine Abstimmungs-Kandidaten)`,
    ...polls.map((p) => `- poll_id=${p.pollId}${p.datum ? ` (${p.datum})` : ""}: ${p.label}`),
    ``,
    `Frage: IST eine der Drucksachen bzw. Abstimmungen GENAU der Vorgang, über den die Story berichtet — also das Gesetz/der Antrag/der Beschluss selbst?`,
    `Strenge Regeln:`,
    `- Bloße Themenverwandtschaft reicht NICHT. Im Zweifel null — ein falscher Anker ist schlimmer als keiner.`,
    `- Eine Kleine/Große Anfrage ÜBER ein Thema (z.B. "Entwicklungen beim X", "Auswirkungen von Y") ist NIE der Vorgang selbst — nur wählen, wenn die Story über genau diese Anfrage berichtet.`,
    `- Berichtet die Story über ein Gesetz(esvorhaben), passt nur der Gesetzentwurf/Änderungsantrag dazu selbst.`,
    `- Oppositions-Anträge, die das Gegenteil fordern, sind NICHT der Vorgang.`,
    `Antworte NUR mit JSON: {"ds_nr": "21/1234" oder null, "poll_id": Zahl oder null, "begruendung": "1 kurzer Satz"}`,
  ].filter(Boolean).join("\n");

  const raw = await pool.chat({
    model: MODEL, temperature: 0, maxTokens: 250,
    system: "Du ordnest Nachrichten parlamentarischen Vorgängen zu. Du antwortest ausschließlich mit einem JSON-Objekt, ohne Markdown.",
    user,
  });
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return { ds_nr: null, poll_id: null, begruendung: null };
  let j: { ds_nr?: unknown; poll_id?: unknown; begruendung?: unknown };
  try { j = JSON.parse(m[0]); } catch { return { ds_nr: null, poll_id: null, begruendung: null }; }
  // Drift-Guard: nur Werte, die wirklich in der Kandidatenliste stehen.
  const dsNr = typeof j.ds_nr === "string" && ds.some((k) => k.nr === j.ds_nr) ? j.ds_nr : null;
  const pollId = typeof j.poll_id === "number" && polls.some((p) => p.pollId === j.poll_id) ? j.poll_id : null;
  return { ds_nr: dsNr, poll_id: pollId, begruendung: typeof j.begruendung === "string" ? j.begruendung.slice(0, 300) : null };
}

async function main() {
  const cluster = db.prepare(`
    SELECT cluster_id, leitthema, themenfeld, summary, titles_json, outlet_count
    FROM news_cluster WHERE run_date = ? AND outlet_count >= 2
    ORDER BY gesetzbezug DESC, outlet_count DESC`).all(RUN_DATE) as
    { cluster_id: number; leitthema: string; themenfeld: string | null; summary: string | null; titles_json: string; outlet_count: number }[];
  if (!cluster.length) { console.log(`Keine markanten Cluster für ${RUN_DATE} — nichts zu tun.`); return; }

  const pool = new MistralPool(600);
  const ins = db.prepare(`
    INSERT OR REPLACE INTO salienz_anker (run_date, cluster_id, ds_nr, ds_titel, poll_id, poll_label, begruendung, model)
    VALUES (?,?,?,?,?,?,?,?)`);

  let gefunden = 0;
  for (const c of cluster) {
    const titles = JSON.parse(c.titles_json ?? "[]") as { outlet: string; title: string }[];
    const toks = tokens(c.leitthema, titles);
    const ds = dsKandidaten(toks);
    const polls = voteKandidaten(toks);
    if (DEBUG) {
      console.log(`\n#${c.cluster_id} ${c.leitthema}\n  Tokens: ${toks.join(", ")}`);
      for (const k of ds) console.log(`  DS ${k.nr} (${k.typ ?? "?"}, ${k.datum ?? "?"}): ${k.titel.slice(0, 80)}`);
      for (const p of polls) console.log(`  Vote ${p.pollId} (${p.datum ?? "?"}): ${p.label.slice(0, 80)}`);
    }

    let wahl: { ds_nr: string | null; poll_id: number | null; begruendung: string | null } = { ds_nr: null, poll_id: null, begruendung: null };
    if (ds.length || polls.length) wahl = await waehleAnker(pool, { ...c, titles }, ds, polls);

    const dsTitel = wahl.ds_nr ? ds.find((k) => k.nr === wahl.ds_nr)?.titel ?? null : null;
    const pollLabel = wahl.poll_id != null ? polls.find((p) => p.pollId === wahl.poll_id)?.label ?? null : null;
    if (wahl.ds_nr || wahl.poll_id != null) gefunden++;

    const tag = wahl.ds_nr || wahl.poll_id != null ? "✓" : "·";
    console.log(`${tag} #${c.cluster_id} ${c.leitthema.slice(0, 55)} → ${wahl.ds_nr ?? "—"}${wahl.poll_id != null ? ` / poll ${wahl.poll_id}` : ""}${wahl.begruendung ? `  (${wahl.begruendung.slice(0, 70)})` : ""}  [${ds.length} DS-, ${polls.length} Vote-Kandidaten]`);
    if (!DRY) ins.run(RUN_DATE, c.cluster_id, wahl.ds_nr, dsTitel, wahl.poll_id, pollLabel, wahl.begruendung, MODEL);
  }
  console.log(`\n${gefunden}/${cluster.length} Cluster mit Anker-Vorschlag (${RUN_DATE}, ${MODEL}).`);
}

main().finally(() => db.close());
