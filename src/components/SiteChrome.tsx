"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Search, Radio, Activity, Users, Gavel, Vote } from "lucide-react";

/**
 * SiteChrome wraps every page with the matching header & footer for the active
 * design variant. Default routes get the original chrome; routes under
 * /design/<variant> get a per-variant chrome.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const variant = pathname.startsWith("/design/linear")
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

const LINEAR_NAV = [
  { href: "/design/linear/politiker", icon: Users, label: "Politiker" },
  { href: "/design/linear/abstimmungen", icon: Vote, label: "Abstimmungen" },
  { href: "/design/linear/aktivitaeten", icon: Activity, label: "Aktivitäten" },
  { href: "/design/linear/protokolle", icon: Gavel, label: "Protokolle" },
  { href: "/design/linear/suche", icon: Search, label: "Suche" },
];

function LinearHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/70 backdrop-blur-xl border-b border-border-soft">
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/design/linear" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center transition-transform group-hover:scale-105">
            <Radio className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Politik-Radar
            </span>
            <span className="hidden sm:inline text-[11px] text-muted font-medium uppercase tracking-wider">
              Bundestag
            </span>
          </div>
        </Link>
        <nav className="flex items-center gap-0.5">
          {LINEAR_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-zinc-100"
            >
              <item.icon className="w-3.5 h-3.5" strokeWidth={2.25} />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function LinearFooter() {
  return (
    <footer className="border-t border-border-soft bg-zinc-50 py-10">
      <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm font-medium tracking-tight text-foreground">
          Von einem Bürger — für alle Bürger.
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
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

