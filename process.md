# Clone-and-Adapt Prompt Chain — Garage Door Repair Site

Sequential run. One prompt per turn, wait for completion, then send the next.
Every prompt ends by writing state to `docs/` so the next prompt survives a context reset.

---

## 0. CONSTANTS — fill once, reuse everywhere

```
REFERENCE          = https://www.fraserroofingllc.com/
STACK              = Next.js 15 App Router + TypeScript + Tailwind
PORT               = any avaible
PKG                = pnpm
THRESHOLD          = 2%    divergent pixel area — FIDELITY sections
STRUCT_THRESHOLD   = 5%    structural metric deviation — ADAPTED sections
TOKEN_THRESHOLD    = 0     token violations — NOVEL sections

ROUTES             = /  /about  /services  /contact  /privacy
BREAKPOINTS        = <filled by Prompt 1 from the reference CSS>

BUSINESS           = <name>
TAGLINE            = <one line>
PHONE              = <(NPA) 555-01XX — reserved fiction range, see D-04>
ADDRESS            = <fake street number + street>, <REAL city, state, zip>
MAP_COORDS         = <lat>,<lng>   ← real coords, address is fake, see D-07
HOURS              = 7 days, 7:00 AM – 7:00 PM
SERVICE_AREA       = <one sentence, footer only, no city grid>

MAX_AGENTS         = 2     hard concurrency cap
ITERATION_CAP      = 3     attempts per section, then it is floored and reported
BP_SET             = 390, 768, 1440   exactly three, see §0.2
```

---

## 0.1 DECISION REGISTER — pre-answered so it never asks

Paste this whole block into `CLAUDE.md`. If any answer is wrong for you, change it here
and nowhere else.

| # | Question it would ask | Answer |
|---|---|---|
| D-01 | Which pages? | Exactly five: `/`, `/about`, `/services`, `/contact`, `/privacy`. Do not add blog, FAQ page, booking, careers, gallery route, or per-service routes. Sections inside a page are fine. |
| D-02 | The reference has a Locations page / city grid / service-area map list. | Delete it. Also scrub: nav item, footer column, sitemap entry, any `/locations/*` route, internal anchors to it, and any `areaServed` city array in schema. A single `SERVICE_AREA` sentence in the footer is the only survivor. |
| D-03 | Email? Contact form? Newsletter? | No email in any form. Concretely banned: `mailto:`, any `@`-bearing address in copy, `<input type="email">`, newsletter/subscribe blocks, envelope icons, "Email us" CTAs, `email` in JSON-LD, email in the privacy policy contact section. |
| D-04 | What phone number? | `PHONE` from constants. Must use the 555-01XX reserved range so it cannot ring a real person. Render as `tel:` links everywhere, including a mobile sticky call bar. |
| D-05 | Contact form fields, since no email? | Name, phone, service needed (select), preferred callback window, message. No backend. Client-side validation only; on submit show a "we'll call you back" state and `console.warn` a stub notice. Mark the component `// STUB: no submission target` at the top. |
| D-06 | Hours — weekdays only? Emergency service? | 7:00–19:00, all seven days, single block, no split hours. Do not invent "24/7 emergency" or after-hours claims. |
| D-07 | The address won't geocode. | Correct — it's fake. Embed the map by coordinates, not by address string: `https://www.google.com/maps?q=<MAP_COORDS>&z=15&output=embed` in a keyless iframe. Display the fake address as text next to the map. Never pass the fake address to a geocoder. |
| D-08 | Where do maps go? | Both are required: home page (one section, zoom ~13, below services or above footer) and `/contact` (zoom ~15, beside the form). `loading="lazy"`, explicit `title` attribute, fixed aspect-ratio wrapper so it cannot shift layout. Add a "Get directions" link: `https://www.google.com/maps/dir/?api=1&destination=<MAP_COORDS>`. |
| D-09 | Can I reuse the reference's photos, logo, and copy? | No. Their photos, logo, business name, phone, license numbers, staff shots, truck shots, review screenshots, and body copy stay on their site. Layout, spacing, type scale, grid, motion, and interaction patterns are what you are cloning. Photographic slots default to placeholders (Prompt 2). Copy is written fresh (D-10). |
| D-10 | What copy goes in the slots? | Write original generic garage-door copy at the same length and line count as the reference block, so the layout is tested honestly. Never paste the reference's sentences. |
| D-11 | Fonts? | If the reference self-hosts a licensed font, do not lift the file. Substitute the closest open equivalent via `next/font`, record it in `docs/known-divergence.md`, and treat the resulting text-metric delta as a permanent floor — never iterate against it. |
| D-12 | Prices? | None. No numbers, no "starting at". "Free estimate" is allowed. |
| D-13 | Testimonials / star ratings / review counts? | Build the section, fill it with literal `[TESTIMONIAL PLACEHOLDER]` blocks at realistic length. Do not invent named customers or quotes. No `AggregateRating` or `Review` JSON-LD at all — fabricated review markup is a legal problem, not a content gap. |
| D-14 | Trust badges — licensed, bonded, insured, BBB, certifications, years in business, jobs completed? | Do not invent any of them. Where the reference has a badge row, use `TODO(fact):` placeholder chips at the correct dimensions. List every one in `docs/facts-needed.md`. |
| D-15 | Analytics, chat widget, cookie banner, tracking pixels? | None. If you add no trackers, the privacy policy must say so rather than describing cookies you didn't ship. |
| D-16 | Privacy policy content? | Generate a standard policy consistent with what the site actually does: a phone-callback form, no email collection, no analytics, no cookies beyond what the framework sets. Contact section lists phone and postal address only. Top of the file: `<!-- UNREVIEWED TEMPLATE — requires legal review before launch -->`. Do not claim GDPR/CCPA compliance. |
| D-17 | Any unknown business fact. | Never guess. Emit `TODO(fact): <what you need>` inline, append to `docs/facts-needed.md`, keep building. |
| D-18 | Deploy? Domain? Env vars? Database? | None. Local only, `PORT`. No `.env`, no third-party keys, no auth. |
| D-19 | Accessibility target? | WCAG 2.2 AA. Contrast checked against your own palette, not assumed from the reference. Full keyboard path through nav, form, accordion, and map bypass. `prefers-reduced-motion` honored on every animation. |
| D-20 | Should I ask before X? | No. See the autonomy rule. Blocked means "a decision only the owner can make," and this table has already made them. |

