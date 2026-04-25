import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS politician_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    politician_id INTEGER REFERENCES politicians(id),
    speaker_name TEXT,
    kategorie TEXT NOT NULL,
    titel TEXT NOT NULL,
    inhalt TEXT NOT NULL,
    datum_von TEXT,
    datum_bis TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_politician_notes_pol ON politician_notes(politician_id);
  CREATE INDEX IF NOT EXISTS idx_politician_notes_speaker ON politician_notes(speaker_name);
`);

// Clear existing notes to allow re-running
db.exec("DELETE FROM politician_notes");

const insert = db.prepare(`
  INSERT INTO politician_notes (politician_id, speaker_name, kategorie, titel, inhalt, datum_von, datum_bis)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// Sieghard Knodel
insert.run(
  184317, "Sieghard Knodel", "sonderfall",
  "Fraktionsloser Abgeordneter — Inaktiv seit Mai 2025",
  `Sieghard Knodel zog 2025 für die AfD in den Bundestag ein, trat aber bereits im Mai 2025 aus Partei und Fraktion aus. Sein Argument: Er müsse sein privates und geschäftliches Umfeld schützen, nachdem die AfD vom Verfassungsschutz als „gesichert rechtsextrem" eingestuft wurde.

Seit seinem Austritt ist er fraktionslos. Er nimmt faktisch nicht am parlamentarischen Betrieb teil — keine Reden, keine Ausschussarbeit und kaum Anwesenheit bei Abstimmungen.

Da er sein Mandat nicht niederlegt, erhält er weiterhin die volle Abgeordnetenentschädigung von ca. 11.227 € monatlich sowie die steuerfreie Kostenpauschale (ca. 5.000 €). Ein Abgeordneter kann nicht zur Arbeit gezwungen werden — das freie Mandat schützt ihn vor dem Entzug der Diäten, solange er formal im Amt bleibt.

Er gab später an, an einem schweren Burn-out zu leiden, was seine Inaktivität erkläre.`,
  "2025-05-01", null
);

// Gerhard Trabert
insert.run(
  175351, "Gerhard Trabert", "sonderfall",
  "Gewählt, aber nie angetreten — Schwere Schlaganfälle",
  `Gerhard Trabert, parteiloser Sozialmediziner und bekannt als „Arzt der Armen", trat als Spitzenkandidat für Die Linke an und wurde im Februar 2025 erfolgreich gewählt.

Kurz vor bzw. während der Wahlphase erlitt Trabert mehrere schwere Schlaganfälle. Er konnte zur konstituierenden Sitzung des Bundestages nicht erscheinen und befand sich monatelang in der Rehabilitation.

Im August 2025 erklärte seine Familie, dass er aufgrund bleibender schwerer Einschränkungen das Mandat nicht antreten kann. Er verzichtete offiziell auf seinen Sitz, noch bevor er das erste Mal im Plenum saß.

Er erhält keinerlei Diäten oder Übergangsgelder, da er das Amt nie formal ausgeübt hat. Für ihn rückte Lin Lindner nach.`,
  "2025-02-23", "2025-08-01"
);

// Uwe Foullong
const foullong = db.prepare("SELECT id FROM politicians WHERE last_name = 'Foullong' LIMIT 1").get() as any;
insert.run(
  foullong?.id ?? null, "Uwe Foullong", "sonderfall",
  "Mandat aus gesundheitlichen Gründen niedergelegt",
  `Uwe Foullong (Die Linke), ehemaliger ver.di-Funktionär, zog 2025 in den Bundestag ein und begann engagiert seine Arbeit im Finanzausschuss.

Nach nur wenigen Monaten merkte der damals 67-Jährige, dass die Arbeitsbelastung seine Gesundheit massiv gefährdete. Auf dringenden ärztlichen Rat hin legte er sein Mandat zum 31. Juli 2025 nieder.

Foullong erklärte öffentlich, dass eine Genesung nur möglich sei, wenn er Dauerbelastungen vermeide. Er wolle den Platz für jemanden freimachen, der die Aufgaben vollumfänglich erfüllen kann.

Sein Mandat endete sofort, womit auch die Diätenzahlungen eingestellt wurden (bzw. in ein befristetes Übergangsgeld übergingen). Für ihn rückte die junge Studentin Lizzy Schubert nach.`,
  "2025-02-23", "2025-07-31"
);

console.log("3 Sonderfälle eingefügt");
console.log("Gesamt:", (db.prepare("SELECT COUNT(*) as c FROM politician_notes").get() as any).c, "Einträge");

db.close();
