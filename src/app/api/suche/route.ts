import { NextRequest } from "next/server";
import { search, searchByType, type SearchType } from "@/lib/suche";

const VALID_TYPES: SearchType[] = ["politicians", "speeches", "topics", "votes", "drucksachen", "qa"];

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  // Synonym-Erweiterung ist opt-in: nur wenn &expand=1 gesetzt ist, sonst exakte Suche.
  const expand = sp.get("expand") === "1";
  const typeParam = sp.get("type");

  // Typ-gefilterte Vollliste / Inline-Mehr / Detail-Suche → searchByType, sonst Multi-Typ-Suche.
  if (typeParam && (VALID_TYPES as string[]).includes(typeParam)) {
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const pageSize = Math.max(1, Math.min(200, parseInt(sp.get("pageSize") ?? "50", 10) || 50));
    const sort = sp.get("sort") === "relevance" ? "relevance" : "date";
    const klasse = sp.get("klasse"); // Drucksachen-Typ-Filter (z.B. gross/klein), sonst null
    return Response.json(searchByType(q, typeParam as SearchType, page, pageSize, expand, sort, klasse));
  }

  return Response.json(search(q, expand));
}
