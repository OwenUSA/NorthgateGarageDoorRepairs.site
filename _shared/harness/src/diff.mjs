// STEP C — the comparison side. Three measurement modes, all three required:
//   FIDELITY -> pixel diff (pixelmatch) or structural, per cfg.fidelityMode
//   ADAPTED  -> structural-metric deviation, geometry + type + color + rhythm
//   NOVEL    -> token conformance, zero tolerance
//
//   node src/diff.mjs --route / --bp 1440
// Prints a ranked table and writes .harness/diff/<route>-<bp>.json + <cfg.reportPath>.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from 'sharp';
import pixelmatch from 'pixelmatch';
import { readJson, writeJson, ensure, pct, parseArgs } from './lib.mjs';
import { loadConfig, slug } from './config.mjs';
import { capDir } from './capture.mjs';
import { oklchToRgb } from './palette.mjs';

// ---------- sections.md is the contract: it decides which mode a section runs in ----------
async function sectionClasses(cfg) {
  const f = path.join(cfg.siteRoot, cfg.contractPath);
  if (!existsSync(f)) return { classes: {}, alias: {}, contractRows: [] };
  const md = await readFile(f, 'utf8');
  const classes = {};
  const alias = {};
  const contractRows = [];
  for (const line of md.split('\n')) {
    // | route | ref-section-id | our-section-id | CLASS | reason |
    // The ref column may be empty: our build adds sections the reference has no band for.
    const m = line.match(/^\|\s*(\/[a-z]*)\s*\|\s*([a-z0-9~-]*)\s*\|\s*([a-z0-9-]+)\s*\|\s*(FIDELITY|ADAPTED|NOVEL|DELETED)\s*\|/i);
    if (!m) continue;
    const route = m[1].trim(), ref = m[2].trim(), our = m[3].trim(), cls = m[4].toUpperCase();
    // Keyed on the REFERENCE id, because buildClassResolver() looks the class up from a
    // reference section. Also keyed on our own id, so a build that happens to name its
    // sections after the reference still resolves.
    if (ref) classes[`${route}::${ref}`] = cls;
    classes[`${route}::${our}`] = cls;
    // ref id -> the data-section value our build declares for it. Without this map,
    // identity pairing (PASS 1) can only fire on a build that names its sections after
    // the reference's heading text, which no adapted build does — everything falls
    // through to the page-progress join and mispairs wherever the build deliberately
    // reorders or drops a band, which is exactly what the build is required to do.
    if (ref) alias[`${route}::${ref}`] = our;
    contractRows.push({ route, our, ref: ref || null, cls });
  }

  // GUARD -- do not remove. A contract that parses to nothing is INDISTINGUISHABLE from a
  // contract that classifies nothing, and the fallback in buildClassResolver() is
  // 'FIDELITY'. So a format mismatch here silently reclassifies an entire site as
  // FIDELITY and pixel-diffs adapted content against the reference, which is the single
  // most expensive failure mode this whole process names.
  //
  // It is not hypothetical: of the five sites on this harness, two parsed ZERO rows and a
  // third parsed 5 of 88, because each wrote docs/sections.md in its own human-readable
  // column order. Every one of them looked fine -- the file was full of the word ADAPTED.
  //
  // So: if the file mentions class names but we matched no rows, that is a hard error.
  const mentionsClasses = /\b(FIDELITY|ADAPTED|NOVEL|DELETED)\b/.test(md);
  if (mentionsClasses && contractRows.length === 0) {
    throw new Error(
      `${cfg.contractPath} mentions FIDELITY/ADAPTED/NOVEL/DELETED but NO rows matched the ` +
        `machine-readable format, so every section would silently default to FIDELITY.\n\n` +
        `Expected pipe rows in this exact column order:\n` +
        `  | /route | ref-section-id | our-section-id | CLASS | reason |\n` +
        `The ref column may be empty for sections the reference has no band for, but the ` +
        `ORDER is fixed and the ref column must carry the reference's section id (e.g. ` +
        `"e4ad708c" or "s07-our-services"), never an ordinal like "7".\n\n` +
        `Keep the human table if you like it -- append a machine-readable one in this order ` +
        `and edit BOTH together.`
    );
  }
  if (mentionsClasses && contractRows.length < 10) {
    console.warn(
      `WARNING: ${cfg.contractPath} parsed only ${contractRows.length} contract rows. ` +
        `Unparsed sections default to FIDELITY and will be pixel-diffed against adapted ` +
        `content. Verify the column order is | route | ref-id | our-id | CLASS |.`
    );
  }

  return { classes, alias, contractRows };
}

