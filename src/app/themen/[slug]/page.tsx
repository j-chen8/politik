import { ContextualLink as Link } from "@/components/ContextualLink";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { listDrucksachenForFields, listDrucksachenForThema } from "@/lib/db";
import { topicBySlug, TIER_STYLE } from "@/lib/citizen-topics";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const t = topicBySlug(slug);
  if (!t) return { title: "Thema — Politik-Radar" };
  return {
    title: `${t.label} — Themen | Politik-Radar`,
    description: t.blurb,
  };
}

function fmtNum(x: number): string {
  return x.toLocaleString("de-DE");
}

const LIMIT = 60;

export default async function ThemaDetailPage({ params }: Props) {
  const { slug } = await params;
  const topic = topicBySlug(slug);
  if (!topic) notFound();

  const { items, total } = topic.themaMatch
    ? listDrucksachenForThema(topic.themaMatch, LIMIT, 0)
    : listDrucksachenForFields(topic.awFields ?? [], LIMIT, 0);

  return (
    <div className="page-wash min-h-screen">
      <div className="max-w-3xl mx-auto px-5 py-12 fade-in-up">
        <Link
          href="/themen"
          className="inline-flex items-center gap-1.5 text-[12.5px] text-zinc-500 hover:text-[#1a3e72] transition-colors mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Alle Themen
        </Link>

        <header className="mb-7">
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] sm:text-[28px] font-semibold text-zinc-950 leading-tight">
              {topic.label}
            </h1>
            <span
              className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TIER_STYLE[topic.tier]}`}
            >
              {topic.tier}
            </span>
          </div>
          <p className="mt-2.5 text-[14px] text-zinc-600 leading-relaxed max-w-2xl">{topic.blurb}</p>
          {topic.surveyTerm && (
            <p className="mt-2 text-[11.5px] text-zinc-400">
              Umfrage-Salienz aus der Kategorie {topic.surveyTerm}.
            </p>
          )}
          <p className="mt-3 text-[12px] text-zinc-400">
            {fmtNum(total)} Drucksachen berühren dieses Thema
            {topic.flag && <span> · {topic.flag}</span>}
          </p>
        </header>

        <h2 className="mb-3 text-[14px] font-semibold text-zinc-950">Drucksachen zum Thema</h2>
        <ul className="space-y-2.5">
          {items.map((d) => (
            <li key={d.nr}>
              <Link
                href={`/aktivitaeten/${d.nr.replace("/", "-")}`}
                className="group flex items-start gap-3 rounded-xl border border-zinc-200/70 bg-white px-4 py-3 hover:border-[#1a3e72]/40 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] text-zinc-800 leading-snug group-hover:text-[#1a3e72] transition-colors line-clamp-2">
                    {d.titel || `Drucksache ${d.nr}`}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-400">
                    <span>Drucksache {d.nr}</span>
                    {d.fraktion && <span>· {d.fraktion}</span>}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-zinc-300 group-hover:text-[#1a3e72] transition-colors shrink-0" />
              </Link>
            </li>
          ))}
        </ul>

        {total > LIMIT && (
          <p className="mt-6 text-[12px] text-zinc-400">
            Zeigt die {LIMIT} neuesten von {fmtNum(total)} Drucksachen.
          </p>
        )}
      </div>
    </div>
  );
}
