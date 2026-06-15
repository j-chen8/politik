import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { getParliamentsOverview } from "@/lib/db";

// Alle Seiten lesen SQLite live pro Request — kein SSG-Cache, sonst
// hinkt die UI hinter `update`-Refreshs hinterher. Kaskadiert vom
// Root-Layout in alle Routen.
export const dynamic = "force-dynamic";

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
  const parliaments = getParliamentsOverview();
  return (
    <html
      lang="de"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {/* Dark Mode flicker-frei + site-weit: vor dem Paint aus localStorage
            (bzw. System-Präferenz) setzen, auf allen Routen. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(t===null&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
        <SiteChrome parliaments={parliaments}>{children}</SiteChrome>
      </body>
    </html>
  );
}
