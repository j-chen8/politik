import { TagInfoPopover } from "@/components/TagInfoPopover";
import { TONALITAET_DEF_MAP, REDEN_TYP_DEF_MAP } from "@/lib/glossar";
import { TONALITY_COLORS } from "@/lib/tonality-colors";
import {
  DRUCKSACHEN_TONALITAET_DEF_MAP,
  DRUCKSACHEN_TONALITAET_COLORS,
} from "@/lib/glossar-drucksachen";

interface TonalityBadgeProps {
  slug: string | null | undefined;
}

/**
 * Render-Helper für Reden-Tonalitäts-Badge mit Klick-Popover.
 * Bei unbekanntem Slug (z. B. Drift-Wert) wird ein neutraler Pill ohne
 * Popover gerendert — transparent statt geraten.
 */
export function TonalityBadge({ slug }: TonalityBadgeProps) {
  if (!slug) return null;
  const def = TONALITAET_DEF_MAP[slug];
  const colors = TONALITY_COLORS[slug];
  if (!def || !colors) {
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-600 bg-zinc-100">
        {slug}
      </span>
    );
  }
  return (
    <TagInfoPopover
      label={def.label}
      definition={def.long}
      notMeaning={def.notMeaning}
      color={colors.color}
      bg={colors.bg}
      glossarAnchor={`/design/linear/methodik#glossar-tonalitaet-${slug.replace(/_/g, "-")}`}
      variant="tonalitaet"
    />
  );
}

interface RedenTypBadgeProps {
  /** „A", „B" oder Composite wie „A+B". Andere Eingaben werden roh gerendert. */
  code: string | null | undefined;
}

/**
 * Render-Helper für Reden-Typ-Badge (A–K) mit Klick-Popover.
 * Composite-Typen (z. B. „A+B") konkatenieren ihre Definitionen und
 * verlinken auf den Glossar-Anchor des erstgenannten Codes.
 */
export function RedenTypBadge({ code }: RedenTypBadgeProps) {
  if (!code) return null;
  const codes = code.split("+").map((c) => c.trim()).filter(Boolean);
  const primary = codes[0];
  const primaryDef = primary ? REDEN_TYP_DEF_MAP[primary] : undefined;
  const label = codes
    .map((c) => REDEN_TYP_DEF_MAP[c]?.label ?? c)
    .join(" + ");
  const definition = codes.length === 1
    ? (primaryDef?.long ?? `Reden-Typ ${primary}`)
    : codes
        .map((c) => {
          const d = REDEN_TYP_DEF_MAP[c];
          return d ? `Typ ${c}: ${d.long}` : `Typ ${c}`;
        })
        .join("\n\n");
  return (
    <TagInfoPopover
      label={label}
      definition={definition}
      color="#52525b"
      bg="#f4f4f5"
      glossarAnchor={primary ? `/design/linear/methodik#glossar-redentyp-${primary}` : undefined}
      variant="redentyp"
    />
  );
}

interface DrucksacheTonalityBadgeProps {
  slug: string | null | undefined;
}

/**
 * Render-Helper für Drucksachen-Tonalitäts-Badge (8 Werte, klassen-spezifisch).
 * Anti-Definitionen aus docs/drucksachen-tonalitaet-methodik.md.
 */
export function DrucksacheTonalityBadge({ slug }: DrucksacheTonalityBadgeProps) {
  if (!slug) return null;
  const def = DRUCKSACHEN_TONALITAET_DEF_MAP[slug];
  const colors = DRUCKSACHEN_TONALITAET_COLORS[slug];
  if (!def || !colors) {
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-600 bg-zinc-100">
        {slug}
      </span>
    );
  }
  return (
    <TagInfoPopover
      label={def.label}
      definition={def.long}
      notMeaning={def.notMeaning}
      color={colors.color}
      bg={colors.bg}
      glossarAnchor="/design/linear/methodik#tonalitaet-drucksachen"
      variant="tonalitaet"
    />
  );
}
