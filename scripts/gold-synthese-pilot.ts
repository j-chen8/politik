/**
 * MANUELLE Synthese (Claude Code, kein LLM/keine API) der Per-Rede-Gold-Punkte zu
 * wenigen, inhaltlich verdichteten Stichpunkten je Aspekt × Partei.
 *
 * Die Aggregation (gold-aggregate.ts) legt EINEN Punkt pro Rede ab → bis zu 121
 * Punkte/Zelle. Hier werden inhaltlich gleiche Punkte zusammengeführt, klar
 * verschiedene bleiben getrennt. Jeder verdichtete Stichpunkt trägt die rede_ids
 * der von ihm zusammengefassten Reden (refs) → Fußnoten + Quellen-Apparat bleiben
 * intakt. Ablage in neuer Spalte partei_aspekt_gold.synthese_json.
 *
 * Pilot: Feld „Wirtschaft", Aspekt „Außenhandel" (alle 5 Fraktionen).
 *   npx tsx scripts/gold-synthese-pilot.ts
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");

// Spalte anlegen (idempotent)
const cols = (db.prepare(`PRAGMA table_info(partei_aspekt_gold)`).all() as any[]).map((c) => c.name);
if (!cols.includes("synthese_json")) {
  db.exec(`ALTER TABLE partei_aspekt_gold ADD COLUMN synthese_json TEXT`);
  console.log("+ Spalte synthese_json angelegt");
}

type Bullet = { text: string; refs: string[] };
type Cell = { feld: string; aspekt: string; partei: string; bullets: Bullet[] };

const PILOT: Cell[] = [
  {
    feld: "Wirtschaft",
    aspekt: "Außenhandel",
    partei: "AfD",
    bullets: [
      { text: "Pro Freihandelsabkommen mit Asien (Vietnam, Singapur, Chile), gegen „UN-Agenda 2030“; Handelsabkommen als zentrale Säule der Wirtschaft", refs: ["ID213204900", "ID214016400", "ID214016600"] },
      { text: "Lieferkettenpflichten und überregulierte Standards gefährden Exporte und schaffen Handelsbarrieren", refs: ["ID211002600", "ID213204400", "ID213717000"] },
      { text: "Ablehnung des Mercosur-Abkommens; Kritik an Billigimporten mit niedrigeren Standards", refs: ["ID215311000"] },
      { text: "Rohstoff-Handelsdiplomatie: bilaterale Rohstoffabkommen „im deutschen Interesse zuerst“", refs: ["ID216001800", "ID216002400", "ID216002800"] },
      { text: "China wichtigster Handelspartner — Rückzug wäre verheerend, aber einseitige Abhängigkeiten vermeiden", refs: ["ID214012000", "ID217403400"] },
      { text: "Deindustrialisierung: Deutschland exportiert Arbeitsplätze statt Waren; geringe Wettbewerbsfähigkeit ggü. USA/Schweiz, Technologie-Abhängigkeit", refs: ["ID213411500", "ID214716300", "ID215100700"] },
      { text: "Luftverkehrsteuer und CBAM (CO₂-Grenzausgleich) als Wettbewerbsnachteil und Standortbelastung kritisiert", refs: ["ID213414800", "ID217501200", "ID218014300", "ID218014800"] },
      { text: "Kritik an Steuerdumping und ruinösem Steuerwettbewerb in der EU", refs: ["ID213616400"] },
      { text: "Warnung vor Importabhängigkeit bei Agrar/Lebensmitteln; Kritik an Zöllen auf russischen Dünger", refs: ["ID217202100", "ID217202700"] },
      { text: "Deutschland als Exportnation — maritime Infrastruktur zentral für den Welthandel", refs: ["ID217402900"] },
    ],
  },
  {
    feld: "Wirtschaft",
    aspekt: "Außenhandel",
    partei: "CDU/CSU",
    bullets: [
      { text: "Klares Bekenntnis zu Freihandel, gegen Protektionismus und Abschottung", refs: ["ID211002800", "ID211406600", "ID215701400", "ID216001900"] },
      { text: "Handelsabkommen als Wohlstandsmotor; konkrete Abkommen mit Afrika/Asien (Vietnam, Singapur, Chile) und Mercosur befürwortet, Blockade kritisiert", refs: ["ID211003000", "ID213204500", "ID213204800", "ID213205000", "ID214016300", "ID215706000", "ID215816000", "ID216902100"] },
      { text: "Gegenüber China Reziprozität/Gleichberechtigung einfordern; Exportkontrolle von Dual-Use-Gütern", refs: ["ID214012400", "ID214012700"] },
      { text: "Europäischer Binnenmarkt zentral für Exporte und Arbeitsplätze; EU auch wichtigster Exportmarkt der Landwirtschaft", refs: ["ID214506200", "ID217202000"] },
      { text: "Faire Wettbewerbsbedingungen (Stahl) und einheitliche Produktsicherheitsstandards gegen unsichere Billigimporte aus China", refs: ["ID213413200", "ID215012200"] },
      { text: "Standort sichern: internationale Wettbewerbsfähigkeit erhalten, Produktions- und Verkehrsverlagerung ins Ausland verhindern", refs: ["ID215014200", "ID215405800", "ID21615300", "ID217105400", "ID218014400"] },
      { text: "Warnung vor Kapitalflucht durch eine Vermögensteuer (Mobilität des Kapitals)", refs: ["ID216301800"] },
      { text: "Freihandel unter Druck — China drängt in Wertschöpfungsketten, strukturelle Wachstumskrise", refs: ["ID212016300"] },
      { text: "Neue Rohstoffpartnerschaften (Australien, Indonesien, Mongolei, Kasachstan u.a.); mehr Engagement in Afrika statt nur Reaktion auf China", refs: ["ID216002300", "ID216002700"] },
      { text: "Export nach China stützt Löhne; Schutz der exportorientierten Automobilindustrie über EU-Verhandlungen", refs: ["ID216902300", "ID216903600"] },
      { text: "Maritime Wirtschaft, Binnenschifffahrt und Häfen als zentrale Exportinfrastruktur", refs: ["ID21709200", "ID217403300", "ID217403600"] },
      { text: "Klimaschutz-Investitionen als Chance auf dem Weltmarkt; internationale Wasserstoff-Partnerschaften (Norwegen, Dänemark)", refs: ["ID217106500", "ID215909300"] },
      { text: "Internationale Koordination: Eskalation von Handelskonflikten vermeiden (US-Vergeltung gegen Digitalabgaben), globale Mindeststeuer abstimmen, Zoll-/Einfuhrprozesse digitalisieren und EU-harmonisieren", refs: ["ID213616600", "ID214016800", "ID213414900"] },
      { text: "Geschäftsreiseverkehr und Messen als Wirtschaftsfaktor (Opt-out zur Individualbesteuerung)", refs: ["ID216905700"] },
    ],
  },
  {
    feld: "Wirtschaft",
    aspekt: "Außenhandel",
    partei: "GRÜNE",
    bullets: [
      { text: "Handel an soziale, ökologische und menschenrechtliche Standards binden; faire, regelbasierte Politik, modernisierte Partnerschaftsabkommen mit Afrika", refs: ["ID211002300", "ID213204600"] },
      { text: "Europäische Harmonisierung und Einigkeit als Wettbewerbsvorteil und in Handelsverhandlungen (geopolitischer Druck seit 2022)", refs: ["ID211001700", "ID212016000"] },
      { text: "Binnenmarkt ist existenziell für die Exportwirtschaft — scharfe Warnung vor „Dexit“/EU-Austritt (Wohlstandsverluste, Zölle)", refs: ["ID213800400", "ID215101100", "ID215513500"] },
      { text: "Schutz vor unfairem Wettbewerb und Dumping (subventionierter China-Stahl) durch Ausgleichs-/Schutzzölle und CBAM", refs: ["ID213413100", "ID214005000", "ID217400900", "ID218008400"] },
      { text: "Sorge um die Autoindustrie: Marktanteilsverluste in China, Exportüberschuss wird zu Defizit, chinesische Hersteller als Konkurrenz", refs: ["ID213411700", "ID214505700", "ID216902200", "ID21708200"] },
      { text: "Klassische Investitionsschutzabkommen kritisch (Klagerechte/Rechtsunsicherheit gegenüber dem Staat)", refs: ["ID214016500"] },
      { text: "Pro Freihandelsabkommen (Mercosur, Indien), aber den Binnenmarkt nicht vernachlässigen", refs: ["ID215701000"] },
      { text: "Internationaler Handel als Grundlage des Wohlstands — durch AfD-Politik gefährdet", refs: ["ID218008600"] },
      { text: "Europäische Kapitalmärkte stärken (Unternehmen weichen zur Finanzierung in die USA aus)", refs: ["ID213800900"] },
      { text: "„Made in Europe“-Vorgaben im maritimen Sektor als überlebensnotwendig", refs: ["ID217403100"] },
    ],
  },
  {
    feld: "Wirtschaft",
    aspekt: "Außenhandel",
    partei: "LINKE",
    bullets: [
      { text: "EU-Handelsabkommen (Afrika/Asien, CEPAs) als ausbeuterisch und neokolonial kritisiert — Forderung nach fairer Partnerschaft auf Augenhöhe", refs: ["ID213204700", "ID216002200"] },
      { text: "Gegen Handelskriege und aggressive Zollpolitik; Entspannung und Kooperation mit China statt Konfrontation", refs: ["ID214012300"] },
      { text: "Diagnose Absatz- statt Produktivitätsproblem; längere Arbeitszeiten helfen nicht gegen China-Konkurrenz und US-Strafzölle", refs: ["ID215700600"] },
      { text: "Kritik an der Abschaffung des Berichts über Industrie-, Handels- und Außenhandelskammern", refs: ["ID215514500"] },
      { text: "Seehäfen zentral für den Außenhandel (zwei Drittel laufen darüber)", refs: ["ID217403200"] },
    ],
  },
  {
    feld: "Wirtschaft",
    aspekt: "Außenhandel",
    partei: "SPD",
    bullets: [
      { text: "Einheitliche europäische Regeln statt nationaler Alleingänge; faire, selbstbewusst durchgesetzte Wettbewerbsbedingungen", refs: ["ID211002700", "ID217806000"] },
      { text: "Faire Welthandelsregeln und Schutz vor Dumping/Marktüberschwemmung (China, Indien, Russland); geschützter europäischer Binnenmarkt", refs: ["ID213413400", "ID216903100", "ID218008700"] },
      { text: "China: drohendes Rekordhandelsdefizit, strategische Nutzung der Marktmacht; konzertierte europäische Reaktion auf Subventionen", refs: ["ID214012100", "ID215700700"] },
      { text: "Sorge um die Autoindustrie: chinesische Elektromobilität führt zu Absatzproblemen deutscher Hersteller", refs: ["ID213412100"] },
      { text: "Kritik an Zollpolitik als Belastung der Industrie; bessere Zollabkommen", refs: ["ID212016100"] },
      { text: "Geopolitische Verflechtung von Handel, Wirtschaft und Sicherheit; Export- und Rohstoffkontrolle als Verhandlungsmittel", refs: ["ID214012600"] },
      { text: "Offenes, exportorientiertes Modell essenziell für den Mittelstand; Kritik an AfD-Abschottung und Grenzschließungen", refs: ["ID215513600"] },
      { text: "Handelsabkommen diversifizieren (Kanada, Australien, Indien) für Resilienz und Unabhängigkeit von Großmächten", refs: ["ID215700300", "ID217314600"] },
      { text: "Rohstoffpolitik über Partnerschaften auf Augenhöhe ausweiten", refs: ["ID216002100"] },
      { text: "Seehäfen und Hafeninfrastruktur als zentrale Umschlagplätze für Exporte", refs: ["ID217403500"] },
      { text: "Offenheit für den europäischen Markt ohne protektionistische Bezeichnungsverbote", refs: ["ID213713800"] },
      { text: "Warnung: niedrigere Arbeitsbedingungen im Ausland führen zu mehr Billigimporten statt heimischer Produktion", refs: ["ID215016900"] },
      { text: "Luftverkehrsteuer senken zur Stärkung der Wettbewerbsfähigkeit des Luftverkehrsstandorts", refs: ["ID218014200"] },
    ],
  },
];

const upd = db.prepare(
  `UPDATE partei_aspekt_gold SET synthese_json=? WHERE feld=? AND aspekt=? AND partei=?`,
);

let ok = 0;
for (const c of PILOT) {
  // Sicherstellen, dass alle refs auch in den Roh-Punkten existieren (sonst kein Beleg/Link)
  const row = db
    .prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`)
    .get(c.feld, c.aspekt, c.partei) as { punkte_json: string } | undefined;
  if (!row) {
    console.log(`! Zelle fehlt: ${c.aspekt} / ${c.partei}`);
    continue;
  }
  const known = new Set((JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id));
  const total = c.bullets.reduce((n, b) => n + b.refs.length, 0);
  const missing = c.bullets.flatMap((b) => b.refs).filter((r) => !known.has(r));
  if (missing.length) console.log(`  ⚠ ${c.partei}: ${missing.length} unbekannte refs: ${missing.join(", ")}`);
  const r = upd.run(JSON.stringify(c.bullets), c.feld, c.aspekt, c.partei);
  ok += r.changes;
  console.log(`  ✓ ${c.partei}: ${c.bullets.length} Stichpunkte aus ${known.size} Reden (${total} Belege zugeordnet)`);
}
console.log(`\n${ok}/${PILOT.length} Zellen aktualisiert.`);
db.close();
