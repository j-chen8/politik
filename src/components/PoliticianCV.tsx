import { GraduationCap, Briefcase, Landmark, Star } from "lucide-react";

export interface CV {
  ausbildung: { jahr: string; text: string }[];
  beruflicher_werdegang: { jahr: string; text: string }[];
  politische_stationen: { jahr: string; text: string }[];
  sonstiges: { jahr: string; text: string }[];
}

const SECTIONS = [
  { key: "ausbildung",            label: "Ausbildung",            icon: GraduationCap, color: "text-blue-600" },
  { key: "beruflicher_werdegang", label: "Beruflicher Werdegang", icon: Briefcase,     color: "text-amber-600" },
  { key: "politische_stationen",  label: "Politische Stationen",  icon: Landmark,      color: "text-purple-600" },
  { key: "sonstiges",             label: "Sonstiges",             icon: Star,          color: "text-emerald-600" },
] as const;

export function PoliticianCV({ cv }: { cv: CV }) {
  const nonEmpty = SECTIONS.filter((s) => cv[s.key]?.length > 0);
  if (nonEmpty.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-border p-6 mb-6">
      <div className="flex items-baseline justify-between mb-5">
        <h2 className="text-lg font-bold">Lebenslauf</h2>
        <span className="text-xs text-muted">KI-extrahiert aus Wikipedia · ggf. lückenhaft</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {nonEmpty.map(({ key, label, icon: Icon, color }) => (
          <div key={key}>
            <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${color}`}>
              <Icon className="w-4 h-4" />
              {label}
            </h3>
            <ul className="space-y-2">
              {cv[key].map((entry, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="font-mono text-xs text-muted shrink-0 w-20 pt-0.5">
                    {entry.jahr}
                  </span>
                  <span className="text-foreground/90 leading-snug">{entry.text}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
