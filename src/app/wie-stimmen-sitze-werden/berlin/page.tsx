import Link from "next/link";
import { ArrowRight, MapPin, Landmark } from "lucide-react";

export const metadata = {
  title: "Wie aus deiner Stimme ein Sitz wird — Abgeordnetenhaus Berlin | Politik-Radar",
  description:
    "Wie wird aus deiner Stimme ein Sitz im Berliner Abgeordnetenhaus? Einfach erklärt in fünf Schritten — und was anders ist als bei der Bundestagswahl.",
};

const ACCENT = "#0f766e"; // Teal — wie die Abgeordnetenhaus-Ebene auf /wahlkreis. Keine Parteifarbe.

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

export default function WieStimmenSitzeWerdenBerlinPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-xl mx-auto px-5 pt-6 pb-24 fade-in-up">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          Abgeordnetenhaus Berlin · einfach erklärt
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4 leading-[1.05]">
          Wie aus deiner Stimme ein Sitz wird
        </h1>
        <p className="text-[18px] text-zinc-600 leading-relaxed mb-12">
          Das Berliner Abgeordnetenhaus hat mindestens 130 Plätze. Wie sie verteilt werden —
          in fünf einfachen Schritten.
        </p>

        <div className="space-y-10">
          <Step n={1} title="Du hast zwei Stimmen.">
            <p>
              Eine <strong className="text-zinc-950">Erststimme</strong> und eine{" "}
              <strong className="text-zinc-950">Zweitstimme</strong> — wie bei der Bundestagswahl. Die
              wichtigere ist die <strong className="text-zinc-950">Zweitstimme</strong>.
            </p>
          </Step>

          <Step n={2} title="Die Zweitstimme entscheidet, wie viele Plätze jede Partei bekommt.">
            <p>
              Jede fünfte Stimme → ungefähr jeder fünfte Platz.{" "}
              <strong className="text-zinc-950">20 % der Stimmen → 20 % der Plätze.</strong>
            </p>
            <div className="rounded-2xl border border-zinc-200/70 bg-white px-5 py-4 mt-1">
              <Seats filled={2} />
              <p className="text-[14px] text-zinc-500 mt-3">
                2 von 10 Menschen wählen diese Partei → sie bekommt 2 von 10 Plätzen.
              </p>
            </div>
          </Step>

          <Step n={3} title="Die Erststimme wählt eine Person aus deinem Wahlkreis.">
            <p>
              Berlin hat <strong className="text-zinc-950">78 Wahlkreise</strong>. Wer dort die meisten
              Erststimmen holt, zieht direkt ein („Direktmandat“).
            </p>
          </Step>

          <Step n={4} title="Gewinnt eine Partei mehr Wahlkreise als ihr zustehen, kommen die Sitze obendrauf.">
            <p>
              Holt eine Partei mehr Wahlkreise, als ihr nach Zweitstimmen zustehen, darf sie die
              zusätzlichen Sitze behalten — die <strong className="text-zinc-950">Überhangmandate</strong>.
              Das Parlament wächst dann über seine 130 Plätze hinaus.
            </p>
            <p>
              <strong className="text-zinc-950">Das ist der große Unterschied zum Bundestag</strong> —
              der hat seit 2023 fest 630 Plätze und keine Überhangmandate mehr.
            </p>
          </Step>

          <Step n={5} title="Den Rest füllen die Listen — mit Ausgleich.">
            <p>
              Die übrigen Plätze kommen von den Listen: in Berlin wahlweise eine{" "}
              <strong className="text-zinc-950">Landesliste</strong> oder{" "}
              <strong className="text-zinc-950">Bezirkslisten</strong> in den zwölf Bezirken.
            </p>
            <p>
              Damit Überhangmandate das Verhältnis nicht verzerren, bekommen die anderen Parteien{" "}
              <strong className="text-zinc-950">Ausgleichsmandate</strong>. Darum hat das Abgeordnetenhaus{" "}
              <strong className="text-zinc-950">mindestens 130</strong> Plätze — oft mehr.
            </p>
          </Step>
        </div>

        {/* Das Wichtige */}
        <div className="mt-12 rounded-2xl border-l-2 bg-white px-6 py-5" style={{ borderColor: ACCENT }}>
          <p className="text-[13px] font-semibold uppercase tracking-wider mb-2" style={{ color: ACCENT }}>
            Und jetzt das Wichtige
          </p>
          <p className="text-[17px] text-zinc-800 leading-relaxed">
            Berlin ist ein eigenes Bundesland und gleichzeitig eine Stadt — über dem Abgeordnetenhaus
            gibt es keine weitere Ebene.{" "}
            <strong className="text-zinc-950">Deine Zweitstimme formt direkt das ganze Parlament.</strong>
          </p>
          <p className="text-[15px] text-zinc-600 leading-relaxed mt-3">
            Neu ab 2026: In Berlin wählst du das Abgeordnetenhaus schon mit{" "}
            <strong className="text-zinc-950">16</strong> (Bundestag erst ab 18). Am selben Tag, dem{" "}
            <strong className="text-zinc-950">20. September 2026</strong>, wählst du auch deine{" "}
            <strong className="text-zinc-950">Bezirksverordnetenversammlung</strong>.
          </p>
        </div>

        <p className="text-[17px] text-zinc-700 leading-relaxed mt-8">
          Deine Stimme entscheidet zwei Dinge: wer für dich hingeht — und wie stark jede Partei wird.{" "}
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
                Berlin hat <strong className="text-zinc-950">78 Wahlkreise</strong>. Wer in einem
                Wahlkreis die meisten Erststimmen holt, zieht direkt ein („Direktmandat“) — es zählt
                die <strong className="text-zinc-950">relative Mehrheit</strong>, eine absolute
                Mehrheit ist nicht nötig. Alle anderen Sitze einer Partei werden über ihre Listen
                gefüllt. Die zweite Stimme legt fest, <em>wie viele</em> Sitze eine Partei bekommt;
                die Direktmandate werden davon abgezogen, die Liste füllt nur den Rest auf.
              </p>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-zinc-950 mb-1">Landesliste oder Bezirkslisten?</h3>
              <p>
                Anders als beim Bundestag (eine Landesliste je Bundesland) können Parteien in Berlin
                wählen: eine <strong className="text-zinc-950">Landesliste</strong> für das ganze
                Wahlgebiet — oder je eine <strong className="text-zinc-950">Bezirksliste</strong> in
                den zwölf Bezirken. Über welche Liste eine gewählte Person am Ende einzieht, hängt
                davon ab, wie die Partei ihre Listen aufgestellt hat.
              </p>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-zinc-950 mb-1">5-%-Hürde</h3>
              <p>
                Eine Partei mit weniger als <strong className="text-zinc-950">5 %</strong> der
                Zweitstimmen bekommt keine Sitze. Ausnahme: Holt sie{" "}
                <strong className="text-zinc-950">mindestens ein Direktmandat</strong> in einem
                Wahlkreis, wird sie trotzdem bei der Sitzverteilung berücksichtigt.
              </p>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-zinc-950 mb-1">Warum das Parlament größer als 130 sein kann</h3>
              <p>
                Das Abgeordnetenhaus hat regulär <strong className="text-zinc-950">130 Plätze</strong>{" "}
                (78 direkt, der Rest über Listen). Gewinnt eine Partei mehr Wahlkreise, als ihr nach
                Zweitstimmen zustehen, darf sie diese{" "}
                <strong className="text-zinc-950">Überhangmandate</strong> behalten — die anderen
                Parteien bekommen zum Ausgleich zusätzliche Sitze (
                <strong className="text-zinc-950">Ausgleichsmandate</strong>), damit das Verhältnis
                stimmt. Dadurch wächst das Parlament über 130 hinaus; bei der letzten Wahl 2023 waren
                es deshalb mehr. Der Bundestag hat genau dieses Wachstum mit der Reform 2023
                abgeschafft — er ist jetzt fest 630 Plätze groß, und ein Wahlkreissieg zählt dort nur,
                wenn die Partei dafür genug Zweitstimmen hat. In Berlin gilt diese Deckelung nicht.
              </p>
            </div>

            <div>
              <h3 className="text-[15px] font-semibold text-zinc-950 mb-1">Wählen ab 16</h3>
              <p>
                Seit einer Verfassungsänderung im Dezember 2023 darf in Berlin wählen, wer am Wahltag
                <strong className="text-zinc-950"> 16 Jahre</strong> alt ist und seit mindestens drei
                Monaten in Berlin wohnt. Erstmals angewandt wird das bei der Wahl 2026; vorher durften
                16- und 17-Jährige nur die Bezirksverordnetenversammlung wählen. Für die Bundestagswahl
                bleibt das Wahlalter bei 18.
              </p>
            </div>

            <div className="text-[13px] text-zinc-400 leading-relaxed border-t border-zinc-100 pt-4">
              Quellen:{" "}
              <a href="https://www.berlin.de/politische-bildung/politikportal/politik-in-berlin/wahlen-und-direkte-demokratie/wahlsystem/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                Berlin.de (Wahlsystem)
              </a>{" "}
              ·{" "}
              <a href="https://www.parlament-berlin.de/Lexikon/gemischtes-wahlsystem" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                Abgeordnetenhaus (Gemischtes Wahlsystem)
              </a>{" "}
              ·{" "}
              <a href="https://www.wahlrecht.de/landtage/berlin.htm" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                wahlrecht.de (Berlin)
              </a>{" "}
              ·{" "}
              <a href="https://de.wikipedia.org/wiki/Wahl_zum_Abgeordnetenhaus_von_Berlin_2026" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 decoration-zinc-300 hover:text-zinc-700">
                Wikipedia (Wahltermin 2026)
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

        {/* Querverweis: Bundestag */}
        <Link
          href="/wie-stimmen-sitze-werden"
          className="mt-3 flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3.5 hover:border-zinc-300 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Landmark className="w-4 h-4 shrink-0 text-zinc-400" strokeWidth={2.25} />
            <div className="text-[15px] font-medium text-zinc-950">
              Und wie funktioniert die Bundestagswahl? →
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" strokeWidth={2.25} />
        </Link>
      </div>
    </div>
  );
}