---

## Prompt 0 — CLAUDE.md, written before any work

> Write `CLAUDE.md` at the repo root containing everything below verbatim, plus the
> CONSTANTS and DECISION REGISTER blocks. Then stop. No other files yet.

**Autonomy.** Never stop to ask "should I continue?" Work until the task is done or you
are genuinely blocked on a decision only I can make. The decision register has already
answered the predictable ones — consult it before concluding you are blocked. Do not ask
me to confirm intermediate steps.

**Three divergence classes.** This is a clone *and adapt*, not a copy. Every section is
classified once, in `docs/sections.md`, and measured accordingly:

- **FIDELITY** — exists in both, same purpose, content is structurally equivalent.
  Measured by pixel diff. Done at `< THRESHOLD`.
- **ADAPTED** — reference section retained, content deliberately swapped (business name,
  hours, phone, service list, copy length, image subject). Pixel diff is meaningless.
  Measured on structural metrics only: section box, inner grid geometry, computed type
  scale and weights, letter-spacing, resolved colors, spacing rhythm, border/shadow/
  gradient values. Done at `< STRUCT_THRESHOLD` on those metrics.
- **NOVEL** — no counterpart in the reference (privacy policy body, any section that
  replaces a removed one). No diff exists. Measured by token conformance: every color,
  font size, weight, radius, shadow, and spacing value must resolve to a token extracted
  in Prompt 5. Done at zero violations.

Misclassifying an ADAPTED section as FIDELITY and grinding on it is the single most
expensive failure mode here. If a diff will not close and the reason is that the words
are different, the class is wrong — fix the class, not the pixels.

**Definition of done.** Every section of every route, at every declared breakpoint,
under the threshold for its class. Report the per-section number every time you claim
something is finished. A route is not done until all five are.

**Placeholders and known floors.** Sections blocked by a placeholder asset or a font
substitution are reported separately, with the placeholder area excluded from the
measurement. Never treat one as a fixable divergence and never burn iterations closing
one. `docs/known-divergence.md` is the list; check it before starting any fix.

**Never invent a business fact.** Phone, address, hours, credentials, years in business,
service radius, review counts, prices, warranty terms, response times. Anything not in
CONSTANTS is `TODO(fact):` and goes in `docs/facts-needed.md`.

**No email.** Before every "done" report, run and paste the result:

```bash
rg -n "mailto:|type=[\"']email|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|newsletter|subscribe" \
   app components lib content || echo "EMAIL SWEEP CLEAN"
```

Non-empty output is a build failure, not a note.

**Routes are fixed.** Five, listed in CONSTANTS. Adding one is out of scope.

**Dev server.** Keep it running on `PORT`. Never ask me to start it. When you finish a
visual change, screenshot the affected section and diff it before reporting done. If the
diff regressed, fix it before telling me. **Never report "done" on a visual change you
have not diffed.**

**Concurrency is capped at `MAX_AGENTS`.** Never exceed it, never ask to exceed it.
Dispatch a subagent only when the work is high-volume and low-judgment — capture passes,
measurement sweeps, per-route builds that touch no shared file. Do the reasoning-heavy
work yourself in the main thread. When in doubt, serial.

**Cost discipline.** These are correctness rules, not preferences:

- Diffs return numbers. The harness writes screenshots, DOM dumps, computed-style JSON,
  and rAF traces to `.harness/` and prints a summary line plus the file path. Never `cat`
  a raw trace into context.
- Do not open a screenshot to evaluate a diff. Look at an image only when a number is
  unexplained after one code-level attempt, one image at a time, cropped to the section.
- Three breakpoints, `BP_SET`, fixed. Do not add a fourth because the reference CSS has
  one; note it in `docs/profile.md` instead.
