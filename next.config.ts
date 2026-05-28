import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_DIST_DIR steuert das Build-Output-Verzeichnis. Default `.next`
  // (Live-Build, Port 3000, CF-Tunnel). Staging-Service setzt
  // `.next-staging` (Port 3001, LAN-only) — so kann gegen Live getestet
  // werden ohne sie zu überschreiben.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  serverExternalPackages: ["better-sqlite3"],
  // Das frühere /design/linear-Design ist jetzt das Root-Design. Alte Demo-Links
  // (vor der Migration geteilt) per Dauer-Redirect auf die neuen Root-Pfade leiten.
  async redirects() {
    return [
      { source: "/design/linear", destination: "/", permanent: true },
      { source: "/design/linear/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
