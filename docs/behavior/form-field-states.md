# Form field focus / error / success states

`/contact`'s callback-request form (`content/copy.ts`'s `contact-form` section — name,
phone, service select, callback-window select, message; no email field, per D-05). Plain
React state, ten-line validator, no `react-hook-form`/`zod` (banned by the dependency
allowlist for a five-field form with no backend) and no submission target — the component
is marked `// STUB: no submission target` at the top per D-05.

## Mechanism

Focus: `outline` (not `box-shadow`-as-fake-outline) using `outline-offset: 2px` so the
ring doesn't overlap the field's own border, color from the token set's focus-ring token.
**Not** removing the native focus outline and replacing it with only a border-color
change — a border-color-only "focus state" fails WCAG 2.2's focus-visible contrast
requirement the moment the field's resting border is anywhere close to its focused
border in lightness.

Error: `aria-invalid="true"` on the field, a `role="alert"` message element directly
below it, and the field border color swaps to the semantic error token (exempt from the
Prompt 9 palette rotation — a randomly-hued error state is a bug, not a variant).
**Not** a color-only error signal — the error message text is always rendered, never a
red border with no accompanying text, which fails for colorblind users and for anyone who
can't see the field at all.

Success (post-submit): the whole form is replaced by a confirmation state ("Got it —
we'll call during your chosen window"), not a per-field green checkmark — there's no
server round-trip to confirm each field individually against, so per-field "success"
would be theater with nothing behind it.

## Ratio

Focus ring: `2px` solid, `2px` offset — thick enough to be unambiguous at arm's length on
a phone screen, thin enough not to visually collide with adjacent fields in the form's
`gap`. Error-state color transition: `0.15s ease-out` on `border-color` only — fast,
because an error needs to register as "something changed here" the instant it appears
(on blur, not on every keystroke — see Trigger), not ease in gradually.

## Failure mode

Validating on every keystroke (`onChange`) instead of on blur/submit: a phone number
field would flash "invalid" after the very first digit typed, before the user could
possibly have finished. The tempting shortcut of validating `onChange` but only *display-
ing* the error after a delay just moves the same problem into a timer — the fix is
validating at the right event, not delaying the wrong one.

## Trigger

Each field validates `onBlur` (first pass) and then re-validates `onChange` **only if it
already has an active error** (so a currently-invalid field can clear its error as soon
as it becomes valid, without waiting for another blur). Full-form validation runs once on
submit attempt, focusing the first invalid field and announcing the count via the form's
`aria-live` region. No client-side route-change handling applies — this is a single-route
component (`/contact` only) with no persisted state to reset on navigation; leaving and
returning to `/contact` remounts the form pristine.

## Accessibility

The form's error summary region is `aria-live="polite"` (not `"assertive"` — a hard
interrupt on every blur would be worse than the errors it's announcing) so a screen
reader user hears "2 fields need attention" without losing their place. Each field's
error message `id` is referenced by the field's `aria-describedby`, appended to (not
replacing) any existing `aria-describedby` value used for field hints. The whole field
group remains keyboard-operable in document order — no `tabindex` reordering — including
the two `<select>`s, which use native `<select>` markup rather than a custom-styled
listbox (a common source of keyboard-trap bugs for a five-field form with no real payoff
for the custom styling). No `prefers-reduced-motion` branch beyond shortening the
border-color transition to `0.01s`; nothing here relies on transform/opacity motion to
convey meaning.
