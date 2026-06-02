#!/usr/bin/env python3
"""Manuelle B.1-Konflikt-Verdicts (Berlin) — Durchgang 2026-06-01.
Setzt final_verdict je Konflikt-Record: 2× ECHT (belegte/echte Diskrepanz,
Sieger unbestimmbar -> beide Quellen transparent zeigen), Rest FALSE_POSITIVE.
"""
import sqlite3, json, sys

DB = "politik.db"
METHOD = "manuelle_review_2026-06-01"

# (politician_id, section, jahr) -> ECHT-Reason
ECHT = {
    (117433, "beruflicher_werdegang", "1990-1993"):
        "Echte Quell-Divergenz beim Arbeitgeber 1990-93 (Deutsche Bank vs. Deutsche Bundesbank/Landeszentralbank). Welche Quelle korrekt ist, ist nicht belegt -> beide transparent zeigen.",
    (176480, "ausbildung", "2010-2012"):
        "Echte Quell-Divergenz beim Referendariat (Werner-v.-Siemens-Gymnasium Großenhain vs. Wilhelm-v.-Siemens-Gymnasium Dresden). Tatsächliche Schule nicht belegbar -> beide transparent zeigen.",
}

FP_REASON = "Manueller Durchgang 2026-06-01: kein echter Widerspruch (temporales Mispairing / Granularität / belegte gleiche Angabe)."

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
# Strikt auf Berlin (parliament_id=2) scopen — Bundestag-Konflikte sind bereits reviewt.
berlin_ids = set(r[0] for r in con.execute(
    "SELECT DISTINCT m.politician_id FROM mandates m "
    "JOIN parliament_periods pp ON m.parliament_period_id=pp.id "
    "WHERE pp.parliament_id=2 AND m.type='mandate'").fetchall())
rows = [r for r in con.execute(
    "SELECT id, first_name||' '||last_name AS name, source_conflicts FROM politicians "
    "WHERE source_conflicts IS NOT NULL AND source_conflicts != '' AND source_conflicts != '[]'"
).fetchall() if r["id"] in berlin_ids]

write = "--write" in sys.argv
n_echt = n_fp = n_pol = 0
for r in rows:
    try:
        conflicts = json.loads(r["source_conflicts"])
    except Exception:
        print(f"  ! parse-fail id {r['id']}"); continue
    if not isinstance(conflicts, list) or not conflicts:
        continue
    n_pol += 1
    for c in conflicts:
        key = (r["id"], c.get("section"), c.get("jahr"))
        if key in ECHT:
            c["final_verdict"] = "ECHT"
            c["final_reason"] = ECHT[key]
            n_echt += 1
            print(f"  ECHT  {r['name']:24s} {c.get('section')}/{c.get('jahr')}")
        else:
            c["final_verdict"] = "FALSE_POSITIVE"
            c["final_reason"] = FP_REASON
            n_fp += 1
        c["verdict_method"] = METHOD
    if write:
        con.execute("UPDATE politicians SET source_conflicts=? WHERE id=?",
                    (json.dumps(conflicts, ensure_ascii=False), r["id"]))

if write:
    con.commit()
print(f"\n{'GESCHRIEBEN' if write else 'DRY-RUN'}: {n_pol} Politiker, {n_echt} ECHT, {n_fp} FALSE_POSITIVE")
con.close()
