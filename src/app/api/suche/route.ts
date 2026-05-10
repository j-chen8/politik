import { NextRequest } from "next/server";
import { search } from "@/lib/suche";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const results = search(q);
  return Response.json(results);
}
