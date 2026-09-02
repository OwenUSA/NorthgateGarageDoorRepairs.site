# docs/profile.md — reference profile, breakpoints, axes chosen

`REFERENCE = https://www.fraserroofingllc.com/`. Fetched directly with a normal desktop
UA — no bot wall encountered (plain `curl` and headless Playwright both got `200`), so no
fallback to headed/manual capture was needed.

## STEP A — page profile

Reference is a WordPress site (custom Bootstrap-based theme, no page builder shortcodes,
no `<section>`/`<main>` tags — the theme hand-rolls `role="banner"`/`role="main"`/
`role="contentinfo"` divs instead). It is **not** a one-pager: `/about-us/`,
`/roofing-services/`, `/contact-us/`, `/privacy-policy/` are real distinct URLs. But only
the home page uses repeating page-builder-style bands (`home-section-one`..`five`, plus
one more unlabeled band = 6 content bands + header = 7 sections measured). The four
subpages are close to single WP-article content blobs — `segMode` fell back to a loose
`[role="main"] > *` selector (`/services`, `/contact`) or a bare header-only match
(`/about`, `/privacy`, meaning the rest of the page is one big undivided blob). Practical
effect: `/about` and `/privacy` carry almost no internal structure to clone — they're
built from our own section vocabulary, per the Appendix A one-pager guidance, even though
distinct URLs exist.

Page height / section count / heading count, per route, canonical bp (1440) and BP_SET:

| route (ref path) | h@390 | h@768 | h@1440 | sections | headings | segMode |
|---|---|---|---|---|---|---|
| `/` | 11136 | 8862 | 8229 | 7 | 5 | `.wrapper > div[class*="-section-"]` |
| `/about` (`/about-us/`) | 7555 | 6202 | 5601 | 2 | 5 | fallback (header only) |
| `/services` (`/roofing-services/`) | 12745 | 9707 | 9133 | 4 | 13 | `[role="main"] > *` |
| `/contact` (`/contact-us/`) | 6455 | 5806 | 4730 | 5 | 3 | `[role="main"] > *` |
| `/privacy` (`/privacy-policy/`) | 7652 | 5541 | 5167 | 2 | 10 | fallback (header only) |

Full traces: `.harness/profile/ref-*-{390,430,768,992,1440}.json` (25 files, all
routes × all `allBp` widths, for the record — only 390/768/1440 carry a diff target).

**CSS breakpoints found** (from `@media` mining on the canonical width): Bootstrap's
default ladder — 425, 500, 576, 599(!), 768, 991/992, 1024(!), 1199/1200, 1399/1400 —
plus two odd one-offs at 599 and 1024 that don't match Bootstrap's own scale (likely a
plugin/widget style). None of this changes `BP_SET`; recorded here per the cost-discipline
rule ("note the extras in `docs/profile.md` instead of adding a 4th"). `breakpoints.extra`
in `harness.config.mjs` covers 430 (real-device width) and 992 (the reference's own
`lg` breakpoint) as geometry-only widths.

**Motion**: no scroll-linked motion found — `reducedMotion` was forced during capture and
no per-frame rAF sampling was warranted. The header is `position: relative` at every
width and every scroll depth (`headerAtTop` vs `headerScrolled` states are identical
except for `top` offset) — **not sticky**. This is a density/layout site, not a
choreography one, exactly per the Appendix A prior: skip scroll-linked capture.

**State found**:
- Mobile nav toggle (`#hamburger.js-hamburger`) exists but sits inside
  `.mobile-sticky-header` (desktop `.header-one` is `d-none d-lg-block`, hidden below
  `lg`). The profiler's synthetic click at 390 reported "toggle not clickable" —
  the element is present but needs a real click-target refinement once we build our own
  drawer in Prompt 4/5; not fixable from the profiling side, noted rather than chased.
- Contact form: WPCF7 (Contact Form 7) sidebar form appears on `/about-us/` too, not just
  `/contact-us/`; ours only needs it on `/contact` per D-01/D-05.
