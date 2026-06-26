import { ActivityListView } from "@/components/ActivityListView";

interface Props {
  searchParams: Promise<{
    typ?: string;
    q?: string;
    seite?: string;
  }>;
}

// Mappt den Typ-Tab auf die führende aktivitaetsart (die Liste filtert auf eine).
const typFilterMap: Record<string, string> = {
  fragen: "Kleine Anfrage",
  reden: "Rede",
  antraege: "Antrag",
  gesetze: "Gesetzentwurf",
};

// Allesicht über alle Aktivitäten (mit Typ-Tabs). Die fokussierten Einzel-
// Seiten (/gesetze, /kleine-anfragen) nutzen dieselbe ActivityListView.
export default async function AktivitaetenPage({ searchParams }: Props) {
  const { typ, q, seite } = await searchParams;
  const page = Math.max(1, parseInt(seite || "1", 10));
  const art = typ ? typFilterMap[typ] : undefined;

  return (
    <ActivityListView
      title="Aktivitäten"
      countLabel={`Aktivitäten${art ? ` · ${art}` : ""}`}
      art={art}
      query={q}
      page={page}
      basePath="/aktivitaeten"
      showFilters
      activeTyp={typ}
      showTypeStats
    />
  );
}
