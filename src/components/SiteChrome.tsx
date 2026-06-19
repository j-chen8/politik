"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Radio, Activity, Users, Gavel, Vote, BookOpen, Info, ChevronDown, Menu, X, BarChart3, Library, CalendarDays, MessageSquareQuote, MapPin, Landmark, Layers } from "lucide-react";
import { ParliamentSwitcher } from "./ParliamentSwitcher";
import { HomeThemeToggle } from "./HomeThemeToggle";
import { useIsBerlin } from "@/lib/parliament-context";
import type { ParliamentOverview } from "@/lib/db";

/**
 * SiteChrome wraps every page with the site header & footer.
 */
export function SiteChrome({
  children,
  parliaments,
}: {
  children: React.ReactNode;
  parliaments: ParliamentOverview[];
}) {
  return (
    <div className="design-linear flex flex-col min-h-full">
      <LinearHeader parliaments={parliaments} />
      <main className="flex-1">{children}</main>
      <LinearFooter />
    </div>
  );
}

/* ── Site chrome ────────────────────────────────────────────── */

// Bundestag = Default; die Labels/Struktur bleiben parlament-agnostisch (wie der
// User es will), nur die hrefs werden im Berlin-Kontext auf Berlin-Routen gemappt.
const PRIMARY_NAV = [
  { href: "/politiker", icon: Users, label: "Politiker" },
  { href: "/abstimmungen", icon: Vote, label: "Abstimmungen" },
  { href: "/aktivitaeten", icon: Activity, label: "Aktivitäten" },
  { href: "/protokolle", icon: Gavel, label: "Protokolle" },
];

const MORE_NAV = [
  { href: "/durchklicken", icon: Layers, label: "Durchklicken" },
  { href: "/parteien", icon: Landmark, label: "Parteien" },
  { href: "/wahlkreis", icon: MapPin, label: "Mein Abgeordneter" },
  { href: "/protokolle/sitzungen", icon: CalendarDays, label: "Plenarsitzungen" },
  { href: "/fragen", icon: MessageSquareQuote, label: "Fragen & Antworten" },
  { href: "/analyse", icon: BarChart3, label: "Analyse" },
  { href: "/methodik", icon: BookOpen, label: "Methodik" },
  { href: "/glossar", icon: Library, label: "Glossar" },
  { href: "/ueber", icon: Info, label: "Über" },
];

const SEARCH_LINK = { href: "/suche", label: "Suche" };

// Berlin-Pendants. Politiker = geteilte Liste mit ?parlament=2; Aktivitäten =
// Drucksachen-Feed; Protokolle/Plenarsitzungen = Sitzungsliste.
// Analyse/Glossar/Über haben (noch) keine Berlin-Variante — sie bleiben EINE
// geteilte Seite, bekommen aber ?parlament=2 angehängt, damit useIsBerlin den
// Kontext erkennt und die Nav im Berlin-Modus bleibt (Berlin → Über → Berlin).
const PRIMARY_NAV_BERLIN = [
  { href: "/politiker?parlament=2", icon: Users, label: "Politiker" },
  { href: "/parlamente/berlin/abstimmungen", icon: Vote, label: "Abstimmungen" },
  { href: "/parlamente/berlin/drucksachen", icon: Activity, label: "Aktivitäten" },
  { href: "/parlamente/berlin/sitzungen", icon: Gavel, label: "Protokolle" },
];

const MORE_NAV_BERLIN = [
  { href: "/parlamente/berlin/fragen", icon: MessageSquareQuote, label: "Fragen & Antworten" },
  { href: "/parlamente/berlin/sitzungen", icon: CalendarDays, label: "Plenarsitzungen" },
  { href: "/analyse?parlament=2", icon: BarChart3, label: "Analyse" },
  { href: "/parlamente/berlin/methodik", icon: BookOpen, label: "Methodik" },
  { href: "/glossar?parlament=2", icon: Library, label: "Glossar" },
  { href: "/ueber?parlament=2", icon: Info, label: "Über" },
];

const SEARCH_LINK_BERLIN = { href: "/parlamente/berlin/suche", label: "Suche" };

const navLinkClass =
  "flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800";

