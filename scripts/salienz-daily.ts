/**
 * 6h-Orchestrator: News holen → ranken → zusammenfassen → Ranking per E-Mail.
 * Jede Stufe gekapselt (eine kaputte Quelle bricht den Lauf NICHT ab). €0.
 * Lauf:  npx tsx scripts/salienz-daily.ts
 * Per systemd-Timer alle 6h (siehe ~/.config/systemd/user/salienz-daily.timer).
 */
import { execSync } from "child_process";
import Database from "better-sqlite3";
import path from "path";
import { sendMail } from "./_lib/mailer";
import { gleicheStory } from "./_lib/text-sim";

// .env in process.env laden (Node 20.12+), damit SMTP_*/MISTRAL_* verfügbar sind.
try { process.loadEnvFile(path.join(process.cwd(), ".env")); } catch { /* .env optional */ }

const RUN_DATE = new Date().toISOString().slice(0, 10);
const PICKER_URL = process.env.PICKER_URL || "http://192.168.178.170:3001/entwurf/picker";

function step(name: string, cmd: string): void {
  try {
    console.log(`\n▸ ${name}`);
    execSync(cmd, { stdio: "inherit", cwd: process.cwd() });
  } catch (e: unknown) {
    console.error(`✗ Stufe "${name}" fehlgeschlagen (übersprungen): ${(e as Error).message}`);
  }
}

type NeuerThread = { threadId: string; leitthema: string; themenfeld: string };

type NeuerBericht = { id: number; kommission: string; titel: string; typ: string | null; datum: string | null; url: string };

/** Noch nicht gemailte Kommissionsberichte (Scraper/News-Quelle), die letzten 90 Tage. */
function neueKommissionsberichte(): NeuerBericht[] {
  const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
  try {
    const rows = db.prepare(`
      SELECT b.id, b.titel, b.typ, b.datum, b.url, k.name AS kommission
      FROM kommission_bericht b JOIN kommission k ON k.slug = b.kommission_slug
      WHERE b.gemailt_am IS NULL
        AND b.quelle IN ('scrape','news')
        AND (b.datum IS NULL OR b.datum >= date('now','-90 day'))
      ORDER BY (b.datum IS NULL), b.datum DESC, b.id DESC
    `).all() as { id: number; titel: string | null; typ: string | null; datum: string | null; url: string; kommission: string }[];
    return rows.map((r) => ({ id: r.id, kommission: r.kommission, titel: r.titel ?? "Dokument", typ: r.typ, datum: r.datum, url: r.url }));
  } catch { return []; } finally { db.close(); }
}

