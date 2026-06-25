import Link from "next/link";
import { Mic, Tv, Radio, Youtube } from "lucide-react";
import {
  getMediaAppearanceDetail,
  type MediaAppearanceIndexEntry,
} from "@/lib/media-appearances";
import { getDb } from "@/lib/db";
import { PoliticianAvatar } from "@/components/PoliticianAvatar";

interface PoliticianInfo {
  first_name: string;
  last_name: string;
  party_label: string | null;
  photo_url: string | null;
}

function loadPolitician(id: number): PoliticianInfo | null {
  try {
    const row = getDb()
      .prepare(
        `SELECT po.first_name, po.last_name, po.photo_url, p.label AS party_label
         FROM politicians po
         LEFT JOIN parties p ON p.id = po.party_id
         WHERE po.id = ?`
      )
      .get(id) as PoliticianInfo | undefined;
    return row ?? null;
  } catch {
    return null;
  }
}

export function formatMediaDate(value: string): string {
  const monthOnly = /^(\d{4})-(\d{2})$/.exec(value);
  if (monthOnly) {
    const months = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
    return `${months[Number(monthOnly[2]) - 1]} ${monthOnly[1]}`;
  }
  const full = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (full) return `${full[3]}.${full[2]}.${full[1]}`;
  return value;
}

function partyShort(label: string | null): string {
  if (!label) return "";
  if (label.includes("GRÜNEN")) return "Grüne";
  if (label.includes("Linke")) return "Linke";
  return label;
}

/** Subject + Apposition wegschneiden ("Felix Banaszak, Co-Vorsitzender..., äußerte sich..." → "Äußerte sich...").
 *  WICHTIG: [^,.] (nicht [^,]) — sonst greift die Regex über Satzgrenzen (Punkte) hinweg und frisst
 *  bei deutschen, kommareichen Sätzen (jedes Substantiv groß) den halben Text weg
 *  (z.B. Amthor → "Aber defensiven Ton."). Punkte begrenzen das Subjekt auf den ersten Satz. */
function stripSubject(text: string): string {
  let result = text;
  const withComma = /^([A-ZÄÖÜ][^,.]+,\s+)+(?=[a-zäöü])/.exec(text);
  if (withComma) {
    result = text.slice(withComma[0].length);
  } else {
    const twoNames = /^[A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)+\s+(?=[a-zäöü])/.exec(text);
    if (twoNames) result = text.slice(twoNames[0].length);
  }
  if (result && result[0] !== result[0].toUpperCase()) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

function firstSentences(text: string, maxChars = 220): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  const matchOne = trimmed.slice(80).match(/[.!?]\s/);
  if (matchOne) {
    const end = 80 + matchOne.index! + 1;
    if (end <= maxChars) return trimmed.slice(0, end);
  }
  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxChars - 30 ? cut.slice(0, lastSpace) : cut) + "…";
}

const FORMAT_ICONS = { podcast: Mic, tv: Tv, radio: Radio, youtube: Youtube };

interface Props {
  appearance: MediaAppearanceIndexEntry;
  /** Optional: schon vorgeladenes Politiker-Objekt vermeidet zusätzlichen DB-Hit. */
  politician?: PoliticianInfo | null;
}

export function MediaAppearanceCard({ appearance: a, politician }: Props) {
  const pol = politician !== undefined ? politician : loadPolitician(a.politician_id);
  const detail = getMediaAppearanceDetail(a.id);
  const detailHref = `/politiker/${a.politician_id}/medien/${a.id}`;
  const Icon = FORMAT_ICONS[a.format];
  const polName = pol ? `${pol.first_name} ${pol.last_name}` : a.politician_display;
  const party = partyShort(pol?.party_label ?? null);
  const teaser = detail?.analysis.overall_summary
    ? firstSentences(stripSubject(detail.analysis.overall_summary))
    : null;

  return (
    <Link
      href={detailHref}
      className="group h-full w-full bg-card border border-border rounded-2xl p-5 hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col dark:bg-zinc-900/70 dark:border-zinc-800 dark:hover:border-zinc-700"
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <PoliticianAvatar
          photoUrl={pol?.photo_url ?? null}
          firstName={pol?.first_name ?? a.politician_display}
          lastName={pol?.last_name ?? ""}
          party={pol?.party_label ?? null}
          size="lg"
        />
        <div className="min-w-0">
          <div className="text-[19px] font-semibold text-zinc-950 leading-tight group-hover:text-zinc-700 transition-colors dark:text-zinc-100 dark:group-hover:text-zinc-300">
            {polName}
          </div>
          {party && <div className="text-[13.5px] text-zinc-500 mt-0.5 dark:text-zinc-400">{party}</div>}
        </div>
      </div>

      {teaser && (
        <p className="text-[15px] text-zinc-600 leading-relaxed dark:text-zinc-300">{teaser}</p>
      )}
      <div className="mt-auto flex items-center gap-2 pt-2 text-[12.5px] text-zinc-400 dark:text-zinc-500">
        <span className="num">{formatMediaDate(a.published_at)}</span>
        <span className="ml-auto inline-flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
          <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
          {a.publisher}
        </span>
      </div>
    </Link>
  );
}
