/**
 * Bundeshaushalt 2027 — Analyse des Regierungsentwurfs (Vor-Parlaments-Analyse).
 *
 * QUELLE: Kabinettsache Datenblatt-Nr. 21/08062 vom 3. Juli 2026 (Anschreiben
 * 28 S. + Anlagen inkl. Einzelplanübersichten; 1.655 S.), vom Kabinett am
 * 6. Juli 2026 beschlossen; öffentlich via Table.Media. Alle Zahlen wurden
 * MANUELL aus dem Dokument übernommen (kein LLM). Die amtliche Drucksache
 * (Zuleitung an Bundesrat/Bundestag, ~Aug/Sep 2026) wird nach Erscheinen
 * gegen diese Fassung abgeglichen (Wächter: scripts/check-haushalt-2027.ts).
 */
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { TheseKachel, TheseZahl, WenEsTrifftKachel, KennzahlKachel, QuelleKarte } from "@/components/AnalyseAufmacher";

export const metadata = {
  title: "Bundeshaushalt 2027 — der Entwurf im Überblick | Politik-Radar",
  description:
    "Regierungsentwurf zum Bundeshaushalt 2027: 555,4 Mrd. € Ausgaben, 203,7 Mrd. € neue Schulden, die größten Verschiebungen und wie die 34-Mrd.-Lücke geschlossen wurde.",
};

/* ── Daten (manuell aus der Kabinettsfassung übernommen) ─────────────────── */

// „Wen es trifft" — konkrete Gruppen mit Härte-Ampel (Arten wie bei den
// Kommissionsberichten: Kürzung/Belastung/Ausweitung).
const BETROFFENE = [
  { gruppe: "Verteidigung & Sicherheit", art: "Ausweitung", label: "+32,7 % Etat" },
  { gruppe: "Sozialer Wohnungsbau", art: "Ausweitung", label: "+1 Mrd. auf 5 Mrd." },
  { gruppe: "GKV-Versicherte", art: "Kürzung", label: "Zuschuss −2 Mrd." },
  { gruppe: "Familien im Kinderzuschlag", art: "Kürzung", label: "Sofortzuschlag entfällt" },
  { gruppe: "Alkohol-Konsum", art: "Belastung", label: "Steuersätze +20 %" },
  { gruppe: "Krypto-Anleger", art: "Belastung", label: "Jahresfrist entfällt" },
  { gruppe: "Bundesverwaltung", art: "Kürzung", label: "GMA 1,2 Mrd. · −2 % Stellen" },
];

// Zahlen-Kacheln unter der These (gleiches Muster wie Kommissions-Kennzahlen).
const KENNZAHLEN = [
  { wert: "555,4 Mrd. €", label: "Ausgaben 2027 — +5,9 % gegenüber 2026 (524,5 Mrd.)" },
  { wert: "33,4 Mrd. €", label: "reguläre Kreditgrenze der Schuldenregel — auf den Euro exakt ausgeschöpft" },
  { wert: "80,7 Mrd. €", label: "Zinsausgaben pro Jahr bis 2030 — fast doppelt so viel wie 2027 (41,9 Mrd.)" },
  { wert: "+4.752", label: "Stellen netto (auf 310.487) — trotz 2-%-Abbauregel im Koalitionsvertrag" },
  { wert: "394,7 Mrd. €", label: "Steuereinnahmen — 10,1 Mrd. unter der Oktober-Schätzung (Iran-Krieg + Steuerreformen)" },
  { wert: "117,5 Mrd. €", label: "Investitionen gesamt (Kern + SVIK + KTF) — leicht unter 2026 (118,2 Mrd.)" },
];

