# Themen-Granularität — Forschungsgrundlage (deep-research, 2026-06-07)

> **Zweck:** Belegte Evidenzgrundlage für die Frage, wie fein wir Themen/Unterthemen
> aufteilen sollten — für Auffindbarkeit UND das Auslösen serendipitärer Entdeckung
> ("Leser mag Wirtschaft, entdeckt KI, klickt"). Gehört zum Themenfelder-/Homepage-Track.
> Run-ID: wf_eae976e4-f81 · 20 Quellen gefetcht · 85 Behauptungen extrahiert · 25 adversarial
> verifiziert (20 bestätigt, 5 gekillt) · 102 Agenten.
>
> **Dieses Dokument ist die wort-für-wort-Sicherung des Recherche-Ergebnisses (User-Auftrag 2026-06-07).**
> Die verifizierten Behauptungen + Belegzitate sind im englischen Original belassen (Zitiertreue);
> die Anwendung auf unser Produkt steht in der deutschen Synthese am Ende.

---

## Frage (verbatim)

Wie fein sollte man inhaltliche Themen/Kategorien aufteilen, um (a) Auffindbarkeit und vor allem (b) das AUSLÖSEN von Interesse/serendipitärer Entdeckung zu maximieren — konkret für eine Content-/Nachrichten-Plattform, auf der ein Nutzer sein Thema findet ODER ein benachbartes, unerwartetes Thema entdeckt und anklickt?

Konkrete, zitierte Evidenz und wo möglich Zahlen zu: 1) Information Foraging Theory / Information Scent (Pirolli & Card); 2) Mere Categorization Effect (Mogilner, Rudnick & Iyengar 2008) und Nachfolgestudien; 3) Choice Overload (Iyengar & Lepper; Scheibehenne et al. 2010 Meta-Analyse); 4) Breadth-vs-Depth in Informationsarchitektur (Larson & Czerwinski 1998 u.a.); 5) Serendipität/Discovery in Recommender- und Browsing-Systemen.

---

## Summary (verbatim, EN)

For a content/news platform optimizing both findability and serendipitous discovery, the evidence converges on a moderate-breadth, well-labeled, shallow hierarchy rather than either a sparse or a maximally fragmented taxonomy. Categorization itself drives value: for non-expert browsers (the general-news audience), the mere presence of categories increases perceived variety, autonomy, and satisfaction — even when labels are uninformative — but this follows an INVERTED-U: satisfaction rises with more categories up to a threshold, then declines (the over-categorization effect), so finer is not always better. Choice overload is NOT a robust universal effect (meta-analytic mean ≈ zero, D=0.02), meaning showing many topics rarely paralyzes users on its own; the real lever is information scent — users click the link whose label/cue best matches their goal, so clear, content-bearing, jargon-free labels directly govern both targeted findability and discovery of adjacent topics. Concretely, prefer shallow/broad over deep/narrow (depth harms search performance), but cap breadth at a moderate level (the medium-balanced structure outperformed the broadest-shallowest in controlled tests), and engineer beyond-accuracy objectives (diversity, novelty, serendipity = unexpectedness + relevance) to trigger adjacent discovery — while respecting that diversity↔serendipity is non-monotonic, so there is an optimum beyond which extra spread becomes counterproductive.

---

## Verifizierte Befunde (verbatim, EN — mit Belegzitaten + Vote)

### 1. Information scent ist der Hebel vor dem Klick — `high`
**Claim:** Information scent — the user's perception of an information source's value/cost/path from proximal cues (link label, surrounding context, prior experience) — is what users judge before clicking, so label wording is the primary lever for click probability and both findability and adjacent discovery.
**Evidence:** Pirolli & Card (1999), the canonical Information Foraging paper: 'Information scent is the (imperfect) perception of the value, cost, or access path of information sources obtained from proximal cues, such as bibliographic citations, WWW links, or icons.' The label is a proximal stimulus standing in for distal content; scent is computed as the spreading-activation match between cue words and the user's goal, and users follow the highest-scent link. NN/g restates this as a mix of cues from 'the link label, the context in which the link is shown, and their prior experiences.'
**Sources:** https://act-r.psy.cmu.edu/wordpress/wp-content/uploads/2012/12/280uir-1999-05-pirolli.pdf · https://www.nngroup.com/articles/information-scent/
**Vote:** 3-0, 3-0, 3-0 (unanimous, primary + corroborating secondary)

