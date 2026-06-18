/**
 * Hand-korrigierte verbatim-Belege (Claude Code, manuell aus den Programm-PDFs gelesen).
 * Ersetzt die 51 leicht editierten/zusammengefügten Beleg-Zitate durch den echten
 * Programm-Wortlaut (einzelner, zusammenhängender Satz je Beleg) und re-verifiziert.
 *   npx tsx scripts/wahlprogramm-fix-belege.ts          # Vorschau (prüft Verifikation)
 *   npx tsx scripts/wahlprogramm-fix-belege.ts --write
 */
import Database from "better-sqlite3"; import fs from "fs"; import path from "path";
const WRITE = process.argv.includes("--write");
const db = new Database("politik.db");
const KEY: Record<string, string> = { "CDU/CSU": "cdu_csu", SPD: "spd", "GRÜNE": "gruene", LINKE: "linke", AfD: "afd" };
const cache: Record<string, any[]> = {};
const pages = (k: string) => (cache[k] ??= JSON.parse(fs.readFileSync(`data/wahlprogramme/${k}.pages.json`, "utf8")));
const norm = (s: string) => s.normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "").toLowerCase();
function verify(k: string, zitat: string): number | null {
  const z = norm(zitat).slice(0, 70); if (z.length < 30) return null;
  for (const pg of pages(k)) if (norm(pg.text).includes(z)) return pg.page;
  return null;
}
// {partei, feld, contains: distinktiver Teilstring des ALTEN Zitats, neu: echter Wortlaut}
const FIX: { p: string; f: string; c: string; neu: string }[] = [
  { p:"GRÜNE", f:"Verteidigung", c:"nukleare Teilhabe im Rahmen der NATO", neu:"In einer Zeit, in der Putins Russland bestehende Abrüstungsinitiativen zerstört und mit seinen nuklearen Fähigkeiten droht, ist die nukleare Teilhabe im Rahmen der NATO eine essenzielle Säule unserer Sicherheit." },
  { p:"GRÜNE", f:"Arbeit und Beschäftigung", c:"betriebliche Mitbestimmung", neu:"Wir unterstützen die Gründung von neuen Betriebsräten und ermöglichen Online-Betriebsratswahlen." },
  { p:"SPD", f:"Außenpolitik und internationale Beziehungen", c:"ersten deutschen China-Strategie", neu:"Die SPD unterstützt die Umsetzung der ersten deutschen China-Strategie und setzt sich für eine europäisch abgestimmte China-Politik ein. In der EU definieren wir China als Partner, Wettbewerber und Systemrivalen." },
  { p:"SPD", f:"Außenpolitik und internationale Beziehungen", c:"zügige Aufnahme der westlichen Balkanstaaten", neu:"Wir setzen uns für eine zügige Aufnahme der westlichen Balkanstaaten ein. Durch spürbare Fortschritte im Erweiterungsprozess, wie etwa dem Zugang zum gemeinsamen Binnenmarkt, sollen die Menschen spüren, dass sich der Weg in die EU lohnt." },
  { p:"SPD", f:"Bildung und Erziehung", c:"kostenfreie Bildung von der Kita an", neu:"Zudem setzen wir uns für eine kostenfreie Bildung von der Kita an ein." },
  { p:"SPD", f:"Bildung und Erziehung", c:"Reform des BAföG", neu:"Zu wenige Studierende profitieren derzeit vom BAföG. Daher sollen für uns schrittweise mehr Studierende einen Anspruch haben. Langfristig wollen wir das BAföG elternunabhängiger machen. Eine schrittweise Rückkehr zum Vollzuschuss streben wir an." },
  { p:"LINKE", f:"Bildung und Erziehung", c:"Kitaqualitätsgesetz", neu:"Wir fordern daher ein Kitaqualitätsgesetz, das Kinder und Beschäftigte in den Mittelpunkt stellt und den Rechtsanspruch auf einen Kita-Platz umsetzt." },
  { p:"LINKE", f:"Bildung und Erziehung", c:"BAföG für alle", neu:"Die Linke fordert, ein BAföG für alle, das heißt: eltern-, alters- und herkunftsunabhängig, existenzsichernd, unbefristet und als Vollzuschuss." },
  { p:"LINKE", f:"Bildung und Erziehung", c:"solidarische Ausbildungsumlage", neu:"Solidarische Ausbildungsumlage: Betriebe, die nicht ausbilden, sollen in einen Fonds einzahlen, um Ausbildungsplätze und Verbundausbildungen für andere Betriebe zu finanzieren." },
  { p:"LINKE", f:"Energie", c:"Energieunabhängigkeit durch öffentliches Eigentum", neu:"Energieunabhängigkeit durch öffentliches Eigentum: Der größte Teil unserer zukünftigen Energieversorgung muss erst noch gebaut werden. Staat und Kommunen sollen sich stark am Aufbau der erneuerbaren Energien beteiligen, auch um so große Teile der Energieproduktion in die öffentliche Hand zurückzuholen." },
  { p:"LINKE", f:"Energie", c:"Kohleausstieg muss bis 2030", neu:"Dem Ausstieg aus Atom und Kohle muss ein Ausstieg aus der Verbrennung von fossilem Erdgas folgen. Die Linke will dafür ein Erdgasausstiegsgesetz mit verbindlichem Ausstiegspfad und sozialer Absicherung betroffener Beschäftigter." },
  { p:"AfD", f:"Entwicklungspolitik", c:"Stärkung der Sachleistungen", neu:"Eine lückenlose Kontrolle über die Verwendung der bereitgestellten Mittel ist die Grundlage jeder Entwicklungszusammenarbeit." },
  { p:"GRÜNE", f:"Europapolitik und Europäische Union", c:"Verteidigungsetat", neu:"Dafür braucht es verlässliche Finanzierung mit einem Verteidigungsetat, der dauerhaft die in der NATO vereinbarten und auch national definierten Ziele und Bedarfe erfüllt und dafür dauerhaft deutlich mehr als 2 Prozent des Bruttoinlandsprodukts in unsere Sicherheit und Verteidigungsfähigkeit investiert." },
  { p:"SPD", f:"Gesellschaftspolitik, soziale Gruppen", c:"Paritätsgesetz auf den Weg bringen", neu:"Dafür werden wir ein Paritätsgesetz auf den Weg bringen, das bei Wahlen die paritätische Vertretung von Frauen und Männern im Deutschen Bundestag bei Listen- und Direktmandaten sicherstellt." },
  { p:"SPD", f:"Gesellschaftspolitik, soziale Gruppen", c:"Schwangerschaftsabbrüche entkriminalisieren", neu:"Wir werden Schwangerschaftsabbrüche entkriminalisieren und außerhalb des Strafrechts regeln – außer wenn sie gegen oder ohne den Willen der Schwangeren erfolgen." },
  { p:"GRÜNE", f:"Gesundheit", c:"Gemeinwohlorientierung", neu:"Wir wollen daher das Prinzip der Gemeinwohlorientierung stärker etablieren und öffentliche und gemeinnützige Träger fördern, denn eine Profitorientierung birgt Risiken für die Versorgungsqualität und -sicherheit." },
  { p:"GRÜNE", f:"Gesundheit", c:"Pflegeassistenzausbildung", neu:"Wir wollen die Ausbildungsbedingungen verbessern und die Pflegeassistenzausbildung bundesweit einheitlich regeln." },
  { p:"SPD", f:"Gesundheit", c:"vulnerable Gruppen", neu:"Darüber hinaus wollen wir den Zugang zu Versorgungsangeboten für vulnerable Gruppen, beispielsweise durch Gesundheitskioske, weiter ausbauen und unterschiedliche gesundheitliche Bedürfnisse von Frauen und Männern stärker berücksichtigen, die geschlechter- und diversitätssensible Forschung gezielt fördern, um Unwissenheit in Diagnostik, Therapie, Prävention und Rehabilitation zu überwinden." },
  { p:"LINKE", f:"Innere Sicherheit", c:"Kennzeichnungspflicht", neu:"Es muss selbstverständlich werden, dass Polizeibeamt*innen den Bürger*innen individuell erkennbar gegenübertreten." },
  { p:"SPD", f:"Kultur", c:"Künstlersozialkasse", neu:"Die Künstlersozialkasse werden wir ausbauen und die soziale Absicherung grundsätzlich besser auf die besonderen Arbeits- und Lebensbedingungen in der Kunstbranche abstimmen." },
  { p:"SPD", f:"Kultur", c:"Denkmalschutz", neu:"Wir werden den Denkmalschutz stärken, das kulturelle und bauliche Erbe erhalten und die nachhaltige Transformation der Kultur fördern." },
  { p:"SPD", f:"Kultur", c:"NS-Verbrechen", neu:"Wir werden gerade jetzt die Erinnerung an die NS-Verbrechen und die Shoah wachhalten und künftigen Generation vermitteln. Das kulturelle und geschichtliche Erbe der Heimatvertriebenen, (Spät-)Aussiedler und der deutschen Minderheiten in Mittel- und Osteuropa und den GUS-Staaten sowie die Erinnerungskultur an die Geschichte von Flucht, Vertreibung und Deportation wollen wir fördern und erhalten und als Teil der gesamtdeutschen Geschichte begreifen." },
  { p:"GRÜNE", f:"Landwirtschaft und Ernährung", c:"Rettung und Weitergabe von Lebensmitteln", neu:"Und wir werden weiter daran arbeiten, dass immer weniger Lebensmittel, die noch gut sind, weggeschmissen werden." },
  { p:"LINKE", f:"Landwirtschaft und Ernährung", c:"Lebensmittelverschwendung soll verboten", neu:"Lebensmittelverschwendung soll verboten werden. Genießbare Lebensmittel sind an gemeinnützige Organisationen weiterzugeben oder direkt kostenfrei abzugeben. Der Umfang der Lebensmittelabfälle soll bis 2030 halbiert werden." },
  { p:"AfD", f:"Landwirtschaft und Ernährung", c:"gesonderten Lebensmittelbesteuerung", neu:"Deshalb lehnen wir jede Form der gesonderten Lebensmittelbesteuerung ab, wie z. B. eine Fleisch- oder Zuckersteuer." },
  { p:"CDU/CSU", f:"Medien, Kommunikation und Informationstechnik", c:"Bundesamt für Sicherheit in der Informationstechnik", neu:"Deshalb bauen wir das Bundesamt für Sicherheit in der Informationstechnik zu einer Zentralstelle für Fragen der Informations- und Cybersicherheit aus." },
  { p:"AfD", f:"Medien, Kommunikation und Informationstechnik", c:"Abschaffung der DSGVO", neu:"Daher fordert die AfD die Abschaffung der DSGVO und Rückkehr zu einem schlanken, aber effektiven Bundesdatenschutzgesetz." },
  { p:"CDU/CSU", f:"Politisches Leben, Parteien", c:"Verkleinerung des Bundestages", neu:"Wir stehen zur Verkleinerung des Bundestages, nicht aber zur Schwächung des Direktmandats." },
  { p:"SPD", f:"Politisches Leben, Parteien", c:"Paritätsgesetz auf den Weg bringen", neu:"Dafür werden wir ein Paritätsgesetz auf den Weg bringen, das bei Wahlen die paritätische Vertretung von Frauen und Männern im Deutschen Bundestag bei Listen- und Direktmandaten sicherstellt." },
  { p:"SPD", f:"Raumordnung, Bau- und Wohnungswesen", c:"Jung kauft Alt", neu:"Das Programm „Jung kauft Alt“ wollen wir verstetigen und ausbauen. Es hilft besonders der Eigentumsförderung junger Familien, die vor allem in kleinen Städten und Gemeinden auf der Suche nach einem Eigenheim sind." },
  { p:"CDU/CSU", f:"Recht", c:"Beweislastumkehr", neu:"Wir bekämpfen Geldwäsche noch konsequenter und regeln verfassungskonform, dass beim Einziehen von Vermögen unklarer Herkunft künftig eine vollständige Beweislastumkehr gilt." },
  { p:"GRÜNE", f:"Raumordnung, Bau- und Wohnungswesen", c:"Nationalen Aktionsplan", neu:"Deshalb wollen wir den Nationalen Aktionsplan zur Vermeidung und Bewältigung von Wohnungs- und Obdachlosigkeit weiterentwickeln. Ziel bleibt es, Obdach- und Wohnungslosigkeit bis 2030 zu überwinden." },
  { p:"AfD", f:"Recht", c:"Tendenz zum Überwachungsstaat", neu:"Die AfD lehnt die Tendenz zum Überwachungsstaat entschieden ab. Wir stellen uns gegen eine flächendeckende Videoüberwachung als Einschränkung der Freiheit und bestenfalls Symptombekämpfung. Wir lehnen Staatstrojaner und die Vorratsdatenspeicherung ab." },
  { p:"SPD", f:"Soziale Sicherung", c:"Alleinerziehende", neu:"Im nächsten Schritt wollen wir erreichen, dass Familien – insbesondere auch Alleinerziehende – mit eigenem niedrigem Lohneinkommen mit einer Kombination aus Kindergeld, Kinderzuschlag und Wohngeld nicht auf ergänzendes Bürgergeld angewiesen sind." },
  { p:"SPD", f:"Soziale Sicherung", c:"pflegende Angehörige", neu:"Mit einer Familienpflegezeit und einem Familienpflegegeld, ähnlich wie beim Elterngeld, ermöglichen wir die Vereinbarkeit von Pflege und Beruf ohne finanzielle Einbußen." },
  { p:"CDU/CSU", f:"Soziale Sicherung", c:"verbindliche Altersvorsorge für Selbst", neu:"Wir führen eine verbindliche Altersvorsorge für Selbständige ein, die nicht anderweitig ausreichend abgesichert sind." },
  { p:"AfD", f:"Soziale Sicherung", c:"Grundsicherungsempfänger im Alter", neu:"Insbesondere sind die Grundsicherungsempfänger im Alter in diesen Positionen gegenüber Bürgergeldempfängern schlechter gestellt, was wir ändern werden." },
  { p:"GRÜNE", f:"Staat und Verwaltung", c:"Deutschland-App", neu:"Deshalb werden wir gemeinsam mit den Ländern und Kommunen eine plattformunabhängige Deutschland-App auf Open-Source-Basis einführen." },
  { p:"GRÜNE", f:"Umwelt", c:"Holzverbrennung", neu:"Daher setzen wir uns dafür ein, dass bei Holzverbrennung emittiertes CO₂ im Zertifikatehandel voll angerechnet wird." },
  { p:"GRÜNE", f:"Umwelt", c:"Bodenschutzgesetz", neu:"Durch einen stärker vorsorgenden Ansatz und ein neues Bodenschutzgesetz bringen wir den Schutz unserer Böden ins 21. Jahrhundert." },
  { p:"LINKE", f:"Verkehr", c:"Tempolimit von 120 km/h", neu:"Um Menschen und Klima zu schützen, brauchen wir endlich ein Tempolimit von 120 km/h auf Autobahnen und innerorts Tempo 30 – außer auf Hauptverkehrsachsen." },
  { p:"GRÜNE", f:"Verkehr", c:"Nahverkehr", neu:"Wir werden das Nahverkehrsangebot in Deutschland weiter verbessern, um die Fahrgastzahlen in klimaneutralen Bussen und Bahnen bis 2040 zu verdoppeln." },
  { p:"SPD", f:"Wirtschaft", c:"Abbau von Bürokratie", neu:"Auch auf nationaler und EU-Ebene werden wir den Abbau von Bürokratie etwa durch Zusammenführung, Vereinfachung und Digitalisierung von Dokumentations- und Berichtspflichten vorantreiben." },
  { p:"SPD", f:"Wirtschaft", c:"Industriestrategie", neu:"Dafür verfolgen wir eine verlässliche, langfristige und europäisch verankerte Industriestrategie, die Klimaschutz und Wettbewerbsfähigkeit miteinander verbindet." },
  { p:"LINKE", f:"Wirtschaft", c:"Produktion für den Binnenmarkt", neu:"Darum wollen wir die Produktion für den Binnenmarkt und die Herstellung nachhaltige Güter stärken. Wir setzen uns für eine zivile und ökologisch nachhaltige Konversion der Industrieproduktion ein." },
  { p:"GRÜNE", f:"Wirtschaft", c:"Mindestquote von grünem Stahl", neu:"Dafür wollen wir beispielsweise bei öffentlichen Aufträgen eine Mindestquote von grünem Stahl einführen, die stetig ansteigt." },
  { p:"SPD", f:"Öffentliche Finanzen, Steuern und Abgaben", c:"höchsten Vermögen", neu:"Darüber hinaus wollen wir die höchsten Vermögen in unserem Land bei der Finanzierung der Gemeinschaft stärker in die Verantwortung nehmen. Erbschafts- und Schenkungsteuer sowie Vermögensteuer stärken dann die Einnahmeseite der Länder, denen das Aufkommen aus diesen Steuern zusteht." },
  { p:"LINKE", f:"Öffentliche Finanzen, Steuern und Abgaben", c:"Vermögensteuer wieder eingeführt", neu:"Die Linke fordert, dass die Vermögensteuer wieder eingeführt wird. Damit wir nur die reichsten 2,5 Prozent unserer Gesellschaft belasten, fordern wir einen Freibetrag für Privatvermögen von einer Million Euro pro Person (abzüglich aller Schulden, wie zum Beispiel Hypotheken auf ein Eigenheim). Der Freibetrag für Betriebsvermögen liegt bei 5 Millionen Euro. Unser Steuersatz ist progressiv und steigt linear von 1 Prozent bei einem Vermögen von 1 Million Euro auf bis zu 5 Prozent bei einem Vermögen von 50 Millionen Euro." },
  { p:"AfD", f:"Öffentliche Finanzen, Steuern und Abgaben", c:"Steuerverschwendung zu vermeiden", neu:"Als wesentliche Beispiele seien der Abbau von sinnlosen, der vorgeblichen „Klimarettung“ geschuldeten Ausgaben genannt, sowie die Beendigung der Finanzierung von überflüssigen Prestigeprojekten, insbesondere im Ausland." },
  { p:"AfD", f:"Gesellschaftspolitik, soziale Gruppen", c:"Selbstbestimmungsgesetz", neu:"Männer und Frauen können laut „Selbstbestimmungsgesetz“ ohne Weiteres ihr Geschlecht nach Belieben definieren und per Gesetz einmal im Jahr formell ändern lassen." },
  { p:"AfD", f:"Gesellschaftspolitik, soziale Gruppen", c:"Zwangsheirat und Kinderehen", neu:"Ehen von in Deutschland lebenden Muslimen, die auf Polygamie, Zwangsheirat und Kinderehen beruhen, laufen der deutschen Rechtsordnung und der öffentlichen Ordnung entgegen. Sie sind zu annullieren." },
];

