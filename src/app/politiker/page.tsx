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
  searchParams: Promise<{ parlament?: string; partei?: string }>;
}) {
  // ?parlament=2 → Berlin-Abgeordnete (sonst Default-Liste = Bundestag).
  const { parlament, partei } = await searchParams;
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

  // ?partei=spd → Deep-Link von der Startseite: Token (Teilstring) auf den exakten
  // Fraktions-Label auflösen, damit der Explorer-Filter sofort vorausgewählt ist.
  let initialParty: string | null = null;
  if (partei) {
    const tok = partei.toLowerCase().replace(/­/g, "");
    const hit = politicians.find((p) =>
      (p.party ?? "").toLowerCase().replace(/­/g, "").includes(tok),
    );
    initialParty = hit?.party ?? null;
  }

  return <PolitikerExplorer politicians={politicians} initialParty={initialParty} />;
}
