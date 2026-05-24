import Link from "next/link";
import path from "path";
import fs from "fs";
import { ArrowRight, Mic, Tv } from "lucide-react";
import {
  getMediaAppearanceDetail,
  type MediaAppearanceIndexEntry,
} from "@/lib/media-appearances";
import { getDb } from "@/lib/db";

interface PoliticianInfo {
  first_name: string;
  last_name: string;
  party_label: string | null;
}

function loadPolitician(id: number): PoliticianInfo | null {
  try {
    const row = getDb()
      .prepare(
        `SELECT po.first_name, po.last_name, p.label AS party_label
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

function formatPublishedAt(value: string): string {
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

/** Subject + Apposition wegschneiden ("Felix Banaszak, Co-Vorsitzender..., äußerte sich..." → "Äußerte sich..."). */
function stripSubject(text: string): string {
  let result = text;
  // Pattern: "Name [Apposition,]+ lowercase-verb..."
  const withComma = /^([A-ZÄÖÜ][^,]+,\s+)+(?=[a-zäöü])/.exec(text);
  if (withComma) {
    result = text.slice(withComma[0].length);
  } else {
    // Fallback: zwei großgeschriebene Namen am Anfang gefolgt von lowercase-Verb
    const twoNames = /^[A-ZÄÖÜ][a-zäöüß\-]+(?:\s+[A-ZÄÖÜ][a-zäöüß\-]+)+\s+(?=[a-zäöü])/.exec(text);
    if (twoNames) result = text.slice(twoNames[0].length);
  }
  if (result && result[0] !== result[0].toUpperCase()) {
    result = result[0].toUpperCase() + result.slice(1);
  }
  return result;
}

/** Erste 1–2 Sätze des overall_summary als Teaser. */
function firstSentences(text: string, maxChars = 220): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;
  // Erster Satz-Endpunkt nach min 80 Zeichen
  const matchOne = trimmed.slice(80).match(/[.!?]\s/);
  if (matchOne) {
    const end = 80 + matchOne.index! + 1;
    if (end <= maxChars) return trimmed.slice(0, end);
  }
  // Fallback: bei letztem Leerzeichen vor maxChars abschneiden
  const cut = trimmed.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > maxChars - 30 ? cut.slice(0, lastSpace) : cut) + "…";
}

export function RecentMediaAnalysesStrip() {
  // Index direkt laden (statt via getMediaAppearancesForPolitician — wir wollen ALLE)
  const indexPath = path.join(process.cwd(), "data", "media-appearances.json");
  let appearances: MediaAppearanceIndexEntry[] = [];
  try {
    const idx = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
    appearances = (idx.appearances ?? []).filter((a: MediaAppearanceIndexEntry) => a.analysis_file);
  } catch {
    return null;
  }
  // Sortieren: published_at desc (neueste zuerst), Top 3
  const top = appearances
    .sort((a, b) => b.published_at.localeCompare(a.published_at))
    .slice(0, 3);
  if (top.length === 0) return null;

  return (
    <section className="w-full max-w-5xl mx-auto pt-12 px-5 pb-4">
      <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-zinc-950">
          Aktuelle Interview-Analysen
        </h2>
        <Link
          href="/design/linear/politiker"
          className="text-[12.5px] font-medium text-zinc-500 hover:text-zinc-950 transition-colors inline-flex items-center gap-1"
        >
          Alle Politiker:innen
          <ArrowRight className="w-3 h-3" strokeWidth={2.25} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {top.map((a) => {
          const pol = loadPolitician(a.politician_id);
          const detail = getMediaAppearanceDetail(a.id);
          const detailHref = `/design/linear/politiker/${a.politician_id}/medien/${a.id}`;
          const Icon = a.format === "tv" ? Tv : Mic;
          const polName = pol
            ? `${pol.first_name} ${pol.last_name}`
            : a.politician_display;
          const party = partyShort(pol?.party_label ?? null);
          const teaser = detail?.analysis.overall_summary
            ? firstSentences(stripSubject(detail.analysis.overall_summary))
            : null;
          return (
            <Link
              key={a.id}
              href={detailHref}
              className="group bg-white border border-zinc-200/70 rounded-2xl p-4 hover:border-zinc-300 hover:shadow-sm transition-all flex flex-col"
            >
              {/* Header */}
              <div className="flex items-baseline gap-2 mb-2 flex-wrap">
                <Icon className="w-3.5 h-3.5 text-zinc-500 shrink-0" strokeWidth={2.25} />
                <span className="text-[12px] font-medium text-zinc-700">{a.publisher}</span>
                <span className="text-[11px] text-zinc-400">· {formatPublishedAt(a.published_at)}</span>
              </div>

              {/* Politiker */}
              <div className="mb-2.5">
                <div className="text-[16px] font-semibold text-zinc-950 leading-tight group-hover:text-zinc-700 transition-colors">
                  {polName}
                </div>
                {party && (
                  <div className="text-[11.5px] text-zinc-500 mt-0.5">{party}</div>
                )}
              </div>

              {/* Teaser: erste 1–2 Sätze der Summary */}
              {teaser && (
                <p className="text-[13px] text-zinc-600 leading-relaxed">
                  {teaser}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
