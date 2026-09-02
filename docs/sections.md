# Route × section × class — the source of truth

Format consumed by `_shared/harness/src/diff.mjs`:
`| route | ref-section-id | our-section-id | CLASS | reason |`

Updated in Prompt 3 (content divergence). Reference is a multi-page WordPress site (not
a one-pager) but every content section carries business-specific copy/photos, so almost
nothing survives as FIDELITY once the business changes from roofing to garage-door
repair — that's expected under D-09/D-10, not a measurement failure. `/about`,
`/services`, `/contact`, `/privacy` are close to single content-blobs on the reference
(see `docs/profile.md`), so they're built from the section vocabulary, not pixel-matched
page-for-page.

## Prompt 3 reclassifications and structural changes

**Correction to Prompt 1's home mapping**: `s01` is the reference's `home-section-one
hero` band itself (headline, subheadline, CTAs, and the award-badge row all live inside
it — the badges are not a separate top-level section; the reference's `hero__title` is a
plain `<div>`, not an `<h1>`, which is why Prompt 1's heading-sniff missed it). The
Prompt 1 draft mislabeled `s01` as a standalone `trust-badges` section; corrected below.

**Reclassified FIDELITY → ADAPTED**: none started as FIDELITY (Prompt 1 already found
none survives a roofing → garage-door business swap), so there is nothing to move here —
noted for the record since Prompt 3 requires checking.

**The four required structural changes, home page**:

1. **Reorder ≥ 3 sections.** Reference order (content bands only): Hero → Intro →
   [dropped] → ServicesGrid → Testimonials → [dropped]. Ours: Hero → **ServicesGrid** →
   **Testimonials** → **Intro** → Process (new) → Map (new). ServicesGrid, Testimonials,
   and Intro all change position relative to each other and to Hero — three sections
   reordered, not just new ones interspersed.
2. **Drop two reference sections, add two of our own.** Dropped: `s03` (unlabeled
   home-section-three — thin, image-heavy "why choose us" filler with almost no body
   copy) and `s06` (unlabeled closing CTA band — its purpose is absorbed into the footer
   instead). Added: `process` ("how a repair visit actually goes", a 3-step explainer —
   no reference counterpart) and `map` (required by D-08; the reference's home page has
   no map at all, it has a YouTube embed instead).
3. **Headline proposition category changed.** The reference leads on workmanship/quality
   — "Roofing excellence starts here," "Top Quality Roofing," "The Hardest Working
   Roofing Contractor." Ours leads on **a real person answers the phone** (distinct from
   workmanship and from transparency) — held across all five routes: hero headline,
   about-page intro, contact-page form intro, and the footer tagline in `lib/business.ts`
   (Prompt 5) all restate it.
4. **Services regrouped by symptom, not type.** The reference's `/roofing-services/`
   groups by category (shingle roofing, gutter replacement, reroofing, storm damage,
   emergency roofing, general repairs). Ours groups by how a customer would describe the
   problem on the phone ("the door won't open," "it's loud," "the spring snapped") with
   the canonical service name as the answer underneath — see `content/copy.ts`'s
   `SERVICES` array and `docs/content-divergence.md`.

See `docs/content-divergence.md` for the measured lexical/length divergence per section.

