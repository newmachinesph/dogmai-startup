# DOGM.AI — startup website

![License: MIT](https://img.shields.io/badge/license-MIT-blue) ![HTML](https://img.shields.io/badge/HTML5-static-orange) ![JavaScript](https://img.shields.io/badge/vanilla-JS-yellow) ![CSS](https://img.shields.io/badge/CSS3-no%20build-blue)

A 25-page, backend-free startup website for **DOGM.AI** — white-label AI
infrastructure for spiritual practitioners — built from the company's
seven-year strategic market map (2026–2033).

## Stack

- **Zero backend, zero build step.** Hand-authored HTML + CSS + vanilla JS.
- **All content is data-driven** from `/data/*.json` (13 files): navigation,
  pricing, roadmap, market charts, competitor matrix, FAQ, journal, careers,
  research findings, testimonials.
- Charts are rendered client-side (`assets/js/render.js`) from JSON chart
  configs with hover tooltips and a "View data" table fallback per figure.
- Ambient art (astrological chart-wheel canvas, starfields, rotating
  attestation seal) is generated at runtime in `assets/js/main.js`; all
  animation respects `prefers-reduced-motion`.

## Run it

Browsers block `fetch()` of local JSON over `file://`, so serve the folder:

```bash
python3 -m http.server 8000
# or
npx serve
```

then open <http://localhost:8000>. (Opening `index.html` directly shows a
banner with the same instructions.) The site is fully static — it deploys
as-is to GitHub Pages, Netlify, Vercel, or any object store.

## Pages (25)

| Area | Pages |
|---|---|
| Core | `index` · `platform` · `pricing` · `practitioners` |
| Platform modules | `verified-human` (Attest) · `voice-models` · `payments` (Commerce) · `synthesis` (+ Memory) · `compliance` (Guardrails) |
| Insight | `market` · `competitors` · `roadmap` · `research` |
| Company | `about` · `manifesto` (the Covenant) · `investors` · `careers` · `contact` · `faq` |
| Journal | `blog/index` + 4 essays |
| Utility | `legal/index` · `404` |

## Design system

Committed single dark theme — "a gilded almanac on violet-black ink":

- **Inks** `#0B0912 → #201A31` (violet-biased near-blacks) · text `#EDE8DC`
  (warm bone) · accent `#D2A44C` (brass gold) · `#8FB39C` (verdigris,
  reserved for "verified" state)
- **Type** Instrument Serif (display; italics mark *human* words) ·
  Archivo (body) · IBM Plex Mono (folios, data, eyebrows)
- **Chart palette** (validated with the dataviz skill's `validate_palette.js`
  against surface `#181425`): gold ordinal ramp `#F3E2BD→#8E6B2A` for
  magnitude (all checks pass), reference categorical trio
  `#3987E5 / #D95926 / #199E70` for multi-series (all-pairs CVD-safe),
  emphasis charts use gold + de-emphasis gray `#46405A`.

Content honesty: market figures on the site come from the underlying research
report (Pew, IBISWorld, statute texts); vendor projections and low-confidence
datapoints are flagged as such on the page, mirroring the report's caveats.
Design-partner quotes, names, and the "design partner" cohort are fictional placeholders for a concept site, not real customers.

## Structure

```
*.html        25 pages (root, blog/, legal/)
data/*.json   all site content and chart configs
assets/css    style.css (single dark theme)
assets/js     main.js (nav, ambient art), render.js (charts)
```

## License

[MIT](LICENSE) (c) 2026 DOGM.AI
