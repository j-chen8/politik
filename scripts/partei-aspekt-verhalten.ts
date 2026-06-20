/**
 * „Tut"/Verhaltens-Schicht je Aspekt × Partei (Pilot).
 *
 * Ergänzt die Aspekt-Vergleichsmatrix (src/lib/partei-vergleich-matrix.ts, „Sagt")
 * um reales Verhalten/Aussagen aus drei Quellen, GETRENNT gelabelt:
 *   - Abstimmungen (echtes „Tut"): bundestag_votes.fraktion_votes_json, Feld via Drucksache→item_topics
 *   - Reden:  plenar_speeches (hat party) + speech_analyses_v2, Feld via item_topics(bt_rede)
 *   - Q&A:    aw_questions (politician→party), Feld via aw_question_topics→aw_tag_themenfeld
 *
 * Modell: Mistral large Free-Tier (MistralPool, Multi-Key, Rate-Manager).
 * Belege werden programmatisch gegen den Quelltext verifiziert (kein freies Raten).
 *
 *   npx tsx scripts/partei-aspekt-verhalten.ts --feld "Wirtschaft" --dry-run   # nur Retrieval, KEIN API
 *   npx tsx scripts/partei-aspekt-verhalten.ts --feld "Wirtschaft"             # mit Mistral
 *
 * WICHTIG: nicht parallel zu anderen Mistral-Free-Jobs starten (Rate-Limit-Kollision).
 */
import Database from "better-sqlite3";
import { MistralPool } from "./_lib/mistral";
import { VERGLEICH_MATRIX } from "../src/lib/partei-vergleich-matrix";

const argv = process.argv.slice(2);
const arg = (k: string, d?: string) =>
  argv.includes(k) ? argv[argv.indexOf(k) + 1] : d;
const FELD = arg("--feld", "Wirtschaft")!;
const DRY = argv.includes("--dry-run");
const MODEL = arg("--model", "mistral-large-2512")!;
const REDEN_CAP = Number(arg("--reden-cap", "50"));
const QA_CAP = Number(arg("--qa-cap", "50"));

const db = new Database("politik.db");

// Kanonische 5 Fraktionen (wie in fraktion_votes_json / partei_themenfeld_position).
const PARTEIEN = ["CDU/CSU", "AfD", "SPD", "GRÜNE", "LINKE"] as const;
type Partei = (typeof PARTEIEN)[number];

/** beliebige Partei-Strings (Reden/parties) → kanonisch, sonst null */
function kanon(p: string | null): Partei | null {
  const s = (p ?? "").toLowerCase();
  if (s.includes("grün") || s.includes("gruen") || s.includes("b90")) return "GRÜNE";
  if (s.includes("linke") || s === "die linke") return "LINKE";
  if (s === "afd" || s.includes("alternative für")) return "AfD";
  if (s === "spd" || s.includes("sozialdemokrat")) return "SPD";
  if (s.includes("cdu") || s.includes("csu") || s.includes("union")) return "CDU/CSU";
  return null;
}

const norm = (s: string) =>
  s.normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();

// ── Retrieval (kein LLM) ───────────────────────────────────────────────────

interface VoteCand { vote_id: number; betreff: string; richtung: Record<string, string>; }
interface TextCand { id: string; partei: Partei; text: string; meta: string; kind: "Rede" | "Q&A"; ref: string; }

function getVotes(feld: string): VoteCand[] {
  const rows = db.prepare(`
    SELECT DISTINCT bv.vote_id, bv.drucksache_nrn_json, bv.fraktion_votes_json
    FROM bundestag_votes bv
    WHERE bv.fraktion_votes_json IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM json_each(bv.drucksache_nrn_json) je
        JOIN item_topics it ON it.source='bt_drucksache' AND it.item_id=je.value
        WHERE it.aw_field = ?
      )
  `).all(feld) as { vote_id: number; drucksache_nrn_json: string; fraktion_votes_json: string }[];
  return rows.map((r) => {
    const ds: string[] = JSON.parse(r.drucksache_nrn_json || "[]");
    // Betreff aus Drucksachen-Titel (falls vorhanden), sonst Drucksache-Nr.
    const titel = ds
      .map((nr) => {
        const t = db.prepare(
          `SELECT titel FROM dip_ds_titles WHERE drucksache_nr=? AND titel IS NOT NULL LIMIT 1`,
        ).get(nr) as { titel: string } | undefined;
        return t?.titel ?? null;
      })
      .filter(Boolean)
      .join(" · ");
    return {
      vote_id: r.vote_id,
      betreff: titel || `Drucksache ${ds.join(", ")}`,
      richtung: JSON.parse(r.fraktion_votes_json || "{}"),
    };
  });
}

