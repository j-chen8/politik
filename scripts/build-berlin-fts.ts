/** Initial-Build der Berlin-FTS5-Indices. */
import { rebuildSearchFTS } from "../src/lib/search-fts";
import Database from "better-sqlite3";
import path from "path";

const db = new Database(path.join(process.cwd(), "politik.db"));
db.pragma("journal_mode = WAL");
console.log("Building/rebuilding FTS5 indices (inkl. Berlin)...");
rebuildSearchFTS(db);

const counts = {
  speeches: db.prepare(`SELECT COUNT(*) AS n FROM speeches_fts`).get() as { n: number },
  drucksachen: db.prepare(`SELECT COUNT(*) AS n FROM drucksachen_fts`).get() as { n: number },
  berlinSpeeches: db.prepare(`SELECT COUNT(*) AS n FROM berlin_speeches_fts`).get() as { n: number },
  berlinDrucksachen: db.prepare(`SELECT COUNT(*) AS n FROM berlin_drucksachen_fts`).get() as { n: number },
};
console.log(`✓ speeches_fts:              ${counts.speeches.n.toLocaleString("de-DE")}`);
console.log(`✓ drucksachen_fts:           ${counts.drucksachen.n.toLocaleString("de-DE")}`);
console.log(`✓ berlin_speeches_fts:       ${counts.berlinSpeeches.n.toLocaleString("de-DE")}`);
console.log(`✓ berlin_drucksachen_fts:    ${counts.berlinDrucksachen.n.toLocaleString("de-DE")}`);

db.close();
