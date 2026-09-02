## TAKE — generic, license-clean, reproduced rather than downloaded

| slot ID | route | section | what | how |
|---|---|---|---|---|
| `icon-close` | all | nav | Generic close ("X") glyph, no branding. | `lucide-react`'s `X`, matched by stroke width/size, not the exact glyph. Not downloaded — no file to inventory. |

## Fonts — no D-11 substitution needed

Prompt 1's CSS mining found `Figtree` (body) and `Russo One` (display/heading). Both are
standard, open-licensed Google Fonts — not self-hosted or licensed files — so the D-11
"substitute and record as a permanent floor" path does not apply here. Both are sourced
fresh via `next/font/google` in Prompt 5; no font file is copied from the reference.

## Icons

All UI icons (nav close, phone, map pin, etc.) are `lucide-react`, matched by stroke
width and size — never the reference's icon-font glyphs (`ryno-theme-icons`,
`ryno-service-areas`), which are their private icon font and are not lifted.

## Cross-reference: the D-02 city-grid pattern on `/contact`

`docs/profile.md` and `docs/sections.md` (Prompt 1) already flag that the reference's
`/contact-us/` page embeds **five** separate Google Maps iframes — the same
locations/service-area grid pattern that gets deleted wholesale from `/areas-we-serve/`
per D-02. `ref-map-image` above (a static map graphic elsewhere on the home page) is
unrelated and separately marked DELETED. Our `/contact` gets exactly **one** coords-only,
keyless embed at zoom ~15 per D-07/D-08 — never a multi-marker grid.

## Logo

No real logo file exists yet. Per D-17/D-14: `TODO(fact): logo asset`. Until one is
handed over, the wordmark renders as text set in the extracted display font (`Russo
One`) — see `logo` above for the reference's rendered slot geometry we're matching.
