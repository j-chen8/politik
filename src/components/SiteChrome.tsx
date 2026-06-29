"use client";

import { AppShell } from "./AppShell";
import type { ParliamentOverview } from "@/lib/db";

/**
 * SiteChrome umhüllt jede Seite mit dem App-Shell-Rahmen (linke Leiste + Topbar +
 * Footer). Bis 2026-06-29 gab es zwei Rahmen — Top-Nav (LinearHeader) für die
 * meisten Seiten, App-Shell nur für `/` + `/entwurf`. Seit dem site-weiten Rollout
 * läuft ALLES in der AppShell (Berlin-Nav inkl., siehe AppShell.tsx). Dieser
 * Wrapper bleibt als zentrale Umschalt-Stelle bestehen (z.B. für künftige
 * chrome-lose Sonder-Routen).
 */
export function SiteChrome({
  children,
  parliaments,
}: {
  children: React.ReactNode;
  parliaments: ParliamentOverview[];
}) {
  return <AppShell parliaments={parliaments}>{children}</AppShell>;
}
