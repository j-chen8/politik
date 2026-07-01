"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home, Layers, Vote, Scale, FileText, MessageSquare, Mic, Users, Landmark,
  MessageSquareQuote, BarChart3, BookOpen, ClipboardList, Info, Menu, X, Radio,
} from "lucide-react";
import { ParliamentSwitcher } from "./ParliamentSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import { SearchBox } from "./SearchBox";
import { SiteFooter } from "./SiteFooter";
import { useIsBerlin } from "@/lib/parliament-context";
import type { ParliamentOverview } from "@/lib/db";

/**
 * AppShell — Consumer-Layout im „App-Shell"-Muster (linke Leiste + Topbar +
 * Content), wie Spotify/YouTube/Reddit. Linke Leiste = Sektionen (kein Account,
 * also Navigation statt „dein Kram"), Topbar = Suche + Dark-Mode, Content =
 * children. Seit 2026-06-29 site-weiter Rahmen (vorher nur `/` + `/entwurf`).
 * Im Berlin-Kontext (useIsBerlin) spiegelt die Nav die bewährten Berlin-Routen.
 */

// Primäre Sektionen: Start · Themen · Gesetzentwürfe · Abstimmungen ·
// Kleine Anfragen · Reden · Politiker · Parteien. Das frühere Sammel-„Drucksachen"
// (/aktivitaeten) ist in die drei fokussierten Verfahrens-Seiten aufgeteilt.
const PRIMARY = [
  { href: "/", icon: Home, label: "Start" },
  { href: "/themen", icon: Layers, label: "Themen" },
  { href: "/gesetze", icon: Scale, label: "Gesetzentwürfe" },
  { href: "/antraege", icon: FileText, label: "Anträge" },
  { href: "/abstimmungen", icon: Vote, label: "Abstimmungen" },
  { href: "/anfragen", icon: MessageSquare, label: "Anfragen" },
  { href: "/protokolle", icon: Mic, label: "Reden" },
  { href: "/politiker", icon: Users, label: "Politiker" },
  { href: "/parteien", icon: Landmark, label: "Parteien" },
];

// Sekundär (kleiner, unter dem Trenner) — alles Weitere bleibt erreichbar.
const SECONDARY = [
  { href: "/fragen", icon: MessageSquareQuote, label: "Fragen & Antworten" },
  { href: "/berichte", icon: ClipboardList, label: "Berichte & Unterrichtungen" },
  { href: "/entwurf/kommissionen/berichte", icon: Scale, label: "Kommissionsberichte" },
  { href: "/analyse", icon: BarChart3, label: "Analyse" },
  { href: "/methodik", icon: BookOpen, label: "Methodik" },
  { href: "/ueber", icon: Info, label: "Über" },
];

// Berlin: KEINE gesetze/antraege/anfragen-Aufteilung — Berlin nutzt das kombinierte
// /parlamente/berlin/drucksachen. Spiegelt die bewährten Berlin-Routen aus SiteChrome.
const PRIMARY_BERLIN = [
  { href: "/parlamente/berlin", icon: Home, label: "Start" },
  { href: "/parlamente/berlin/themen", icon: Layers, label: "Themen" },
  { href: "/parlamente/berlin/abstimmungen", icon: Vote, label: "Abstimmungen" },
  { href: "/parlamente/berlin/drucksachen", icon: FileText, label: "Drucksachen" },
  { href: "/parlamente/berlin/sitzungen", icon: Mic, label: "Reden & Protokolle" },
  { href: "/politiker?parlament=2", icon: Users, label: "Politiker" },
];

const SECONDARY_BERLIN = [
  { href: "/parlamente/berlin/fragen", icon: MessageSquareQuote, label: "Fragen & Antworten" },
  { href: "/analyse?parlament=2", icon: BarChart3, label: "Analyse" },
  { href: "/parlamente/berlin/methodik", icon: BookOpen, label: "Methodik" },
  { href: "/ueber?parlament=2", icon: Info, label: "Über" },
];