- `ITERATION_CAP` attempts per section. On the third failure, stop, write the residual and
  your best hypothesis to `docs/known-divergence.md`, and move on. Never a fourth.
- Subagents return the report table and nothing else. No transcripts, no file contents,
  no narration of what they tried.
- Re-diff only the sections you touched. Full sweeps happen at the end of a prompt, once.
- Paste the top 10 rows of the divergence table, not all of it. The file has the rest.

**Commit after every prompt.** `git init` now. One commit per prompt in this chain, message
`prompt-N: <what landed>`. This is the rollback path when an iteration makes things worse,
and it is cheaper than re-deriving state.

**Before context runs out.** If you are approaching compaction, stop mid-task, flush all
state to `docs/`, and print a resume block: current prompt number, current section, what
is in flight, what to run next. Do not let compaction eat unwritten state.

**Ownership.** One agent owns one section, end to end — geometry, appearance, responsive,
behavior — and reports its divergence number per breakpoint. An agent that cannot measure
its own result has not finished. Shared files — `globals.css`, `layout.tsx`, tokens,
header, footer, nav, the NAP block, the map component — are owned by you, the lead, not
by section agents. If two sections need the same shared change, make it yourself before
dispatching, or serialize just that edit.

**State survives context.** After every prompt, write results to `docs/`. Assume the next
prompt starts with no memory of this one. Canonical files:

```
docs/profile.md            reference profile, breakpoints, axes chosen
docs/sections.md           route × section × class, the source of truth
docs/divergence.md         the ranked table, rewritten each loop
docs/known-divergence.md   permanent floors: placeholders, font substitution
docs/facts-needed.md       every TODO(fact)
docs/behavior/*.md         one spec per non-obvious interaction
assets/INVENTORY.md        acquired vs placeholder, with slot dimensions
```

**Report format**, every time:

```
route | section | breakpoint | class | metric | value | threshold | status
```

Plus: what changed, what regressed, what is newly blocked, and the next batch you are
dispatching. No prose summary in place of the table.

---

## Prompt 1 — Profile the reference, then build the instrument

> `REFERENCE = <url>`. Goal: a faithful clone of the design system and layout, adapted to
> our five routes and our business facts, in `<STACK>`.
>
> Build the capture harness FIRST. No page code until it works.

**STEP A — profile the reference and tell me which axes actually matter here.**

Report: page height and section count for *every* reference page you will draw from (not
just the landing page), breakpoints in the CSS, whether motion is scroll-linked or
time-driven, whether content is static or fetched, whether there is state (menus, tabs,
carousels, accordions, filters, forms, sticky headers, mobile call bars), and whether
anything sits behind auth or geo.

Then pick the measurement axes from that profile and tell me which you're capturing and
which you're skipping. Do not default to a motion-heavy capture on a page whose
difficulty is layout, density, or state. A local-services site is usually density,
responsive behavior, and form/nav state — not scroll choreography. Say so if that's what
you find.

Also produce the first draft of `docs/sections.md`: every reference section mapped to one
of our five routes, classified FIDELITY / ADAPTED / NOVEL, with the reason. Mark anything
locations-related as DELETED per D-02. This file is the contract for everything after.

**STEP B — build the harness for the axes you chose.** Always capture:

- **Geometry** — box, position, z-order, overflow, per section.
- **Static appearance** — computed color, background-color, resolved font-family,
  font-weight, letter-spacing, line-height, rest opacity, borders, shadows, gradient
  stops, radii. Geometry-only audits are blind to most of what makes a section read wrong.
- **Responsive** — the same pass at every breakpoint found in STEP A, not just desktop.
  Include the real-device widths that matter for a phone-call-driven business: 390, 430.

Add per profile:

- **Scroll-linked motion** → sample by `requestAnimationFrame` during a slow programmatic
  scroll (~2–4px/frame). Never step to fixed scroll offsets; offset stepping cannot see
  staggers, easing, or sub-step transitions. If you write `scrollTo(y)` in a loop, stop.
- **Text effects** → count `h1 span, h2 span, [class*=char], [class*=word]` per HEADING
  and dump each heading's `outerHTML`. A visually-hidden duplicate of the text is a
  split-library signature, not an accessibility copy.
- **Interactive state** → capture each state as its own reference, not just the default
  render: nav open/closed, sticky header engaged/at-top, accordion item N open, form
  pristine/focused/error/submitted, hover and active on every CTA.
- **Data-driven lists** → record the real item count, and the empty/loading states if
  reachable.

**STEP C — build the comparison side.** Screenshot both pages at matched
SECTION-RELATIVE progress — page heights will differ by design here, so absolute
`scrollY` is meaningless — diff, and output sections ranked by divergent pixel area.
The harness must also emit the structural-metric comparison used for ADAPTED sections,
and the token-conformance check used for NOVEL ones. All three, or the loop in Prompt 8
has nothing to run on.

Harness must accept `--route` and `--bp` and run headless, so a subagent can measure one
section without touching anyone else's work.

Run the capture with at most `MAX_AGENTS` concurrent passes — reference-side and our-side
are independent, breakpoints are independent, but two at a time is the ceiling. Each pass
writes to `.harness/` and returns a summary line, not its output.

