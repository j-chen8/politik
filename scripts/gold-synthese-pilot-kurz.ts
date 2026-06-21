/**
 * KÜRZERE Synthese-Variante des Pilot-Aspekts (Wirtschaft / Außenhandel) zum
 * Vergleich gegen die ausführlichere synthese_json. Gleiche Methode (Claude Code,
 * kein LLM): noch aggressiver zusammengeführt, refs aller zusammengefassten Reden
 * bleiben erhalten. Ablage in Spalte synthese_kurz_json.
 *
 *   npx tsx scripts/gold-synthese-pilot-kurz.ts
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");
const cols = (db.prepare(`PRAGMA table_info(partei_aspekt_gold)`).all() as any[]).map((c) => c.name);
if (!cols.includes("synthese_kurz_json")) {
  db.exec(`ALTER TABLE partei_aspekt_gold ADD COLUMN synthese_kurz_json TEXT`);
  console.log("+ Spalte synthese_kurz_json angelegt");
}

type Bullet = { text: string; refs: string[] };
type Cell = { feld: string; aspekt: string; partei: string; bullets: Bullet[] };

const KURZ: Cell[] = [
  {
    feld: "Wirtschaft", aspekt: "Außenhandel", partei: "AfD",
    bullets: [
      { text: "Pro Freihandel mit Asien, aber gegen Mercosur, Billigimporte und überregulierte Standards/Lieferkettenpflichten als Handelsbarrieren", refs: ["ID213204900", "ID214016400", "ID214016600", "ID211002600", "ID213204400", "ID213717000", "ID215311000"] },
      { text: "China-Abhängigkeit vermeiden; Rohstoffsicherung über bilaterale Abkommen „im deutschen Interesse zuerst“", refs: ["ID214012000", "ID217403400", "ID216001800", "ID216002400", "ID216002800"] },
      { text: "Sorge um Deindustrialisierung und Standort-Wettbewerbsfähigkeit (Export von Arbeitsplätzen, USA/Schweiz, maritime Infrastruktur)", refs: ["ID213411500", "ID214716300", "ID215100700", "ID217402900"] },
      { text: "Abgaben und EU-Regeln als Wettbewerbsnachteil: Luftverkehrsteuer, CBAM, Steuerwettbewerb", refs: ["ID213414800", "ID217501200", "ID218014300", "ID218014800", "ID213616400"] },
      { text: "Warnung vor Importabhängigkeit bei Agrar/Lebensmitteln", refs: ["ID217202100", "ID217202700"] },
    ],
  },
  {
    feld: "Wirtschaft", aspekt: "Außenhandel", partei: "CDU/CSU",
    bullets: [
      { text: "Klares Bekenntnis zu Freihandel und Handelsabkommen (Afrika/Asien, Mercosur) als Wohlstandsmotor, gegen Protektionismus", refs: ["ID211002800", "ID211406600", "ID215701400", "ID216001900", "ID211003000", "ID213204500", "ID213204800", "ID213205000", "ID214016300", "ID215706000", "ID215816000", "ID216902100", "ID212016300"] },
      { text: "Europäischer Binnenmarkt als Fundament für Exporte, Arbeitsplätze und Landwirtschaft", refs: ["ID214506200", "ID217202000"] },
      { text: "Gegenüber China Reziprozität und Exportkontrolle; neue Rohstoffpartnerschaften und mehr Afrika-Engagement", refs: ["ID214012400", "ID214012700", "ID216002300", "ID216002700"] },
      { text: "Standort und Wettbewerbsfähigkeit sichern: Abwanderung von Produktion, Kapital und Verkehr ins Ausland verhindern", refs: ["ID215014200", "ID215405800", "ID21615300", "ID217105400", "ID218014400", "ID216301800"] },
      { text: "Schutz vor unfairem Wettbewerb und unsicheren Billigimporten aus China (Stahl, Produktstandards)", refs: ["ID213413200", "ID215012200"] },
      { text: "Export- und Industrieschutz (China-Export stützt Löhne, Automobil), Klimaschutz und Wasserstoff als Weltmarktchance, maritime Exportinfrastruktur", refs: ["ID216902300", "ID216903600", "ID217106500", "ID215909300", "ID21709200", "ID217403300", "ID217403600"] },
      { text: "Internationale Koordination (Handelskonflikte, Mindeststeuer, Zoll-Digitalisierung) und Geschäftsreisen/Messen", refs: ["ID213616600", "ID214016800", "ID213414900", "ID216905700"] },
    ],
  },
  {
    feld: "Wirtschaft", aspekt: "Außenhandel", partei: "GRÜNE",
    bullets: [
      { text: "Handel an soziale, ökologische und menschenrechtliche Standards binden; faire, regelbasierte Politik und europäische Einigkeit", refs: ["ID211002300", "ID213204600", "ID211001700", "ID212016000"] },
      { text: "Binnenmarkt existenziell — scharfe Warnung vor „Dexit“, für stärkere europäische Kapitalmärkte", refs: ["ID213800400", "ID215101100", "ID215513500", "ID213800900"] },
      { text: "Schutz vor unfairem Wettbewerb und China-Dumping durch Ausgleichszölle und CBAM", refs: ["ID213413100", "ID214005000", "ID217400900", "ID218008400", "ID217403100"] },
      { text: "Sorge um die Autoindustrie (China-Konkurrenz, Marktanteilsverluste)", refs: ["ID213411700", "ID214505700", "ID216902200", "ID21708200"] },
      { text: "Pro Freihandelsabkommen (Mercosur, Indien), aber Investitionsschutz-Klagerechte kritisch; Handel als Wohlstandsgrundlage gegen AfD-Politik", refs: ["ID215701000", "ID214016500", "ID218008600"] },
    ],
  },
  {
    feld: "Wirtschaft", aspekt: "Außenhandel", partei: "LINKE",
    bullets: [
      { text: "EU-Handelsabkommen als ausbeuterisch/neokolonial — faire Partnerschaft auf Augenhöhe statt Handelskriege; Kooperation mit China statt Konfrontation", refs: ["ID213204700", "ID216002200", "ID214012300"] },
      { text: "Diagnose Absatz- statt Produktivitätsproblem; längere Arbeitszeiten helfen nicht gegen China-Konkurrenz und US-Zölle", refs: ["ID215700600"] },
      { text: "Seehäfen zentral für den Außenhandel; Kritik an Abschaffung des Kammern-Berichts", refs: ["ID217403200", "ID215514500"] },
    ],
  },
  {
    feld: "Wirtschaft", aspekt: "Außenhandel", partei: "SPD",
    bullets: [
      { text: "Einheitliche europäische und faire Welthandelsregeln; Schutz vor Dumping/Marktüberschwemmung, geschützter Binnenmarkt", refs: ["ID211002700", "ID217806000", "ID213413400", "ID216903100", "ID218008700", "ID213713800"] },
      { text: "China: Rekordhandelsdefizit und strategische Marktmacht; konzertierte europäische Reaktion auf Subventionen; Sorge um die Autoindustrie", refs: ["ID214012100", "ID215700700", "ID213412100"] },
      { text: "Offenes, exportorientiertes Modell für den Mittelstand; Kritik an AfD-Abschottung", refs: ["ID215513600"] },
      { text: "Handelsabkommen diversifizieren (Kanada, Australien, Indien); Rohstoffpartnerschaften auf Augenhöhe", refs: ["ID215700300", "ID217314600", "ID216002100"] },
      { text: "Geopolitische Verflechtung von Handel und Sicherheit; Export-/Rohstoffkontrolle als Hebel; Kritik an belastender Zollpolitik", refs: ["ID214012600", "ID212016100"] },
      { text: "Infrastruktur und Standort: Seehäfen, Luftverkehrsteuer senken; Warnung vor Billigimporten durch Sozialdumping", refs: ["ID217403500", "ID218014200", "ID215016900"] },
    ],
  },
];

const upd = db.prepare(
  `UPDATE partei_aspekt_gold SET synthese_kurz_json=? WHERE feld=? AND aspekt=? AND partei=?`,
);
let ok = 0;
for (const c of KURZ) {
  const row = db
    .prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`)
    .get(c.feld, c.aspekt, c.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! Zelle fehlt: ${c.partei}`); continue; }
  const known = new Set((JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id));
  const allRefs = c.bullets.flatMap((b) => b.refs);
  const missing = allRefs.filter((r) => !known.has(r));
  const covered = new Set(allRefs);
  const uncovered = [...known].filter((r) => !covered.has(r));
  if (missing.length) console.log(`  ⚠ ${c.partei}: unbekannte refs: ${missing.join(", ")}`);
  if (uncovered.length) console.log(`  ⚠ ${c.partei}: ${uncovered.length} Reden ohne Stichpunkt: ${uncovered.join(", ")}`);
  const r = upd.run(JSON.stringify(c.bullets), c.feld, c.aspekt, c.partei);
  ok += r.changes;
  console.log(`  ✓ ${c.partei}: ${c.bullets.length} Stichpunkte (${allRefs.length}/${known.size} Reden abgedeckt)`);
}
console.log(`\n${ok}/${KURZ.length} Zellen (kurz) aktualisiert.`);
db.close();