function buildMail(): { subject: string; text: string; neueThreads: NeuerThread[]; neueBerichte: NeuerBericht[] } {
  const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
  const felder = db.prepare(
    `SELECT themenfeld, news_outlet_count AS oc, summary FROM salienz_themen
     WHERE run_date=? AND news_outlet_count>0 ORDER BY rang LIMIT 8`
  ).all(RUN_DATE) as { themenfeld: string; oc: number; summary: string | null }[];
  // Top-Cluster je Feld + sein Strang (Ebene 2) + wie lange er schon läuft.
  const clStmt = db.prepare(`
    SELECT c.leitthema, c.outlets_json, c.thread_id, s.streak_days
    FROM news_cluster c LEFT JOIN salienz_story s ON s.thread_id = c.thread_id
    WHERE c.run_date=? AND c.themenfeld=? ORDER BY c.outlet_count DESC LIMIT 1`);
  // Welche Stränge gingen schon einmal per Mail raus? Alles andere ist NEU für den Empfänger.
  // ZWEI Tore, damit dieselbe Story nicht mehrfach als „neu" gilt: (1) thread_id schon gesendet?
  // (2) inhaltlich — Leitthema fuzzy gleich einer bereits gesendeten Story? (fängt ab, dass die
  //     cluster_id/thread_id eines HEUTE neuen Strangs sich zwischen den 6h-Läufen ändert.)
  let gesendetIds = new Set<string>();
  let gesendetLeit: { leitthema: string; themenfeld: string }[] = [];
  try {
    const rows = db.prepare(`SELECT thread_id, leitthema, themenfeld FROM salienz_mail_sent`).all() as { thread_id: string; leitthema: string | null; themenfeld: string | null }[];
    gesendetIds = new Set(rows.map((r) => r.thread_id));
    gesendetLeit = rows.filter((r) => r.leitthema).map((r) => ({ leitthema: r.leitthema!, themenfeld: r.themenfeld ?? "" }));
  } catch { /* Tabelle fehlt noch */ }

  type Zeile = { feld: string; oc: number; summary: string | null; leitthema: string | null; outlets: string[]; threadId: string | null; streak: number | null; neu: boolean };
  const zeilen: Zeile[] = felder.map((f) => {
    const cl = clStmt.get(RUN_DATE, f.themenfeld) as { leitthema: string; outlets_json: string; thread_id: string | null; streak_days: number | null } | undefined;
    let outlets: string[] = []; try { outlets = JSON.parse(cl?.outlets_json || "[]"); } catch { /* */ }
    const threadId = cl?.thread_id ?? null;
    const lt = cl?.leitthema ?? null;
    // NEU = Strang noch nie gesendet UND keine gesendete Story IM SELBEN FELD mit gleichem Leitthema
    // (Feld-Gate verhindert Cross-Field-Bleed, z.B. „Rente" im Koalitions-Cluster ≠ Rentenreform).
    const inhaltlichSchon = !!lt && gesendetLeit.some((g) => g.themenfeld === f.themenfeld && gleicheStory(lt, g.leitthema));
    const neu = !!threadId && !gesendetIds.has(threadId) && !inhaltlichSchon;
    return { feld: f.themenfeld, oc: f.oc, summary: f.summary, leitthema: lt, outlets, threadId, streak: cl?.streak_days ?? null, neu };
  });
  db.close();

  const neueThreads: NeuerThread[] = zeilen.filter((z) => z.neu && z.threadId).map((z) => ({ threadId: z.threadId!, leitthema: z.leitthema ?? z.feld, themenfeld: z.feld }));

  const lines: string[] = [];
  // AUFFÄLLIGER Block ganz oben: nur das, was der Empfänger noch nicht gesehen hat.
  if (neueThreads.length) {
    lines.push("════════════════════════════════════════");
    lines.push(`🆕🆕  ${neueThreads.length} NEUE${neueThreads.length === 1 ? "S THEMA" : " THEMEN"} seit der letzten Mail`);
    lines.push("════════════════════════════════════════");
    zeilen.filter((z) => z.neu).forEach((z) => lines.push(`  🔴 ${z.feld} — ${z.leitthema ?? "—"} (${z.oc} Outlets)`));
    lines.push("");
    lines.push("");
  }

  // Neue Kommissionsberichte (Scraper/News) — direkt unter den neuen Themen, vor dem Ranking.
  const neueBerichte = neueKommissionsberichte();
  const berichteLines: string[] = [];
  if (neueBerichte.length) {
    berichteLines.push("════════════════════════════════════════");
    berichteLines.push(`🆕  ${neueBerichte.length} NEUER KOMMISSIONSBERICHT${neueBerichte.length === 1 ? "" : "E"}`);
    berichteLines.push("════════════════════════════════════════");
    neueBerichte.forEach((b) => {
      berichteLines.push(`  📄 ${b.kommission} — ${b.titel}${b.typ ? ` [${b.typ}]` : ""}${b.datum ? `  (${b.datum})` : ""}`);
      berichteLines.push(`     ${b.url}`);
    });
    berichteLines.push("");
    berichteLines.push("");
    lines.push(...berichteLines);
  }

  lines.push("Top-Themen (Cross-Outlet, letzte 24h):");
  lines.push("");
  zeilen.forEach((z, i) => {
    const flag = z.neu ? "🆕 NEU  " : "";
    const dauer = z.streak && z.streak > 1 ? `  ·  🔥 seit ${z.streak} Tagen` : "";
    lines.push(`${flag}${i + 1}. ${z.feld} — ${z.oc} Outlets${dauer}`);
    if (z.leitthema) lines.push(`   ${z.leitthema}`);
    if (z.summary) lines.push(`   ${z.summary}`);
    if (z.outlets.length) lines.push(`   → ${z.outlets.join(" · ")}`);
    lines.push("");
  });

  const stamp = new Date().toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  // Betreff trägt das Neue nach vorn — in der Inbox-Liste sofort sichtbar, ohne zu öffnen.
  const neuPrefix = neueThreads.length ? `🆕 ${neueThreads.length} NEU · ` : "";
  const komPrefix = neueBerichte.length ? `📄 ${neueBerichte.length} Bericht · ` : "";
  const subject = felder.length ? `${komPrefix}${neuPrefix}Politik-Aufmacher · ${felder[0].themenfeld} (${stamp})` : `${komPrefix}Politik-Aufmacher · Ranking ${stamp}`;
  // Berichte-Block auch zeigen, wenn es sonst keine Cross-Outlet-Story gibt.
  const text = felder.length
    ? `${lines.join("\n")}\nAufmacher wählen → ${PICKER_URL}\n`
    : `${berichteLines.length ? berichteLines.join("\n") + "\n" : ""}Heute keine markante Cross-Outlet-Story (Stand ${stamp}).\n\nPicker → ${PICKER_URL}\n`;
  return { subject, text, neueThreads, neueBerichte };
}

