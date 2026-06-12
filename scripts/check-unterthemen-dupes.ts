import Database from "better-sqlite3";
import { OBERTHEMEN, TAXONOMIE } from "/home/jinsheng/politik/src/lib/themen-struktur";

const db = new Database("/home/jinsheng/politik/politik.db", { readonly: true });
// DS-Mengen je (feld, unterthema)
const rows = db
  .prepare(
    `SELECT d.feld, j.value AS u, d.drucksache_nr AS nr
     FROM ds_unterthemen d, json_each(d.unterthemen_json) j`
  )
  .all() as { feld: string; u: string; nr: string }[];
const docs = new Map<string, Set<string>>();
for (const r of rows) {
  const k = `${r.feld} ${r.u}`;
  if (!docs.has(k)) docs.set(k, new Set());
  docs.get(k)!.add(r.nr);
}

const STOP = new Set([
  "und", "der", "die", "das", "von", "für", "des", "deutsche", "deutsches", "deutschen",
  "laufende", "öffentliche", "öffentliches", "internationale", "internationaler",
  "sonstiges", "weitere", "allgemein", "politik",
]);
const toks = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .split(/[^a-zäöüß]+/)
      .filter((w) => w.length >= 4 && !STOP.has(w))
      .map((w) => w.slice(0, 8))
  );

for (const ober of OBERTHEMEN) {
  const entries: { feld: string; u: string }[] = [];
  for (const feld of ober.felder) for (const u of TAXONOMIE[feld] ?? []) entries.push({ feld, u });
  const out: string[] = [];
  for (let i = 0; i < entries.length; i++)
    for (let j = i + 1; j < entries.length; j++) {
      const a = entries[i], b = entries[j];
      const ta = toks(a.u), tb = toks(b.u);
      const shared = [...ta].filter((t) => tb.has(t));
      const da = docs.get(`${a.feld} ${a.u}`) ?? new Set<string>();
      const dbb = docs.get(`${b.feld} ${b.u}`) ?? new Set<string>();
      const ov = [...da].filter((n) => dbb.has(n)).length;
      const jac = shared.length / Math.max(1, Math.min(ta.size, tb.size));
      // Kandidat: deutliche Namens-Ähnlichkeit ODER nennenswerte Dokument-Überlappung
      if ((shared.length >= 2 && jac >= 0.5) || shared.length >= 3 || ov >= 5 || (ov >= 3 && shared.length >= 1)) {
        const sf = a.feld === b.feld ? " [GLEICHES FELD]" : "";
        out.push(
          `  „${a.u}" (${a.feld.slice(0, 14)}…, ${da.size} DS)  ↔  „${b.u}" (${b.feld.slice(0, 14)}…, ${dbb.size} DS)${sf}` +
            `\n      gemeinsame Wörter: ${shared.join(", ") || "—"} · ${ov} DS in BEIDEN`
        );
      }
    }
  if (out.length) console.log(`\n■ ${ober.name}\n${out.join("\n")}`);
}
