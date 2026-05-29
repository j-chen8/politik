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

export default async function PolitikerListPage({
  searchParams,
}: {
  searchParams: Promise<{ parlament?: string }>;
}) {
  // ?parlament=2 → Berlin-Abgeordnete (sonst Default-Liste = Bundestag).
  const { parlament } = await searchParams;
  const parliamentId = parlament ? parseInt(parlament, 10) || undefined : undefined;
  const { rows } = listPoliticians({ limit: 2000, offset: 0, parliamentId });

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
