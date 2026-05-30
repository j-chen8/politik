import { ContextualLink as Link } from "@/components/ContextualLink";
import { AlertTriangle, ExternalLink, ArrowLeft } from "lucide-react";
import { listSourceCoherenceConflicts, getSourceCoherenceStats } from "@/lib/db";

export const metadata = {
  title: "Quellen-Diskrepanzen | Politik-Radar",
  description:
    "Alle echten Quellen-Widersprüche zwischen Wikipedia und persönlichen Politiker-Homepages, die unsere Source-Coherence-Pipeline entdeckt hat.",
};

const SECTION_LABEL: Record<string, string> = {
  ausbildung: "Ausbildung",
  beruflicher_werdegang: "Beruflicher Werdegang",
  politische_stationen: "Politische Stationen",
  sonstiges: "Sonstiges",
};

export default function LinearQuellenDiskrepanzen() {
  const rows = listSourceCoherenceConflicts();
  const stats = getSourceCoherenceStats();

  return (
    <div className="page-wash">
      <div className="max-w-5xl mx-auto px-5 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[12px] text-zinc-500 hover:text-zinc-950 mb-6 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" strokeWidth={2.25} /> zurück zur Startseite
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-zinc-700" strokeWidth={2.25} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Source-Coherence
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] leading-[1.05] text-zinc-950 mb-4">
          Quellen-Diskrepanzen offengelegt
        </h1>
        <p className="text-[16px] text-zinc-600 leading-relaxed mb-2 max-w-3xl">
          Lebensläufe aus zwei unabhängigen Quellen — Wikipedia und persönlichen
          Politiker-Webseiten — automatisch auf Widersprüche geprüft. Bei{" "}
          <span className="font-medium text-zinc-950">
            {stats.politiciansWithEchtConflicts} von {stats.checked.toLocaleString("de-DE")} geprüften MdBs
          </span>{" "}
          haben wir {stats.totalEchtConflicts} echte Quellen-Konflikte gefunden.
        </p>
        <p className="text-[14px] text-zinc-500 leading-relaxed max-w-3xl mb-8">
          Falsche Schul-Orte, ungenaue Funktionsangaben, veraltete Berufs-Stände — wir
          weisen diese Diskrepanzen pro Konflikt mit beiden Originalquellen aus.{" "}
          <Link href="/methodik" className="text-zinc-900 font-medium hover:underline">
            Methodik &amp; Verifier-Cascade →
          </Link>
        </p>

        <div className="space-y-3">
          {rows.map(row => (
            <article
              key={row.politicianId}
              className="bg-white border border-zinc-200/70 rounded-2xl p-5 hover:border-zinc-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <Link
                    href={`/politiker/${row.politicianId}`}
                    className="text-[17px] font-semibold text-zinc-950 hover:text-zinc-700 transition-colors inline-flex items-center gap-1.5"
                  >
                    {row.firstName} {row.lastName}
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" strokeWidth={2.25} />
                  </Link>
                  {row.party && (
                    <span className="ml-2 text-[12px] text-zinc-500">· {row.party}</span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-zinc-700 bg-zinc-100 px-2 py-1 rounded-full whitespace-nowrap uppercase tracking-wider">
                  {row.conflicts.length === 1 ? "1 Konflikt" : `${row.conflicts.length} Konflikte`}
                </span>
              </div>

              <ul className="space-y-2.5">
                {row.conflicts.map((c, i) => (
                  <li
                    key={i}
                    className="text-[13.5px] leading-snug rounded-xl border border-zinc-200/70 bg-zinc-50/50 px-4 py-3"
                  >
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                      {SECTION_LABEL[c.section] ?? c.section} · {c.jahr}
                    </div>
                    <div className="space-y-1.5 text-zinc-800">
                      <div>
                        <span className="font-semibold text-zinc-600">Wikipedia:</span> {c.wikipedia}
                      </div>
                      <div>
                        <span className="font-semibold text-zinc-600">Homepage:</span> {c.homepage}
                      </div>
                      {c.final_reason && (
                        <div className="text-[12px] text-zinc-500 italic pt-2 border-t border-zinc-200/60 mt-2">
                          {c.final_reason}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-12 text-zinc-500">
            Keine echten Diskrepanzen — alle geprüften Profile sind quellen-kohärent.
          </div>
        )}
      </div>
    </div>
  );
}
