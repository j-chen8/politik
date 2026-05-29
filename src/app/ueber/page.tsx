import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Über das Projekt | Politik-Radar",
  description:
    "Wer hinter dieser Politik-Transparenz-Plattform steht, warum sie gebaut wurde und wie sie sich selbst versteht — Solo-Projekt aus Berlin, Beta-Stadium, methodisch offen.",
};

export default function UeberPage() {
  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-2xl mx-auto px-5 py-16 fade-in-up">

        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          Über das Projekt
        </span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-6 leading-[1.05]">
          Politik, lesbar gemacht.
        </h1>
        <p className="text-[17px] text-zinc-600 leading-relaxed mb-14 max-w-xl">
          Diese Plattform aggregiert öffentliche Daten zum deutschen Bundestag — Reden, Abstimmungen, Drucksachen, Lebensläufe — und bereitet sie so auf, dass eine politisch interessierte Person sie tatsächlich nutzen kann. Keine Skandalisierung. Nur Daten, mit moderner Technik zugänglich gemacht.
        </p>

        <section className="mb-14">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Warum es diese Seite gibt
          </h2>
          <div className="space-y-4 text-[15.5px] text-zinc-700 leading-relaxed">
            <p>
              Demokratie braucht informierte Bürger:innen — und informierte Bürger:innen brauchen Zugang zu nachvollziehbaren Daten. Genau dort gibt es heute eine Lücke: Politik in Deutschland ist nicht transparent genug, und wo Daten öffentlich sind, ist die Benutzeroberfläche oft so altbacken, dass sich kaum jemand durchklickt. Das Resultat: Bürger:innen schalten ab, obwohl die Information da wäre.
            </p>
            <p>
              Diese Seite will diese Lücke schließen. Nicht durch noch mehr Meinung, sondern durch eine andere Art der Aufbereitung: Was hat eine Abgeordnete tatsächlich gesagt? Wie hat sie abgestimmt? Was steht in ihrem Lebenslauf, und stimmen die Quellen darüber überein? Wo liegt die Diskrepanz, wenn es eine gibt — und woran könnte sie liegen?
            </p>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Wer dahintersteht
          </h2>
          <div className="space-y-4 text-[15.5px] text-zinc-700 leading-relaxed">
            <p>
              Ich heiße <strong className="text-zinc-950">Jinsheng</strong>, lebe in Berlin, habe chinesische Wurzeln und arbeite an dieser Plattform seit dem Frühling 2026 — Solo, neben dem eigentlichen Leben her.
            </p>
            <p>
              Solo nicht aus Prinzip, sondern aus Mangel: Niemand in meinem nahen Umfeld hat gleichzeitig das nötige Wissen und die freie Zeit, um ein solches Projekt mitzubauen. Was ich mache, kompensiere ich daher mit Werkzeug — moderne KI-Modelle als Hebel, um als Einzelperson ein Qualitätsniveau zu erreichen, das früher ein kleines Team gebraucht hätte.
            </p>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Mein Standpunkt
          </h2>
          <div className="space-y-4 text-[15.5px] text-zinc-700 leading-relaxed">
            <p>
              Ich bin ein echter Pragmatiker — ohne festes ideologisches Lager, mit Tendenzen, die man wahrscheinlich in mehreren Spektren der Politik findet. Mich interessiert das Resultat, nicht die Ideologie. Diese Haltung ist vielleicht mit ein Grund, warum es diese Seite überhaupt gibt: am Ende zählen Fakten, nicht Zugehörigkeiten.
            </p>
            <p>
              Für die Seite selbst gilt eine <strong className="text-zinc-950">Neutralitätspflicht</strong>. Methodische Regeln werden gleich auf alle Fraktionen angewendet. Tonalitäts-Klassifikationen beschreiben die rhetorische Form, nicht die inhaltliche Berechtigung — Details auf der{" "}
              <Link href="/methodik" className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
                Methodik-Seite
              </Link>
              .
            </p>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Was diese Seite ist — und was nicht
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Sie ist
              </div>
              <ul className="space-y-1.5 text-[14px] text-zinc-700 leading-snug">
                <li>· ein Transparenz-Werkzeug</li>
                <li>· eine Aufbereitung öffentlicher Daten</li>
                <li>· eine Methodik-offene Beta</li>
                <li>· ein Solo-Projekt mit Audit-Trail</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white p-5">
              <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                Sie ist <em>nicht</em>
              </div>
              <ul className="space-y-1.5 text-[14px] text-zinc-700 leading-snug">
                <li>· eine Wahlempfehlung</li>
                <li>· ein Faktencheck-Service</li>
                <li>· ein Politik-Marketing- oder Lobby-Tool</li>
                <li>· eine offizielle Bundestags-/Regierungsseite</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Stand und Mittel
          </h2>
          <div className="space-y-4 text-[15.5px] text-zinc-700 leading-relaxed">
            <p>
              Die Seite ist in einem frühen Stadium und eigenfinanziert — bislang ein Hobbyprojekt im niedrigen zweistelligen Euro-Bereich. KI-Klassifikationen sind nicht fehlerfrei, einzelne Datensätze können veraltet oder unvollständig sein. Bekannte Limitationen sind auf der{" "}
              <Link href="/methodik" className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
                Methodik-Seite
              </Link>{" "}
              offen dokumentiert — inklusive Halluzinations-Raten, Coverage-Asymmetrien und einem manuellen Audit der KI-Outputs.
            </p>
            <p>
              Eine Spenden-Möglichkeit oder geeignete Förderstruktur folgt, sobald die rechtlichen Rahmen stehen. <strong className="text-zinc-950">Methodische Unabhängigkeit ist Voraussetzung</strong> — egal woher eine Finanzierung käme. Wenn dir ein Fehler auffällt, melde ihn bitte per E-Mail über das{" "}
              <Link href="/impressum" className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
                Impressum
              </Link>
              — jeder Hinweis wird in der Regel innerhalb von 14 Tagen verarbeitet.
            </p>
          </div>
        </section>

        <section className="mb-14">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Wie du helfen kannst
          </h2>
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-5">
            <p className="text-[15.5px] text-zinc-700 leading-relaxed mb-3">
              <strong className="text-zinc-950">Feedback. Feedback. Und nochmals Feedback.</strong> Nichts ist mir aktuell wichtiger als die Außensicht — von Menschen, die sich für Politik, Daten oder Methodik interessieren und mir sagen können, ob das, was ich hier mache, überhaupt der richtige Weg ist.
            </p>
            <p className="text-[14.5px] text-zinc-600 leading-relaxed mb-2">
              Konkret hilfreich:
            </p>
            <ul className="space-y-1.5 text-[14.5px] text-zinc-700 leading-snug mb-3 ml-1">
              <li>· Ist das, was hier angeboten wird, für dich hilfreich?</li>
              <li>· Was ist verständlich, was ist überfrachtet, was fehlt?</li>
              <li>· Gibt es methodische Lücken, die dir auffallen?</li>
              <li>· Welche Funktion würdest du dir wünschen, die noch nicht da ist?</li>
            </ul>
            <p className="text-[14.5px] text-zinc-600 leading-relaxed">
              Auch kurze Notizen helfen. E-Mail über das{" "}
              <Link href="/impressum" className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors">
                Impressum
              </Link>
              .
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-3">
            Weiter
          </h2>
          <div className="space-y-2">
            <Link
              href="/methodik"
              className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3 hover:border-zinc-300 transition-colors group"
            >
              <div>
                <div className="text-[14.5px] font-medium text-zinc-950">Methodik &amp; Wirksamkeit</div>
                <div className="text-[12.5px] text-zinc-500">Pipeline, Modelle, bekannte Limitationen, Audit-Trail</div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" strokeWidth={2.25} />
            </Link>
            <Link
              href="/impressum"
              className="flex items-center justify-between rounded-xl border border-zinc-200/70 bg-white px-4 py-3 hover:border-zinc-300 transition-colors group"
            >
              <div>
                <div className="text-[14.5px] font-medium text-zinc-950">Impressum &amp; Kontakt</div>
                <div className="text-[12.5px] text-zinc-500">Pflichtangaben, Korrekturhinweise, Feedback-E-Mail</div>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" strokeWidth={2.25} />
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
