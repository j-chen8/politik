"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Erkennt den aktuellen Parlament-Kontext im Client.
 * Berlin lebt unter /parlamente/berlin/* — AUSSER die Politiker-Liste, die als
 * geteilte Route /politiker?parlament=2 nur am Query-Param hängt. Beides prüfen,
 * sonst springt Nav/Switcher auf der Berliner Politiker-Liste auf Bundestag zurück.
 */
export function useIsBerlin(): boolean {
  const pathname = usePathname() || "/";
  const params = useSearchParams();
  return pathname.startsWith("/parlamente/berlin") || params.get("parlament") === "2";
}
