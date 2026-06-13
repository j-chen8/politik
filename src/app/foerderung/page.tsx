export const metadata = {
  title: "Förderung & Finanzierung | Politik-Radar",
  description:
    "Wer finanziert Politik-Radar? Vollständige Transparenz über Mittel, Verträge und Bedingungen.",
};

export default function FoerderungPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-2xl mx-auto px-5 pt-24 pb-24 fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-3">
          Förderung &amp; Finanzierung
        </h1>
        <p className="text-[15px] text-zinc-500 mb-12">
          Volle Transparenz darüber, wer Politik-Radar bezahlt und unter welchen Bedingungen.
        </p>

        <div className="space-y-12 text-[15px] leading-relaxed">
          <section className="rounded-2xl border border-zinc-200/70 bg-white p-6">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              Aktueller Status
            </h2>
            <p className="text-zinc-900 font-medium mb-3">
              Stand 2026-04: keine Förderung, keine Spenden, keine kommerzielle Finanzierung.
            </p>
            <p className="text-zinc-700">
              Politik-Radar wird derzeit von einem einzelnen Entwickler in der eigenen
              Freizeit gebaut. Server- und API-Kosten werden privat getragen.
              Es fließen keine Mittel von Parteien, Konzernen, Lobbyverbänden,
              Stiftungen, Ministerien oder anderen Dritten.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              Was definitiv ausgeschlossen ist
            </h2>
            <ul className="space-y-2.5 text-zinc-700">
              <li className="flex gap-3">
                <span className="text-zinc-300 mt-2 shrink-0">━</span>
                <span><strong className="text-zinc-900">Keine Parteifinanzierung.</strong> Keine Partei, keine Fraktion, keine parteinahe Stiftung, kein:e Bundestagsabgeordnete:r finanziert Politik-Radar — direkt oder indirekt.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-300 mt-2 shrink-0">━</span>
                <span><strong className="text-zinc-900">Keine Konzernfinanzierung.</strong> Kein Unternehmen, kein Verband, keine PR-Agentur, kein Lobbybüro.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-300 mt-2 shrink-0">━</span>
                <span><strong className="text-zinc-900">Keine bezahlten Inhalte.</strong> Keine Sponsored Posts, keine Affiliate-Links, kein „Native Advertising".</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-300 mt-2 shrink-0">━</span>
                <span><strong className="text-zinc-900">Keine Daten-Verkäufe.</strong> Daten werden nicht kommerziell weitergegeben oder verkauft.</span>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              Was möglich ist — und transparent gemacht würde
            </h2>
            <p className="text-zinc-700 mb-4">
              Sollte sich die Finanzierungssituation ändern, erscheint hier eine
              vollständige Liste mit folgenden Pflichtangaben pro Förderung:
            </p>
            <ul className="space-y-1.5 text-zinc-700 ml-1 mb-4">
              <li>· Name des Förderers / der Stiftung / des Programms</li>
              <li>· Höhe der Förderung in Euro</li>
              <li>· Förderzeitraum</li>
              <li>· Vertragsbedingungen (verlinkt, im Original einsehbar)</li>
              <li>· Erklärung zur inhaltlichen Unabhängigkeit (insbesondere: keine Mitsprache bei Recherche, Auswahl oder Darstellung)</li>
            </ul>
            <p className="text-zinc-700 mb-4">
              Möglich wären beispielsweise: öffentliche Forschungsförderung
              (Prototype Fund / BMBF), Förderung durch unabhängige
              zivilgesellschaftliche Stiftungen (z. B. Schöpflin Stiftung,
              Mercator) oder Crowdfunding durch Bürger:innen.
            </p>
            <p className="text-zinc-900 font-medium">
              Inhaltliche Unabhängigkeit ist nicht verhandelbar.{" "}
              <span className="font-normal text-zinc-700">
                Jede Förderung, die mit thematischen Auflagen, Vetorechten oder
                Schweigeklauseln verbunden wäre, wird abgelehnt — egal wie hoch.
              </span>
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              Datenzugang für Redaktionen, Forschung und Unternehmen
            </h2>
            <p className="text-zinc-700 mb-4">
              Die öffentliche Plattform bleibt für alle kostenlos und ohne
              Anmeldung zugänglich — das ist der Kern des Projekts und ändert
              sich nicht.
            </p>
            <p className="text-zinc-700 mb-4">
              Für Journalist:innen, Redaktionen, Forschungseinrichtungen und
              Unternehmen, die strukturierten <strong className="text-zinc-900">Vollzugriff auf die
              Datenbank</strong> benötigen, ist perspektivisch ein <strong className="text-zinc-900">kostenpflichtiger API- bzw.
              Daten-Zugang</strong> vorgesehen (gestaffelt nach Nutzung).
            </p>
            <p className="text-zinc-700 mb-4">
              Diese Erlöse helfen, Server, API-Kosten und Entwicklungszeit zu
              decken, ohne dass Politik-Radar auf Stiftungs- oder Staatsmittel
              angewiesen ist. Der Zugang ist bewusst <strong className="text-zinc-900">diskriminierungsfrei</strong>:
              Wer den Tarif bezahlt, bekommt die Daten — unabhängig von
              redaktioneller Linie, Parteinähe oder Berichterstattung über
              Politik-Radar.
            </p>
            <p className="text-zinc-700">
              <strong className="text-zinc-900">Wichtig:</strong> Datenzugang ist kein Einfluss auf
              Inhalte. Was angezeigt wird, welche Auswertungen veröffentlicht
              werden und wie Politiker:innen bewertet werden, entscheidet
              niemand außer mir — keine API-Kund:innen, keine Förderer.
            </p>
          </section>

          <section>
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
              Warum diese Seite überhaupt existiert
            </h2>
            <p className="text-zinc-700">
              Eine Plattform, die Politiker:innen auf finanzielle Verflechtungen
              durchleuchtet, muss selbst der schärfsten Prüfung standhalten.
              Diese Seite ist die Vorab-Antwort auf jede berechtigte Frage
              nach Interessenkonflikten — auf der gleichen Detailtiefe, die wir
              an die untersuchten Mandatsträger:innen anlegen.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
