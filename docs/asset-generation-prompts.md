# docs/asset-generation-prompts.md — Prompt 10, asset generation prompts

One generation prompt per `REPLACE` slot group in `assets/INVENTORY.md`, written after
Prompt 9's palette apply (`docs/known-divergence.md`, seed 601103). Badge/logo/favicon
slots are **excluded** here per D-13/D-14/D-09 — fabricated credentials and a business
logo that doesn't exist are `TODO(fact)`, not something a generator invents; see
`docs/facts-needed.md`, already flagged. Subject matter throughout is **ours**: generic
garage-door hardware, panels, springs, openers, tracks, and a technician at work — never
the reference's roofing subjects, never readable branding, license plates, faces, or
logos in-frame.

**Generator**: Midjourney v6 (`--v 6`) for every slot, `--style raw` for anything with
people or hardware where photographic accuracy matters (avoids MJ's default stylization
drifting toward illustration), default style omitted for the abstract/textural
background-only slots. `--ar` set per slot below. Two seeds per prompt for variation
selection, no `--seed` pinned (these are one-off placeholders, not a series needing
visual consistency beyond the shared style/palette direction given in every prompt).

**Palette to bake into every prompt** (seed 601103, split-complementary +210deg — see
`docs/known-divergence.md` for the full token mapping): warm charcoal-plum ink
(`#322326`) and near-black maroon shadow (`#1e050c`) for dark tones/silhouette/shadow
areas; deep teal accent (`#086677`, shadow variant `#025362`) as the one saturated
"branded" color, reserved for a single accent element per image (a tool handle, a
service-van door panel, a uniform stripe) the way the CTA button is the one saturated
element on the page — never wash a whole scene in it; pale blush-pink ambient
light/surfaces (`#ffeef1`, `#fcd5dc`) for sky, wall, or bounce-light tones; muted
mauve-brown midtones (`#6a4a51`) for concrete/asphalt/weathered-wood midtones. This is a
cool-morning/blush-dusk color grade, not the reference's roofing site's greys/sage-greens
— that palette stays on their site per D-09.

**2nd crop rule**: only where the INVENTORY row's `aspect Δ` column says **yes** (the
mobile aspect ratio genuinely differs from desktop, not just a proportional resize) is a
second, separately-composed crop written below. Everywhere else, one generation composed
loose enough to crop to every listed breakpoint from a single source frame.

---

## Home (`/`)

### 1. Hero background — `bg-hero-bg-desktop` / `-tablet` / `-mobile`
Desktop 1440x891 (1.62:1), tablet 768x557, mobile 390x769 (portrait, **aspect Δ: yes** —
mobile is markedly taller/narrower than the wide desktop crop, not a simple recrop).