**Deliverable:** `docs/profile.md`, `docs/sections.md`, the ranked divergence table
(reference vs empty scaffold is fine — it proves the instrument runs), and the raw traces.
Then stop and show me.

---

## Prompt 2 — Acquire real assets, placeholder the rest

> Before writing components: inventory every asset slot the reference page uses —
> images, videos, fonts, icons, SVG, 3D models. Read them from the origin network log,
> `<img>`/`<source>`/`srcset`, CSS `url()`, preload tags, and the font files themselves.
> Record the highest resolution actually served, not thumbnails.

Then split the inventory by provenance, per D-09 and D-11:

- **TAKE** — generic UI icons and open-licensed fonts. Verify the license; if you cannot
  verify it in one step, it is REPLACE.
- **REPLACE** — the reference business's photos, logo, wordmark, staff and vehicle shots,
  badge images, review screenshots, and any licensed font file. These are theirs. Do not
  download them into the repo, not even temporarily.

For every REPLACE slot and every slot you could not obtain, record: the slot's real
rendered dimensions at each breakpoint, aspect ratio, `object-fit` behavior, and dominant
color sampled from the reference screenshot.

Do not generate or source replacements now. Build with neutral placeholders at the correct
dimensions and dominant color, each labeled with its slot ID. Placeholder slots are a
known, tracked gap — not a blocker, and not something to check in about.

**Deliverable:** `assets/INVENTORY.md` (slot ID, route, section, dimensions per bp, aspect,
dominant color, provenance, status), the acquired files in `public/`, placeholders
generated, and the font substitution recorded in `docs/known-divergence.md`.

---

## Prompt 3 — Content divergence brief, written before any copy ships

> The reference tells you what each slot is *for*. It does not get to tell you what it
> says. Write all site copy now, to a measured divergence target, before a single
> component consumes it.

**Target: no section reads as a rewrite of its counterpart.** Paraphrase is the failure
mode — same claims, same order, same rhythm, different adjectives. That is what "50% more
different" has to mean in practice, and it is enforced two ways:

**Lexical gate** — build `scripts/similarity.mjs` and run it per section:

- Zero shared 5-grams with the reference's body copy.
- Trigram Jaccard overlap ≤ 0.15 per section, after removing stopwords and the industry
  allowlist below.
- Allowlist, exempt because avoiding them would produce copy no customer searches for:
  garage door, torsion spring, extension spring, opener, cable, roller, track, panel,
  off-track, remote, keypad, sensor, weather seal, residential, commercial, same-day,
  free estimate, repair, installation, replacement.

**Structural gate** — at least half the page must differ in *information*, not wording.
Concretely, all four:

1. Reorder at least three sections relative to the reference.
2. Drop two reference sections and add two of your own from the section vocabulary.
3. Change the headline proposition category. If the reference leads on speed, lead on
   workmanship, or on transparency, or on the fact that a real person answers the phone.
   One category, held consistently across all five routes.
4. Regroup the services. If the reference groups by door type, group by symptom — "your
   door won't close," "it's loud," "the spring snapped." If it groups by symptom, group
   by system.

**The one thing you must not change: length.** Every copy block stays within ±10% of the
reference slot's character count, and heading blocks stay within ±1 line at every
breakpoint. Different words, same volume — otherwise the layout is no longer being tested
against anything and every diff downstream is noise.

**Then reclassify.** Every section whose information content changed moves FIDELITY →
ADAPTED in `docs/sections.md`, with the reason. Do this now, not during convergence.
A FIDELITY section carrying deliberately different copy will burn its full
`ITERATION_CAP` and floor for a reason that was a decision, not a defect.

No invented facts survive this prompt either — D-14 and D-17 still apply. Divergent copy
is not a licence to claim credentials.

**Deliverable:** `content/copy.ts` with every string for all five routes, typed;
`docs/content-divergence.md` with the per-section overlap number and the four structural
changes named; `docs/sections.md` updated. Stop.

---

## Prompt 4 — Behavior specs, written before the interactive build

> Write one spec per non-obvious interaction, from the state captures in Prompt 1. Do not
> implement anything yet. One file each in `docs/behavior/`.

Anatomy: **mechanism → ratio and why → failure mode → trigger → accessibility.**

- **mechanism** — the exact CSS property or API, and explicitly what NOT to use where
  there is a plausible wrong choice.
- **ratio** — the numbers, plus the reason the ratio matters: what it produces
  perceptually.
- **failure mode** — the tempting-but-wrong version and why it reads wrong.
- **trigger** — what fires it, once or repeating, what happens on re-entry, and what
  happens on client-side route change.
- **accessibility** — labels, hidden state, focus, reduced-motion behavior.

Required specs for this site, at minimum: mobile nav drawer, sticky header transition,
mobile sticky call bar, service card hover/press, FAQ or service accordion, form field
focus/error/success states, map lazy-mount, and any scroll reveal the profile found.

**Worked example — mobile nav drawer:**