function LinearHeader({ parliaments }: { parliaments: ParliamentOverview[] }) {
  const pathname = usePathname() || "/";
  const isBerlin = useIsBerlin();
  const primaryNav = isBerlin ? PRIMARY_NAV_BERLIN : PRIMARY_NAV;
  const moreNav = isBerlin ? MORE_NAV_BERLIN : MORE_NAV;
  const searchLink = isBerlin ? SEARCH_LINK_BERLIN : SEARCH_LINK;
  // Logo/Home führt im Berlin-Kontext zur Berlin-Landing, sonst zur Bundestag-Landing.
  const homeHref = isBerlin ? "/parlamente/berlin" : "/";
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Menüs nach jeder Navigation schließen
  useEffect(() => {
    setMoreOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // "Mehr"-Dropdown bei Klick außerhalb schließen
  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  // Vollbild-Mobilmenü: Body-Scroll sperren + Escape schließt
  useEffect(() => {
    if (!mobileOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border-soft">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          {/* Logo + Parlament-Switcher */}
          <div className="flex items-center gap-2.5">
            <Link href={homeHref} className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center transition-transform group-hover:scale-105">
                <Radio className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="hidden sm:inline text-[15px] font-semibold tracking-tight text-foreground">
                Politik-Radar
              </span>
            </Link>
            <div>
              <ParliamentSwitcher parliaments={parliaments} />
            </div>
          </div>

          {/* Desktop-Navigation (≥ sm) */}
          <nav aria-label="Hauptnavigation" className="hidden sm:flex items-center gap-0.5">
            {primaryNav.map((item) => (
              <Link key={item.href} href={item.href} className={navLinkClass}>
                <item.icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                <span>{item.label}</span>
              </Link>
            ))}

            {/* "Mehr"-Dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setMoreOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                className={`${navLinkClass} cursor-pointer`}
              >
                <span>Mehr</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${moreOpen ? "rotate-180" : ""}`}
                  strokeWidth={2.25}
                />
              </button>
              {moreOpen && (
                <div
                  role="menu"
                  className="absolute left-0 top-full mt-1.5 min-w-[170px] rounded-lg border border-border-soft bg-white shadow-lg py-1 dark:bg-zinc-900 dark:border-zinc-700"
                >
                  {moreNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <item.icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Suche — eigenständig */}
            <Link href={searchLink.href} className={navLinkClass}>
              <Search className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span>{searchLink.label}</span>
            </Link>
            {/* Dark-Toggle nur auf der Landing — HomeThemeToggle ist homepage-
                gescoped (räumt .dark beim Unmount weg), der Rest der Seite ist
                noch nicht durchgehend dark-fähig. */}
            {pathname === "/" && <HomeThemeToggle />}
          </nav>

          {/* Mobile-Steuerung (< sm) */}
          <div className="flex sm:hidden items-center gap-0.5">
            {pathname === "/" && <HomeThemeToggle />}
            <Link
              href={searchLink.href}
              aria-label="Suche"
              className="flex items-center justify-center w-10 h-10 rounded-md text-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Search className="w-5 h-5" strokeWidth={2.25} />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menü öffnen"
              aria-expanded={mobileOpen}
              className="flex items-center justify-center w-10 h-10 rounded-md text-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </header>

      {/* Vollbild-Mobilmenü */}
      {mobileOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigationsmenü"
          className="fixed inset-0 z-[60] sm:hidden bg-white flex flex-col dark:bg-zinc-950"
        >
          {/* Kopfzeile — Logo links, Schließen rechts */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-border-soft shrink-0">
            <Link
              href={homeHref}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <Radio className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Politik-Radar
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Menü schließen"
              className="flex items-center justify-center w-10 h-10 rounded-md text-muted hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" strokeWidth={2.25} />
            </button>
          </div>

          {/* Navigations-Links — zentriert */}
          <nav
            aria-label="Menü"
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
          >
            {/* Parlament-Auswahl steht jetzt mobil neben dem Logo (Header), nicht mehr hier. */}
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-3.5 px-4 py-3.5 rounded-xl text-[17px] font-medium text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted" strokeWidth={2.25} />
                {item.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border-soft" />
            {moreNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-3.5 px-4 py-3.5 rounded-xl text-[17px] font-medium text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted" strokeWidth={2.25} />
                {item.label}
              </Link>
            ))}
            <Link
              href={searchLink.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-3.5 px-4 py-3.5 rounded-xl text-[17px] font-medium text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <Search className="w-5 h-5 text-muted" strokeWidth={2.25} />
              {searchLink.label}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

function LinearFooter() {
  const isBerlin = useIsBerlin();
  // Methodik hat eine eigene Berlin-Quelle; die übrigen (rechtlich/allgemein) sind global,
  // behalten aber im Berlin-Kontext den Param, damit Nav/Logo auf Berlin bleiben.
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

