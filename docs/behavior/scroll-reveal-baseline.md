# Scroll-reveal baseline (self-imposed, not reference-matched)

Prompt 1's profile found **no** scroll-linked motion on the reference at all — no
staggered entrances, no parallax, no scroll-triggered class swaps anywhere in the capture
(`docs/profile.md`: "no scroll-linked motion found... this is a density/layout site, not
a choreography one"). This spec is therefore explicitly **not** cloning anything —
there is no source of truth on the reference side to converge against, so this behavior
is never measured by FIDELITY or STRUCT thresholds and never appears in
`docs/divergence.md`. It exists because a page where every section simply appears fully
rendered with zero motion reads as unfinished on a modern site, and because it's cheap
and easy to keep minimal. If it ever becomes a source of divergence-chasing, the answer
is to cut it, not tune it.

## Mechanism

One shared `IntersectionObserver` (not one per section — a single observer watching every
section-level wrapper, `threshold: 0.15`) toggles a single class (`data-revealed="true"`)
on each wrapper the first time it crosses 15% visible. The CSS itself does the animating:
resting state is `opacity: 0; transform: translateY(12px)`, revealed state is `opacity: 1;
transform: translateY(0)`, both on `transition`. **Not** a scroll-position calculation
(`window.scrollY` math to derive a 0–1 progress value) — that's the scroll-hijacking
shape the dependency allowlist bans libraries for (Lenis/Locomotive/GSAP ScrollTrigger),
and it's unnecessary for a binary "has this been seen yet" reveal. **Not** re-observing
after reveal — once `data-revealed` is set, the observer's callback for that element
disconnects (`observer.unobserve(el)`), so scrolling back up and back down never re-plays
the animation; a page that re-animates every time you scroll past it reads as decoration,
not content.

## Ratio

`translateY(12px) → 0` over `0.4s ease-out`, opacity over the same duration. `12px` is
small enough that it never looks like the content is "flying in" — it should read as a
soft settle, not a slide. `0.4s` is slower than any of the interactive-feedback timings
elsewhere on the site (card hover `0.18s`, form error `0.15s`) deliberately: an entrance
that happens once per section should feel calmer than a repeatable hover response.
`threshold: 0.15` (not `0` or `1`) means the reveal starts once a meaningful slice of the
section is visible, not the instant its top pixel enters the viewport (which would fire
while the section is still mostly off-screen and useless to look at) and not only once
it's fully on-screen (which on a tall section like the services grid could mean waiting
for the whole thing to scroll into view before anything animates).

## Failure mode

Reproducing the tempting scroll-percentage version — deriving an animation value from
`scrollY` directly — reintroduces exactly the "step to fixed scroll offsets" anti-pattern
`_shared/harness/README.md` calls out for capture (`Never step to fixed scroll offsets`):
a percentage-driven animation is invisible to a binary before/after screenshot diff and
would force this project into rAF-trace sampling for a site whose actual difficulty is
layout and density, not choreography — the exact overinvestment Prompt 1 was told to
avoid ("Do not default to a motion-heavy capture on a page whose difficulty is layout").

## Trigger

Scroll, once per section, on first intersection past the 15% threshold; never again for
that element. Client-side route change unmounts every section wrapper and its observer
registration; navigating to a new route re-arms a fresh observer and every section on
the new route starts unrevealed, exactly as a first visit would. There is no "already
seen this route" memory across navigations — this is deliberate, since re-visiting `/`
after browsing `/services` should look identical to the first visit.

## Accessibility

The resting (`opacity: 0`) state is a visual-only state — the underlying content remains
in the accessibility tree and in normal document/reading order the entire time
(`visibility` and `display` are never touched), so a screen reader user or a keyboard
user tabbing through the page encounters every heading, link, and form field in order
regardless of whether the CSS reveal has "played" yet for that section. Under
`prefers-reduced-motion: reduce`, the resting state is skipped entirely — every section
renders at `opacity: 1; transform: translateY(0)` from first paint, and the
`IntersectionObserver` still runs (harmless — it just sets a class with no visible
effect) rather than being conditionally skipped, to avoid maintaining two code paths for
one CSS-only difference.
