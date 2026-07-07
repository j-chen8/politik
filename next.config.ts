import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR steuert das Build-Output-Verzeichnis. Default `.next`
  // (Live-Build, Port 3000, CF-Tunnel). Staging-Service setzt
  // `.next-staging` (Port 3001, LAN-only) — so kann gegen Live getestet
  // werden ohne sie zu überschreiben.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  serverExternalPackages: ["better-sqlite3"],
  // Build-Peak lag bei ~6 GB RSS → OOM-Kill auf der 7-GB-Maschine (2026-06-11).
  // Laut next/dist/docs/01-app/02-guides/memory-usage.md low-risk, kostet
  // etwas Build-Zeit.
  experimental: {
    webpackMemoryOptimizations: true,
  },
  // LAN-/Tailscale-Zugriff auf den Dev-Server: ohne die erlaubte Origin lädt
  // die Seite zwar, aber React hydratisiert nicht (Next-Dev Cross-Origin-
  // Schutz) — Symptom: alles Interaktive (Drawer, Scroll-Hide) tot.
  allowedDevOrigins: ["192.168.178.170", "100.119.184.31"],
  // Das frühere /design/linear-Design ist jetzt das Root-Design. Alte Demo-Links
  // (vor der Migration geteilt) per Dauer-Redirect auf die neuen Root-Pfade leiten.
  async redirects() {
    return [
      { source: "/design/linear", destination: "/", permanent: true },
      { source: "/design/linear/:path*", destination: "/:path*", permanent: true },
      // Kommissionen lagen als Provisorium unter /entwurf/… und waren so
      // kurz öffentlich verlinkt (Nav seit 07.07.).
      { source: "/entwurf/kommissionen/:path*", destination: "/kommissionen/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
