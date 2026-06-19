import { getFrageFeed, getFrageFeedFelder } from "@/lib/db";
import { slugToFeld, feldKurz } from "@/lib/themenfeld-slug";
import { FrageDeck } from "@/components/FrageDeck";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Durchklicken — echte Bürgerfragen | Politik-Radar",
  description:
    "Wisch dich durch echte Fragen von Bürgerinnen und Bürgern an Abgeordnete — Frage, dann die Antwort auf einen Blick.",
};

type Props = { searchParams: Promise<{ feld?: string }> };

export default async function DurchklickenPage({ searchParams }: Props) {
  const { feld: feldSlugRaw } = await searchParams;
  const feld = feldSlugRaw ? slugToFeld(feldSlugRaw) : null;
  // Slug nur behalten, wenn er auf ein echtes Feld auflöst (sonst „Alles").
  const feldSlug = feld ? feldSlugRaw! : null;

  // Frischer Seed pro Aufruf → jede Sitzung sieht eine andere Reihenfolge
  // (variable reward), aber innerhalb der Sitzung stabil über die Seiten.
  const seed = Math.floor(Math.random() * 1_000_000_000);

  const initialCards = getFrageFeed({ seed, page: 0, feld });
  const felder = getFrageFeedFelder().map((f) => ({
    feld: f.feld,
    kurz: feldKurz(f.feld),
    count: f.count,
  }));

  return (
    <FrageDeck
      initialCards={initialCards}
      seed={seed}
      feldSlug={feldSlug}
      felder={felder}
    />
  );
}
