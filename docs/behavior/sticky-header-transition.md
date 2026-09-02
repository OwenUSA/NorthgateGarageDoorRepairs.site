# Sticky header transition

**The decision this spec documents: there isn't one.** Prompt 1 captured the reference's
header at rest and at `scrollY = stickyEngageScrollPx` (900px) and the two states are
byte-identical except for `top` offset — `position: relative` in both, no shadow, no
background change, no size change (`docs/profile.md`, `states.headerAtTop` /
`states.headerScrolled` in `.harness/profile/ref-home-*.json`). Per the Prompt 5 answer
in `process.md` Appendix A ("Should the header shrink or change on scroll? Only if the
reference does. Otherwise static."), our header is likewise static. This file exists
because "sticky header transition" is one of the eight required specs regardless of the
answer — the spec is "document why nothing happens," not "skip it."

## Mechanism

`position: static` (the default; no `position: sticky`, no `position: fixed`, no scroll
event listener, no `IntersectionObserver` on the header). **Not** `position: sticky` with
a scroll-triggered class swap — that's the tempting default for "modern site header," and
it is exactly the divergence this spec exists to prevent: adding it would manufacture a
FIDELITY mismatch against a reference that has no such state to converge on.

## Ratio

None apply — there is no transition to time. Recorded here instead of omitted so a future
"why doesn't the header do X" question resolves by reading this file, not by re-deriving
it from a capture.

## Failure mode

The tempting-but-wrong version: `position: sticky; top: 0` plus a `box-shadow`/background
opacity fade keyed off `window.scrollY`. It looks like an improvement in isolation, but
(a) it has no source of truth — Prompt 8's convergence loop would grind on a divergence
it invented itself, since the reference has nothing there to diff against, and (b) on a
five-route site where the phone number is the entire point, a header that changes size on
scroll shifts every fixed-position element below it (the mobile call bar, if it were
header-relative) for no measured benefit.

## Trigger

None. There is no scroll listener to fire. The header's on-screen position is identical
at page load and at any scroll depth, on every route, at every breakpoint.

## Accessibility

Because nothing moves or resizes, there's no focus-order hazard, no layout shift to
announce, and no `prefers-reduced-motion` branch needed — the "reduced motion" version of
this behavior is the only version. The mobile sticky call bar (`mobile-sticky-call-bar.md`)
is the actual persistent-conversion-path mechanism on this site; it is a separate,
deliberately fixed element, not a header state.
