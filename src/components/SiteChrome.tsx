"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Search, Radio, Activity, Users, Gavel, Vote, BookOpen, Info, ChevronDown, Menu, X, BarChart3, Library } from "lucide-react";

/**
 * SiteChrome wraps every page with the matching header & footer for the active
 * design variant. Default routes get the original chrome; routes under
 * /design/<variant> get a per-variant chrome.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  // `/` wird via next.config.ts-Rewrite intern auf /design/linear gemappt,
  // bleibt aber als sichtbare URL `/` — daher hier explizit zu Linear-Chrome routen.
  const variant = pathname.startsWith("/design/linear") || pathname === "/"
    ? "linear"
    : pathname.startsWith("/design/")
    ? "default"
    : "default";

  if (variant === "linear") {
    return (
      <div className="design-linear flex flex-col min-h-full">
        <LinearHeader />
        <main className="flex-1">{children}</main>
        <LinearFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <DefaultHeader />
      <main className="flex-1">{children}</main>
      <DefaultFooter />
    </div>
  );
}

/* ── Default (original) chrome ──────────────────────────────── */

function DefaultHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Politik-Radar
            </span>
            <span className="hidden sm:inline text-xs text-muted ml-2 font-medium">
              Bundestag Transparenz
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/politiker" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Politiker</span>
          </Link>
          <Link href="/aktivitaeten" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Aktivitäten</span>
          </Link>
          <Link href="/protokolle" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
            <Gavel className="w-4 h-4" />
            <span className="hidden sm:inline">Protokolle</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Suche</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function DefaultFooter() {
  return (
    <footer className="border-t border-border py-6 text-center text-xs text-muted">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>Keine offizielle Regierungsseite</span>
        <span aria-hidden>·</span>
        <Link href="/methodik" className="text-primary hover:underline">
          Methodik
        </Link>
        <span aria-hidden>·</span>
        <Link href="/datenquellen" className="text-primary hover:underline">
          Datenquellen &amp; Credits
        </Link>
        <span aria-hidden>·</span>
        <Link href="/design/linear/impressum" className="text-primary hover:underline">
          Impressum
        </Link>
      </div>
    </footer>
  );
}

/* ── Linear-style chrome ────────────────────────────────────── */

const PRIMARY_NAV = [
  { href: "/design/linear/politiker", icon: Users, label: "Politiker" },
  { href: "/design/linear/abstimmungen", icon: Vote, label: "Abstimmungen" },
  { href: "/design/linear/aktivitaeten", icon: Activity, label: "Aktivitäten" },
  { href: "/design/linear/protokolle", icon: Gavel, label: "Protokolle" },
];

const MORE_NAV = [
  { href: "/design/linear/analyse", icon: BarChart3, label: "Analyse" },
  { href: "/design/linear/methodik", icon: BookOpen, label: "Methodik" },
  { href: "/design/linear/glossar", icon: Library, label: "Glossar" },
  { href: "/design/linear/ueber", icon: Info, label: "Über" },
];

const SEARCH_LINK = { href: "/design/linear/suche", label: "Suche" };

const navLinkClass =
  "flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-zinc-100";

function LinearHeader() {
  const pathname = usePathname() || "/";
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
          {/* Logo */}
          <Link href="/design/linear" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center transition-transform group-hover:scale-105">
              <Radio className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:flex items-baseline gap-2">
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                Politik-Radar
              </span>
              <span className="text-[11px] text-muted font-medium uppercase tracking-wider">
                Bundestag
              </span>
            </div>
          </Link>

          {/* Desktop-Navigation (≥ sm) */}
          <nav aria-label="Hauptnavigation" className="hidden sm:flex items-center gap-0.5">
            {PRIMARY_NAV.map((item) => (
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
                  className="absolute left-0 top-full mt-1.5 min-w-[170px] rounded-lg border border-border-soft bg-white shadow-lg py-1"
                >
                  {MORE_NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      className="flex items-center gap-2 px-3 py-2 text-[13px] font-medium text-muted hover:text-foreground hover:bg-zinc-100 transition-colors"
                    >
                      <item.icon className="w-3.5 h-3.5" strokeWidth={2.25} />
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Suche — eigenständig */}
            <Link href={SEARCH_LINK.href} className={navLinkClass}>
              <Search className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span>{SEARCH_LINK.label}</span>
            </Link>
          </nav>

          {/* Mobile-Steuerung (< sm) */}
          <div className="flex sm:hidden items-center gap-0.5">
            <Link
              href={SEARCH_LINK.href}
              aria-label="Suche"
              className="flex items-center justify-center w-10 h-10 rounded-md text-muted hover:text-foreground hover:bg-zinc-100 transition-colors"
            >
              <Search className="w-5 h-5" strokeWidth={2.25} />
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menü öffnen"
              aria-expanded={mobileOpen}
              className="flex items-center justify-center w-10 h-10 rounded-md text-muted hover:text-foreground hover:bg-zinc-100 transition-colors cursor-pointer"
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
          className="fixed inset-0 z-[60] sm:hidden bg-white flex flex-col"
        >
          {/* Kopfzeile — Logo links, Schließen rechts */}
          <div className="h-14 px-5 flex items-center justify-between border-b border-border-soft shrink-0">
            <Link
              href="/design/linear"
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
              className="flex items-center justify-center w-10 h-10 rounded-md text-muted hover:text-foreground hover:bg-zinc-100 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" strokeWidth={2.25} />
            </button>
          </div>

          {/* Navigations-Links — zentriert */}
          <nav
            aria-label="Menü"
            className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1"
          >
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-3.5 px-4 py-3.5 rounded-xl text-[17px] font-medium text-foreground hover:bg-zinc-100 transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted" strokeWidth={2.25} />
                {item.label}
              </Link>
            ))}
            <div className="my-2 border-t border-border-soft" />
            {MORE_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-3.5 px-4 py-3.5 rounded-xl text-[17px] font-medium text-foreground hover:bg-zinc-100 transition-colors"
              >
                <item.icon className="w-5 h-5 text-muted" strokeWidth={2.25} />
                {item.label}
              </Link>
            ))}
            <Link
              href={SEARCH_LINK.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-3.5 px-4 py-3.5 rounded-xl text-[17px] font-medium text-foreground hover:bg-zinc-100 transition-colors"
            >
              <Search className="w-5 h-5 text-muted" strokeWidth={2.25} />
              {SEARCH_LINK.label}
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}

function LinearFooter() {
  return (
    <footer className="border-t border-border-soft bg-zinc-50 py-10">
      <div className="max-w-6xl mx-auto px-5 flex items-center justify-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>Keine offizielle Regierungsseite</span>
          <Link href="/design/linear/ueber" className="hover:text-foreground transition-colors">
            Über
          </Link>
          <Link href="/design/linear/methodik" className="hover:text-foreground transition-colors">
            Methodik
          </Link>
          <Link href="/design/linear/datenquellen" className="hover:text-foreground transition-colors">
            Datenquellen
          </Link>
          <Link href="/design/linear/foerderung" className="hover:text-foreground transition-colors">
            Förderung
          </Link>
          <Link href="/design/linear/impressum" className="hover:text-foreground transition-colors">
            Impressum
          </Link>
          <Link href="/design/linear/datenschutz" className="hover:text-foreground transition-colors">
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}