## `/` (ref: `/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| / | s00-header-one | header | ADAPTED | Same structural role (logo, nav, phone CTA), our business name/phone/nav items differ. |
| / | s01 | hero | ADAPTED | Reference's hero band (headline/subhead/CTAs/award-badge row combined — see correction note above). Ours: "a real person answers when you call" headline, no badges (D-14 — badges moved to `TODO(fact)` placeholders, not built into the home hero). |
| / | s04-top-quality-roofing | services-grid | ADAPTED | Largest band (2178px @1440) — service list. Regrouped by symptom vs. reference's category grouping (structural change #4). Moved up in page order (structural change #1). |
| / | s05-the-hardest-working-roofing-contra | testimonials | ADAPTED | Reviews/trust band; ours uses `[TESTIMONIAL PLACEHOLDER]` blocks per D-13, no fabricated ratings/JSON-LD. Moved up in page order (structural change #1). |
| / | s02-professional-roofing-in-georgia-s | intro | ADAPTED | Tagline/intro band, same purpose, fresh copy per D-10. Moved down in page order (structural change #1). |
| / | s03 | (dropped) | DELETED | Unlabeled home-section-three, thin/image-heavy filler with almost no body copy. Structural change #2 (drop 1 of 2). |
| / | s06 | (dropped) | DELETED | Unlabeled closing CTA band. Purpose absorbed into the footer instead. Structural change #2 (drop 2 of 2). |
| / | (none) | process | NOVEL | "How a repair visit actually goes" — no reference counterpart. Structural change #2 (add 1 of 2). |
| / | (none) | map | NOVEL | Reference home has no map section (it has a YouTube embed instead). Required on home per D-08. Structural change #2 (add 2 of 2). |
| / | footer | footer | ADAPTED | NAP block, hours, `SERVICE_AREA` sentence, no email column (D-03), no Locations link (D-02). |

## `/about` (ref: `/about-us/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| /about | header | header | ADAPTED | Shared shell, see `/` header row. |
| /about | s01 | intro-body | ADAPTED | Reference segments as header+footer chrome only under our sectionCandidates (`segMode: fallback`) — the real body content isn't isolated as its own band (see `docs/profile.md`); ours composed from the section vocabulary at a genre-appropriate length, length-exempt in `docs/content-divergence.md`. No invented history/founding year/headcount — `TODO(fact):` each per D-14/D-17. |
| /about | footer | footer | ADAPTED | Shared shell, see `/` footer row. |

## `/services` (ref: `/roofing-services/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| /services | header | header | ADAPTED | Shared shell, see `/` header row. |
| /services | s01 | symptom-prompt | ADAPTED | Thin band ahead of the list (112px @1440, `bodyChars: 0` — icons/labels only). Reframed as "what's going on with your door?" — the entry point into symptom-first grouping (structural change #4). |
| /services | s03 | services-list | ADAPTED | Main services content blob (`segMode: [role="main"] > *`). Regrouped by symptom vs. reference's category grouping (structural change #4), no prices (D-12), no per-service routes. Fixed 8-item canonical list. |
| /services | footer | footer | ADAPTED | Shared shell, see `/` footer row. |

## `/contact` (ref: `/contact-us/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| /contact | header | header | ADAPTED | Shared shell, see `/` header row. |
| /contact | s01-post-217-fill-out-the-form | contact-form | ADAPTED | Form band; ours drops the email field per D-05 (name, phone, service, callback window, message), no backend. |
| /contact | s02 | info-band | ADAPTED | Hours/phone card, same purpose. Reference band carries no paragraph text (`bodyChars: 0`), length-exempt in `docs/content-divergence.md`. |
| /contact | s03 | map | ADAPTED | Reference embeds **five** Google Maps iframes here (a locations/service-area grid) — that's the D-02 city-grid pattern and gets deleted. Ours is exactly one keyless coords-only embed at zoom ~15 per D-07/D-08, same slot purpose, deliberately reduced content. Length-exempt (no body copy to compare). |
| /contact | s04 | reviews-or-cta | ADAPTED | Trailing band; purpose retained (trust/CTA), content ours. |
| /contact | footer | footer | ADAPTED | Shared shell, see `/` footer row. |

## `/privacy` (ref: `/privacy-policy/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| /privacy | header | header | ADAPTED | Shared shell, see `/` header row. |
| /privacy | (none) | policy-body | NOVEL | No reference counterpart (reference also segments as header+footer chrome only, `segMode: fallback` — its real policy text is never isolated as its own band, same limitation as `/about`). Per D-16 our policy body is generated fresh to describe what this site actually does (phone-callback form, no email collection, no analytics/cookies). Measured by token conformance only, never pixel/length. |
| /privacy | footer | footer | ADAPTED | Shared shell, see `/` footer row. |

## Deleted per D-02

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| (none) | areas-we-serve page | (none) | DELETED | Reference has a full `/areas-we-serve/` locations page with a city grid. Not one of our five routes; also scrub the nav item, footer column, and the multi-marker map grid pattern that reappears on `/contact-us/`. |
