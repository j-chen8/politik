/**
 * Belege der Pilot-Tabelle partei_aspekt_verhalten auf echte, verlinkbare Quellen
 * auflösen — ohne LLM-Neulauf. Reine, idempotente Datenreparatur:
 *  - Reden  ("R"+rede_id) -> Deep-Link auf die Plenarsitzung (#rede-<id>) + Label.
 *  - Q&A    ("Q"+base64)  -> echte abgeordnetenwatch-URL (Rückwärts-Map) + Label.
 *  - Vote-Kontamination: belege mit quelle="Q&A" und rein-numerischer ID sind in
 *    Wahrheit fälschlich eingeordnete Abstimmungen (schon in abgestimmt_json) und
 *    werden entfernt. Nicht auflösbare Q&A ebenfalls (kein Link ins Leere).
 * Schreibt quelle_url + quelle_label in jeden behaltenen Beleg.
 */
import Database from "better-sqlite3";
const db = new Database("politik.db");

// Reden-Map: rede_id -> {sitzung, datum, wp} + Menge der Sprecher.
// WICHTIG: einige rede_ids (FS-Format) bündeln eine ganze Debatte mit vielen
// Sprechern — dann ist der Redner NICHT eindeutig und wir nennen keinen Namen.
const redeMeta = new Map<string, { sitzung: number; datum: string; wp: number }>();
const redeSpeakers = new Map<string, Set<string>>();
for (const r of db
  .prepare(
    `SELECT ps.rede_id, ps.speaker, s.sitzung, s.datum, s.wahlperiode AS wp
     FROM plenar_speeches ps JOIN plenar_sessions s ON s.id = ps.session_id
     WHERE ps.rede_id IS NOT NULL`,
  )
  .all() as { rede_id: string; speaker: string; sitzung: number; datum: string; wp: number }[]) {
  if (!redeMeta.has(r.rede_id))
    redeMeta.set(r.rede_id, { sitzung: r.sitzung, datum: r.datum, wp: r.wp });
  if (!redeSpeakers.has(r.rede_id)) redeSpeakers.set(r.rede_id, new Set());
  if (r.speaker) redeSpeakers.get(r.rede_id)!.add(r.speaker);
}

// Q&A: Token-Map ("Q"+base64 -> {url,name}) UND URL-Map (frage_url -> name),
// damit sowohl Alt-Token als auch das neue frage_url-Format auflösen.
const qaMap = new Map<string, { url: string; name: string }>();
const qaByUrl = new Map<string, string>();
for (const r of db
  .prepare(
    `SELECT q.frage_url, TRIM(COALESCE(po.first_name,'')||' '||COALESCE(po.last_name,'')) AS name
     FROM aw_questions q LEFT JOIN politicians po ON po.id = q.politician_id`,
  )
  .all() as { frage_url: string; name: string | null }[]) {
  const name = r.name?.trim() || "Abgeordnete:r";
  const key = "Q" + Buffer.from(r.frage_url).toString("base64").slice(-10);
  if (!qaMap.has(key)) qaMap.set(key, { url: r.frage_url, name });
  qaByUrl.set(r.frage_url, name);
}

const cells = db
  .prepare(`SELECT rowid, gesagt_belege_json FROM partei_aspekt_verhalten WHERE feld='Wirtschaft'`)
  .all() as { rowid: number; gesagt_belege_json: string }[];
const upd = db.prepare(`UPDATE partei_aspekt_verhalten SET gesagt_belege_json = ? WHERE rowid = ?`);

let kept = 0, dropVote = 0, dropUnres = 0, redeLinked = 0, qaLinked = 0;
const tx = db.transaction(() => {
  for (const c of cells) {
    const belege = JSON.parse(c.gesagt_belege_json) as {
      zitat: string; quelle: string; quelle_id: string; verifiziert: boolean;
    }[];
    const out: any[] = [];
    for (const b of belege) {
      if (b.quelle === "Rede") {
        const rid = b.quelle_id?.startsWith("R") ? b.quelle_id.slice(1) : b.quelle_id;
        const m = redeMeta.get(rid);
        if (!m) { dropUnres++; continue; }
        const spk = redeSpeakers.get(rid);
        // Redner nur, wenn eindeutig (1 Sprecher); sonst gebündelte Debatte -> kein Name.
        const person = spk && spk.size === 1 ? [...spk][0] : null;
        const wann = `${m.sitzung}. Sitzung (${m.wp}. WP)${m.datum ? ", " + m.datum : ""}`;
        out.push({
          ...b,
          quelle_id: rid,
          quelle_url: `/protokolle/sitzung/${m.sitzung}#rede-${rid}`,
          quelle_label: person ? `${person}, ${wann}` : `Bundestagsdebatte, ${wann}`,
          quelle_person: person,
        });
        redeLinked++; kept++;
      } else {
        // Q&A: rein-numerische ID = fälschlich einsortierte Abstimmung -> raus
        if (/^\d+$/.test(b.quelle_id)) { dropVote++; continue; }
        let url: string | null = null, name: string | null = null;
        if (b.quelle_id?.startsWith("http")) {
          url = b.quelle_id; name = qaByUrl.get(b.quelle_id) ?? "Abgeordnete:r";
        } else {
          const m = qaMap.get(b.quelle_id); // Alt-Token
          if (m) { url = m.url; name = m.name; }
        }
        if (!url) { dropUnres++; continue; }
        out.push({ ...b, quelle_id: url, quelle_url: url, quelle_label: `Bürgerfrage an ${name} · abgeordnetenwatch.de`, quelle_person: name });
        qaLinked++; kept++;
      }
    }
    upd.run(JSON.stringify(out), c.rowid);
  }
});
tx();

console.log(`Belege behalten+verlinkt: ${kept}  (Reden ${redeLinked}, Q&A ${qaLinked})`);
console.log(`Entfernt — Vote-Kontamination: ${dropVote}, unauflösbar: ${dropUnres}`);
db.close();
