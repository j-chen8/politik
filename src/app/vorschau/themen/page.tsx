import { redirect } from "next/navigation";

// Die Vorschau ist erwachsen geworden: Themensystem = Startseite (2026-06-13).
// Geteilte Vorschau-Links (auch mit ?feld=&unter=) laufen weiter.
export default async function VorschauThemenRedirect({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const p = new URLSearchParams(await searchParams).toString();
  redirect(p ? `/?${p}` : "/");
}
