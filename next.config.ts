import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Root-URL `/` rendert intern das Linear-Design, damit Cold-Mail-Empfänger
  // nicht auf der alten Default-UI landen. SiteChrome erkennt sowohl
  // `/design/linear*` als auch `/` als Linear-Variante (siehe `variant`-Logik).
  async rewrites() {
    // `beforeFiles` greift VOR dem Filesystem-Check — sonst würde die
    // existierende src/app/page.tsx (alte Default-UI) gewinnen.
    return {
      beforeFiles: [
        { source: "/", destination: "/design/linear" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
