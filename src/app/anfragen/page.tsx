import { ActivityListView } from "@/components/ActivityListView";

interface Props {
  searchParams: Promise<{ q?: string; seite?: string }>;
}

// Fokussierte Seite: Anfragen der Fraktionen an die Bundesregierung —
// Kleine + Große Anfrage. Die Regierungs-Antwort steht je Eintrag auf der
// Detailseite.
export default async function AnfragenPage({ searchParams }: Props) {
  const { q, seite } = await searchParams;
  const page = Math.max(1, parseInt(seite || "1", 10));

  return (
    <ActivityListView
      title="Anfragen"
      countLabel="Anfragen"
      art={["Kleine Anfrage", "Große Anfrage"]}
      query={q}
      page={page}
      basePath="/anfragen"
      intro={
        <>
          Kontroll-Instrument der Fraktionen: schriftliche Fragen an die Bundesregierung (Kleine
          und Große Anfragen). Die Antwort der Regierung steht jeweils auf der Detailseite der
          Anfrage.
        </>
      }
    />
  );
}
