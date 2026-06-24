import { PoliticianAvatar } from "@/components/PoliticianAvatar";
import { GraduationCap, Briefcase, Users, Wallet, Vote, Globe, MessageCircleQuestion } from "lucide-react";
import type { PoliticianKompakt } from "@/lib/db";

/**
 * Kompakt-Steckbrief: ein Viewport, scan-first. Reine Label:Wert-Zeilen +
 * Schwerpunkt-Chips, keine Fließtext-Sätze (Layer-Cake-Scan). Tiefe lebt im
 * Detailliert-Modus. Empirie: reference_ux_text_budget.
 */

const COMMITTEE_ROLE_LABEL: Record<string, string> = {
  chairperson: "Vorsitz",
  vice_chairperson: "Stv. Vorsitz",
  foreperson: "Obmann/Obfrau",
  spokesperson: "Sprecher:in",
  schriftfuehrer: "Schriftführer:in",
};

function Zeile({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 py-2.5 border-t border-border first:border-t-0">
      <div className="flex items-center gap-1.5 w-32 shrink-0 text-[12px] text-zinc-500 dark:text-zinc-400">
        <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
        {label}
      </div>
      <div className="flex-1 min-w-0 text-[13.5px] text-zinc-900 dark:text-zinc-100">
        {children}
      </div>
    </div>
  );
}

export function KompaktKarte({ k }: { k: PoliticianKompakt }) {
  const kopfzeile = [
    k.rolle,
    k.wahlkreis ? `Wahlkreis ${k.wahlkreis}` : null,
    k.year_of_birth ? `Jg. ${k.year_of_birth}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const ne = k.nebeneinkuenfte;

  return (
    <div className="rounded-3xl border border-border bg-card p-5 sm:p-7 max-w-2xl">
      {/* Identität */}
      <div className="flex items-center gap-4 sm:gap-5">
        <PoliticianAvatar
          photoUrl={k.photo_url}
          firstName={k.name.split(" ").slice(-2, -1)[0] ?? k.name}
          lastName={k.name.split(" ").slice(-1)[0] ?? ""}
          party={k.party_label}
          size="card"
          fallback="muted"
        />
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50 leading-tight">
            {k.name}
          </h1>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {k.party_label && (
              <span className="text-[12px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                {k.party_label}
              </span>
            )}
            {kopfzeile && (
              <span className="text-[12.5px] text-zinc-500 dark:text-zinc-400">{kopfzeile}</span>
            )}
          </div>
        </div>
      </div>

      {/* Label:Wert + Chips */}
      <div className="mt-5">
        {k.ausbildung && (
          <Zeile icon={GraduationCap} label="Ausbildung">
            {k.ausbildung}
          </Zeile>
        )}
        {/* „kein Beruf vor dem Mandat" vorerst NICHT behaupten: Stichprobe 2026-06-14
            zeigte ~60% Falsch-Positive (cv_json ohne Werdegang). Erst nach Re-Extraktion
            aus BT-Bio/Wikipedia wieder einblenden. Bis dahin: nur echte Berufe zeigen. */}
        {k.beruf && (
          <Zeile icon={Briefcase} label="Beruf">
            {k.beruf}
          </Zeile>
        )}
        {k.ausschuesse.length > 0 && (
          <Zeile icon={Users} label="Ausschüsse">
            <div className="flex flex-col gap-0.5">
              {k.ausschuesse.map((a) => {
                const rolle = a.rolle ? COMMITTEE_ROLE_LABEL[a.rolle] : null;
                return (
                  <span key={a.label}>
                    {a.label}
                    {rolle && (
                      <span className="ml-1.5 text-[11px] font-medium text-[#1a3e72] dark:text-[#8fb3e6]">
                        {rolle}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </Zeile>
        )}

        {k.schwerpunkte.length > 0 && (
          <Zeile icon={Vote} label="Schwerpunkte">
            <div className="flex flex-wrap gap-1.5 -mt-0.5">
              {k.schwerpunkte.map((s) => (
                <span
                  key={s.feld}
                  className="inline-flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                >
                  {s.feld}
                  <span className="num text-[11px] text-zinc-500 dark:text-zinc-400">{s.count}</span>
                </span>
              ))}
            </div>
            <p className="mt-1.5 text-[10.5px] text-zinc-400 dark:text-zinc-500">
              Reden + eingebrachte Drucksachen je Politikfeld
            </p>
          </Zeile>
        )}

        <Zeile icon={Wallet} label="Nebeneinkünfte">
          {ne.kind === "betrag" ? (
            <>
              <span className="font-medium">mind. {ne.minEuro.toLocaleString("de-DE")} €</span>
              <span className="text-zinc-500 dark:text-zinc-400">
                {" "}· {ne.anzahl} {ne.anzahl === 1 ? "Tätigkeit" : "Tätigkeiten"}
              </span>
            </>
          ) : ne.kind === "unbeziffert" ? (
            <span className="text-zinc-600 dark:text-zinc-300">
              {ne.anzahl} {ne.anzahl === 1 ? "Tätigkeit" : "Tätigkeiten"} gemeldet, Vergütung nicht beziffert
            </span>
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">keine gemeldet</span>
          )}
        </Zeile>

        {k.social.length > 0 && (
          <Zeile icon={Globe} label="Online">
            <div className="flex flex-wrap gap-x-2.5 gap-y-1">
              {k.social.map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </Zeile>
        )}

        {k.abstimmung.verfuegbar ? (
          <Zeile icon={Vote} label="Abstimmungen">
            <span className="num font-medium">
              {k.abstimmung.teilgenommen}/{k.abstimmung.gesamt}
            </span>{" "}
            teilgenommen
            {!k.abstimmung.fraktionslos && (
              <>
                {" · "}
                <span className="num font-medium">{k.abstimmung.abweichungen}×</span> abweichend von
                der eigenen Fraktion
              </>
            )}
          </Zeile>
        ) : (
          <Zeile icon={Vote} label="Abstimmungen">
            <span className="text-zinc-500 dark:text-zinc-400">
              nur auf Fraktionsebene erfasst
            </span>
          </Zeile>
        )}

        {k.fragen && (
          <Zeile icon={MessageCircleQuestion} label="Schriftliche Fragen">
            <a
              href={`/fragen?q=${encodeURIComponent(k.fragen.query)}`}
              className="text-[#1a3e72] dark:text-[#8fb3e6] hover:underline"
            >
              <span className="num font-medium">{k.fragen.anzahl}</span> an die Bundesregierung
              gestellt
            </a>
          </Zeile>
        )}
      </div>
    </div>
  );
}
