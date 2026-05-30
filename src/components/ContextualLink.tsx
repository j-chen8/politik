"use client";

import Link from "next/link";
import { useIsBerlin } from "@/lib/parliament-context";
import type { ComponentProps } from "react";

/**
 * Drop-in-Ersatz für next/link, der den Parlament-Kontext über interne Links
 * mitführt. Im Berlin-Kontext (useIsBerlin):
 *  - /methodik → /parlamente/berlin/methodik (eigene Berlin-Quelle)
 *  - andere interne Pfade (/ueber, /glossar, …) → ?parlament=2 angehängt,
 *    damit Nav/Logo/Footer auf Berlin bleiben
 *  - bereits Berlin-Pfade, externe URLs und reine #Anker bleiben unverändert
 *
 * Einsatz auf geteilten Info-/Rechts-Seiten (Über, Methodik, Datenquellen …),
 * deren Fließtext quer auf andere Seiten verlinkt.
 */
function toBerlinHref(href: string): string {
  if (!href.startsWith("/")) return href; // extern oder reiner #Anker
  const hashIdx = href.indexOf("#");
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const noHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const [path, query = ""] = noHash.split("?");
  if (path.startsWith("/parlamente/berlin")) return href; // schon Berlin
  if (path === "/methodik") return `/parlamente/berlin/methodik${query ? `?${query}` : ""}${hash}`;
  const sep = query ? "&" : "";
  return `${path}?${query}${sep}parlament=2${hash}`;
}

export function ContextualLink({ href, ...rest }: ComponentProps<typeof Link>) {
  const isBerlin = useIsBerlin();
  const resolved = typeof href === "string" && isBerlin ? toBerlinHref(href) : href;
  return <Link href={resolved} {...rest} />;
}
