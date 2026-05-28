import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

/** Liefert den vollen Original-Rede-Text einer Berliner Rede on-demand.
 *  Wird vom <BerlinOriginalSpeech>-Client erst beim Aufklappen geladen, damit
 *  der ~58% große originalText-Ballast nicht in jeder Sitzungsseite mitfährt. */
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") ?? "";
  // speech_id-Format: "19-074-r001" — defensiv whitelisten (Query ist ohnehin parametrisiert).
  if (!/^[0-9A-Za-z_-]{1,64}$/.test(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  const row = getDb()
    .prepare("SELECT text FROM berlin_speeches WHERE speech_id = ?")
    .get(id) as { text: string | null } | undefined;
  if (!row) return Response.json({ error: "not found" }, { status: 404 });
  return Response.json({ text: row.text ?? "" });
}
