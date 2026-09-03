# docs/PRE-LAUNCH.md — before this site goes live for real

This build is a structurally-complete clone-and-adapt of `https://www.fraserroofingllc.com/`
for a placeholder business (`Northgate Garage Door Repairs`). Everything in this file is a
real-world step that happens **outside** this codebase before the site can represent an
actual business. None of it is a code defect — the acceptance sweep (Prompt 11) passed
13/14 gates with the palette/geometry/content/a11y work this chain covers; this list is
what a human owner supplies next.

## 1. Real NAP (name/address/phone)

`lib/business.ts` currently holds fictional, deliberately-non-working values (D-04/D-07):
phone `(503) 555-0174` (555-01XX reserved range, cannot ring anyone), address `6340 Alder
Ridge Way, Portland, OR 97217` (does not geocode — coordinates `45.5788,-122.6929` are a
real point used only for the map embed, not tied to the fake street address). Before
launch: replace every field in `lib/business.ts` with the real business's phone, address,
and coordinates. Because every component reads from this one file (Prompt 5, item 5), that
is the only file that needs the swap for the shell/JSON-LD/maps — but also grep
`content/copy.ts` (`rg -n "555-0174|Alder Ridge|97217" content/copy.ts`), which repeats
the phone/address as literal strings inside marketing copy sentences (not imported from
`lib/business.ts`) and needs the same values updated by hand in the same pass, or it will
silently drift from `lib/business.ts` the next time either changes.

## 2. Real photos

`assets/INVENTORY.md` lists every `REPLACE` slot; `docs/asset-generation-prompts.md`
(Prompt 10) has one generation prompt per non-badge slot as a placeholder-quality
stand-in. Before launch, replace every one of those with **real photos of the actual
business** — real trucks, real technicians (with consent), real completed jobs. AI-
generated placeholder imagery should not represent a real company's actual work on a
live site.

## 3. TODO(fact) resolution — 3 tracked facts, 6 inline placeholders

Never invented, per D-14/D-17. Tracked in `docs/facts-needed.md`:

- **Logo** — no real logo file exists; the wordmark renders as text in the extracted
  display font (Russo One). Needs the business's actual logo (or a designed one) before
  launch, plus a derived favicon.
- **Trust badges / certifications / affiliations** — reference had BBB, GAF, ShingleMaster
  Premier, Top 100 Roofing Contractors, Best of Gwinnett, Nextdoor Neighborhood Fave x3,
  chamber/community affiliations. All placeholder chips today (D-14 — never invent a
  credential). Fill only with real, currently-held credentials, one at a time; delete the
  chip for any slot with no real counterpart rather than leaving a placeholder live.
- **Years in business / licensing / bonding / insurance status / jobs completed** — no
  claim exists anywhere in current copy. Six inline `TODO(fact)` markers in
  `content/copy.ts` (About and Privacy sections) and one explanatory comment in
  `components/about/AboutIntro.tsx` — search `rg -n "TODO\(fact\)" content lib components
  docs` to find every instance before launch.

## 4. Testimonials

`components/home/Testimonials.tsx` and the `/services` testimonial band render literal
`[TESTIMONIAL PLACEHOLDER]` blocks (D-13) — no fabricated names, quotes, or star ratings
exist anywhere, and no `Review`/`AggregateRating` JSON-LD was ever added. Before launch,
replace the placeholder blocks with real customer testimonials (with permission), and
only then consider adding `Review`/`AggregateRating` schema — with real review counts,
never fabricated ones.

## 5. Legal review

`components/privacy/PolicyBody.tsx` previously carried a visible `UNREVIEWED TEMPLATE`
dev marker (D-16) at the top of its content. That marker has been removed now that the
site is live and real business facts are in place. The page remains a standard,
honest-to-what-the-site-actually-does policy (callback form, no email collection, no
analytics, no cookies beyond framework defaults, no GDPR/CCPA compliance claim); if it
has not yet had an actual review by counsel, that should still happen independent of this
code change.

## 6. Form target

`components/contact/ContactForm.tsx` is marked `// STUB: no submission target` at the top
(D-05) — client-side validation only, submit shows a "we'll call you back" confirmation
state and `console.warn`s a stub notice. No backend exists. Before launch: wire it to a
real callback-request intake (a phone-callback queue, a CRM webhook, whatever the business
actually uses) — there is still no email collection per D-03, so the target is not an
inbox.

## 7. JSON-LD re-verification

`lib/jsonld.ts` builds a `LocalBusiness` block entirely from `lib/business.ts` — once
step 1 lands, re-run the JSON-LD through Google's Rich Results Test (or equivalent) to
confirm the schema still validates with real values, and reconfirm hours
(`07:00`–`19:00`, all seven days) match the business's actual hours, not just this
placeholder's assumed 7am–7pm block (D-06 — never invent "24/7 emergency" claims; if the
real business has different or split hours, `openingHoursSpecification` needs to change
to match, not just repeat this file's placeholder pattern).

## 8. Logo / badges — asset wiring

Once step 1's logo file and step 3's real badges exist, they still need to be dropped
into `public/` and wired into `<Header>`/`<Footer>`/`/about`'s trust-badge row at the slot
dimensions already recorded in `assets/INVENTORY.md` — that inventory is the geometry
contract, not just documentation.

## Not on this list

Deploy target, domain, hosting env vars, analytics/tracking, a database, and auth are all
explicitly **out of scope** per D-15/D-18 — this remains a local-only build until the
business or its owner decides otherwise; adding any of those is a separate decision this
chain never made for them.
