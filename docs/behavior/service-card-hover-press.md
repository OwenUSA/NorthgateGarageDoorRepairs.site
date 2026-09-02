# Service card hover / press

Applies to the home `services-grid` teaser cards and the `/services` symptom cards
(`content/copy.ts`'s `SERVICES` array, eight items, both places).

## Mechanism

Hover: `transform: translateY(-4px)` plus a `box-shadow` swap (resting shadow →
slightly larger, softer shadow), both on the card's outer wrapper. **Not** `margin-top`
or `top` — either forces a layout reflow of every sibling card in the same row/grid on
every hover-in/hover-out, which is the visible jitter version of the same mistake the nav
drawer spec calls out for `max-height`. **Not** a `filter: drop-shadow()` swap in place of
`box-shadow` — `drop-shadow` forces a compositing pass over the card's actual alpha mask
(relevant once the card has a placeholder image slot with transparent corners) and is
measurably more expensive than a plain `box-shadow` for no visual difference here.

Press (`:active`): `transform: scale(0.98)`, applied on top of (not instead of) whatever
hover transform is active, so a mouse press while hovering still shows both the lift and
the press.

## Ratio

Hover transition: `0.18s ease-out` on `transform`, `0.18s ease-out` on `box-shadow`,
same duration and easing on both so they read as one movement, not two. `-4px` is
deliberately small — enough to register as "this is interactive" at a glance, not enough
to make text inside the card visibly reflow against its own shadow. Press: `0.1s
ease-out`, shorter than hover, because a press is a momentary acknowledgment, not a
settled state — it should feel quicker than the hover-in.

## Failure mode

Animating `box-shadow` alone without the `transform` lift reads as the card "getting
dirty" rather than lifting — shadow blur changing under a static card is a much weaker
affordance than genuine parallax-style movement. Skipping the `:active` state entirely
(common when a team only implements `:hover`) means touch users — who never get a hover
state — see zero feedback on tap, which on a card whose whole job is "tap this to call or
go to /services" reads as the tap not having registered at all.

## Trigger

`:hover` / `:active` pseudo-classes, standard CSS, no JS. On mobile (`< hoverMinBp`, 768),
hover styles are not suppressed by pointer-media query gymnastics — they simply never
fire, because there is no persistent hover on touch. `:active` still fires on tap at every
width. No route-change behavior needed; this is a rest-state pseudo-class, not a mounted
component state.

## Accessibility

The lift and shadow are decorative reinforcement of an existing focusable, semantic
control (`<a>` for the `/services` deep-link cards, `<button>` where the card itself
triggers the FAQ-style accordion — see `service-accordion.md`) — never the *only* signal
that something is interactive. `:focus-visible` gets the same lift treatment as `:hover`
plus a `2px` outline at 3:1 contrast against the card background, so keyboard users get
equivalent feedback to mouse users, not a bare focus ring with no lift. Under
`prefers-reduced-motion: reduce`, `transform` transitions drop to `0.01s` (effectively
instant) but the end states — lifted, pressed — still apply; only the animated path
between them is removed.
