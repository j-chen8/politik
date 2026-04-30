/**
 * Shared HTML→Text-Cleaner für alle CV-Scraping-Skripte.
 *
 * Im Vergleich zur naiven Version (script/style/nav strippen + tags weg):
 * - Cookie-Banner-Sections (id/class enthält "cookie", "consent", "cmp",
 *   "usercentrics", "cookiebot") werden VOR dem Tag-Stripping entfernt
 * - Social-Embeds (Twitter, Instagram, Facebook iframes/blockquotes) raus
 * - Sidebars/Asides raus (oft Newsletter-Banner)
 * - Forms raus (Newsletter-Formulare)
 * - JS-Template-Reste {{...}} und <% ... %> raus
 * - Encoding-Probleme: Replacement-Char-Cluster werden ersetzt
 *
 * Gibt am Ende strukturierte Plain Text zurück.
 */

const COOKIE_KEYWORDS = /cookie|consent|cmp[-_]?banner|usercentrics|cookiebot|datenschutz[-_]?banner|gdpr/i;

/** Entfernt Tag-Blöcke deren id/class auf Cookie/Consent/Social/Sidebar deuten */
function stripBoilerplateBlocks(html: string): string {
  let h = html;

  // Block-Tags mit verdächtigen id/class entfernen.
  // Wir matchen iterativ, weil die Blöcke verschachtelt sein können.
  const tagBlockRe = /<(div|section|aside|footer|nav|form|dialog)\b[^>]*\b(?:id|class)\s*=\s*"([^"]+)"[^>]*>/gi;
  let m: RegExpExecArray | null;
  let removals: { start: number; end: number }[] = [];

  while ((m = tagBlockRe.exec(h)) !== null) {
    const tagName = m[1].toLowerCase();
    const attrValue = m[2].toLowerCase();
    const isCookieish = COOKIE_KEYWORDS.test(attrValue);
    const isSocialish = /(?:twitter|instagram|facebook|linkedin|youtube|social[-_]?(?:feed|widget))/i.test(attrValue);
    const isSidebar = /(?:sidebar|widget|newsletter|popup|modal|overlay|notification)/i.test(attrValue);

    if (!isCookieish && !isSocialish && !isSidebar) continue;

    // Find matching close tag (handle nesting)
    const startTagEnd = tagBlockRe.lastIndex;
    const closeRe = new RegExp(`<\\/${tagName}\\s*>`, "gi");
    const openRe = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
    closeRe.lastIndex = startTagEnd;
    openRe.lastIndex = startTagEnd;

    let depth = 1;
    let cursor = startTagEnd;
    while (depth > 0) {
      closeRe.lastIndex = cursor;
      openRe.lastIndex = cursor;
      const close = closeRe.exec(h);
      const open = openRe.exec(h);
      if (!close) break;
      if (open && open.index < close.index) {
        depth++;
        cursor = open.index + open[0].length;
      } else {
        depth--;
        cursor = close.index + close[0].length;
        if (depth === 0) {
          removals.push({ start: m.index, end: cursor });
          tagBlockRe.lastIndex = cursor;
          break;
        }
      }
    }
  }

  // Removals von hinten nach vorne anwenden
  removals.sort((a, b) => b.start - a.start);
  for (const r of removals) {
    h = h.slice(0, r.start) + " " + h.slice(r.end);
  }
  return h;
}

/** Entfernt JS-Template-Variablen (Mustache, ERB, EJS, Liquid) */
function stripTemplateSyntax(s: string): string {
  return s
    .replace(/\{\{[^{}]{0,800}\}\}/g, " ") // {{ var.path ? long expression : ... }}
    .replace(/<%[^%]{0,800}%>/g, " ") // <%= var %>
    .replace(/\{%[^%]{0,800}%\}/g, " "); // {% if ... %}
}

/** Twitter-/Instagram-Embeds als blockquote/iframe raus */
function stripSocialEmbeds(html: string): string {
  return html
    .replace(/<blockquote[^>]*\bclass\s*=\s*"[^"]*twitter-tweet[^"]*"[\s\S]*?<\/blockquote>/gi, " ")
    .replace(/<blockquote[^>]*\bclass\s*=\s*"[^"]*instagram-media[^"]*"[\s\S]*?<\/blockquote>/gi, " ")
    .replace(/<iframe[^>]*\bsrc\s*=\s*"[^"]*(?:twitter\.com|instagram\.com|facebook\.com|youtube\.com)[^"]*"[^>]*><\/iframe>/gi, " ");
}

