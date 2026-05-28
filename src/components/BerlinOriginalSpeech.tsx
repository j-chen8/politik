"use client";

import { useState, useCallback } from "react";

/** Lazy-geladene Originalrede. Der volle Text (~58% des Sitzungs-Payloads) wird
 *  NICHT server-seitig mitgerendert, sondern erst beim Aufklappen per Fetch
 *  geholt. UX identisch zur alten <details>-Lösung, nur winziger Lade-Delay. */
export function BerlinOriginalSpeech({ speechId }: { speechId: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const onToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      if (!e.currentTarget.open || text !== null || loading) return;
      setLoading(true);
      setError(false);
      fetch(`/api/berlin/speech-text?id=${encodeURIComponent(speechId)}`)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((d: { text?: string }) => setText(d.text ?? ""))
        .catch(() => setError(true))
        .finally(() => setLoading(false));
    },
    [speechId, text, loading],
  );

  return (
    <details className="mt-2 group/orig" onToggle={onToggle}>
      <summary className="list-none cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-950 transition-colors select-none">
        <span className="inline-flex items-center gap-1">
          <span className="text-zinc-400 group-open/orig:rotate-90 transition-transform inline-block">▶</span>
          <span className="group-open/orig:hidden">Originalrede einblenden</span>
          <span className="hidden group-open/orig:inline">Originalrede ausblenden</span>
        </span>
      </summary>
      <div className="mt-2 max-h-[28rem] overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-[12.5px] leading-[1.65] text-zinc-800 font-serif">
        {loading && <p className="text-zinc-400">Lädt…</p>}
        {error && <p className="text-zinc-400">Originalrede konnte nicht geladen werden.</p>}
        {text != null &&
          text
            .split(/\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((para, i) => (
              <p key={i} className="mb-3 last:mb-0 hyphens-auto text-justify" lang="de">
                {para}
              </p>
            ))}
      </div>
    </details>
  );
}
