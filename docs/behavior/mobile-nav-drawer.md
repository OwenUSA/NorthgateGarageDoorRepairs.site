# Mobile nav drawer

**Where it exists:** below the `drawerMaxBp` breakpoint (980), replacing the always-
visible nav row. Nav items: Home, About, Services, Contact, plus a visible `tel:` button.
`/privacy` is a footer-only link on every breakpoint, not a nav item (matches the
reference, which does not put its privacy page in primary nav either).

## Mechanism

Fixed panel animated with `transform: translate3d(100%, 0, 0)` → `translate3d(0, 0, 0)`,
plus a separate full-screen backdrop animated on `opacity`. **Not** `max-height` (forces
layout recalculation on every frame, causes the link list to reflow and jitter mid-slide),
**not** `left`/`right` (paints, doesn't composite — same jank on a mid-range phone), and
**not** a `display: none`/`block` toggle (kills the CSS transition outright; the panel
would snap instead of animating on close).

Body scroll lock via `position: fixed; top: -<scrollY>px` on `<body>` while open, with the
saved `scrollY` restored on close. **Not** `overflow: hidden` on `<body>` — iOS Safari
ignores that property on the body element and the page scrolls underneath the open drawer.

## Ratio

Panel: `0.32s cubic-bezier(0.22, 1, 0.36, 1)`. Backdrop: `0.2s linear`, starting at `0ms`
(same moment as the panel, not staggered after it). The backdrop finishing first — it's
shorter and linear, the panel is longer and eased — is what makes the panel read as
arriving over an already-dimmed page rather than dragging the dimming in with it.

Nav links stagger `0.03s` apart, starting at `0.08s` after the panel starts. With five
items (four routes + one already-visible `tel:` button, so four staggered links) total
stagger time is `4 × 0.03 = 0.12s`, well under the panel's own 0.32s — a longer stagger on
this few items would read as a slideshow instead of one gesture.

## Failure mode

Animating `max-height` on the panel reflows every link on every frame — visible jitter,
worst on the router-linked list where link text lengths differ ("Contact" vs "Services").
`display: none` on close removes the element from the render tree before the transition
can run, so the drawer just vanishes — the single most common tell of a hand-rolled
drawer that was never checked with reduced motion off.

## Trigger

Hamburger click, `Escape` key, backdrop click, and **pathname change**. In App Router the
drawer does not auto-close on navigation — a `<Link>` click updates the route but the
drawer's own `open` state is untouched — so the drawer closes explicitly on `usePathname()`
change via a `useEffect` that calls the same close handler used by `Escape`/backdrop,
restoring body scroll the same way. Re-opening after a close-then-reopen restarts the
stagger from `0.08s`; there is no "already seen" fast-path.

## Accessibility

`aria-expanded` and `aria-controls` on the hamburger toggle, `aria-label="Close menu"` on
the in-panel close control. Focus is trapped inside the panel while open (`Tab`/`Shift+Tab`
cycle only through panel-internal focusables) and `inert` is applied to the rest of the
page tree so a screen reader can't navigate into content hidden behind the backdrop.
Focus returns to the hamburger toggle on every close path, including the pathname-change
close. Under `prefers-reduced-motion: reduce`, the transform duration drops to `0.01s`
and only `opacity` still animates — the drawer effectively snaps open/closed but never
jumps content around, and the stagger collapses to `0s` on every link.
