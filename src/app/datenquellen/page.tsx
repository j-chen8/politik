import { ContextualLink as Link } from "@/components/ContextualLink";
import { getDb } from "@/lib/db";
import { ExternalLink } from "lucide-react";

interface PhotoCredit {
  id: number;
  first_name: string;
  last_name: string;
  filename: string;
}

function getPhotoCredits(): PhotoCredit[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, first_name, last_name, photo_attribution
       FROM politicians
       WHERE photo_source = 'wikimedia_commons' AND photo_attribution IS NOT NULL
       ORDER BY last_name, first_name`
    )
    .all() as { id: number; first_name: string; last_name: string; photo_attribution: string }[];
  return rows.map((r) => ({
    id: r.id,
    first_name: r.first_name,
    last_name: r.last_name,
    filename: r.photo_attribution.replace(/^Wikimedia Commons:\s*/, ""),
  }));
}

export const metadata = {
  title: "Datenquellen & Credits | Politik-Radar",
  description:
    "Übersicht aller Datenquellen und Foto-Credits, die Politik-Radar verwendet.",
};

export default function DatenquellenPage() {
  const credits = getPhotoCredits();

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 pt-20 pb-24 fade-in-up">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mb-3">
          Datenquellen
        </h1>
        <p className="text-[15px] text-zinc-500 mb-12 max-w-xl">
          Politik-Radar aggregiert öffentlich verfügbare Daten aus mehreren
          Quellen. Alle Quellen, Lizenzen und Foto-Credits stehen hier offen.
        </p>

        {/* Datenquellen */}
        <section className="mb-16">
          <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-4">
            Quellen
          </h2>
          <div className="space-y-1.5">
            <Source
              title="abgeordnetenwatch.de"
              href="https://www.abgeordnetenwatch.de/api"
              license="CC0 1.0"
              description="Stammdaten aller Politiker (Name, Partei, Wahlkreis, Nebeneinkünfte, Abstimmungen, Ausschuss-Mitgliedschaften, Wikidata-QIDs)."
            />
            <Source
              title="Wikidata / Wikimedia Commons"
              href="https://www.wikidata.org/"
              license="CC0 / CC-BY-SA"
              description="Politiker-Fotos, persönliche Homepages, Twitter-Handles, Instagram-Handles."
            />
            <Source
              title="Wikipedia (deutsch) — Einleitung"
              href="https://de.wikipedia.org/"
              license="CC BY-SA 4.0"
              description="Einleitungsabsatz aus dem Wikipedia-Artikel als kurze Bio-Beschreibung (politicians.bio_summary). Quell-URL pro Profil verlinkt."
            />
            <Source
              title="Wikipedia (deutsch) — Volltext"
              href="https://de.wikipedia.org/api/rest_v1/"
              license="CC BY-SA 4.0"
              description="Vollständiger Wikipedia-Artikel als Plain Text (politicians.bio_full_text). Wird für Multi-LLM-Konsens-Verifikation der CV-Daten genutzt. Coverage: 640/640."
            />
            <Source
              title="Bundestag — offizielle Biografien"
              href="https://www.bundestag.de/abgeordnete/biografien"
              license="Open Data Bundestag"
              description="Offizielle Biografie-Seiten des Deutschen Bundestags mit strukturiertem Werdegang, Mandaten und Ausschuss-Mitgliedschaften (politicians.bundestag_bio_text + bundestag_bio_url). Coverage: 629/629 echten MdBs."
            />
            <Source
              title="Bundesregierung — Kabinett-Profile"
              href="https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett"
              license="Open Data — kostenfreie Nachnutzung"
              description="Offizielle Biografien der Bundeskabinett-Mitglieder mit detailliertem Lebenslauf (politicians.bundesregierung_bio_text). Wird für Quereinsteiger-Minister ohne eigenes MdB-Mandat genutzt."
            />
            <Source
              title="Politiker-Homepages"
              href="https://en.wikipedia.org/wiki/Robots_exclusion_standard"
              license="robots.txt-konform"
              description={`Roh-Text der "Über mich"-/Vita-Seiten der Abgeordneten-Homepages (politicians.cv_homepage_text). Browser-UA, max. 1 Request/Sekunde pro Domain, robots.txt wird respektiert. Coverage: 561/640.`}
            />
            <Source
              title="Bundestag DIP API"
              href="https://dip.bundestag.de"
              license="Open Data"
              description="Parlamentarische Aktivitäten: Reden, Anfragen, Anträge, Gesetzentwürfe, Drucksachen."
            />
            <Source
              title="Bundestag Plenarprotokolle"
              href="https://www.bundestag.de/services/opendata"
              license="Open Data Bundestag"
              description="XML-Plenarprotokolle. Reden wurden mit KI (Groq, Google Gemini) automatisch zusammengefasst."
            />
            <Source
              title="KI-generierte Lebensläufe"
              href="https://groq.com"
              license="Verarbeitung von Wikipedia"
              description="Strukturierte Lebenslauf-Stichpunkte werden via Llama-3.3-70b aus dem deutschen Wikipedia-Artikel extrahiert. Können Lücken enthalten — verbindlich bleibt der Wikipedia-Artikel."
            />
            <Source
              title="Bundestag Ausschuss-Protokolle"
              href="https://www.bundestag.de/dokumente/protokolle/"
              license="Öffentliche Kurzprotokolle"
              description="Sitzungs-Metadaten, Anwesenheitslisten und Tagesordnungen der Ausschüsse."
            />
          </div>
        </section>

        {/* Methodik-Verweis */}
        <section className="mb-16">
          <div className="rounded-2xl border border-zinc-200/70 bg-white p-5">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
              Methodik &amp; Wirksamkeit auf eigener Seite
            </h3>
            <p className="text-[14px] text-zinc-700 leading-relaxed mb-3">
              Wie die strukturierten Lebenslauf-Daten durch ein Multi-LLM-Konsens-Verfahren
              mit fünf unabhängigen Modell-Familien geprüft werden — inklusive konkreter
              Wirksamkeits-Statistik, Audit-Trail und Reproduzierbarkeits-Anleitung.
            </p>
            <Link
              href="/methodik"
              className="text-[13px] font-medium text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
            >
              Zur Methodik-Seite →
            </Link>
          </div>
        </section>

        {/* Hinweis */}
        <section className="mb-16 rounded-2xl border border-zinc-200/70 bg-white p-6">
          <h3 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 mb-2">
            Eigene Auswertungen
          </h3>
          <p className="text-[14px] text-zinc-700 leading-relaxed">
            Statistiken, Rankings, Aggregationen, Anwesenheitsraten und
            KI-generierte Zusammenfassungen werden aus den oben genannten
            Roh-Daten berechnet bzw. generiert. Sie unterliegen keiner
            eigenen Lizenz, basieren aber auf den Lizenzen der Quellen.
          </p>
        </section>

        {/* Foto-Credits */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Foto-Credits
            </h2>
            <span className="num text-[11px] text-zinc-400">
              {credits.length} Fotos
            </span>
          </div>
          <p className="text-[14px] text-zinc-700 mb-5 leading-relaxed">
            Alle Politiker-Fotos stammen von{" "}
            <a
              href="https://commons.wikimedia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-950 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-950 transition-colors"
            >
              Wikimedia Commons
            </a>
            . Klick auf einen Eintrag öffnet die Originaldatei mit
            Fotografen-Name und Lizenz-Bedingungen.
          </p>

          <div className="rounded-2xl border border-zinc-200/70 bg-white overflow-hidden">
            <div className="max-h-[600px] overflow-y-auto">
              <ul className="divide-y divide-zinc-100 text-[13px]">
                {credits.map((c) => (
                  <li
                    key={c.id}
                    className="px-4 py-2.5 flex items-center justify-between gap-3 hover:bg-zinc-50 transition-colors"
                  >
                    <Link
                      href={`/politiker/${c.id}`}
                      className="font-medium text-zinc-950 hover:underline truncate"
                    >
                      {c.first_name} {c.last_name}
                    </Link>
                    <a
                      href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(c.filename)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-950 truncate max-w-[55%] transition-colors"
                      title={c.filename}
                    >
                      <ExternalLink className="w-3 h-3 shrink-0" strokeWidth={2.25} />
                      <span className="truncate">{c.filename}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="text-[12px] text-zinc-400 mt-3">
            Politiker ohne Foto werden mit einem Initialen-Avatar dargestellt.
          </p>
        </section>
      </div>
    </div>
  );
}

function Source({
  title,
  href,
  license,
  description,
}: {
  title: string;
  href: string;
  license: string;
  description: string;
}) {
  return (
    <div className="card-hover bg-white rounded-xl border border-zinc-200/70 p-4">
      <div className="flex items-start justify-between gap-4 mb-1">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[14.5px] text-zinc-950 inline-flex items-center gap-1.5 hover:underline"
        >
          {title}
          <ExternalLink className="w-3 h-3 text-zinc-400" strokeWidth={2.25} />
        </a>
        <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider shrink-0">
          {license}
        </span>
      </div>
      <p className="text-[13px] text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}
