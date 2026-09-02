# Prompt 9 — palette candidates

**Stopped at candidate generation, per instruction — nothing applied yet.** All five
candidates below passed the hard gate (`_shared/harness/src/palette.mjs`'s `gate()`)
before ever reaching a contact sheet; none were shown to you failing. `app/globals.css`
was patched per-candidate, screenshotted, then restored byte-for-byte to the committed
original after every run (`docs/palette-candidates/README.md`'s own generation script,
`scripts/palette-contact-sheet.mjs`, diffs the file back to a backup and asserts it
matches — see that script if you want to re-run this).

`node _shared/harness/src/palette.mjs --seed <n>` reproduces any one of these exactly.
`masterSeed: 42` (`harness.config.mjs`) reproduces the same 5-candidate roll:
`node _shared/harness/src/palette.mjs`.

## The five candidates

| seed | scheme | primary hue | accent hue | neutral tint | CTA contrast | CTA chroma | contact sheet |
|---|---|---|---|---|---|---|---|
| 601103 | split-complementary | 5 | 215 | 0.046 | 6.61:1 | 0.0809 | `candidate-601103.png` |
| 448290 | analogous | 62 | 32 | 0.052 | 7.32:1 | 0.1433 | `candidate-448290.png` |
| 852465 | triadic | 225 | 345 | 0.032 | 7.43:1 | 0.1437 | `candidate-852465.png` |
| 669734 | triadic | 336 | 96 | 0.057 | 6.80:1 | 0.0952 | `candidate-669734.png` |
| 174813 | complementary | 330 | 150 | 0.059 | 6.48:1 | 0.1260 | `candidate-174813.png` |

0 rejected out of 5 rolls (`masterSeed 42`) — every roll passed the gate on the first
try once the two structural fixes below landed; before that fix, 4000/4000 rolls failed
(see "Two fixes" below), so this row is 5/5, not a filtered sample of a larger reject
pile.

Each contact sheet is two rows (1440 width, then 390) × three crops (home hero, home
services-grid, footer), captured live off the running dev server with that candidate's
colours patched in, at `docs/palette-candidates/candidate-<seed>.png`.

## Every candidate's gate result (all pass, all four hard constraints)

Per candidate, `_shared/harness/src/palette.mjs`'s `gate()` checked, using
`harness.config.mjs`'s `pairsInUse` (the fg/bg pairs actually rendered in the build, not
the ramp in theory):

1. **WCAG AA on every pair in use** — `cta-label-on-fill`, `body-text`, `heading-text`,
   `footer-text`, `secondary-button-border`, `error-text`, `focus-ring-vs-halo`. Text
   pairs gated at 4.5:1, UI/border/focus pairs at 3:1.
2. **CTA stays highest-contrast, highest-chroma** — the accent fill is more chromatic
   than every other rotated token, and separates from the page (≥3:1 fill-vs-page) with
   its label readable on the fill (≥4.5:1).
3. **Semantic colours exempt, hue-checked** — `error`/`success` never rotate and their
   hue is asserted to still read as red/green (`harness.config.mjs`'s `semantic`).
4. **Focus ring ≥3:1** — see the two-layer construction below; the ring is checked
   against its actual rendered neighbour, not the raw element fill.

Full per-candidate JSON (`gate.results`, every field) is reproducible via
`node _shared/harness/src/palette.mjs --seed <seed> --emit` (or without `--emit` for the
full JSON including `gate.results`).

## Two structural fixes made to get here (token file + one global CSS rule, nothing else)

The first run rejected **4000/4000** rolls. Both root causes were structural, not
per-candidate bad luck — fixed once, centrally, before generating the five above:

1. **CTA fill was too light for a full hue rotation to hold AA.** The original
   `--color-primary: #c2410c` (`L=0.553` in OKLCH) held only 5.18:1 against white in its
   own (unrotated) orange — comfortable in isolation, but OKLCH hue rotation at fixed
   L/C doesn't preserve sRGB contrast 1:1, and most rotated hues landed at ~4.47:1,
   just under the 4.5 floor. Darkened one step to `#9a3412` (`L=0.470`, 7.31:1 in the
   original hue) — same hue, comparable chroma, enough margin that every rotated hue in
   this batch cleared AA. `--color-primary-strong` moved the same distance, `#7c2d12`.
   `harness.config.mjs`'s `referenceRamp.accent`/`accentDeep` updated to match.
2. **Focus ring was a single flat colour, which cannot hold 3:1 against both a white
   page and an arbitrary saturated CTA fill with one token** — this is called out in
   `palette.mjs`'s own comments as needing a two-layer construction, and the site didn't
   have one yet. Changed `:focus-visible` from a single `outline` to a two-layer
   `box-shadow` ring (inner surface-coloured halo, outer dark ring) in `app/globals.css`.
   The outer ring is now always read against the halo, never directly against the
   element it sits on, so there is exactly one focus pairing to gate
   (`focus-ring-vs-halo`), not one per background.

A third, smaller fix while wiring up `pairsInUse`: the secondary-button/form-input
border was using the **decorative** `--color-border` hairline (`#dde1e3`, ~1.2:1 against
white — fine for a footer rule, a real WCAG 2.2 SC 1.4.11 bug for a control edge a user
has to perceive). Added `--color-border-strong` (`#4b5563`) and pointed every
functional border (Hero/ServiceCard/ReviewsOrCta secondary CTAs, `ContactForm` field
borders) at it; decorative dividers (footer rule, card outlines, the About "TODO(fact)"
chip) kept the original hairline. `harness.config.mjs`'s `secondary-button-border` pair
now checks the token that's actually rendered there.

None of this required touching more than `app/globals.css` (tokens + one global CSS
rule) and `harness.config.mjs` (gate configuration) plus five component files swapping
one class name (`border-(--color-border)` → `border-(--color-border-strong)`) — no
section file, no layout change. If it had needed more than that, the instruction was to
stop and fix token-conformance first; it didn't come to that.

## Next step

Waiting on the pick. Once chosen, the winning candidate's tokens get written into
`app/globals.css` for real (Prompt 9's "apply" step), the geometry/typography regression
table gets re-run to prove nothing but colour moved, and the seed gets recorded as
permanent in `docs/known-divergence.md`.
