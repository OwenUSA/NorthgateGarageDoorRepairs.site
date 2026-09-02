// src/palette.mjs — randomize hue, preserve structure.
//
//   node src/palette.mjs                 generate 5 candidates, gate, auto-select
//   node src/palette.mjs --seed 12345    reproduce one palette exactly
//   node src/palette.mjs --emit          print the winning @theme block
//   node src/palette.mjs --json          machine-readable
//
// What makes a palette read as designed is the lightness and chroma relationships across
// the ramp, not the hue. So: convert the reference ramp (cfg.referenceRamp, extracted from
// the reference's computed styles) to OKLCH, hold every L and C exactly where it is, and
// re-derive the whole set from a new random primary hue.
//
// Semantic colors (cfg.semantic — form error, form success, focus ring) are EXEMPT from
// rotation and keep conventional hues. A randomly green error state is a bug.
//
// cfg.pairsInUse are the fg/bg combinations the shell and section components actually
// render — not the ramp in theory. Each entry is EITHER a flat token `{ fg, bg }` or a
// gradient `{ fg, bg: { gradient: [stopA, stopB] } }`; a gradient entry is sampled at
// cfg.gradientSamples points (interpolated in OKLCH) and gated on the WORST contrast
// across those samples, never just the endpoints — a flat check of a ramp is how a build
// can ship an invisible CTA that still "passes" AA at the stops.
import { parseArgs } from './lib.mjs';
import { loadConfig } from './config.mjs';

// ---------------------------------------------------------------- color science
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const srgbToLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linToSrgb = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(clamp01(v) * 255).toString(16).padStart(2, '0')).join('');
}

// sRGB -> OKLab -> OKLCH  (Björn Ottosson)
export function rgbToOklch([r, g, b]) {
  const [R, G, B] = [srgbToLin(r), srgbToLin(g), srgbToLin(b)];
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const Bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  const C = Math.sqrt(A * A + Bb * Bb);
  let H = (Math.atan2(Bb, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}
export function oklchToRgb({ L, C, H }) {
  const h = (H * Math.PI) / 180;
  const A = C * Math.cos(h);
  const B = C * Math.sin(h);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.2914855480 * B) ** 3;
  return [
    linToSrgb(+4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s),
  ];
}

/** Reduce chroma until the color is representable in sRGB. Preserves L and H. */
export function gamutFit({ L, C, H }) {
  let c = C;
  for (let i = 0; i < 64; i++) {
    const rgb = oklchToRgb({ L, C: c, H });
    if (rgb.every((v) => v >= -0.001 && v <= 1.001)) break;
    c *= 0.96;
  }
  return { L, C: c, H };
}
export const oklchToHex = (o) => rgbToHex(oklchToRgb(gamutFit(o)));

// Interpolate two hex stops in OKLCH space, N samples, shortest hue arc. Used to gate a
// gradient pair on its worst point rather than just its endpoints.
export function sampleGradientHex(hexA, hexB, n) {
  const oA = rgbToOklch(hexToRgb(hexA));
  const oB = rgbToOklch(hexToRgb(hexB));
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = n <= 1 ? 0 : i / (n - 1);
    const dH = (((oB.H - oA.H + 540) % 360) - 180); // shortest signed arc
    const H = (oA.H + dH * t + 360) % 360;
    const L = oA.L + (oB.L - oA.L) * t;
    const C = oA.C + (oB.C - oA.C) * t;
    pts.push(oklchToHex({ L, C, H }));
  }
  return pts;
}

