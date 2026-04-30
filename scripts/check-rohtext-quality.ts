/**
 * Geht alle Rohtext-Felder durch und flagt verdächtige Texte als
 * kaputt / falsch gescraped. Schreibt Bericht nach rohtext-quality-report.md.
 *
 * Run: npx tsx scripts/check-rohtext-quality.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");

interface Issue {
  pattern: string;
  severity: "kaputt" | "verdacht";
  reason: string;
}

/**
 * Heuristiken für defekte Rohtexte. Kombiniert mehrere Signale —
 * ein einzelner Cookie-Hinweis ist OK, aber ein Text der zu 70% aus
 * Cookie-Boilerplate besteht ist kaputt.
 */
function classifyText(text: string | null, source: string): Issue[] {
  if (!text) return [];
  const issues: Issue[] = [];
  const len = text.length;

  // 1. Encoding-Salat
  if (/�/.test(text)) {
    const replCount = (text.match(/�/g) || []).length;
    if (replCount > 3) {
      issues.push({ pattern: "encoding", severity: "kaputt", reason: `${replCount}× Replacement-Char (Encoding-Bug)` });
    }
  }

  // 2. JavaScript-Template-Reste (Angular/Vue Mustache)
  if (/\{\{\s*[a-z][a-z0-9_$.\[\]'\s]+\s*\}\}/i.test(text)) {
    const tmplCount = (text.match(/\{\{[^}]+\}\}/g) || []).length;
    if (tmplCount >= 2) {
      issues.push({ pattern: "js-templates", severity: "kaputt", reason: `${tmplCount}× JS-Template-Variable {{...}}` });
    }
  }

  // 3. Cookie-Banner-Dominanz: hoher Anteil Cookie-Wörter
  const cookieWords = (text.match(/\b(Cookie|cookies|Datenschutz|JavaScript|GDPR|Einstellungen|Zustimmen|Ablehnen)\b/g) || []).length;
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 0 && cookieWords / wordCount > 0.04 && len < 1500) {
    issues.push({ pattern: "cookie-dominant", severity: "kaputt", reason: `${cookieWords} Cookie-Wörter bei nur ${wordCount} Wörtern (${len} chars)` });
  }

  // 4. Twitter/Social-Feed (viele RTs, @-Mentions)
  const rtCount = (text.match(/\bRT @|RT@/g) || []).length;
  if (rtCount >= 3) {
    issues.push({ pattern: "social-feed", severity: "kaputt", reason: `${rtCount}× "RT @" — Twitter-Feed statt Bio` });
  }

  // 5. Sehr kurz + reine Navigations-/UI-Texte
  if (len < 600) {
    const navWords = (text.match(/\b(Suchbegriff|Suche|Anmelden|Login|Anmeldung|Veranstaltungen anzeigen|Mehr erfahren)\b/gi) || []).length;
    if (navWords >= 2) {
      issues.push({ pattern: "navigation-only", severity: "kaputt", reason: `nur ${len} chars, ${navWords}× UI-Navigations-Wörter` });
    }
  }

  // 6. Wartungsseiten / 404
  if (/\b(404|Not Found|Wartungsmodus|Site offline|Diese Seite existiert nicht|Page not found)\b/i.test(text)) {
    if (len < 800) {
      issues.push({ pattern: "error-page", severity: "kaputt", reason: "404/Wartung-Indikator + Text < 800 chars" });
    }
  }

  // 7. Sehr kurz UND keine biografischen Schlüsselwörter
  if (len < 500 && source === "cv_homepage_text") {
    const bioWords = (text.match(/\b(geboren|Geburt|studier|Beruf|Abitur|Studium|Mitglied|MdB|verheirat|Familie|Kinder)\b/gi) || []).length;
    if (bioWords === 0) {
      issues.push({ pattern: "no-bio-keywords", severity: "verdacht", reason: `${len} chars, keine Bio-Schlüsselwörter` });
    }
  }

  return issues;
}

interface RowFlat {
  id: number;
  name: string;
  source: string;
  length: number;
  issues: Issue[];
  preview: string;
}

function checkSources(): RowFlat[] {
  const db = new Database(DB_PATH);
  const rows = db
    .prepare(
      `SELECT id, first_name || ' ' || last_name AS name,
              cv_homepage_text, bio_full_text, bundestag_bio_text, bundesregierung_bio_text
       FROM politicians
       WHERE id BETWEEN 900001 AND 900011
          OR id IN (SELECT DISTINCT politician_id FROM mandates m
            JOIN parliament_periods pp ON m.parliament_period_id = pp.id
            JOIN parliaments par ON pp.parliament_id = par.id
            WHERE par.type = 'bundestag')`
    )
    .all() as {
      id: number;
      name: string;
      cv_homepage_text: string | null;
      bio_full_text: string | null;
      bundestag_bio_text: string | null;
      bundesregierung_bio_text: string | null;
    }[];

  const flat: RowFlat[] = [];
  for (const r of rows) {
    const sources = [
      { col: "cv_homepage_text", val: r.cv_homepage_text },
      { col: "bio_full_text", val: r.bio_full_text },
      { col: "bundestag_bio_text", val: r.bundestag_bio_text },
      { col: "bundesregierung_bio_text", val: r.bundesregierung_bio_text },
    ];
    for (const s of sources) {
      if (!s.val) continue;
      const issues = classifyText(s.val, s.col);
      if (issues.length === 0) continue;
      flat.push({
        id: r.id,
        name: r.name,
        source: s.col,
        length: s.val.length,
        issues,
        preview: s.val.slice(0, 250).replace(/\s+/g, " "),
      });
    }
  }
  db.close();
  return flat;
}

function main() {
  const issues = checkSources();

  // Sortieren: kaputt zuerst, dann verdacht
  issues.sort((a, b) => {
    const severityOrder = (i: Issue[]) => i.some((x) => x.severity === "kaputt") ? 0 : 1;
    return severityOrder(a.issues) - severityOrder(b.issues);
  });

  const kaputt = issues.filter((i) => i.issues.some((x) => x.severity === "kaputt"));
  const verdacht = issues.filter((i) => i.issues.every((x) => x.severity === "verdacht"));

  // Stats nach Quelle + Schwere
  const bySource = new Map<string, { kaputt: number; verdacht: number }>();
  for (const i of issues) {
    if (!bySource.has(i.source)) bySource.set(i.source, { kaputt: 0, verdacht: 0 });
    const s = bySource.get(i.source)!;
    if (i.issues.some((x) => x.severity === "kaputt")) s.kaputt++;
    else s.verdacht++;
  }

  // Bericht schreiben
  const lines: string[] = [];
  lines.push(`# Rohtext-Qualitäts-Bericht`);
  lines.push(`Stand: ${new Date().toISOString().slice(0, 10)}\n`);

  lines.push(`## Übersicht\n`);
  lines.push(`| Quelle | Kaputt | Verdacht |`);
  lines.push(`|---|---:|---:|`);
  for (const [src, s] of bySource.entries()) {
    lines.push(`| ${src} | ${s.kaputt} | ${s.verdacht} |`);
  }
  lines.push(`| **Total** | **${kaputt.length}** | **${verdacht.length}** |\n`);

  lines.push(`## 🔴 KAPUTT — sollten neu gefetcht werden\n`);
  for (const i of kaputt) {
    lines.push(`### ${i.name} (id ${i.id}) · \`${i.source}\` · ${i.length} chars`);
    for (const issue of i.issues) {
      const icon = issue.severity === "kaputt" ? "🔴" : "🟡";
      lines.push(`- ${icon} **${issue.pattern}**: ${issue.reason}`);
    }
    lines.push(`> ${i.preview}…\n`);
  }

  lines.push(`## 🟡 VERDACHT — manuell prüfen\n`);
  for (const i of verdacht) {
    lines.push(`### ${i.name} (id ${i.id}) · \`${i.source}\` · ${i.length} chars`);
    for (const issue of i.issues) {
      lines.push(`- 🟡 **${issue.pattern}**: ${issue.reason}`);
    }
    lines.push(`> ${i.preview}…\n`);
  }

  fs.writeFileSync("rohtext-quality-report.md", lines.join("\n"), "utf-8");

  console.log(`\n=== Rohtext-Qualitäts-Check ===`);
  console.log(`  🔴 Kaputt:   ${kaputt.length}`);
  console.log(`  🟡 Verdacht: ${verdacht.length}`);
  console.log();
  console.log(`Pro Quelle:`);
  for (const [src, s] of bySource.entries()) {
    console.log(`  ${src.padEnd(28)} kaputt=${s.kaputt}  verdacht=${s.verdacht}`);
  }
  console.log(`\nBericht: rohtext-quality-report.md`);
}

main();