/** Erst NACH erfolgreichem Versand: gemailte Stränge merken, damit sie nächste Mail nicht erneut als „neu" gelten. */
function markiereGesendet(threads: NeuerThread[]): void {
  if (!threads.length) return;
  const db = new Database(path.join(process.cwd(), "politik.db"));
  db.pragma("busy_timeout = 15000");
  const ins = db.prepare(`INSERT OR IGNORE INTO salienz_mail_sent (thread_id, leitthema, themenfeld) VALUES (?, ?, ?)`);
  const tx = db.transaction(() => { for (const t of threads) ins.run(t.threadId, t.leitthema, t.themenfeld); });
  tx();
  db.close();
}

/** Erst NACH erfolgreichem Versand: gemailte Berichte markieren, damit sie nächste Mail nicht erneut auflistet. */
function markiereBerichteGesendet(berichte: NeuerBericht[]): void {
  if (!berichte.length) return;
  const db = new Database(path.join(process.cwd(), "politik.db"));
  db.pragma("busy_timeout = 15000");
  const upd = db.prepare(`UPDATE kommission_bericht SET gemailt_am = datetime('now') WHERE id = ?`);
  db.transaction(() => { for (const b of berichte) upd.run(b.id); })();
  db.close();
}

async function main() {
  // Vorschau ohne Versand/Markierung: nur Mail bauen & ausgeben (Format prüfen).
  if (process.argv.includes("--dry-mail")) {
    const { subject, text, neueThreads, neueBerichte } = buildMail();
    console.log(`Betreff: ${subject}\n(${neueThreads.length} neu, ${neueBerichte.length} Berichte)\n\n${text}`);
    return;
  }

  step("News-RSS", "npx tsx scripts/fetch-news-rss.ts");
  step("Twitter-Trends", "npx tsx scripts/fetch-twitter-trends.ts"); // Social-Spalte (trends24 ∩ getdaytrends, €0)
  step("Kommissionen", "npx tsx scripts/fetch-kommissionen.ts"); // Kommissions-Tracker: Berichte-Polling + News-Signal (€0, deterministisch)
  step("Ranking", "npx tsx scripts/rank-news-salienz.ts");
  step("Story-Stränge", "npx tsx scripts/salienz-thread-stories.ts"); // Ebene 2: Tage-übergreifend (€0, deterministisch)
  step("Summaries", "npx tsx scripts/salienz-cluster-summary.ts");
  step("Anker-Vorschläge", "npx tsx scripts/salienz-anker.ts"); // DS/Vote je Cluster (FTS-Kandidaten + Mistral bounded choice, €0) — nur Picker-VORSCHLAG
  step("Fraktions-PMs", "npx tsx scripts/fetch-fraktions-pm.ts"); // Erstquelle „was die Fraktionen sagen" (5 Fraktionen, €0, deterministisch)
  step("Haushalt-2027-Wächter", "npx tsx scripts/check-haushalt-2027.ts"); // einmalige Mail, sobald der Regierungsentwurf ingestierbar ist (DIP/bundeshaushalt.de); löschen nach Ingestion

  // Mail nur 1×/Tag (User-Wunsch 07.07.): nur der 06:30-Lauf mailt (Maschine
  // läuft auf UTC → 08:30 Berlin im Sommer), die übrigen Timer-Läufe halten
  // nur die Daten frisch (Picker). Die Neu-Markierung bleibt versandgebunden —
  // was tagsüber aufläuft, steht morgens gesammelt als NEU in der einen Mail.
  // `--mail` erzwingt den Versand (für manuelle Läufe).
  if (!process.argv.includes("--mail") && new Date().getUTCHours() !== 6) {
    console.log("\n○ Kein Mail-Lauf (mailt nur im 06:30-UTC-Slot; --mail erzwingt) — Daten sind aktualisiert.");
    return;
  }

  const { subject, text, neueThreads, neueBerichte } = buildMail();
  const r = await sendMail(subject, text);
  if (r.sent) {
    markiereGesendet(neueThreads); // NUR bei Erfolg: sonst gälte das Neue beim Fehlversuch fälschlich als „gesehen"
    markiereBerichteGesendet(neueBerichte); // dito für Kommissionsberichte
    console.log(`\n✓ E-Mail versendet (${neueThreads.length} neu, ${neueBerichte.length} Berichte): ${subject}`);
  } else {
    console.log(`\n⚠ ${r.reason} — Mail übersprungen (Stränge NICHT als gesendet markiert). VORSCHAU:\n`);
    console.log(`Betreff: ${subject}\n`);
    console.log(text);
  }
}
main();