function getReden(feld: string): TextCand[] {
  const rows = db.prepare(`
    SELECT ps.rede_id, ps.party, ps.original_text,
           sa.zusammenfassung_2_saetze AS zus, sa.forderungen_json AS ford
    FROM item_topics it
    JOIN plenar_speeches ps ON ps.rede_id = it.item_id
    LEFT JOIN speech_analyses_v2 sa ON sa.rede_id = ps.rede_id
    WHERE it.source='bt_rede' AND it.aw_field = ?
      AND ps.original_text IS NOT NULL AND length(ps.original_text) > 200
      -- Gebündelte Mehr-Redner-Debatten ausschließen: eine rede_id darf nur EINEN
      -- Redner haben, sonst ist die Zuordnung (Partei/Person) nicht eindeutig.
      AND ps.rede_id NOT IN (
        SELECT rede_id FROM plenar_speeches
        WHERE rede_id IS NOT NULL
        GROUP BY rede_id HAVING COUNT(DISTINCT redner_id) > 1
      )
  `).all(feld) as { rede_id: string; party: string; original_text: string; zus: string | null; ford: string | null }[];
  const out: TextCand[] = [];
  for (const r of rows) {
    const p = kanon(r.party);
    if (!p) continue;
    let ford = "";
    try {
      const f = JSON.parse(r.ford || "[]");
      if (Array.isArray(f))
        ford = f
          .slice(0, 4)
          .map((x: any) => (typeof x === "string" ? x : x?.forderung || x?.text || x?.titel || JSON.stringify(x)))
          .join(" | ");
    } catch {
      /* ignore */
    }
    out.push({
      id: `R${r.rede_id}`,
      partei: p,
      text: r.original_text,
      meta: [r.zus, ford].filter(Boolean).join(" — ").slice(0, 600),
      kind: "Rede",
      ref: r.rede_id,
    });
  }
  return out;
}

function getQA(feld: string): TextCand[] {
  const rows = db.prepare(`
    SELECT q.frage_url, q.politician_id, q.frage_text, q.antwort_text,
           pa.label AS partei_name
    FROM aw_question_topics qt
    JOIN aw_tag_themenfeld tf ON tf.label = qt.label
    JOIN aw_questions q ON q.frage_url = qt.frage_url
    JOIN politicians po ON po.id = q.politician_id
    LEFT JOIN parties pa ON pa.id = po.party_id
    WHERE tf.feld = ?
      AND q.antwort_text IS NOT NULL AND length(q.antwort_text) > 120
    GROUP BY q.frage_url
  `).all(feld) as { frage_url: string; politician_id: number; frage_text: string; antwort_text: string; partei_name: string | null }[];
  const out: TextCand[] = [];
  for (const r of rows) {
    const p = kanon(r.partei_name);
    if (!p) continue;
    out.push({
      id: `Q${Buffer.from(r.frage_url).toString("base64").slice(-10)}`,
      partei: p,
      text: r.antwort_text,
      meta: `Frage: ${(r.frage_text || "").slice(0, 160)}`,
      kind: "Q&A",
      ref: r.frage_url,
    });
  }
  return out;
}

function byParty<T extends { partei: Partei }>(items: T[]): Record<Partei, T[]> {
  const m = Object.fromEntries(PARTEIEN.map((p) => [p, [] as T[]])) as Record<Partei, T[]>;
  for (const it of items) m[it.partei].push(it);
  return m;
}

// ── Hauptlauf ──────────────────────────────────────────────────────────────