### 2. Vage/Jargon-Labels senken den Scent — `high`
**Claim:** Vague, obscure, or jargon-laden labels lower information scent and cause users to miss otherwise-good content — so label naming directly determines whether a topic is found OR an adjacent one is noticed.
**Evidence:** NN/g: 'If the link name is too obscure and vague, people might miss a good source of information,' and 'Jargon, branded terms, or simply too sophisticated words may end up ignored and may not provide enough understandable cues.' This is the actionable corollary of the primary Information Foraging Theory (Pirolli & Card).
**Sources:** https://www.nngroup.com/articles/information-scent/
**Vote:** 3-0 (secondary source backed by primary theory)

### 3. Mere Categorization Effect (für Laien) — `high`
**Claim:** For non-expert browsers, the mere presence of categories — regardless of label content — increases perceived variety, sense of autonomy, and choice satisfaction. This is the discoverability/satisfaction payoff of splitting content into named topics.
**Evidence:** Mogilner, Rudnick & Iyengar (2008) Mere Categorization Effect (JCR 35(2)): 'the mere presence of categories, irrespective of their content, positively influences the satisfaction of choosers who are unfamiliar with the choice domain'; 'More categories signal greater variety, which enhances consumers' sense of autonomy in choosing.' For SIMPLE products this holds 'irrespective of the actual content of category labels' for novices. Scope: novices/unfamiliar users (fits a general news audience); attenuated for experts.
**Sources:** https://academic.oup.com/jcr/article-abstract/35/2/202/1806103 · https://www.sciencedirect.com/science/article/abs/pii/S014829631100419X
**Vote:** 3-0, 3-0, 3-0 (unanimous, top-tier primary)

### 4. Over-Categorization: umgekehrtes U — `high`
**Claim:** More categories is NOT monotonically better: satisfaction follows an inverted-U (the over-categorization effect) — it rises with more categories up to a threshold, then declines due to perceived overload/regret. This directly bounds how finely topics should be split.
**Evidence:** Yan, Chang, Chou & Tang (2015), J. Business Research 68(3):631-638, three experiments (n=191): 'As the number of categorizations starts to increase from a small one, the level of satisfaction rises accordingly. When the number of categorizations crosses a certain threshold, however, the perceived satisfaction may decrease.' Internally consistent with the Mere Categorization Effect (positive within range; inverted-U overall). Caveat: consumer/shopping domain, single research group.
**Sources:** https://www.sciencedirect.com/science/article/abs/pii/S0148296314002641
**Vote:** 3-0 (unanimous, primary)

### 5. Labels müssen inhaltstragend sein (bei komplexen Entscheidungen) — `high`
**Claim:** The categorization-satisfaction benefit is conditional on label quality for complex/deliberative choices: under rational deliberation only INFORMATIVE (content-bearing) labels reduce novices' perceived difficulty; uninformative 'mere' labels help only for simple products or affective decisions. So for substantive news topics, labels must carry real meaning, not be decorative.
**Evidence:** Mai et al. (2013), J. Business Research 66(7):924-932: 'In the first experiment, for novices, only informative category labels applied to the options reduce perceived difficulty of choosing' for complex products; the mere categorization effect 'does not hold for novices buying complex products' under rational deliberation (uninformative labels re-work only affectively). Boundary condition on the 2008 effect, not a refutation.
**Sources:** https://www.sciencedirect.com/science/article/abs/pii/S014829631100419X
**Vote:** 3-0 (unanimous, primary)

