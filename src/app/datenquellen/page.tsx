import Link from "next/link";
import { getDb } from "@/lib/db";
import { Database, Camera, Image as ImageIcon, ExternalLink } from "lucide-react";

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
    <div className="max-w-4xl mx-auto px-4 py-10 fade-in">
      <h1 className="text-3xl font-extrabold tracking-tight mb-2">
        Datenquellen &amp; Credits
      </h1>
      <p className="text-muted mb-10">
        Politik-Radar aggregiert öffentlich verfügbare Daten aus mehreren
        Quellen. Hier findest du alle Quellen mit Lizenz-Hinweisen sowie
        Credits für jedes verwendete Foto.
      </p>

      {/* Datenquellen */}
      <section className="mb-12">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-primary" />
          Datenquellen
        </h2>
        <div className="space-y-4">
          <SourceCard
            title="abgeordnetenwatch.de"
            href="https://www.abgeordnetenwatch.de/api"
            license="CC0 1.0 (Public Domain)"
            licenseHref="https://creativecommons.org/publicdomain/zero/1.0/deed.de"
            description="Stammdaten aller Politiker (Name, Partei, Wahlkreis, Nebeneinkünfte, Abstimmungen, Ausschuss-Mitgliedschaften, Wikidata-QIDs)."
          />
          <SourceCard
            title="Wikidata / Wikimedia Commons"
            href="https://www.wikidata.org/"
            license="Daten: CC0 · Fotos: meist CC-BY-SA oder CC0 (siehe Foto-Credits unten)"
            licenseHref="https://creativecommons.org/publicdomain/zero/1.0/deed.de"
            description="Politiker-Fotos, persönliche Homepages, Twitter-Handles, Instagram-Handles."
          />
          <SourceCard
            title="Wikipedia (deutsch) — Einleitung"
            href="https://de.wikipedia.org/"
            license="CC BY-SA 4.0"
            licenseHref="https://creativecommons.org/licenses/by-sa/4.0/deed.de"
            description="Einleitungsabsatz aus dem Wikipedia-Artikel als Bio-Beschreibung (politicians.bio_summary). Auf jedem Profil ist die Quell-URL des Artikels verlinkt."
          />
          <SourceCard
            title="Wikipedia (deutsch) — Volltext"
            href="https://de.wikipedia.org/api/rest_v1/"
            license="CC BY-SA 4.0"
            licenseHref="https://creativecommons.org/licenses/by-sa/4.0/deed.de"
            description="Vollständiger Wikipedia-Artikel als Plain Text (politicians.bio_full_text), gespeichert für Multi-LLM-Konsens-Verifikation der CV-Daten. Quelle: Wikipedia REST API (action=query, prop=extracts, explaintext=true)."
          />
          <SourceCard
            title="Bundestag — offizielle Biografien"
            href="https://www.bundestag.de/abgeordnete/biografien"
            license="Open Data Bundestag"
            licenseHref="https://www.bundestag.de/services/opendata"
            description="Offizielle Biografie-Seiten des Deutschen Bundestags — strukturierte Bio mit Werdegang, Mandaten, Ausschuss-Mitgliedschaften (politicians.bundestag_bio_text + bundestag_bio_url). Wird zur Cross-Verifikation der CV-Daten genutzt. Coverage: 629/629 echten MdBs."
          />
          <SourceCard
            title="Bundesregierung — Kabinett-Profile"
            href="https://www.bundesregierung.de/breg-de/bundesregierung/bundeskabinett"
            license="Open Data — kostenfreie Nachnutzung"
            licenseHref="https://www.bundesregierung.de/breg-de/service/impressum-1620850"
            description="Offizielle Biografien der Bundeskabinett-Mitglieder mit detailliertem Lebenslauf (politicians.bundesregierung_bio_text + bundesregierung_bio_url). Wird genutzt für die Quereinsteiger-Minister, die kein eigenes Bundestags-Mandat haben (z.B. Reiche, Prien, Hubig)."
          />
          <SourceCard
            title="Politiker-Homepages"
            href="https://en.wikipedia.org/wiki/Robots_exclusion_standard"
            license="robots.txt-konform"
            licenseHref="https://en.wikipedia.org/wiki/Robots_exclusion_standard"
            description={`Roh-Text der "Über mich"-/Vita-Seiten von den persönlichen Homepages der Abgeordneten (politicians.cv_homepage_text + cv_homepage_url). Wird mit User-Agent-Header gescraped, robots.txt wird respektiert, max. 1 Request/Sekunde pro Domain. Coverage: 561/640.`}
          />
          <SourceCard
            title="Bundestag DIP API"
            href="https://dip.bundestag.de"
            license="Open Data — kostenfreie Nachnutzung"
            licenseHref="https://www.bundestag.de/services/opendata"
            description="Parlamentarische Aktivitäten: Reden, Anfragen, Anträge, Gesetzentwürfe, Drucksachen."
          />
          <SourceCard
            title="Bundestag Plenarprotokolle"
            href="https://www.bundestag.de/services/opendata"
            license="Open Data Bundestag"
            licenseHref="https://www.bundestag.de/services/opendata"
            description="XML-Plenarprotokolle des aktuellen Bundestags. Reden werden mit Hilfe von KI (Groq, Google Gemini) automatisch zusammengefasst."
          />
          <SourceCard
            title="KI-generierte Lebensläufe (Groq Llama 3.3)"
            href="https://groq.com"
            license="Eigene Verarbeitung von Wikipedia-Inhalten"
            licenseHref="https://creativecommons.org/licenses/by-sa/4.0/deed.de"
            description="Die strukturierten Lebenslauf-Stichpunkte werden vom Llama-3.3-70b-Modell aus dem deutschen Wikipedia-Artikel extrahiert. Können Lücken oder Ungenauigkeiten enthalten — verbindlich ist immer der Wikipedia-Artikel selbst."
          />
          <SourceCard
            title="Bundestag Ausschuss-Protokolle"
            href="https://www.bundestag.de/dokumente/protokolle/"
            license="Öffentliche Kurzprotokolle"
            licenseHref="https://www.bundestag.de/dokumente/protokolle/"
            description="Sitzungs-Metadaten, Anwesenheitslisten und Tagesordnungen der Ausschüsse."
          />
        </div>
      </section>

      {/* Methodik-Verweis */}
      <section className="mb-12">
        <div className="bg-primary-light/40 rounded-2xl border border-primary/20 p-5 flex items-start gap-4">
          <Database className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold mb-1">
              Methodik &amp; Wirksamkeit auf eigener Seite
            </h3>
            <p className="text-sm text-foreground/85 leading-relaxed mb-2">
              Wie die strukturierten Lebenslauf-Daten durch ein Multi-LLM-Konsens-Verfahren
              mit fünf unabhängigen Modell-Familien geprüft werden — inklusive konkreter
              Wirksamkeits-Statistik, Audit-Trail und Reproduzierbarkeits-Anleitung.
            </p>
            <Link
              href="/methodik"
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Zur Methodik-Seite →
            </Link>
          </div>
        </div>
      </section>

      {/* Hinweis Eigene Auswertungen */}
      <section className="mb-12 bg-primary-light/40 rounded-2xl p-5 text-sm leading-relaxed">
        <h3 className="font-semibold mb-1 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          Hinweis zu eigenen Auswertungen
        </h3>
        <p className="text-foreground/80">
          Statistiken, Rankings, Aggregationen, Anwesenheitsraten und
          KI-generierte Zusammenfassungen werden aus den oben genannten
          Roh-Daten berechnet bzw. generiert. Sie unterliegen keiner
          eigenen Lizenz, basieren aber auf den Lizenzen der Quellen.
        </p>
      </section>

      {/* Foto-Credits */}
      <section>
        <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
          <Camera className="w-5 h-5 text-primary" />
          Foto-Credits
        </h2>
        <p className="text-sm text-muted mb-4">
          Alle Politiker-Fotos stammen von{" "}
          <a
            href="https://commons.wikimedia.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Wikimedia Commons
          </a>
          . Klick auf einen Eintrag öffnet die Originaldatei mit
          Fotografen-Name und Lizenz-Bedingungen ({credits.length} Fotos).
        </p>

        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <ul className="divide-y divide-border text-sm">
              {credits.map((c) => (
                <li key={c.id} className="px-4 py-2 flex items-center justify-between gap-3 hover:bg-primary-light/20">
                  <Link
                    href={`/politiker/${c.id}`}
                    className="font-medium text-foreground hover:text-primary truncate"
                  >
                    {c.first_name} {c.last_name}
                  </Link>
                  <a
                    href={`https://commons.wikimedia.org/wiki/File:${encodeURIComponent(c.filename)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted hover:text-primary truncate max-w-[55%]"
                    title={c.filename}
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{c.filename}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="text-xs text-muted mt-3">
          Politiker ohne Foto werden mit einem farbigen Initialen-Avatar
          (Parteifarbe) dargestellt — keine Bildquelle nötig.
        </p>
      </section>
    </div>
  );
}

function SourceCard({
  title,
  href,
  license,
  licenseHref,
  description,
}: {
  title: string;
  href: string;
  license: string;
  licenseHref: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-4 mb-2">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-foreground hover:text-primary inline-flex items-center gap-1.5"
        >
          {title}
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <a
          href={licenseHref}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted hover:text-primary shrink-0"
        >
          {license}
        </a>
      </div>
      <p className="text-sm text-foreground/80">{description}</p>
    </div>
  );
}
