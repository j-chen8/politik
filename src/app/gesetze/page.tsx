import { DrucksacheListView } from "@/components/DrucksacheListView";
import { Scale } from "lucide-react";

interface Props {
  searchParams: Promise<{ q?: string; seite?: string }>;
}

// Fokussierte Seite: alle Gesetzentwürfe aus der autoritativen Quelle
// (drucksache_analyses + dip_ds_titles) — inkl. Regierungs-/Bundesrats-Entwürfe,
// die der activities-getriebenen Liste fehlen.
export default async function GesetzePage({ searchParams }: Props) {
  const { q, seite } = await searchParams;
  const page = Math.max(1, parseInt(seite || "1", 10));

  return (
    <DrucksacheListView
      title="Gesetzentwürfe"
      countLabel="Gesetzentwürfe"
      dokumenttyp="Gesetzentwurf"
      icon={Scale}
      query={q}
      page={page}
      basePath="/gesetze"
    />
  );
}
