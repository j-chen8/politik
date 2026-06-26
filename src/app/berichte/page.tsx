import { DrucksacheListView } from "@/components/DrucksacheListView";
import { ClipboardList } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; seite?: string }>;
}

// Gebündelte Seite: Berichte + Unterrichtungen — womit die Regierung (oder EU/
// andere Stellen) den Bundestag informiert. Keine Entscheidung, reine Information.
export default async function BerichtePage({ searchParams }: Props) {
  const { q, seite } = await searchParams;
  const page = Math.max(1, parseInt(seite || "1", 10));

  return (
    <DrucksacheListView
      title="Berichte & Unterrichtungen"
      countLabel="Berichte & Unterrichtungen"
      dokumenttyp={["Unterrichtung", "Bericht"]}
      nurEigenstaendig
      icon={ClipboardList}
      query={q}
      page={page}
      basePath="/berichte"
      intro={
        <>
          Womit die Bundesregierung (oder EU und andere Stellen) den Bundestag informiert. Das
          Parlament wird unterrichtet, nicht zur Entscheidung aufgefordert. Ausschuss-Berichte zu
          einem Gesetz oder Antrag stehen bei diesem — nicht hier.
        </>
      }
    />
  );
}
