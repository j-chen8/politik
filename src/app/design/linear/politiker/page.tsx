import { listPoliticians } from "@/lib/db";
import { PolitikerExplorer, type ExplorerPolitician } from "@/components/PolitikerExplorer";

/** Wahlkreis säubern: Nummer-Präfix ("92 - ") und "(Bundestag …)"-Suffix entfernen. */
function cleanConstituency(c: string | null): string | null {
  if (!c) return null;
  const cleaned = c
    .replace(/\s*\(Bundestag[^)]*\)\s*$/i, "")
    .replace(/^\d+\s*[-–]\s*/, "")
    .trim();
  return cleaned || null;
}

export default function PolitikerListPage() {
  const { rows } = listPoliticians({ limit: 2000, offset: 0 });

  const politicians: ExplorerPolitician[] = rows.map((p) => ({
    id: p.id,
    firstName: p.first_name,
    lastName: p.last_name,
    title: p.title,
    party: p.party_label,
    photoUrl: p.photo_url,
    constituency: cleanConstituency(p.constituency),
  }));

  return <PolitikerExplorer politicians={politicians} />;
}
