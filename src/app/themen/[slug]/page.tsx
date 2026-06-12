import { redirect } from "next/navigation";

// Alt-Route der aw_field-Themenseiten (Rollup-Bug) → Themen-Übersicht (= Startseite).
// Die alten Feld-Slugs sind nicht 1:1 auf die neuen Unterthemen abbildbar.
export default async function ThemaAltRedirect() {
  redirect("/");
}
