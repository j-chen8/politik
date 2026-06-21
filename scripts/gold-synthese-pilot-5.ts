/**
 * MANUELLE Synthese (Claude Code, kein LLM) — Aspekt „Rolle des Staates /
 * Wirtschaftsordnung" (Matrix-Platz 1, sehr dicht). Index-basiert; beide Varianten.
 *   npx tsx scripts/gold-synthese-pilot-5.ts
 */
import Database from "better-sqlite3";
const db = new Database("politik.db");
type B = { text: string; idx: number[] };
type Cell = { aspekt: string; partei: string; lang: B[]; kurz: B[] };
const FELD = "Wirtschaft";
const ASP = "Rolle des Staates / Wirtschaftsordnung";

const CELLS: Cell[] = [
  { aspekt: ASP, partei: "AfD",
    lang: [
      { text: "Grundhaltung: weniger Staat, mehr Markt — soziale Marktwirtschaft (Ludwig Erhard) statt Planwirtschaft, Regulierung und Bevormundung; Deregulierung, schlanker Staat, unternehmerische Freiheit", idx: [0,1,2,3,5,9,10,11,13,18,19,21,25,26,27,30,31,32,33,38,41,42,43,46,47,52,53,56,58,59,62,64,65,67,68,69,70,71,73,74,75,76,77,78,86,87,88,89,91,92,93,95,98,99,102,103,107,110,113,114,115,117] },
      { text: "Gegen Umverteilung und Vermögens-/Substanzsteuer; Schutz von Privateigentum und Vermögensbildung", idx: [6,7,8,20,57,60,81,82,83,84,85,105,106] },
      { text: "Gegen staatliche Lenkung der Energiewende — Technologieoffenheit statt Verbote, CO₂-Bepreisung/CBAM ablehnen", idx: [12,14,23,28,29,36,37,39,40,45,63,66,79,90,94,97,101,108,112,116] },
      { text: "Steuersystem vereinfachen und entlasten; Ausgaben kürzen und Schuldenbremse einhalten statt Neuverschuldung", idx: [4,15,34,35,48,96,109] },
      { text: "Gegen EU-Überregulierung — nationale Handlungsfreiheit und Souveränität", idx: [50,54,55,61,72,111] },
      { text: "Gegen staatliche Preisregulierung und Preisaufsicht — freie Marktpreise", idx: [16,17,24] },
      { text: "Anklage der Deindustrialisierung durch die Politik; staatsferne Instrumente (Bitcoin statt digitaler Euro), Schutz regionaler Produktion und verlässliche Infrastruktur gefordert", idx: [22,44,49,51,80,100,104] },
    ],
    kurz: [
      { text: "Weniger Staat, mehr Markt — soziale Marktwirtschaft statt Planwirtschaft, Regulierung, Bevormundung und Preiseingriffen; Deregulierung und schlanker Staat", idx: [0,1,2,3,5,9,10,11,13,16,17,18,19,21,24,25,26,27,30,31,32,33,38,41,42,43,46,47,52,53,56,58,59,62,64,65,67,68,69,70,71,73,74,75,76,77,78,86,87,88,89,91,92,93,95,98,99,102,103,107,110,113,114,115,117] },
      { text: "Gegen Umverteilung und Vermögens-/Substanzsteuer; Schutz von Privateigentum", idx: [6,7,8,20,57,60,81,82,83,84,85,105,106] },
      { text: "Gegen staatliche Lenkung der Energiewende — Technologieoffenheit statt Verbote, CO₂-Bepreisung/CBAM ablehnen", idx: [12,14,23,28,29,36,37,39,40,45,63,66,79,90,94,97,101,108,112,116] },
      { text: "Steuern senken/vereinfachen und Ausgaben kürzen statt Neuverschuldung; gegen EU-Überregulierung (nationale Autonomie); Anklage der Deindustrialisierung", idx: [4,15,22,34,35,44,48,49,50,51,54,55,61,72,80,96,100,104,109,111] },
    ] },
  { aspekt: ASP, partei: "CDU/CSU",
    lang: [
      { text: "Soziale Marktwirtschaft: Staat setzt klaren Ordnungsrahmen, überreguliert nicht; Vertrauen in den Markt statt Planwirtschaft und Verbote", idx: [1,5,6,8,10,11,12,13,19,21,22,25,27,29,35,37,49,51,52,53,54,55,59,61,62,63] },
      { text: "Ermöglichender, handlungsfähiger und moderner Staat (nicht bloß schlank); Modernisierung, Staat als Partner, Experimentierkultur", idx: [28,30,31,32,50,67] },
      { text: "Standort wettbewerbsfähig machen (Steuern, Energie, Bürokratie); Wachstumsimpulse und Entlastung statt Steuererhöhungen — seriös gegenfinanziert", idx: [0,2,3,4,14,64,65] },
      { text: "Besteuerung nach Leistungsfähigkeit verteidigen (gegen Flat Tax); moderate Erbschaftsteuer, gegen Vermögensteuer und Vergesellschaftung", idx: [7,16,17,18,36,44,45,47,58] },
      { text: "Staat flankiert gezielt (Leitplanken, Rohstofffonds, Resilienz, Souveränität); Klimaschutz mit marktwirtschaftlichen Instrumenten (Emissionshandel), proaktiv für Resilienz", idx: [9,20,23,24,40,41,56,57,66] },
      { text: "Verhältnismäßige Regulierung von Finanzmärkten/Banken; Staat schafft Stabilität und ermöglicht private Investitionen", idx: [33,34,42,43] },
      { text: "Staat schützt Wettbewerb und Fairness, unterbindet Marktmissbrauch; Sozialpartnerschaft stärken, ohne Tarifpartner zu ersetzen; europäische Integration", idx: [15,26,38,39,48] },
      { text: "Wirtschaftliche Leistungsfähigkeit als Grundlage für Sozialstaat und Staatsleistungen", idx: [46,60] },
    ],
    kurz: [
      { text: "Soziale Marktwirtschaft: Staat setzt Ordnungsrahmen statt Planwirtschaft/Verboten — aber ermöglichender, handlungsfähiger und moderner Staat, nicht bloß schlank", idx: [1,5,6,8,10,11,12,13,19,21,22,25,27,28,29,30,31,32,35,37,49,50,51,52,53,54,55,59,61,62,63,67] },
      { text: "Standort stärken (Entlastung, Bürokratie, Energie — seriös gegenfinanziert) und gezielt flankieren (Investitionen, Resilienz, Rohstoffe, Emissionshandel)", idx: [0,2,3,4,9,14,20,23,24,40,41,56,57,64,65,66] },
      { text: "Besteuerung nach Leistungsfähigkeit verteidigen (gegen Flat Tax, Vermögensteuer, Vergesellschaftung)", idx: [7,16,17,18,36,44,45,47,58] },
      { text: "Verhältnismäßige Finanzmarktregulierung; Wettbewerb, Fairness und Sozialpartnerschaft schützen; wirtschaftliche Leistungsfähigkeit als Grundlage des Sozialstaats", idx: [15,26,33,34,38,39,42,43,46,48,60] },
    ] },
  { aspekt: ASP, partei: "GRÜNE",
    lang: [
      { text: "Handlungsfähiger, intelligenter Staat (nicht schlank) mit aktiven Investitionen in Infrastruktur und Transformation (Staatskapital)", idx: [1,8,10,11] },
      { text: "Industriepolitische Lenkung und Planungssicherheit; klare staatliche Rahmung, gezielte bedingte Förderung statt Mitnahmeeffekte", idx: [3,6,13,14,20] },
      { text: "Gerechte, progressive Besteuerung und Schließen von Steuerlücken; Warnung vor Schwächung des Staates durch Steuerausfälle", idx: [2,7,9,16,17] },
      { text: "Marktwirtschaftliche Instrumente (EU-Emissionshandel) statt Verbote; mehr Markt und Wettbewerb (gegen Großkraftwerk-Bevorzugung)", idx: [0,21,22] },
      { text: "Staat soll Klima-/Umweltrisiken im Finanzsektor regulieren und private Märkte stärker kontrollieren (Benchmark); Herstellerverantwortung statt Abwälzung auf Verbraucher", idx: [4,12,19] },
      { text: "Kritik an Subventionen ohne soziale/Klima-Kriterien, an intransparenten Verfahren und am Unterschreiten von EU-Vorgaben", idx: [5,15,18] },
    ],
    kurz: [
      { text: "Handlungsfähiger, investierender Staat (nicht schlank) mit industriepolitischer Lenkung und Planungssicherheit; gezielte bedingte Förderung", idx: [1,3,6,8,10,11,13,14,20] },
      { text: "Gerechte, progressive Besteuerung und Steuerlücken schließen; Warnung vor Schwächung des Staates durch Steuerausfälle", idx: [2,7,9,16,17] },
      { text: "Marktwirtschaftliche Instrumente (ETS) statt Verbote; Klima-/Umweltrisiken und private Märkte regulieren (Herstellerverantwortung); Kritik an kriterienloser Förderung und intransparenten Verfahren", idx: [0,4,5,12,15,18,19,21,22] },
    ] },
  { aspekt: ASP, partei: "LINKE",
    lang: [
      { text: "Aktive staatliche Industriepolitik mit strategischer Planung und Planungssicherheit statt Laissez-faire und Marktgläubigkeit", idx: [6,9,13,16,17,18,22] },
      { text: "Gestaltender Staat für gerechte Klimapolitik; Innovation aktiv am Gemeinwohl ausrichten", idx: [1,14] },
      { text: "Umverteilung und progressive Steuern (Soli); gegen Steuersenkungen, Sozialstaat verteidigen", idx: [3,4,7,8,20,21] },
      { text: "Öffentliche Daseinsvorsorge statt privater Monopole und Renditegarantien; gegen Deregulierung/Privatisierung; öffentliche Förderbanken", idx: [5,11,12,23] },
      { text: "Staat lenkt strategische Industrien (Allgemeinwohl über Einzelinteressen, keine Gewinnprivatisierung); strategische Rohstoffverantwortung", idx: [2,10] },
      { text: "Wirtschaftssystem, das Menschen einschließt statt nur Profit; staatliche Preisdeckel (Miete/Heizkosten); transparente Vergabeverfahren", idx: [0,15,19] },
    ],
    kurz: [
      { text: "Aktive staatliche Industriepolitik und Planung statt Laissez-faire; Staat lenkt strategische Industrien am Gemeinwohl (Rohstoffe, keine Gewinnprivatisierung)", idx: [2,6,9,10,13,16,17,18,22] },
      { text: "Umverteilung und progressive Steuern, Sozialstaat verteidigen; öffentliche Daseinsvorsorge statt Privatisierung/Renditegarantien, Förderbanken", idx: [3,4,5,7,8,11,12,20,21,23] },
      { text: "Gestaltender Staat für gerechte Klimapolitik und gemeinwohlorientierte Innovation; Preisdeckel (Miete/Heizkosten); System, das Menschen statt Profit einschließt; transparente Vergabe", idx: [0,1,14,15,19] },
    ] },
  { aspekt: ASP, partei: "SPD",
    lang: [
      { text: "Handlungsfähiger, aktiver Staat als Partner (Gegenpol zum Rückzug); investierende Finanzpolitik und Sondervermögen; klare Richtung und Verlässlichkeit", idx: [2,3,8,11,25] },
      { text: "Aktive Industriepolitik: EU-Industriestrategie, heimische Grundstoffproduktion, Stahl (auch Staatsbeteiligung), energieintensive Branchen; Eingriff bei Marktversagen und Krisen", idx: [7,13,16,18,19,20,21,22,24] },
      { text: "Rohstoffpolitik staatlich begleiten (Abnahmeverträge, Mindestpreise, Resilienz); Versorgungssicherheit als Bekenntnis zum Industriestandort", idx: [0,12,17] },
      { text: "Progressive Besteuerung nach Leistungsfähigkeit verteidigen (Soli); Kritik an AfD-Steuerpolitik als Lobbyismus", idx: [1,4,9] },
      { text: "Staat schafft Rahmen und nutzt Steuergestaltung für Infrastruktur und Wettbewerbsfähigkeit; verhältnismäßige Bankenregulierung, Europa als stabile Investitionsbasis", idx: [6,14,15,23,26] },
      { text: "Gegen pauschale staatliche Preisfestsetzung — zielgenaue Marktlösungen bevorzugt", idx: [5,10] },
    ],
    kurz: [
      { text: "Handlungsfähiger, aktiver Staat als Partner mit investierender Finanzpolitik (Sondervermögen) und aktiver Industriepolitik (EU-Strategie, Stahl, Grundstoffe, Rohstoffe, Eingriff bei Marktversagen)", idx: [0,2,3,7,8,11,12,13,16,17,18,19,20,21,22,24,25] },
      { text: "Progressive Besteuerung nach Leistungsfähigkeit verteidigen (Soli; Kritik an AfD-Steuerpolitik); Staat schafft Rahmen für Infrastruktur/Wettbewerbsfähigkeit, verhältnismäßige Bankenregulierung", idx: [1,4,6,9,14,15,23,26] },
      { text: "Gegen pauschale staatliche Preisfestsetzung — zielgenaue Marktlösungen", idx: [5,10] },
    ] },
];

