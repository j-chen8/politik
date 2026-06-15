import { VorschauGuidedSearch } from "@/components/VorschauGuidedSearch";

export const metadata = {
  title: "Vorschau — Politik-Radar",
  description: "Schlanke Startseite: suchen oder mit einem Klick erkunden.",
};

/**
 * Bewusst karge Landingpage (User-Ansage 2026-06-06): „jemandem die Möglichkeit
 * geben, etwas zu suchen oder zu erkunden, ohne dass die Seite überladen ist."
 * Launcher-Prinzip: kurze Wert-Zeile + EIN geführtes Suchfeld, dessen Chips das
 * Erkunden tragen (ChatGPT-artig, progressiv). Keine Shelves, keine Bottom-Nav,
 * kein Modus-Dropdown — die Chips vereinen Suchmodus und Erkundung.
 */

export default function VorschauPage() {
  return (
    <div className="page-wash flex min-h-screen flex-col">
      {/* Vorschau-Hinweis */}
      <div className="border-b border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-2 text-center text-[12px] text-amber-800 dark:text-amber-400">
        Design-Vorschau · deine echte Startseite bleibt unter <code className="font-mono">/</code>
      </div>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-5 pb-24 pt-[12vh]">
        {/* ── Wert in einer Zeile ── */}
        <section className="fade-in-up text-center">
          <h1 className="text-[2.5rem] font-semibold leading-[1.02] tracking-[-0.04em] text-balance text-zinc-950 sm:text-[2.9rem] dark:text-zinc-50">
            Woran arbeitet der&nbsp;Bundestag?
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15.5px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            Durchsuchen oder erkunden.
          </p>
        </section>

        {/* ── Geführte Suche: tippen oder Chips antippen ── */}
        <section className="fade-in-up fade-in-up-2 mt-7">
          <VorschauGuidedSearch />
        </section>
      </main>
    </div>
  );
}
