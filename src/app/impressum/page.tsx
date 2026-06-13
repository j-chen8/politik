import { ContextualLink as Link } from "@/components/ContextualLink";

export const metadata = {
  title: "Impressum | Politik-Radar",
};

export default function ImpressumPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-2xl mx-auto px-5 pt-24 pb-24 fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-10">Impressum</h1>

        <div className="space-y-10 text-[15px] leading-relaxed text-zinc-700">

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Angaben gemäß § 5 DDG
            </h2>
            <address className="not-italic">
              Jinsheng Chen<br />
              c/o COCENTER<br />
              Koppoldstr. 1<br />
              86551 Aichach<br />
              Deutschland
            </address>
            <p className="mt-3">
              E-Mail:{" "}
              <a
                href="mailto:hallo@jinsheng-chen.de"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                hallo@jinsheng-chen.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              Jinsheng Chen<br />
              c/o COCENTER<br />
              Koppoldstr. 1<br />
              86551 Aichach
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Über dieses Angebot
            </h2>
            <p>
              Diese Plattform ist ein nicht-kommerzielles, eigenfinanziertes Transparenz-Projekt
              und <strong className="text-zinc-950">keine offizielle Regierungs- oder Bundestagsseite</strong>.
              Die Daten werden aus öffentlichen Quellen aggregiert (siehe{" "}
              <Link
                href="/datenquellen"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                Datenquellen
              </Link>
              ) und nach bestem Wissen ohne Gewähr für Vollständigkeit oder Aktualität
              bereitgestellt. Wer dahintersteht und warum diese Seite gebaut wurde, ist auf der{" "}
              <Link
                href="/ueber"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                Über-Seite
              </Link>
              {" "}beschrieben.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Korrektur- und Löschungsanfragen
            </h2>
            <p className="mb-3">
              Wenn dir ein Fehler auffällt oder du als dargestellte Person eine
              Korrektur, Präzisierung oder Löschung anfragen willst, melde dich bitte
              per E-Mail. Jeder Hinweis wird ernst genommen und in der Regel innerhalb
              von <strong className="text-zinc-950">14 Tagen</strong> bearbeitet.
            </p>
            <p>
              <a
                href="mailto:hallo@jinsheng-chen.de?subject=Korrekturanfrage%20Politik-Plattform"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                hallo@jinsheng-chen.de
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Haftung für Inhalte
            </h2>
            <p>
              Als Diensteanbieter bin ich gemäß § 7 Abs. 1 DDG für eigene Inhalte
              auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach
              §§ 8 bis 10 DDG bin ich als Diensteanbieter jedoch nicht verpflichtet,
              übermittelte oder gespeicherte fremde Informationen zu überwachen oder
              nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
              hinweisen. Verpflichtungen zur Entfernung oder Sperrung der Nutzung
              von Informationen nach den allgemeinen Gesetzen bleiben hiervon
              unberührt. Eine diesbezügliche Haftung ist jedoch erst ab dem
              Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich. Bei
              Bekanntwerden von entsprechenden Rechtsverletzungen werden die
              Inhalte umgehend entfernt.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Haftung für Links
            </h2>
            <p>
              Dieses Angebot enthält Links zu externen Webseiten Dritter, auf
              deren Inhalte ich keinen Einfluss habe. Für die Inhalte verlinkter
              Seiten ist stets der jeweilige Anbieter verantwortlich. Eine
              permanente inhaltliche Kontrolle der verlinkten Seiten ist ohne
              konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar. Bei
              Bekanntwerden von Rechtsverletzungen werden derartige Links umgehend
              entfernt.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Urheberrecht und Datennutzung
            </h2>
            <p className="mb-3">
              Eigene Inhalte (Quellcode der Plattform, methodische Dokumentation,
              eigene Auswertungen und Texte) stehen unter der MIT-Lizenz (für
              Code) bzw. CC&nbsp;BY&nbsp;4.0 (für eigene Texte und Auswertungen),
              sofern nicht anders gekennzeichnet.
            </p>
            <p>
              Aggregierte und dargestellte Daten unterliegen den jeweiligen
              Quellenlizenzen — Übersicht und Attribution auf der{" "}
              <Link
                href="/datenquellen"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                Datenquellen-Seite
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Streitschlichtung
            </h2>
            <p className="mb-2">
              Die Europäische Kommission stellt eine Plattform zur
              Online-Streitbeilegung (OS) bereit:{" "}
              <a
                href="https://ec.europa.eu/consumers/odr/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                https://ec.europa.eu/consumers/odr/
              </a>
              .
            </p>
            <p>
              Ich bin nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren
              vor einer Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Datenschutz
            </h2>
            <p>
              Hinweise zur Verarbeitung personenbezogener Daten findest du in der{" "}
              <Link
                href="/datenschutz"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                Datenschutzerklärung
              </Link>
              .
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
