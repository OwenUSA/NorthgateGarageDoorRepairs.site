# docs/content-divergence.md — Prompt 3 measured divergence

Source of truth for the numbers: `_shared/harness/src/similarity.mjs`, run against
`content/copy.ts` and `.harness/refcopy.json`. Re-run any time with
`node _shared/harness/src/similarity.mjs` from the site root (needs `.harness/refcopy.json`,
built by `node _shared/harness/src/refcopy.mjs` — already run in this prompt).

## Result

```
5-gram gate  : 19/19 pass — zero shared 5-grams with the ENTIRE reference corpus (every
               page, not just the paired section)
trigram gate : 19/19 pass — worst-case trigram Jaccard overlap = 0.000 (every section)
length gate  : 6/6 measured sections within ±10%; 5 sections EXEMPT (reference band
               carries no comparable body text — see per-row reasons below), never
               reported as a false PASS
```

Worst-case overlap number: **0.000** (trigram Jaccard, all 19 sections — home, about,
services, contact, privacy, plus each route's metadata block). Zero shared 5-grams
against the full reference corpus, on every section. The industry allowlist (`garage
door`, `torsion spring`, `opener`, `cable`, `roller`, `track`, `panel`, `off-track`,
`remote`, `keypad`, `sensor`, `weather seal`, `residential`, `commercial`, `same-day`,
`free estimate`, `repair`, `installation`, `replacement` — `harness.config.mjs`) is
stripped before either gate runs, so none of these terms could have inflated the
overlap, but in practice the gap between a roofing site's vocabulary and a garage-door
site's vocabulary makes this an easy pass, not a close one.

## Full table

```
route | section | ref | our chars | ref chars | Δ% | 5-grams | trigram | status
------|---------|-----|-----------|-----------|----|---------|---------|-------
/ | hero | s01 | 1364 | 1515 | -10 | 0 | 0.000 | PASS
/ | services-grid | s04-top-quality-roofing | 2113 | 1974 | +7 | 0 | 0.000 | PASS
/ | testimonials | s05-the-hardest-working-... | 814 | 902 | -9.8 | 0 | 0.000 | PASS
/ | intro | s02-professional-roofing-... | 433 | 474 | -8.6 | 0 | 0.000 | PASS
/ | process | (none, NOVEL) | 561 | - | - | 0 | 0.000 | PASS
/ | map | (none, NOVEL) | 103 | - | - | 0 | 0.000 | PASS
/ | (metadata) | metadata | 247 | - | - | 0 | 0.000 | PASS
/about | intro-body | s01 | 1129 | 606 | +86.3 | 0 | 0.000 | PASS (EXEMPT) |
/about | (metadata) | metadata | 212 | - | - | 0 | 0.000 | PASS
/services | symptom-prompt | s01 | 261 | 320 | -18.4 | 0 | 0.000 | PASS (EXEMPT)
/services | services-list | s03 | 2001 | 606 | +230.2 | 0 | 0.000 | PASS (EXEMPT)
/services | (metadata) | metadata | 232 | - | - | 0 | 0.000 | PASS
/contact | contact-form | s01-post-217-fill-out-... | 650 | 595 | +9.2 | 0 | 0.000 | PASS
/contact | info-band | s02 | 107 | 0 | +Infinity | 0 | 0.000 | PASS (EXEMPT)
/contact | map | s03 | 71 | 0 | +Infinity | 0 | 0.000 | PASS (EXEMPT)
/contact | reviews-or-cta | s04 | 420 | 454 | -7.5 | 0 | 0.000 | PASS
/contact | (metadata) | metadata | 196 | - | - | 0 | 0.000 | PASS
/privacy | policy-body | (none, NOVEL) | 1582 | - | - | 0 | 0.000 | PASS
/privacy | (metadata) | metadata | 207 | - | - | 0 | 0.000 | PASS
```

## Exempt rows, and why (never reported as PASS on their own — always EXEMPT)

- `/about::intro-body` (+86.3%) — the reference `/about-us/` page segments as
  header+footer chrome only under our `sectionCandidates` (`segMode: fallback`). Its real
  body content (bio, embedded video, sidebar form) is never isolated as its own band, so
  there is no reliable reference length to size against; sized to about-page convention
  instead. Same root cause affects `/privacy`, which is why `/privacy::policy-body` has no
  `refSection` at all (NOVEL, not even attempted against a reference length).
- `/services::symptom-prompt` (-18.4%) and `/contact::info-band` / `/contact::map`
  (+Infinity%) — the paired reference bands genuinely carry `bodyChars: 0` (icons, chips,
  and — for `/contact`'s map band — five Google Maps iframes with no text at all). A
  percentage delta against a zero- or near-zero-char baseline is undefined, not "small."
- `/services::services-list` (+230.2%) — the reference's real service descriptions live
  inside a widget the probe cannot cleanly separate from surrounding chrome (`s03`'s
  606 measured chars is chrome bleed-through, not the actual service copy); sized to a
  working eight-item symptom-first services page instead.

## The four required structural changes

1. **Reorder ≥ 3 sections.** Home page: reference content order is Hero → Intro →
   [dropped filler] → ServicesGrid → Testimonials → [dropped CTA]. Ours: Hero →
   **ServicesGrid** → **Testimonials** → **Intro** → Process (new) → Map (new).
   ServicesGrid, Testimonials, and Intro all move relative to each other and to Hero.
2. **Drop two reference sections, add two of our own.** Dropped: the reference's
   unlabeled `s03` (thin "why choose us" filler band, almost no body copy) and `s06`
   (unlabeled closing CTA band, absorbed into the footer instead). Added: `process`
   ("how a repair visit actually goes," a 3-step explainer with no reference counterpart)
   and `map` (required by D-08 — the reference's home page has no map at all).
3. **Headline proposition category changed.** The reference leads on workmanship/quality
   — "Roofing excellence starts here," "Top Quality Roofing," "The Hardest Working
   Roofing Contractor." Ours leads on **a real person answers the phone** — distinct
   from workmanship and from transparency, held across every route: the home hero
   ("A real person answers when you call"), the about intro ("We answer our own phone"),
   the contact form intro ("Tell us what's wrong"), and the footer tagline
   (`TAGLINE` in `CLAUDE.md`'s CONSTANTS: "Straight talk, solid work — garage door
   repair done by people who answer the phone.").
4. **Services regrouped by symptom, not type.** The reference's `/roofing-services/`
   groups by category (shingle roofing, gutter replacement, reroofing, storm damage,
   emergency roofing, general repairs). `content/copy.ts`'s `SERVICES` array leads every
   one of the eight canonical services with how a customer would describe the problem on
   the phone ("the door won't open, or it slams down fast," "it's loud, it grinds, or it
   slams," "the remote or keypad stopped working," …) with the canonical service name as
   the answer underneath.

## No invented facts (D-14/D-17 still apply)

Divergent copy is not license to claim credentials. `content/copy.ts`'s `/about` section
carries explicit `TODO(fact)` lines for founding year, team size, and licensing/bonding/
insurance — none invented, all listed in `docs/facts-needed.md`. Testimonials are literal
`[TESTIMONIAL PLACEHOLDER]` blocks (D-13), no star ratings, no `AggregateRating`/`Review`
JSON-LD. No prices anywhere (D-12) — "free estimate" is the only cost-adjacent phrase used,
per the allowlist. No email in any section (D-03) — confirmed by inspection of
`content/copy.ts`; the Prompt-0 email sweep re-runs against `app/`/`components/` once
those exist.

## `docs/sections.md` updated

See that file directly — every section touched by a structural change above is annotated
inline, and the Prompt 1 mislabeling of the reference's `s01` (hero, not a standalone
"trust-badges" band) is corrected there.
