/**
 * Wikidata-Integration für Politiker-Profile.
 *
 * Zentralisiert:
 *  - QID-Auflösung über Wikipedia-Page-Title
 *  - Erweiterten Politiker-Datensatz aus Wikidata (Partei aktuell-gültig,
 *    Geburtsjahr/-ort, Wohnort, Beruf, Bildung, Foto, Social Handles, Homepage)
 *  - Mapping Wikidata-Label → kanonisches Partei-Kürzel (CDU, SPD, …)
 *
 * Genutzt von:
 *  - scripts/seed-missing-politicians.ts (Insert)
 *  - scripts/refresh-missing-politician-data.ts (Update)
 */

const UA = "politik-radar/1.0 (https://github.com/opoi1/politik)";

/**
 * Wikidata-Labels deutscher Parteien → in der `parties`-Tabelle existierende Kurzform.
 * Labels sind in Wikidata stabil; QIDs zwischen ähnlichen Parteien
 * zu verwechseln war früher schmerzhaft.
 */
export const PARTY_LABEL_TO_CANONICAL: Record<string, string> = {
  "Christlich Demokratische Union": "CDU",
  "Christlich Demokratische Union Deutschlands": "CDU",
  "Christlich-Soziale Union in Bayern": "CSU",
  "Sozialdemokratische Partei Deutschlands": "SPD",
  "Bündnis 90/Die Grünen": "BÜNDNIS 90/­DIE GRÜNEN",
  "Bündnis 90/DIE GRÜNEN": "BÜNDNIS 90/­DIE GRÜNEN",
  "Bundnis 90/Die Grunen": "BÜNDNIS 90/­DIE GRÜNEN",
  "Alternative für Deutschland": "AfD",
  "Freie Demokratische Partei": "FDP",
  "Die Linke": "Die Linke",
  "Bündnis Sahra Wagenknecht": "BSW",
  "Bündnis Sahra Wagenknecht – Vernunft und Gerechtigkeit": "BSW",
  "Volt Deutschland": "Volt",
  "Volt Europa": "Volt",
  "Parteiloser": "parteilos",
  "Parteilose": "parteilos",
  "parteilos": "parteilos",
};

export function canonicalParty(label: string | null | undefined): string | null {
  if (!label) return null;
  return PARTY_LABEL_TO_CANONICAL[label] ?? label;
}

export interface WikidataPoliticianData {
  qid: string;
  partyQid: string | null;
  partyLabel: string | null;
  partyCanonical: string | null;
  birthYear: number | null;
  birthPlace: string | null;
  residence: string | null;
  occupation: string[];
  education: string[];
  photoFile: string | null;
  twitter: string | null;
  instagram: string | null;
  homepage: string | null;
}

async function getLabel(qid: string): Promise<string | null> {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const e = data.entities?.[qid];
  return e?.labels?.de?.value ?? e?.labels?.en?.value ?? null;
}

/**
 * Findet die Wikidata-QID zu einem Wikipedia-Artikel.
 */
export async function getQidFromWikipediaTitle(pageTitle: string): Promise<string | null> {
  const url = `https://de.wikipedia.org/w/api.php?action=query&prop=pageprops&titles=${encodeURIComponent(pageTitle.replace(/ /g, "_"))}&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const pages = data?.query?.pages ?? {};
  const first = Object.values(pages)[0] as any;
  return first?.pageprops?.wikibase_item ?? null;
}

export interface WikipediaSummary {
  extract: string;
  revid: number;
  url: string;
}

export async function getWikipediaSummary(title: string): Promise<WikipediaSummary | null> {
  const url = `https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  return {
    extract: data.extract ?? "",
    revid: data.revision ? parseInt(data.revision, 10) : 0,
    url: data.content_urls?.desktop?.page ?? `https://de.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`,
  };
}

