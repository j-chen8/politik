"use client";

import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";

/**
 * YouTube-Embed mit Click-to-Load (privacy-friendly).
 *
 * - Initial: nur Vorschaubild + Play-Button — keine YouTube-/Google-Cookies
 * - Click → iframe wird geladen via youtube-nocookie.com (Extended Privacy Mode)
 * - Optional: startSeconds springt direkt an Position
 *
 * Damit DSGVO-konform ohne Consent-Banner, weil bis zum aktiven Klick keine
 * Drittanbieter-Anfragen passieren.
 */
export function YouTubeEmbed({
  videoId,
  title,
  startSeconds,
}: {
  videoId: string;
  title?: string;
  startSeconds?: number;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1${
      startSeconds ? `&start=${startSeconds}` : ""
    }`;
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 shadow-sm">
        <iframe
          src={embedUrl}
          title={title ?? "YouTube-Video"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  // Vorschaubild — YouTube liefert mehrere Größen, maxresdefault = 1280×720, fallback hqdefault
  const thumbUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-900 shadow-sm cursor-pointer block"
      aria-label={`Video „${title ?? videoId}" laden und abspielen`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbUrl}
        alt={title ?? "Video-Vorschau"}
        className="absolute inset-0 w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors flex items-center justify-center">
        <div className="bg-red-600 rounded-full p-4 sm:p-5 group-hover:scale-110 transition-transform shadow-lg">
          <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white" strokeWidth={1.5} />
        </div>
      </div>
      {/* Footer mit Titel + Privacy-Hinweis */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-4 sm:p-5 text-left">
        {title && (
          <div className="text-white text-[14px] sm:text-[15px] font-medium leading-snug line-clamp-2 mb-1">
            {title}
          </div>
        )}
        <div className="text-zinc-200 text-[11px] flex items-center gap-1">
          <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
          Click lädt Video von youtube-nocookie.com — DSGVO-erweiterter Datenschutzmodus
        </div>
      </div>
    </button>
  );
}
