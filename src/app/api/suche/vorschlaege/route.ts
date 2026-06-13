import { NextRequest, NextResponse } from "next/server";
import { filterVorschlaege } from "@/lib/such-vorschlaege";

// Wortfüll-Vorschläge fürs Landing-Suchfeld: serverseitig gefiltert, weil das
// Tag-Vokabular (~12k) zu groß zum Inline-Ausliefern ist. Liste ist im Modul
// gecacht — pro Request nur das Ranking über ~13k Strings (<1 ms).
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(filterVorschlaege(q));
}
