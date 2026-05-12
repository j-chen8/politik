import Link from "next/link";
import { ArrowLeft, ListTree } from "lucide-react";
import { POLITIK_GLOSSAR, POLITIK_GLOSSAR_MAP, type PolitikGlossarEntry } from "@/lib/politik-glossar";

const categoryMeta: Record<PolitikGlossarEntry["category"], { label: string; eyebrow: string }> = {
  struktur: { label: "Strukturen", eyebrow: "Wo Politik passiert" },
  personen: { label: "Personen", eyebrow: "Wer Politik macht" },
  dokument: { label: "Dokumente", eyebrow: "Was Politik produziert" },
  verfahren: { label: "Verfahren", eyebrow: "Wie Politik abläuft" },
};

const categoryOrder: PolitikGlossarEntry["category"][] = ["struktur", "personen", "dokument", "verfahren"];

// Gruppieren für TOC
const grouped = POLITIK_GLOSSAR.reduce<Record<string, PolitikGlossarEntry[]>>((acc, e) => {
  (acc[e.category] = acc[e.category] || []).push(e);
  return acc;
}, {});

const TOC_GROUPS = categoryOrder
  .filter((c) => grouped[c] && grouped[c].length > 0)
  .map((c) => ({
    label: categoryMeta[c].label,
    anchor: `cat-${c}`,
    items: grouped[c].map((e) => ({ id: e.slug, label: e.term })),
  }));

export const metadata = {
  title: "Glossar — Politik in 25 Begriffen | Politik-Radar",
  description: "Bürgerverständliche Erklärungen zu allem, was in einer politischen Drucksache vorkommen kann.",
};

export default function GlossarPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-6xl mx-auto px-5 py-12 fade-in-up">
        <Link
          href="/design/linear"
          className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-950 transition-colors mb-8"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Übersicht
        </Link>

        {/* Mobile: TOC am Anfang als ausklappbares Detail-Element */}
        <details className="lg:hidden mb-8 rounded-2xl border border-zinc-200/70 bg-white">
          <summary className="cursor-pointer px-4 py-3 flex items-center gap-2 text-[12px] font-medium text-zinc-700">
            <ListTree className="w-3.5 h-3.5" strokeWidth={2.25} />
            Inhaltsverzeichnis
          </summary>
          <div className="px-4 pb-4">
            <TableOfContents />
          </div>
        </details>

        <div className="lg:flex lg:gap-12">
          <main className="lg:flex-1 lg:max-w-3xl">
            {/* Hero */}
            <div className="mb-12">
              <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                Bürgerverständlich
              </span>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4">
                Politik in {POLITIK_GLOSSAR.length} Begriffen.
              </h1>
              <p className="text-[16px] text-zinc-600 leading-relaxed max-w-2xl">
                Wenn dir auf einer Drucksachen-Seite ein Begriff begegnet, den du nicht kennst —
                schau hier nach. Bürgerverständliche Erklärungen zu allem, was in einer politischen
                Drucksache vorkommen kann. Verwandte Begriffe sind verlinkt.
              </p>
            </div>

            {/* Kategorien */}
            {categoryOrder.map((cat) => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;
              return (
                <section key={cat} id={`cat-${cat}`} className="mb-14 scroll-mt-20">
                  <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-1">
                    {categoryMeta[cat].eyebrow}
                  </div>
                  <h2 className="text-[24px] font-semibold tracking-[-0.025em] text-zinc-950 mb-7">
                    {categoryMeta[cat].label}
                  </h2>
                  <div className="space-y-7">
                    {items.map((e) => (
                      <article key={e.slug} id={e.slug} className="scroll-mt-20">
                        <h3 className="text-[18px] font-semibold text-zinc-950 mb-2">
                          {e.term}
                        </h3>
                        <p className="text-[14.5px] text-zinc-700 leading-relaxed mb-2.5">
                          {e.short}
                        </p>
                        {e.example && (
                          <p className="text-[13px] text-zinc-500 border-l-2 border-zinc-200 pl-3 italic mb-2.5">
                            {e.example}
                          </p>
                        )}
                        {e.related && e.related.length > 0 && (
                          <div className="text-[11.5px] text-zinc-400">
                            Verwandt:{" "}
                            {e.related.map((relSlug, idx) => {
                              const rel = POLITIK_GLOSSAR_MAP[relSlug];
                              if (!rel) return null;
                              return (
                                <span key={relSlug}>
                                  {idx > 0 && <span className="text-zinc-300"> · </span>}
                                  <a
                                    href={`#${rel.slug}`}
                                    className="text-zinc-500 hover:text-zinc-950 underline underline-offset-2 decoration-zinc-300 hover:decoration-zinc-700"
                                  >
                                    {rel.term}
                                  </a>
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}

            {/* Footer */}
            <div className="text-[11.5px] text-zinc-400 leading-relaxed border-t border-zinc-200 pt-6 mt-8">
              Alle Erklärungen sind bürgerverständlich formuliert und zielen auf eine erste Orientierung.
              Für rechtliche Detailfragen sind die Geschäftsordnung des Bundestages und das Grundgesetz maßgeblich.
            </div>
          </main>

          {/* Desktop: Sticky-Sidebar TOC */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-20">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-1.5">
                <ListTree className="w-3 h-3" strokeWidth={2.25} />
                Auf dieser Seite
              </div>
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function TableOfContents() {
  return (
    <nav className="space-y-5 text-[12.5px]">
      {TOC_GROUPS.map((group) => (
        <div key={group.label}>
          <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 mb-1.5">
            <a href={`#${group.anchor}`} className="hover:text-zinc-700 transition-colors">
              {group.label}
            </a>
          </div>
          <ul className="space-y-0.5 border-l border-zinc-200">
            {group.items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block pl-3 -ml-px border-l border-transparent hover:border-zinc-900 hover:text-zinc-950 text-zinc-600 py-1 leading-snug transition-colors"
                >
                  <span className="block font-medium">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