Fixed panel animated with `transform: translate3d()` plus an opacity backdrop. NOT
`max-height`, NOT `left`, NOT a `display` toggle — only compositor properties. Body scroll
lock via `position: fixed; top: -<scrollY>px` with restore on close, NOT `overflow: hidden`
on `<body>`, which iOS Safari ignores.

Panel 0.32s `cubic-bezier(0.22, 1, 0.36, 1)`; backdrop 0.2s linear starting at 0ms. The
backdrop finishing first is what makes the panel read as arriving over an
already-dimmed page rather than dragging the dimming with it. Links stagger 0.03s
beginning at 0.08s — with five items, a longer stagger reads as a slideshow instead of a
single gesture.

Failure mode: animating `max-height` reflows the links mid-transition and they jitter;
`display: none` on close kills the exit transition so it snaps shut, which is the single
most common tell of a hand-rolled drawer.

Trigger: hamburger click, `Escape`, backdrop click, and pathname change — in App Router
the drawer survives navigation unless you close it on `usePathname()` change.

Accessibility: `aria-expanded` and `aria-controls` on the toggle, focus trapped in the
panel while open, focus returned to the toggle on close, `inert` on the rest of the tree,
and under `prefers-reduced-motion` the transform drops to 0.01s with opacity only.

---

## Prompt 5 — Design system and shared shell (lead-owned, no subagents)

> You own every file in this prompt. Do not dispatch. Section agents will depend on all
> of it, so it lands first and does not move afterward.

1. Extract tokens from the Prompt 1 appearance capture: color ramp, type scale with
   weights and letter-spacing, spacing scale, radii, shadows, container widths, breakpoint
   values. Write them as CSS custom properties plus the Tailwind theme extension. This is
   the reference set for NOVEL-class token conformance.
2. Root layout, metadata per route, fonts via `next/font`.
3. Header, nav (five routes, no Locations), mobile drawer per `docs/behavior/`, sticky
   behavior, mobile call bar.
4. Footer: NAP block, hours, `SERVICE_AREA` sentence, route links, no email column.
5. Single source of truth for business facts — `lib/business.ts` — exporting name, phone
   in both display and `tel:` form, address parts, coords, hours. Every component reads
   from it. A hard-coded phone number anywhere else is a bug.
6. `<BusinessMap>` component per D-07/D-08: coords-only, keyless embed, lazy, titled,
   aspect-ratio wrapper, directions link, zoom as a prop.
7. `LocalBusiness` JSON-LD from `lib/business.ts`: name, telephone, `address`, `geo`,
   `openingHoursSpecification` 07:00–19:00 Mon–Sun, `url`, `image`. No `email`, no
   `aggregateRating`, no `review`, no `priceRange`.
8. Five route stubs that render the shell and nothing else.

Then run the harness on the shell at every breakpoint and report the table. Stop.

---

## Prompt 6 — Build the home page, triage applied per section

> Build `/` section by section, top to bottom, using `docs/sections.md` classes. Before
> moving on from each one, run the diff and classify what's left as:
>
> (a) blocked by a missing asset or a known floor
> (b) measurable but unmeasured
> (c) layout, typography, motion, or state
>
> Fix (b) and (c). List (a) and move on.

Build the hero and the map section yourself — they touch shared components. Everything
else may go to subagents, at most `MAX_AGENTS` at a time. Each agent owns one section end
to end and reports its divergence number per breakpoint, against the threshold for its
class, and nothing else.
The map section is required on this page. No section may introduce a token that is not in
Prompt 5's set — if it needs one, it comes back to you, not into a section file.

Deliverable: `/` green or explicitly floored, `docs/divergence.md` updated, email sweep
pasted.

---

## Prompt 7 — Build the four subpages, in parallel

> `/about`, `/services`, `/contact`, `/privacy`. One agent per route, `MAX_AGENTS` at a
> time — dispatch `/about` and `/services` first, then `/contact` and `/privacy`. They
> share only the shell, which is frozen. If a route needs a shell change, it stops and
> hands it to you; you make the edit once and re-dispatch. Build `/contact` yourself if
> the form ends up sharing validation code with anything else.

Per-route notes the agents need:

- **`/about`** — no invented history, no year founded, no team headcount, no certifications.
  `TODO(fact):` for each. Placeholder photo slots per `assets/INVENTORY.md`.
- **`/services`** — service list from the reference's *categories*, written in our own
  copy. No prices. Each service block links to `tel:` and to `/contact`, not to a
  per-service route.
- **`/contact`** — form per D-05 (no email field), phone card, hours block, map at zoom
  ~15, directions link. Form must be fully keyboard-operable with visible error states,
  and errors announced via `aria-live`.
- **`/privacy`** — per D-16. NOVEL class: measured by token conformance, not pixel diff.
  Long-form type must use the extracted scale, not defaults.

Each agent reports its own table before returning.

---

## Prompt 8 — The convergence loop, stated once

> Loop until convergence, without checking in. Work the divergence table top-down in
> batches of `MAX_AGENTS`. Re-diff each section as its agent returns — that section only —
> then dispatch the next batch. Serialize when two sections need the same shared-file
> change; those you make yourself.
>
> `ITERATION_CAP` attempts per section across the whole loop, not per batch. Track the
> count in `docs/divergence.md`. A section that has burned its three attempts is floored
> and never dispatched again.

