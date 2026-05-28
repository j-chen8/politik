import type { MetadataRoute } from "next";

// Pre-Launch: Suchmaschinen komplett ausschließen.
// Vor Public Launch diese Datei ersetzen oder allow auf "/" setzen.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