const BEWEGUNGEN: { epl: string; name: string; s2026: string; e2027: string; delta: string; grund: string }[] = [
  { epl: "14", name: "Verteidigung", s2026: "82,7", e2027: "109,7", delta: "+32,7 %", grund: "Aufwuchspfad Richtung NATO-Quote 3,5 % (2029); zusätzlich ~4 Mrd. verteidigungsrelevante Verkehrsinvestitionen aus dem SVIK hierher umgebucht. Dazu kommen 30 Mrd. aus dem Bundeswehr-Sondervermögen, das Ende 2027 aufgebraucht ist." },
  { epl: "32", name: "Bundesschuld (v.a. Zinsen)", s2026: "33,6", e2027: "43,6", delta: "+29,6 %", grund: "Höheres Zinsniveau (auch Folge des Iran-Kriegs) + wachsender Schuldenstand; Zinsen aus SVIK-/Bereichsausnahme-Krediten buchen jeweils im Folgejahr." },
  { epl: "15", name: "Gesundheit", s2026: "21,8", e2027: "14,3", delta: "−34,2 %", grund: "Konsolidierung: GKV-Bundeszuschuss dauerhaft um 2 Mrd. auf 12,5 Mrd. abgesenkt (GKV-Beitragssatzstabilisierungsgesetz); 2026er Sonderhilfen entfallen. Rückzahlung der Gesundheitsfonds-Darlehen (5,6 Mrd.) auf 2035–2039 verschoben." },
  { epl: "17", name: "Bildung & Familie", s2026: "16,7", e2027: "15,5", delta: "−7,1 %", grund: "Elterngeld an sinkende Geburtenzahlen + geplante Reform angepasst; Sofortzuschlag im Kinderzuschlag abgeschafft; Ressortzuschnitt geändert." },
  { epl: "12", name: "Verkehr", s2026: "27,9", e2027: "26,4", delta: "−5,3 %", grund: "Kein Kürzungssignal im engeren Sinn: Verkehrsinvestitionen wandern strukturell ins SVIK (17,7 Mrd.) und als verteidigungsrelevante Anteile in den Epl. 14 (5,8 Mrd.). Gesamt für Straße/Schiene/Wasserstraße: 33,7 Mrd." },
  { epl: "06", name: "Inneres", s2026: "15,8", e2027: "16,7", delta: "+6,0 %", grund: "Zivil- und Katastrophenschutz +0,7 Mrd. (knapp 2,8 Mrd.); Bundespolizei 5,18 Mrd.; BKA 1,36 Mrd.; BSI 0,51 Mrd.; +900 Stellen Sicherheitsbehörden." },
  { epl: "11", name: "Arbeit & Soziales", s2026: "197,3", e2027: "201,5", delta: "+2,1 %", grund: "Größter Etat. Rentenzuschüsse steigen auf 132,0 Mrd. (2030: 164,5). Neu: 5,2-Mrd.-Darlehen an die Bundesagentur für Arbeit, die 2027 ohne Bundeshilfe nicht auskommt." },
  { epl: "23", name: "Entwicklung", s2026: "10,1", e2027: "9,5", delta: "−5,8 %", grund: "Konsolidierungsbeitrag; ODA-Ausgaben gesamt 18,1 Mrd. — Deutschland bleibt unter den größten Gebern (2025: knapp vor den USA)." },
];

const KONSOLIDIERUNG: { was: string; wieviel: string; anmerkung: string }[] = [
  { was: "Globale Minderausgabe „Effizienz“ quer über die Ressorts", wieviel: "1,2 Mrd. €", anmerkung: "wächst bis 2029 auf 3 Mrd.; Verteilung steht fest (größter Anteil: Arbeit & Soziales 258 Mio., Verkehr 156 Mio., Forschung 120 Mio.) — welche Titel konkret gekürzt werden, entscheidet erst das parlamentarische Verfahren" },
  { was: "GKV-Bundeszuschuss abgesenkt", wieviel: "2 Mrd. €/Jahr", anmerkung: "dauerhaft, auf 12,5 Mrd.; zusätzlich Gesundheitsfonds-Darlehen erst 2035–2039 zurückgezahlt" },
  { was: "Bundeszuschuss Rente gemindert", wieviel: "1 Mrd. € (2027)", anmerkung: "Teil des Haushaltsbegleitgesetzes; Beitragssatz-Annahme bleibt 18,6 %" },
  { was: "Alkohol-, Schaumwein-, Alkopopsteuer +20 %", wieviel: "—", anmerkung: "im Haushaltsbegleitgesetz; Tabaksteuer-Anpassung in eigenem Gesetz" },
  { was: "Kinderzuschlag: Sofortzuschlag abgeschafft, Regelbedarfs-Fortschreibung zurückgedreht", wieviel: "—", anmerkung: "Anpassungsmechanismus der Regelsätze wieder auf Vor-Corona-Recht" },
  { was: "KTF-Finanzhilfen anteilig gekürzt, ETS1-Erlöse teils in den Kernhaushalt", wieviel: "2,7 Mrd. € (2027)", anmerkung: "entlastet den Bundeshaushalt zulasten des Klima- und Transformationsfonds; dessen Wirtschaftsplan folgt separat" },
  { was: "Rücklagen-Entnahme", wieviel: "6,8 Mrd. €", anmerkung: "danach sind nur noch 3,9 Mrd. übrig — das Polster ist fast aufgebraucht" },
  { was: "Eingeplant, aber noch nicht beschlossen", wieviel: "2,6 Mrd. €", anmerkung: "„Globale Mehreinnahme“ für Plastiksteuer, Krypto-Besteuerung (künftig Kapitalvermögen, Jahresfrist entfällt), Anti-Steuerkriminalität — die Gesetze dazu gibt es noch nicht" },
];