### 6. Choice Overload ist NICHT robust — `high`
**Claim:** Choice overload ('too many topics paralyze users') is NOT a robust universal effect: a meta-analysis found a near-zero mean effect (D=0.02, 95% CI -0.09 to 0.12). Showing many topics rarely deters users by itself — so the constraint on category count comes from the over-categorization sweet spot and scent quality, not from a fear of paralysis.
**Evidence:** Scheibehenne, Greifeneder & Todd (2010), JCR 37(3): meta-analysis of 63 conditions from 50 experiments (N=5,036), 'mean effect size of virtually zero... D p 0.02 (95% confidence interval [CI95] -0.09 to 0.12).' Real between-study variance (t2=0.12) means overload genuinely occurs under some conditions but is not universal. The D=0.02 statistic is reproduced (not disputed) by Chernev et al. (2015); they argue it is the moderators (set complexity, task difficulty, preference uncertainty, decision goal) that matter.
**Sources:** https://scheibehenne.com/ScheibehenneGreifenederTodd2010.pdf
**Vote:** 2-1, 3-0 (statistic verified; interpretation nuanced)

### 7. Overload hängt an fehlenden Präferenzen — Filter/Scent lösen es — `high`
**Claim:** Overload depends on preconditions — chiefly lack of prior preferences/familiarity. Users WITH clear preferences prefer larger assortments and grow MORE satisfied with more options. Implication: good filtering/scent (which supplies the missing preference structure) lets users safely exploit a large topic set.
**Evidence:** Scheibehenne et al. (2010), meta-regression: moderator 'Expertise or prior preferences' b=-.50, z=-2.49, p=.013 (reduces overload); 'decision makers with strong prior preferences or expertise benefit from having more options.' Quoting Chernev (2003): 'people with clear prior preferences prefer to choose from larger assortments and... choice probability and satisfaction increased with the number of options.' Chernev, Böckenholt & Goodman (2015) meta-analysis (99 observations, N=7,202) names preference uncertainty as one of four moderators.
**Sources:** https://scheibehenne.com/ScheibehenneGreifenederTodd2010.pdf · https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf
**Vote:** 2-1, 3-0 (two peer-reviewed meta-analyses)

