import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Search, Radio, Activity, Users, Gavel } from "lucide-react";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Politik-Radar | Transparenz für den Bundestag",
  description:
    "Die Leistung deutscher Bundestagsabgeordneter radikal transparent und vergleichbar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="de"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
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
              <Link
                href="/politiker"
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Politiker</span>
              </Link>
              <Link
                href="/aktivitaeten"
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Aktivitäten</span>
              </Link>
              <Link
                href="/protokolle"
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Gavel className="w-4 h-4" />
                <span className="hidden sm:inline">Protokolle</span>
              </Link>
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Suche</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>Keine offizielle Regierungsseite</span>
            <span aria-hidden>·</span>
            <Link href="/datenquellen" className="text-primary hover:underline">
              Datenquellen &amp; Credits
            </Link>
            <span aria-hidden>·</span>
            <Link href="/impressum" className="text-primary hover:underline">
              Impressum
            </Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
