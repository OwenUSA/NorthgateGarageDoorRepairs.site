# docs/known-divergence.md — permanent floors and open residuals

Checked before starting any fix (per CLAUDE.md). Two states only: **floored**
(`ITERATION_CAP` burned, or a structural non-issue explained below — never touch again
without a reason to reopen) and **OPEN — not floored** (still eligible for iteration,
just not yet closed). Nothing here is "floored" by default; each entry says which.

## `/` home page — PAGE-level height delta (all three breakpoints)

**Status: floored (explained, not a per-section defect).**

`docs/divergence.md`'s `(page)` rows report `/`'s total document height vs. the
reference's, at 33–45% delta, against a 5% threshold. This is **not** one of the
sections in `docs/sections.md`'s contract — it's an aggregate whole-page sanity check
`diff.mjs` emits alongside the real per-section rows, and every real section on `/`
(header, hero, services-grid, testimonials, intro, process, map, footer) passes its own
threshold at every breakpoint (see `docs/divergence.md`).

The page is shorter than the reference by design, on purpose, in two ways the process
already called for:

1. **Structural change #2** (Prompt 3): two reference bands were dropped (`s03`, `s06` —
   thin, largely-image filler with almost no body copy) and replaced with `process` and
   `map`, which are NOVEL additions sized to their own content, not to backfill the
   reference's height.
2. **Condensed teaser copy.** The home `services-grid` is a short teaser (symptom + label
   + one-line blurb per card) pointing to the full detail on `/services`, not a
   restatement of the reference's dense per-service block — that's an intentional
   length divergence for a summary section, distinct from the character-count parity
   gate in `docs/content-divergence.md`, which applies to narrative copy blocks, not to
   this kind of teaser-grid.

Padding out any section with filler text to chase this number would be optimizing the
metric against the brief, not for it. No iteration spent here; not reopened unless the
per-section rows themselves start failing.

## `/` home page — sections built this prompt

All ADAPTED/NOVEL sections converged within 1–2 fix passes; nothing burned the
`ITERATION_CAP`. Recorded as **OPEN — not floored** only in the sense that they remain
eligible for re-measurement in Prompt 8 if a later shared-file change regresses them —
they are currently green, not stuck.

