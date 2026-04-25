export const metadata = {
  title: "Impressum | Politik-Radar",
};

export default function ImpressumPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 fade-in">
      <h1 className="text-3xl font-extrabold tracking-tight mb-6">Impressum</h1>

      <div className="prose text-sm leading-relaxed space-y-6">
        <section>
          <h2 className="text-lg font-bold mb-2">Angaben gemäß § 5 DDG</h2>
          <p className="text-foreground/80">
            {/* TODO ausfüllen — Pflichtangaben:
                Name, Anschrift, Kontakt (E-Mail), ggf. Verantwortlicher i.S.d.
                § 18 Abs. 2 MStV bei journalistisch-redaktionellen Inhalten */}
            <em className="text-muted">
              Hier deine Pflichtangaben einfügen: Name, Anschrift, E-Mail.
            </em>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Haftungsausschluss</h2>
          <p className="text-foreground/80">
            Politik-Radar ist ein nicht-kommerzielles Transparenz-Projekt
            und keine offizielle Regierungsseite. Die Daten werden aus
            öffentlichen Quellen aggregiert (siehe{" "}
            <a href="/datenquellen" className="text-primary hover:underline">
              Datenquellen
            </a>
            ) und nach bestem Wissen ohne Gewähr für Vollständigkeit oder
            Aktualität bereitgestellt.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Korrektur-Hinweise</h2>
          <p className="text-foreground/80">
            Bei Fehlern oder Korrekturwünschen bitte per E-Mail melden:{" "}
            <em className="text-muted">[Kontakt-E-Mail eintragen]</em>
          </p>
        </section>
      </div>
    </div>
  );
}
