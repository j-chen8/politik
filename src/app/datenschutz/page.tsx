import { ContextualLink as Link } from "@/components/ContextualLink";

export const metadata = {
  title: "Datenschutzerklärung | Politik-Radar",
  description:
    "Welche personenbezogenen Daten dieser Dienst verarbeitet, wozu und auf welcher Rechtsgrundlage.",
};

export default function DatenschutzPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-2xl mx-auto px-5 pt-6 pb-24 fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-4">
          Datenschutzerklärung
        </h1>
        <p className="text-[14.5px] text-zinc-500 mb-12 leading-relaxed">
          Diese Seite verarbeitet personenbezogene Daten nur in dem Umfang, der für den Betrieb
          des Angebots technisch erforderlich ist. Es werden keine Tracking-, Analyse- oder
          Werbe-Tools eingesetzt.
        </p>

        <div className="space-y-10 text-[15px] leading-relaxed text-zinc-700">

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              1. Verantwortliche Stelle
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
              2. Welche Daten verarbeitet werden
            </h2>
            <div className="space-y-3">
              <div>
                <h3 className="text-zinc-950 font-medium mb-1">Server-Logs / Hosting</h3>
                <p>
                  Beim Aufruf dieser Webseite werden durch den Hosting-Anbieter
                  (Cloudflare über einen Tunnel zu meinem System) technisch
                  notwendige Daten erfasst — insbesondere IP-Adresse,
                  Zeitstempel, abgerufene URL und User-Agent-String. Diese
                  Verarbeitung dient ausschließlich der technischen Bereitstellung
                  und Sicherheit der Webseite (Schutz vor Angriffen, Stabilität).
                  Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
                  Interesse am Betrieb eines funktionsfähigen Angebots). Die
                  Logs werden nicht zu personenbezogenen Profilen weiterverarbeitet
                  und in der Regel nach kurzer Zeit gelöscht.
                </p>
              </div>
              <div>
                <h3 className="text-zinc-950 font-medium mb-1">E-Mail-Kommunikation</h3>
                <p>
                  Wenn du mir per E-Mail eine Korrekturanfrage, Feedback oder
                  sonstige Nachricht schickst, verarbeite ich die mitgeteilten
                  Daten (E-Mail-Adresse, Name falls angegeben, Nachrichteninhalt)
                  zur Bearbeitung deiner Anfrage. Rechtsgrundlage: Art. 6 Abs. 1
                  lit. b oder lit. f DSGVO. Die Daten werden gelöscht, sobald
                  sie für die Bearbeitung nicht mehr erforderlich sind, soweit
                  keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
                </p>
              </div>
              <div>
                <h3 className="text-zinc-950 font-medium mb-1">
                  Dargestellte Politiker:innen-Daten
                </h3>
                <p>
                  Die auf dieser Plattform dargestellten Daten über
                  Bundestagsabgeordnete und andere Personen des politischen
                  Lebens stammen aus öffentlich zugänglichen Quellen
                  (Bundestag, abgeordnetenwatch, Wikipedia/Wikidata,
                  persönliche Homepages der Abgeordneten). Die Verarbeitung
                  beruht auf Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
                  Interesse an Transparenz politischer Willensbildung) sowie
                  auf der Tatsache, dass es sich bei Mandatsträger:innen um
                  relative Personen der Zeitgeschichte handelt. Detaillierte
                  Quellen- und Lizenzangaben:{" "}
                  <Link
                    href="/datenquellen"
                    className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
                  >
                    Datenquellen
                  </Link>
                  .
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              3. Was nicht passiert
            </h2>
            <ul className="space-y-1.5 ml-1">
              <li>· <strong className="text-zinc-950">Keine Cookies</strong> außer technisch zwingend erforderliche Session-Cookies — derzeit setzt das Angebot keine Cookies.</li>
              <li>· <strong className="text-zinc-950">Kein Tracking, keine Analytics</strong> (kein Google Analytics, Matomo, Plausible o. ä.).</li>
              <li>· <strong className="text-zinc-950">Keine Werbung, kein Retargeting</strong>, keine Drittanbieter-Skripte für Marketing-Zwecke.</li>
              <li>· <strong className="text-zinc-950">Keine Weitergabe</strong> personenbezogener Daten an Dritte, außer wenn gesetzlich erforderlich.</li>
              <li>· <strong className="text-zinc-950">Keine automatisierte Entscheidungsfindung</strong> einschließlich Profiling im Sinne des Art. 22 DSGVO.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              4. Deine Rechte
            </h2>
            <p className="mb-3">
              Du hast jederzeit die folgenden Rechte gegenüber der
              verantwortlichen Stelle:
            </p>
            <ul className="space-y-1.5 ml-1">
              <li>· Recht auf <strong className="text-zinc-950">Auskunft</strong> (Art. 15 DSGVO)</li>
              <li>· Recht auf <strong className="text-zinc-950">Berichtigung</strong> unrichtiger Daten (Art. 16 DSGVO)</li>
              <li>· Recht auf <strong className="text-zinc-950">Löschung</strong> (Art. 17 DSGVO)</li>
              <li>· Recht auf <strong className="text-zinc-950">Einschränkung</strong> der Verarbeitung (Art. 18 DSGVO)</li>
              <li>· Recht auf <strong className="text-zinc-950">Datenübertragbarkeit</strong> (Art. 20 DSGVO)</li>
              <li>· Recht auf <strong className="text-zinc-950">Widerspruch</strong> gegen die Verarbeitung (Art. 21 DSGVO)</li>
            </ul>
            <p className="mt-3">
              Anfragen bitte per E-Mail an{" "}
              <a
                href="mailto:hallo@jinsheng-chen.de?subject=Datenschutz-Anfrage"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                hallo@jinsheng-chen.de
              </a>
              . Du erhältst eine Antwort in der Regel innerhalb von 14 Tagen,
              spätestens innerhalb der gesetzlichen Frist von einem Monat.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              5. Beschwerderecht bei der Aufsichtsbehörde
            </h2>
            <p>
              Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu
              beschweren. Zuständig ist für Berlin:
            </p>
            <address className="not-italic mt-2">
              Berliner Beauftragte für Datenschutz und Informationsfreiheit<br />
              Friedrichstr. 219<br />
              10969 Berlin<br />
              <a
                href="https://www.datenschutz-berlin.de"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
              >
                www.datenschutz-berlin.de
              </a>
            </address>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              6. Stand und Änderungen
            </h2>
            <p>
              Diese Datenschutzerklärung ist Stand Mai 2026 gültig. Bei
              wesentlichen Änderungen der Datenverarbeitung wird sie
              aktualisiert. Da das Angebot derzeit im Beta-Stadium läuft und
              keine Nutzer-Accounts oder personenbezogene Verarbeitungen
              jenseits der oben beschriebenen Logs/E-Mail-Kommunikation
              stattfinden, sind größere Änderungen kurzfristig nicht zu
              erwarten.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
