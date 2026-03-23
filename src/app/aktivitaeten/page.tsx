import { listActivities, getActivityTypes } from "@/lib/db";
import { Badge } from "@/components/Badge";
import { ActivityFilters } from "@/components/ActivityFilters";
import {
  FileText,
  MessageSquare,
  Mic,
  Scale,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    typ?: string;
    q?: string;
    seite?: string;
  }>;
}

const ROWS_PER_PAGE = 30;

const artIconMap: Record<string, typeof FileText> = {
  "Kleine Anfrage": MessageSquare,
  "Große Anfrage": MessageSquare,
  Frage: MessageSquare,
  Antwort: MessageSquare,
  Rede: Mic,
  Kurzintervention: Mic,
  Zwischenfrage: Mic,
  Erwiderung: Mic,
  Antrag: FileText,
  Änderungsantrag: FileText,
  Entschließungsantrag: FileText,
  Gesetzentwurf: Scale,
  Berichterstattung: FileText,
};

function getIcon(art: string) {
  for (const [key, Icon] of Object.entries(artIconMap)) {
    if (art.includes(key)) return Icon;
  }
  return FileText;
}

function getPartyVariant(party: string | null): "blue" | "red" | "green" | "yellow" | "gray" {
  if (!party) return "gray";
  if (party.includes("CDU") || party.includes("CSU")) return "blue";
  if (party.includes("SPD") || party.includes("DIE LINKE") || party.includes("BSW")) return "red";
  if (party.includes("GRÜNE")) return "green";
  if (party.includes("FDP") || party.includes("AfD")) return "yellow";
  return "gray";
}

function getArtVariant(art: string): "green" | "blue" | "yellow" | "gray" {
  if (art === "Rede" || art === "Kurzintervention" || art === "Zwischenfrage" || art === "Erwiderung") return "green";
  if (art.includes("Anfrage") || art === "Frage" || art === "Antwort") return "blue";
  if (art === "Antrag" || art === "Gesetzentwurf" || art.includes("antrag")) return "yellow";
  return "gray";
}

// Map filter keys to DB aktivitaetsart values
const typFilterMap: Record<string, string[]> = {
  fragen: ["Kleine Anfrage", "Große Anfrage", "Frage", "Antwort"],
  reden: ["Rede", "Kurzintervention", "Zwischenfrage", "Erwiderung"],
  antraege: ["Antrag", "Änderungsantrag", "Entschließungsantrag"],
  gesetze: ["Gesetzentwurf"],
};

export default async function AktivitaetenPage({ searchParams }: Props) {
  const { typ, q, seite } = await searchParams;
  const page = Math.max(1, parseInt(seite || "1", 10));
  const offset = (page - 1) * ROWS_PER_PAGE;

  // Map typ filter to a specific aktivitaetsart for now (use the most common one)
  // For a proper multi-value filter we'd need OR logic, so let's use the primary art
  let artFilter: string | undefined;
  if (typ && typFilterMap[typ]) {
    // Use the first/most common art for this category
    artFilter = typFilterMap[typ][0];
  }

  const { rows, total } = listActivities({
    query: q || undefined,
    art: artFilter,
    limit: ROWS_PER_PAGE,
    offset,
  });

  const totalPages = Math.ceil(total / ROWS_PER_PAGE);
  const activityTypes = getActivityTypes();

  const baseParams = new URLSearchParams();
  if (typ) baseParams.set("typ", typ);
  if (q) baseParams.set("q", q);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight mb-1">
          Aktivitäten im Bundestag
        </h1>
        <p className="text-sm text-muted">
          {total.toLocaleString("de-DE")} Aktivitäten
          {artFilter ? ` (${artFilter})` : ""} in der 21. Wahlperiode
        </p>
      </div>

      <ActivityFilters activeTyp={typ} query={q} />

      {/* Activity type stats bar */}
      <div className="flex flex-wrap gap-2 mt-4 mb-2">
        {activityTypes.slice(0, 8).map((t) => (
          <div
            key={t.art}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-border/50 text-xs"
          >
            <span className="font-semibold text-foreground">
              {t.count.toLocaleString("de-DE")}
            </span>
            <span className="text-muted">{t.art}</span>
          </div>
        ))}
      </div>

      <div className="space-y-3 mt-4">
        {rows.map((a) => {
          const Icon = getIcon(a.aktivitaetsart);
          const hasPolitician = a.politician_id && a.pol_first_name;

          return (
            <div
              key={a.id}
              className="bg-white rounded-2xl border border-border p-4 hover:shadow-md transition-all"
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {hasPolitician ? (
                      <Link
                        href={`/politiker/${a.politician_id}`}
                        className="font-semibold text-foreground hover:text-primary transition-colors"
                      >
                        {a.pol_first_name} {a.pol_last_name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground">
                        {a.titel.split(",")[0]}
                      </span>
                    )}
                    {a.pol_party && (
                      <Badge variant={getPartyVariant(a.pol_party)}>
                        {a.pol_party}
                      </Badge>
                    )}
                    <Badge variant={getArtVariant(a.aktivitaetsart)}>
                      {a.aktivitaetsart}
                    </Badge>
                  </div>
                  {a.thema && (
                    <p className="text-sm text-foreground/80 mb-1.5 line-clamp-2">
                      {a.thema}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted flex-wrap">
                    {a.datum && (
                      <span>
                        {new Date(a.datum).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    {a.drucksache_nr && (
                      <>
                        <span className="text-border">·</span>
                        {a.pdf_url ? (
                          <a
                            href={a.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            {a.herausgeber}-Drucksache {a.drucksache_nr}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span>
                            {a.herausgeber}-Drucksache {a.drucksache_nr}
                          </span>
                        )}
                      </>
                    )}
                    {a.urheber && (
                      <>
                        <span className="text-border">·</span>
                        <span>{a.urheber}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          {page > 1 ? (
            <Link
              href={`/aktivitaeten?${baseParams.toString()}&seite=${page - 1}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted/40">
              <ChevronLeft className="w-4 h-4" />
              Zurück
            </span>
          )}
          <span className="text-sm text-muted">
            Seite {page} von {totalPages.toLocaleString("de-DE")}
          </span>
          {page < totalPages ? (
            <Link
              href={`/aktivitaeten?${baseParams.toString()}&seite=${page + 1}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Weiter
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-muted/40">
              Weiter
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
