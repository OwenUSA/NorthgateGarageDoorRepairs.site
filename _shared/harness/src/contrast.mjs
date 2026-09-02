// Gradient-aware WCAG contrast gate.
//
// WHY THIS EXISTS
// Atlas shipped a home page whose primary call-now CTA was invisible -- the label was
// painted in EXACTLY its own background colour, 1:1 -- and the acceptance sweep reported
// "23/23 pairs pass AA". Two independent blind spots produced that:
//
//   1. The audit resolved backgrounds via getComputedStyle(el).backgroundColor. On a
//      gradient band that is rgba(0,0,0,0), so the walker treated it as "not my
//      background", climbed to the first solid ancestor -- the white page surface -- and
//      scored dark-on-dark text as though it sat on white.
//   2. The static token gate modelled a gradient band as two flat rows (bg: 'accent',
//      bg: 'accentDeep'). Nothing tested the ramp BETWEEN them, which is the worst case.
//
// So the rules here are:
//   - Backgrounds resolve as an ORDERED LAYER STACK, not a scalar.
//   - background-image is NOT "no background". Gradients are parsed for their stops.
//   - A text box is scored against the WORST sample along the ramp it covers.
//   - Anything genuinely underivable (url(), translucent overlay) reports UNMEASURABLE.
//     It never silently falls through to white -- silence is what shipped the invisible CTA.
//
// Colour parsing is done by PAINTING to a 1x1 canvas inside the page and reading the pixel
// back. That normalises oklch()/color()/hsl()/named/hex through the browser engine, so
// this file contains no colour-syntax parser to drift out of date.

import { chromium } from 'playwright';
import { loadConfig } from './config.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const AA_TEXT = 4.5;
const AA_LARGE = 3.0;
const AA_UI = 3.0;

// ---------------------------------------------------------------- in-page collector
function COLLECT({ samples, uiSelector }) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const cx = cv.getContext('2d', { willReadFrequently: true });

  // Ground truth: let the browser rasterise the colour, then read the pixel back.
  const rgba = (str) => {
    if (!str) return null;
    cx.clearRect(0, 0, 1, 1);
    cx.fillStyle = '#000000';
    const before = cx.fillStyle;
    cx.fillStyle = str;
    const changed = cx.fillStyle !== before;
    const looksBlack = /^#0{3,8}$/i.test(str) || /black/i.test(str) || /\(0,\s*0,\s*0/.test(str);
    if (!changed && !looksBlack) return null; // invalid colour: fillStyle was rejected
    cx.fillRect(0, 0, 1, 1);
    const d = cx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };

  // straight-alpha source-over
  const over = (fg, bg) => {
    const a = fg[3] + bg[3] * (1 - fg[3]);
    if (a === 0) return [255, 255, 255, 0];
    return [
      (fg[0] * fg[3] + bg[0] * bg[3] * (1 - fg[3])) / a,
      (fg[1] * fg[3] + bg[1] * bg[3] * (1 - fg[3])) / a,
      (fg[2] * fg[3] + bg[2] * bg[3] * (1 - fg[3])) / a,
      a,
    ];
  };

  const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

  // Pull colour stops out of any gradient function. We deliberately ignore stop POSITIONS
  // and gradient angle and sample the whole declared range -- conservative, so it can only
  // find a worse pair, never miss one.
  const gradientStops = (img) => {
    if (!img || img === 'none') return null;
    if (/url\(/i.test(img)) return 'UNMEASURABLE';
    if (!/gradient\(/i.test(img)) return null;
    const stops = [];
    const re = /(#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color)\([^()]*(?:\([^()]*\)[^()]*)*\))/gi;
    let m;
    while ((m = re.exec(img))) {
      const c = rgba(m[1]);
      if (c) stops.push(c);
    }
    return stops.length ? stops : null;
  };

  // Ordered layer stack: walk up until a layer is fully opaque AND gradient-free.
  const backgroundStack = (el) => {
    const layers = [];
    let e = el;
    let guard = 0;
    while (e && guard++ < 40) {
      const cs = getComputedStyle(e);
      const op = parseFloat(cs.opacity);
      const bc = rgba(cs.backgroundColor) || [0, 0, 0, 0];
      const stops = gradientStops(cs.backgroundImage);
      if (stops === 'UNMEASURABLE') return { unmeasurable: 'background-image: url()' };
      if (op < 1 && (bc[3] > 0 || stops)) return { unmeasurable: 'ancestor opacity ' + op };
      if (stops) layers.push({ stops: stops });
      if (bc[3] > 0) layers.push({ solid: bc });
      // Stop at the first layer that actually OCCLUDES everything behind it. An opaque
      // gradient occludes just as completely as an opaque colour -- keep walking past one
      // and the page surface underneath becomes a candidate background it can never be,
      // which manufactures false white-on-white failures.
      const gradientOpaque = stops && stops.every((s) => s[3] >= 1);
      if ((bc[3] >= 1 && !stops) || gradientOpaque) return { layers: layers };
      e = e.parentElement;
    }
    layers.push({ solid: rgba(getComputedStyle(document.documentElement).backgroundColor) || [255, 255, 255, 1] });
    return { layers: layers };
  };

  // Every distinct background colour a text box could actually sit on.
  const candidateBackgrounds = (stack) => {
    const white = [255, 255, 255, 1];
    let beneath = white;
    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].solid && stack[i].solid[3] >= 1) { beneath = stack[i].solid; break; }
    }
    const out = [];
    for (const L of stack) {
      if (L.solid) out.push(over(L.solid, beneath));
      if (L.stops) {
        const s = L.stops;
        for (let i = 0; i < s.length; i++) {
          out.push(over(s[i], beneath));
          if (i < s.length - 1) {
            for (let k = 1; k < samples; k++) out.push(over(lerp(s[i], s[i + 1], k / samples), beneath));
          }
        }
      }
    }
    return out.length ? out : [white];
  };

  const hasOwnText = (el) => {
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  };

  const rows = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;

    let isUi = false;
    try { isUi = el.matches(uiSelector); } catch { isUi = false; }
    const textual = hasOwnText(el);
    if (!textual && !isUi) continue;

    const text = (el.textContent || '').trim().slice(0, 60);
    if (textual && !text) continue;

    const stack = backgroundStack(el);
    if (stack.unmeasurable) {
      rows.push({ text: text, tag: el.tagName, unmeasurable: stack.unmeasurable });
      continue;
    }

    const fg = rgba(cs.color);
    if (!fg) continue;
    const size = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;

    rows.push({
      text: text,
      tag: el.tagName,
      cls: String(el.className || '').slice(0, 40),
      href: el.getAttribute ? el.getAttribute('href') || '' : '',
      fg: fg,
      bgs: candidateBackgrounds(stack.layers),
      size: size,
      weight: weight,
      large: size >= 24 || (size >= 18.66 && weight >= 700),
      isUi: isUi,
      textual: textual,
      box: { w: Math.round(r.width), h: Math.round(r.height) },
    });
  }
  return rows;
}

