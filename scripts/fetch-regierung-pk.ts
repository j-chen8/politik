/**
 * Pressekonferenzen der Bundesregierung → regierung_pk. Komplette Wortlaut-
 * Mitschriften (Regierungspressekonferenz 3×/Woche + Kanzler-/Sonder-PKs) —
 * die „Rechtfertigungs"-Seite zum Fraktions-Reaktions-Band: hier verteidigen
 * die Ministeriumssprecher die Regierungslinie im Kreuzverhör der BPK.
 *
 * Quelle (Erkundung 08.07.2026): bundesregierung.de/breg-de/aktuelles/
 * pressekonferenzen — Liste server-gerendert (nur die jüngsten ~15; Archiv
 * hängt hinter einer JSON-Such-API mit CSRF, bewusst NICHT angebunden — fürs
 * Reaktions-Band zählt Aktualität). Kein RSS (beim Relaunch abgeschafft),
 * kein Bot-Schutz. Themenliste steht •-separiert im Kopf jeder Mitschrift.
 *
 * Aufruf: npx tsx scripts/fetch-regierung-pk.ts   (inkrementell, Link-Dedupe)
 */
import Database from "better-sqlite3";
import * as cheerio from "cheerio";
import { ensureFraktionPmSchema } from "./_lib/fraktion-pm-schema";

const UA = { "User-Agent": "Mozilla/5.0 (compatible; Politik-Radar/1.0)" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MONATE: Record<string, string> = { januar: "01", februar: "02", märz: "03", april: "04", mai: "05", juni: "06", juli: "07", august: "08", september: "09", oktober: "10", november: "11", dezember: "12" };

const db = new Database("politik.db");
ensureFraktionPmSchema(db);
const ins = db.prepare(`INSERT OR IGNORE INTO regierung_pk (titel, link, datum, themen_json, text) VALUES (?,?,?,?,?)`);
const kennt = db.prepare(`SELECT 1 FROM regierung_pk WHERE link = ?`);

async function hole(url: string): Promise<string> {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return res.text();
}

const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/\s+/g, " ").trim();

/** „7. Juli 2026" → „2026-07-07" (Datum steckt im PK-Titel bzw. Vorspann). */
function deutschesDatum(s: string): string | null {
  const m = /(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/i.exec(s);
  return m ? `${m[3]}-${MONATE[m[2].toLowerCase()]}-${m[1].padStart(2, "0")}` : null;
}

async function main() {
  const liste = await hole("https://www.bundesregierung.de/breg-de/aktuelles/pressekonferenzen");
  // Die Teaser-Liste liegt als eingebettetes JSON mit <-escaptem HTML im
  // Quelltext — die URLs selbst sind Klartext, also direkt auf sie matchen
  // (kein href="…"-Muster).
  const links = [...new Set(
    [...liste.matchAll(/https:\/\/www\.bundesregierung\.de\/breg-de\/aktuelles\/pressekonferenzen\/[a-z0-9-]+-\d+/g)].map((m) => m[0])
  )];
  console.log(`Regierungs-PK-Fetch: ${links.length} PKs in der Liste`);

  let neu = 0;
  for (const link of links) {
    if (kennt.get(link)) continue;
    let $: cheerio.CheerioAPI;
    try { $ = cheerio.load(await hole(link)); } catch { continue; }
    // h1 der Seite ist der Cookie-Banner — Titel aus og:title.
    const titel = strip($('meta[property="og:title"]').attr("content") ?? $("title").text()).replace(/\s*\|\s*Bundesregierung.*$/i, "");
    if (!titel) continue;
    const volltext = strip($("main p").map((_, p) => $(p).text()).get().join(" ")) || strip($("main").text());
    const datum = deutschesDatum(titel) ?? deutschesDatum(volltext.slice(0, 3000));
    // Themenliste: •-separierter Block vor „… Min. Lesedauer".
    let themen: string[] = [];
    const kopf = volltext.slice(0, 4000);
    const lesedauer = kopf.indexOf("Min. Lesedauer");
    if (lesedauer > 0 && kopf.slice(0, lesedauer).includes("•")) {
      const block = kopf.slice(0, lesedauer);
      themen = block.split("•").slice(1) // vor dem ersten • steht Vorspann
        .map((t) => t.trim())
        .filter((t) => t.length >= 3 && t.length <= 120);
      // NUR das letzte Thema trägt die angeklebte Lesedauer-Zahl („… 31" vor
      // „Min. Lesedauer") — Jahreszahlen in echten Themen („Haushaltsentwurf
      // 2027") dürfen nicht mitgekappt werden.
      if (themen.length) themen[themen.length - 1] = themen[themen.length - 1].replace(/\s+\d+\s*$/, "").trim();
    }
    neu += ins.run(titel, link, datum, themen.length ? JSON.stringify(themen) : null, volltext.slice(0, 80000)).changes;
    await sleep(250);
  }

  const stat = db.prepare(`SELECT COUNT(*) n, MIN(datum) von, MAX(datum) bis FROM regierung_pk`).get() as { n: number; von: string; bis: string };
  console.log(`+${neu} neu · Bestand ${stat.n} (${stat.von} → ${stat.bis})`);
  db.close();
}
main();
