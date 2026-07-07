/**
 * Wächter: Ist der Regierungsentwurf zum Bundeshaushalt 2027 irgendwo als
 * analysierbares Dokument aufgetaucht? (Kabinett hat am 06.07.2026 beschlossen,
 * aber Tag 1 gab es weder DIP-Drucksache noch bundeshaushalt.de-Daten.)
 *
 * Prüft alle Quellen deterministisch (€0):
 *  (a) DIP: neue BR-/BT-Drucksachen mit „Haushaltsgesetz 2027"/„Haushaltsplan …2027" im Titel
 *  (b) bundeshaushalt.de /internalapi/config: taucht „2027" in den Jahren auf?
 * Meldet EINMALIG per Mail (Marker-Tabelle) und loggt sonst nur eine Zeile.
 * Läuft als Schritt im 6h-Salienz-Lauf; kann gelöscht werden, sobald der
 * Entwurf ingestiert ist.
 */
import Database from "better-sqlite3";
import { sendMail } from "./_lib/mailer";

const DIP = "https://search.dip.bundestag.de/api/v1";
const DIP_HEADERS = { Origin: "https://dip.bundestag.de", Referer: "https://dip.bundestag.de/" };

function dipKey(): string {
  if (process.env.DIP_API_KEY) return process.env.DIP_API_KEY;
  const fs = require("fs") as typeof import("fs");
  const m = fs.readFileSync(".env", "utf8").match(/^DIP_API_KEY=["']?([^"'\n ]+)/m);
  if (!m) throw new Error("DIP_API_KEY fehlt");
  return m[1];
}

const TITEL_RE = /haushaltsgesetz\s*2027|bundeshaushaltsplan[^]*2027|feststellung des bundeshaushaltsplans[^]*2027/i;

async function checkDip(): Promise<string[]> {
  const funde: string[] = [];
  for (const zuordnung of ["BR", "BT"]) {
    const url = `${DIP}/drucksache?f.zuordnung=${zuordnung}&f.datum.start=2026-07-01&rows=100&format=json&apikey=${dipKey()}`;
    const res = await fetch(url, { headers: DIP_HEADERS });
    if (!res.ok) { console.log(`  DIP ${zuordnung}: HTTP ${res.status} — übersprungen`); continue; }
    const j = (await res.json()) as { documents?: { dokumentnummer?: string; titel?: string }[] };
    for (const d of j.documents ?? []) {
      if (d.titel && TITEL_RE.test(d.titel)) funde.push(`DIP ${zuordnung}-Drs ${d.dokumentnummer}: ${d.titel.slice(0, 120)}`);
    }
  }
  return funde;
}

async function checkBundeshaushaltDe(): Promise<string[]> {
  const res = await fetch("https://www.bundeshaushalt.de/internalapi/config");
  if (!res.ok) { console.log(`  bundeshaushalt.de: HTTP ${res.status} — übersprungen`); return []; }
  const j = (await res.json()) as { years?: string[] };
  return (j.years ?? []).includes("2027")
    ? ["bundeshaushalt.de Digital-API führt jetzt Jahr 2027 (Regierungsentwurf maschinenlesbar)"]
    : [];
}

async function main() {
  const db = new Database("politik.db");
  db.exec(`CREATE TABLE IF NOT EXISTS wachposten_gemeldet (schluessel TEXT PRIMARY KEY, gemeldet_am TEXT NOT NULL DEFAULT (datetime('now')))`);

  const funde = [...(await checkDip()), ...(await checkBundeshaushaltDe())];
  const neu = funde.filter((f) => !db.prepare(`SELECT 1 FROM wachposten_gemeldet WHERE schluessel=?`).get(f));

  if (!neu.length) {
    console.log(`Haushalt-2027-Wächter: nichts Neues (${funde.length} bekannte Funde).`);
    db.close();
    return;
  }
  const text = [
    "Der Regierungsentwurf zum Bundeshaushalt 2027 ist jetzt verfügbar:",
    "",
    ...neu.map((f) => `• ${f}`),
    "",
    "→ Nächster Schritt: ingestieren + analysieren (Kommissionsberichte-Muster),",
    "  dann als Anker an den Salienz-Aufmacher hängen.",
  ].join("\n");
  const r = await sendMail("Haushaltsentwurf 2027 ist da — ingestierbar", text);
  if (r.sent) {
    const ins = db.prepare(`INSERT OR IGNORE INTO wachposten_gemeldet (schluessel) VALUES (?)`);
    for (const f of neu) ins.run(f);
    console.log(`Haushalt-2027-Wächter: ${neu.length} Fund(e) gemeldet.`);
  } else {
    console.log(`Haushalt-2027-Wächter: Fund, aber Mail fehlgeschlagen (${r.reason}) — melde beim nächsten Lauf erneut.\n${text}`);
  }
  db.close();
}

main();
