# Mobile sticky call bar

NOVEL — no reference counterpart. The reference's `#js-mobile-sticky-header` is its
mobile *top* bar (logo + phone icon + hamburger, replacing the desktop header below
`lg`); it is not a persistent bottom call-to-action, and per Prompt 1 it doesn't
reposition on scroll either. Ours is a deliberate addition below 768px: a `tel:` button
that never leaves the viewport, because the phone is the entire conversion path on this
site (D-04) and a repair customer scrolling to find it is the one friction point that
directly costs the call.

## Mechanism

`position: fixed; bottom: 0; left: 0; right: 0`, full-width bar, one primary `<a
href="tel:+15035550174">` button filling it. **Not** `position: sticky` — sticky is
relative to its scroll container and this bar must stay pinned regardless of where it
sits in the DOM (it renders once, in the root layout, not per-section). **Not** a
scroll-triggered show/hide (`transform: translateY()` toggled past some scroll offset) —
that reintroduces exactly the kind of scroll-linked state Prompt 1 found no evidence for
anywhere on this reference, for a control whose entire job is to always be reachable.

Rendered only below `hoverMinBp`'s sibling breakpoint (768px) via a CSS media query, not a
JS width check — avoids a layout flash while JS hydrates, and means the bar is present in
the server-rendered HTML on mobile before any script runs.

## Ratio

No animation on mount or scroll — it is simply always present, so there is no timing
value to tune. The one motion value that exists is a `0.15s ease-out` on `:active` (a
slight `scale(0.98)` press-down), matching the press feedback used on every other button
on the site (`service-card-hover-press.md`) so the call bar doesn't feel like a different
component glued on top of the page.

## Failure mode

Making this `position: sticky` inside a section wrapper: the moment that section scrolls
past, the bar scrolls away with it — silently breaking the one thing it exists to
guarantee. Making it appear only after N pixels of scroll (common "reveal on scroll"
pattern) means a customer who converts within the first screen — the fastest, easiest
conversion — never sees it at all.

## Trigger

None, structurally — it renders in the root layout, mounted on every route, at every
scroll position, and unmounts only when the viewport crosses back above 768px (a CSS
media-query boundary, re-evaluated continuously by the browser, not a one-time JS check
on route load). It does not need a `usePathname()` close-on-navigate handler the way the
drawer does, because it has no open/closed state — it's simply present or absent per
viewport width.

## Accessibility

Rendered as a `<nav>`-adjacent landmark-free fixed footer bar with a single accessible
name ("Call Northgate Garage Door Repairs now") on the anchor, not just the raw phone
number as the only accessible text. `padding-bottom` equal to the bar's height is applied
to `<body>` on mobile so the bar never overlaps focusable content beneath it (a fixed
element with no reserved space is a common cause of the last on-page control being
unreachable by keyboard focus ring visibility, even when technically tabbable). No
`prefers-reduced-motion` branch is needed for the bar's presence; the `:active` press
scale is removed under reduced motion, same rule as every other button.