/** Encoding-Salat-Cluster (z.B. "ö" → "�") als Hinweis auf falsches Charset behandeln */
function flagEncodingIssues(s: string): { text: string; issueCount: number } {
  const replacements = (s.match(/�/g) || []).length;
  if (replacements > 5) {
    return { text: s, issueCount: replacements };
  }
  // Single replacement-chars zu space
  return { text: s.replace(/�/g, " "), issueCount: replacements };
}

/** Decodiert die häufigsten HTML-Entities (basic + numerisch) */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&shy;/g, "")
    .replace(/&ouml;/g, "ö").replace(/&auml;/g, "ä").replace(/&uuml;/g, "ü")
    .replace(/&Ouml;/g, "Ö").replace(/&Auml;/g, "Ä").replace(/&Uuml;/g, "Ü")
    .replace(/&szlig;/g, "ß")
    .replace(/&#(\d+);/g, (_, d) => {
      const n = parseInt(d, 10);
      if (n >= 32 && n < 0x110000) return String.fromCodePoint(n);
      return " ";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const n = parseInt(h, 16);
      if (n >= 32 && n < 0x110000) return String.fromCodePoint(n);
      return " ";
    })
    .replace(/&[a-z]+;/gi, " "); // unbekannte entities → space
}

export interface CleanResult {
  text: string;
  encodingIssues: number;
  /** True wenn Text wahrscheinlich kaputt ist (zu kurz, zu viel Boilerplate) */
  suspicious: boolean;
  reason?: string;
}

/**
 * Vollständiger Bio-HTML-Cleaner. Gibt Text + Qualitätssignale zurück.
 */
export function cleanBioHtml(html: string): CleanResult {
  // 1. Sicherheits-Tags entfernen
  let h = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ");

  // 2. Cookie-/Consent-/Social-Banner Blöcke entfernen
  h = stripBoilerplateBlocks(h);
  h = stripSocialEmbeds(h);

  // 3. Header/Footer/Nav (oft Boilerplate)
  h = h
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ");

  // 4. Tags weg
  h = h.replace(/<[^>]+>/g, " ");

  // 5. Entities
  h = decodeEntities(h);

  // 6. JS-Template-Reste raus
  h = stripTemplateSyntax(h);

  // 7. Encoding-Probleme
  const enc = flagEncodingIssues(h);
  h = enc.text;

  // 8. Whitespace normalisieren
  h = h.replace(/\s+/g, " ").trim();

  // Qualitäts-Signal: zu viele Cookie-Wörter im Verhältnis zur Länge
  const wordCount = h.split(/\s+/).length;
  const cookieWords = (h.match(/\b(Cookie|cookies|Datenschutz|JavaScript|GDPR|Einstellungen|Zustimmen|Ablehnen)\b/g) || []).length;
  const rtCount = (h.match(/\bRT @|RT@/g) || []).length;
  const tmplLeftover = (h.match(/\{\{[^}]+\}\}/g) || []).length;

  let suspicious = false;
  let reason: string | undefined;

  if (h.length < 200) {
    suspicious = true;
    reason = `nur ${h.length} chars`;
  } else if (wordCount > 0 && cookieWords / wordCount > 0.04 && h.length < 1500) {
    suspicious = true;
    reason = `${cookieWords}/${wordCount} Cookie-Wörter (${h.length} chars)`;
  } else if (rtCount >= 3) {
    suspicious = true;
    reason = `${rtCount}× "RT @" — Twitter-Feed`;
  } else if (tmplLeftover >= 2) {
    suspicious = true;
    reason = `${tmplLeftover}× JS-Template übrig`;
  } else if (enc.issueCount > 5) {
    suspicious = true;
    reason = `${enc.issueCount}× Encoding-Replacement-Char`;
  }

  return { text: h, encodingIssues: enc.issueCount, suspicious, reason };
}
