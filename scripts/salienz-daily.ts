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

function buildMail(): { subject: string; text: string } {
  const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });
  const felder = db.prepare(
    `SELECT themenfeld, news_outlet_count AS oc, summary FROM salienz_themen
     WHERE run_date=? AND news_outlet_count>0 ORDER BY rang LIMIT 8`
  ).all(RUN_DATE) as { themenfeld: string; oc: number; summary: string | null }[];
  const clStmt = db.prepare(
    `SELECT leitthema, outlets_json FROM news_cluster WHERE run_date=? AND themenfeld=? ORDER BY outlet_count DESC LIMIT 1`
  );

  const lines: string[] = [];
  felder.forEach((f, i) => {
    const cl = clStmt.get(RUN_DATE, f.themenfeld) as { leitthema: string; outlets_json: string } | undefined;
    lines.push(`${i + 1}. ${f.themenfeld} — ${f.oc} Outlets`);
    if (cl) lines.push(`   ${cl.leitthema}`);
    if (f.summary) lines.push(`   ${f.summary}`);
    if (cl) { let o: string[] = []; try { o = JSON.parse(cl.outlets_json || "[]"); } catch { /* */ } if (o.length) lines.push(`   → ${o.join(" · ")}`); }
    lines.push("");
  });
  db.close();

  const stamp = new Date().toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" });
  const subject = felder.length ? `Politik-Aufmacher · ${felder[0].themenfeld} (${stamp})` : `Politik-Aufmacher · Ranking ${stamp}`;
  const text = felder.length
    ? `Top-Themen (Cross-Outlet, letzte 24h):\n\n${lines.join("\n")}\nAufmacher wählen → ${PICKER_URL}\n`
    : `Heute keine markante Cross-Outlet-Story (Stand ${stamp}).\n\nPicker → ${PICKER_URL}\n`;
  return { subject, text };
}

async function main() {
  step("News-RSS", "npx tsx scripts/fetch-news-rss.ts");
  // step("Twitter-Trends", "npx tsx scripts/fetch-twitter-trends.ts"); // Social-Spalte (folgt)
  step("Ranking", "npx tsx scripts/rank-news-salienz.ts");
  step("Summaries", "npx tsx scripts/salienz-cluster-summary.ts");

  const { subject, text } = buildMail();
  const r = await sendMail(subject, text);
  if (r.sent) {
    console.log(`\n✓ E-Mail versendet: ${subject}`);
  } else {
    console.log(`\n⚠ ${r.reason} — Mail übersprungen. VORSCHAU:\n`);
    console.log(`Betreff: ${subject}\n`);
    console.log(text);
  }
}
main();
