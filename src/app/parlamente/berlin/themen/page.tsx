import { Suspense } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { VorschauThemen } from "@/components/VorschauThemen";
import { getBerlinThemenBlatt, getBerlinThemenStruktur, resolveBerlinUnter } from "@/lib/berlin-themen-blatt";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// Gleiche Display-Schrift wie das Bundestag-Themensystem (/themen) — identisches Design.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Themen — Abgeordnetenhaus Berlin | Politik-Radar",
  description:
    "Woran arbeitet das Berliner Abgeordnetenhaus? Themen nach Politikfeld und Unterthema — jedes mit Drucksachen, Abstimmungen und Redner:innen.",
};

/**
 * Berlin-Themensystem — dieselbe VorschauThemen-Komponente wie der Bund (/themen),
 * nur mit Berlin-Daten (src/lib/berlin-themen-blatt.ts). Picker = Felder → Unterthemen;
 * das Blatt wird serverseitig je URL aufgelöst. Stand: Pilot-Feld „Wohnen" klassifiziert.
 */
export default async function BerlinThemenPage({ searchParams }: { searchParams: Promise<{ feld?: string; unter?: string }> }) {
  const { feld = "", unter = "" } = await searchParams;
  const struktur = getBerlinThemenStruktur();
  const ziel = feld && unter ? resolveBerlinUnter(feld, unter) : null;
  const blatt = ziel ? getBerlinThemenBlatt(ziel.feld, ziel.unterthema) : null;
  return (
    <div className={`${display.variable} page-wash flex min-h-screen flex-col`}>
      <main className="page-shell flex-1">
        <Suspense fallback={<div className="h-64" />}>
          <VorschauThemen
            struktur={struktur}
            blatt={blatt}
            abstimmungenBasis="/parlamente/berlin/abstimmungen"
            gesetzeAlleHref="/parlamente/berlin/drucksachen?klasse=gesetzentwurf"
          />
        </Suspense>
      </main>
    </div>
  );
}
