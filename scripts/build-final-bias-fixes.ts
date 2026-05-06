#!/usr/bin/env npx tsx
/**
 * Baut finale Bias-Fixes:
 * 1. Strippt Tool-Tag-Lecks am Ende von Summaries
 * 2. Wendet Mappings an
 * 3. Manuelle Override für problematische Fälle (Grammatik-Brüche)
 * 4. Output: bias-fixes-final.jsonl mit (rede_id, segment_index, final_summary)
 */

import * as fs from 'node:fs';

// Mappings — kontextarm, mit Akzeptanz dass manche Grammatik-awkward sind
// Manuelle Overrides unten für Grammatik-Brüche
const MAPPINGS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\bHeuchelei\b/g, replacement: 'Inkonsistenz' },
  { pattern: /\bDoppelmoral\b/g, replacement: 'Inkonsistenz' },
  { pattern: /\bStimmungsmache\b/g, replacement: 'Polemik' },
  { pattern: /\bAbgesang\b/g, replacement: 'Pessimismus' },
  { pattern: /\bDiffamierungskampagne\b/g, replacement: 'scharfe Kritik' },
  { pattern: /\bDiffamierungen\b/g, replacement: 'Vorwürfe' },
  { pattern: /\bDiffamierung\b/g, replacement: 'Vorwurf' },
  { pattern: /\bSkandalisierungsversuch\b/g, replacement: 'Versuch der scharfen Kritik' },
  { pattern: /\bSkandalisierung\b/g, replacement: 'scharfe Kritik' },
  { pattern: /\bskandalisierende\b/gi, replacement: 'scharf kritisierende' },
  { pattern: /\bskandalisierte\b/gi, replacement: 'kritisierte scharf' },
  { pattern: /\bskandalisiert\b/gi, replacement: 'kritisiert scharf' },
  { pattern: /\bskandalisieren\b/gi, replacement: 'scharf kritisieren' },
  { pattern: /\bpolemisierte\b/gi, replacement: 'kritisierte scharf' },
  { pattern: /\bpolemisiere\b/gi, replacement: 'kritisiere scharf' },
  { pattern: /\bpolemisiert\b/gi, replacement: 'kritisiert scharf' },
  { pattern: /\bpolemisieren\b/gi, replacement: 'scharf kritisieren' },
  { pattern: /\bdiffamierende\b/gi, replacement: 'kritisierende' },
  { pattern: /\bdiffamierte\b/gi, replacement: 'kritisierte' },
  { pattern: /\bdiffamiert\b/gi, replacement: 'kritisiert' },
  { pattern: /\bdiffamiere\b/gi, replacement: 'kritisiere' },
  { pattern: /\bdiffamieren\b/gi, replacement: 'kritisieren' },
  { pattern: /\bdenunzierte\b/gi, replacement: 'wirft vor' },
  { pattern: /\bdenunziere\b/gi, replacement: 'werfe vor' },
  { pattern: /\bdenunziert\b/gi, replacement: 'wirft vor' },
  { pattern: /\bdenunzieren\b/gi, replacement: 'als unhaltbar bezeichnen' },
  { pattern: /\bverdammten\b/gi, replacement: 'scharf kritisierten' },
  { pattern: /\bverdammte\b/gi, replacement: 'kritisierte scharf' },
  { pattern: /\bverdamme\b/gi, replacement: 'kritisiere scharf' },
  { pattern: /\bverdammt\b/gi, replacement: 'kritisiert scharf' },
  { pattern: /\bverdammen\b/gi, replacement: 'scharf kritisieren' },
  { pattern: /\bVerdammung\b/g, replacement: 'scharfe Kritik' },
  { pattern: /\bfabuliere\b/gi, replacement: 'behaupte' },
  { pattern: /\bfabuliert\b/gi, replacement: 'behauptet' },
];