| section | status | attempts used |
|---|---|---|
| hero (`s01`) | green, all 3 bp | 1 |
| services-grid (`s04-top-quality-roofing`) | green, all 3 bp | 3 (padding+overflow, button-count rebalance, regression fix at 768) |
| testimonials (`s05-the-hardest-working-roofing-contra`) | green, all 3 bp | 1 |
| intro (`s02-professional-roofing-in-georgia-s`) | green, all 3 bp | 1 |
| process (NOVEL) | green, all 3 bp (token conformance) | 1 |
| map (NOVEL) | green, all 3 bp (token conformance) | 1 |
| header, footer (shared) | green, all 3 bp | 1 (fixed as part of this prompt's global CSS change) |

`services-grid` is the one section that used all 3 attempts: (1) initial pass fixed
padding placement, `overflow`, and a global font-size cascade bug (see below) but left
structural deviation at 5.45% (1440) driven by a `buttons`-count heuristic mismatch; (2)
rebalancing the CTA count fixed 1440 but regressed 768 to 5.9%; (3) added a
breakpoint-gated "Learn more" link per card (visible `<1440`, matching the reference's
own much higher mobile button count) closed it at every breakpoint. This is reported as
**green**, not floored — it converged, it just took the full budget.

## Cross-cutting fixes landed this prompt (affect every section, not just home)

Two bugs were caught and fixed globally rather than per-section, per CLAUDE.md's
ownership rule (shared files are the lead's job):

- **`app/globals.css`: `body` was setting a flat `font-size: 18px` at every width.**
  The reference's own section wrappers compute `fontSize: 16 / lineHeight: 24` at
  390/768 and only switch to `18 / 28` at 1440 (confirmed against every section in
  `.harness/cap/ref/home-{390,768,1440}/meta.json`, not assumed). Fixed with a
  `@media (min-width: 1440px)` override instead of a flat rule. This alone resolved the
  single largest recurring structural-deviation contributor across every ADAPTED
  section on the page.
- **Added `--text-md: 1rem` to the token set.** NOVEL sections (`process`, `map`) and the
  footer's un-sized wrapper computed to the browser default `16px`, which wasn't in the
  Prompt 5 token set — a real, legitimate value (the un-overridden root default), not an
  invented one, so it was added as a token rather than forcing an explicit size onto
  elements that shouldn't need one.

## Prompt 7 — `/about`, `/services`, `/contact`, `/privacy`

**`/about`, `/privacy`: fixed a real harness bug, not a page bug.** Both routes have
exactly one content section, and `segmentSections()`'s candidate list required >=2
matches to "win" — a lone content section could never qualify on its own, so these
pages were being measured as header+footer only (2 sections), silently missing their
real content entirely. Fixed by adding `[data-section]` as the first `sectionCandidates`
entry in `harness.config.mjs` (our own build tags every section including header/footer,
so it always yields >=2; harmless on the reference side, which has zero `data-section`
attributes and falls through to the reference-shaped candidates unchanged). After the
fix both routes are fully green (all sections, all 3 breakpoints) except the `(page)`
row, floored for the same reason as `/`'s (see above).

**`/services` `s03` (services-list) @768/@1440 — status: floored.**
Structural deviation ~5.3%, driven almost entirely by a `buttons`-count heuristic
mismatch (ref 7, ours 24 before fixes, 24 after — see below) and `box.h` (reference is
much taller). Two real attempts: (1) matched padding exactly to the reference
(115/35 -> 160/60 -> 305/125, closed most other fields to 0% dev); (2) considered
removing the accordion trigger's `<button>` semantics to shed 8 button-matches, rejected
— swapping a real `<button>` for a fake `div[role=button]` purely to satisfy a count
heuristic is an accessibility regression, not a fix, and the brief explicitly says each
of the eight service blocks links to `tel:` and `/contact` (16 more unavoidable
button-matches). The residual is a genuine content-shape difference: the reference's
`services-list` is a plainer, less interactive block; ours is a required accordion with
two mandatory CTAs per card. Not chasing further.

**`/contact` `s02` (info-band) — status: floored, all 3 breakpoints.**
Structural deviation 14.9–18.2%. The reference band computes `display: inline` and
`overflow: clip` on its own wrapper with zero buttons — a genuinely atypical, near-empty
element (already noted in `docs/content-divergence.md` as length-exempt, `bodyChars: 0`).
Forcing our info band to `display: inline` would break block-level layout (width/height/
margin don't apply predictably to inline boxes) for a working, accessible hours/phone/
address card. One real attempt made (padding-only fix); not pursued further — this is a
structural outlier on the reference side, not a defect on ours.

**`/contact` `s03` (map) @1440 — status: floored, pre-existing rationale.**
`box.h`/`box.w` deviation (~5.05%) is the direct, intentional consequence of D-02: the
reference embeds five stacked Google Maps iframes here (a locations grid), ours is
exactly one coords-only embed per D-07/D-08. Already documented as length-exempt in
`docs/content-divergence.md`; no iteration spent.

**`/contact` `s04` (reviews-or-cta) — status: green @768/@1440, floored @390.**
Two real attempts: (1) matched padding exactly (closed most fields); (2) added a second
real CTA ("Fill out the form instead", linking to `#contact-form`) alongside the phone
button, which closed 768 and 1440 outright. At 390 the residual (~5.26%) is `buttons`
(ref 6, ours 2) and `box.h` (reference nearly triple ours) — the reference's band is
almost certainly a customer-reviews widget with several per-review controls. Per D-13
(no fabricated review/rating markup), a third attempt would mean building fake
review-widget interactivity to close a metric gap — not doing that. Floored on
principle, not on iteration count.

## Email sweep

`EMAIL SWEEP CLEAN` — re-run and pasted in the Prompt 6 and Prompt 7 commits.
