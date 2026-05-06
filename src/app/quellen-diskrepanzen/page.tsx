import Link from "next/link";
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

export default function QuellenDiskrepanzen() {
  const rows = listSourceCoherenceConflicts();
  const stats = getSourceCoherenceStats();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> zurück zur Startseite
      </Link>

      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-amber-700" />
        <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
          Source-Coherence
        </span>
      </div>
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
        Quellen-Diskrepanzen offengelegt
      </h1>
      <p className="text-foreground/85 leading-relaxed mb-2 max-w-3xl">
        Wir extrahieren Lebensläufe aus zwei unabhängigen Quellen — Wikipedia und
        persönlichen Politiker-Webseiten — und vergleichen sie automatisch auf
        Widersprüche. Bei{" "}
        <strong>{stats.politiciansWithEchtConflicts} von {stats.checked.toLocaleString("de-DE")} geprüften MdBs</strong>{" "}
        haben wir {stats.totalEchtConflicts} echte Quellen-Konflikte gefunden.
      </p>
      <p className="text-foreground/70 text-sm leading-relaxed max-w-3xl mb-6">
        Falsche Schul-Orte, ungenaue Funktionsangaben, veraltete Berufs-Stände — wir
        verschleiern diese Diskrepanzen nicht, sondern weisen sie pro Konflikt mit
        beiden Originalquellen aus.{" "}
        <Link href="/methodik" className="text-primary hover:underline">
          Methodik &amp; Verifier-Cascade →
        </Link>
      </p>

      <div className="space-y-3">
        {rows.map(row => (
          <article
            key={row.politicianId}
            className="bg-white border border-border rounded-2xl p-5 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <Link
                  href={`/politiker/${row.politicianId}`}
                  className="text-lg font-bold text-foreground hover:text-primary transition inline-flex items-center gap-1"
                >
                  {row.firstName} {row.lastName}
                  <ExternalLink className="w-3.5 h-3.5 text-muted" />
                </Link>
                {row.party && (
                  <span className="ml-2 text-xs text-muted">· {row.party}</span>
                )}
              </div>
              <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded-full whitespace-nowrap">
                {row.conflicts.length === 1 ? "1 Konflikt" : `${row.conflicts.length} Konflikte`}
              </span>
            </div>

            <ul className="space-y-3">
              {row.conflicts.map((c, i) => (
                <li
                  key={i}
                  className="text-[13px] leading-snug rounded-md border border-amber-200 bg-amber-50/50 px-3 py-2.5"
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-900/70 mb-1.5">
                    {SECTION_LABEL[c.section] ?? c.section} · {c.jahr}
                  </div>
                  <div className="space-y-1 text-amber-950/85">
                    <div>
                      <span className="font-semibold">Wikipedia:</span> {c.wikipedia}
                    </div>
                    <div>
                      <span className="font-semibold">Homepage:</span> {c.homepage}
                    </div>
                    {c.final_reason && (
                      <div className="text-[11px] text-amber-800/80 italic pt-1.5 border-t border-amber-200/60 mt-1.5">
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
        <div className="text-center py-12 text-muted">
          Keine echten Diskrepanzen — alle geprüften Profile sind quellen-kohärent.
        </div>
      )}
    </div>
  );
}
