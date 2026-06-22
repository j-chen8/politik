/**
 * MANUELL (Claude Code, kein LLM) — Sach-Votes → Gold-Aspekt (Punkt) innerhalb ihres Primärfeldes.
 *
 * Quelle der Zuordnung: ICH habe jeden Sach-Vote (verfahren=0) anhand von DS-Unterthema,
 * spezifischen Tags und Kerninhalt gelesen (/tmp/votes.txt) und dem passenden kuratierten
 * Aspekt aus partei_aspekt_gold zugeordnet. Votes ohne passenden Aspekt (Haushalts-/Einzelpläne,
 * reine Verfahren, Themen ohne kuratierten Aspekt) bleiben bewusst ohne Aspekt (nur Feld-Ebene).
 *
 * Tabelle vote_aspekt(vote_id, feld, aspekt). feld = Primärfeld aus vote_themenfeld.
 * Validierung: jeder (feld, aspekt) muss in partei_aspekt_gold existieren, sonst Abbruch-Warnung.
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");

// vote_id → Gold-Aspekt (Aspekt muss zum Primärfeld des Votes gehören)
const ZUORDNUNG: Record<number, string> = {
  // ===== Arbeit und Beschäftigung =====
  280: "Tarifbindung", 445: "Bürgergeld / Grundsicherung", 516: "Arbeitszeit", 644: "Mindestlohn",
  // ===== Außenpolitik und internationale Beziehungen =====
  473: "Globaler Süden", 478: "EU-Außenpolitik & Souveränität", 526: "Ukraine-Unterstützung",
  651: "Ukraine-Unterstützung", 708: "Russland-Sanktionen", 712: "NATO",
  // ===== Bildung und Erziehung =====
  30: "Frühkindliche Bildung / Kita", 290: "Frühkindliche Bildung / Kita",
  398: "Frühkindliche Bildung / Kita", 431: "Frühkindliche Bildung / Kita",
  // ===== Energie =====
  219: "Heizen / Wärme", 408: "CO₂-Preis / Klimageld", 417: "Wasserstoff", 426: "Heizen / Wärme",
  477: "Heizen / Wärme", 487: "Erneuerbare Energien", 490: "Erneuerbare Energien", 496: "Fossiles Gas",
  521: "CO₂-Preis / Klimageld", 542: "Erneuerbare Energien", 575: "CO₂-Preis / Klimageld",
  597: "CO₂-Preis / Klimageld", 636: "Strompreise / Netzentgelte", 653: "Heizen / Wärme",
  669: "Strompreise / Netzentgelte", 694: "Kernenergie", 698: "Strompreise / Netzentgelte", 776: "Fossiles Gas",
  // ===== Europapolitik und Europäische Union =====
  411: "EU-Finanzen / Eigenmittel", 723: "EU-Finanzen / Eigenmittel", 739: "EU-Finanzen / Eigenmittel",
  425: "Entscheidungsregeln", 480: "Entscheidungsregeln", 508: "Entscheidungsregeln", 652: "Entscheidungsregeln",
  // ===== Gesellschaftspolitik, soziale Gruppen =====
  314: "Parität / Frauenrechte", 618: "Familienförderung",
  // ===== Gesundheit =====
  40: "Krankenhausfinanzierung (Fallpauschalen)", 260: "Krankenhausfinanzierung (Fallpauschalen)",
  106: "Krankenhausfinanzierung (Fallpauschalen)", 773: "Krankenhausfinanzierung (Fallpauschalen)",
  155: "Krankenhausfinanzierung (Fallpauschalen)", 272: "Krankenhausfinanzierung (Fallpauschalen)",
  464: "Krankenhausfinanzierung (Fallpauschalen)", 173: "Arzneimittelversorgung",
  407: "Pflegepersonal", 583: "Pflegefinanzierung", 683: "Pflegepersonal",
  511: "Organspende", 699: "Organspende", 585: "Krankenversicherung", 681: "Krankenversicherung",
  672: "Cannabis / Drogen", 785: "Arzneimittelversorgung",
  // ===== Innere Sicherheit =====
  433: "Extremismusbekämpfung", 465: "Extremismusbekämpfung", 718: "Strafen verschärfen",
  // ===== Kultur =====
  432: "Erinnerungskultur",
  // ===== Landwirtschaft und Ernährung =====
  25: "Wolf / Jagd", 740: "Wolf / Jagd", 128: "Wolf / Jagd", 143: "Wolf / Jagd",
  83: "EU-Agrarpolitik (GAP)", 762: "EU-Agrarpolitik (GAP)", 447: "EU-Agrarpolitik (GAP)", 606: "EU-Agrarpolitik (GAP)",
  395: "Pestizide / Pflanzenschutz", 517: "Pestizide / Pflanzenschutz",
  502: "Gentechnik / Züchtung", 634: "Gentechnik / Züchtung",
  570: "Erzeugerpreise / Marktmacht", 577: "Ernährungssicherung als Staatsziel", 603: "Ernährungssicherung als Staatsziel",
  // ===== Medien, Kommunikation und Informationstechnik =====
  500: "Datenschutz (DSGVO)", 709: "Breitband- / Netzausbau",
  // ===== Migration und Aufenthaltsrecht =====
  81: "Rückführungen / Abschiebungen", 412: "Rückführungen / Abschiebungen", 404: "EU-Verteilung (GEAS)",
  484: "Grenzkontrollen", 495: "Legale Fluchtwege", 588: "Legale Fluchtwege", 667: "Legale Fluchtwege",
  703: "Legale Fluchtwege", 654: "Legale Fluchtwege", 595: "Familiennachzug (subsidiär)",
  621: "Einbürgerung / Staatsangehörigkeit", 645: "Fachkräfteeinwanderung",
  // ===== Politisches Leben, Parteien =====
  295: "Verfassungsschutz", 406: "Wahlrecht / Bundestagsgröße", 598: "Wahlrecht / Bundestagsgröße",
  506: "Demokratieförderung", 631: "Demokratieförderung",
  // ===== Raumordnung, Bau- und Wohnungswesen =====
  402: "Leerstand", 423: "Mietpreisbremse / Mietendeckel", 520: "Mietpreisbremse / Mietendeckel",
  592: "Mietpreisbremse / Mietendeckel", 657: "Mietpreisbremse / Mietendeckel",
  476: "Baurecht / Deregulierung", 561: "Baurecht / Deregulierung", 566: "Baurecht / Deregulierung",
  619: "Grundsteuer-Umlage auf Mieter",
  // ===== Recht =====
  224: "Justiz & Rechtsstaat", 486: "Justiz & Rechtsstaat", 757: "Justiz & Rechtsstaat",
  451: "Justiz & Rechtsstaat", 677: "Justiz & Rechtsstaat", 686: "Justiz & Rechtsstaat",
  489: "Strafrecht (Verschärfen vs. Entlasten)", 505: "Strafrecht (Verschärfen vs. Entlasten)",
  632: "Strafrecht (Verschärfen vs. Entlasten)",
  // ===== Soziale Sicherung =====
  413: "Mindest- / Grundrente", 418: "Bürgergeld / Grundsicherung", 540: "Wer zahlt ein",
  590: "Kapitalgedeckte Vorsorge", 593: "Rentenniveau", 607: "Rentenniveau",
  649: "Bürgergeld / Grundsicherung", 705: "Bürgergeld / Grundsicherung", 725: "Kindergrundsicherung",
  // ===== Sport, Freizeit und Tourismus =====
  547: "Spitzensport", 563: "Olympia-Bewerbung",
  // ===== Staat und Verwaltung =====
  381: "Unabhängigkeit der Staatsanwaltschaft", 544: "Bürokratieabbau", 564: "Bürokratieabbau",
  // ===== Umwelt =====
  427: "Kreislaufwirtschaft / Plastik", 492: "Kreislaufwirtschaft / Plastik", 633: "Kreislaufwirtschaft / Plastik",
  437: "Klimaschutz-Grundhaltung", 716: "Klimaschutz-Grundhaltung", 717: "Klimaschutz-Grundhaltung",
  488: "Wasser", 503: "CO₂-Preis / Klimageld", 552: "CO₂-Preis / Klimageld",
  637: "CO₂-Speicherung (CCS/CCU)", 693: "Klimaanpassung / Hochwasser",
  // ===== Verkehr =====
  132: "Schiene ausbauen", 195: "Schiene ausbauen", 322: "Schiene ausbauen", 323: "Schiene ausbauen",
  731: "Schiene ausbauen", 339: "Schiene ausbauen", 457: "Schiene ausbauen",
  416: "Bahnstruktur / Eigentum", 454: "Bahnstruktur / Eigentum", 523: "Bahnstruktur / Eigentum",
  394: "Verbrenner / E-Mobilität", 616: "Deutschlandticket / ÖPNV-Preis", 702: "Deutschlandticket / ÖPNV-Preis",
  // ===== Verteidigung =====
  118: "Wehrpflicht / Wehrdienst", 461: "Wehrpflicht / Wehrdienst", 727: "Wehrpflicht / Wehrdienst",
  458: "Rüstungsindustrie / Beschaffung", 682: "Rüstungsindustrie / Beschaffung", 623: "Auslandseinsätze",
  // ===== Wirtschaft =====
  78: "Energiekosten für die Wirtschaft", 396: "Mittelstand & Handwerk",
  469: "Lieferketten & Rohstoffsicherheit", 472: "Lieferketten & Rohstoffsicherheit",
  656: "Lieferketten & Rohstoffsicherheit", 692: "Lieferketten & Rohstoffsicherheit", 697: "Lieferketten & Rohstoffsicherheit",
  // ===== Wissenschaft, Forschung und Technologie =====
  422: "Zukunftstechnologien",
  // ===== Öffentliche Finanzen, Steuern und Abgaben =====
  99: "Schuldenbremse", 759: "Schuldenbremse", 34: "Schuldenbremse", 276: "Schuldenbremse", 685: "Schuldenbremse",
  261: "Einkommensteuer", 501: "Einkommensteuer", 600: "Einkommensteuer", 615: "Einkommensteuer",
  466: "Kapital- / Unternehmenssteuern", 449: "Kapital- / Unternehmenssteuern", 553: "Kapital- / Unternehmenssteuern",
  498: "Kapital- / Unternehmenssteuern", 267: "Kapital- / Unternehmenssteuern", 745: "Kapital- / Unternehmenssteuern",
  274: "Kapital- / Unternehmenssteuern",
  471: "Familiensplitting", 617: "Erbschaftsteuer",
  409: "Steuerhinterziehung bekämpfen", 555: "Steuerhinterziehung bekämpfen",
  522: "Übergewinnsteuer", 605: "EU-Finanzen",
  358: "Steuervereinfachung / Bürokratie", 450: "Steuervereinfachung / Bürokratie", 468: "Steuervereinfachung / Bürokratie",
};

const primFeld = db.prepare("SELECT feld FROM vote_themenfeld WHERE vote_id=? AND primaer=1");
const aspektExists = db.prepare("SELECT 1 FROM partei_aspekt_gold WHERE feld=? AND aspekt=? LIMIT 1");

db.exec(`
  DROP TABLE IF EXISTS vote_aspekt;
  CREATE TABLE vote_aspekt (
    vote_id INTEGER PRIMARY KEY,
    feld    TEXT NOT NULL,
    aspekt  TEXT NOT NULL
  );
  CREATE INDEX idx_va_feld_aspekt ON vote_aspekt(feld, aspekt);
`);
const ins = db.prepare("INSERT INTO vote_aspekt (vote_id, feld, aspekt) VALUES (?,?,?)");

let ok = 0;
const fehler: string[] = [];
const tx = db.transaction(() => {
  for (const [vidStr, aspekt] of Object.entries(ZUORDNUNG)) {
    const vid = Number(vidStr);
    const pf = primFeld.get(vid) as any;
    if (!pf) { fehler.push(`vote ${vid}: kein Primärfeld in vote_themenfeld`); continue; }
    if (!aspektExists.get(pf.feld, aspekt)) {
      fehler.push(`vote ${vid}: Aspekt "${aspekt}" existiert NICHT im Feld "${pf.feld}"`); continue;
    }
    ins.run(vid, pf.feld, aspekt);
    ok++;
  }
});
tx();

console.log(`Zuordnungen geschrieben: ${ok} / ${Object.keys(ZUORDNUNG).length}`);
if (fehler.length) { console.log(`\n⚠ FEHLER (${fehler.length}):`); fehler.forEach((f) => console.log("  " + f)); }

const sach = db.prepare("SELECT COUNT(DISTINCT vote_id) n FROM vote_themenfeld WHERE primaer=1 AND verfahren=0").get() as any;
console.log(`\nSach-Votes gesamt: ${sach.n} → mit Aspekt: ${ok} (${Math.round((ok / sach.n) * 100)}%), ohne Aspekt (feldweit): ${sach.n - ok}`);

console.log(`\n=== Votes pro Aspekt (Top 25) ===`);
for (const r of db.prepare("SELECT feld, aspekt, COUNT(*) n FROM vote_aspekt GROUP BY feld, aspekt ORDER BY n DESC LIMIT 25").all() as any[])
  console.log(`  ${String(r.n).padStart(2)}  ${r.aspekt}  [${r.feld}]`);
