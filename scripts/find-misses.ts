import Database from "better-sqlite3";

const db = new Database("politik.db");

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàâ]/g, "a").replace(/ä/g, "ae")
    .replace(/[éèê]/g, "e")
    .replace(/[íìî]/g, "i")
    .replace(/[óòô]/g, "o").replace(/ö/g, "oe")
    .replace(/[úùû]/g, "u").replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[ćč]/g, "c")
    .replace(/[ñń]/g, "n")
    .replace(/[şš]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/ı/g, "i")
    .replace(/[ğ]/g, "g")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface Pol { id: number; first_name: string; last_name: string; }

const allSpeakers = db.prepare(`
  SELECT speaker, COUNT(*) as reden FROM speech_summaries GROUP BY speaker ORDER BY reden DESC
`).all() as { speaker: string; reden: number }[];

const pols = db.prepare("SELECT id, first_name, last_name FROM politicians").all() as Pol[];

const byLast = new Map<string, Pol[]>();
for (const p of pols) {
  const k = normalize(p.last_name);
  if (!byLast.has(k)) byLast.set(k, []);
  byLast.get(k)!.push(p);
  const lastWord = k.split(" ").pop() || "";
  if (lastWord && lastWord !== k) {
    const k2 = `_lw:${lastWord}`;
    if (!byLast.has(k2)) byLast.set(k2, []);
    byLast.get(k2)!.push(p);
  }
}

function findMatch(speaker: string): Pol | null {
  const cleaned = speaker
    .replace(/^(Dr\.?|Prof\.?|Prof\.\s*Dr\.?)\s+/i, "")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const norm = normalize(cleaned);
  const tokens = norm.split(" ");
  if (tokens.length < 2) return null;
  for (let start = 1; start < tokens.length; start++) {
    const lname = tokens.slice(start).join(" ");
    const matches = byLast.get(lname);
    if (!matches) continue;
    const firstTokens = tokens.slice(0, start);
    for (const p of matches) {
      const polFirst = normalize(p.first_name).split(" ");
      if (firstTokens.some((t) => polFirst.includes(t))) return p;
    }
  }
  const lastWord = tokens[tokens.length - 1];
  const lwm = byLast.get(lastWord) ?? byLast.get(`_lw:${lastWord}`);
  if (lwm) {
    const first = tokens[0];
    for (const p of lwm) {
      const polFirst = normalize(p.first_name).split(" ");
      if (polFirst.includes(first)) return p;
    }
  }
  // Substring-Match: "Paul" matcht "Pauls" wenn first_name + Suffix-Toleranz passt
  if (lastWord.length >= 4) {
    for (const [k, ps] of byLast) {
      if (k.startsWith("_lw:")) continue;
      // k ist normalisierter last_name; matcht wenn er mit lastWord beginnt + max 2 Zeichen länger ist
      if (k !== lastWord && k.startsWith(lastWord) && k.length - lastWord.length <= 2) {
        const first = tokens[0];
        for (const p of ps) {
          const polFirst = normalize(p.first_name).split(" ");
          if (polFirst.includes(first)) return p;
        }
      }
    }
  }
  return null;
}

const realMisses: { speaker: string; reden: number }[] = [];
let matched = 0;
for (const sp of allSpeakers) {
  const m = findMatch(sp.speaker);
  if (m) matched++;
  else realMisses.push({ speaker: sp.speaker, reden: sp.reden });
}

console.log(`Total Speaker: ${allSpeakers.length}`);
console.log(`Gematcht (existiert in DB): ${matched}`);
console.log(`Echte Lücken: ${realMisses.length}`);
console.log();
console.log("=== ECHTE LÜCKEN ===");
for (const m of realMisses) console.log(`  ${m.reden.toString().padStart(3)} Reden  ${m.speaker}`);
db.close();
