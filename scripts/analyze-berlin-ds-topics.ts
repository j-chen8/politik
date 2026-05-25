/**
 * Topic-Tag-Discovery für Berlin-Drucksachen.
 *
 * Strategie:
 * 1. N-Gramm-Analyse über alle 35k DS-Titel (Titel sind hochkonzentrierte Themen-Marker)
 * 2. Plus: Keyword-Frequenz im Volltext (erste 800 Z pro DS — wo die Frage steht)
 * 3. Cluster nach semantischen Buckets (manuell kuriert)
 * 4. Cross-Check gegen aktuelle BERLIN_TOPIC_TAGS
 *
 * Output: Empfehlungsliste neuer/erweiterter Topic-Tags.
 */

import Database from "better-sqlite3";
import path from "path";
import { BERLIN_TOPIC_TAGS } from "../src/lib/berlin-drucksachen-prompts";

const db = new Database(path.join(process.cwd(), "politik.db"), { readonly: true });

const STOP_WORDS = new Set([
  "und", "oder", "im", "in", "der", "die", "das", "von", "zu", "zur", "zum", "für", "mit", "bei", "auf",
  "an", "am", "des", "den", "dem", "ein", "eine", "einer", "einen", "eines", "ist", "sind", "war", "wird",
  "werden", "hat", "haben", "habe", "es", "sie", "er", "wir", "ihr", "nicht", "kein", "keine", "auch",
  "nach", "über", "unter", "vor", "durch", "aus", "wegen", "trotz", "während", "ab", "als", "wie", "was",
  "wo", "wann", "warum", "soll", "sollen", "muss", "müssen", "kann", "können", "darf", "dürfen",
  "drucksache", "schriftliche", "anfrage", "antrag", "vorlage", "beschlussempfehlung", "wahlperiode",
  "berlin", "berlins", "berliner", "abgeordnetenhauses", "abgeordnetenhaus", "senat", "senats", "land",
  "landes", "antwort", "betreff", "thema", "fraktion", "fraktionen", "mai", "april", "märz", "februar", "januar",
  "juni", "juli", "august", "september", "oktober", "november", "dezember", "dr", "prof",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[-‐‑‒–—']/g, " ")
    .replace(/[^a-zäöüß0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter(w => w.length >= 4 && !STOP_WORDS.has(w));
}

// 1. N-Gramm-Analyse über DS-Titel
console.log("=== 1. Top Single-Tokens in DS-Titeln (Themen-Marker) ===\n");
const titelRows = db.prepare(`
  SELECT d.titel FROM berlin_documents d
  WHERE d.dok_art_label='Drucksache' AND d.titel IS NOT NULL AND d.titel != ''
`).all() as {titel: string}[];

const tokenCounts = new Map<string, number>();
const bigramCounts = new Map<string, number>();
for (const r of titelRows) {
  const tokens = tokenize(r.titel);
  for (const t of tokens) tokenCounts.set(t, (tokenCounts.get(t) ?? 0) + 1);
  for (let i = 0; i < tokens.length - 1; i++) {
    const bg = tokens[i] + " " + tokens[i+1];
    bigramCounts.set(bg, (bigramCounts.get(bg) ?? 0) + 1);
  }
}
console.log(`Titel-Korpus: ${titelRows.length} DS`);
console.log(`Unique Tokens (≥4 Z, kein Stopword): ${tokenCounts.size}\n`);
console.log("Top 60 Tokens (≥30 DS):");
const topTokens = [...tokenCounts.entries()].filter(([,n]) => n >= 30).sort((a,b)=>b[1]-a[1]).slice(0,60);
for (const [t, n] of topTokens) console.log(`  ${n.toString().padStart(5)}  ${t}`);

console.log("\nTop 40 Bigramme (≥20 DS):");
const topBigrams = [...bigramCounts.entries()].filter(([,n]) => n >= 20).sort((a,b)=>b[1]-a[1]).slice(0,40);
for (const [bg, n] of topBigrams) console.log(`  ${n.toString().padStart(5)}  ${bg}`);

// 2. Cross-Check: welche aktuellen BERLIN_TOPIC_TAGS sind empirisch validiert (kommen im Titel-Korpus vor)?
console.log("\n=== 2. Empirische Validation aktueller BERLIN_TOPIC_TAGS ===\n");
console.log("Tag".padEnd(30) + "Titel-Coverage");
console.log("─".repeat(50));
for (const tag of BERLIN_TOPIC_TAGS) {
  // Konservative Suche: case-insensitive substring im Titel
  const normTag = normalize(tag);
  const hits = titelRows.filter(r => normalize(r.titel).includes(normTag)).length;
  const marker = hits >= 30 ? "✓" : hits >= 10 ? "○" : "✗ selten";
  console.log(tag.padEnd(30) + `${hits.toString().padStart(5)} (${(hits/titelRows.length*100).toFixed(1)}%)`.padEnd(15) + " " + marker);
}

// 3. Identifiziere häufige Tokens die NICHT in BERLIN_TOPIC_TAGS sind → Kandidaten für Glossar v2
console.log("\n=== 3. Häufige Themen-Tokens NICHT in aktuellem Glossar (Kandidaten für v2) ===\n");
const glossarTokens = new Set(BERLIN_TOPIC_TAGS.map(t => normalize(t)).flatMap(t => t.split(" ")));
const newCandidates = topTokens
  .filter(([t]) => !glossarTokens.has(t))
  .filter(([t]) => !t.match(/^(20\d\d|19|wp|gemäß|art|sgb|wo|leerstand|stand|prozent|euro|million|millionen|milliarden|prozentual)$/))
  .slice(0, 40);
for (const [t, n] of newCandidates) console.log(`  ${n.toString().padStart(5)}  ${t}`);

// 4. Bezirke + Stadteile als Topic-Sub-Tags
console.log("\n=== 4. Bezirks-Erwähnungen in DS-Titeln (für Bezirks-Tag-Empfehlung) ===\n");
const bezirke = ["mitte","friedrichshain","kreuzberg","pankow","charlottenburg","wilmersdorf","spandau",
  "steglitz","zehlendorf","tempelhof","schöneberg","neukölln","treptow","köpenick","marzahn","hellersdorf",
  "lichtenberg","reinickendorf","prenzlauer berg","weißensee","wedding"];
for (const b of bezirke) {
  const hits = titelRows.filter(r => normalize(r.titel).includes(b)).length;
  if (hits >= 20) console.log(`  ${hits.toString().padStart(4)}  ${b}`);
}

db.close();
