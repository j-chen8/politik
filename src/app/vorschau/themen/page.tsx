import { Suspense } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import { VorschauThemen } from "@/components/VorschauThemen";

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
export default function VorschauThemenPage() {
  return (
    <div className={`${display.variable} page-wash flex min-h-screen flex-col`}>
      <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-[12px] text-amber-800">
        Dummy-Vorschau · Platzhalter-Daten · prüft nur die Klick-Logik
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-10">
        <Suspense fallback={<div className="h-64" />}>
          <VorschauThemen />
        </Suspense>

        {/* ── Daten-Spec: was die Seite an Daten braucht ── */}
        <details className="mt-16 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 text-[13px] dark:border-zinc-800 dark:bg-zinc-900/30">
          <summary className="cursor-pointer font-medium text-zinc-600 dark:text-zinc-300">
            Welche Daten steckt dahinter? (Spec)
          </summary>
          <div className="mt-3 space-y-3 text-zinc-600 dark:text-zinc-400">
            <p><strong className="text-zinc-800 dark:text-zinc-200">Muss die LLM-Analyse NEU liefern (pro Item):</strong></p>
            <ul className="ml-4 list-disc space-y-1">
              <li><code>unterthema[]</code> — 1–3 aus geschlossener Liste pro Oberthema (multi-label)</li>
              <li><code>spezifische_tags[]</code> — 1–4 offene, wiederverwendbare Schlagwörter (KI, Krypto, Deepfake …)</li>
            </ul>
            <p><strong className="text-zinc-800 dark:text-zinc-200">Rechnet sich von selbst (kein LLM):</strong></p>
            <ul className="ml-4 list-disc space-y-1">
              <li>Teaser („was ist drin") → die Unterthemen-/Tag-Namen selbst</li>
              <li>„Verbindet sich mit" (das Netz) → Mit-Vorkommen der Tags über Felder (Korrelation); der Teaser je Tür = das jüngste real verbindende Dokument (kein Label)</li>
              <li>„Gerade aktiv" → nach <code>datum</code> sortieren; Einzeiler = vorhandene <code>zusammenfassung</code></li>
            </ul>
            <p><strong className="text-zinc-800 dark:text-zinc-200">Bewusst NICHT gezeigt:</strong> Menge/Volumen — Verfahrens-Artefakt, ≠ Bedeutung, für den Besucher irrelevant. Volumen ist nur Build-Zeit-Designtreiber (welche Knoten existieren).</p>
            <p><strong className="text-amber-700 dark:text-amber-500">Offene Datenfrage:</strong> „Gerade aktiv" = nur neueste (gratis) — oder „bemerkenswert"? Letzteres bräuchte ein eigenes Salienz-Signal, das es noch nicht gibt.</p>
          </div>
        </details>
      </main>
    </div>
  );
}
