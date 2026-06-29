import { cookies } from "next/headers";
import { getSalienzRanking } from "@/lib/db";
import { unlockAction, pickAction } from "./actions";

export const dynamic = "force-dynamic"; // Ranking ändert sich täglich — nicht cachen

export default async function PickerPage() {
  const secret = process.env.AUFMACHER_PICK_SECRET;
  const c = await cookies();
  const berechtigt = !!secret && c.get("aufmacher_pick_auth")?.value === secret;

  // GATE: Secret NIE als hidden field — Seite selbst sperren (fail-closed).
  if (!berechtigt) {
    return (
      <form action={unlockAction} className="mx-auto mt-24 flex max-w-sm flex-col gap-3 px-6">
        <h1 className="text-lg font-semibold text-foreground">Aufmacher-Picker</h1>
        <input name="secret" type="password" autoComplete="off" placeholder="Picker-Secret"
          className="rounded-lg border border-border bg-card px-3 py-2 text-foreground" />
        <button className="rounded-lg bg-foreground px-3 py-2 font-medium text-background">Entsperren</button>
        {!secret && <p className="text-sm text-red-600 dark:text-red-400">AUFMACHER_PICK_SECRET nicht gesetzt — Picker gesperrt. In .env setzen.</p>}
      </form>
    );
  }

  const ranking = getSalienzRanking();
  if (!ranking) return <p className="p-8 text-muted">Noch kein Ranking — erst scripts/salienz-daily.ts laufen lassen.</p>;
  const { runDate, felder } = ranking;
  const top = felder[0];
  const keineStory = !top || top.newsOutletCount < 2;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 px-6 py-8">
      <header className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-foreground">Aufmacher-Picker</h1>
        <span className="num text-sm text-muted">Ranking {runDate}</span>
      </header>
      {keineStory && <p className="rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">Heute keine markante Cross-Outlet-Story (Top &lt; 2 Outlets) — Pick mit Bedacht.</p>}

      {felder.filter((f) => f.newsOutletCount > 0 || f.twitterBegriffe.length > 0).map((f) => (
        <section key={f.themenfeld} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="num w-7 text-center text-sm text-muted">#{f.rang}</span>
            <h2 className="font-semibold text-foreground">{f.themenfeld}</h2>
            {f.gesetzbezug && (
              <span title="enthält Gesetz/Reform/parl. Verfahren — im Ranking hochgezogen"
                className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                ⚖ Gesetz/Reform
              </span>
            )}
            <span className="ml-auto flex items-center gap-3 text-xs text-muted">
              <span title="distinkte Outlets">{f.newsOutletCount} Outlets</span>
              <span>{f.newsClusterCount} Cluster</span>
              {f.twitterBegriffe.length > 0 && <span>X: {f.twitterBegriffe.slice(0, 3).join(", ")}</span>}
            </span>
          </div>
          {f.summary && <p className="text-sm text-foreground">{f.summary}</p>}

          {f.cluster.slice(0, 3).map((cl) => (
            <div key={cl.clusterId} className="rounded-lg bg-background/60 p-3">
              <p className="text-sm font-medium text-foreground">
                {cl.gesetzbezug && <span title="Gesetz/Reform/parl. Verfahren" className="mr-1 text-emerald-600 dark:text-emerald-400">⚖</span>}
                {cl.leitthema} <span className="text-xs text-muted">({cl.outletCount} Outlets)</span>
                {cl.story && (
                  <span
                    title={`an ${cl.story.tageAktiv} Tag(en) markant, seit ${cl.story.seit}${cl.story.streak < cl.story.tageAktiv ? " (mit Pause)" : ""}`}
                    className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
                    🔥 seit {cl.story.streak} Tagen
                  </span>
                )}
              </p>
              <ul className="mt-1 flex flex-col gap-0.5">
                {cl.titles.slice(0, 4).map((t, i) => (
                  <li key={i} className="text-xs text-muted">
                    <span className="font-semibold">{t.outlet}</span> <a href={t.link} target="_blank" rel="noopener" className="hover:underline">{t.title}</a>
                  </li>
                ))}
              </ul>
              <form action={pickAction} className="mt-2 flex flex-wrap items-end gap-2">
                <input type="hidden" name="run_date" value={runDate} />
                <input type="hidden" name="themenfeld" value={f.themenfeld} />
                <input type="hidden" name="slug" value={f.slug} />
                <input type="hidden" name="cluster_id" value={cl.clusterId} />
                <input type="hidden" name="headline" value={cl.leitthema} />
                <input type="hidden" name="summary" value={cl.summary ?? f.summary ?? ""} />
                <input name="ds_nr" placeholder="Drucksache z.B. 21/623" className="w-40 rounded border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <input name="poll_id" placeholder="poll_id" className="w-24 rounded border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <input name="notiz" placeholder="Notiz" className="flex-1 rounded border border-border bg-card px-2 py-1 text-sm text-foreground" />
                <button className="rounded bg-foreground px-3 py-1 text-sm font-medium text-background">Als Aufmacher setzen</button>
              </form>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