**Crop A — desktop/tablet (1.62:1, `--ar 16:10`):** Wide establishing shot of a
suburban home's attached garage at low golden-hour sun angle, camera at eye level roughly
15ft back and slightly off-center so the garage door fills the right two-thirds of frame,
door in a mid-raised position with a technician (back three-quarter view, no visible face,
generic dark workwear with a single teal (#086677) chest-stripe accent, no logos/text on
clothing) crouched at the bottom track adjusting a roller. Shallow-medium depth of field
(f/4 equivalent), driveway concrete rendered in the muted mauve-brown midtone, sky a pale
blush-pink (#ffeef1) morning gradient, subtle warm film grain, no visible house numbers,
mailboxes with names, or license plates. Photographic, not illustrated.
`--ar 16:10 --style raw --v 6`

**Crop B — mobile (390x769, ~1:2 portrait, `--ar 9:16`):** Tighter vertical reframe of
the same scene concept: door and technician fill the lower two-thirds, more sky/blush-pink
gradient carried into the top third to give the vertical frame somewhere to breathe.
Same lighting, palette, and wardrobe direction as Crop A.
`--ar 9:16 --style raw --v 6`

### 2. Footer background — `bg-footer-bg-desktop` / `-tablet` / `-mobile`
Desktop 1440x1092 (1.32:1), tablet 768x1045, mobile 390x1770 (tall). Aspect Δ not
flagged (mobile is a proportional crop, not a re-composition), so one wide source frame.
Abstract, low-contrast texture — this sits *behind* the footer's own text/nav, so it must
stay unobtrusive: a close-up macro texture of a closed garage door's horizontal panel
seams, slightly out of focus (shallow DOF, mostly bokeh), lit so the panel ridges read in
the muted mauve-brown midtone against a near-black ink (#1e050c) vignette at the edges —
dark enough that white footer text stays readable over it without an added scrim. No
hardware, logos, or people. `--ar 4:3 --style raw --v 6` (crop to each breakpoint from
the widest edge of this frame).

### 3. Postscript contact-CTA background — `bg-postscript-contact-bg-desktop` / `-tablet` / `-mobile`
Desktop 1440x881 (1.63:1), tablet 768x1362, mobile 390x1490. One source frame, cropped
per breakpoint (aspect Δ not flagged). A technician's hands (only hands/forearms in
frame, no face) operating a garage door opener wall-control button, teal (#086677) status
LED lit on the control unit as the single accent color, blush-pink (#ffeef1) soft
daylight from an open door behind, everything else in ink/mauve-brown midtones,
medium-shallow DOF on the hand/button, background softly blurred. `--ar 3:2 --style raw --v 6`

### 4. Process section — `bg-section-3-bg-desktop` / `-tablet` / `-mobile`, `bg-section-3-content-box-bg-desktop` / `-tablet` / `-mobile`, `bg-section-3-transition`
Two related assets: a section background texture, and one embedded content-box photo.

- **Section background** (desktop 1440x1088, tablet 768x1328, mobile 390x1456 — one
  frame, proportional crop): soft-focus macro of torsion-spring coils, extremely shallow
  DOF so only a thin plane is sharp, rendered mostly in ink/mauve-brown tones with a
  single coil catching a teal-tinted highlight. Quiet enough to sit behind body copy.
  `--ar 4:5 --style raw --v 6`
- **Content-box photo** (desktop 621x288 — 2.16:1 landscape card; tablet/mobile use the
  section background's own crop per the INVENTORY row, no separate generation needed):
  a technician (three-quarter back view, no face) tightening a bracket bolt on a garage
  door track with a socket wrench, teal-accented glove cuff as the one saturated color,
  blush-pink daylight fill, medium DOF. `--ar 2.16:1 --style raw --v 6`
- **Section transition graphic** (390x90 / 768x117 / 1440x197, 7.31:1 very wide letterbox,
  **aspect Δ: yes** — this is a decorative divider shape, not a photo crop): abstract,
  non-photographic — a thin horizontal wave/ribbon graphic in the ink-to-teal gradient
  (#322326 to #086677), flat vector style, no texture or grain, generated once at the
  widest (1440x197) ratio and re-rendered (not cropped) at the narrower mobile ratio so
  the wave frequency reads correctly at each width. `--ar 7.3:1 --v 6` (no `--style raw`
  — flat graphic, not photographic).

### 5. "Why choose us" imagery — `bg-section-4-bg-desktop` / `-tablet` / `-mobile`, `bg-section-4-top-image`, `bg-section-4-bottom-image`
Section background (desktop 1440x2178, tablet 768x2456, mobile 390x3051 — tall,
proportional crop, aspect Δ not flagged): very soft, almost-flat blush-pink (#ffeef1)
gradient wash with a faint diagonal texture suggesting brushed steel panel — kept nearly
neutral since two photo tiles sit on top of it. `--ar 2:3 --style raw --v 6`.

Two square-ish tiles, near-identical composition rule (both ~1.12:1, desktop scaling
360x321 to 742x662 / 676x603 — same crop, larger render, not a re-composition):
- **Top image**: close-up of a garage door opener motor unit mounted on the ceiling
  track, three-quarter angle, teal (#086677) indicator light lit, ink-toned housing,
  softly lit interior garage, medium DOF. `--ar 1.12:1 --style raw --v 6`
- **Bottom image**: close-up of a technician's hand adjusting a photo-eye safety sensor
  bracket near the bottom of a garage door track, same lighting/palette direction as the
  top image for visual consistency between the pair. `--ar 1.12:1 --style raw --v 6`

### 6. Testimonials section background — `bg-section-5-bg-desktop` / `-tablet` / `-mobile`
Desktop 1440x1195 (1.21:1), tablet 768x1062, mobile 390x1358. One frame, proportional
crop. Darker register than the rest of the page (reference dominant colors here are the
darkest in the set) — an out-of-focus, dusk-toned driveway/garage bokeh, ink and
near-black maroon (#1e050c) tones dominant, a few soft teal-tinted highlight bokeh circles
(porch light through a teal-tinted lens flare), dark enough that white testimonial-card
text/quote marks stay legible on top. `--ar 6:5 --style raw --v 6`

### 7. Services-grid tiles — `cta-tile-cta-gutter-services`, `cta-tile-cta-residential-roofing`, `cta-tile-cta-roof-repairs`
Three small icon-scale photo tiles (~76x94, 112x83, 111x77 — all roughly 1:1 to 1.4:1,
tight crops, no separate mobile composition needed at this size). Subjects renamed to our
services, not the reference's roofing services:
- `cta-tile-cta-gutter-services` -> **spring repair** tile: extreme close-up of a
  torsion spring end-cap and cable drum, ink/mauve-brown metal tones, single teal
  highlight streak. `--ar 4:5 --style raw --v 6`
- `cta-tile-cta-residential-roofing` -> **garage door installation** tile: close crop of
  a new steel door panel corner being set into its track, technician's gloved hand at
  frame edge only. `--ar 4:3 --style raw --v 6`
- `cta-tile-cta-roof-repairs` -> **opener repair** tile: close crop of an opener
  logic-board panel with a technician's screwdriver mid-adjustment, teal status LED lit.
  `--ar 3:2 --style raw --v 6`

---

## About (`/about`)

### 8. Page header banner — `bg-page-title-bg`
390x152 (8.37:1 ultra-wide strip), 768x172, 1440x172. **Aspect Δ: yes** — mobile is
noticeably shorter relative to width than the two wider breakpoints already share, so two
crops.

**Crop A — tablet/desktop (1440x172 / 768x172, ~4.5-8.4:1):** Extremely wide, short
letterbox banner: a row of closed garage doors along a suburban street, shot straight-on
at a slight distance so the row reads as a repeating pattern, doors in alternating
ink-toned and mauve-brown-toned finishes with one door (off-center, not centered — avoid
a symmetrical "logo-like" composition) rendered with a teal accent trim strip. Flat,
even daylight, minimal shadow, blush-pink sky sliver at the top edge. `--ar 8.4:1
--style raw --v 6`

**Crop B — mobile (390x152, ~2.6:1):** Tighter reframe on just two of the doors from
Crop A's concept (not the same file recropped — the strip is too extreme to survive a
straight recrop to 2.6:1 without losing the "row" read), same lighting/palette.
`--ar 2.6:1 --style raw --v 6`

---

## Services (`/services`)

### 9. Page header banner — `bg-roofing-city-page-header` / `-mobile`
Desktop 1440x859 (1.68:1), tablet 768x764, mobile 390x776 (near-square). **Aspect Δ:
yes.**

**Crop A — desktop/tablet (1.68:1):** Technician mid-repair on a garage door track,
shot from a slightly elevated three-quarter angle so the whole door and technician fit
in a landscape frame, tool bag open in the foreground (generic tools, no branded logos on
any case), teal-accented kneepad as the one saturated color, mauve-brown concrete floor,
blush-pink daylight from the open door. `--ar 5:3 --style raw --v 6`
**Crop B — mobile (390x776, ~1:2 near-square-to-portrait):** Cropped tighter and taller
on the technician and the section of track being worked on, same scene concept as Crop A
recomposed for a vertical frame rather than a straight crop (the wide floor plane
doesn't survive a 1.68:1 -> 1:2 recrop). `--ar 1:2 --style raw --v 6`

### 10. Content images — `bg-roofing-city-section-1-static`, `bg-roofing-city-section-2-static`
Both ~1.12:1 square-ish (359x320 desktop/tablet, 356x317 desktop for the second — a
single square crop serves all three breakpoints, aspect Δ not flagged):
- **Section 1**: close-up of a galvanized steel track section with rollers, ink-toned
  metal, single teal highlight along one edge. `--ar 1:1 --style raw --v 6`
- **Section 2**: close-up of a technician's hands rethreading a lift cable onto a drum,
  mauve-brown gloves, teal-accented cable clamp as the one accent. `--ar 1:1 --style raw --v 6`

### 11. Symptom-list section backgrounds — `bg-section-1-bg` / `-mobile`, `bg-section-2-bg` / `-mobile`, `bg-section-3-bg` / `-mobile-1`
Three sections, each with a desktop/tablet crop and a **separately composed** mobile
crop (all three rows are flagged **aspect Δ: yes** — 12:5 ultra-wide down to a much
taller mobile frame in every case).

- **Section 1** (12:5 desktop/tablet -> 390x1078 tall mobile): a wide, softly-lit
  photo of an open garage interior with a door mid-travel, motion-blurred just enough to
  read as "in motion" without losing door-panel detail; mauve-brown/ink tones, blush-pink
  daylight wedge from the opening. Desktop crop `--ar 12:5 --style raw --v 6`; mobile
  crop tightens to just the door leading edge and track, recomposed vertically, `--ar
  9:20 --style raw --v 6`.
- **Section 2** (0.95:1 desktop/tablet -> 390x1716 tall mobile): near-square desktop
  crop of a full closed door with a technician stepping back from finished work (back
  view only), `--ar 1:1 --style raw --v 6`; mobile crop is a vertical reframe centered
  tighter on the door and technician, `--ar 9:20 --style raw --v 6`.
- **Section 3** (0.96:1 desktop/tablet -> 390x2288 tall mobile): near-square desktop
  crop, close-to-medium shot of an opener control panel and keypad (no readable digits/
  codes), teal-lit display as the accent, `--ar 1:1 --style raw --v 6`; mobile crop
  reframes vertically on just the panel, `--ar 9:20 --style raw --v 6`.

### 12. Testimonial-band background — `bg-testimonial-bg`, `bg-testimonial-bg-mobile`
Desktop 1440x606 (2.38:1). Mobile/tablet share `bg-testimonial-bg-mobile` at 390x552 /
768x603 (~1.3:1 — **aspect Δ: yes**, notably less wide than the desktop letterbox).
Same "dark enough for white text" requirement as the home testimonials background (§6):
out-of-focus dusk driveway bokeh, ink/near-black maroon dominant, sparse teal-tinted
highlight bokeh. Desktop `--ar 2.38:1 --style raw --v 6`; mobile/tablet crop is its own
composition (tighter framing, fewer bokeh points so the smaller frame doesn't feel
cluttered), `--ar 4:3 --style raw --v 6`.

---

## Excluded — TODO(fact), not generated (D-13/D-14/D-09)

`favicon`, `logo`, and every `badge-*` slot in `assets/INVENTORY.md` (BBB, GAF,
CertainTeed ShingleMaster Premier, Top 100 Roofing Contractors, Best of Gwinnett,
Nextdoor Neighborhood Fave x3, chamber/community affiliations, and their `-alt`/`-hp`/
`-fraser` variants) are **not** given generation prompts. A generator has no way to
produce a real BBB accreditation or a real business logo — doing so would fabricate a
credential or a mark the business doesn't hold, which is exactly what D-13/D-14 forbid.
These stay `TODO(fact)` in `docs/facts-needed.md` (already recorded there from Prompt 2)
until the business supplies its actual logo file and actual certifications, if any. The
`favicon` slot is tied to the same `TODO(fact): logo asset` — once a real wordmark
exists, the favicon is a trivial derivative of it, not a separate photographic
generation.
