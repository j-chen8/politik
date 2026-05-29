import { getBerlinSitzungDetail } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { BerlinSitzungVariantBar } from "@/components/BerlinSitzungVariantBar";
import { BerlinSitzungFeed } from "@/components/BerlinSitzungFeed";

interface Props {
  params: Promise<{ nr: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nr } = await params;
  return { title: `Sitzung ${nr} · Feed · Abgeordnetenhaus Berlin` };
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function fmt(n: number) {
  return n.toLocaleString("de-DE");
}

export default async function BerlinSitzungFeedPage({ params }: Props) {
  const { nr } = await params;
  const sitzungNr = parseInt(nr, 10);
  if (!Number.isFinite(sitzungNr)) notFound();

  const sit = getBerlinSitzungDetail(sitzungNr);
  if (!sit) notFound();

  return (
    <div className="page-wash">
      <div className="w-full max-w-3xl mx-auto px-5 pt-10 pb-24">
        <Link
          href="/parlamente/berlin"
          className="inline-flex items-center gap-1.5 text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.25} />
          Abgeordnetenhaus Berlin
        </Link>

        <BerlinSitzungVariantBar sitzungNr={sit.sitzungNr} current="feed" />

        <header className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
            Plenarprotokoll {sit.plprDokNr}
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-zinc-950 mb-1.5">
            {sit.sitzungNr}. Sitzung
          </h1>
          <p className="text-[13px] text-zinc-600 num">
            {formatDate(sit.datum)} · {fmt(sit.redenTotal)} Wortbeiträge
            {sit.plprLokUrl && (
              <>
                {" · "}
                <a
                  href={sit.plprLokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-700 hover:text-zinc-950 inline-flex items-center gap-1 transition-colors"
                >
                  PDF
                  <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
                </a>
              </>
            )}
          </p>
        </header>

        <BerlinSitzungFeed sit={sit} />
      </div>
    </div>
  );
}
