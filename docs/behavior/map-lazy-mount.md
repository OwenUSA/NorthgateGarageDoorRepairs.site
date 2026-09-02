# Map lazy-mount

`<BusinessMap>` per D-07/D-08: coords-only, keyless Google Maps embed, required on the
home page (one section, zoom ~13) and on `/contact` (beside the form, zoom ~15). Zoom is
a prop; both instances render the same component with different props, never a second
implementation.

## Mechanism

The `<iframe>` itself carries native `loading="lazy"` (the browser defers the network
request until the element is near the viewport — no JS needed for that part). On top of
that, the iframe's `src` is only set once an `IntersectionObserver` (rootMargin `200px`,
so it starts loading slightly before it's on-screen rather than exactly at the boundary)
reports the wrapper as intersecting — a **double-lazy** approach: `loading="lazy"` alone
is enough in every modern browser, but gating the `src` assignment behind the observer
means the network request for Google's iframe document genuinely never fires until the
component is about to be seen, rather than trusting the browser's own heuristics (which
vary by browser and by how far ahead they choose to prefetch). **Not** rendering the
iframe unconditionally and relying on `loading="lazy"` alone — that's the simpler,
acceptable-but-weaker version; the observer gate is the belt-and-suspenders choice
specifically because the map is one of the heaviest network requests on the page (Prompt
11's Lighthouse note: "expected... lazy-mount it, give it a static poster until
interaction if you want the points back").

Aspect-ratio wrapper: `aspect-ratio: <w> / <h>` (16/9 on desktop, taller on mobile per
`docs/profile.md`'s captured slot geometry) reserves the space **before** the iframe
mounts, so there is zero layout shift when it does. **Not** a fixed-`height` div with no
`aspect-ratio` — that either reserves the wrong amount of space at a breakpoint the
author didn't test, or requires a breakpoint-by-breakpoint height table that drifts from
the actual rendered iframe over time.

## Ratio

`rootMargin: 200px` on the observer — roughly one typical scroll-flick's worth of runway
on a phone, enough that the map is usually already loaded by the time it's fully on
screen, not so large that it starts loading while still two sections away. Poster state
(before mount): a static, low-cost placeholder matching the wrapper's dominant color
(`docs/facts-needed.md`/`assets/INVENTORY.md` conventions), with the caption text
("Serving the greater Portland metro area" / "Find us") always server-rendered above or
below it — that text is never gated behind the observer, only the iframe is.

## Failure mode

Mounting the iframe on page load unconditionally (no lazy anything): on `/contact`, where
the map sits below the fold next to the form, this is pure wasted bandwidth for a visitor
who submits the callback form without ever scrolling to see the map — exactly the
Lighthouse penalty Prompt 11 already expects and accepts *for the lazy version*; the
unconditional version pays that cost with nothing gained. Using `display: none` before
mount instead of an aspect-ratio-reserved placeholder: `display: none` collapses the
box entirely, so mounting the iframe later causes the exact layout shift the
aspect-ratio wrapper exists to prevent.

## Trigger

`IntersectionObserver` fires once per mount, on scroll or on initial layout if the map is
already in the initial viewport (rare — it's below the hero on both routes it appears
on). It does not re-fire or unmount the iframe when scrolled back out of view — once
loaded, it stays loaded, since Google's own embed has no meaningful "pause" state worth
tearing down for. Client-side route change (leaving `/contact` for `/`) unmounts the
component entirely via normal React unmount; returning to `/contact` remounts fresh,
observer re-armed, poster shown again until it re-intersects.

## Accessibility

The iframe carries an explicit `title` ("Map showing Northgate Garage Door Repairs'
service area" / "Map to Northgate Garage Door Repairs, 6340 Alder Ridge Way") — required
per D-08, and required regardless for a screen reader to announce what the embedded
document is. A visible "Get directions" link (`https://www.google.com/maps/dir/?api=1&
destination=<MAP_COORDS>`) sits outside the iframe as a real, keyboard-reachable anchor —
the iframe's own internal controls are not a reliable keyboard path (they're Google's UI,
not ours, and can't be styled or guaranteed operable the same way across browsers), so the
directions link is the accessible equivalent action, not a decorative extra. No
`prefers-reduced-motion` branch applies — nothing here animates; the placeholder-to-iframe
swap is an instant DOM replacement, not a transition.
