export const metadata = {
  title: "Förderung & Finanzierung | Politik-Radar",
  description:
    "Wer finanziert Politik-Radar? Vollständige Transparenz über Mittel, Verträge und Bedingungen.",
};

export default function FoerderungPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 fade-in">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">
        Förderung &amp; Finanzierung
      </h1>
      <p className="text-sm text-muted mb-8">
        Volle Transparenz darüber, wer Politik-Radar bezahlt und unter welchen Bedingungen.
      </p>

      <div className="prose text-sm leading-relaxed space-y-8">
        <section className="rounded-xl border border-border bg-gray-50/60 p-5">
          <h2 className="text-lg font-bold mb-2">Aktueller Status</h2>
          <p className="text-foreground/85 mb-3">
            <strong>Stand 2026-04: keine Förderung, keine Spenden, keine kommerzielle Finanzierung.</strong>
          </p>
          <p className="text-foreground/80">
            Politik-Radar wird derzeit von einem einzelnen Entwickler in der eigenen
            Freizeit gebaut. Server- und API-Kosten werden privat getragen.
            Es fließen keine Mittel von Parteien, Konzernen, Lobbyverbänden,
            Stiftungen, Ministerien oder anderen Dritten.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Was definitiv ausgeschlossen ist</h2>
          <ul className="list-disc pl-5 text-foreground/85 space-y-1">
            <li>
              <strong>Keine Parteifinanzierung.</strong> Keine Partei, keine Fraktion,
              keine parteinahe Stiftung, kein:e Bundestagsabgeordnete:r finanziert
              Politik-Radar — direkt oder indirekt.
            </li>
            <li>
              <strong>Keine Konzernfinanzierung.</strong> Kein Unternehmen, kein
              Verband, keine PR-Agentur, kein Lobbybüro.
            </li>
            <li>
              <strong>Keine bezahlten Inhalte.</strong> Keine Sponsored Posts,
              keine Affiliate-Links, kein „Native Advertising".
            </li>
            <li>
              <strong>Keine Daten-Verkäufe.</strong> Daten werden nicht
              kommerziell weitergegeben oder verkauft.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Was möglich ist — und transparent gemacht würde</h2>
          <p className="text-foreground/85 mb-3">
            Sollte sich die Finanzierungssituation ändern, erscheint hier eine
            vollständige Liste mit folgenden Pflichtangaben pro Förderung:
          </p>
          <ul className="list-disc pl-5 text-foreground/85 space-y-1">
            <li>Name des Förderers / der Stiftung / des Programms</li>
            <li>Höhe der Förderung in Euro</li>
            <li>Förderzeitraum</li>
            <li>Vertragsbedingungen (verlinkt, im Original einsehbar)</li>
            <li>
              Erklärung zur inhaltlichen Unabhängigkeit (insbesondere: keine
              Mitsprache bei Recherche, Auswahl oder Darstellung)
            </li>
          </ul>
          <p className="text-foreground/85 mt-3">
            Möglich wären beispielsweise: öffentliche Forschungsförderung
            (Prototype Fund / BMBF), Förderung durch unabhängige
            zivilgesellschaftliche Stiftungen (z. B. Schöpflin Stiftung,
            Mercator) oder Crowdfunding durch Bürger:innen.
          </p>
          <p className="text-foreground/85 mt-3">
            <strong>Inhaltliche Unabhängigkeit ist nicht verhandelbar.</strong>
            {" "}Jede Förderung, die mit thematischen Auflagen, Vetorechten oder
            Schweigeklauseln verbunden wäre, wird abgelehnt — egal wie hoch.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">
            Datenzugang für Redaktionen, Forschung und Unternehmen
          </h2>
          <p className="text-foreground/85 mb-3">
            Die öffentliche Plattform bleibt für alle kostenlos und ohne
            Anmeldung zugänglich — das ist der Kern des Projekts und ändert
            sich nicht.
          </p>
          <p className="text-foreground/85 mb-3">
            Für Journalist:innen, Redaktionen, Forschungseinrichtungen und
            Unternehmen, die strukturierten <strong>Vollzugriff auf die
            Datenbank</strong> benötigen — etwa für Bulk-Recherchen,
            automatisierte Auswertungen, Dashboards oder Trainingsdaten —
            ist perspektivisch ein <strong>kostenpflichtiger API- bzw.
            Daten-Zugang</strong> vorgesehen (gestaffelt nach Nutzung).
          </p>
          <p className="text-foreground/85 mb-3">
            Diese Erlöse helfen, Server, API-Kosten und Entwicklungszeit zu
            decken, ohne dass Politik-Radar auf Stiftungs- oder Staatsmittel
            angewiesen ist. Der Zugang ist bewusst <strong>diskriminierungsfrei</strong>:
            Wer den Tarif bezahlt, bekommt die Daten — unabhängig von
            redaktioneller Linie, Parteinähe oder Berichterstattung über
            Politik-Radar.
          </p>
          <p className="text-foreground/85">
            <strong>Wichtig:</strong> Datenzugang ist kein Einfluss auf
            Inhalte. Was angezeigt wird, welche Auswertungen veröffentlicht
            werden und wie Politiker:innen bewertet werden, entscheidet
            niemand außer mir — keine API-Kund:innen, keine Förderer.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-2">Warum diese Seite überhaupt existiert</h2>
          <p className="text-foreground/85">
            Eine Plattform, die Politiker:innen auf finanzielle Verflechtungen
            durchleuchtet, muss selbst der schärfsten Prüfung standhalten.
            Diese Seite ist die Vorab-Antwort auf jede berechtigte Frage
            nach Interessenkonflikten — auf der gleichen Detailtiefe, die wir
            an die untersuchten Mandatsträger:innen anlegen.
          </p>
        </section>
      </div>
    </div>
  );
}
