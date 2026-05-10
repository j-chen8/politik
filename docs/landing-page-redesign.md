# Landing-Page-Redesign — Research & Ideen-Backlog

> Erstellt 2026-05-09. Basis: Web-Recherche zu UX-Best-Practices 2024-2025, Civic-Tech-Vergleich (abgeordnetenwatch, GovTrack, ProPublica, Correctiv), Attention-Studien, KI-Trust-Forschung. Vollständige Quellen-Übersicht am Ende.

## Ausgangslage (`src/app/design/linear/page.tsx`)

Aktuelle Sektionen:
1. **Hero** — Headline + Stats-Subline + Search
2. **Pop-Hero** — „Drei Abstimmungen mit hauchdünner Mehrheit" (3 Polls-Cards)
3. **Stats-Strip** — Politiker / Parteien / Parlamente / Wahlperiode (4 Zahlen)
4. **Feature-Cards** — 5 Funktions-Kacheln (Politiker / Plenarprotokolle / Abstimmungen / Drucksachen / Nebeneinkünfte)
5. **Trust-Pitch** — „Mehrfach geprüft durch KI"

Beobachtetes Problem: User-Hypothese ist „die Landing wirkt steril, niemand scrollt runter". Pop-Hero MVP wurde als Variant B comitted (`a74a1e6`), aber nur 1 von 3 geplanten Pop-Karten-Typen ist drin (Polls); Reden + Vote-Mismatch fehlen.

---

## Drei zentrale Befunde

### 1. „Daten zeigen, dann bleibt jemand" funktioniert nicht
Die aktuelle Landing fragt sinngemäß „Hier sind viele Daten — willst du was?" Das ist kein Civic-Tech-Hook. Bewährte Pattern: **Personal-Local-Anchor** („Wer vertritt mich?"). abgeordnetenwatch + GovTrack + TheyWorkForYou nutzen das als Master-Hook und sind die einzigen mit nachgewiesener Stickiness in dieser Branche (mySociety-Forschung). Stats / KI-Pitch / Methodik sind „zweite-Tour-Argumente" für User die schon hängen.

### 2. Aufmerksamkeits-Ökonomie ist real, aber differenzierter als der Mythos
- **35% der Desktop-User scrollen NICHT** (Chartbeat 2024). Alles unter Fold ist für 1/3 unsichtbar.
- **72% Pageviews mobile** — Hook in den ersten 2 Bildschirm-Höhen pflicht.
- **„8-Sekunden-Goldfisch ist BS"** (UChicago, 20-Jahre Längsschnitt). Aufmerksamkeit ist *stabil*. Was sich änderte: Toleranz für Fragmentierung. Tiefe geht weiterhin, aber jeder Viewport muss ein Versprechen einlösen („weil-darunter-..."). 
- **Hick's Law**: aktuell konkurrieren Search + Polls + Stats above-the-fold. Mehr CTAs = weniger Aktion. Eines muss zurück.
- **Erste Impression in 50 ms** — drei subconsciente Fragen: *Is this for me? Can I trust this? What do I do next?*