Before each batch, re-read `docs/known-divergence.md` and drop anything already floored.
If a FIDELITY section will not close and the residual is content-shaped — different words,
different image subject, different item count — reclassify it ADAPTED in `docs/sections.md`,
say so in the report, and re-measure structurally. Do not silently keep grinding.

Repeat until every section on every route is under its class threshold at every
breakpoint, or you show me it's floored by a placeholder or a font substitution.

Stop and report only when the table is green or genuinely stuck.

---

## Prompt 9 — Randomize the palette, on the extracted structure

> Every section is converged and every color in the codebase resolves to a token. Now the
> palette stops being theirs.

**Randomize hue, preserve structure.** What makes a palette read as designed is the
lightness and chroma relationships across the ramp, not the hue. Convert the Prompt 5 ramp
to OKLCH, hold every L and C value exactly where it is, and re-derive the whole set from a
new random primary hue. Pick the accent by randomly selecting one scheme —
complementary, split-complementary, analogous, or triadic — and rotating from the primary.
Neutrals keep a 3–6% chroma tint of the primary hue; pure grey reads cheap next to a
tinted ramp.

**Seed it.** `scripts/palette.mjs --seed <n>` must reproduce a palette exactly. Record the
winning seed in `docs/known-divergence.md`.

**Generate five candidates, not one.** For each, render three crops — home hero, services
grid, footer — at 1440 and 390, assemble a single contact sheet, and show me. Random
output needs a human pick; I choose, you apply. This is the one place in the chain where
you stop and wait.

**Hard constraints on every candidate, verified programmatically before it reaches the
contact sheet.** A candidate that fails any of these is discarded and re-rolled, not
shown to me:

- Every foreground/background pair actually used in the build passes WCAG AA. Text at
  4.5:1, large text and UI borders at 3:1. Check the pairs in use, not the ramp in theory.
- The call-now CTA remains the highest-contrast, highest-chroma element on every page. It
  is the conversion path for the entire site; a randomizer that makes it recede has
  produced a worse site, not a different one.
- Semantic colors — form error, form success, focus ring — are exempt from the rotation
  and keep their conventional hues. A randomly green error state is a bug.
- Focus rings keep 3:1 against both the element and its background.

**If applying the palette requires touching more than the token file, stop.** That is a
token-conformance failure from Prompts 5–7, not a palette problem. Find every hardcoded
color, route it through a token, and only then recolor.

**This is terminal for color measurement.** Once applied, color divergence from the
reference is intentional and permanently excluded from every diff, every threshold, and
every future iteration. Record that in `docs/known-divergence.md` and re-run the
convergence check on geometry and typography only — those numbers must not have moved. If
they did, the recolor changed something it shouldn't have.

**Deliverable:** the contact sheet, the five seeds, then the applied palette after I pick,
then the geometry/typography regression table proving nothing else moved.

---

## Prompt 10 — Generate the missing assets, last

> Everything else is converged. Now close the asset gap.
>
> Take `assets/INVENTORY.md` and, for each REPLACE and missing slot, write a generation
> prompt. Framing, lighting, depth of field, grain, and exact output dimensions per
> breakpoint come from the original's art direction. **The palette comes from Prompt 9,
> not from the reference** — name the applied hues explicitly in every prompt, or you will
> get images art-directed to a palette this site no longer uses. Subject matter is ours, not theirs:
> generic residential and commercial garage doors, springs, openers, panels, technician
> at work, no readable branding, no license plates, no identifiable faces, no logos.
> Write them yourself, in one pass — this is short text work and a subagent per slot costs
> more in setup than the writing costs. I'll run them through my generator.

When I hand back the files, drop them in, re-run the diff on every affected section, and
report the final table.

---

## Prompt 11 — Acceptance sweep and pre-launch blockers

> Final pass. Run all of it, paste all output, fix everything that fails, then produce
> the two lists at the end.

Gates:

1. `pnpm build` clean, zero type errors, zero console errors on every route.
2. Email sweep from `CLAUDE.md` — must print `EMAIL SWEEP CLEAN`.
3. Locations sweep: `rg -in "locations?|service area|cities we serve|near you" app components content` — reviewed line by line; only the single footer `SERVICE_AREA` sentence survives.
4. NAP consistency: every rendered phone, address, and hours string traces to `lib/business.ts`. Grep for stray digits.
5. Hours correct everywhere, including JSON-LD: 07:00–19:00, seven days.
6. Both maps render, lazy, titled, correct zoom, directions link resolves.
7. Internal link crawl: zero 404s, zero orphan routes, no dead anchors. Custom 404 page uses the shell.
8. Keyboard-only pass on every route: nav, drawer, form, accordion, skip link, map bypass. Visible focus everywhere.
9. Contrast audit against our palette at AA, on the pairs actually in use. Reduced-motion pass — every animation degrades.
10. Palette conformance: `rg -n "#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(" app components --glob '!**/tokens.css'` returns nothing. Every color resolves to a token. Winning seed recorded.
11. Content divergence: re-run `scripts/similarity.mjs`. Zero shared 5-grams, trigram overlap ≤ 0.15 per section. Report the table.
12. Lighthouse on all five routes, mobile profile. Report all four scores per route.
13. Metadata, canonical, `robots.txt`, `sitemap.xml` — five routes, no more.
14. `TODO(fact):` count reported, not removed.