const rows = db.prepare(`SELECT rowid, partei, feld, belege_json FROM partei_themenfeld_position`).all() as any[];
const upd = db.prepare(`UPDATE partei_themenfeld_position SET belege_json=? WHERE rowid=?`);
let applied = 0, failVerify = 0, notFound = 0;
const used = new Set<number>();
const tx = db.transaction(() => {
  for (const r of rows) {
    const bel = JSON.parse(r.belege_json) as any[]; let changed = false;
    for (const b of bel) {
      if (b.verifiziert) continue;
      const fi = FIX.findIndex((x, i) => !used.has(i) && x.p === r.partei && x.f === r.feld && b.zitat.includes(x.c));
      if (fi === -1) { console.log(`  ? KEINE Korrektur: ${r.partei}·${r.feld}: „${b.zitat.slice(0,60)}…"`); notFound++; continue; }
      used.add(fi); const fix = FIX[fi];
      const seite = verify(KEY[r.partei], fix.neu);
      if (seite === null) { console.log(`  ✗ VERIFY-FAIL: ${r.partei}·${r.feld}\n      NEU: „${fix.neu.slice(0,80)}…"`); failVerify++; continue; }
      b.zitat = fix.neu; b.seite = seite; b.verifiziert = true; changed = true; applied++;
    }
    if (changed && WRITE) upd.run(JSON.stringify(bel), r.rowid);
  }
});
tx();
console.log(`\n${WRITE ? "GESCHRIEBEN" : "VORSCHAU"}: ${applied}/51 korrigiert & verifiziert · Verify-Fail: ${failVerify} · keine Korrektur: ${notFound} · ungenutzte FIX-Einträge: ${FIX.length - used.size}`);
if (!WRITE) console.log("→ mit --write anwenden");
db.close();
