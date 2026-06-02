import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";

export const metadata = {
  title: "Wie aus deiner Stimme ein Sitz wird | Politik-Radar",
  description:
    "Wie wird aus deiner Stimme ein Sitz im Bundestag? Einfach erklärt in drei Schritten — und warum es zählt, wählen zu gehen.",
};

const ACCENT = "#1a3e72";

/** Generische Sitz-Illustration: 10 Plätze, davon einige hervorgehoben. Keine Parteifarben. */
function Seats({ filled, total = 10 }: { filled: number; total?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="h-5 w-5 rounded-md"
          style={i < filled ? { backgroundColor: ACCENT } : { backgroundColor: "#e4e4e7" }}
        />
      ))}
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div
        className="shrink-0 grid place-items-center h-9 w-9 rounded-full text-white text-[16px] font-semibold"
        style={{ backgroundColor: ACCENT }}
      >
        {n}
      </div>
      <div className="pt-1">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-zinc-950 mb-2 leading-snug">
          {title}
        </h2>
        <div className="text-[16px] text-zinc-600 leading-relaxed space-y-2">{children}</div>
      </div>
    </div>
  );
}

export default function WieStimmenSitzeWerdenPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-xl mx-auto px-5 py-16 fade-in-up">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          Bundestag · einfach erklärt
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4 leading-[1.05]">
          Wie aus deiner Stimme ein Sitz wird
        </h1>
        <p className="text-[18px] text-zinc-600 leading-relaxed mb-12">
          Der Bundestag hat 630 Plätze. Wie sie verteilt werden — in fünf einfachen Schritten.
        </p>

        <div className="space-y-10">
          <Step n={1} title="Zur Bundestagswahl hast du zwei Stimmen.">
            <p>
              Eine <strong className="text-zinc-950">Erststimme</strong> und eine{" "}
              <strong className="text-zinc-950">Zweitstimme</strong>. Die wichtigere ist — ganz
              verwirrend — die <strong className="text-zinc-950">Zweitstimme</strong>.
            </p>
          </Step>

          <Step n={2} title="Die zweite Stimme entscheidet, wie viele Plätze jede Partei bekommt.">
            <p>
              Das ist die wichtigste Regel. Bekommt eine Partei jede fünfte Stimme, bekommt sie
              ungefähr jeden fünften der 630 Plätze. <strong className="text-zinc-950">20 % der
              Stimmen → 20 % der Plätze.</strong>
            </p>
            <div className="rounded-2xl border border-zinc-200/70 bg-white px-5 py-4 mt-1">
              <Seats filled={2} />
              <p className="text-[14px] text-zinc-500 mt-3">
                2 von 10 Menschen wählen diese Partei → sie bekommt 2 von 10 Plätzen.
              </p>
            </div>
          </Step>

          <Step n={3} title="Die erste Stimme wählt eine Person aus deinem Wahlkreis.">
            <p>
              Deutschland ist in <strong className="text-zinc-950">299 Wahlkreise</strong> geteilt —
              kleine Gebiete. In jedem gewinnt die Person mit den meisten ersten Stimmen.
            </p>
          </Step>

          <Step n={4} title="Wer seinen Wahlkreis gewinnt, bekommt einen Platz seiner Partei.">
            <p>
              <strong className="text-zinc-950">Wichtig: Das ist kein Platz extra.</strong> Er gehört
              zu den Plätzen, die die Partei über die zweite Stimme sowieso schon bekommen hat. Das
              Direktmandat füllt einen Platz — es legt keinen obendrauf.
            </p>
          </Step>

          <Step n={5} title="Den Rest füllt die Liste der Partei.">
            <p>
              Hat eine Partei mehr Plätze verdient, als sie Wahlkreise gewonnen hat, kommen die
              übrigen von einer <strong className="text-zinc-950">Liste</strong>. Die legt die Partei
              vor der Wahl fest — durchnummeriert, Platz 1 zuerst. So ist der Bundestag komplett.
            </p>
          </Step>
        </div>

        {/* Das Wichtige */}
        <div className="mt-12 rounded-2xl border-l-2 bg-white px-6 py-5" style={{ borderColor: ACCENT }}>
          <p className="text-[13px] font-semibold uppercase tracking-wider mb-2" style={{ color: ACCENT }}>
            Und jetzt das Wichtige
          </p>
          <p className="text-[17px] text-zinc-800 leading-relaxed">
            Je mehr Menschen in deinem Bundesland wählen gehen, desto{" "}
            <strong className="text-zinc-950">mehr Plätze bekommt dein Bundesland</strong> im Bundestag.
            Gehst du nicht wählen, zählt dein Bundesland ein bisschen weniger.
          </p>
          <p className="text-[15px] text-zinc-600 leading-relaxed mt-3">
            Berlin (ein eigenes Bundesland) hat rund{" "}
            <strong className="text-zinc-950">2,4 Millionen Wahlberechtigte</strong>.
            Nach dieser Größe stünden Berlin etwa <strong className="text-zinc-950">26 Plätze</strong> zu.
            Bekommen hat Berlin aber nur <strong className="text-zinc-950">24</strong> — weil hier ein
            bisschen weniger Menschen wählen gegangen sind als im Rest von Deutschland.
          </p>
        </div>

        <p className="text-[17px] text-zinc-700 leading-relaxed mt-8">
          Deine Stimme entscheidet also <strong className="text-zinc-950">zwei Dinge</strong>: wer
          für dich hingeht — und wie viele Leute aus deinem Bundesland überhaupt dabei sind.{" "}
          <strong className="text-zinc-950">Darum lohnt es sich, wählen zu gehen.</strong>
        </p>

        {/* Optionale Tiefe */}
        <details className="group mt-12 rounded-2xl border border-zinc-200/70 bg-white px-5 py-4">
          <summary className="cursor-pointer list-none flex items-center justify-between text-[15px] font-medium text-zinc-800 select-none">
            <span>Noch genauer? Für alle, die’s wissen wollen.</span>
            <span className="text-zinc-400 group-open:rotate-180 transition-transform">▾</span>
          </summary>

          <div className="mt-5 space-y-6 text-[15px] text-zinc-600 leading-relaxed">
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-950 mb-1">Direktmandat &amp; Liste</h3>
              <p>
                Deutschland hat <strong className="text-zinc-950">299 Wahlkreise</strong>. Wer in einem
                Wahlkreis die meisten Erststimmen holt, zieht direkt ein („Direktmandat“). Alle anderen
                Sitze einer Partei werden über ihre <strong className="text-zinc-950">Landesliste</strong>{" "}
                gefüllt — eine Rangliste, die die Partei vor der Wahl festlegt und die öffentlich ist.
                Wichtig: Die zweite Stimme legt fest, <em>wie viele</em> Sitze eine Partei bekommt; die
                Direktmandate werden davon abgezogen, die Liste füllt nur den Rest auf.
              </p>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-zinc-950 mb-1">Beispiel Berlin 2025</h3>
              <p>
                Berlin stellte 24 Abgeordnete: 12 direkt gewählt, 12 über die Listen. Die Verteilung
                folgt fast genau den Berliner Zweitstimmen — z. B. Die Linke 19,9 % → 6 Sitze (4 direkt
                gewonnen, 2 von der Liste). Eine Stimme für eine Partei unter 5 % (wie BSW oder FDP in
                Berlin) zählte für die Sitze nicht mit, weil beide bundesweit unter der 5-%-Hürde blieben.
              </p>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-zinc-950 mb-1">Wahlkreis gewonnen, kein Sitz?</h3>
              <p>
                Seit der Reform 2023 ist der Bundestag fest 630 Plätze groß, und keine Partei bekommt
                mehr Sitze, als ihre Zweitstimmen hergeben. Gewinnt eine Partei mehr Wahlkreise, als ihr
                zustehen, gehen die knappsten Sieger:innen leer aus — 2025 betraf das 23 Wahlkreise.
              </p>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-zinc-950 mb-2">Drei Wege an der 5-%-Hürde vorbei</h3>
              <div className="space-y-3">
                <p>
                  <strong className="text-zinc-950">Grundmandatsklausel (3 Wahlkreise).</strong> Gewinnt
                  eine Partei mindestens drei Wahlkreise direkt, zieht sie mit ihrem vollen
                  Zweitstimmen-Anteil ein — auch unter 5 %. So kam Die Linke 2021 mit nur 4,9 % rein.
                  BSW (4,98 %) und FDP (4,3 %) fehlte 2025 genau dieser Rettungsanker: kein einziges
                  Direktmandat, weil breit verteilte Parteien vor Ort selten Erste werden.
                </p>
                <p>
                  <strong className="text-zinc-950">Minderheiten-Ausnahme.</strong> Parteien anerkannter
                  nationaler Minderheiten (Dänen, Friesen, Sorben, Sinti &amp; Roma) sind ganz von der
                  5-%-Hürde befreit — sie brauchen nur rund 0,16 % für einen Sitz. Deshalb sitzt Stefan
                  Seidler (SSW) mit etwa 0,2 % im Bundestag. Andere Bevölkerungsgruppen zählen rechtlich
                  nicht als „nationale Minderheit“, unabhängig von ihrer Größe.
                </p>
                <p>
                  <strong className="text-zinc-950">Parteilose.</strong> Wer ohne Partei antritt, kann
                  nur einen Wahlkreis direkt gewinnen (eine Liste gibt es für Einzelpersonen nicht). Das
                  ist so schwer, dass es seit 1949 niemand mehr geschafft hat.
                </p>
              </div>
            </div>

            <div className="text-[13px] text-zinc-400 leading-relaxed border-t border-zinc-100 pt-4">
              Die „rund 26“-Zahl ist Berlins Anteil an den bundesweit rund 59,2 Mio Wahlberechtigten
              (2,44 Mio × 630 ÷ 59,2 Mio ≈ 26) — also die Sitzzahl bei voller Beteiligung überall.
              Quellen:{" "}
              <a href="https://www.bundeswahlleiterin.de/bundestagswahlen/2025/ergebnisse/bund-99/land-11.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                Bundeswahlleiterin (Ergebnis Berlin)
              </a>{" "}
              ·{" "}
              <a href="https://www.bundeswahlleiterin.de/info/presse/mitteilungen/bundestagswahl-2025/29_25_endgueltiges-ergebnis.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                Endgültiges Ergebnis
              </a>{" "}
              ·{" "}
              <a href="https://www.bundestag.de/dokumente/textarchiv/2025/kw09-wahlkreis-unbesetzt-1055568" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                Bundestag (23 Wahlkreissieger ohne Sitz)
              </a>{" "}
              ·{" "}
              <a href="https://www.bundeswahlleiterin.de/service/glossar/g/grundmandatsklausel.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                Bundeswahlleiterin (Grundmandatsklausel)
              </a>{" "}
              ·{" "}
              <a href="https://www.wahlrecht.de/lexikon/parteilose.html" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                Wahlrechtslexikon (Parteilose)
              </a>
              . Diese Seite erklärt nur die Mechanik und ist keine Wahlempfehlung.
            </div>
          </div>
        </details>

        {/* Weiter */}
        <Link
          href="/wahlkreis"
          className="mt-8 flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3.5 hover:border-zinc-300 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 shrink-0" style={{ color: ACCENT }} strokeWidth={2.25} />
            <div className="text-[15px] font-medium text-zinc-950">
              Wer vertritt mich? Postleitzahl eingeben →
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" strokeWidth={2.25} />
        </Link>
      </div>
    </div>
  );
}