Then output:

- **`docs/known-divergence.md`** — final, with every permanent floor and its cause.
- **`docs/PRE-LAUNCH.md`** — everything that must change before this site faces the
  public: real phone replacing the 555 number, real address, real photos replacing every
  placeholder, every `TODO(fact)` resolved, testimonials filled with real permissioned
  quotes or the section removed, privacy policy legally reviewed, contact form given a
  real submission target, JSON-LD re-verified against the real facts.

Stop.

---

# Appendix A — Questions it will ask, and what to answer

Fold every answer you agree with into the decision register in §0.1 before you start.
Anything left in this appendix is a stall waiting to happen.

## Dependency allowlist — settle this in Prompt 0

Pre-approve exactly this, and require it to justify anything else in one line before
installing:

```
next  react  typescript  tailwindcss  playwright  pixelmatch  sharp
lucide-react  clsx
```

Banned by default, with reasons: **Lenis / Locomotive** (scroll hijacking breaks keyboard
and mobile momentum, and a repair customer scrolling to your phone number is the one
thing you cannot make janky), **shadcn/ui or any component library** (ships its own token
system and will fight the palette you extracted in Prompt 5), **react-hook-form + zod**
(five fields, no backend), **libphonenumber** (one country), **any image CDN or hosted
diff service**. `framer-motion` only if Prompt 1's profile finds real choreography — it
should say so explicitly.

## Prompt 1 — profile and harness

| It will ask | Answer |
|---|---|
| The reference blocks automation — Cloudflare, bot wall, 403 on headless. | Retry once with headed Chromium, a normal UA, one tab, no concurrency. If still blocked, **you** save the reference manually: full-page screenshot per breakpoint plus a complete-page save into `reference/`, and the harness profiles the local copy. Decide which path before you start so it doesn't stall mid-run. |
| The reference is a one-pager — where do `/about`, `/services`, `/privacy` come from? | Very likely for this category. State it up front: subpages are composed from the reference's **section vocabulary** (hero variant, two-column, card grid, CTA band, stat strip, footer), so they are ADAPTED or NOVEL by definition and have no page-level pixel target. Only `/` carries FIDELITY sections. |
| Which capture and diff libraries? | Playwright + pixelmatch + sharp. Nothing hosted. |
| The CSS has five breakpoints, should I capture all of them? | No. `BP_SET` — 390, 768, 1440 — fixed. Record the others in `docs/profile.md` and move on. Each extra breakpoint multiplies every capture, every diff, and every agent report for the rest of the run. |
| Capture hover states on mobile widths? | No. Skip hover below 768. |
| The hero is a carousel or a video loop. | Capture three frames, classify ADAPTED, and do not rebuild the carousel unless the profile shows it is load-bearing. A static hero with one strong image is the better call for this category anyway. |
| Sample rAF motion across the whole page? | Only sections the profile flagged as scroll-linked. Full-page rAF traces are the largest single artifact this harness can produce. |

## Prompt 2 — assets

| It will ask | Answer |
|---|---|
| The heading font is self-hosted and licensed. | Substitute and record as a permanent floor. Sensible pairs by reference style: geometric sans → Poppins or Outfit; neo-grotesque → Inter; humanist → Source Sans 3; condensed display headings → Oswald or Archivo Narrow. Pick one, write it in `docs/known-divergence.md`, never iterate against the metric delta. |
| The reference uses an icon font or an SVG sprite. | `lucide-react`. Match stroke width and size, not the exact glyph. |
| The hero is a video file. | Poster image placeholder only. No video in this build. Note it in the inventory. |
| How should placeholders be generated? | Generated SVG checked into `public/placeholders/`: dominant color fill, slot ID and pixel dimensions as text, nothing else. No external placeholder service, no network dependency. |
| Remote image patterns for `next/image`? | None. Everything local. |
| What about the logo? | Wordmark set in the extracted display font until you hand over a file. `TODO(fact): logo asset`. |

## Prompt 3 — content divergence

| It will ask | Answer |
|---|---|
| How do I measure "different enough"? | The two gates in the prompt. Don't let it substitute a vibe check — the script is the gate, and it runs again in Prompt 11. |
| Trigram overlap is 0.19 on the hero and I can't get it lower without sounding unnatural. | Then the structure is too similar, not the words. Change the proposition, not the synonyms. If it's genuinely floored by allowlisted terms in a short block, accept and log it — a 30-word hero has little room. |
| Can I keep the reference's section order if it's the natural one? | No. Three sections move, minimum. "Natural" here means "the order they chose." |
| Which proposition should we lead on? | Pick one and hold it: workmanship, transparency, or a real person answering the phone. Avoid speed if the reference leads on speed. |
| Copy is 30% shorter than the reference block — is that fine? | No. ±10% character count, ±1 line on headings. This is what keeps every downstream diff meaningful. |
| Should I write SEO meta descriptions and title tags too? | Yes, in the same pass, same gates. Duplicate metadata is the most detectable form of copying. |
| Should the divergent copy target keywords? | Naturally, not mechanically. No city stuffing — there is no locations page for a reason. |