// sections.md is keyed on the canonical (cfg.breakpoints.canonical) reference IDs. Section
// ordinals shift between breakpoints (a band can split below some width), so an ordinal
// join silently mislabels everything. Resolve every breakpoint's class by pairing each
// section back to its own canonical counterpart: heading text first, normalized band
// progress as tiebreak.
const slugOf = (id) => String(id).replace(/^s\d+-?/, '');
const normHead = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function buildClassResolver(classes, route, refMetaBp, refMetaCanonical) {
  const lookup = (id) => classes[`${route}::${id}`] || classes[`${route}::${slugOf(id)}`] || null;
  if (!refMetaCanonical || refMetaBp === refMetaCanonical) {
    return (sec) => ({ cls: lookup(sec.id) || 'FIDELITY', canonical: sec.id, via: 'direct' });
  }
  const canon = refMetaCanonical.sections.map((s) => ({
    id: s.id, head: normHead(s.headingText),
    mid: (s.box.docTop + s.box.h / 2) / Math.max(refMetaCanonical.page.scrollHeight, 1),
  }));
  const H = Math.max(refMetaBp.page.scrollHeight, 1);
  const used = new Set();
  const resolved = new Map();
  const secs = refMetaBp.sections.map((s) => ({
    idx: s.idx, id: s.id, head: normHead(s.headingText),
    mid: (s.box.docTop + s.box.h / 2) / H,
    weight: (s.textChars || 0) + s.box.h,
  }));
  // pass 1 — heading match, heaviest band first. A band can split into a thin stub plus
  // the real content band at mobile; the substantive one must claim the canonical id,
  // or the stub steals it and everything downstream shifts by one.
  for (const s of [...secs].sort((x, y) => y.weight - x.weight)) {
    if (!s.head) continue;
    const hit = canon.find((c) => !used.has(c.id) && c.head && (c.head === s.head || c.head.startsWith(s.head) || s.head.startsWith(c.head)));
    if (hit) { used.add(hit.id); resolved.set(s.idx, { id: hit.id, via: 'heading' }); }
  }
  // pass 2 — headingless bands match on page progress, assigned GLOBALLY best-first.
  // Sequential assignment lets an early weak match consume a slot a later strong match
  // needed, which strands the last band (the footer) as unmatched.
  const cand = [];
  for (const s of secs) {
    if (resolved.has(s.idx)) continue;
    for (const c of canon) {
      if (used.has(c.id)) continue;
      cand.push({ idx: s.idx, id: c.id, d: Math.abs(c.mid - s.mid) });
    }
  }
  cand.sort((x, y) => x.d - y.d);
  for (const c of cand) {
    if (resolved.has(c.idx) || used.has(c.id)) continue;
    used.add(c.id);
    resolved.set(c.idx, { id: c.id, via: 'progress' });
  }
  return (sec) => {
    const r = resolved.get(sec.idx);
    if (!r) return { cls: 'UNMATCHED', canonical: sec.id, via: 'unmatched' };
    return { cls: lookup(r.id) || 'FIDELITY', canonical: r.id, via: r.via };
  };
}

