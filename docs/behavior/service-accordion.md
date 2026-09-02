# Service card accordion (no separate FAQ section)

Per `process.md` Appendix A: an FAQ on `/services` is optional, and the eight-item list
there is the actual content load. Rather than add a ninth section, each symptom card on
`/services` doubles as an accordion item below 768px, where vertical space is scarce;
at 768px and above, all eight blurbs render open and static (no accordion mechanics at
all — there's room for them on screen without hiding anything).

## Mechanism

Below 768px: `<button aria-expanded>` per card toggles a `grid-template-rows: 0fr → 1fr`
transition on the blurb wrapper (the "CSS grid trick" for animating to auto height),
inner content wrapped in a `div` with `overflow: hidden`. **Not** `height: auto` directly
(not animatable) and **not** `max-height: <large fixed number>` (animates a fixed number
that has nothing to do with the actual content height, so short blurbs finish "opening"
long before the visible transition ends — a very common tell of a hand-built accordion).
**Not** the `<details>`/`<summary>` native element — it's the semantically correct
primitive for this, but its open/close transition cannot be animated smoothly across
browsers without replacing its default toggle behavior anyway, at which point using it
buys nothing over a plain button + `aria-expanded`.

At 768px and above the button is not rendered at all (server-rendered, so no JS needed to
"fix" a mobile-only control on desktop) and the blurb wrapper's `grid-template-rows` is
hard-set to `1fr` with no transition — desktop never runs the accordion code path.

## Ratio

`0.25s ease-in-out` on `grid-template-rows`. Slower than the card hover (`0.18s`) because
this is a content reveal, not a hover affordance — a reveal that finishes too fast reads
as a jump-cut rather than an expansion. Only one card is open at a time (opening a new one
closes whichever was previously open) — eight independently-openable blurbs stacked would
make the page height on mobile unpredictable and push the eighth card several screens
down; capping at one open avoids that without adding a "collapse all" control nobody asked
for.

## Failure mode

Using `max-height: 500px` (or any fixed guess) as the animated property: a two-sentence
blurb "finishes" its open transition in the first 20% of the animation's declared
duration because the actual content is far shorter than 500px, then sits static for the
remaining 80% — visually, the card looks like it stopped mid-animation. The
`grid-template-rows: 0fr → 1fr` technique sidesteps this because the browser computes the
real content height every frame instead of interpolating toward an arbitrary number.

## Trigger

Tap/click on the card header (below 768px only). Opening card B while card A is open
closes A first (same duration, same easing, running concurrently — not sequenced, so the
net perceived time to swap is the same 0.25s, not 0.5s). No route-change handling needed:
navigating away from `/services` unmounts the component entirely, so there's no persisted
open/closed state to reset on return — every visit to `/services` starts with all cards
closed.

## Accessibility

`aria-expanded` on the trigger button, `aria-controls` pointing at the blurb wrapper's
`id`, and the wrapper carries `role="region"` with `aria-labelledby` referencing the
trigger. Focus stays on the trigger button after toggling (nothing steals focus into the
newly-revealed content) — a screen reader user hears the state change via `aria-expanded`
without being forcibly moved. Under `prefers-reduced-motion: reduce`, the
`grid-template-rows` transition duration drops to `0.01s`; the open/closed states
themselves are unchanged, only the animated path between them shortens.