## Prompt 4 — behavior specs

| It will ask | Answer |
|---|---|
| How many specs? | Eight, the list in the prompt. Not one per hover state. |
| The reference uses GSAP / Lenis / Framer — install it? | See the allowlist. CSS transitions plus `IntersectionObserver` cover everything on a site like this. |
| Should I implement these now? | No. Specs only. They get built in Prompts 5–7. |

## Prompt 5 — design system and shell

| It will ask | Answer |
|---|---|
| Tailwind v3 or v4? | Pin it in `STACK` before you start — this is the single most common mid-run stall, because the token syntax is entirely different. Recommended: v4 with a CSS-first `@theme` block on a fresh Next 15 install. |
| A component library, for speed? | No. Hand-roll about eight primitives. See the allowlist. |
| TypeScript strict? | Yes. |
| Where does page content live? | Typed objects in `content/*.ts`. Not MDX, not a CMS, not JSON. |
| Phone CTA in the header? | Yes — a `tel:` button, always visible at ≥768, plus the sticky call bar below 768. It is the primary conversion path for the whole site. |
| Should the header shrink or change on scroll? | Only if the reference does. Otherwise static. |
| Dark mode? | No, unless the reference has it. |
| Multiple languages? | No. |

## Prompts 6–7 — page builds

| It will ask | Answer |
|---|---|
| Which services go on `/services`? | Give it the list so it doesn't invent one. Recommended eight: spring repair and replacement, opener repair and installation, cable / roller / track repair, panel replacement, off-track and misaligned door correction, new residential door installation, commercial and roll-up doors, annual maintenance and tune-up. |
| A form library? | No. Plain React state and a ten-line validator. |
| What does submit actually do? | `preventDefault`, validate, show the callback-confirmation state. Zero server code, so there is nothing to secure and nothing to leak. Comment the stub at the top of the file. |
| How should the phone field validate? | Ten digits, formatted on blur, permissive paste. No country selector. |
| Keep the testimonials section? | Yes, with `[TESTIMONIAL PLACEHOLDER]` blocks at realistic length. Layout gets tested, no fabricated quotes ship. |
| Add an FAQ? | Optional, on `/services` only. Generic technical content about garage doors. Nothing about your response time, pricing, warranty, or credentials. |
| Which jurisdiction for the privacy policy? | Generic US. No GDPR or CCPA compliance claims. |
| The About page needs founding year, team size, credentials. | `TODO(fact):` for every one, and build the layout around placeholders of the right length. |
| Should each service get its own route? | No. In-page anchors on `/services`. Five routes, fixed. |
| What should the CTAs say? | Primary: call, with the number visible. Secondary: request a callback. Never "get an instant quote" or "book online" — there is no backend and no pricing. |

## Prompt 8 — convergence

| It will ask | Answer |
|---|---|
| Section X is floored at 6%, accept it? | Accept if the cause is content substitution, a placeholder asset, or the font swap — log it and move on. Otherwise keep going until `ITERATION_CAP`, then floor it with your hypothesis written down. |
| Two sections need the same `globals.css` change. | You make it, once, in the main thread, before the next batch. Never two agents in a shared file. |
| Can I reclassify a section? | Yes, and you must report it in the same turn with the reason. Reclassifying to dodge a hard fix is the failure mode to watch for. |

## Prompt 10 — asset generation

| It will ask | Answer |
|---|---|
| Which generator are these prompts for? | Name yours — aspect-ratio and parameter syntax differ enough to matter. |
| How many prompts per slot? | One, plus a second crop only where the slot changes aspect ratio between breakpoints. |

## Prompt 11 — acceptance

| It will ask | Answer |
|---|---|
| Lighthouse needs a production build. | Yes: build, start on `PORT`, run against that. |
| `TODO(fact)` entries remain — is that a failure? | No. They are counted and reported, and they populate `docs/PRE-LAUNCH.md`. |
| Performance is below 90 because of the map iframe. | Expected. Lazy-mount it, give it a static poster until interaction if you want the points back, and otherwise record it rather than fighting it. |

## Cross-cutting, any prompt

| It will ask | Answer |
|---|---|
| Port 3100 is in use. | Kill the process and reuse the port. Never silently move to another one — the harness targets `PORT`. |
| Should I commit? | Yes, one commit per prompt, `prompt-N: <what landed>`. |
| Should I write unit tests? | No. The harness is the test. |
| Node version / package manager? | Pin both in `STACK` up front. |
| Context is nearly full. | Flush state to `docs/`, print the resume block, stop. Do not start a new section. |
| Should I keep going into the next prompt? | No. Each prompt ends with its deliverable and a stop. You are sending them one at a time on purpose. |
