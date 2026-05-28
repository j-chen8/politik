import { NextRequest } from "next/server";
import { search, searchByType, type SearchType } from "@/lib/suche";

const VALID_TYPES: SearchType[] = ["politicians", "speeches", "topics", "votes", "drucksachen"];

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  // Synonym-Erweiterung ist opt-in: nur wenn &expand=1 gesetzt ist, sonst exakte Suche.
  const expand = sp.get("expand") === "1";
  const typeParam = sp.get("type");

  // Typ-gefilterte Vollliste / Inline-Mehr → searchByType, sonst die Multi-Typ-Suche.
  if (typeParam && (VALID_TYPES as string[]).includes(typeParam)) {
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
    const pageSize = Math.max(1, Math.min(200, parseInt(sp.get("pageSize") ?? "50", 10) || 50));
    return Response.json(searchByType(q, typeParam as SearchType, page, pageSize, expand));
  }

  return Response.json(search(q, expand));
}
