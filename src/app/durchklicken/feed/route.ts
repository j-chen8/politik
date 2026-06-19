import { NextRequest } from "next/server";
import { getFrageFeed } from "@/lib/db";
import { slugToFeld } from "@/lib/themenfeld-slug";

export const dynamic = "force-dynamic";

/**
 * Nachlade-Endpunkt für den Bürgerfragen-Feed („Durchklicken").
 * ?seed=<int>  hält die Reihenfolge über die Session stabil
 * &page=<n>    0-basierte Seite
 * &feld=<slug> optionaler Themenfeld-Filter (Slug aus themenfeld-slug.ts)
 */
export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const seed = parseInt(sp.get("seed") ?? "0", 10) || 0;
  const page = Math.max(0, parseInt(sp.get("page") ?? "0", 10) || 0);
  const feldSlug = sp.get("feld");
  const feld = feldSlug ? slugToFeld(feldSlug) : null;
  const cards = getFrageFeed({ seed, page, feld });
  return Response.json({ cards });
}
