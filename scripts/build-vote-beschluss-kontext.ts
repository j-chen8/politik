/**
 * MANUELL (Claude Code, kein LLM) — Beschlussempfehlungs-Kontext je Abstimmung.
 *
 * Problem: Stimmt der Bundestag über eine BESCHLUSSEMPFEHLUNG ab, die die ABLEHNUNG
 * eines Antrags empfiehlt, dann ist die rohe Stimmrichtung GEGENLÄUFIG zur Sachposition
 * zum Antrag: "Nein" zur Empfehlung = FÜR den Antrag, "Ja" = GEGEN den Antrag.
 * Auf der Antrags-Seite liest sich das sonst als "Einbringer stimmt gegen den eigenen Antrag".
 *
 * Quelle der Zuordnung: ICH habe alle 125 an einen Antrag gelinkten Votes im Protokoll-
 * Rohtext (raw_snippet) gelesen (/tmp/.../beschluss-review.txt) und die Fälle markiert,
 * in denen der Ausschuss explizit die Ablehnung DIESES Antrags empfiehlt. Direkte Antrags-
 * abstimmungen (Einbringer stimmt "ja") und Überweisungen sind KEIN Flip und stehen NICHT
 * in dieser Tabelle.
 *
 * Tabelle vote_beschluss_kontext(vote_id, ds_nr, empfiehlt). empfiehlt='ablehnen' => die
 * Anzeige rechnet die Stimme in "für/gegen den Antrag" um (ja<->gegen, nein<->für).
 * Guardrail: jeder raw_snippet MUSS die DS-Nummer + ein Ablehnungs-Token enthalten, sonst Warnung.
 */
import Database from "better-sqlite3";

const db = new Database("politik.db");

// vote_id -> Antrags-DS, deren Ablehnung die Beschlussempfehlung empfiehlt.
// 56 via starker Regex erkannt + 4 manuell ergänzt (Regex verpasst: 555,566,590,600).
const FLIP_ABLEHNEN: Record<number, string> = {
  394: "21/786", 395: "21/2547", 403: "21/2548", 409: "21/226", 412: "21/318",
  413: "21/2718", 433: "21/2221", 445: "21/3604", 447: "21/4945", 449: "21/356",
  454: "21/1544", 456: "21/2042", 461: "21/1488", 464: "21/2707", 465: "21/584",
  468: "21/4953", 471: "21/590", 482: "21/1667", 484: "21/341", 489: "21/3918",
  494: "21/3308", 495: "21/1551", 498: "21/2544", 503: "21/4271", 511: "21/1566",
  512: "21/1310", 517: "21/2546", 519: "21/586", 520: "21/355", 524: "21/2715",
  547: "21/3616", 555: "21/2033", 563: "21/2041", 566: "21/1753", 570: "21/2549",
  577: "21/4946", 590: "21/2830", 595: "21/349", 600: "21/1620", 603: "21/3872",
  611: "21/2035", 615: "21/2558", 616: "21/1543", 617: "21/2028", 628: "21/2725",
  645: "21/1565", 649: "21/3605", 653: "21/2724", 669: "21/4748", 672: "21/2244",
  674: "21/4285", 677: "21/2222", 698: "21/2086", 699: "21/1566", 703: "21/1542",
  705: "21/3606", 710: "21/2721", 712: "21/3307", 714: "21/2723", 785: "21/3829",
  // 2026-06-29: neue/re-extrahierte Votes aus BT-Refresh (Sitzungen 84–86 + von der
  // verbesserten Extraktion nachgezogene Alt-Sitzungen). Jeder raw_snippet einzeln
  // gelesen — Ausschuss empfiehlt jeweils explizit die Ablehnung DIESES verlinkten
  // Antrags. Ausgeschlossen: 804/860 (reine GE-/Entschließungsantrag-Voten, kein Flip),
  // 834/856 (GO-BT-Änderungsantrag-Blockvoten, Padding-/Verlinkungs-Edge-Cases — vertagt).
  796: "21/1562", 803: "21/1559", 806: "21/1546", 809: "21/1557", 810: "21/1488",
  812: "21/1756", 820: "21/1572", 827: "21/1542", 831: "21/2221", 833: "21/1564",
  838: "21/1620", 848: "21/3796", 853: "21/2230", 857: "21/2245", 859: "21/1561",
  861: "21/340",
};

const voteRow = db.prepare("SELECT raw_snippet, drucksache_nrn_json FROM bundestag_votes WHERE vote_id=?");
// DS-Nummer ohne führende Null (21/0786 -> 21/786) für den Textvergleich.
const stripPad = (nr: string) => nr.replace(/^(\d+)\/0*(\d+)$/, "$1/$2");

db.exec(`
  DROP TABLE IF EXISTS vote_beschluss_kontext;
  CREATE TABLE vote_beschluss_kontext (
    vote_id   INTEGER NOT NULL,
    ds_nr     TEXT    NOT NULL,
    empfiehlt TEXT    NOT NULL,          -- 'ablehnen' (einzige Klasse aktuell)
    PRIMARY KEY (vote_id, ds_nr)
  );
  CREATE INDEX idx_vbk_ds ON vote_beschluss_kontext(ds_nr);
`);
const ins = db.prepare("INSERT INTO vote_beschluss_kontext (vote_id, ds_nr, empfiehlt) VALUES (?,?,?)");

let ok = 0;
const warn: string[] = [];
const tx = db.transaction(() => {
  for (const [vidStr, ds] of Object.entries(FLIP_ABLEHNEN)) {
    const vid = Number(vidStr);
    const r = voteRow.get(vid) as { raw_snippet: string | null; drucksache_nrn_json: string | null } | undefined;
    if (!r) { warn.push(`vote ${vid}: existiert nicht in bundestag_votes`); continue; }
    const snip = r.raw_snippet || "";
    const dsNorm = stripPad(ds);
    // Guardrail 1: DS muss im Vote verlinkt sein
    const linked = (JSON.parse(r.drucksache_nrn_json || "[]") as string[]).some((x) => stripPad(x) === dsNorm);
    if (!linked) warn.push(`vote ${vid}: DS ${ds} NICHT in drucksache_nrn_json verlinkt`);
    // Guardrail 2: Rohtext muss DS + Ablehnungs-Token enthalten
    const hasDs = snip.includes(dsNorm) || snip.includes(ds);
    const hasAbl = /abzulehnen|Ablehnung des Antrag(e)?s/i.test(snip);
    if (!hasDs || !hasAbl) warn.push(`vote ${vid} (${ds}): Guardrail — hasDs=${hasDs} hasAbl=${hasAbl}`);
    ins.run(vid, ds, "ablehnen");
    ok++;
  }
});
tx();

console.log(`vote_beschluss_kontext: ${ok} Einträge geschrieben.`);
if (warn.length) {
  console.log(`\n⚠ ${warn.length} Warnungen:`);
  for (const w of warn) console.log("  - " + w);
} else {
  console.log("✓ Alle Guardrails bestanden (DS verlinkt + Ablehnung im Protokoll belegt).");
}
db.close();