// ---------- FIDELITY (pixel mode): pixel diff over the union box ----------
async function pixelDiff(refPng, oursPng, outPng) {
  if (!existsSync(refPng) || !existsSync(oursPng)) return null;
  const a = sharp(refPng), b = sharp(oursPng);
  const [ma, mb] = [await a.metadata(), await b.metadata()];
  const W = Math.max(ma.width, mb.width);
  const H = Math.max(ma.height, mb.height);
  // Pad both to the union box on transparent black. Padding counts as divergence,
  // which is correct: a section that is the wrong height IS divergent.
  const pad = (img) => img
    .extend({ top: 0, left: 0, bottom: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize({ width: W, height: H, fit: 'contain', position: 'left top',
              background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .raw().ensureAlpha().toBuffer();
  const [ba, bb] = [await pad(a), await pad(b)];
  const diff = Buffer.alloc(W * H * 4);
  const n = pixelmatch(ba, bb, diff, W, H, { threshold: 0.1, includeAA: false, alpha: 0.4 });
  if (outPng) await sharp(diff, { raw: { width: W, height: H, channels: 4 } }).png().toFile(outPng);
  return { divergentPx: n, totalPx: W * H, pctArea: pct(n / (W * H)), union: { w: W, h: H },
           ref: { w: ma.width, h: ma.height }, ours: { w: mb.width, h: mb.height } };
}

// ---------- ADAPTED / structural FIDELITY: structural metrics only ----------
// BLOCKING fields contribute to the deviation % and can fail a row. ADVISORY fields are
// computed and reported but never contribute and never fail — see AMENDMENT below.
const BLOCKING_NUMERIC = [
  ['box.w', (s) => s.box.w], ['box.h', (s) => s.box.h],
  ['padTop', (s) => s.appearance.paddingTop], ['padBottom', (s) => s.appearance.paddingBottom],
  ['padLeft', (s) => s.appearance.paddingLeft], ['padRight', (s) => s.appearance.paddingRight],
  ['fontSize', (s) => s.appearance.fontSize], ['fontWeight', (s) => Number(s.appearance.fontWeight)],
  ['letterSpacing', (s) => s.appearance.letterSpacing],
  ['lineHeight', (s) => (s.appearance.lineHeight === 'normal' ? null : s.appearance.lineHeight)],
  ['cards', (s) => s.listCounts.cards], ['buttons', (s) => s.listCounts.buttons],
];
// AMENDMENT (comparator re-weighting) — inner-grid parity (innerCount/innerRows/innerCols)
// and raw DOM `position` are ADVISORY, not BLOCKING. They compare our clean markup against
// a page-builder's nested column tree, which is unclosable by construction — on Atlas they
// were 94/82/81 of the residuals and drowned real defects. Computed and reported so the
// information is not lost; never counted toward structPct, never a FAIL by themselves.
const ADVISORY_NUMERIC = [
  ['innerCols', (s) => new Set(s.innerGrid.map((k) => Math.round(k.x))).size],
  ['innerRows', (s) => new Set(s.innerGrid.map((k) => Math.round(k.y))).size],
  ['innerCount', (s) => s.innerGrid.length],
];
// AMENDMENT A-8 — colour is excluded from measurement FROM THE START.
// The palette is randomized at token-write time (A-7), so every ADAPTED section would
// otherwise carry a permanent colour delta into STRUCT_THRESHOLD from its first
// measurement and eat the 5% budget before geometry got a look in.
//
// STRIPPED: resolved color, background-color, border-color, gradient stops, shadow colour.
// KEPT: every geometric and typographic field, and the non-colour parts of borders and
// shadows — widths, offsets, blur, spread, radii.

/** Reduce a box-shadow to its geometry, discarding every colour component. */
export const shadowGeometry = (v) => {
  if (!v || v === 'none') return 'none';
  const stripped = v
    .replace(/rgba?\([^)]*\)/g, '')
    .replace(/oklch\([^)]*\)/g, '')
    .replace(/#[0-9a-f]{3,8}/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Tailwind composes shadow with empty ring/inset slots, so a computed box-shadow carries
  // "0px 0px 0px 0px" entries that draw nothing. They are a framework artifact, not design.
  const real = stripped
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x && !/^(0px\s+){3}0px$/.test(x) && !/^0px 0px 0px 0px/.test(x));
  return real.length ? real.join(', ') : 'none';
};

export function borderStyleOf(s) {
  const w = (s.appearance.borderTopWidth || 0) + (s.appearance.borderBottomWidth || 0)
    + (s.appearance.borderLeftWidth || 0) + (s.appearance.borderRightWidth || 0);
  return w > 0 ? s.appearance.borderStyle : 'none';  // preflight sets solid at 0 width
}

const BLOCKING_CATEGORICAL = [
  ['fontFamily', (s) => (s.appearance.fontFamily || '').split(',')[0].trim()],
  ['display', (s) => s.appearance.display],
  ['textAlign', (s) => s.appearance.textAlign], ['radius', (s) => s.appearance.borderRadius],
  ['shadowGeom', (s) => shadowGeometry(s.appearance.boxShadow)],
  ['gridCols', (s) => s.appearance.gridTemplateColumns], ['gap', (s) => s.appearance.gap],
  ['flexDir', (s) => s.appearance.flexDirection],
  ['textTransform', (s) => s.appearance.textTransform],
  ['borderStyle', borderStyleOf],
  ['overflow', (s) => s.appearance.overflow],
];
const ADVISORY_CATEGORICAL = [
  ['position', (s) => s.appearance.position],
];

function scoreFields(refSec, ourSec, numeric, categorical) {
  const fields = [];
  for (const [name, get] of numeric) {
    const A = get(refSec), B = get(ourSec);
    if (A == null || B == null) { fields.push({ name, ref: A, ours: B, dev: A === B ? 0 : 100 }); continue; }
    const denom = Math.max(Math.abs(A), Math.abs(B), 1);
    fields.push({ name, ref: A, ours: B, dev: pct(Math.abs(A - B) / denom) });
  }
  for (const [name, get] of categorical) {
    const A = get(refSec), B = get(ourSec);
    fields.push({ name, ref: A, ours: B, dev: String(A) === String(B) ? 0 : 100 });
  }
  return fields;
}

export function structuralDiff(refSec, ourSec) {
  const fields = scoreFields(refSec, ourSec, BLOCKING_NUMERIC, BLOCKING_CATEGORICAL);
  const advisory = scoreFields(refSec, ourSec, ADVISORY_NUMERIC, ADVISORY_CATEGORICAL);
  const mean = pct(fields.reduce((a, f) => a + f.dev, 0) / fields.length / 100);
  const worst = [...fields].sort((a, b) => b.dev - a.dev).slice(0, 6);
  return { structPct: mean, fields, worst, advisory };
}

// Render the advisory deltas as a trailing note, per row, so the information is not lost
// even though it never enters the pass/fail computation.
function advisoryNote(advisory) {
  if (!advisory || !advisory.length) return null;
  const nonZero = advisory.filter((f) => f.dev > 0);
  if (!nonZero.length) return 'advisory: none diverge';
  return 'advisory: ' + nonZero.map((f) => `${f.name} ref=${f.ref} ours=${f.ours} (${f.dev}%)`).join(', ');
}

// ---------- NOVEL: token conformance. Every value must resolve to a Prompt 5 token. ----------
// ---- token value normalisation ------------------------------------------------------
// getComputedStyle and the @theme block do not speak the same dialect:
//   theme:    oklch(50.95% 0.0343 331.38)   --text-base: 1.0625rem
//   computed: oklch(0.5095 0.0343 331.38)   font-size: 17px
// Comparing the raw strings makes every in-token value read as a violation, which made
// NOVEL conformance meaningless. Normalise both sides to one canonical form first.
function normLength(v, rootPx) {
  const s = String(v).trim();
  const m = s.match(/^(-?[\d.]+)(rem|em|px)?$/i);
  if (!m) return s.toLowerCase();
  const n = parseFloat(m[1]);
  const unit = (m[2] || 'px').toLowerCase();
  const px = unit === 'px' ? n : n * rootPx;
  return `${Math.round(px * 100) / 100}px`;
}

function normColor(v) {
  let s = String(v).trim().toLowerCase();
  // Hex -> the rgb()/rgba() form getComputedStyle actually returns. A token file writes
  // "#63e489"; the browser reports "rgb(99, 228, 137)". Without this expansion NO colour
  // token can ever match a computed colour, so token conformance reports a violation for
  // every correctly-tokenised NOVEL section and TOKEN_THRESHOLD = 0 is unreachable — the
  // check looks strict while measuring nothing.
  s = s.replace(/#([0-9a-f]{3,8})\b/g, (_, h) => {
    const x = h.length === 3 || h.length === 4
      ? h.split('').map((c) => c + c).join('')
      : h;
    if (x.length !== 6 && x.length !== 8) return '#' + h;
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
    if (x.length === 6) return `rgb(${r}, ${g}, ${b})`;
    const a = Math.round((parseInt(x.slice(6, 8), 16) / 255) * 100) / 100;
    return a === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${a})`;
  });
  // oklch(L C H) -> rgb(). A token file authored in OKLCH (as palette.mjs's own
  // emitTheme() always produces, and as Prompt 5's own token block does to survive
  // Prompt 9's hue rotation intact) can never string-match getComputedStyle's answer,
  // which browsers report as rgb()/rgba() for solid colours regardless of the source
  // colour space. Converting both sides to one canonical rgb() form is what the hex
  // branch above already does for the same reason; oklch needs the identical treatment
  // or TOKEN_THRESHOLD = 0 is unreachable for every oklch-authored ramp, which is the
  // only kind palette.mjs ever produces.
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  s = s.replace(/oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)[^)]*\)/g, (_, L, pctSign, C, H) => {
    const l = pctSign === '%' ? parseFloat(L) / 100 : parseFloat(L);
    const [r, g, b] = oklchToRgb({ L: l, C: parseFloat(C), H: parseFloat(H) });
    return `rgb(${Math.round(clamp01(r) * 255)}, ${Math.round(clamp01(g) * 255)}, ${Math.round(clamp01(b) * 255)})`;
  });
  // collapse whitespace and drop a trailing alpha of 1
  return s.replace(/\s*\/\s*1\)/, ')').replace(/\s+/g, ' ').trim();
}

export async function loadTokens(cfg) {
  // Until the @theme block is written, the token set is empty and NOVEL sections report
  // "no-token-set" rather than a false pass.
  const vals = { color: new Set(), size: new Set(), weight: new Set(), radius: new Set(), shadow: new Set(), space: new Set() };
  let found = false;
  for (const c of cfg.tokenSources) {
    const f = path.join(cfg.siteRoot, c);
    if (!existsSync(f)) continue;
    const css = await readFile(f, 'utf8');
    const theme = css.match(/@theme[^{]*\{([\s\S]*?)\n\}/);
    if (!theme) continue;
    found = true;
    for (const m of theme[1].matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/gi)) {
      const [, k, v0] = m; const v = v0.trim();
      if (/^color-/.test(k)) vals.color.add(normColor(v));
      else if (/^text-/.test(k)) vals.size.add(normLength(v, cfg.rootFontPx));
      else if (/^font-weight-/.test(k)) vals.weight.add(v);
      else if (/^radius-/.test(k)) vals.radius.add(normLength(v, cfg.rootFontPx));
      else if (/^shadow-/.test(k)) vals.shadow.add(normColor(v));
      else if (/^spacing-/.test(k)) vals.space.add(normLength(v, cfg.rootFontPx));
    }
  }
  return { found, vals };
}

export function tokenViolations(sec, tokens, cfg) {
  if (!tokens.found) return { violations: -1, note: 'no-token-set (tokens not landed yet)', items: [] };
  const items = [];
  const a = sec.appearance;
  const chk = (kind, value) => {
    if (!value || value === 'none' || value === 'rgba(0, 0, 0, 0)' || value === 'normal' || value === '0px') return;
    if (value === 'transparent' || /^rgba\(0, 0, 0, 0\)$/.test(String(value))) return;
    const set = tokens.vals[kind];
    if (!set.size) return;
    const norm = (kind === 'color' || kind === 'shadow') ? normColor(value)
      : kind === 'weight' ? String(value).trim()   // unitless; never run through normLength
      : normLength(value, cfg.rootFontPx);
    if (!set.has(norm)) items.push({ kind, value: String(value).slice(0, 60), normalised: norm });
  };
  chk('color', a.color); chk('color', a.backgroundColor); chk('color', a.borderColor);
  chk('size', a.fontSize != null ? a.fontSize + 'px' : null);
  chk('weight', a.fontWeight);
  chk('radius', a.borderRadius);
  chk('shadow', a.boxShadow);
  return { violations: items.length, items: items.slice(0, 10) };
}

// ---------- pairing: section-relative, never absolute scrollY ----------
// Two pages of different height align by ordinal band position, normalized to
// section-relative progress. We pair on nearest normalized midpoint.
export function pairSections(refMeta, ourMeta, canonicalOf, aliasOf, isClaimed) {
  const norm = (m) => m.sections.map((s) => ({
    ...s, mid: (s.box.docTop + s.box.h / 2) / Math.max(m.page.scrollHeight, 1),
  }));
  const R = norm(refMeta), O = norm(ourMeta);
  const used = new Set();
  const pairs = new Map();

  // PASS 1 — join on DECLARED IDENTITY, not position.
  //
  // Our sections carry data-section="<reference id>", and the probe emits them as
  // "s<NN>-<reference id>-<heading slug>". Prompt 3's structural gate REQUIRES four bands
  // to move (services 13th -> 5th, stats 12th -> 10th, CTA 10th -> 11th, testimonials
  // 11th -> 12th), so a position-only join pairs exactly those sections to the wrong
  // counterpart, or exhausts the pool and reports "no counterpart section" -> a false
  // 100%. The reordering is a requirement of the build, so the instrument has to survive
  // it: identity wins, position is only the fallback.
  const declared = (o) => String(o.id).replace(/^s\d+-/, '');
  // aliasOf maps a canonical REFERENCE id to the data-section value our build declares
  // for it, read from the site's own contract file — no site data enters this package.
  const aliasFor = (target) => (aliasOf ? aliasOf(target) : null);
  // Match on the CANONICAL reference id, not the raw per-breakpoint one. Reference
  // section ids are positional, so at a narrower width the band literally named
  // "s13-..." can be a different band than at the canonical width (a band splits below
  // some width, shifting every id after it). Our components declare the canonical id, so
  // pairing on the raw id silently compares our services block against the reference's
  // CTA band at mobile.
  for (const r of R) {
    const target = canonicalOf ? canonicalOf(r) : r.id;
    const want = aliasFor(target);
    const hit = O.find((o) => !used.has(o.idx)
      && (declared(o).startsWith(target) || (want && declared(o).startsWith(want))));
    if (hit) {
      used.add(hit.idx);
      pairs.set(r.idx, { ours: hit, delta: Math.abs(hit.mid - r.mid), via: 'id' });
    }
  }

  // PASS 2 — anything still unpaired falls back to page progress, assigned globally
  // best-first so one weak early match cannot consume a slot a stronger later one needs.
  const cand = [];
  for (const r of R) {
    if (pairs.has(r.idx)) continue;
    for (const o of O) {
      if (used.has(o.idx)) continue;
      // A section of ours that the contract has already assigned to a SPECIFIC reference
      // band is not available to the proximity join. Without this, a reference band our
      // build deliberately dropped reaches down the page, claims the nearest unrelated
      // section of ours, and reports a fabricated deviation for both of them — and a
      // section we ADDED, which by definition has no reference counterpart, is the easiest
      // thing for it to grab. Proximity is a fallback for sections the contract does not
      // speak for, not a second opinion about the ones it does.
      if (isClaimed && isClaimed(declared(o))) continue;
      cand.push({ rIdx: r.idx, o, d: Math.abs(o.mid - r.mid) });
    }
  }
  cand.sort((a, b) => a.d - b.d);
  for (const c of cand) {
    if (pairs.has(c.rIdx) || used.has(c.o.idx)) continue;
    used.add(c.o.idx);
    pairs.set(c.rIdx, { ours: c.o, delta: c.d, via: 'progress' });
  }

  return R.map((r) => {
    const p = pairs.get(r.idx);
    return {
      ref: r,
      ours: p ? p.ours : null,
      progressDelta: p ? pct(p.delta) : null,
      pairedVia: p ? p.via : 'unpaired',
    };
  });
}

// AMENDMENT A-9 — token conformance has no breakpoint dimension. NOVEL and DELETED rows
// are emitted ONCE, on the canonical pass, instead of once per breakpoint.
async function diffOne(cfg, route, bp, classes, alias, contractRows, tokens) {
  const CANONICAL_BP = cfg.breakpoints.canonical;
  const THRESHOLD = cfg.thresholds.fidelity;
  const STRUCT_THRESHOLD = cfg.thresholds.struct;
  const TOKEN_THRESHOLD = cfg.thresholds.token;

  const rd = capDir(cfg, 'ref', route, bp), od = capDir(cfg, 'ours', route, bp);
  const refMeta = await readJson(path.join(rd, 'meta.json'));
  const ourMeta = await readJson(path.join(od, 'meta.json'));
  const refMetaCanonical = bp === CANONICAL_BP ? refMeta : await readJson(path.join(capDir(cfg, 'ref', route, CANONICAL_BP), 'meta.json'));
  if (!refMeta || !ourMeta) return { route, bp, error: 'missing capture (run capture.mjs first)', rows: [] };

  const outDir = await ensure(path.join(cfg.harnessDir, 'diff', `${slug(route)}-${bp}`));
  const resolveClass = buildClassResolver(classes, route, refMeta, refMetaCanonical);
  const declaredHere = contractRows.filter((c) => c.route === route).map((c) => c.our);
  const pairs = pairSections(refMeta, ourMeta, (r) => resolveClass(r).canonical,
    (id) => alias[`${route}::${id}`] || alias[`${route}::${slugOf(id)}`] || null,
    (name) => declaredHere.some((our) => name.startsWith(our)));
  const rows = [];

  for (const p of pairs) {
    const { cls, canonical, via } = resolveClass(p.ref);
    // A-9: collapse NOVEL and DELETED to a single pass.
    if ((cls === 'NOVEL' || cls === 'DELETED') && bp !== CANONICAL_BP) continue;

    if (cls === 'UNMATCHED') {
      // A band that exists at this breakpoint but has no canonical counterpart. Real
      // responsive divergence in the reference itself — reported, never measured.
      rows.push({ route, bp, section: canonical, class: 'UNMATCHED', metric: 'no canonical counterpart',
        value: null, threshold: null, status: 'REPORTED', joinedVia: via,
        detail: { h: p.ref.box.h, heading: p.ref.headingText || null, textChars: p.ref.textChars } });
      continue;
    }
    // A reference band with no counterpart in our build. At a narrower width a reference
    // band can split, so two reference rows can resolve to the same canonical id and
    // compete for one of our sections. The loser has nothing to be compared against.
    // Reporting that as "100% divergent" is false precision — there is no measurement, so
    // say so.
    if (!p.ours) {
      rows.push({ route, bp, section: canonical, class: cls, metric: 'no counterpart in build',
        value: null, threshold: null, status: 'UNPAIRED', joinedVia: via, pairedVia: p.pairedVia,
        detail: { refHeight: p.ref.box.h, refHeading: p.ref.headingText || null } });
      continue;
    }
    if (cls === 'DELETED') {
      rows.push({ route, bp, section: canonical, class: 'DELETED', metric: 'n/a', value: null, threshold: null, status: 'REMOVED', joinedVia: via });
      continue;
    }
    const row = { route, bp, section: canonical, class: cls, progressDelta: p.progressDelta, joinedVia: via, pairedVia: p.pairedVia };

    if (cls === 'FIDELITY') {
      // cfg.fidelityMode: 'pixel' always pixel-diffs, 'structural' always structural,
      // 'auto' reproduces the original behaviour — after the section-classification pass
      // every remaining FIDELITY section is a solid-colour band, and with colour excluded
      // (A-8) a recoloured band would read 100% divergent forever under a pixel diff, so
      // it is measured structurally instead. Class-based, not content-based: a content
      // test mis-fires at the breakpoints where the headingless join lands on a
      // neighbouring band.
      const mode = cfg.fidelityMode === 'auto' ? 'structural' : cfg.fidelityMode;
      if (mode === 'structural') {
        const d = structuralDiff(p.ref, p.ours);
        Object.assign(row, {
          metric: 'structural deviation % (fidelityMode=structural, colour excluded)',
          value: d.structPct,
          threshold: STRUCT_THRESHOLD,
          status: d.structPct < STRUCT_THRESHOLD ? 'PASS' : 'FAIL',
          detail: { worst: d.worst },
          advisory: advisoryNote(d.advisory),
        });
      } else {
        const refPng = path.join(rd, `sec-${String(p.ref.idx).padStart(2, '0')}.png`);
        const ourPng = path.join(od, `sec-${String(p.ours.idx).padStart(2, '0')}.png`);
        const d = await pixelDiff(refPng, ourPng, path.join(outDir, `diff-${canonical}.png`));
        Object.assign(row, {
          metric: 'divergent px area %',
          value: d ? d.pctArea : 100,
          threshold: THRESHOLD,
          status: d && d.pctArea < THRESHOLD ? 'PASS' : 'FAIL',
          detail: d ? { ref: d.ref, ours: d.ours, union: d.union } : { reason: 'screenshot missing' },
        });
      }
    } else if (cls === 'ADAPTED') {
      const d = structuralDiff(p.ref, p.ours);
      Object.assign(row, {
        metric: 'structural deviation %',
        value: d.structPct,
        threshold: STRUCT_THRESHOLD,
        status: d.structPct < STRUCT_THRESHOLD ? 'PASS' : 'FAIL',
        detail: { worst: d.worst },
        advisory: advisoryNote(d.advisory),
      });
    } else {
      const d = tokenViolations(p.ours, tokens, cfg);
      Object.assign(row, {
        metric: 'token violations',
        value: d.violations,
        threshold: TOKEN_THRESHOLD,
        status: d.violations === 0 ? 'PASS' : d.violations < 0 ? 'BLOCKED' : 'FAIL',
        detail: d,
      });
    }
    rows.push(row);
  }

  // Sections OUR build declares that no reference band paired to: novel additions, and
  // sections that correspond to a sub-row inside a page-builder parent band rather than
  // to a band of their own. The reference-driven loop above cannot reach them, so they
  // would otherwise be silently unmeasured. Token conformance has no breakpoint
  // dimension (A-9), so they are emitted on the canonical pass only.
  if (bp === CANONICAL_BP) {
    const pairedOurs = new Set(pairs.filter((p) => p.ours).map((p) => p.ours.idx));
    const declaredOurs = (o) => String(o.id).replace(/^s[0-9]+-/, '');
    for (const o of ourMeta.sections) {
      if (pairedOurs.has(o.idx)) continue;
      const name = declaredOurs(o);
      const contract = contractRows.find((c) => c.route === route && name.startsWith(c.our));
      const cls = contract ? contract.cls : (classes[`${route}::${name}`] || null);
      if (!cls) {
        rows.push({ route, bp, section: name, class: 'UNDECLARED', metric: 'not in the contract',
          value: null, threshold: null, status: 'REPORTED', joinedVia: 'ours-only' });
        continue;
      }
      const d = tokenViolations(o, tokens, cfg);
      rows.push({ route, bp, section: contract ? contract.our : name, class: cls,
        metric: contract && contract.ref ? 'token violations (no top-level ref band; sub-row of a builder parent)' : 'token violations',
        value: d.violations, threshold: TOKEN_THRESHOLD,
        status: d.violations === 0 ? 'PASS' : d.violations < 0 ? 'BLOCKED' : 'FAIL',
        joinedVia: 'ours-only', detail: d });
    }
  }
  // Page-level sanity numbers that no per-section metric catches.
  const pageRow = {
    route, bp, section: '(page)', class: 'PAGE', metric: 'height delta %',
    value: pct(Math.abs(refMeta.page.scrollHeight - ourMeta.page.scrollHeight) / Math.max(refMeta.page.scrollHeight, 1)),
    threshold: STRUCT_THRESHOLD,
    detail: { refH: refMeta.page.scrollHeight, ourH: ourMeta.page.scrollHeight,
              refSections: refMeta.page.sectionCount, ourSections: ourMeta.page.sectionCount,
              consoleErrors: ourMeta.consoleErrors.length },
  };
  pageRow.status = pageRow.value < STRUCT_THRESHOLD ? 'PASS' : 'FAIL';
  rows.push(pageRow);

  await writeJson(path.join(cfg.harnessDir, 'diff', `${slug(route)}-${bp}.json`), { route, bp, rows });
  return { route, bp, rows };
}

function table(rows) {
  const head = 'route | section | bp | class | metric | value | threshold | status | advisory';
  const sep = '------|---------|----|-------|--------|-------|-----------|--------|---------';
  const body = rows.map((r) =>
    `${r.route} | ${String(r.section).slice(0, 34)} | ${r.bp} | ${r.class} | ${r.metric} | ${r.value} | ${r.threshold ?? '-'} | ${r.status} | ${r.advisory ?? '-'}`);
  return [head, sep, ...body].join('\n');
}

async function main() {
  const cfg = await loadConfig();
  const a = parseArgs();
  const routes = a.route && a.route !== 'true' ? [a.route] : cfg.ourRoutes;
  const bps = a.bp && a.bp !== 'true' ? [Number(a.bp)] : (a.all ? cfg.allBp : cfg.breakpoints.diff);
  const { classes, alias, contractRows } = await sectionClasses(cfg);
  const tokens = await loadTokens(cfg);

  const all = [];
  for (const route of routes) for (const bp of bps) {
    const r = await diffOne(cfg, route, bp, classes, alias, contractRows, tokens);
    if (r.error) { console.log(JSON.stringify({ route, bp, error: r.error })); continue; }
    all.push(...r.rows);
    const fails = r.rows.filter((x) => x.status === 'FAIL').length;
    console.log(JSON.stringify({ pass: `diff ${route} @${bp}`, rows: r.rows.length, fails }));
  }

  // Ranked: worst first, normalized against each row's own threshold.
  const ranked = [...all].sort((x, y) => {
    const nx = x.threshold ? x.value / Math.max(x.threshold, 0.0001) : x.value;
    const ny = y.threshold ? y.value / Math.max(y.threshold, 0.0001) : y.value;
    return ny - nx;
  });

  const md = [
    `# ${cfg.reportPath} — ranked divergence table`,
    '',
    `Generated ${new Date().toISOString()} by \`src/diff.mjs\`.`,
    'Rewritten each convergence loop. Ranked worst-first, normalized against each row\'s own threshold.',
    '',
    `Rows: ${all.length} · FAIL: ${all.filter((r) => r.status === 'FAIL').length} · PASS: ${all.filter((r) => r.status === 'PASS').length} · BLOCKED: ${all.filter((r) => r.status === 'BLOCKED').length}`,
    '',
    '## Top 10',
    '',
    table(ranked.slice(0, 10)),
    '',
    '## Full table',
    '',
    table(ranked),
    '',
  ].join('\n');
  const reportFile = path.join(cfg.siteRoot, cfg.reportPath);
  await ensure(path.dirname(reportFile));
  await writeFile(reportFile, md, 'utf8');

  if (a.json) {
    console.log(JSON.stringify(all));
  } else {
    console.log('\n--- TOP 10 (ranked, worst first) ---');
    console.log(table(ranked.slice(0, 10)));
  }
  console.log(`\nDIFF DONE ${all.length} rows -> ${cfg.reportPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
