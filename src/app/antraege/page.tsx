import { DrucksacheListView } from "@/components/DrucksacheListView";
import { FileText } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; seite?: string }>;
}

// Fokussierte Seite: die Antrags-Familie (Antrag + Entschließungs- + Änderungsantrag).
// Forderungen einer Fraktion an den Bundestag — kein Recht, aber politisch bindend.
export default async function AntraegePage({ searchParams }: Props) {
  const { q, seite } = await searchParams;
  const page = Math.max(1, parseInt(seite || "1", 10));

  return (
    <DrucksacheListView
      title="Anträge"
      countLabel="Anträge"
      dokumenttyp={["Antrag", "Entschließungsantrag", "Änderungsantrag"]}
      icon={FileText}
      query={q}
      page={page}
      basePath="/antraege"
      intro={
        <>
          Was eine Fraktion vom Bundestag fordert oder feststellen lassen will — kein Gesetz, aber
          bei Annahme politisch bindend. Oft das Hauptinstrument der Opposition.
        </>
      }
    />
  );
}
