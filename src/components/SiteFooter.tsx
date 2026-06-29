"use client";

import Link from "next/link";
import { useIsBerlin } from "@/lib/parliament-context";

/**
 * Site-weiter Footer mit den rechtlich nötigen Links (Impressum/Datenschutz) +
 * „Keine offizielle Regierungsseite". Aus SiteChrome (LinearFooter) extrahiert,
 * damit sowohl die App-Shell als auch etwaige Sonder-Layouts denselben Footer nutzen.
 * Im Berlin-Kontext bleiben die Links auf Berlin (Param/Quelle), damit Nav/Logo
 * nicht zurück auf Bundestag springen.
 */
export function SiteFooter() {
  const isBerlin = useIsBerlin();
  const ctx = isBerlin ? "?parlament=2" : "";
  const footerLinks = [
    { href: isBerlin ? "/parlamente/berlin/methodik" : "/methodik", label: "Methodik" },
    { href: `/ueber${ctx}`, label: "Über" },
    { href: `/datenquellen${ctx}`, label: "Datenquellen" },
    { href: `/foerderung${ctx}`, label: "Förderung" },
    { href: `/impressum${ctx}`, label: "Impressum" },
    { href: `/datenschutz${ctx}`, label: "Datenschutz" },
  ];
  return (
    <footer className="border-t border-border-soft bg-zinc-50 py-10 dark:bg-zinc-900/50">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>Keine offizielle Regierungsseite</span>
          {footerLinks.map((l) => (
            <Link key={l.label} href={l.href} className="hover:text-foreground transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