/* ── Seite ────────────────────────────────────────────────────────────────── */

export default function Haushalt2027Analyse() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-8 sm:px-9">
      <header className="flex flex-col gap-2">
        <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-muted">
          <Link href="/analyse" className="hover:underline">Analyse</Link> · Vor-Parlaments-Analyse
        </p>
        <h1 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[32px]">
          Bundeshaushalt 2027 — der Entwurf im Überblick
        </h1>
        <p className="text-[15px] leading-relaxed text-muted">
          Das Kabinett hat am 6. Juli 2026 den Regierungsentwurf beschlossen. Der Bundestag berät
          voraussichtlich ab September. Diese Analyse beruht auf dem Originaldokument — nicht auf
          Pressemitteilungen.
        </p>
      </header>

      {/* Herkunft/Methodik — bewusst prominent: die amtliche Drucksache existiert noch nicht */}
      <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-[13.5px] leading-relaxed text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/30 dark:text-amber-200">
        <span className="font-semibold">Quelle &amp; Stand:</span> Kabinettsfassung vom 3. Juli 2026
        (Kabinettsache 21/08062, 1.655 Seiten inkl. Einzelplänen), beschlossen am 6. Juli;
        öffentlich zugänglich über{" "}
        <a href="https://table.media/assets/berlin/haushalt_2027.pdf" target="_blank" rel="noopener noreferrer" className="underline">Table.Media</a>.
        Eine amtliche Bundestags-Drucksache gibt es noch nicht — sie folgt mit der Zuleitung
        (üblicherweise August/September). Wir gleichen diese Analyse dann gegen die amtliche
        Fassung ab. Alle Zahlen sind dem Dokument direkt entnommen.
      </div>

      {/* AUFMACHER (Bento) — gleiche Bausteine wie die Kommissions-Detailseiten:
          These + Wen es trifft + Kennzahl-Kacheln auf EINEN Blick. */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-6 [grid-auto-rows:minmax(92px,auto)]">
        <TheseKachel>
          <TheseZahl
            wert="203,7 Mrd. €"
            text="neue Schulden im Jahr 2027 — 118,7 Mrd. im Kernhaushalt plus 54,9 Mrd. Sondervermögen Infrastruktur/Klima plus 30,0 Mrd. Sondervermögen Bundeswehr. Die Schuldenbremse gilt dabei als eingehalten."
          />
        </TheseKachel>
        <WenEsTrifftKachel zeilen={BETROFFENE} />
        {KENNZAHLEN.map((kz) => (
          <KennzahlKachel key={kz.wert} wert={kz.wert} label={kz.label} />
        ))}
      </section>

      {/* Schuldenregel-Mechanik */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">
          203,7 Mrd. € neue Schulden — und die Schuldenbremse gilt als eingehalten. Wie geht das?
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground/90">
          Die reguläre Grenze der Schuldenregel erlaubt 2027 eine strukturelle Neuverschuldung von{" "}
          <span className="num font-medium">33,4 Mrd. €</span> — der Entwurf schöpft sie{" "}
          <em>exakt vollständig</em> aus (zulässig laut Anlage 7b: 33.366 Mio., veranschlagt: 33.366 Mio.).
          Alles darüber läuft an der Regel vorbei, auf drei Wegen:
        </p>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5 font-medium">Weg</th>
                <th className="num px-4 py-2.5 font-medium">2027</th>
                <th className="px-4 py-2.5 font-medium">Was dahinter steckt</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 font-medium text-foreground">Bereichsausnahme (Art. 115 GG)</td>
                <td className="num px-4 py-2.5">85,4 Mrd. €</td>
                <td className="px-4 py-2.5 text-muted">Verteidigung &amp; Sicherheit über 1 % des BIP sind seit der Grundgesetzänderung 2025 von der Schuldenregel ausgenommen. 2027 fallen darunter: Verteidigung 109,0 · Ukraine-Hilfe 11,6 · IT-Sicherheit 3,9 · Zivilschutz 2,8 · Nachrichtendienste 2,7 Mrd. (Summe 130,1, abzüglich 44,7 = 1 % BIP). Bis 2030 wächst dieser Kanal auf ~151,8 Mrd./Jahr.</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-4 py-2.5 font-medium text-foreground">Sondervermögen SVIK</td>
                <td className="num px-4 py-2.5">54,9 Mrd. €</td>
                <td className="px-4 py-2.5 text-muted">Kreditfinanziertes Sondervermögen „Infrastruktur und Klimaneutralität“: 36,6 Mrd. Bundesprojekte (größte Posten: Verkehr 17,7 · Digitalisierung 9,0 · Krankenhäuser 3,5) + 10 Mrd. Zuweisung an den KTF + 8,3 Mrd. für Länder/Kommunen. Bis Ende 2030 sollen kumuliert ~303,8 Mrd. verausgabt sein.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-foreground">Sondervermögen Bundeswehr</td>
                <td className="num px-4 py-2.5">30,0 Mrd. €</td>
                <td className="px-4 py-2.5 text-muted">Letzte Tranche der 100 Mrd. von 2022 — Ende 2027 ist das Sondervermögen vollständig verausgabt. Tilgung: Einstieg 2033, vollständig bis 2060 (neuer Tilgungsplan im Haushaltsbegleitgesetz).</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[13.5px] leading-relaxed text-muted">
          Ohne die Ausnahmen sinkt die im Kernhaushalt „regulär“ finanzierte Neuverschuldung sogar:
          von 40,4 Mrd. (2026) auf 33,4 Mrd. (2027). Der Preis steht im Zinstitel — die Zinsausgaben
          verdoppeln sich bis 2030 fast, auf ~80,7 Mrd. €/Jahr, weil die Kredite der Sondervermögen
          und der Bereichsausnahme jeweils im Folgejahr auf den Zinstitel durchschlagen.
        </p>
      </section>

      {/* Größte Bewegungen */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">Die größten Verschiebungen nach Einzelplan</h2>
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted">
                <th className="px-4 py-2.5 font-medium">Etat</th>
                <th className="num px-4 py-2.5 font-medium">2026 → 2027 (Mrd. €)</th>
                <th className="num px-4 py-2.5 font-medium">±</th>
                <th className="px-4 py-2.5 font-medium">Warum</th>
              </tr>
            </thead>
            <tbody className="align-top">
              {BEWEGUNGEN.map((b) => (
                <tr key={b.epl} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-foreground whitespace-nowrap">{b.name} <span className="num text-[11.5px] text-muted">Epl. {b.epl}</span></td>
                  <td className="num px-4 py-2.5 whitespace-nowrap">{b.s2026} → {b.e2027}</td>
                  <td className={`num px-4 py-2.5 whitespace-nowrap font-medium ${b.delta.startsWith("−") ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>{b.delta}</td>
                  <td className="px-4 py-2.5 text-muted">{b.grund}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[13.5px] leading-relaxed text-muted">
          Vorsicht bei nackten Prozentwerten: Ein Teil der Bewegungen sind Umbuchungen zwischen
          Kernhaushalt, Sondervermögen und Einzelplänen (Verkehr → SVIK/Verteidigung), keine
          echten Kürzungen oder Aufwüchse.
        </p>
      </section>

      {/* Konsolidierung */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">
          Wie die 34-Mrd.-Lücke geschlossen wurde
        </h2>
        <p className="text-[15px] leading-relaxed text-foreground/90">
          Die Finanzplanung wies für 2027 ursprünglich einen Fehlbetrag von 34 Mrd. € aus — der
          Entwurf löst ihn vollständig auf. Die wichtigsten Bausteine:
        </p>
        {/* Eingeklappt wie die Empfehlungskataloge der Kommissionsberichte. */}
        <details className="group rounded-lg border border-border bg-card">
          <summary className="flex cursor-pointer list-none select-none items-center justify-between gap-3 px-4 py-3">
            <span className="text-[13px] font-semibold uppercase tracking-wide text-foreground">Die Bausteine im Einzelnen</span>
            <span className="flex shrink-0 items-center gap-2 text-[12px] text-muted">
              {KONSOLIDIERUNG.length} Maßnahmen
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
            </span>
          </summary>
          <div className="flex flex-col gap-2 border-t border-border p-3">
            {KONSOLIDIERUNG.map((k) => (
              <div key={k.was} className="flex flex-col gap-0.5 rounded-lg border border-border bg-background/40 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-3">
                <p className="num shrink-0 text-[14px] font-semibold text-foreground sm:w-28">{k.wieviel}</p>
                <div>
                  <p className="text-[14.5px] font-medium text-foreground">{k.was}</p>
                  <p className="text-[13px] leading-snug text-muted">{k.anmerkung}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* Was offen bleibt */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-foreground">Was der Entwurf offen lässt</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] leading-relaxed text-foreground/90">
          <li>
            <span className="font-medium">Die Jahre nach 2027 sind nicht gedeckt:</span> Der Finanzplan
            weist weiter Lücken aus — <span className="num">22 Mrd.</span> (2028),{" "}
            <span className="num">38 Mrd.</span> (2029), <span className="num">47 Mrd.</span> (2030).
            Das Dokument selbst nennt das Schließen „eine gemeinsame Aufgabe der Bundesregierung“.
          </li>
          <li>
            <span className="font-medium">2,6 Mrd. € Einnahmen aus Gesetzen, die es noch nicht gibt:</span>{" "}
            Plastiksteuer, Krypto-Besteuerung und Anti-Steuerkriminalitäts-Maßnahmen sind einnahmeseitig
            eingeplant, aber noch nicht vom Kabinett beschlossen.
          </li>
          <li>
            <span className="font-medium">Stellenabbau auf dem Papier:</span> Der Koalitionsvertrag
            verspricht −8 % Stellen (2 %/Jahr) — der Entwurf schreibt die 2-%-Quote fest, aber das
            Stellensoll <em>steigt</em> netto um 4.752 auf 310.487, weil Verteidigung (+6.000 Soldaten,
            +2.100 zivil), Sicherheitsbehörden (+900), Zoll (+869) und Justiz ausgenommen sind bzw. aufwachsen.
          </li>
          <li>
            <span className="font-medium">Der KTF-Wirtschaftsplan fehlt noch:</span> Er soll „zeitnah“
            nachgereicht werden — erst dann ist z.B. die Heizungsförderung (Kürzung bereits angekündigt)
            konkret ablesbar.
          </li>
          <li>
            <span className="font-medium">Elterngeld-Reform nur angedeutet:</span> Der Etat wird an eine
            „geplante Reform“ angepasst — Details stehen nicht im Haushaltsentwurf, sondern folgen im
            Fachgesetz.
          </li>
        </ul>
      </section>

      {/* Dokument-Quelle — gleiches Muster wie am Ende der Kommissionsberichte. */}
      <QuelleKarte
        href="https://table.media/assets/berlin/haushalt_2027.pdf"
        titel="Regierungsentwurf Bundeshaushalt 2027 + Finanzplan bis 2030 (Kabinettsfassung, PDF)"
        meta="Kabinettsache 21/08062 · 03.07.2026 · 1.655 S. · veröffentlicht via Table.Media · analysiert 07.07.2026"
      />

      <footer className="flex flex-col gap-2 border-t border-border pt-4 text-[13px] leading-relaxed text-muted">
        <p>
          <span className="font-medium text-foreground">Methodik:</span> Alle Zahlen manuell aus der
          Kabinettsfassung übernommen (Anschreiben S. 1–28, Einzelplanübersichten Anlagen 4–6,
          Bereichsausnahme-Berechnung Anlagen 7a/7b). Keine automatische Extraktion, kein Sprachmodell.
          Prozentwerte wie im Dokument ausgewiesen; Rundungsdifferenzen möglich.
        </p>
        <p>
          Sobald der Entwurf als Bundestags-Drucksache vorliegt, verlinken wir ihn hier und gleichen
          alle Zahlen ab.{" "}
          <Link href="/gesetze" className="inline-flex items-center gap-1 font-medium text-foreground hover:underline">
            Aktuelle Gesetzentwürfe <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </footer>
    </div>
  );
}
