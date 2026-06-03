#!/usr/bin/env python3
"""
citizen-topics-sketch.py — ENTWURF v2 (2026-06-03): Bürger-Themen-Frontdoor.
Leitet menschlich benannte "Was bewegt die Leute"-Themen daten-gestützt ab.

WAS SICH GEGENÜBER v1 GEÄNDERT HAT (Datenqualität zuerst):
  - EXAKTES Tag-Matching statt Substring. `thema` ist eine komma-separierte Liste
    aus 45 kontrollierten AW-Politikfeld-Tags (kein Freitext). Substring fing
    Falschtreffer ("Recht"→Mietrecht/Bürgerrechte, Keyword "Auto"→Automatik).
  - ALLE 45 Tags vollständig gemappt (Coverage-Check am Ende). v1 ließ die großen
    Felder `Soziales`(331), `Forschung`(132), `Infrastruktur`(126) komplett liegen
    und suchte erfundene Tags ("Soziale Sicherung") → krasse Untererfassung.
  - Zwei getrennte Ebenen:
      (A) Politikfeld-Volumen aus exakten Tags  → belastbar, das Skelett.
      (B) Ereignis-Schlagwörter (Ukraine/Gaza/Inflation) haben KEIN eigenes Tag →
          Keyword-Suche in der Zusammenfassung, klar als UNTERGRENZE markiert.
    Nicht mischen — sonst Doppelzählung (Ukraine steckt in Außenpolitik etc.).

AW-Politikfelder bleiben das unsichtbare Skelett (vollständig/neutral) — diese
Liste ist die sichtbare Ebene obendrauf.

Usage: python3 scripts/citizen-topics-sketch.py
"""
import sqlite3
from collections import Counter

# ── Ebene A: Bürger-Thema → exakte AW-Tags ───────────────────────────────────
# (Name, [exakte Tags], Salienz). Jeder der 45 Tags ist genau einem Thema
# zugeordnet (Coverage-Check unten verifiziert das). "Sonstiges" = Catch-all.
TOPIC_TAGS = [
 ("Steuern & Staatsfinanzen",      ["Finanzen", "Steuern"],                              "hoch"),
 ("Innere Sicherheit",             ["Innere Sicherheit", "Extremismus"],                 "hoch"),
 ("Wirtschaft & Industrie",        ["Wirtschaft"],                                       "★ Top 2"),
 ("Außenpolitik & EU",             ["Außenpolitik", "Europa"],                           "mittel"),
 ("Justiz & Recht",                ["Justiz", "Bürgerrechte"],                           "mittel"),
 ("Demokratie & Mitbestimmung",    ["Demokratie", "Transparenz", "Lobbyismus", "Föderalismus"], "mittel"),
 ("Digitales & Datenschutz",       ["Digitalisierung", "Datenschutz"],                   "mittel"),
 ("Arbeit & Löhne",                ["Arbeitsmarkt"],                                     "mittel"),
 ("Energie",                       ["Energie"],                                          "hoch"),
 ("Verwaltung & Bürokratie",       ["Verwaltung", "Bürokratie"],                         "niedrig"),
 ("Klima & Umwelt",                ["Klimaschutz", "Umweltschutz"],                      "mittel"),
 ("Migration & Asyl",              ["Migration"],                                        "★ Top 3"),
 ("Gesundheit & Pflege",           ["Gesundheit"],                                       "mittel"),
 ("Verkehr & Infrastruktur",       ["Verkehr", "Mobilität", "Infrastruktur"],            "mittel"),
 ("Soziales & Bürgergeld",         ["Soziales"],                                         "★ Sorge 1"),
 ("Entwicklung & Menschenrechte",  ["Menschenrechte", "Entwicklungszusammenarbeit"],     "niedrig"),
 ("Verteidigung & Bundeswehr",     ["Verteidigung", "Bundeswehr"],                       "mittel"),
 ("Verbraucherschutz",             ["Verbraucherschutz"],                                "mittel"),
 ("Bildung",                       ["Bildung"],                                          "mittel"),
 ("Landwirtschaft & Tiere",        ["Landwirtschaft", "Tierschutz"],                     "niedrig"),
 ("Forschung & Innovation",        ["Forschung"],                                        "niedrig"),
 ("Familie & Kinder",              ["Familie"],                                          "mittel"),
 ("Gleichstellung & Teilhabe",     ["Geschlechtergerechtigkeit", "Antidiskriminierung"], "niedrig"),
 ("Rente & Alterssicherung",       ["Rente"],                                            "hoch"),
 ("Wohnen & Mieten",               ["Wohnen", "Mietrecht"],                              "hoch"),
 ("Kultur",                        ["Kultur"],                                           "niedrig"),
 ("Sport",                         ["Sport"],                                            "niedrig"),
]