- `/contact-us/` embeds **five** separate Google Maps iframes (multi-location grid) — the
  D-02 city-grid pattern reproduced outside `/areas-we-serve/`. Confirms D-02's scrub
  scope: this pattern must not survive on our `/contact` (one coords-only embed only).
- No carousel/video hero — home hero is a static image with an award-badge row; one
  `<iframe>` YouTube embed exists on `/about-us/` only (a testimonial-style video), not a
  hero carousel.
- Nothing behind auth or geo-fencing.

**Fonts** (from declared `font-family` in `@media`-mined CSS): `Figtree` (body) and
`Russo One` (display/heading) — both are open, standard Google Fonts. No self-hosted
licensed font was found, so **D-11's substitution path is not needed here** — both will
be pulled via `next/font/google` directly in Prompt 5. (Assorted icon-font families —
`ryno-service-areas`, `ryno-theme-icons` — are this theme's private icon fonts; per D-11
answer for icon fonts, we use `lucide-react` instead of lifting them.)

**Axes captured vs skipped** (per the harness's three required outputs):
- **Geometry + static appearance** — captured for every route at every `BP_SET` width
  (box, position, z-order, computed color/font/weight/letter-spacing/line-height/borders/
  shadows/radii) via `runProbe`. This is the load-bearing axis for a density/local-services
  site.
- **Responsive** — captured at 390/768/1440 (diff) plus 430/992 (extra, geometry-only,
  per `breakpoints.extra`).
- **Scroll-linked motion** — skipped. Profile found none; forcing `reducedMotion` during
  every capture is deliberate and correct here, not a gap.
- **Text effects** (`h1 span`/split-heading libraries) — not found; headings are plain
  text nodes.
- **Interactive state** — captured: header at-top vs scrolled (not sticky, confirmed
  identical), nav toggle (present, click didn't register — flagged above), form-field
  presence. Hover/active states are skipped below `hoverMinBp` (768) as required; not
  captured yet at all since this is profiling, not the full state-shot pass — that's
  `capture.mjs`'s job in Prompt 5+ once our own build exists to click against.
- **Data-driven lists** — none; all content is static markup, no loading/empty state to
  record.

## STEP B/C — harness built and proven

`harness.config.mjs` created at the site root per `_shared/harness/README.md`'s contract
(`referenceOrigin`, `devPort=3102`, `routeMap` for all 5 routes, `breakpoints.diff=[390,
768,1440]`, `breakpoints.extra=[430,992]`, `concurrency=2`, `thresholds={fidelity:2,
struct:5,token:0}`, custom `sectionCandidates`/`chromeSelectors` for this theme's
tag-less header/footer/section markup — see the file for the exact selectors and why).

Ran, in order, respecting `MAX_AGENTS=2` concurrency and `--route`/`--bp`-capable CLIs:
1. `profile-reference.mjs` — 25 passes (5 routes × 5 widths), all `200`.
2. `capture.mjs --side ref` — 15 passes (5 routes × `BP_SET`), all `200`.
3. `capture.mjs --side ours` — 15 passes against a throwaway static server on port 3102
   (a blank placeholder page per route, deleted after use — not site code, just proof the
   `ours` side of the pipeline resolves and captures). No real app exists yet per Prompt 1
   ("no page code until it works").
4. `diff.mjs` — 75 rows written to `docs/divergence.md`: reference vs. the empty
   scaffold. 51 FAIL / 1 BLOCKED (token check with no token set yet, expected) / the rest
   UNPAIRED/UNDECLARED — exactly what an empty scaffold should produce. This proves the
   instrument runs end-to-end (capture → segment → pair → measure → rank) before any real
   component exists.

All three required diff modes are wired: FIDELITY (pixel/structural per `fidelityMode:
'auto'`), ADAPTED (structural deviation %, colour excluded), NOVEL (token violations,
currently `BLOCKED`/`-1` because no token file exists yet — resolves in Prompt 5).

Raw traces: `.harness/profile/*.json`, `.harness/cap/{ref,ours}/*/meta.json` + section
PNGs, `.harness/diff/*.json`, `docs/divergence.md`.
