const DIP_API_KEY = process.env.DIP_API_KEY ?? "";
if (!DIP_API_KEY) {
  throw new Error("DIP_API_KEY missing — set in .env (Bundestag DIP-API)");
}
const SEARCH_BASE = "https://search.dip.bundestag.de/search-api/v1/default/search";

export interface DipActivity {
  id: string;
  aktivitaetsart: string;
  typ: string;
  wahlperiode: number;
  titel: string; // Politician name, e.g. "Uwe Schulz, MdB, AfD"
  datum: string;
  basisdatum: string;
  dokumentart?: string;
  vorgangstyp?: string;
  vorgangsbezug?: {
    vorgangsposition: string;
    vorgangstyp: string;
    titel: string;
    id: string;
  }[];
  fundstelle?: {
    pdf_url?: string;
    id: string;
    dokumentnummer: string;
    datum: string;
    dokumentart: string;
    drucksachetyp?: string;
    herausgeber: string;
    urheber: string[];
    seite?: string;
    anfangsseite?: number;
    endseite?: number;
  };
  deskriptor?: {
    name: string;
    typ: string;
  }[];
}

export interface DipSearchResponse {
  numFound: number;
  documents: DipActivity[];
  request: {
    start: number;
    rows: number;
  };
  facets?: {
    metatyp?: {
      buckets: { val: string; count: number }[];
    };
  };
}

export type DipMetatyp =
  | "Gesetze"
  | "Anträge, Entschließungen"
  | "Fragen an die Bundesregierung"
  | "Reden, Wortmeldungen im Plenum";

export interface DipSearchParams {
  wahlperiode?: number;
  metatyp?: DipMetatyp;
  term?: string;
  rows?: number;
  start?: number;
  sort?: string;
}

export async function searchDipActivities(params: DipSearchParams): Promise<DipSearchResponse> {
  const url = new URL(SEARCH_BASE);
  url.searchParams.set("apikey", DIP_API_KEY);
  url.searchParams.set("f.typ", "Aktivität");
  url.searchParams.set("f.wahlperiode", String(params.wahlperiode ?? 21));
  url.searchParams.set("rows", String(params.rows ?? 25));
  url.searchParams.set("start", String(params.start ?? 0));
  url.searchParams.set("sort", params.sort ?? "basisdatum_ab");

  if (params.metatyp) {
    url.searchParams.set("f.metatyp", params.metatyp);
  }
  if (params.term) {
    url.searchParams.set("term", params.term);
  }

  const res = await fetch(url.toString(), {
    next: { revalidate: 300 },
    headers: {
      "Origin": "https://dip.bundestag.de",
      "Referer": "https://dip.bundestag.de/",
    },
  });
  if (!res.ok) {
    throw new Error(`DIP API error: ${res.status}`);
  }
  return res.json();
}

// Parse politician info from activity title like "Uwe Schulz, MdB, AfD"
export function parsePoliticianFromTitle(title: string): {
  name: string;
  role: string;
  party: string;
} {
  const parts = title.split(", ");
  return {
    name: parts[0] || title,
    role: parts[1] || "",
    party: parts[parts.length - 1] || "",
  };
}