const upd = db.prepare(`UPDATE partei_aspekt_gold SET synthese_json=?, synthese_kurz_json=? WHERE feld=? AND aspekt=? AND partei=?`);
function resolve(rede: string[], bullets: B[], label: string) {
  const used = bullets.flatMap((b) => b.idx);
  const dup = used.filter((i, k) => used.indexOf(i) !== k);
  const missing = rede.map((_, i) => i).filter((i) => !used.includes(i));
  const bad = used.filter((i) => i < 0 || i >= rede.length);
  if (dup.length) console.log(`    ⚠ ${label}: doppelt ${[...new Set(dup)].join(",")}`);
  if (missing.length) console.log(`    ⚠ ${label}: nicht zugeordnet ${missing.join(",")}`);
  if (bad.length) console.log(`    ⚠ ${label}: ungültig ${bad.join(",")}`);
  return bullets.map((b) => ({ text: b.text, refs: b.idx.map((i) => rede[i]) }));
}
let ok = 0;
for (const c of CELLS) {
  const row = db.prepare(`SELECT punkte_json FROM partei_aspekt_gold WHERE feld=? AND aspekt=? AND partei=?`).get(FELD, c.aspekt, c.partei) as { punkte_json: string } | undefined;
  if (!row) { console.log(`! Zelle fehlt: ${c.partei}`); continue; }
  const rede = (JSON.parse(row.punkte_json) as any[]).map((p) => p.rede_id as string);
  const lang = resolve(rede, c.lang, `${c.partei} lang`);
  const kurz = resolve(rede, c.kurz, `${c.partei} kurz`);
  upd.run(JSON.stringify(lang), JSON.stringify(kurz), FELD, ASP, c.partei);
  ok++;
}
console.log(`${ok}/${CELLS.length} Zellen (Rolle des Staates) aktualisiert.`);
db.close();
