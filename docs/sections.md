# Route × section × class — the source of truth

Format consumed by `_shared/harness/src/diff.mjs`:
`| route | ref-section-id | our-section-id | CLASS | reason |`

First draft from Prompt 1 profiling. Reference is a multi-page WordPress site (not a
one-pager) but every content section carries business-specific copy/photos, so almost
nothing survives as FIDELITY once the business changes from roofing to garage-door
repair — that's expected under D-09/D-10, not a measurement failure. `/about`,
`/services`, `/contact`, `/privacy` are close to single content-blobs on the reference
(see `docs/profile.md`), so they're built from the section vocabulary, not pixel-matched
page-for-page. Reclassified as needed in Prompt 3 (content divergence) and Prompt 8
(convergence).

## `/` (ref: `/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| / | s00-header-one | header | ADAPTED | Same structural role (logo, nav, phone CTA), our business name/phone/nav items differ. |
| / | s01 | trust-badges | ADAPTED | Reference award/BBB badge row; ours is `TODO(fact):` placeholder chips per D-14, same slot geometry. |
| / | s02-professional-roofing-in-georgia-s | intro | ADAPTED | Tagline/intro band, same purpose, fresh copy per D-10. |
| / | s03 | value-props | ADAPTED | Unlabeled band (needs closer look during build); structurally a feature/value-prop row, content fully rewritten. |
| / | s04-top-quality-roofing | services-grid | ADAPTED | Largest band (2178px @1440) — service list. D-01/D-10: regrouped by symptom vs. reference's door-type grouping (Prompt 3). |
| / | s05-the-hardest-working-roofing-contra | testimonials | ADAPTED | Reviews/trust band; ours uses `[TESTIMONIAL PLACEHOLDER]` blocks per D-13, no fabricated ratings/JSON-LD. |
| / | s06 | cta-band | ADAPTED | Closing CTA band before footer; same purpose, our copy/CTA text. |
| / | (none) | map | NOVEL | Reference home has no map section (it has a YouTube embed instead). Required on home per D-08. |
| / | footer | footer | ADAPTED | NAP block, hours, `SERVICE_AREA` sentence, no email column (D-03), no Locations link (D-02). |

## `/about` (ref: `/about-us/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| /about | header | header | ADAPTED | Shared shell, see `/` header row. |
| /about | s01 | intro-body | ADAPTED | Reference segments as one content blob (no page-builder bands, `segMode: fallback`); ours composed from the section vocabulary at the same rough length/photo-slot budget. No invented history/founding year/headcount — `TODO(fact):` each per D-14/D-17. |
| /about | footer | footer | ADAPTED | Shared shell, see `/` footer row. |

## `/services` (ref: `/roofing-services/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| /services | header | header | ADAPTED | Shared shell, see `/` header row. |
| /services | s01 | category-bar | ADAPTED | Two thin bands (s01 112px, s02 168px @1440) ahead of the list — likely a category/breadcrumb strip; same purpose, our own service categories. |
| /services | s03 | services-list | ADAPTED | Main services content blob (`segMode: [role="main"] > *`). Regrouped by symptom vs. reference's category grouping (D-01/Prompt 3), no prices (D-12), no per-service routes. |
| /services | footer | footer | ADAPTED | Shared shell, see `/` footer row. |

## `/contact` (ref: `/contact-us/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| /contact | header | header | ADAPTED | Shared shell, see `/` header row. |
| /contact | s01-post-217-fill-out-the-form | contact-form | ADAPTED | Form band; ours drops the email field per D-05 (name, phone, service, callback window, message), no backend. |
| /contact | s02 | info-band | ADAPTED | Hours/phone card, same purpose. |
| /contact | s03 | map | ADAPTED | Reference embeds **five** Google Maps iframes here (a locations/service-area grid) — that's the D-02 city-grid pattern and gets deleted. Ours is exactly one keyless coords-only embed at zoom ~15 per D-07/D-08, same slot purpose, deliberately reduced content. |
| /contact | s04 | reviews-or-cta | ADAPTED | Trailing band; purpose retained (trust/CTA), content ours. |
| /contact | footer | footer | ADAPTED | Shared shell, see `/` footer row. |

## `/privacy` (ref: `/privacy-policy/`)

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| /privacy | header | header | ADAPTED | Shared shell, see `/` header row. |
| /privacy | s01 | policy-body | NOVEL | Reference segments as one content blob; per D-16 our policy body is generated fresh to describe what this site actually does (phone-callback form, no email collection, no analytics/cookies) — no counterpart worth pixel-diffing. Measured by token conformance only. |
| /privacy | footer | footer | ADAPTED | Shared shell, see `/` footer row. |

## Deleted per D-02

| route | ref-section-id | our-section-id | CLASS | reason |
|---|---|---|---|---|
| (none) | areas-we-serve page | (none) | DELETED | Reference has a full `/areas-we-serve/` locations page with a city grid. Not one of our five routes; also scrub the nav item, footer column, and the multi-marker map grid pattern that reappears on `/contact-us/`. |
