/**
 * Schließt einen unterbrochenen/flaky Lauf von verify-berlin-homepage-candidates.ts ab:
 * liest das vorhandene verify-berlin-homepage-candidates.jsonl, prüft nur die NOCH
 * NICHT eindeutig bestätigten Kandidaten (alles außer "STARK") erneut — mit längerem
 * Timeout, mehreren Retries und einem zweiten User-Agent gegen 403-Blocker — und
 * aktualisiert die betroffenen Zeilen in-place. Schreibt NICHT in die DB.
 *
 * Run: npx tsx scripts/finish-berlin-homepage-verify.ts [--all]
 *   --all  auch bereits STARK-bewertete erneut prüfen (Default: nur ungelöste)
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const OUT = path.join(process.cwd(), "verify-berlin-homepage-candidates.jsonl");
const RECHECK_ALL = process.argv.includes("--all");

// Zwei UAs: normaler Chrome + Googlebot (manche Seiten lassen nur Bots/whitelisted UAs durch).
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
];
const TIMEOUT_MS = 20000;

const PARTY_TOKENS: Record<string, string[]> = {
  cdu: ["cdu"],
  spd: ["spd", "sozialdemokrat"],
  afd: ["afd", "alternative für deutschland"],
  fdp: ["fdp", "freie demokrat"],
  bsw: ["bsw", "bündnis sahra wagenknecht"],
  grüne: ["grüne", "grünen", "bündnis 90"],
  linke: ["linke", "linkspartei"],
};
function partyTokens(party: string): string[] {
  const p = (party || "").toLowerCase();
  if (p.includes("grün") || p.includes("bündnis 90")) return PARTY_TOKENS.grüne;
  if (p.includes("linke")) return PARTY_TOKENS.linke;
  for (const k of ["cdu", "spd", "afd", "fdp", "bsw"]) if (p.startsWith(k)) return PARTY_TOKENS[k];
  return [];
}
const POLITIK_SIGNALS = [
  "abgeordnetenhaus", "abgeordnete", "mitglied des abgeordnetenhauses", "mda",
  "fraktion", "wahlkreis", "berlin", "politik", "mandat", "parlament", "ausschuss",
];

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}
function nameVariants(lastName: string): string[] {
  const lo = (lastName || "").toLowerCase();
  const v = new Set<string>([lo]);
  v.add(lo.replace(/ß/g, "ss"));
  v.add(lo.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss"));
  v.add(lo.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss"));
  if (lo.includes("-")) v.add(lo.split("-")[0]);
  return [...v].filter((s) => s.length >= 3);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchOnce(url: string, ua: string, timeout: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal, redirect: "follow",
      headers: {
        "User-Agent": ua,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
      },
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, status: res.status, text: htmlToText(await res.text()), finalUrl: res.url };
  } catch {
    return { ok: false, status: 0 };
  } finally {
    clearTimeout(t);
  }
}

// Mehrere Strategien: 2 Versuche mit Chrome-UA, dann 1 Versuch mit Googlebot-UA.
async function fetchRobust(url: string) {
  let r = await fetchOnce(url, UAS[0], TIMEOUT_MS);
  if (!r.ok && r.status === 0) { await sleep(1200); r = await fetchOnce(url, UAS[0], TIMEOUT_MS); }
  if (!r.ok) { await sleep(800); const r2 = await fetchOnce(url, UAS[1], TIMEOUT_MS); if (r2.ok) return r2; if (r.status === 0 && r2.status !== 0) r = r2; }
  return r;
}

function verdictFor(r: any, party: string, lastName: string, text: string) {
  const pTokens = partyTokens(party);
  const partyHit = pTokens.find((t) => text.includes(t)) ?? null;
  const variants = nameVariants(lastName);
  const nameHit = variants.some((v) => text.includes(v));
  const politikHits = POLITIK_SIGNALS.filter((s) => text.includes(s));
  const berlinHit = text.includes("berlin");
  const aghHit = text.includes("abgeordnetenhaus") || text.includes("mitglied des abgeordnetenhauses");
  let verdict: string;
  if (!r.ok) verdict = r.status === 403 || r.status === 401 || r.status === 406
    ? "BLOCKT (existiert)" : r.status === 0 ? "TOT/Timeout" : `HTTP ${r.status}`;
  else if (nameHit && (partyHit || aghHit)) verdict = "STARK";
  else if (nameHit && (berlinHit || politikHits.length >= 2)) verdict = "MITTEL";
  else if (partyHit && aghHit) verdict = "STARK (ohne Namensvar.)";
  else if (nameHit) verdict = "SCHWACH (nur Name)";
  else verdict = "KEIN NAME";
  return { verdict, partyHit, nameHit, aghHit, berlinHit, politikHits };
}

(async () => {
  if (!fs.existsSync(OUT)) { console.error(`Fehlt: ${OUT}`); process.exit(1); }
  const rows: any[] = fs.readFileSync(OUT, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
  const db = new Database(DB_PATH, { readonly: true });
  const lastNameOf = db.prepare(`SELECT last_name FROM politicians WHERE id = ?`);

  const isResolved = (v: string) => v === "STARK" || v === "STARK (ohne Namensvar.)" || v === "MITTEL";
  const todo = rows.filter((r) => RECHECK_ALL || !isResolved(r.verdict));
  console.log(`${rows.length} Zeilen gesamt, ${todo.length} werden (erneut) geprüft...\n`);

  let changed = 0;
  for (const r of todo) {
    const ln = (r.id ? (lastNameOf.get(r.id) as any)?.last_name : null) ?? r.name.split(" ").slice(-1)[0];
    const before = r.verdict;
    const res = await fetchRobust(r.url);
    const text = res.text ?? "";
    const v = verdictFor(res, r.party, ln, text);
    r.verdict = v.verdict; r.partyHit = v.partyHit; r.nameHit = v.nameHit;
    r.aghHit = v.aghHit; r.berlinHit = v.berlinHit; r.politikHits = v.politikHits;
    r.status = res.status; r.finalUrl = res.finalUrl ?? r.finalUrl;
    const mark = before !== r.verdict ? `  ⟶ war: ${before}` : "";
    if (before !== r.verdict) changed++;
    console.log(`  ${r.verdict.padEnd(20)} ${r.name.padEnd(26)} ${r.party.slice(0,7).padEnd(8)} ${r.url}${mark}`);
    await sleep(500);
  }

  fs.writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");
  const by = (v: string) => rows.filter((r) => r.verdict === v).length;
  console.log(
    `\n── Endstand (${rows.length} Kandidaten, ${changed} Zeilen geändert) ──\n` +
      `  STARK (Partei/AGH + Name):      ${by("STARK")}\n` +
      `  STARK (ohne Namensvariante):    ${by("STARK (ohne Namensvar.)")}\n` +
      `  MITTEL (Name + Berlin/Pol):     ${by("MITTEL")}\n` +
      `  SCHWACH (nur Name):             ${by("SCHWACH (nur Name)")}\n` +
      `  KEIN NAME:                      ${by("KEIN NAME")}\n` +
      `  BLOCKT/403 (Seite existiert):   ${by("BLOCKT (existiert)")}\n` +
      `  TOT/Timeout:                    ${by("TOT/Timeout")}\n` +
      `  → verify-berlin-homepage-candidates.jsonl aktualisiert`
  );
  db.close();
})();
