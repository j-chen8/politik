"use client";

import { usePathname } from "next/navigation";
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
  const pathname = usePathname() || "/";
  // Immersive Vollbild-Erlebnisse (Wisch-Feeds, Now-Playing) laufen ohne
  // Shell — linke Leiste/Topbar/Tab-Bar würden das Vollbild zerstören.
  const vollbild = /\/(feed|nowplaying)$/.test(pathname);
  if (vollbild) return <>{children}</>;
  return <AppShell parliaments={parliaments}>{children}</AppShell>;
}