# ── Umfrage-Salienz: ECHTE Werte, zitierbar ─────────────────────────────────
# Quelle: Forschungsgruppe Wahlen, Politbarometer, Erhebung 19.–21.05.2026
# (n=1.340, telef.+online). Offene Frage "wichtigste Probleme", Mehrfachnennung
# (Summe >100 %). Werte = % der Befragten, die das Problem nennen.
# Tabellen "Wichtige Probleme in Deutschland I+II" (Langzeit-xlsx, Stand 22.05.2026).
SURVEY_SOURCE = "trianguliert PB(offen)/EB+IP(vorgegeben) — siehe docs/umfrage-salienz.md"
# Thema-Name → triangulierte Salienz-Stufe (NICHT fragile Einzel-%; Herleitung im Doc).
# None/fehlt = in Umfragen selten top.
TIER = {
 "Wirtschaft & Industrie": "sehr hoch",
 "Soziales & Bürgergeld": "hoch",          # Armut/Ungleichheit Spitze in vorgegeben
 "Verteidigung & Bundeswehr": "hoch",      # Sicherheit/Verteidigung
 "Migration & Asyl": "hoch (rückläufig)",
 "Innere Sicherheit": "mittel-hoch",       # Kriminalität/Gewalt
 "Gesundheit & Pflege": "mittel-hoch",
 "Klima & Umwelt": "mittel",
 "Energie": "mittel",
 "Steuern & Staatsfinanzen": "mittel",     # + Parlaments-Volumen #1
 "Rente & Alterssicherung": "mittel (Divergenz)",  # Parl. nur 2 %
 "Bildung": "niedrig",
}
# Inflation/Preise = sehr hoch, aber Querschnitt ohne eigenes AW-Tag → Ebene B.

# ── Ebene B: Ereignis-Schlagwörter ohne eigenes Politikfeld-Tag ──────────────
# UNTERGRENZE: grobe Keyword-Suche in der Zusammenfassung, überlappt mit Ebene A.
# Mit echtem Umfragewert annotiert, wo vorhanden.
EVENT_KEYWORDS = [
 ("Inflation / Kosten & Preise", ["Inflation", "Strompreis", "Gaspreis", "Kaufkraft", "Lebenshaltung"], "Salienz: sehr hoch (EB 29 %/IP 31 %)"),
 ("Militärische Konflikte (Ukraine/Nahost)", ["Ukraine", "Selenskyj", "Gaza", "Hamas", "Nahost", "israelisch"], "Salienz: hoch (IP 31 %)"),
 ("Bürgergeld konkret",    ["Bürgergeld", "Grundsicherung"],                       "Teil v. Soziales/Ungleichheit (hoch)"),
]

if __name__ == "__main__":
    con = sqlite3.connect("politik.db"); c = con.cursor()
    rows = c.execute(
        "SELECT thema, COALESCE(zusammenfassung,'') FROM drucksache_analyses "
        "WHERE thema IS NOT NULL AND batch_class!='antwort'"
    ).fetchall()
    # thema → Set exakter Tags
    parsed = [(set(t.strip() for t in thema.split(",")), zus.lower()) for thema, zus in rows]
    N = len(parsed)

    # Coverage-Check: jeder Tag in genau einem Thema?
    mapped = Counter()
    for _, tags, _ in TOPIC_TAGS:
        for tag in tags:
            mapped[tag] += 1
    all_tags = Counter()
    for tagset, _ in parsed:
        all_tags.update(tagset)
    unmapped = sorted(t for t in all_tags if t not in mapped and t != "Sonstiges")
    doublemapped = sorted(t for t, n in mapped.items() if n > 1)

    # Ebene A
    resA = []
    for name, tags, sal in TOPIC_TAGS:
        tset = set(tags)
        n = sum(1 for tagset, _ in parsed if tagset & tset)
        resA.append((name, n, sal))
    resA.sort(key=lambda x: -x[1]); mx = max(r[1] for r in resA)

    print(f"=== EBENE A · Parlaments-Volumen vs. Umfrage-Salienz (Tier) ===")
    print(f"    Parlament: % der {N} Bundestag-DS, die das Feld berühren (Mehrfach-Tag).")
    print(f"    Salienz:   triangulierte Stufe aus mehreren Umfragen.")
    print(f"    Quelle: {SURVEY_SOURCE}\n")
    print(f"    {'Parl%':>6}  {'Salienz':<18} Thema")
    for name, n, sal in resA:
        pct = n / N * 100
        tier = TIER.get(name, "—")
        print(f"    {pct:5.1f}%  {tier:<18} {name}")

    print(f"\n=== EBENE B · Ereignis-Schlagwörter (Untergrenze, überlappt A) ===\n")
    resB = []
    for name, kws, sal in EVENT_KEYWORDS:
        n = sum(1 for _, zus in parsed if any(k.lower() in zus for k in kws))
        resB.append((name, n, sal))
    resB.sort(key=lambda x: -x[1])
    for name, n, sal in resB:
        print(f"  {n:4}  {name}  —  {sal}")

    print(f"\n=== COVERAGE-CHECK ===")
    print(f"  Tags gemappt: {len(mapped)}/{len(all_tags)} vorkommende  |  unmapped: {unmapped or '—'}")
    print(f"  doppelt gemappte Tags (sollte leer sein): {doublemapped or '—'}")
    con.close()