export async function searchWikipedia(query: string): Promise<{ title: string; pageId: number } | null> {
  const url = `https://de.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const data = (await res.json()) as any;
  const hit = data?.query?.search?.[0];
  if (!hit) return null;
  return { title: hit.title, pageId: hit.pageid };
}

/**
 * Lädt den vollen Politiker-Datensatz aus Wikidata.
 * Wählt die AKTUELL gültige Parteimitgliedschaft (kein P582 end-time;
 * bei mehreren aktiven die mit jüngstem P580 start-time).
 */
export async function getWikidataPolitician(qid: string): Promise<WikidataPoliticianData> {
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const out: WikidataPoliticianData = {
    qid, partyQid: null, partyLabel: null, partyCanonical: null,
    birthYear: null, birthPlace: null, residence: null,
    occupation: [], education: [],
    photoFile: null, twitter: null, instagram: null, homepage: null,
  };
  if (!res.ok) return out;
  const data = (await res.json()) as any;
  const claims = data.entities?.[qid]?.claims ?? {};

  // Partei (P102): aktuell gültige nehmen
  const partyClaims = (claims.P102 ?? []) as any[];
  if (partyClaims.length > 0) {
    const active = partyClaims.filter((c) => !c.qualifiers?.P582);
    let chosen: any | null = null;
    if (active.length === 1) {
      chosen = active[0];
    } else if (active.length > 1) {
      const withStart = active
        .map((c) => ({
          c,
          start: c.qualifiers?.P580?.[0]?.datavalue?.value?.time as string | undefined,
        }))
        .filter((x) => x.start);
      if (withStart.length > 0) {
        withStart.sort((a, b) => (a.start! < b.start! ? 1 : -1));
        chosen = withStart[0].c;
      } else {
        chosen = active[0];
      }
    } else {
      chosen = partyClaims[partyClaims.length - 1];
    }
    out.partyQid = chosen?.mainsnak?.datavalue?.value?.id ?? null;
  }
  if (out.partyQid) out.partyLabel = await getLabel(out.partyQid);
  out.partyCanonical = canonicalParty(out.partyLabel);

  // Geburtsdatum (P569)
  const birth = claims.P569?.[0]?.mainsnak?.datavalue?.value?.time;
  if (birth) {
    const m = birth.match(/^[+-]?(\d{4})/);
    if (m) out.birthYear = parseInt(m[1], 10);
  }

  // Geburtsort (P19)
  const bp = claims.P19?.[0]?.mainsnak?.datavalue?.value?.id;
  if (bp) out.birthPlace = await getLabel(bp);

  // Wohnort (P551)
  const res2 = claims.P551?.[0]?.mainsnak?.datavalue?.value?.id;
  if (res2) out.residence = await getLabel(res2);

  // Beruf (P106) — bis zu 3
  for (const c of (claims.P106 ?? []).slice(0, 3)) {
    const q = c?.mainsnak?.datavalue?.value?.id;
    if (q) {
      const l = await getLabel(q);
      if (l) out.occupation.push(l);
    }
  }

  // Bildung (P69) — bis zu 3
  for (const c of (claims.P69 ?? []).slice(0, 3)) {
    const q = c?.mainsnak?.datavalue?.value?.id;
    if (q) {
      const l = await getLabel(q);
      if (l) out.education.push(l);
    }
  }

  // Foto, Social, Website
  out.photoFile = claims.P18?.[0]?.mainsnak?.datavalue?.value ?? null;
  out.twitter = claims.P2002?.[0]?.mainsnak?.datavalue?.value ?? null;
  out.instagram = claims.P2003?.[0]?.mainsnak?.datavalue?.value ?? null;
  out.homepage = claims.P856?.[0]?.mainsnak?.datavalue?.value ?? null;

  return out;
}

export function commonsImageUrl(filename: string, width = 512): string {
  const sanitized = filename.replace(/ /g, "_");
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(sanitized)}?width=${width}`;
}
