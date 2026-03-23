/**
 * Batch-summarize all speakers whose last name starts with given letter(s).
 * Usage: npx tsx scripts/batch-summarize.ts A
 *        npx tsx scripts/batch-summarize.ts F G H I J K L
 *
 * ⚠️  NUR EINEN PROZESS GLEICHZEITIG LAUFEN LASSEN!
 *     Groq Free Tier: 30 RPM, 1K RPD, 12k TPM pro Key.
 *     Gemini Free Tier: 15 RPM, 500 RPD, 250k TPM pro Key.
 *     Bei mehreren Keys rotiert das Script automatisch.
 *     Aber 2+ parallele Prozesse → sofort alle Keys rate-limited (429).
 *
 * Health-Check: Wird nur EINMAL am Start gemacht, nicht pro Redner.
 * Spart ~3 Requests pro Redner bei 3 Keys.
 */

const { execSync } = require("child_process");
const Database = require("better-sqlite3");

const letters = process.argv.slice(2).map((l: string) => l.toUpperCase());
if (letters.length === 0) {
  console.log("Usage: npx tsx scripts/batch-summarize.ts <Buchstabe(n)>");
  process.exit(1);
}

// Run health check once by calling extract-speeches-xml with a dummy that returns 0 speeches
// This validates keys without wasting requests on actual summaries
const provider = (process.env.PROVIDER || "groq").toLowerCase();
console.log(`\n🔑 Provider: ${provider.toUpperCase()} — einmaliger Key-Check...`);
try {
  execSync(
    `npx tsx scripts/extract-speeches-xml.ts "ZZZZNOTEXIST" "ZZZZNOTEXIST"`,
    { stdio: "inherit", cwd: process.cwd(), env: process.env }
  );
} catch {
  // Will fail with 0 speeches, that's fine — keys were checked
}
console.log("✓ Keys geprüft. Starte Batch ohne Health-Checks.\n");

for (const letter of letters) {
  const db = new Database("politik.db");

  // Get all unique speakers from plenar_speeches
  const allSpeakers: { speaker: string }[] = db.prepare(
    "SELECT DISTINCT speaker FROM plenar_speeches ORDER BY speaker"
  ).all();

  // Already fully summarized (speaker has at least one summary)
  const alreadySummarized = new Set(
    db.prepare("SELECT DISTINCT speaker FROM speech_summaries").all().map((r: any) => r.speaker)
  );

  // Extract last name (last word) and filter by letter
  interface SpeakerInfo { fullName: string; lastName: string; }
  const speakers: SpeakerInfo[] = allSpeakers
    .map((r: any) => {
      const parts = r.speaker.split(" ");
      return { fullName: r.speaker, lastName: parts[parts.length - 1] };
    })
    .filter((s: SpeakerInfo) => s.lastName.toUpperCase().startsWith(letter));

  db.close();

  console.log(`\n=== Buchstabe ${letter}: ${speakers.length} Redner ===\n`);
  speakers.forEach((s, i) => console.log(`  ${i + 1}. ${s.fullName} (${s.lastName})`));
  console.log("");

  for (let i = 0; i < speakers.length; i++) {
    const s = speakers[i];
    console.log(`\n[${i + 1}/${speakers.length}] ${s.fullName}`);
    console.log("─".repeat(50));
    try {
      execSync(
        `npx tsx scripts/extract-speeches-xml.ts "${s.lastName}" "${s.fullName}"`,
        {
          stdio: "inherit",
          cwd: process.cwd(),
          env: { ...process.env, SKIP_HEALTHCHECK: "1" },
        }
      );
    } catch (e: any) {
      console.log(`FEHLER bei ${s.fullName}: ${e.message?.substring(0, 100)}`);
    }
  }
  console.log(`\n=== Buchstabe ${letter} fertig! ===`);
}