// Manuelle Overrides für Reden wo Grammatik bricht oder kontext-spezifische Korrektur nötig.
// Key: `${rede_id}_${segment_index}` → fertige Summary (überschreibt mechanisches Mapping)
const MANUAL_OVERRIDES: Record<string, string> = {
  // Baumann Sitzung 15 — Verb-Replace-Bruch ("menschenfeindlich wirft vor")
  'ID211500200_0': 'Dr. Bernd Baumann (AfD) attackiert den Innenminister während der Debatte zum Familiennachzugs-Gesetz: Er wirft der Merkel-Regierung und dem Minister persönlich vor, die „weltgeschichtlich einmalige Situation" der Millionenwanderung herbeigeführt zu haben, während der Minister diese Konsequenzen jetzt beklagt. Hauptvorwurf ist die Inkonsistenz: Die CDU/CSU habe jahrelang AfD-Migrationsargumente als „ausländerfeindlich" und „menschenfeindlich" bezeichnet und eine „Brandmauer" errichtet, übernehme diese Argumente nun aber faktisch — Baumann fordert ein explizites Eingeständnis, dass die AfD-Kritik „richtig" und „höchst bürgerlich, höchst vernünftig" war.',

  // Drößler — denunziert ("denunziert das mit dem Satz" → kontextuell anders)
  'ID211802000_0': 'Christopher Drößler (AfD) rahmt die Migrationspolitik als existenzielle Sicherheitsfrage und fordert die Beendigung der Masseneinwanderung, Ausweisung aller ausreisepflichtigen Ausländer und „Remigration" als zentrale Ziele; konkret verlangt er die Befähigung der Bundespolizei zur „Abschiebepolizei" mit rechtlicher und materieller Ausstattung zur Grenzsicherung. Er wirft der CDU/Union-geführten Regierung vor, beim Grenzschutz (Polish-deutsche Grenze: nur Stichproben statt rigoroser Abweisung) halbherzig zu agieren, und kommentiert das mit dem Satz „heiße Luft"; seinen Schlusssatz prägt ein Wahlaufruf: „dafür sind wir als Alternative für Deutschland da".',

  // Bohnhof — "um zu polemisieren" → infinitiv-Wortstellung
  'ID213206900_0': "Peter Bohnhof (AfD) nutzt die Anekdote einer Fabrik-Schließung im Ruhrgebiet, um gegen die 'sozialökologische Transformation' und Die Linke scharf zu kritisieren: er charakterisiert Letztere als SED-Nachfolgepartei, die 'linke Planwirtschaft' mit 'Tarifzwang statt Freiheit' und 'sozialistischer Umverteilung' betreiben würde, und kritisiert Grüne Energiepolitik als 'irren staatlichen Eingriff', der energieintensive Branchen nach Asien treibe. Seine sechs Forderungen — Ausstieg aus dem Pariser Klimaabkommen, CO2-Steuer-Abschaffung, Rückkehr zu Kernkraft/Kohle/Gas, Deregulierung, Steuersenkung und Technologieoffenheit — sollen 'Arbeitsplätze, Wettbewerbsfähigkeit und Freiheit' sichern; der Schluss ist ein direkter Wahlaufruf.",

  // Helferich — "die Heuchelei... zu skandalisieren" → infinitiv
  'ID214705600_0': "Matthias Helferich (AfD) greift Kulturstaatsminister Weimer frontal an und fordert seinen Rücktritt wegen Vertrauenserosion in der Demokratie: Weimer würdige Verlage, die Gewalt und Linksextremismus verlegten, betreibe ein korruptes Geschäftsmodell (Ludwig-Erhard-Gipfel mit Weimer Media Group), und plündere das Urheberrecht (Plagiatsfälle gegen Dr. Stefan Weber, 7.000+ Euro ausstehend). Helferich nutzt historische Parallelen (Rom, 'Seelenraub') und konkrete Opfer-Details, um die Inkonsistenz des Kulturstaatsministers scharf zu kritisieren; der Schlusssatz impliziert eine Forderung nach Kanzler-Entlassung.",
};

function stripTagLeak(s: string): string {
  if (!s) return s;
  // Schneide ab erstem schließenden Tag oder neuem parameter-Block
  const cutPatterns = [
    /<\/zusammenfassung_2_saetze>.*$/s,
    /<parameter\s+name=.*$/s,
    /<\/invoke>.*$/s,
    /<\/answer>.*$/s,
  ];
  for (const p of cutPatterns) s = s.replace(p, '').trim();
  return s;
}

function applyMappings(s: string): string {
  let r = s;
  for (const m of MAPPINGS) r = r.replace(m.pattern, m.replacement);
  return r;
}

interface FinalFix {
  rede_id: string;
  segment_index: number;
  speaker: string;
  party: string;
  sitzung: number;
  v21_summary_clean: string; // nur Tag-Strip
  final_summary: string;     // Mapping + ggf. manueller Override
  source: 'mapping' | 'manual_override';
  matched_words_v21: string[];
}

function main() {
  const data = fs.readFileSync('bias-fix-51.jsonl', 'utf-8').split('\n').filter(Boolean).map(l => JSON.parse(l));

  const fixes: FinalFix[] = [];
  for (const r of data) {
    const cleaned = stripTagLeak(r.v21_summary);
    const key = `${r.rede_id}_${r.segment_index}`;
    let final: string;
    let source: 'mapping' | 'manual_override';

    if (MANUAL_OVERRIDES[key]) {
      final = MANUAL_OVERRIDES[key];
      source = 'manual_override';
    } else {
      final = applyMappings(cleaned);
      source = 'mapping';
    }

    fixes.push({
      rede_id: r.rede_id,
      segment_index: r.segment_index,
      speaker: r.speaker,
      party: r.party,
      sitzung: r.sitzung,
      v21_summary_clean: cleaned,
      final_summary: final,
      source,
      matched_words_v21: r.matched_words_v21,
    });
  }

  fs.writeFileSync('bias-fixes-final.jsonl', fixes.map(f => JSON.stringify(f)).join('\n') + '\n');

  // Markdown für Sichtprüfung
  const md: string[] = [];
  md.push(`# Bias-Fixes Final — ${new Date().toISOString().slice(0, 10)}`);
  md.push('');
  md.push(`**${fixes.length} Reden** mit finaler Korrektur.`);
  md.push(`Manuelle Overrides: ${fixes.filter(f => f.source === 'manual_override').length}`);
  md.push(`Mechanische Mappings: ${fixes.filter(f => f.source === 'mapping').length}`);
  md.push('');
  fixes.sort((a, b) => a.sitzung - b.sitzung);
  for (let i = 0; i < fixes.length; i++) {
    const f = fixes[i];
    md.push(`---`);
    md.push('');
    md.push(`## ${i + 1}. ${f.speaker} (${f.party}) — Sitzung ${f.sitzung}`);
    md.push(`Source: \`${f.source}\` | Wörter: ${f.matched_words_v21.join(', ')}`);
    md.push('');
    md.push(`**Final:**`);
    md.push(`> ${f.final_summary.replace(/\n/g, ' ')}`);
    md.push('');
  }
  fs.writeFileSync('bias-fixes-final.md', md.join('\n'));

  console.log(`✓ ${fixes.length} finale Fixes`);
  console.log(`  Mechanisch: ${fixes.filter(f => f.source === 'mapping').length}`);
  console.log(`  Manueller Override: ${fixes.filter(f => f.source === 'manual_override').length}`);
}

main();
