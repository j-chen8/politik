export const metadata = {
  title: "Impressum | Politik-Radar",
};

export default function ImpressumPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-16 fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-10">Impressum</h1>

        <div className="space-y-10 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Angaben gemäß § 5 DDG
            </h2>
            <p className="text-zinc-700">
              <em className="text-zinc-400">
                Hier deine Pflichtangaben einfügen: Name, Anschrift, E-Mail.
              </em>
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Haftungsausschluss
            </h2>
            <p className="text-zinc-700">
              Politik-Radar ist ein nicht-kommerzielles Transparenz-Projekt
              und keine offizielle Regierungsseite. Die Daten werden aus
              öffentlichen Quellen aggregiert (siehe{" "}
              <a href="/design/linear/datenquellen" className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
                Datenquellen
              </a>
              ) und nach bestem Wissen ohne Gewähr für Vollständigkeit oder
              Aktualität bereitgestellt.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Korrektur-Hinweise
            </h2>
            <p className="text-zinc-700">
              Bei Fehlern oder Korrekturwünschen bitte per E-Mail melden:{" "}
              <em className="text-zinc-400">[Kontakt-E-Mail eintragen]</em>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
