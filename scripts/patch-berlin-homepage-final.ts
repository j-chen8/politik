/**
 * Schreibt die manuell/WebFetch-verifizierten Endstände der 18 ungelösten
 * Berlin-Homepage-Kandidaten in verify-berlin-homepage-candidates.jsonl.
 * Hintergrund: Der lokale Lauf lief hinter gefiltertem Egress (DNS/TCP teils
 * geblockt) → 13 falsche "TOT/Timeout". Hier triagiert per öffentlichem
 * DNS-Resolver + serverseitigem WebFetch (ungefilterter Egress).
 */
import fs from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "verify-berlin-homepage-candidates.jsonl");

// name → { verdict, dnsAlive, note }   (verdict überschreibt, Rest als Audit-Felder)
const PATCH: Record<string, { verdict: string; dnsAlive: boolean; note: string }> = {
  // -- per WebFetch inhaltlich bestätigt (vorher KEIN NAME, weil JS/Cookie-Wall) --
  "Ellen Haußdörfer":     { verdict: "STARK", dnsAlive: true,  note: "WebFetch: Name+SPD+Abgeordnetenhaus bestätigt; war KEIN NAME (Roh-HTML)" },
  "Maren Jasper-Winter":  { verdict: "STARK", dnsAlive: true,  note: "WebFetch: Name+FDP bestätigt (Cookie-Wall); 302→www; war KEIN NAME" },
  // -- Seite lebt, Inhalt aber nicht als Textquelle nutzbar --
  "Christian Gräff":      { verdict: "EXISTIERT (Inhalt JS/leer)", dnsAlive: true, note: "WebFetch: nur Titel 'Christian Gräff', Inhalt JS-gerendert/leer" },
  "Stefanie Fuchs":       { verdict: "EXISTIERT (Inhalt unlesbar)", dnsAlive: true, note: "WebFetch: HTTP 500; Domain lebt, Inhalt nicht abrufbar" },
  // -- Domain/Server nicht nutzbar (resolve-but-broken bzw. NXDOMAIN) --
  "Florian Kluckert":     { verdict: "TOT (kein valider Server)", dnsAlive: true,  note: "WebFetch: TLS-Cert-Altname ungültig (Parkseite/Fehlkonfig)" },
  "Frank Balzer":         { verdict: "TOT (kein valider Server)", dnsAlive: true,  note: "DNS lebt (85.13.165.82), aber TLS-Cert-Altname ungültig" },
  "Alexander Kaas Elias": { verdict: "TOT (kein valider Server)", dnsAlive: true,  note: "DNS lebt (95.216.174.26), aber TLS-Cert-Altname ungültig" },
  "Philipp Bertram":      { verdict: "TOT (kein valider Server)", dnsAlive: true,  note: "DNS lebt (95.130.17.35), aber ECONNREFUSED auf 443" },
  "Carsten Ubbelohde":    { verdict: "TOT (kein valider Server)", dnsAlive: true,  note: "DNS lebt (217.160.0.13), aber ECONNREFUSED auf 443" },
  "Katrin Seidel":        { verdict: "TOT (kein valider Server)", dnsAlive: true,  note: "DNS lebt (193.96.188.9), aber HTTPS-Timeout" },
  "Antonin Brousek":      { verdict: "DOMAIN TOT", dnsAlive: false, note: "Keine A-Records (brousek.de)" },
  "Timur Husein":         { verdict: "DOMAIN TOT", dnsAlive: false, note: "Keine A-Records (timurhusein.de)" },
  "Regina Kittler":       { verdict: "DOMAIN TOT", dnsAlive: false, note: "Keine A-Records (regina-kittler.de)" },
  "Nina Lerch":           { verdict: "DOMAIN TOT", dnsAlive: false, note: "Keine A-Records (nina-lerch.de)" },
  "Dirk Liebe":           { verdict: "DOMAIN TOT", dnsAlive: false, note: "Keine A-Records (dirkliebe.berlin)" },
  "Sebastian Scheel":     { verdict: "DOMAIN TOT", dnsAlive: false, note: "Keine A-Records (sebastianscheel.de)" },
  "Ines Schmidt":         { verdict: "DOMAIN TOT", dnsAlive: false, note: "Keine A-Records (ines-schmidt.info)" },
  "Daniel Wesener":       { verdict: "DOMAIN TOT", dnsAlive: false, note: "Keine A-Records (daniel-wesener.de)" },
};

const rows: any[] = fs.readFileSync(OUT, "utf-8").trim().split("\n").map((l) => JSON.parse(l));
let n = 0;
for (const r of rows) {
  const p = PATCH[r.name];
  if (!p) continue;
  r.verdict = p.verdict;
  r.dnsAlive = p.dnsAlive;
  r.finalNote = p.note;
  n++;
}
fs.writeFileSync(OUT, rows.map((r) => JSON.stringify(r)).join("\n") + "\n");

const by = (pred: (v: string) => boolean) => rows.filter((r) => pred(r.verdict)).length;
console.log(`${n} Zeilen gepatcht. Endstand (${rows.length} Kandidaten):\n`);
console.log(`  STARK (verwertbare Homepage):     ${rows.filter(r=>r.verdict==="STARK").length}`);
console.log(`  MITTEL:                           ${rows.filter(r=>r.verdict==="MITTEL").length}`);
console.log(`  EXISTIERT (Inhalt nicht nutzbar):  ${by(v=>v.startsWith("EXISTIERT"))}`);
console.log(`  BLOCKT (existiert, 403):          ${rows.filter(r=>r.verdict==="BLOCKT (existiert)").length}`);
console.log(`  TOT (kein valider Server):        ${rows.filter(r=>r.verdict==="TOT (kein valider Server)").length}`);
console.log(`  DOMAIN TOT (keine A-Records):     ${rows.filter(r=>r.verdict==="DOMAIN TOT").length}`);
console.log(`  Verbleibend TOT/Timeout (offen):  ${rows.filter(r=>r.verdict==="TOT/Timeout").length}`);
