import { redirect } from "next/navigation";

// Das Themensystem IST seit 2026-06-13 die Startseite — die alte /themen-Seite
// (aw_field-Rollup, dokumentierter 3×-Überzähl-Bug) ist ersetzt. Params bleiben.
export default async function ThemenRedirect({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const p = new URLSearchParams(await searchParams).toString();
  redirect(p ? `/?${p}` : "/");
}
