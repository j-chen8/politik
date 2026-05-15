import { getShowcasePolitician } from "@/lib/db";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("de-DE");

/**
 * Beispiel-Profil auf der Landing-Page. Neutral: zufälliger, aktiver MdB
 * (siehe getShowcasePolitician). Rotiert pro Request, da die Landing-Page
 * force-dynamic ist.
 */
export function ShowcasePolitician() {
  const p = getShowcasePolitician();
  if (!p) return null;

  const stats = [
    { value: p.speechCount, label: "Reden" },
    { value: p.activityCount, label: "Aktivitäten" },
    { value: p.votesParticipated, label: "Abstimmungen" },
  ];

  return (
    <section className="w-full max-w-5xl mx-auto px-5 pb-24">
      <div className="mb-4">
        <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-0.5">
          Beispiel-Profil
        </div>
        <h3 className="text-lg font-semibold text-zinc-950 tracking-tight">
          So sieht ein Abgeordneten-Profil aus
          <span className="ml-2 text-[12px] font-normal text-zinc-400">
            zufällig gewählt, wechselt bei jedem Aufruf
          </span>
        </h3>
      </div>

      <Link
        href={`/design/linear/politiker/${p.id}`}
        className="card-hover group block bg-white border border-zinc-200/70 rounded-2xl p-6"
      >
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <PoliticianAvatar
              photoUrl={p.photoUrl}
              firstName={p.firstName}
              lastName={p.lastName}
              party={p.partyLabel}
              size="xl"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-semibold text-zinc-950 tracking-tight truncate">
              {p.title ? `${p.title} ` : ""}
              {p.firstName} {p.lastName}
            </div>
            <div className="text-[13px] text-zinc-500 mt-0.5 truncate">
              {p.partyLabel || "parteilos"}
            </div>

            <div className="flex gap-6 mt-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-[18px] font-semibold text-zinc-950 num leading-none">
                    {fmt(s.value)}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 self-center hidden sm:flex items-center gap-1.5 text-[13px] font-medium text-zinc-500 group-hover:text-zinc-950 transition-colors">
            Profil ansehen
            <ArrowRight
              className="w-4 h-4 group-hover:translate-x-0.5 transition-all"
              strokeWidth={2.25}
            />
          </div>
        </div>
      </Link>
    </section>
  );
}
