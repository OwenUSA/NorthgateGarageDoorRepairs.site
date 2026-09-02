# @garage/harness

Site-agnostic clone-and-adapt measurement harness. **Share the instrument, never the
output.** This package carries no business facts, no reference URL, no selector tuned to
one site's markup, no route list, no palette, no copy. Every one of those lives in a
`harness.config.mjs` at the consuming site's root, loaded by `src/config.mjs`.

If you are about to add a selector, a route, a colour, a threshold, or a slot rule to a
file under `src/`, it belongs in that site's `harness.config.mjs` instead.

## Running it

Run every script with the site directory as `cwd`:

```bash
cd my-site.example/
node ../_shared/harness/src/profile-reference.mjs
node ../_shared/harness/src/capture.mjs --side ref --all
node ../_shared/harness/src/capture.mjs --side ours --all
node ../_shared/harness/src/diff.mjs
```

`src/config.mjs` resolves `process.cwd()` as the site root and looks for
`harness.config.mjs` there. If it's missing, every script fails loudly rather than
silently running against nothing (or against another site's leftover data).

### Consistent CLI

`capture.mjs`, `diff.mjs`, `profile-reference.mjs`, `refcopy.mjs`, `assets.mjs`, and
`inventory.mjs` all share one flag set, parsed by `parseArgs()` in `src/lib.mjs`:

| flag | meaning |
|---|---|
| `--route <r>` | one of our routes (e.g. `/about`); omit for every route in `cfg.routeMap` |
| `--bp <n>` | one breakpoint width; omit for `cfg.breakpoints.diff` |
| `--all` | use `cfg.allBp` (diff + extra breakpoints) instead of just the diff set |
| `--side ref\|ours` | which side to operate on, where applicable |
| `--json` | machine-readable output on stdout, in addition to the usual files |

### Tests

```bash
npm test        # node test/selftest.mjs
```

No live site, no network. Synthetic fixtures only — small hand-built meta objects and a
tiny HTML page rendered via Playwright's `page.setContent()`.

## harness.config.mjs — the contract

Create this file at the site root. `src/config.mjs`'s `DEFAULTS` object documents every
field's shape and default; only `referenceOrigin`, `devPort`, and `routeMap` are strictly
required (loadConfig() throws if they're missing or empty). Everything else falls back to
a sane, framework-neutral default.

| field | shape | what it drives |
|---|---|---|
| `referenceOrigin` | `string` (**required**) | the reference site's origin, e.g. `https://example.com` |
| `devPort` | `number` (**required**) | our local dev server's port |
| `headless` | `boolean` | Playwright launch mode |
| `locale`, `timezone`, `userAgent` | `string` | Playwright context options |
| `concurrency` | `number` | hard cap on parallel browser pages |
| `breakpoints.diff` | `number[]` | the only widths that carry a pass/fail threshold |
| `breakpoints.extra` | `number[]` | geometry-only widths, never a diff target |
| `breakpoints.canonical` | `number` | the width whose section ids are the identity everything else pairs back to |
| `routeMap` | `{ [refPath]: ourRoute }` (**required**) | THE ONE route map. `cfg.ourRoutes` and `cfg.refForRoute()` are derived from it — never duplicate it |
| `sectionCandidates` | `string[]` | CSS selectors tried in order by `segmentSections()`; first to yield ≥2 outer bands wins |
| `chromeSelectors` | `string[]` | **exact** tag/id/class selectors for header/footer-type chrome. `loadConfig()` throws if any contains `[class*=...]` — see defect #1 below |
| `headerSelector`, `navToggleSelector`, `drawerSelector`, `ctaSelector`, `logoSelector` | `string` | site-shell selectors used by capture/profile state-shots |
| `identityAttr` | `string` | the attribute our own components use to declare which reference section they replace, e.g. `data-section` |
| `iconFontFamilies` | `RegExp` | matches icon-font families for `assets.mjs`'s glyph inventory |
| `minBandHeight`, `chromeArtifact`, `maxClipHeight`, `hoverMinBp`, `drawerMaxBp`, `stickyEngageScrollPx` | numbers/object | segmentation and capture tuning — see `DEFAULTS` for exact semantics |
| `thresholds.fidelity/struct/token` | `number` | pass/fail thresholds per divergence class |
| `fidelityMode` | `'pixel' \| 'structural' \| 'auto'` | how FIDELITY sections are measured — `'auto'` reproduces the original behaviour (colour-excluded structural, since a randomized palette makes a solid-colour band unwinnable under pixel diff) |
| `rootFontPx` | `number` | rem/em → px conversion base for token normalisation |
| `tokenSources` | `string[]` | candidate paths (relative to site root) to scan for an `@theme` block |
| `contractPath` | `string` | path to the route × section × class table (`docs/sections.md`-shaped) |
| `reportPath` | `string` | where `diff.mjs` writes the ranked divergence table |
| `copyModulePath` | `string` | path to the module exporting our own copy (`content/copy.ts`-shaped) |
| `industryAllowlist` | `string[]` | phrases exempt from the lexical-lift gate, stripped longest-first |
| `gramN`, `trigramMax`, `lengthTolerance` | `number` | lexical-gate parameters |
| `lengthExempt` | `{ [key]: reason }` | keys `"<route>::<section>"` or `"*::<section>"`; exempt rows always report `EXEMPT`, never `PASS` |
| `referenceRamp` | `{ [tokenKey]: hex }` | the reference's extracted colour ramp, structure to preserve under hue rotation |
| `pairsInUse` | `[{ name, fg, bg, min, kind }]` | fg/bg pairs actually rendered; `bg` may be `{ gradient: [stopA, stopB] }`, gated on the worst of `gradientSamples` interpolated points |
| `gradientSamples` | `number` | sample count for gradient-pair gating |
| `masterSeed` | `number` | default seed for `selectPalette()` |
| `semantic` | `{ error, success, warning, ... }` | colours exempt from hue rotation |
| `slotRules` | `[{ match: RegExp, id, sec, prov, note }]` | asset → our-slot classification, checked in order |
| `badgePatterns` | `[{ match: RegExp, idPrefix, sec, note }]` | fallback classification for badge/certification grids |
| `sharedSlots` | `{ [slotId]: true }` | slots that repeat identically across every route (e.g. the header logo) and collapse to one inventory row |
| `selftestFixture` | any | reserved; unused by the shared harness itself |

## The seven defects this instrument exists to catch

Each is preserved verbatim (logic + explanatory comment) in the source and asserted by
`test/selftest.mjs`. Do not "clean up" any of these without re-reading why they're there.

1. **Chrome-set construction** (`src/probe.mjs`, `segmentSections()`) — exact tag/id/class
   selectors only, never `[class*=...]`, plus filtering out `document.body` /
   `document.documentElement` before the containment dedup. A substring matcher once
   matched `<body class="pb-callbar">`, which pulled BODY into the chrome set; dedup then
   deleted HEADER and FOOTER because BODY contains them. `config.mjs` also refuses to load
   a `chromeSelectors` entry containing `[class*=`.
2. **Identity-first pairing** (`src/diff.mjs`, `pairSections()`) — PASS 1 pairs on declared
   identity (`data-section` / our emitted id), never position. PASS 2 (page-progress
   fallback) is globally-best-first, not sequential. A position join silently mispairs any
   build that deliberately reorders sections.
3. **Canonical-id resolution** (`src/diff.mjs`, `pairSections()` + `buildClassResolver()`)
   — pairing resolves back to the id at `cfg.breakpoints.canonical`, never the raw
   per-breakpoint id, because a band can split at a narrower width and shift every id after
   it. Unmatched sections report `UNMATCHED`/`UNPAIRED` with a `null` value, never a
   fabricated 100.
4. **Token value normalisation** (`src/diff.mjs`, `normLength()`/`normColor()`) — used in
   both `loadTokens()` and `tokenViolations()` so `oklch(50.95% ...)` and
   `oklch(0.5095 ...)` compare equal, and rem/em resolve to `cfg.rootFontPx`. `weight`
   bypasses `normLength` entirely — running it through would turn `400` into `"400px"`.
5. **Shadow geometry** (`src/diff.mjs`, `shadowGeometry()`) — strips colour, then drops
   empty ring/inset slots (`"0px 0px 0px 0px"`) that a CSS framework emits but that draw
   nothing; returns `'none'` if nothing real remains.
6. **Border-style at zero width** (`src/diff.mjs`, `borderStyleOf()`) — sums all four
   border widths and reports `'none'` unless at least one is > 0, because preflight CSS
   sets `border-style: solid` even at `0px`.
7. **Visible-only counts** (`src/probe.mjs`, `listCounts` inside `PROBE`) — only elements
   with both width and height > 0 are counted. A `display:none` control is DOM, not layout.

## Section segmentation — one implementation

`src/probe.mjs` exports the ONE `segmentSections(cfg)`. `PROBE` (the full page probe),
`assets.mjs`'s asset probe, and `refcopy.mjs`'s copy extractor all call it via
`evalWithSegmentation(page, fn, cfg)` rather than re-implementing band detection. Playwright
only serializes the function text passed to `page.evaluate()` — not its closures — so
composing two in-page functions requires stitching their source together at the call site;
that's what `evalWithSegmentation()` does. Do not add a second segmentation implementation
anywhere in this package.

## Comparator weighting

`src/diff.mjs` splits ADAPTED/structural-FIDELITY fields into BLOCKING (contributes to the
deviation % and can fail a row: box geometry, type, spacing, borders/shadows/radii
geometry) and ADVISORY (`innerCount`, `innerRows`, `innerCols`, `position` — computed and
reported via a trailing `advisory:` note, never counted, never a failure). Inner-grid parity
compares our clean markup against a page-builder's nested column tree and is unclosable by
construction; on the original build it was the majority of every residual and drowned real
defects. Colour is excluded from structural measurement entirely (a randomized palette
would otherwise fail every ADAPTED section on day one).

## What's deliberately NOT here

- Any reference URL, route, selector, threshold, palette, or copy string.
- `contrast.mjs` / `rendertruth.mjs` — written separately, not part of this refactor.
- A component library, scroll-hijacking library, or hosted diff service — see the
  consuming site's own `CLAUDE.md` for its dependency allowlist; this package doesn't
  enforce one.