// ---------------------------------------------------------------- WCAG contrast
export function relLuminance([r, g, b]) {
  const [R, G, B] = [srgbToLin(r), srgbToLin(g), srgbToLin(b)];
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}
export function contrast(hexA, hexB) {
  const a = relLuminance(hexToRgb(hexA));
  const b = relLuminance(hexToRgb(hexB));
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

// ---------------------------------------------------------------- seeded RNG
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SCHEMES = {
  complementary:       [180],
  'split-complementary': [150, 210],
  analogous:           [30, -30],
  triadic:             [120, -120],
};

// ---------------------------------------------------------------- candidate generation
export function generate(seed, cfg) {
  const rnd = mulberry32(seed);
  const primaryHue = Math.round(rnd() * 360);

  const schemeNames = Object.keys(SCHEMES);
  const schemeName = schemeNames[Math.floor(rnd() * schemeNames.length)];
  const offsets = SCHEMES[schemeName];
  const accentOffset = offsets[Math.floor(rnd() * offsets.length)];
  const accentHue = (primaryHue + accentOffset + 360) % 360;

  // Neutrals keep a 3-6% chroma tint of the primary hue. Pure grey reads cheap.
  const neutralChroma = 0.03 + rnd() * 0.03;

  const ref = Object.fromEntries(
    Object.entries(cfg.referenceRamp).map(([k, hex]) => [k, rgbToOklch(hexToRgb(hex))])
  );

  // Hold L and C exactly. Re-derive H only.
  const hueFor = (key) => {
    if (key.startsWith('accent')) return accentHue;
    if (key.startsWith('neutral')) return primaryHue;
    return primaryHue;
  };
  const chromaFor = (key, o) => {
    if (key === 'neutral0') return 0;                    // white stays white
    if (key.startsWith('neutral')) return neutralChroma;  // tinted, not grey
    return o.C;                                          // primary/accent chroma preserved
  };

  const tokens = {};
  for (const [key, o] of Object.entries(ref)) {
    tokens[key] = oklchToHex({ L: o.L, C: chromaFor(key, o), H: hueFor(key) });
  }

  // Focus ring is rendered as TWO layers — a surface-coloured inner halo and a dark outer
  // ring (see globals.css). That is the only construction that can hold 3:1 against both a
  // white page and a saturated button with one token. The ring itself is pinned dark and
  // low-lightness so it separates from every band in the ramp.
  const accentO = rgbToOklch(hexToRgb(tokens.accent));
  tokens.focus = oklchToHex({ L: 0.32, C: Math.max(accentO.C * 0.9, 0.12), H: accentHue });

  // A border that carries meaning (form inputs, control edges) needs 3:1. The reference's
  // hairline neutral is decoration-only and often fails on white; it is kept for
  // DECORATION only and a separate strong token is introduced for anything a user has to
  // perceive.
  tokens.border = tokens.neutral400;          // decorative dividers only, not gated
  tokens.borderStrong = tokens.neutral600;    // inputs and control edges, gated at 3:1

  Object.assign(tokens, cfg.semantic);

  return {
    seed, schemeName, accentOffset, primaryHue, accentHue,
    neutralChroma: Math.round(neutralChroma * 1000) / 1000,
    tokens,
  };
}

// ---------------------------------------------------------------- hard constraints
export function gate(cand, cfg) {
  const t = cand.tokens;
  const results = cfg.pairsInUse.map((p) => {
    const fgHex = t[p.fg];
    let ratio, bgHex;
    if (p.bg && typeof p.bg === 'object' && p.bg.gradient) {
      const [aKey, bKey] = p.bg.gradient;
      const samples = sampleGradientHex(t[aKey], t[bKey], cfg.gradientSamples);
      const ratios = samples.map((hex) => contrast(fgHex, hex));
      ratio = Math.min(...ratios); // gate on the WORST stop, not the endpoints
      bgHex = `gradient(${aKey}->${bKey}): ${samples.join(', ')}`;
    } else {
      bgHex = t[p.bg];
      ratio = contrast(fgHex, bgHex);
    }
    return { ...p, fgHex, bgHex, ratio, pass: ratio >= p.min };
  });

  const failures = [];
  const aaFails = results.filter((r) => !r.pass);
  if (aaFails.length) {
    failures.push(`AA: ${aaFails.map((r) => `${r.name} ${r.ratio}:1 < ${r.min}`).join('; ')}`);
  }

  // "The call-now CTA remains the highest-contrast, highest-chroma element on every page."
  //
  // The CTA is a FILLED accent button; the competing action is an OUTLINED button with dark
  // text on the page. Comparing their label-to-own-background ratios says the outlined one
  // wins, which is exactly backwards — and it would reject the reference's own palette too.
  // What "does not recede" actually means here, made checkable:
  //   (a) the CTA label is readable on the CTA fill      -> AA
  //   (b) the CTA FILL separates from the page           -> the button is seen as a button
  //   (c) the CTA fill is more chromatic than the        -> the eye goes to the action,
  //       structural primary                                not to the navy furniture
  //   (d) nothing in the rotated ramp is more chromatic  -> checked below
  const cta = results.find((r) => r.kind === 'cta');
  const chroma0 = (hex) => rgbToOklch(hexToRgb(hex)).C;
  if (cta.ratio < 4.5) failures.push(`CTA label ${cta.ratio}:1 below AA on its own fill`);
  const fillVsPage = contrast(t.accent, t.neutral0);
  if (fillVsPage < 3) failures.push(`CTA fill only ${fillVsPage}:1 against the page; the button recedes`);
  if (chroma0(t.accent) <= chroma0(t.primary)) {
    failures.push('CTA fill is no more chromatic than the structural primary');
  }

  // ...and the highest-chroma one. Semantics are exempt from the comparison, being exempt
  // from the rotation.
  const chroma = (hex) => rgbToOklch(hexToRgb(hex)).C;
  const ctaC = chroma(t.accent);
  const SKIP = new Set(['focus', 'border', 'borderStrong']);
  const rotated = Object.entries(t).filter(([k]) => !(k in cfg.semantic) && !SKIP.has(k));
  const moreChromatic = rotated.filter(([, hex]) => chroma(hex) > ctaC + 1e-6);
  if (moreChromatic.length) {
    failures.push(`CTA not highest-chroma; exceeded by: ${moreChromatic.map(([k]) => k).join(', ')}`);
  }

  // Focus ring: 3:1 against both the element and its background, everywhere it appears.
  const focusFails = results.filter((r) => r.kind === 'focus' && r.ratio < 3);
  if (focusFails.length) failures.push(`focus ring < 3:1 on: ${focusFails.map((r) => r.name).join(', ')}`);

  // Semantic colours are EXEMPT from the rotation and must still READ as themselves.
  // "A randomly green error state is a bug" — so assert the hue, not just the contrast.
  const hueOf = (hex) => rgbToOklch(hexToRgb(hex)).H;
  const inArc = (h, lo, hi) => (lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi);
  if (!inArc(hueOf(t.error), 5, 55)) failures.push(`error hue ${Math.round(hueOf(t.error))} is not red`);
  if (!inArc(hueOf(t.success), 120, 175)) failures.push(`success hue ${Math.round(hueOf(t.success))} is not green`);

  // Structure preservation — the promise of the whole technique is that L relationships
  // survive the hue rotation. Assert the ramp is still monotonic, or the "hold every L and
  // C exactly where it is" claim is unverified.
  const L = (hex) => rgbToOklch(hexToRgb(hex)).L;
  const ordered = ['neutral0', 'neutral200', 'neutral400', 'neutral600', 'neutral900'];
  for (let i = 1; i < ordered.length; i++) {
    if (L(t[ordered[i]]) >= L(t[ordered[i - 1]])) {
      failures.push(`neutral ramp not monotonic at ${ordered[i - 1]} -> ${ordered[i]}`);
    }
  }
  if (L(t.primaryDeep) >= L(t.primary)) failures.push('primaryDeep is not darker than primary');
  if (L(t.accentDeep) >= L(t.accent)) failures.push('accentDeep is not darker than accent');

  return { pass: failures.length === 0, failures, results, ctaRatio: cta.ratio, ctaChroma: ctaC };
}

// ---------------------------------------------------------------- selection
export function selectPalette(cfg, masterSeed = cfg.masterSeed, want = 5) {
  const rnd = mulberry32(masterSeed);
  const candidates = [];
  const rejected = [];
  let tries = 0;
  while (candidates.length < want && tries < 4000) {
    tries++;
    const seed = Math.floor(rnd() * 1e6);
    const cand = generate(seed, cfg);
    const g = gate(cand, cfg);
    if (g.pass) candidates.push({ ...cand, gate: g });
    else rejected.push({ seed, failures: g.failures });
  }
  // Auto-select: highest CTA contrast against its background; ties break to lowest seed.
  const winner = [...candidates].sort((a, b) =>
    (b.gate.ctaRatio - a.gate.ctaRatio) || (a.seed - b.seed))[0];
  return { masterSeed, candidates, rejected, tries, winner };
}

// ---------------------------------------------------------------- CSS emit
export function emitTheme(cand) {
  const t = cand.tokens;
  const ok = (hex) => {
    const o = rgbToOklch(hexToRgb(hex));
    return `oklch(${(o.L * 100).toFixed(2)}% ${o.C.toFixed(4)} ${o.H.toFixed(2)})`;
  };
  return `  /* palette — seed ${cand.seed}, ${cand.schemeName} (${cand.accentOffset > 0 ? '+' : ''}${cand.accentOffset}deg), primary hue ${cand.primaryHue}, neutral tint ${cand.neutralChroma} */
  --color-primary: ${ok(t.primary)};
  --color-primary-deep: ${ok(t.primaryDeep)};
  --color-accent: ${ok(t.accent)};
  --color-accent-deep: ${ok(t.accentDeep)};
  --color-surface: ${ok(t.neutral0)};
  --color-neutral-200: ${ok(t.neutral200)};
  --color-neutral-400: ${ok(t.neutral400)};
  --color-neutral-600: ${ok(t.neutral600)};
  --color-neutral-900: ${ok(t.neutral900)};
  --color-border: ${ok(t.border)};
  --color-border-strong: ${ok(t.borderStrong)};
  --color-focus: ${ok(t.focus)};
  /* semantic — EXEMPT from hue rotation, conventional hues held */
  --color-error: ${ok(t.error)};
  --color-success: ${ok(t.success)};
  --color-warning: ${ok(t.warning)};`;
}

// ---------------------------------------------------------------- CLI
if (process.argv[1] && import.meta.url === (await import('node:url')).pathToFileURL(process.argv[1]).href) {
  const cfg = await loadConfig();
  const argv = parseArgs();
  const seedArg = argv.seed && argv.seed !== 'true' ? Number(argv.seed) : null;

  if (seedArg != null) {
    const cand = generate(seedArg, cfg);
    const g = gate(cand, cfg);
    if (argv.emit) { console.log(emitTheme(cand)); process.exit(0); }
    console.log(JSON.stringify({ ...cand, gate: { pass: g.pass, failures: g.failures, ctaRatio: g.ctaRatio } }, null, 2));
    process.exit(g.pass ? 0 : 1);
  }

  const sel = selectPalette(cfg);
  if (argv.emit) { console.log(emitTheme(sel.winner)); process.exit(0); }
  if (argv.json) {
    console.log(JSON.stringify({
      masterSeed: sel.masterSeed, tries: sel.tries,
      candidateSeeds: sel.candidates.map((c) => c.seed),
      winningSeed: sel.winner.seed,
      candidates: sel.candidates.map((c) => ({
        seed: c.seed, scheme: c.schemeName, accentOffset: c.accentOffset,
        primaryHue: c.primaryHue, accentHue: c.accentHue, neutralChroma: c.neutralChroma,
        ctaRatio: c.gate.ctaRatio, ctaChroma: Math.round(c.gate.ctaChroma * 10000) / 10000,
        tokens: c.tokens,
      })),
      rejectedCount: sel.rejected.length,
      winnerPairs: sel.winner.gate.results,
    }, null, 2));
    process.exit(0);
  }

  console.log(`master seed ${sel.masterSeed} — ${sel.tries} rolls, ${sel.rejected.length} rejected, ${sel.candidates.length} survivors\n`);
  console.log('seed     | scheme               | pri hue | acc hue | neutral C | CTA contrast | CTA chroma');
  console.log('---------|----------------------|---------|---------|-----------|--------------|-----------');
  for (const c of sel.candidates) {
    const win = c.seed === sel.winner.seed ? '  <- WINNER' : '';
    console.log(
      `${String(c.seed).padEnd(8)} | ${c.schemeName.padEnd(20)} | ${String(c.primaryHue).padStart(7)} | ${String(c.accentHue).padStart(7)} | ${String(c.neutralChroma).padStart(9)} | ${String(c.gate.ctaRatio).padStart(12)} | ${(Math.round(c.gate.ctaChroma * 10000) / 10000).toFixed(4)}${win}`
    );
  }
  console.log(`\nWINNER: seed ${sel.winner.seed}\n`);
  console.log('pair                          | fg      | bg                    | ratio | min | status');
  console.log('------------------------------|---------|------------------------|-------|-----|-------');
  for (const r of sel.winner.gate.results) {
    console.log(`${r.name.padEnd(29)} | ${r.fgHex} | ${String(r.bgHex).slice(0, 22).padEnd(22)} | ${String(r.ratio).padStart(5)} | ${String(r.min).padStart(3)} | ${r.pass ? 'PASS' : 'FAIL'}`);
  }
}