function NavList({ onNavigate, pathname, isBerlin }: { onNavigate?: () => void; pathname: string; isBerlin: boolean }) {
  const primary = isBerlin ? PRIMARY_BERLIN : PRIMARY;
  const secondary = isBerlin ? SECONDARY_BERLIN : SECONDARY;
  const itemCls = (active: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition-colors ${
      active
        ? "bg-zinc-100 text-foreground dark:bg-zinc-800"
        : "text-muted hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
    }`;
  return (
    <nav aria-label="Hauptnavigation" className="flex flex-col gap-0.5">
      {primary.map((it) => (
        <Link key={it.href} href={it.href} onClick={onNavigate} className={itemCls(pathname === it.href)}>
          <it.icon className="h-[18px] w-[18px] shrink-0" strokeWidth={2} />
          {it.label}
        </Link>
      ))}
      <div className="my-2 border-t border-border-soft" />
      {secondary.map((it) => (
        <Link
          key={it.href}
          href={it.href}
          onClick={onNavigate}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium text-muted transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800 ${pathname === it.href ? "text-foreground" : ""}`}
        >
          <it.icon className="h-4 w-4 shrink-0" strokeWidth={2} />
          {it.label}
        </Link>
      ))}
    </nav>
  );
}

function Brand({ isBerlin }: { isBerlin: boolean }) {
  return (
    <Link href={isBerlin ? "/parlamente/berlin" : "/"} className="group flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground transition-transform group-hover:scale-105">
        <Radio className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-[16px] font-semibold tracking-tight text-foreground">Politik-Radar</span>
    </Link>
  );
}

export function AppShell({
  children,
  parliaments,
}: {
  children: React.ReactNode;
  parliaments: ParliamentOverview[];
}) {
  const pathname = usePathname() || "/";
  const isBerlin = useIsBerlin();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Drawer bei Navigation schließen + Body-Scroll sperren solange offen.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <div className="design-linear min-h-screen bg-background lg:flex">
      {/* ── Linke Leiste (Desktop, persistent) ─────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border-soft bg-background px-4 py-5 lg:flex">
        <div className="px-2">
          <Brand isBerlin={isBerlin} />
        </div>
        <div className="mt-6 flex-1 overflow-y-auto">
          <NavList pathname={pathname} isBerlin={isBerlin} />
        </div>
        {/* BT ⇄ Berlin unten */}
        <div className="mt-2 border-t border-border-soft px-3 pt-3">
          <ParliamentSwitcher parliaments={parliaments} />
        </div>
      </aside>

      {/* ── Rechte Spalte: Topbar + Content ────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border-soft bg-background/80 backdrop-blur-xl">
          {/* 3-Spalten-Raster: links Hamburger (mobil), MITTE = zentrierte Suche,
              rechts Dark-Mode. Gleich breite 1fr-Außenspalten → Suche exakt mittig. */}
          <div className="grid h-14 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-5">
            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Menü öffnen"
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800 lg:hidden"
              >
                <Menu className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
            <div className="w-[min(36rem,calc(100vw-6.5rem))]">
              {/* Berlin: Suche auf Berlin-Scope; Autocomplete-Vorschläge gibt es
                  (noch) nur für den Bundestag → im Berlin-Kontext weglassen. */}
              <SearchBox
                searchPath={isBerlin ? "/parlamente/berlin/suche" : "/suche"}
                vorschlaegeUrl={isBerlin ? undefined : "/api/suche/vorschlaege"}
              />
            </div>
            <div className="flex items-center justify-end">
              {/* Rechts: vorerst nur Dark-Mode (Login-Slot folgt) */}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>

      {/* ── Mobiler Drawer ─────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col border-r border-border-soft bg-background px-3 py-4 shadow-xl">
            <div className="flex items-center justify-between px-2">
              <Brand isBerlin={isBerlin} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Menü schließen"
                className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-zinc-100 hover:text-foreground dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
            <div className="mt-6 flex-1 overflow-y-auto">
              <NavList pathname={pathname} isBerlin={isBerlin} onNavigate={() => setDrawerOpen(false)} />
            </div>
            <div className="mt-2 border-t border-border-soft px-3 pt-3">
              <ParliamentSwitcher parliaments={parliaments} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