### 8. Breit-flach > tief-schmal, aber moderat — `high`
**Claim:** Prefer shallow/broad over deep/narrow hierarchies, but cap breadth at a MODERATE level — maximal breadth is not optimal. Increased depth harms search performance, yet a balanced medium structure outperformed the broadest-shallowest overall.
**Evidence:** Larson & Czerwinski (CHI '98), 512 leaf nodes across 8x8x8 (deep), 32x16 (medium), 16x32 (broad/shallow): 'while increased depth did harm search performance on the web, a medium condition of depth and breadth outperformed the broadest shallow web structure overall' (the 16x32 medium beat the 32x16 broadest). UMD HCIL TR 99-15: 'Performance, both in terms of access time and efficiency, decreases as the depth of the menu structure increases'; explicit rule: 'Menu hierarchies should be designed with a minimum depth and maximum breadth if at all possible. Expandable index menus are acceptable only for shallow menu hierarchies or Depth 2 and 3.' Caveat: 1998-2002 studies; principle refined (optimum exists, scrolling/scent costs cap pure breadth), not monotone broader=better.
**Sources:** https://www.microsoft.com/en-us/research/publication/web-page-design-implications-memory-structure-scent-information-retrieval/ · https://www.cs.umd.edu/hcil/trs/99-15/99-15.html
**Vote:** 2-1, 3-0, 2-1, 3-0 (foundational primary HCI)

### 9. Serendipität bewusst bauen (beyond-accuracy) — `high`
**Claim:** To trigger serendipitous discovery of adjacent topics, design explicitly for beyond-accuracy objectives — diversity, novelty, and serendipity (= unexpectedness + relevance) — not just precise retrieval. These levers overcome over-specialization and surface adjacent-yet-relevant topics a user would not have searched for.
**Evidence:** Kaminskas & Bridge (2016), ACM TiiS 7(1): recommendation qualities 'such as whether the list of recommendations is diverse and whether it contains novel items—may have a significant impact on the overall quality of a recommender system.' Kotkov, Wang & Veijalainen (2016) serendipity survey: 'serendipity and novelty help overcome over-specialization by allowing systems to recommend novel and unexpected yet relevant items' — serendipity = unexpectedness + relevance, the exact mechanism of discovering an adjacent unexpected topic. Caveat: derived from recommender lists, extrapolated to browse-menu IA.
**Sources:** https://dl.acm.org/doi/10.1145/2926720
**Vote:** 3-0, 3-0 (peer-reviewed primary/survey)

### 10. Diversität ↔ Serendipität ist nicht-monoton — `medium`
**Claim:** Diversity does NOT simply equal more discovery: the diversity↔serendipity relationship is non-monotonic — increasing diversity can improve OR harm serendipity depending on the magnitude of the increase — implying an optimum beyond which more breadth/spread becomes counterproductive. This is the key cautionary bound on how widely to spread category granularity.
**Evidence:** Kotkov et al. (2018/2020, Computing): 'The increase of diversity can hurt accuracy and hurt or improve serendipity depending on size of the increase.' Establishes the non-monotonic, magnitude-dependent relationship. Caveat: single recommender-algorithm paper; split vote 2-1; transfer to IA category granularity is an analogy. NOTE a related strong-tradeoff framing ('accuracy/serendipity/diversity always trade off') was REFUTED 0-3 — the relationship is non-monotonic, not a strict universal tradeoff.
**Sources:** https://link.springer.com/article/10.1007/s00607-018-0687-5
**Vote:** 2-1 (single primary paper, split)

### 11. Umsetzbare Empfehlung (Synthese, Zahlen interpoliert) — `medium`
**Claim:** Actionable recommendation: keep ONE shallow level of top-level topics (~7-12) with a MODERATE number of visible sub-topics per parent (~5-9, capped well below the over-categorization threshold), informative jargon-free labels, and a deliberate adjacency/serendipity surface (e.g. 'related/nearby topics') — rather than a deep tree or a maximally fragmented flat list.
**Evidence:** Synthesis (not a single quoted number): breadth-over-depth + 'minimum depth, maximum breadth, expandable indexes only at depth 2-3' (HCIL 99-15) sets shallow structure; the medium 16x32 beating the broadest (Larson & Czerwinski) plus the over-categorization inverted-U (Yan et al. 2015) cap per-level breadth at moderate; mere categorization (Mogilner et al. 2008) justifies having named sub-topics at all for novice news readers; informative labels (Mai et al. 2013) + high information scent / no jargon (Pirolli & Card; NN/g) govern naming; beyond-accuracy/serendipity design (Kaminskas & Bridge; Kotkov) supplies the adjacency surface. The specific 7-12 / 5-9 numbers are a defensible interpolation of 'moderate breadth, not maximal' rather than a directly measured optimum for news taxonomies.
**Vote:** derived synthesis (no adversarial vote on the numeric figures themselves)

---

## Gekillte Behauptungen (NICHT verwenden — verbatim)

1. **0-3** — "Perceived variety mediates the impact of categorization number on satisfaction — i.e., adding categories raises satisfaction by increasing perceived variety, the same mechanism the Mere Categorization Effect describes, but it reverses past a threshold." (S0148296314002641)
2. **1-2** — "The benefit of category labels is conditional on user expertise: experts derive no effect from categorization (mere or informative), so the discoverability/scent gain from labels accrues specifically to novices in the domain." (S014829631100419X)
3. **0-3** — "Across a meta-analysis of 63 conditions from 50 published and unpublished experiments (N=5,036), the mean effect size of assortment size on choice overload was virtually zero, with large between-study variance." (chernev.com — Anm.: die D=0,02-Zahl selbst ist via Scheibehenne bestätigt; diese spezifische Formulierung wurde gekillt)
4. **0-3** — "The meta-analysis identified necessary but not sufficient preconditions for choice overload (e.g., no dominant/obviously best option, no prior preferences), and could find no sufficient condition that reliably produces overload." (chernev.com)
5. **0-3** — "Accuracy, serendipity, and diversity are not independent dimensions — they trade off against each other, so a design tuned purely to maximize one will degrade the others." (s00607-018-0687-5) → die Beziehung ist nicht-monoton, KEIN strikter universeller Trade-off.

---

## Offene Fragen (verbatim)

1. What is the empirically optimal category COUNT for a content/news topic taxonomy specifically? The over-categorization threshold and the breadth-per-level optimum are established only in shopping-assortment and 1998-era menu studies; no source measured the inverted-U or breadth optimum on news/topic labels directly.
2. Where exactly is the over-categorization threshold (in absolute number of categories), and does it shift with screen size, mobile vs desktop, or scroll cost? Yan et al. (2015) show the inverted-U exists but do not give a transferable cutoff.
3. How should the adjacency/serendipity surface be tuned to stay inside the non-monotonic 'improves serendipity' zone rather than the 'harms serendipity' zone — i.e. how much topical distance is 'unexpected yet still relevant' for news content?
4. Do the novice-specific categorization benefits and the scent/label effects interact for a MIXED audience (casual readers + experts/journalists), and should the taxonomy expose different granularity to each segment (e.g. progressive disclosure)?

---

## Caveats (verbatim, EN)

Time-sensitivity: the HCI breadth/depth studies (Larson & Czerwinski 1998; Zaphiris/Shneiderman HCIL 99-15, ~1999-2002) are foundational but old; their concrete numbers predate mobile/touch UIs and infinite-scroll patterns. The breadth-over-depth principle is still cited by NN/g but has been REFINED (a moderate structure beat the broadest-shallowest in Larson & Czerwinski's own data), so "maximize breadth" is an over-simplification — there is an optimum, not monotone broader=better. Domain-transfer caveat: the category-count findings (Mere Categorization, over-categorization inverted-U, choice overload) all come from consumer/shopping-assortment experiments (coffee, retail, cell phones), NOT from content/news topic taxonomies; applying them to topic granularity is a defensible analogy, not domain-tested. Scope qualifier: the categorization-satisfaction benefit holds specifically for NOVICES/people UNFAMILIAR with the domain (fits a general news audience) and is attenuated for experts. The choice-overload near-zero average (D=0.02) is robust as a STATISTIC but its interpretation is contested — Chernev et al. argue overload reappears under moderators (set complexity, task difficulty, preference uncertainty, decision goal). The serendipity/diversity non-monotonicity (split vote 2-1) rests on a single recommender-algorithm paper; transferring it to IA category granularity is the synthesizer's analogy. One source has a DOI-formatting slip (Kotkov serendipity survey) but the substance is correctly identified and verified. NN/g is a secondary source but is backed by the primary Pirolli & Card foundation.

---

## Quellen (20 gefetcht)

**Primär (peer-reviewed / Originalstudien):**
- Pirolli & Card 1999, Information Foraging — https://act-r.psy.cmu.edu/wordpress/wp-content/uploads/2012/12/280uir-1999-05-pirolli.pdf
- Mogilner, Rudnick & Iyengar 2008, Mere Categorization Effect (JCR 35(2)) — https://academic.oup.com/jcr/article-abstract/35/2/202/1806103
- Yan, Chang, Chou & Tang 2015, Over-Categorization (JBR 68(3)) — https://www.sciencedirect.com/science/article/abs/pii/S0148296314002641
- Mai et al. 2013, informative vs. mere labels (JBR 66(7)) — https://www.sciencedirect.com/science/article/abs/pii/S014829631100419X
- Scheibehenne, Greifeneder & Todd 2010, Choice-Overload-Meta-Analyse (JCR 37(3)) — https://scheibehenne.com/ScheibehenneGreifenederTodd2010.pdf
- Chernev, Böckenholt & Goodman 2015, Choice-Overload-Meta-Analyse (JCP) — https://chernev.com/wp-content/uploads/2017/02/ChoiceOverload_JCP_2015.pdf
- Larson & Czerwinski 1998 (CHI '98), Breadth/Depth — https://www.microsoft.com/en-us/research/publication/web-page-design-implications-memory-structure-scent-information-retrieval/
- UMD HCIL TR 99-15, Breadth/Depth — https://www.cs.umd.edu/hcil/trs/99-15/99-15.html
- Kaminskas & Bridge 2016, beyond-accuracy (ACM TiiS 7(1)) — https://dl.acm.org/doi/10.1145/2926720
- Kotkov et al. 2018/2020, Diversity↔Serendipity (Computing) — https://link.springer.com/article/10.1007/s00607-018-0687-5

**Sekundär (NN/g & Praxis):**
- https://www.nngroup.com/articles/information-scent/
- https://www.nngroup.com/articles/information-foraging/
- https://www.nngroup.com/articles/better-link-labels/
- https://www.nngroup.com/articles/category-names-suck/
- https://www.nngroup.com/articles/3-ia-mistakes/
- https://www.nngroup.com/articles/intranet-information-architecture-ia/
- https://www.nngroup.com/articles/local-navigation/
- https://www.humanfactors.com/Newsletters/breadth_vs_depth_we_revisit_this_question.asp

---

## Anwendung auf Politik-Radar (deutsche Synthese)

**Belegter Rahmen für unsere Themen-/Unterthemen-Struktur:**

> **~7–12 Oberthemen · ~5–9 SICHTBARE Unterthemen pro Oberthema · Gesamt-Fein-Liste groß (100–150) unbedenklich · Rest aufklappbar · informative, jargonfreie, deskriptive Labels · eine MODERATE „verwandte/angrenzende Themen"-Fläche.**

| Unsere Entscheidung | Korrektur/Bestätigung durch Evidenz |
|---|---|
| Modell B (flache Fein-Ebene, m:n zu Feldern) | ✅ bestätigt — große Gesamtzahl ok, kein Overload (Befund 6) |
| Fein-Liste ~120 | ✅ sicherer Bereich (Befund 6/7) |
| Sichtbar pro Oberthema | ⚠️ auf **~5–9** deckeln (nicht 8–12), Rest „mehr anzeigen" (Befund 4/8/11) |
| Bürger-Oberthemen (aktuell 14–21) | ⚠️ Featured auf **~10–12** trimmen, Rest unter „weitere" (Befund 11) |
| Labels | ✅ deskriptiv/konkret/jargonfrei = Scent **und** Neutralität zugleich (Befund 1/2/5) |
| „Leser sieht KI und klickt" | → **eigene „verwandte Themen"-Fläche** auf Themenseite, moderat dosiert (Befund 9/10) |

**Kern-Lehren in einem Satz:** Labels (nicht die Menge) sind der Hebel; aufteilen hilft Laien; mehr ist nur bis zu einer Schwelle besser; „zu viele Themen lähmen" ist ein Mythos solange Filter/Scent da sind; flach > tief, aber moderat breit; Entdeckung muss man bewusst als Fläche bauen, aber nicht-monoton dosieren.

**Domänen-Vorbehalt (ernst nehmen):** Alle harten Zahlen stammen aus Shopping- und 1998er-Menü-Studien, NICHT aus Nachrichten-Taxonomien. Die exakte Over-Categorization-Schwelle in absoluten Zahlen hat niemand gemessen → unsere 5–9/10–12/120 sind belegte Interpolation, kein gemessenes Optimum. Bei Gelegenheit am eigenen Nutzungsverhalten validieren.

---

## Nächster Schritt (für morgen)

Kompletter **Modell-B-Fein-Listen-Erstentwurf über alle 28 aw_fields** (~120 deskriptiv benannte Unterthemen mit ihren Feld-Zugehörigkeiten m:n) als Arbeitsgrundlage zum Streichen/Ergänzen am konkreten Material. Danach: LLM-Sub-Klassifikations-Pilot auf Wirtschaft (~$0,30, Multi-Label + „Sonstiges"-Flag, Kosten-OK einholen).
