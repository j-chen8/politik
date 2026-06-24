import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getBerlinMethodikCounts } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Methodik — Abgeordnetenhaus Berlin | Politik-Radar",
  description:
    "Wie die Berlin-Daten aufbereitet werden: Datenquellen, KI-Pipelines, Validierung und die bewussten Limitationen des Berlin-Pilots.",
};

const SECTIONS: { id: string; label: string }[] = [
  { id: "pilot-hinweis", label: "Pilot-Hinweis" },
  { id: "datenquellen", label: "Datenquellen" },
  { id: "reden-pipeline", label: "Reden-Pipeline" },
  { id: "plenarbeitrag-typen", label: "Plenarbeitrag-Typen" },
  { id: "drucksachen-pipeline", label: "Drucksachen-Pipeline" },
  { id: "votes-pipeline", label: "Abstimmungen" },
  { id: "cv-limitation", label: "Lebensläufe (Limitation)" },
  { id: "audit-trail", label: "Audit & Reproduzierbarkeit" },
  { id: "ehrlichkeit", label: "Ehrlicher Hinweis" },
];

function BigStat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="px-5 py-5">
      <div className="num text-3xl font-semibold tracking-tight mb-0.5 text-zinc-950 dark:text-zinc-50">{value}</div>
      <div className="text-[12.5px] font-medium text-zinc-700 dark:text-zinc-300">{label}</div>
      {sub && <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function Step({ n, title, model, family, desc }: { n: string; title: string; model: string; family: string; desc: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex gap-3">
      <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xl shrink-0">{n}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
          <span className="font-semibold text-zinc-950 dark:text-zinc-50 text-[14px]">{title}</span>
          <span className="text-[11.5px] text-zinc-500 dark:text-zinc-400 font-mono">{model}</span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{family}</span>
        </div>
        <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Amber({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/40 p-4 text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-2">{children}</div>;
}

const KLASSE_LABEL: Record<string, string> = {
  anfrage_antwort: "Schriftliche Anfrage + Antwort",
  antrag: "Antrag",
  vorlage_senat: "Vorlage des Senats",
  beschlussempfehlung: "Beschlussempfehlung (Regex-Label)",
  gesetzentwurf: "Gesetzentwurf",
};
const OUTCOME_LABEL: Record<string, string> = {
  annahme: "angenommen",
  ablehnung: "abgelehnt",
  annahme_geaendert: "in geänderter Fassung angenommen",
  ueberweisung: "an Ausschuss überwiesen",
  vertagung: "vertagt",
};

export default function BerlinMethodikPage() {
  const c = getBerlinMethodikCounts();
  const fmt = (n: number) => n.toLocaleString("de-DE");
  const quotePct = c.quoteTotal > 0 ? ((c.quoteValid / c.quoteTotal) * 100).toFixed(1) : "—";
  const fotoPct = c.politiker > 0 ? Math.round((c.politikerMitFoto / c.politiker) * 100) : 0;

  return (
    <div className="page-wash min-h-screen">
      <div className="page-shell fade-in-up">
        <Link href="/parlamente/berlin" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Zurück zum Abgeordnetenhaus Berlin
        </Link>

        <div className="lg:flex lg:gap-12">
          <main className="lg:flex-1 lg:max-w-3xl">
            <div className="mb-12">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Berlin-Pilot · Auditierbar</span>
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-[-0.03em] mt-2 mb-4">Methodik — Abgeordnetenhaus Berlin</h1>
              <p className="text-[16px] text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                Das Berliner Abgeordnetenhaus ist ein Pilot. Aufbereitet sind{" "}
                <span className="text-zinc-950 dark:text-zinc-50 font-medium num">{fmt(c.redenAnalysiert)}</span> KI-analysierte Reden,{" "}
                <span className="text-zinc-950 dark:text-zinc-50 font-medium num">{fmt(c.dsAnalysen)}</span> Drucksachen,{" "}
                <span className="text-zinc-950 dark:text-zinc-50 font-medium num">{fmt(c.votesEcht)}</span> Abstimmungen über{" "}
                <span className="text-zinc-950 dark:text-zinc-50 font-medium num">{fmt(c.sitzungen)}</span> Sitzungen. Diese Seite dokumentiert
                jede Pipeline, ihre Prüfschritte und — vor allem — die bewussten Limitationen.
              </p>
            </div>

            <section className="mb-14 scroll-mt-20">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-zinc-200/70 dark:bg-zinc-700/70 rounded-2xl overflow-hidden border border-border">
                <div className="bg-card"><BigStat value={fmt(c.redenAnalysiert)} label="analysierte Reden" sub={`von ${fmt(c.redenNichtPraesidium)} Wortbeiträgen`} /></div>
                <div className="bg-card"><BigStat value={fmt(c.dsAnalysen)} label="Drucksachen" sub="LLM + Regex" /></div>
                <div className="bg-card"><BigStat value={fmt(c.votesEcht)} label="Abstimmungen" sub={`${fmt(c.sitzungen)} Sitzungen`} /></div>
                <div className="bg-card"><BigStat value={`${quotePct} %`} label="Zitat-Validierung" sub={`${fmt(c.quoteValid)} / ${fmt(c.quoteTotal)} Zitate`} /></div>
                <div className="bg-card"><BigStat value={fmt(c.topSummaries)} label="TOP-Zusammenfassungen" /></div>
                <div className="bg-card"><BigStat value={fmt(c.politiker)} label="Abgeordnete" sub={`${fotoPct} % mit Foto`} /></div>
              </div>
            </section>

            <section id="pilot-hinweis" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Pilot-Hinweis: Was gleich ist, was fehlt</h2>
              <Amber>
                <p><strong className="text-zinc-950 dark:text-zinc-50">Die Analyse-Methodik ist identisch zum Bundestag.</strong> Reden, Drucksachen und Abstimmungen laufen über dieselbe Pipeline: ein Generator-Modell (Claude Haiku 4.5) extrahiert strukturiert, anschließend prüft eine <em>deterministische</em> Zitat-Validierung (Substring gegen den Originaltext, hier {quotePct} %) plus dieselben Anti-Halluzinations-Heuristiken (H1–H10) wie beim Bundestag. Für „ist dieses Zitat wirklich in der Rede?" ist das die richtige Prüfung — kein zweites LLM.</p>
                <p><strong className="text-zinc-950 dark:text-zinc-50">Was beim Bundestag mehr ist:</strong> Die dortige <Link href="/methodik" className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline">Specialist-Cascade</Link> (Verifier aus anderen Modellfamilien, Quellenkohärenz-Check) prüft <em>Lebensläufe</em> gegen mehrere Quellen. Sie braucht zwei unabhängige Quellen pro Person — die hat Berlin (noch) nicht (siehe <a href="#cv-limitation" className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline">Lebensläufe</a>). Die Cascade betrifft also nur die CV-Daten, nicht die Reden-/Drucksachen-Analyse.</p>
              </Amber>
            </section>

            <section id="datenquellen" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Datenquellen</h2>
              <ul className="space-y-2 text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <li><strong className="text-zinc-950 dark:text-zinc-50">PARDOK-XML</strong> (parlament-berlin.de) — offizielle Plenarprotokolle, Reden und Drucksachen. Primärquelle, maschinenlesbar.</li>
                <li><strong className="text-zinc-950 dark:text-zinc-50">Wikipedia / Wikidata</strong> — Lebensläufe, Geburtsjahr, Partei-Zugehörigkeit (QID-Anker).</li>
                <li><strong className="text-zinc-950 dark:text-zinc-50">Wikimedia Commons</strong> — Porträtfotos mit Lizenz-Attribution ({fotoPct} % Abdeckung).</li>
                <li><strong className="text-zinc-500 dark:text-zinc-400">abgeordnetenwatch</strong> — für Berlin nahezu leer, daher (anders als beim Bundestag) <em>keine</em> unabhängige Mandats-Wahrheitsquelle verfügbar.</li>
              </ul>
            </section>

            <section id="reden-pipeline" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Reden-Pipeline</h2>
              <div className="space-y-2">
                <Step n="①" title="XML-Extraktion" model="deterministisch" family="—" desc="Reden, Sprecher:innen, Tagesordnungspunkte und Drucksachen-Bezüge werden regelbasiert aus dem PARDOK-Plenarprotokoll geparst — kein LLM, reproduzierbar." />
                <Step n="②" title="Generator" model="Claude Haiku 4.5" family="Anthropic" desc="Erzeugt pro Rede Tonalität, Zusammenfassung, Forderungen, wörtliche Zitate, Framing-Marker und konkrete Zahlen via Tool-Use-Schema. Das Methodik-Dokument läuft als gecachter System-Prompt mit." />
                <Step n="③" title="Zitat-Validierung" model="deterministisch — Substring-Check" family="—" desc={`Jedes vom Modell ausgegebene „wörtliche Zitat" wird gegen den Original-Redetext geprüft. ${quotePct} % der Zitate (${fmt(c.quoteValid)} von ${fmt(c.quoteTotal)}) sind exakt belegbar. Nicht-belegbare Zitate werden markiert, nicht stillschweigend übernommen.`} />
                <Step n="④" title="Drift-Cleanups" model="deterministisch" family="—" desc="Post-Processing fängt bekannte LLM-Output-Fehler ab: stringifizierte Arrays, geleakte Tool-XML-Tags, Tonalitäts-Tippfehler. Reproduzierbar, kein zweites Modell." />
              </div>
            </section>

            <section id="plenarbeitrag-typen" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Plenarbeitrag-Typen & Tonalität</h2>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Die Reden-Typ-Taxonomie (A–K) und die elf Tonalitäten sind aus der Bundestags-Methodik übernommen, die Akteure an Berlin angepasst (Senat statt Bundesregierung, zwölf Bezirke). <strong className="text-zinc-950 dark:text-zinc-50">Neu für Berlin: Typ L</strong> — die mündliche Frage in der Fragestunde, die es so im Bundestag nicht gibt.
                {" "}Die vollständigen Definitionen stehen im <Link href="/methodik#glossar-tonalitaet" className="text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 underline">gemeinsamen Glossar</Link>.
                Die Framing-Marker (~30 empirisch über die Berliner Reden entdeckte Frames) sind ein <em>experimentelles</em> Feature — sie sind interpretativ, keine harten Fakten.
              </p>
            </section>

            <section id="drucksachen-pipeline" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Drucksachen-Pipeline</h2>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
                Jede Drucksache wird nach Typ klassifiziert und mit Claude Haiku 4.5 zusammengefasst (Beschlussempfehlungen erhalten ein Regex-Label). Antwort-Duplikate von Sammelübersichten werden übersprungen.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-border">
                <table className="w-full text-[12.5px]">
                  <thead><tr className="bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-left"><th className="px-4 py-2 font-medium">Klasse</th><th className="px-4 py-2 font-medium text-right">Anzahl</th></tr></thead>
                  <tbody>
                    {c.dsByKlasse.map((d) => (
                      <tr key={d.klasse} className="border-t border-border">
                        <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{KLASSE_LABEL[d.klasse] ?? d.klasse}</td>
                        <td className="px-4 py-2 text-right num text-zinc-950 dark:text-zinc-50">{fmt(d.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="votes-pipeline" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Abstimmungen</h2>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3">
                Aus den Plenarprotokollen werden Handzeichen-Abstimmungen auf Fraktions-Ebene extrahiert (Claude Haiku 4.5 + Postprocessing). {fmt(c.votesEcht)} echte Abstimmungen:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {c.votesByOutcome.map((o) => (
                  <span key={o.outcome} className="text-[12px] text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 rounded px-2 py-1">
                    {OUTCOME_LABEL[o.outcome] ?? o.outcome}: <span className="num text-zinc-950 dark:text-zinc-50">{fmt(o.count)}</span>
                  </span>
                ))}
              </div>
              <Amber>
                <p className="font-medium text-zinc-950 dark:text-zinc-50">Bewusste Anzeige-Entscheidungen (Transparenz):</p>
                <ul className="space-y-1 list-disc pl-4">
                  <li><strong>Verfahrens-Abstimmungen ausgeblendet:</strong> Aktuelle-Stunde-Themenwahl, Dringlichkeit, Zitierungen, Einsprüche gegen Ordnungsrufe und Personenwahlen erscheinen <em>nicht</em> in der Abstimmungs-Ansicht — sie betreffen keine Drucksache. Sie bleiben für das Audit in der Datenbank.</li>
                  <li><strong>Vote-Label teilweise:</strong> Der „worum ging es"-Kurztext pro Abstimmung wird regelbasiert aus dem Protokoll-Snippet gezogen; ein Teil bleibt ohne Label (dann zeigt die Karte den Drucksachen-Titel).</li>
                  <li><strong>TOP-↔-Drucksachen-Zuordnung</strong> erfolgt über die Kopfzeile des Tagesordnungspunkts, nicht über jede beiläufige Erwähnung im Redeverlauf.</li>
                  <li><strong>Reine Wahl-/Vereidigungsakte</strong> (Präsidiumswahl, Senatsvereidigung) haben keine KI-Zusammenfassung — es gibt keine Debatte zu synthetisieren.</li>
                </ul>
              </Amber>
            </section>

            <section id="cv-limitation" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Lebensläufe — die ehrliche Limitation</h2>
              <Amber>
                <p>Von {fmt(c.politiker)} Abgeordneten haben{" "}
                  <span className="num text-zinc-950 dark:text-zinc-50">{fmt(c.politikerMitCv)}</span> einen aufbereiteten Lebenslauf — aber nur aus <strong className="text-zinc-950 dark:text-zinc-50">einer Quelle (Wikipedia)</strong>. Nur{" "}
                  <span className="num text-zinc-950 dark:text-zinc-50">{fmt(c.politikerMitHomepage)}</span> haben eine zweite, unabhängige Quelle.</p>
                <p>Die Quellenkohärenz-Prüfung des Bundestags (zwei Quellen gegeneinander) kann hier deshalb <strong className="text-zinc-950 dark:text-zinc-50">noch nicht laufen</strong> — nicht, weil die Logik fehlt, sondern die zweite Datenquelle. Berlin-Lebensläufe sind damit weniger abgesichert als die des Bundestags. Das Anbinden der Abgeordneten-Profile (offizielles AGH-Verzeichnis + Fraktions-Biografien) als Zweitquelle ist der nächste geplante Schritt.</p>
              </Amber>
            </section>

            <section id="audit-trail" className="mb-14 scroll-mt-20">
              <h2 className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-3">Audit & Reproduzierbarkeit</h2>
              <ul className="space-y-2 text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed">
                <li>Jede KI-Analyse speichert <code className="text-[12px] bg-zinc-100 dark:bg-zinc-800 px-1 rounded">prompt_version</code> + einen Hash der Methodik-Datei — so ist nachvollziehbar, mit welcher Regelfassung ein Eintrag entstand.</li>
                <li>Abstimmungen werden gegen Ground-Truth-Stichproben pro Sitzung regressionsgetestet.</li>
                <li>Sämtliche Pipeline-Skripte liegen im öffentlichen Repository.</li>
              </ul>
            </section>

            <section id="ehrlichkeit" className="mb-10 scroll-mt-20">
              <h2 className="text-[15px] font-semibold text-zinc-950 dark:text-zinc-50 mb-1">Ehrlicher Hinweis</h2>
              <p className="text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed max-w-2xl">
                Berlin ist ein Pilot mit bewusst schlankeren Sicherungen als der Bundestag: ein Generator-Modell plus deterministische Validierung, (noch) kein Verifier-Cascade und kein systematisches Lebenslauf-Quellen-Audit. Fehler werden minimiert, nicht eliminiert. Wo eine Aussage interpretativ ist (Tonalität, Framing), ist sie als solche gekennzeichnet — die harten Fakten (wer, wann, welche Drucksache, welches Ergebnis) stammen direkt aus dem offiziellen Protokoll.
              </p>
            </section>
          </main>

          <aside className="hidden lg:block lg:w-52 shrink-0">
            <nav className="sticky top-20 text-[12.5px]">
              <div className="text-[10.5px] font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">Auf dieser Seite</div>
              <ul className="space-y-0.5 border-l border-border">
                {SECTIONS.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="block pl-3 -ml-px border-l border-transparent hover:border-zinc-900 dark:hover:border-zinc-100 hover:text-zinc-950 dark:hover:text-zinc-50 text-zinc-600 dark:text-zinc-300 py-1 leading-snug transition-colors">{s.label}</a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </div>
  );
}