### 3. KI-Disclosure-Paradox
- „Powered by AI"-Hinweis allein **kostet** Trust (KU-Studie + Reuters Institute).
- Mit verlinktem Audit-Trail wird KI zum Differenzierer (The Markup „Show Your Work", ProPublica Methodology-Pages).
- Wikipedia-Forschung: nur ~1.2% klicken Citations, aber *Sichtbarkeit* der Quellen-Architektur signalisiert Auditierbarkeit, hebt Trust messbar bei den Wenigen die hovern → klicken → prüfen.

→ Konsequenz: Methodik-Sektion **prominent** linken, nicht im Footer verstecken. Bei jeder LLM-aufbereiteten Zahl ein „(Methodik)"-Mikro-Link.

---

## 12 priorisierte Ideen (Impact / Aufwand)

### 🟢 Quick Wins (hoch / niedrig)

#### 1. Search-as-Hero mit PLZ-Standardprompt
- Hauptelement im Hero, nicht Begleiter
- „Wer vertritt 12345?" als Placeholder
- abgeordnetenwatch macht das, GovTrack macht das — Personal-Result-Promise ist der stärkste Civic-Hook

#### 2. Latest-Activity-Strip statt 4-Stats-Strip
- Horizontale Lane: „Heute im Bundestag: 3 Reden · 1 Abstimmung · 2 neue CV-Updates"
- Klickbare Ticker, jeder linkt direkt zur Aktivität
- Macht die Site *lebendig*, ersetzt sterile Zählerei
- Direktes Recency-Signal an Datenjournalist:innen

#### 3. EIN primärer CTA above-the-fold
- Search im Hero, Pop-Hero-Polls als Viewport 2 (nicht parallel)
- Hick's Law: aktuell konkurrieren Search + Polls + Stats — Search gewinnt

#### 4. „Wie verlässlich ist diese Zahl?"-Mikro-Link
- Kleines `(Methodik)` neben jeder LLM-aufbereiteten Größe
- Linkt zu Audit-Page mit Modell, Date, Sample, Gold-Set, bekannte Limitations
- Wikipedia-Style Trust-Architektur: 99% klicken nicht, 1% prüfen, 100% sehen *dass es prüfbar ist*

### 🟡 Mittlerer Aufwand, hoher Impact

#### 5. Eigene `/methodik` Top-Nav-Sektion (Show-Your-Work-Pattern)
- Existiert teils unter `/design/linear/methodik`, sollte aber Top-Nav-Eintrag sein
- Pipeline-Beschreibung, Modell-Versionen, Cost-Logs
- **Limitations prominent** statt versteckt (Stage-5-Recall ~13% etc.) — The-Markup-Strategie

#### 6. Single-MdB-Spotlight statt 5 Feature-Cards
- Eine rotierende „Diese Woche im Fokus"-Karte pro MdB
- 1 prominentes Zitat + 1 Daten-Fact (z.B. „Anwesenheit 89%, 12 Reden zur Asylpolitik")
- Storytelling-Forschung: Single-Character-Eingang schlägt 5-Feature-Liste in Empathie/Recall (NYT „342,000 Swings Later, Derek Jeter…"-Pattern)

#### 7. Mobile-First-Redesign der ersten 2 Viewports
- 72% Pageviews mobil — aktuelle Landing ist Desktop-orientiert
- Auf 375px-Width: Search + 1-Satz-Promise + Latest-Strip in zwei Bildschirmen
- Stats-Strip (4 Zahlen) sind auf Mobile besonders steril

### 🟡 Mittel / Mittel

#### 8. „Mein Wahlkreis"-Bookmark (lokaler Storage, kein Konto)
- Nach erstem PLZ-Search Soft-Prompt „Wahlkreis merken?"
- Hook-Modell-Investment-Phase: macht aus Drive-by einen Re-Visit
- Kein Konto = niedrige Hürde, DSGVO-trivial

#### 9. Bento-Grid für Sektion 2
- Statt 5 gleichgroßer Feature-Cards: funktionale Hierarchie sichtbar
- 1 große (Wahlkreis-Personalisierung) + 2 mittlere (Latest-Reden, Vote-Topic-Mapping) + 3 kleine (CV-Updates, Foto-Coverage, Pipeline-Status)

#### 10. „Falsche Zahl gefunden?"-Crowd-Affordance (à la Correctiv)
- Audit-Trail allein ist passiv
- „Diese Aussage prüfen / Hinweis melden"-Affordance an jedem Profil
- Macht User zu Mit-Auditoren — stärkstes Trust-Signal bei KI-Inhalten

### ⚪ Niedrig / Niedrig — experimentell

#### 11. Scroll-driven Reveal-Animation für Stats-Counter
- Nur Counter-Up beim ersten View, sonst nichts
- `prefers-reduced-motion` zwingend
- Verleiht Lebendigkeit ohne Show-Effekt

#### 12. Variable Display-Font für Headline
- Charakterstarke Variable-Face nur in der größten Headline (>32px)
- Body bleibt System-Sans
- Differenzierung gegen Behörden-Look (Bundestag.de) ohne Marketing-Sleek

---

## Anti-Empfehlungen

| Anti-Pattern | Warum |
|---|---|
| **Kein Brutalist-Hero** | Schreckt Bürger:innen ab, untergräbt Trust für ältere Zielgruppen |
| **Keine Stats ohne Frage** | „631 Profile · 9913 Reden" ist Tot-Information. „9913 Reden, jede zur Quelle verlinkbar" wäre Information |
| **Kein „powered by AI"-Marketing-Banner** | Disclosure-Paradox: Mit-AI-Hinweis ohne Audit-Trail kostet Trust |
| **Keine Newsletter-Wall above-the-fold** | abgeordnetenwatch macht das aggressiv — das ist deren Geschäftsmodell, ihr seid Pre-Förderantrag-Plattform mit anderem Vertrauens-Vertrag |

---

## Trends ehrlich eingeordnet

| Trend | Substanz? | Eignung politik.de |
|---|---|---|
| **Bento-Grid** | Ja — modular, scannbar. „47% Dwell-Time"-Claims aus Marketing mit Vorsicht | Geeignet wenn Karten unterschiedliche Größen + Funktionen haben (nicht 5 gleiche) |
| **Brutalist / Neo-Brutalist** | Hype mit Substanz-Kern (Performance, kein Marketing-Sleek). ABER: kalt, schroff | Nur dosiert. In Methodik/Audit-Sektionen ja, im Hero nein |
| **Scroll-driven Animations** | Echt gut seit Chrome native API (Dec 2024). GPU-accelerated. Safari fehlt | Sparsam. Reveal-Counter für Stats ist legitim, alles darüber ist Distraktion |
| **Variable Typography** | Ja, technisch (kleinere Files, fluide Anpassung) | Headline ja, Fließtext bleibt System-Font |

---

## Schlussbeobachtung (kritisch)

> Das Stat-Strip-Problem ist real, aber die Lösung ist **nicht** „Stats animieren" oder „Stats wegnehmen". Die Lösung ist: **Die Landing muss eine Frage stellen, die der User für sich selbst beantworten will.** GovTrack/abgeordnetenwatch fragen „Wer vertritt dich?" — das funktioniert. Eure aktuelle Landing fragt sinngemäß „Hier sind viele Daten — willst du was?" — das funktioniert nicht. Der einzige Civic-Tech-Hook der nachweislich Stickiness erzeugt, ist Personal-Local-Anchor. Alles andere (KI-Pitch, Methodik, Schönheit) sind *zweite-Tour-Argumente* für User die bereits hängengeblieben sind.

---

## Empfohlener nächster Schritt

Mit Ideen **#1 (Search-as-Hero mit PLZ)** + **#2 (Latest-Activity-Strip)** + **#3 (CTA-Hierarchie aufräumen)** + **#4 (Methodik-Mikro-Links)** lässt sich in einer Session das Landing-Bild signifikant ändern — alle vier sind hoch-Impact / niedrig-Aufwand.

Idee **#6 (Single-MdB-Spotlight)** ist die nächste Stufe wenn die Quick Wins sitzen — ersetzt die Feature-Cards durch ein lebendigeres Eingangs-Element.

---

## Quellen

### UX-Forschung (NN/g, Smashing, Studien)
- https://www.nngroup.com/articles/scrolling-and-attention/
- https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- https://www.nngroup.com/articles/homepage-design-principles/
- https://www.nngroup.com/articles/progressive-disclosure/
- https://www.nngroup.com/articles/search-visible-and-simple/
- https://www.smashingmagazine.com/2024/04/f-shape-pattern-how-users-read/
- https://lawsofux.com/hicks-law/
- https://uxarmy.com/blog/first-impressions-the-case-of-landing-pages/
- https://landingi.com/landing-page/41-best-practices/

### Attention / Scroll-Forschung
- https://www.fastcompany.com/91023619/8-second-attention-span-is-bs-this-is-why
- https://glasp.ai/articles/attention-span-crisis
- https://chartbeat.com/resources/customer/a-closer-look-at-desktop-vs-mobile-engagement/
- https://chartbeat.com/wp-content/uploads/2024/04/ChartbeatxPoool-Whitepaper-Engagement-KPIs-Optimize-Conversion-Rates.pdf
- https://chartbeat.com/resources/general/increase-return-visits-news-sites/

### Civic-Tech / Politische Daten
- https://www.abgeordnetenwatch.de/
- https://www.bundestag.de/
- https://research.mysociety.org/html/who-benefits/
- https://gijn.org/stories/correctiv-germanys-first-nonprofit-newsroom-leads-with-innovative-journalism/
- https://www.lenfestinstitute.org/solutions-resources/german-property-records-are-not-publicly-available-but-the-investigative-newsroom-correctiv-turned-to-readers-to-help-collect-data/
- https://en.wikipedia.org/wiki/FiveThirtyEight

### Trust / KI-Disclosure
- https://news.ku.edu/news/article/study-finds-readers-trust-news-less-when-ai-is-involved-even-when-they-dont-understand-to-what-extent
- https://reutersinstitute.politics.ox.ac.uk/rebuilding-trust-journalisms-role-ai-driven-world
- https://www.sciencedirect.com/science/article/pii/S0749597825000172
- https://trustingnews.org/trustkits/ai/
- https://themarkup.org/about
- https://pressthink.org/2017/12/show-work-new-terms-trust-journalism/
- https://www.propublica.org/article/why-propublica-redesign
- https://www.propublica.org/article/google-ads-misinformation-methodology
- https://arxiv.org/pdf/2001.08614

### Storytelling / Engagement
- https://www.informationisbeautifulawards.com/news/118-the-nyt-s-best-data-visualizations-of-the-year
- https://gijn.org/stories/2024-editors-pick-best-data-journalism/
- https://www.storybench.org/scrollytelling-innovation-new-york-times-journalists-on-climate-change-visualization-and-intense-teamwork/
- https://www.nirandfar.com/how-to-manufacture-desire/
- https://amplitude.com/blog/the-hook-model

### Trends (Bento, Brutalist, Scroll, Type)
- https://desinance.com/design/bento-grid-web-design/
- https://www.toptal.com/designers/ux/minimalist-brutalist-web-design
- https://www.todaymade.com/blog/brutalist-web-design
- https://developer.chrome.com/blog/scroll-animation-performance-case-study
- https://www.smashingmagazine.com/2024/12/introduction-css-scroll-driven-animations/
- https://www.frontendtools.tech/blog/modern-web-typography-techniques-2025-readability-guide
