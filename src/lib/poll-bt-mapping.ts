/**
 * Mapping abgeordnetenwatch poll_id → bundestag.de bundestag_id
 * (audit_bundestag_polls.bundestag_id).
 *
 * Single Source of Truth — genutzt von:
 *  - scripts/apply-vote-bundestag-audit.ts  (poll↔Drucksache-Verknüpfung)
 *  - scripts/generate-vote-context.ts       (Vote-Kontext-Zusammenfassung)
 *
 * Zwei Methodiken (Hybrid, Entscheidung 2026-05-19):
 *  - bt_id ≤ 1020: manuell gegen bundestag.de-Abstimmungsseite verifiziert
 *    (Block-Modell). Datums-Kommentare = abstimmung_date der bundestag.de-Seite.
 *  - bt_id == poll_id (≥ 6000): DIP-prozedural gemappt (Scraper tot, SPA).
 *    Surrogat-ID = poll_id; audit_bundestag_polls[poll_id] befüllt von
 *    scripts/map-vote-drucksache-dip.ts (DIP-Vorgang: Antrag+Beschlussempf.).
 */
export const POLL_TO_BT_ID: Record<number, number> = {
  // 2026-06-12 (aw-Seed nach Sitzungen 81–83; bt_id == poll_id ≥ 6000-Konvention)
  6540: 6540, 6541: 6541, 6551: 6551, 6552: 6552,
  // 2026-05-22 (Filterlist-Apply 2026-05-25: 2 Subjekt-DS, eine davon
  // im laufenden Drucksachen-Batch)
  6528: 6528,
  // 2026-05-08 (Filterlist-Apply 2026-05-20: bundestag_id=6511 hat
  // jetzt den präzisen Roll-Call-Eintrag mit 2 Subjekt-DS)
  6511: 6511,
  // 2026-04-24
  6495: 999, 6496: 1002, 6497: 1001, 6498: 1000,
  // 2026-03-26
  6451: 997, 6455: 998,
  // 2026-03-25
  6452: 996,
  // 2026-03-05
  6422: 995,
  // 2026-02-27
  6419: 994,
  // 2026-01-29
  6388: 992, 6391: 993,
  // 2025-12-19
  6372: 990, 6373: 991,
  // 2025-12-18
  6371: 989,
  // 2025-12-05
  6356: 985, 6357: 986, 6359: 984, 6360: 987, 6361: 988,
  // 2025-12-04
  6354: 982, 6355: 983,
  // 2025-12-03
  6353: 981,
  // 2025-11-28
  6351: 980,
  // 2025-11-26
  6346: 979,
  // 2025-11-13
  6318: 975, 6319: 974, 6323: 973, 6324: 976, 6326: 970, 6327: 971, 6329: 977, 6330: 978,
  // 2025-11-06
  6278: 968, 6311: 966, 6315: 969, 6316: 967,
  // 2025-10-16
  6284: 963, 6285: 965, 6286: 964,
  // 2025-10-08
  6280: 962,
  // 2025-09-18
  6251: 961,
  // 2025-09-17
  6250: 960,
  // 2025-09-11
  6249: 959,
  // 2025-07-10
  6170: 958,
  // 2025-06-27
  6155: 957,
  // 2025-06-26
  6146: 955, 6148: 954, 6151: 956,
  // 2025-06-25
  6147: 953, 6165: 952,
};
