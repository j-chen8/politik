import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";
import { VorschauThemen } from "@/components/VorschauThemen";
import { SearchBox } from "@/components/SearchBox";
import { HomeThemeToggle } from "@/components/HomeThemeToggle";
import { getThemenBlatt, getThemenStruktur } from "@/lib/themen-blatt";
import { anzeigeName, resolveUnter, unterSlug } from "@/lib/themen-struktur";

// Display-Schrift der Themen-Seiten (Headlines); Body bleibt Geist.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

/**
 * STARTSEITE = das Themensystem (User-Entscheid 2026-06-13): der Picker ist das
 * eine Explorable der Landing (Research 2026-06-05: „Wert+Wow ganz oben, EIN
 * Signatur-Wow"), Suche direkt darunter. Vorher: ParliamentLanding-Hero mit
 * Spalten-Karten (LinearLanding, lebt in der git-Historie). /themen und
 * /vorschau/themen leiten hierher (Params bleiben erhalten).
 */
export default async function HomePage({ searchParams }: { searchParams: Promise<{ feld?: string; unter?: string }> }) {
  const { feld = "", unter = "" } = await searchParams;
  const struktur = getThemenStruktur();
  const ziel = feld && unter ? resolveUnter(feld, unter) : null;
  // Gemergte/umbenannte Cluster: alte Slugs lösen aufs Ziel auf — kanonische URL erzwingen
  if (ziel) {
    const kanon = unterSlug(anzeigeName(ziel.unterthema));
    if (kanon !== unter) redirect(`/?feld=${encodeURIComponent(feld)}&unter=${kanon}`);
  }
  const blatt = ziel ? getThemenBlatt(ziel.feld, ziel.unterthema) : null;
  return (
    <div className={`${display.variable} page-wash flex min-h-screen flex-col`}>
      <main className="page-shell flex-1">
        <Suspense fallback={<div className="h-64" />}>
          <VorschauThemen
            struktur={struktur}
            blatt={blatt}
            heroTitle="Woran arbeitet der Bundestag?"
            heroSubtitle="Debatten, Drucksachen, Abstimmungen — transparent und lesbar. Wähle ein Thema."
            searchSlot={<SearchBox />}
            themeToggle={<HomeThemeToggle />}
          />
        </Suspense>
      </main>
    </div>
  );
}