// ---------------------------------------------------------------- scoring (node side)
const lin = (v) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const relLum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

export function contrast(a, b) {
  const l1 = relLum(a);
  const l2 = relLum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const hex = (c) =>
  c ? '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('') : '--------';

export function scoreRow(row) {
  if (row.unmeasurable) return Object.assign({}, row, { status: 'UNMEASURABLE', ratio: null, need: null });
  const need = row.textual ? (row.large ? AA_LARGE : AA_TEXT) : AA_UI;
  let worst = Infinity;
  let worstBg = null;
  for (const bg of row.bgs) {
    const cr = contrast(row.fg, bg);
    if (cr < worst) { worst = cr; worstBg = bg; }
  }
  return Object.assign({}, row, {
    ratio: Math.round(worst * 100) / 100,
    need: need,
    worstBg: worstBg,
    status: worst + 1e-9 < need ? 'FAIL' : 'PASS',
  });
}

// ---------------------------------------------------------------- runner
export async function runContrast(opts) {
  const { base, routes, breakpoints, samples, uiSelector, headless = true } = opts;
  const b = await chromium.launch({
    headless: headless,
    args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
  });
  const all = [];
  for (const bp of breakpoints) {
    const ctx = await b.newContext({ viewport: { width: bp, height: 900 }, deviceScaleFactor: 1 });
    for (const route of routes) {
      const page = await ctx.newPage();
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      try { await page.evaluate(() => document.fonts.ready); } catch {}
      const rows = await page.evaluate(COLLECT, { samples: samples, uiSelector: uiSelector });
      for (const r of rows) all.push(Object.assign({ route: route, bp: bp }, scoreRow(r)));
      await page.close();
    }
    await ctx.close();
  }
  await b.close();
  return all;
}

async function main() {
  const cfg = await loadConfig();
  const args = process.argv.slice(2);
  const pick = (f) => {
    const i = args.indexOf(f);
    return i >= 0 ? args[i + 1] : null;
  };
  const routes = pick('--route') ? [pick('--route')] : cfg.ourRoutes;
  const breakpoints = pick('--bp') ? [Number(pick('--bp'))] : cfg.breakpoints.diff;

  const rows = await runContrast({
    base: cfg.local,
    routes: routes,
    breakpoints: breakpoints,
    samples: cfg.gradientSamples,
    uiSelector: cfg.ctaSelector,
  });

  const fails = rows.filter((r) => r.status === 'FAIL');
  const unmeasurable = rows.filter((r) => r.status === 'UNMEASURABLE');
  const key = (r) => r.route + '|' + r.text + '|' + r.ratio;
  const uniq = [...new Map(fails.map((r) => [key(r), r])).values()].sort((a, b) => a.ratio - b.ratio);

  if (args.includes('--json')) {
    console.log(JSON.stringify({ total: rows.length, fail: fails.length, unmeasurable: unmeasurable.length, rows: uniq }, null, 2));
  } else {
    console.log('\ncontrast gate -- ' + rows.length + ' scored, ' + fails.length + ' FAIL, ' + unmeasurable.length + ' UNMEASURABLE\n');
    console.log('route      bp   ratio  need  fg        worst-bg  text');
    console.log('---------- ---- ------ ----- --------- --------- ------------------------------');
    for (const r of uniq.slice(0, 40)) {
      console.log(
        r.route.padEnd(10) + ' ' + String(r.bp).padEnd(4) + ' ' + String(r.ratio).padStart(6) + ' ' +
        String(r.need).padStart(5) + '  ' + hex(r.fg).padEnd(9) + ' ' + hex(r.worstBg).padEnd(9) + ' ' +
        JSON.stringify(r.text).slice(0, 46)
      );
    }
    for (const r of unmeasurable.slice(0, 10)) {
      console.log('UNMEASURABLE ' + r.route + ' <' + r.tag + '> ' + r.unmeasurable + ' ' + JSON.stringify(r.text).slice(0, 40));
    }
  }

  const out = path.join(cfg.harnessDir, 'contrast.json');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify({ generated: new Date().toISOString(), rows: rows }, null, 2), 'utf8');
  console.log('\n' + (fails.length ? 'FAIL' : 'PASS') + ' -- full result: ' + out);
  process.exit(fails.length ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('contrast.mjs')) {
  main().catch((e) => {
    console.error(e);
    process.exit(2);
  });
}
