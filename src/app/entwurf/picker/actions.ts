"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";

const COOKIE = "aufmacher_pick_auth";

async function istBerechtigt(): Promise<boolean> {
  const secret = process.env.AUFMACHER_PICK_SECRET;
  if (!secret) return false; // fail-closed: ohne gesetztes Secret kein Schreibzugriff
  const c = await cookies();
  return c.get(COOKIE)?.value === secret;
}

/** Entsperrt die Picker-Seite — Secret landet NUR im httpOnly-Cookie, nie im DOM. */
export async function unlockAction(formData: FormData): Promise<void> {
  const secret = process.env.AUFMACHER_PICK_SECRET;
  const eingabe = String(formData.get("secret") ?? "");
  if (secret && eingabe === secret) {
    const c = await cookies();
    c.set(COOKIE, secret, { httpOnly: true, sameSite: "lax", path: "/entwurf/picker", maxAge: 60 * 60 * 8 });
  }
  revalidatePath("/entwurf/picker");
}

export async function pickAction(formData: FormData): Promise<void> {
  if (!(await istBerechtigt())) throw new Error("Nicht berechtigt");
  const f = (k: string) => { const v = formData.get(k); const s = v == null ? "" : String(v).trim(); return s === "" ? null : s; };
  const run_date = f("run_date"), themenfeld = f("themenfeld"), slug = f("slug");
  if (!run_date || !themenfeld || !slug) throw new Error("run_date/themenfeld/slug fehlen");
  const cluster_id = f("cluster_id") ? Number(f("cluster_id")) : null;
  const poll_id = f("poll_id") ? Number(f("poll_id")) : null;

  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`UPDATE aufmacher_pick SET aktiv=0 WHERE aktiv=1`).run();
    db.prepare(`
      INSERT INTO aufmacher_pick (run_date, themenfeld, slug, cluster_id, headline, summary, ds_nr, poll_id, notiz, analyse_url, these_wert, these_text, quellen_json, reaktionen_extra, aktiv)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)
    `).run(run_date, themenfeld, slug, cluster_id, f("headline"), f("summary"), f("ds_nr"), poll_id, f("notiz"), f("analyse_url"), f("these_wert"), f("these_text"), f("quellen_json"),
      // Eingabe: Links durch Zeilenumbruch/Komma getrennt → als JSON-Array speichern
      (() => { const roh = f("reaktionen_extra"); if (!roh) return null; const links = roh.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean); return links.length ? JSON.stringify(links) : null; })());
  });
  tx();
  // Caching-Falle: statisch gecachte Seiten zeigen den neuen Pick sonst NICHT.
  revalidatePath("/entwurf/aufmacher");
  revalidatePath("/");
}
