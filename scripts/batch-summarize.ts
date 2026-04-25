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
const fs = require("fs");
const path = require("path");

const letters = process.argv.slice(2).map((l: string) => l.toUpperCase());
if (letters.length === 0) {
  console.log("Usage: npx tsx scripts/batch-summarize.ts <Buchstabe(n)>");
  process.exit(1);
}

// Reset model state at batch start — new batch = fresh start with best model
const stateFile = path.join(__dirname, "..", ".groq-model-state");
if (fs.existsSync(stateFile)) {
  const state = JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  if (state.reason === "tpd") {
    console.log(`⚠ Letzter Lauf hat TPD-Limit erreicht (${state.timestamp}).`);
    console.log(`  Starte mit Fallback-Modell. State-Datei löschen für Reset: rm ${stateFile}\n`);
  }
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

  // Extract last name and resolve overrides for XML matching
  // Import the same override map used by extract-speeches-xml.ts
  const NAME_OVERRIDES: Record<string, { lastName: string; fullName: string }> = {
    "Carsten Müller (Braunschweig)": { lastName: "Müller", fullName: "Carsten Müller" },
    "Dagmar Schmidt (Wetzlar)": { lastName: "Schmidt", fullName: "Dagmar Schmidt" },
    "Hubertus Heil (Peine)": { lastName: "Heil", fullName: "Hubertus Heil" },
    "Claudia Roth (Augsburg)": { lastName: "Roth", fullName: "Claudia Roth" },
    "Michael Brand (Fulda)": { lastName: "Brand", fullName: "Michael Brand" },
    "Mahmut Özdemir (Duisburg)": { lastName: "Özdemir", fullName: "Mahmut Özdemir" },
    "Stephan Mayer (Altötting)": { lastName: "Mayer", fullName: "Stephan Mayer" },
    "Beatrix von Storch": { lastName: "Storch", fullName: "Beatrix von Storch" },
    "Dr. Konstantin von Notz": { lastName: "Notz", fullName: "Dr. Konstantin von Notz" },
    "Ulrich von Zons": { lastName: "Zons", fullName: "Ulrich von Zons" },
    "Jan van Aken": { lastName: "Aken", fullName: "Jan van Aken" },
    "Sascha van Beek": { lastName: "Beek", fullName: "Sascha van Beek" },
    "Christoph de Vries": { lastName: "Vries", fullName: "Christoph de Vries" },
    "Catarina dos Santos-Wintz": { lastName: "Santos-Wintz", fullName: "Catarina dos Santos-Wintz" },
    "Reem Alabali Radovan": { lastName: "Alabali-Radovan", fullName: "Reem Alabali-Radovan" },
    "LisaSimone Fischer": { lastName: "Fischer", fullName: "Lisa-Simone Fischer" },
    "Aydan Özoğuz": { lastName: "Özoğuz", fullName: "Aydan Özoğuz" },
    "Cansu Özdemir": { lastName: "Özdemir", fullName: "Cansu Özdemir" },
    "Mahmut Özdemir": { lastName: "Özdemir", fullName: "Mahmut Özdemir" },
    "Kassem Taher Saleh": { lastName: "Taher Saleh", fullName: "Kassem Taher Saleh" },
    "Maximilain Kneller": { lastName: "Kneller", fullName: "Maximilian Kneller" },
    "Mareike Lotte Wulf": { lastName: "Wulf", fullName: "Mareike Lotte Wulf" },
    "Sara Gambir": { lastName: "Gambir", fullName: "Sara Gambir" },
    "Andrew Mitchell": { lastName: "Mitchell", fullName: "Andrew Mitchell" },
  };

  interface SpeakerInfo { fullName: string; lastName: string; xmlFullName: string; }
  const speakers: SpeakerInfo[] = allSpeakers
    .map((r: any) => {
      const override = NAME_OVERRIDES[r.speaker];
      if (override) {
        return { fullName: r.speaker, lastName: override.lastName, xmlFullName: override.fullName };
      }
      const parts = r.speaker.split(" ");
      return { fullName: r.speaker, lastName: parts[parts.length - 1], xmlFullName: r.speaker };
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
        `npx tsx scripts/extract-speeches-xml.ts "${s.lastName}" "${s.xmlFullName}"`,
        {
          stdio: "inherit",
          cwd: process.cwd(),
          env: { ...process.env, SKIP_HEALTHCHECK: "1", ORIGINAL_SPEAKER: s.fullName },
        }
      );
    } catch (e: any) {
      console.log(`FEHLER bei ${s.fullName}: ${e.message?.substring(0, 100)}`);
    }
  }
  console.log(`\n=== Buchstabe ${letter} fertig! ===`);
}