async function main() {
  const matrix = VERGLEICH_MATRIX[FELD];
  if (!matrix) throw new Error(`Kein Feld in der Matrix: ${FELD}`);
  const aspekte = matrix.aspekte.map((a) => a.label);

  const votes = getVotes(FELD);
  const reden = getReden(FELD);
  const qa = getQA(FELD);

  const votesByDirParty = (p: Partei) =>
    votes.filter((v) => v.richtung[p]).map((v) => ({ ...v, dir: v.richtung[p] }));
  const redenBy = byParty(reden);
  const qaBy = byParty(qa);

  console.log(`\n=== Retrieval „${FELD}" ===`);
  console.log(`Aspekte: ${aspekte.length} | Votes(Feld): ${votes.length} | Reden: ${reden.length} | Q&A: ${qa.length}`);
  for (const p of PARTEIEN) {
    console.log(
      `  ${p.padEnd(8)} Votes ${String(votesByDirParty(p).length).padStart(3)} · Reden ${String(redenBy[p].length).padStart(4)} · Q&A ${String(qaBy[p].length).padStart(4)}`,
    );
  }

  if (DRY) {
    console.log(`\n[dry-run] Kein API-Call. Beispiel-Kandidaten CDU/CSU:`);
    console.log(`  Vote: ${votesByDirParty("CDU/CSU")[0]?.betreff?.slice(0, 90) ?? "—"}`);
    console.log(`  Rede: ${redenBy["CDU/CSU"][0]?.meta?.slice(0, 90) ?? "—"}`);
    console.log(`  Q&A : ${qaBy["CDU/CSU"][0]?.meta?.slice(0, 90) ?? "—"}`);
    db.close();
    return;
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS partei_aspekt_verhalten (
      feld TEXT, aspekt TEXT, partei TEXT,
      abgestimmt_json TEXT,        -- [{vote_id, richtung, betreff}]
      gesagt TEXT,                 -- kurze Position aus Reden/Q&A (oder NULL)
      gesagt_belege_json TEXT,     -- [{zitat, quelle, quelle_id, verifiziert}]
      n_votes INTEGER, n_reden INTEGER, n_qa INTEGER,
      model TEXT, created_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (feld, aspekt, partei)
    )`);
  try {
    db.exec(`ALTER TABLE partei_aspekt_verhalten ADD COLUMN gesagt_punkte_json TEXT`);
  } catch {
    /* Spalte existiert bereits */
  }
  db.prepare(`DELETE FROM partei_aspekt_verhalten WHERE feld = ?`).run(FELD); // sauberer Neuaufbau
  const ins = db.prepare(`
    INSERT OR REPLACE INTO partei_aspekt_verhalten
      (feld, aspekt, partei, abgestimmt_json, gesagt, gesagt_punkte_json, gesagt_belege_json, n_votes, n_reden, n_qa, model)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`);

  const pool = new MistralPool(14500);
  console.log(`\nMistral ${MODEL} · ${pool.size} Key(s) · Map-Reduce-Vollscan (alle Reden)`);

  // Robuster JSON-Chat: 6 Versuche, Steuerzeichen raus, hohe maxTokens.
  // Fängt alle bekannten Synthese-Fehler ab (Truncation, kaputtes JSON, Nicht-Determinismus).
  async function chatJSON(system: string, user: string): Promise<any | null> {
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        const raw = await pool.chat({ model: MODEL, system, user, maxTokens: 8000, temperature: 0.1 });
        const clean = raw
          .replace(/```json|```/g, "")
          .split("")
          .map((c) => (c.charCodeAt(0) < 32 ? " " : c))
          .join("")
          .trim();
        return JSON.parse(clean);
      } catch {
        /* erneut versuchen */
      }
    }
    return null;
  }

  const aspektListe = aspekte.map((a) => `- ${a}`).join("\n");

  // ── Vote → Aspekt: EINMAL fürs ganze Feld (nicht je Partei), damit dieselbe
  //    Vorlage überall demselben Aspekt zugeordnet ist. ──
  const SYS_VOTE =
    "Ordne jede Abstimmung den vorgegebenen Aspekten eines Politikfelds zu (eine Vorlage kann zu mehreren passen). " +
    "STRENGE Treue: nur Aspekte, die die Vorlage im Kern betrifft. " +
    'NUR JSON: {"votes":[{"vote_id":<zahl>,"aspekte":["<exakt ein vorgegebenes Label>", ...]}]}';
  // GECHUNKT (ein einzelner Riesen-Call kippt sonst nicht-deterministisch).
  const voteAspekt = new Map<string, number[]>();
  const VCHUNK = 35;
  for (let i = 0; i < votes.length; i += VCHUNK) {
    const chunk = votes.slice(i, i + VCHUNK);
    const voteUser = [
      `FELD: ${FELD}`, ``, `ASPEKTE:`, aspektListe, ``,
      `ABSTIMMUNGEN (vote_id · Betreff):`,
      ...chunk.map((v) => `[${v.vote_id}] ${v.betreff}`),
    ].join("\n");
    const voteRes = await chatJSON(SYS_VOTE, voteUser);
    for (const v of voteRes?.votes || []) {
      for (const asp of v.aspekte || []) {
        if (!aspekte.includes(asp)) continue;
        const l = voteAspekt.get(asp) ?? [];
        if (!l.includes(v.vote_id)) l.push(v.vote_id);
        voteAspekt.set(asp, l);
      }
    }
  }
  console.log(`  Vote→Aspekt: ${[...voteAspekt.values()].reduce((a, b) => a + b.length, 0)} Zuordnungen`);

  // ── Reden/Q&A: MAP (alle Chunks) + REDUCE je Partei ──
  const SYS_MAP =
    "Du extrahierst aus Bundestags-Material EINER Fraktion ALLE eigenständigen Positionen je vorgegebenem Aspekt. " +
    "Mehrere Punkte pro Aspekt sind erwünscht, wenn es mehrere unterschiedliche Aussagen gibt. " +
    "STRENGE Aspekt-Treue: nur Aussagen, die den Aspekt direkt und im Kern behandeln; keine Steuer-/Anreiz-Aussage " +
    "unter einen Personal-/Sach-Aspekt zwängen; im Zweifel weglassen. Zitate WÖRTLICH aus dem Material. Neutral, keine Wertung. " +
    'NUR JSON: {"aspekte":[{"aspekt":"<exakt ein Label>","punkte":[{"punkt":"<knapp, ohne Subjekt, max ~12 Woerter>","quelle_id":"<R… oder Q… aus dem Material>","zitat":"<woertlich>"}]}]}';
  const SYS_RED =
    "Dir werden je Aspekt KANDIDATEN-Punkte EINER Fraktion gegeben (jeweils mit quelle_id in eckigen Klammern). " +
    "Fuehre inhaltsgleiche/sehr aehnliche Punkte zusammen. Behalte je Aspekt bis zu 4 EIGENSTAENDIGE Punkte, jeweils mit " +
    "ALLEN stuetzenden quelle_ids. Knapp, ohne Subjekt, neutral. Erfinde nichts dazu, nutze nur die gegebenen Punkte/IDs. " +
    'NUR JSON: {"aspekte":[{"aspekt":"<Label>","punkte":[{"punkt":"<knapp>","quelle_ids":["R…", ...]}]}]}';

  const CHUNK = 40;
  let done = 0;
  for (const partei of PARTEIEN) {
    const pVotes = votesByDirParty(partei);
    const pReden = redenBy[partei]; // ALLE Reden (Vollabdeckung, kein Cap)
    const pQA = qaBy[partei].slice(0, QA_CAP); // Q&A bleibt Stichprobe (schwaechste Schicht)
    const material = [...pReden, ...pQA];
    if (!pVotes.length && !material.length) {
      console.log(`  – ${partei}: kein Material`);
      continue;
    }
    const srcMap = new Map<string, { kind: "Rede" | "Q&A"; ref: string; text: string }>();
    for (const m of material) srcMap.set(m.id, { kind: m.kind, ref: m.ref, text: m.text });

    // MAP: alle Chunks scannen (ein gescheiterter Chunk stoppt den Lauf NICHT)
    const zitatById = new Map<string, string>();
    const candByAspekt = new Map<string, { punkt: string; quelle_id: string }[]>();
    const chunks: (typeof material)[] = [];
    for (let i = 0; i < material.length; i += CHUNK) chunks.push(material.slice(i, i + CHUNK));
    let mapOk = 0;
    for (const chunk of chunks) {
      const u = [
        `FELD: ${FELD}`, `FRAKTION: ${partei}`, ``,
        `ASPEKTE (genau diese Labels):`, aspektListe, ``,
        `MATERIAL (quelle_id · Art · Kurzfassung):`,
        ...chunk.map((m) => `[${m.id}] (${m.kind}) ${m.meta}`),
      ].join("\n");
      const r = await chatJSON(SYS_MAP, u);
      if (!r) continue;
      mapOk++;
      for (const a of r.aspekte || []) {
        if (!aspekte.includes(a.aspekt)) continue;
        const l = candByAspekt.get(a.aspekt) ?? [];
        for (const p of a.punkte || []) {
          if (!p?.punkt || !srcMap.has(p.quelle_id)) continue; // unbekannte ID verwerfen
          if (p.zitat && !zitatById.has(p.quelle_id)) zitatById.set(p.quelle_id, String(p.zitat));
          l.push({ punkt: String(p.punkt), quelle_id: p.quelle_id });
        }
        candByAspekt.set(a.aspekt, l);
      }
    }

    // REDUCE je Partei; Fallback ohne LLM, falls Reduce scheitert
    const reduced = new Map<string, { punkt: string; quelle_ids: string[] }[]>();
    if (candByAspekt.size) {
      const u = [
        `FRAKTION: ${partei}`, ``,
        ...[...candByAspekt.entries()].flatMap(([asp, l]) => [
          `ASPEKT: ${asp}`, ...l.map((c) => `  - ${c.punkt} [${c.quelle_id}]`), ``,
        ]),
      ].join("\n");
      const red = await chatJSON(SYS_RED, u);
      if (red?.aspekte) {
        for (const a of red.aspekte) {
          if (!aspekte.includes(a.aspekt)) continue;
          const pts = (a.punkte || [])
            .map((p: any) => ({
              punkt: String(p.punkt || ""),
              quelle_ids: (p.quelle_ids || []).filter((id: string) => srcMap.has(id)),
            }))
            .filter((p: any) => p.punkt && p.quelle_ids.length);
          if (pts.length) reduced.set(a.aspekt, pts);
        }
      }
      if (!reduced.size) {
        for (const [asp, l] of candByAspekt) {
          const pts: { punkt: string; quelle_ids: string[] }[] = [];
          for (const c of l) {
            const ex = pts.find((p) => norm(p.punkt) === norm(c.punkt));
            if (ex) { if (!ex.quelle_ids.includes(c.quelle_id)) ex.quelle_ids.push(c.quelle_id); }
            else if (pts.length < 4) pts.push({ punkt: c.punkt, quelle_ids: [c.quelle_id] });
          }
          if (pts.length) reduced.set(asp, pts);
        }
      }
    }

    // Speichern je Aspekt
    let zellen = 0;
    for (const aspekt of aspekte) {
      const pts = reduced.get(aspekt) || [];
      const belMap = new Map<string, any>();
      for (const p of pts)
        for (const id of p.quelle_ids) {
          const s = srcMap.get(id);
          if (!s || belMap.has(s.ref)) continue;
          const z = zitatById.get(id) || "";
          belMap.set(s.ref, {
            zitat: z, quelle: s.kind, quelle_id: s.ref,
            verifiziert: !!z && norm(s.text).includes(norm(z)),
          });
        }
      const belege = [...belMap.values()];
      const abg = (voteAspekt.get(aspekt) || [])
        .map((id) => pVotes.find((v) => v.vote_id === id))
        .filter(Boolean)
        .map((v: any) => ({ vote_id: v.vote_id, richtung: v.dir, betreff: v.betreff }));
      // Punkte MIT ihren Quell-Refs speichern (rede_id/frage_url), damit pro Punkt
      // EINE Referenz auf ALLE seine Reden gezeigt werden kann.
      const punkteObj = pts.map((p) => ({
        punkt: p.punkt,
        refs: [...new Set(p.quelle_ids.map((id) => srcMap.get(id)?.ref).filter(Boolean))],
      }));
      const punkte = punkteObj.map((p) => p.punkt);
      if (!abg.length && !punkte.length) continue;
      ins.run(
        FELD, aspekt, partei,
        JSON.stringify(abg), punkte.join(" / ") || null, JSON.stringify(punkteObj), JSON.stringify(belege),
        abg.length, pReden.length, pQA.length, MODEL,
      );
      if (punkte.length) zellen++;
    }
    console.log(`  ✓ ${partei.padEnd(8)} Reden ${String(pReden.length).padStart(4)} (alle) · Chunks ${mapOk}/${chunks.length} · Aspekt-Zellen ${zellen}`);
    done++;
  }

  console.log(`\n=== fertig: ${done}/${PARTEIEN.length} Parteien für „${FELD}" ===`);
  db.close();
}

main();
