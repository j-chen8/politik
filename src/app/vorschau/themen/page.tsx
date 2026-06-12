import { Suspense } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { VorschauThemen } from "@/components/VorschauThemen";
import { getThemenBlatt, getThemenStruktur } from "@/lib/themen-blatt";
import { resolveUnter } from "@/lib/themen-struktur";

// Charaktervolle Display-Schrift nur für diese Seite (Headlines) — gibt dem
// weichen Look ein modernes Gesicht statt des techy Geist. Body bleibt Geist.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Themen-Vorschau — Politik-Radar",
  description: "Durchklickbare Dummy-Vorschau der Themen-Browse-Logik (3 Ebenen).",
};

/**
 * DUMMY-Vorschau (User 2026-06-08): die Browse-Logik durchklickbar machen, BEVOR
 * die LLM-Klassifikation läuft — um (a) die Klick-Belohnung zu prüfen und (b) die
 * Daten-Spec rauszuzwingen. Echte Seite bleibt unter „/". Daten in VorschauThemen
 * sind Platzhalter (Volumina teils echt aus DB-Scans).
 */
export default async function VorschauThemenPage({ searchParams }: { searchParams: Promise<{ feld?: string; unter?: string }> }) {
  // Komplett echte Daten seit dem globalen Klassifikations-Lauf (2026-06-12):
  // Struktur = 14 Oberthemen → 202 Unterthemen mit Live-Beständen; das Blatt
  // wird serverseitig je URL aufgelöst (Picker-Klicks navigieren via Router).
  const { feld = "", unter = "" } = await searchParams;
  const struktur = getThemenStruktur();
  const ziel = feld && unter ? resolveUnter(feld, unter) : null;
  const blatt = ziel ? getThemenBlatt(ziel.feld, ziel.unterthema) : null;
  return (
    <div className={`${display.variable} page-wash flex min-h-screen flex-col`}>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-6">
        <Suspense fallback={<div className="h-64" />}>
          <VorschauThemen struktur={struktur} blatt={blatt} />
        </Suspense>
        {/* Daten-Spec-<details> entfernt (User 2026-06-11) — die Spec lebt in
            docs/themen-unterthemen-design.md + den Code-Kommentaren der Komponente. */}
      </main>
    </div>
  );
}
