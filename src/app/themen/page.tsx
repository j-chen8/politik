import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Bricolage_Grotesque } from "next/font/google";
import { VorschauThemen } from "@/components/VorschauThemen";
import { getThemenBlatt, getThemenStruktur } from "@/lib/themen-blatt";
import { anzeigeName, resolveUnter, unterSlug } from "@/lib/themen-struktur";

// Charaktervolle Display-Schrift nur für diese Seite (Headlines) — gibt dem
// weichen Look ein modernes Gesicht statt des techy Geist. Body bleibt Geist.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "Themen — Politik-Radar",
  description:
    "Woran der Bundestag arbeitet, sortiert nach Themen: 14 Themenfelder, jedes Unterthema mit Vorgängen, Abstimmungen und Redner:innen.",
};

/**
 * DAS Themensystem (seit 2026-06-13 unter /themen, vorher /vorschau/themen):
 * Picker = 14 Oberthemen → 202 Unterthemen mit Live-Beständen; das Blatt wird
 * serverseitig je URL aufgelöst (Picker-Klicks navigieren via Router). Ersetzt
 * die alte aw_field-Rollup-Seite (Überzähl-Bug, lebt in der git-Historie).
 */
export default async function ThemenPage({ searchParams }: { searchParams: Promise<{ feld?: string; unter?: string }> }) {
  const { feld = "", unter = "" } = await searchParams;
  const struktur = getThemenStruktur();
  const ziel = feld && unter ? resolveUnter(feld, unter) : null;
  // Gemergte/umbenannte Cluster: alte Slugs lösen aufs Ziel auf — kanonische URL
  // erzwingen, damit der Client-Slug-Check (isLeaf) und Teil-Links konsistent sind.
  if (ziel) {
    const kanon = unterSlug(anzeigeName(ziel.unterthema));
    if (kanon !== unter) redirect(`/themen?feld=${encodeURIComponent(feld)}&unter=${kanon}`);
  }
  const blatt = ziel ? getThemenBlatt(ziel.feld, ziel.unterthema) : null;
  return (
    <div className={`${display.variable} page-wash flex min-h-screen flex-col`}>
      <main className="page-shell flex-1">
        <Suspense fallback={<div className="h-64" />}>
          <VorschauThemen struktur={struktur} blatt={blatt} />
        </Suspense>
      </main>
    </div>
  );
}
