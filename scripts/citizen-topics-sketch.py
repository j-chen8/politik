#!/usr/bin/env python3
"""
citizen-topics-sketch.py — ENTWURF (2026-06-02): Bürger-Themen-Frontdoor.
Leitet menschlich benannte "Was bewegt die Leute"-Themen daten-gestützt ab:
Match über echte Tags (im thema-Feld) + Event-Keywords (in zusammenfassung),
sortiert nach echtem Parlaments-Volumen, mit Umfrage-Salienz (★) annotiert.

AW-Politikfelder bleiben das unsichtbare Skelett (vollständig/neutral) —
diese Liste ist die sichtbare Ebene obendrauf. Generös (28), morgen verfeinern.
ROHBAU-CAVEATS: "Demokratie & Rechtsstaat" zu breit (matcht Recht/Justiz);
Event-Keywords grob (Untergrenze); Multi-Label (Zahlen nicht exklusiv).

Usage: python3 scripts/citizen-topics-sketch.py
"""
import sqlite3

# (Name, tags→match in thema, keywords→match in zusammenfassung, Salienz)
TOPICS = [
 ("Mieten & Wohnen",          ["Wohnen","Mietrecht","Stadtentwicklung","Bauplanung","Liegenschaften"], [], "hoch"),
 ("Inflation & Preise",       ["Verbraucherschutz"], ["Inflation","Lebenshaltung","Kaufkraft","Preissteig"], "★ Platz 1 Umfragen"),
 ("Migration & Asyl",         ["Migration","Geflüchtete","Integration"], ["Asyl","Abschiebung"], "★ Top 3"),
 ("Innere Sicherheit & Kriminalität",["Innere Sicherheit","Polizei","Extremismus","Gewaltpräv"], ["Kriminalität","Clan"], "hoch"),
 ("Klima & Umwelt",           ["Klimaschutz","Umweltschutz","Naturschutz"], [], "mittel"),
 ("Energie & Strompreise",    ["Energie"], ["Strompreis","Gaspreis","Energiepreis"], "hoch"),
 ("Rente & Alterssicherung",  ["Rente"], ["Altersvorsorge","Rentenniveau"], "hoch"),
 ("Arbeit & Löhne",           ["Arbeitsmarkt"], ["Mindestlohn","Lohn"], "mittel"),
 ("Bürgergeld & Armut",       ["Soziale Sicherung","Soziale Infrastruktur"], ["Bürgergeld","Grundsicherung","Armut"], "★ Sorge 1"),
 ("Gesundheit & Pflege",      ["Gesundheit"], ["Pflege","Krankenhaus","Krankenkasse"], "mittel"),
 ("Bildung & Schule",         ["Bildung"], ["Schule","Hochschule","Ausbildung","Kita"], "mittel"),
 ("Familie & Kinder",         ["Familie"], ["Kindergeld","Elterngeld"], "mittel"),
 ("Steuern & Staatsfinanzen", ["Finanzen","Steuern","Haushalt"], [], "hoch"),
 ("Wirtschaft & Industrie",   ["Wirtschaft"], ["Industrie","Mittelstand","Rezession"], "★ Top 2"),
 ("Digitales & Datenschutz",  ["Digitalisierung","Datenschutz"], [], "mittel"),
 ("Verkehr & Mobilität",      ["Verkehr","Mobilität","ÖPNV","Verkehrssicherheit"], ["Bahn","Auto"], "mittel"),
 ("Ukrainekrieg",             [], ["Ukraine","Selenskyj","russischen Angriff"], "★ militär. Konflikte"),
 ("Gaza & Nahost",            [], ["Gaza","Israel","Hamas","Nahost"], "★ militär. Konflikte"),
 ("Verteidigung & Bundeswehr",["Verteidigung"], ["Bundeswehr","NATO","Aufrüstung","Wehrdienst"], "mittel"),
 ("Außenpolitik & EU",        ["Außenpolitik","Europa"], [], "mittel"),
 ("Demokratie & Rechtsstaat", ["Demokratie","Justiz","Recht"], ["Grundrecht","Rechtsstaat"], "mittel"),  # TODO zu breit
 ("Landwirtschaft & Tiere",   ["Landwirtschaft","Tierschutz"], ["Bauern","Ernährung"], "niedrig"),
 ("Gleichstellung & Teilhabe",["Antidiskriminierung","Gleichstellung","Inklusion","Geschlechter"], [], "niedrig"),
 ("Kultur & Medien",          ["Kultur","Medien"], [], "niedrig"),
 ("Entwicklung & Menschenrechte",["Entwicklungszusammen","Menschenrechte"], [], "niedrig"),
 ("Sport",                    ["Sport"], ["Olympia"], "niedrig"),
 ("Ostdeutschland",           ["Ostdeutschland"], ["neue Länder","ostdeutsch"], "niedrig"),
 ("Verwaltung & Bürokratie",  ["Verwaltung","Bürokratie","Transparenz"], [], "niedrig"),
]

if __name__ == "__main__":
    con = sqlite3.connect("politik.db"); c = con.cursor()
    rows = c.execute("SELECT thema, COALESCE(zusammenfassung,'') FROM drucksache_analyses WHERE thema IS NOT NULL AND batch_class!='antwort'").fetchall()
    res = []
    for name, tags, kws, sal in TOPICS:
        n = sum(1 for thema, zus in rows if any(t.lower() in thema.lower() for t in tags) or any(k.lower() in zus.lower() for k in kws))
        res.append((name, n, sal))
    res.sort(key=lambda x: -x[1]); mx = max(r[1] for r in res)
    print(f"=== BÜRGER-THEMEN nach Parlaments-Volumen (Bundestag, {len(rows)} DS) ===\n")
    for name, n, sal in res:
        star = "  " + sal if sal.startswith("★") else ""
        print(f"  {n:4}  {'█'*int(n/mx*28):<28} {name}{star}")
    con.close()
