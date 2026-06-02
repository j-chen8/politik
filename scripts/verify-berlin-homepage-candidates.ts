/**
 * Verifiziert die von find-missing-homepages.ts --berlin vorgeschlagenen
 * Homepage-Kandidaten INHALTLICH: besucht jede Seite und prüft, ob dort die
 * Partei der/des Abgeordneten, "Berlin", "Abgeordnetenhaus" o.ä. politische
 * Signale vorkommen — damit wir ausschließen, dass es ein Namensvetter ist.
 *
 * Input:  /tmp/berlin-hp-candidates.txt (stdout von find-missing-homepages --berlin --dry-run)
 *         ODER --file <pfad>
 * Output: verify-berlin-homepage-candidates.jsonl + Konsolen-Tabelle.
 *         Schreibt NICHT in die DB (nur Vorschlag → menschliche Freigabe).
 *
 * Run: npx tsx scripts/verify-berlin-homepage-candidates.ts [--file <pfad>]
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "politik.db");
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const TIMEOUT_MS = 12000;
const fileIdx = process.argv.indexOf("--file");
const CAND_FILE = fileIdx > -1 ? process.argv[fileIdx + 1] : "/tmp/berlin-hp-candidates.txt";

// Partei-Label → Signal-Tokens, die auf einer Politiker-Homepage stehen können.
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
  const p = party.toLowerCase();
  if (p.includes("grün") || p.includes("bündnis 90")) return PARTY_TOKENS.grüne;
  if (p.includes("linke")) return PARTY_TOKENS.linke;
  for (const k of ["cdu", "spd", "afd", "fdp", "bsw"]) if (p.startsWith(k)) return PARTY_TOKENS[k];
  return [];
}
const POLITIK_SIGNALS = [
  "abgeordnetenhaus", "abgeordnete", "mitglied des abgeordnetenhauses", "mda",
  "fraktion", "wahlkreis", "berlin", "politik", "mandat", "parlament", "ausschuss",
];

interface Cand { name: string; party: string; url: string; score: number; }

function parseCandidates(text: string): Cand[] {
  const out: Cand[] = [];
  for (const line of text.replace(/\r/g, "\n").split("\n")) {
    const m = line.match(/\] (.+?) \(([^)]*)\): ✓ (\S+)\s+\[score=(\d+)/);
    if (m) out.push({ name: m[1].trim(), party: m[2].trim(), url: m[3], score: parseInt(m[4], 10) });
  }
  return out;
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

// Namens-Token in mehreren Schreibweisen (ß/Umlaut-Folding), damit "rauchfuß"
// auch "rauchfuss" auf der Seite trifft.
function nameVariants(lastName: string): string[] {
  const lo = lastName.toLowerCase();
  const v = new Set<string>([lo]);
  v.add(lo.replace(/ß/g, "ss"));
  v.add(lo.replace(/ä/g, "a").replace(/ö/g, "o").replace(/ü/g, "u").replace(/ß/g, "ss"));
  v.add(lo.replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss"));
  // bei Doppelnamen auch das erste Glied (z.B. "jasper-winter" → "jasper")
  if (lo.includes("-")) v.add(lo.split("-")[0]);
  return [...v].filter((s) => s.length >= 3);
}

async function fetchOnce(url: string, timeout: number): Promise<{ ok: boolean; status: number; text?: string; finalUrl?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal, redirect: "follow",
      headers: {
        "User-Agent": UA,
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
async function fetchText(url: string) {
  let r = await fetchOnce(url, TIMEOUT_MS);
  if (!r.ok && r.status === 0) { await sleep(800); r = await fetchOnce(url, TIMEOUT_MS + 8000); } // Retry langsamer
  return r;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

(async () => {
  if (!fs.existsSync(CAND_FILE)) { console.error(`Kandidaten-Datei fehlt: ${CAND_FILE}`); process.exit(1); }
  const cands = parseCandidates(fs.readFileSync(CAND_FILE, "utf-8"));
  const db = new Database(DB_PATH, { readonly: true });

  // politician_id + nachname-Token für jeden Kandidaten ermitteln (Name-im-Text-Check)
  const findId = db.prepare(
    `SELECT p.id, p.last_name, p.first_name FROM politicians p
     JOIN mandates m ON m.politician_id=p.id AND m.type='mandate'
     JOIN parliament_periods pp ON m.parliament_period_id=pp.id
     WHERE pp.parliament_id=2 AND p.first_name||' '||p.last_name = ?`
  );

  console.log(`${cands.length} Kandidaten werden inhaltlich geprüft...\n`);
  const results: any[] = [];

  for (const c of cands) {
    const row = findId.get(c.name) as { id: number; last_name: string; first_name: string } | undefined;
    const r = await fetchText(c.url);
    const text = r.text ?? "";
    const pTokens = partyTokens(c.party);
    const partyHit = pTokens.find((t) => text.includes(t)) ?? null;
    const variants = row ? nameVariants(row.last_name) : [];
    const nameHit = variants.some((v) => text.includes(v));
    const politikHits = POLITIK_SIGNALS.filter((s) => text.includes(s));
    const berlinHit = text.includes("berlin");
    const aghHit = text.includes("abgeordnetenhaus") || text.includes("mitglied des abgeordnetenhauses");

    // Verdikt: STARK = Partei ODER Abgeordnetenhaus gefunden (+ Name). MITTEL = Name + Berlin/Politik.
    let verdict: string;
    if (!r.ok) verdict = r.status === 403 || r.status === 401 || r.status === 406
      ? "BLOCKT (existiert)" : r.status === 0 ? "TOT/Timeout" : `HTTP ${r.status}`;
    else if (nameHit && (partyHit || aghHit)) verdict = "STARK";
    else if (nameHit && (berlinHit || politikHits.length >= 2)) verdict = "MITTEL";
    else if (partyHit && aghHit) verdict = "STARK (ohne Namensvar.)";
    else if (nameHit) verdict = "SCHWACH (nur Name)";
    else verdict = "KEIN NAME";

    results.push({
      id: row?.id ?? null, name: c.name, party: c.party, url: c.url, score: c.score,
      verdict, partyHit, nameHit, aghHit, berlinHit, politikHits,
      status: r.status, finalUrl: r.finalUrl,
    });
    const sig = [partyHit && `partei:${partyHit}`, aghHit && "AGH", berlinHit && "berlin", `${politikHits.length} pol`]
      .filter(Boolean).join(" ");
    console.log(`  ${verdict.padEnd(18)} ${c.name.padEnd(28)} ${c.party.slice(0, 7).padEnd(8)} ${c.url}  [${sig}]`);
    await sleep(400);
  }

  fs.writeFileSync(
    "verify-berlin-homepage-candidates.jsonl",
    results.map((r) => JSON.stringify(r)).join("\n") + "\n"
  );
  const by = (v: string) => results.filter((r) => r.verdict === v).length;
  console.log(
    `\n── Zusammenfassung ──\n` +
      `  STARK (Partei/AGH + Name):      ${by("STARK")}\n` +
      `  STARK (ohne Namensvariante):    ${by("STARK (ohne Namensvar.)")}\n` +
      `  MITTEL (Name + Berlin/Pol):     ${by("MITTEL")}\n` +
      `  SCHWACH (nur Name):             ${by("SCHWACH (nur Name)")}\n` +
      `  KEIN NAME:                      ${by("KEIN NAME")}\n` +
      `  BLOCKT/403 (Seite existiert):   ${by("BLOCKT (existiert)")}\n` +
      `  TOT/Timeout:                    ${by("TOT/Timeout")}\n` +
      `  → verify-berlin-homepage-candidates.jsonl`
  );
  db.close();
})();
