// Render-truth gate: does the page ACTUALLY read correctly once painted?
//
// contrast.mjs reasons about declared CSS. This file reasons about pixels. They fail
// independently, and the pair is the point: Atlas's AA audit passed while its primary CTA
// was invisible, because every check in the chain trusted the same declared values.
//
// Three checks, all of which would have caught that defect on their own:
//
//   1. TEXT LEGIBILITY -- screenshot each text box and measure the contrast between its
//      two dominant painted tones. If a box is effectively one flat colour, there is no
//      text visible in it, whatever the stylesheet claims.
//   2. CTA PRIMACY -- the tel: CTA is the conversion path for a phone-driven business. It
//      must be among the highest-contrast elements on its page. A randomiser or a token
//      slip that makes it recede has produced a worse site, not a different one.
//   3. TAP TARGETS -- interactive controls must be at least 44x44 CSS px at the smallest
//      breakpoint (WCAG 2.2 AA, 2.5.8 target size minimum).
//
// Render-truth failures are NOT subject to ITERATION_CAP. An invisible CTA is a defect,
// not a divergence from the reference.

import { chromium } from 'playwright';
import sharp from 'sharp';
import { loadConfig } from './config.mjs';
import { contrast } from './contrast.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const MIN_TEXT_SEPARATION = 3.0; // painted tones inside a text box must differ by at least this
const MIN_TAP = 44;
const CTA_PRIMACY_RANK = 0.5; // tel: CTA must sit in the top half of on-page contrast

// Quantise to reduce anti-aliasing noise into stable buckets.
const bucket = (v) => Math.round(v / 8) * 8;

function dominantPair(data, channels) {
  const counts = new Map();
  for (let i = 0; i < data.length; i += channels) {
    if (channels === 4 && data[i + 3] < 128) continue;
    const k = `${bucket(data[i])},${bucket(data[i + 1])},${bucket(data[i + 2])}`;
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  if (top.length < 2) return { sep: 0, a: top[0]?.[0] ?? null, b: null, tones: top.length };
  const a = top[0][0].split(',').map(Number);

  // Consider every tone with a REAL pixel share, not just the most frequent handful.
  //
  // This used to look at top.slice(1, 12). A gradient band produces dozens of distinct
  // buckets on its own, so the glyph core of a small heading in a wide box never reached
  // that window -- both samples came back gradient and the gate reported illegible text
  // that a reader can see perfectly well. Ridge hit exactly that: an 18px heading in a
  // 60ch centred block over a gradient measured 1.52 at 768 while contrasting with its
  // background at better than 13:1, and passed at 390 (narrow box) and 1440 (bigger
  // glyphs) -- the tell that it was a sampling artefact, not a colour defect.
  //
  // The floor excludes anti-aliasing noise, which is what the frequency window was really
  // guarding against; it just guarded too hard. Text that is genuinely absent still yields
  // no qualifying second tone and still fails.
  const sampled = [...counts.values()].reduce((n, v) => n + v, 0);
  const floor = Math.max(8, sampled * 0.0015);
  let best = { sep: 0, b: null };
  for (const [k, n] of top.slice(1)) {
    if (n < floor) continue;
    const c = k.split(',').map(Number);
    const s = contrast(a, c);
    if (s > best.sep) best = { sep: s, b: k };
  }
  return { sep: best.sep, a: top[0][0], b: best.b, tones: top.length };
}

export async function runRenderTruth(opts) {
  const { base, routes, breakpoints, ctaSelector, tapBp, headless = true } = opts;
  const b = await chromium.launch({
    headless,
    args: ['--force-color-profile=srgb', '--font-render-hinting=none'],
  });
  const findings = [];

  for (const bp of breakpoints) {
    const ctx = await b.newContext({ viewport: { width: bp, height: 900 }, deviceScaleFactor: 1 });
    for (const route of routes) {
      const page = await ctx.newPage();
      await page.goto(base + route, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle').catch(() => {});
      try { await page.evaluate(() => document.fonts.ready); } catch {}
      await page.addStyleTag({
        content: '*,*::before,*::after{animation-play-state:paused!important;transition-duration:0s!important;caret-color:transparent!important}',
      });

      const targets = await page.evaluate((sel) => {
        const out = [];
        const seen = new Set();
        const push = (el, kind) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') return;
          if (r.width < 4 || r.height < 4) return;
          const text = (el.textContent || '').trim().slice(0, 60);
          if (!text) return;
          const id = kind + '|' + text + '|' + Math.round(r.x) + ',' + Math.round(r.y);
          if (seen.has(id)) return;
          seen.add(id);
          const disp = cs.display;
          const inlineInText =
            el.tagName === 'A' &&
            /^inline/.test(disp) &&
            !!el.closest('p, li, dd, blockquote');
          out.push({
            kind,
            text,
            tag: el.tagName,
            inlineInText,
            href: el.getAttribute('href') || '',
            box: { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height },
            // Viewport-relative box, and whether this element sits inside a fixed
            // overlay. See the FIXED OVERLAYS note in runRenderTruth().
            viewBox: { x: r.x, y: r.y, w: r.width, h: r.height },
            fixed: (() => {
              for (let e = el; e && e !== document.body; e = e.parentElement) {
                if (getComputedStyle(e).position === 'fixed') return true;
              }
              return false;
            })(),
            isTel: (el.getAttribute('href') || '').startsWith('tel:'),
          });
        };
        document.querySelectorAll('h1,h2,h3').forEach((el) => push(el, 'heading'));
        document.querySelectorAll(sel).forEach((el) => push(el, 'cta'));
        document.querySelectorAll('a,button,input,select,textarea,[role=button]').forEach((el) => push(el, 'control'));
        return out;
      }, ctaSelector);

      // ---- FIXED OVERLAYS -------------------------------------------------
      // A position:fixed overlay -- a mobile call bar, a cookie banner -- is painted
      // ONCE into a full-page screenshot, at the bottom of the ORIGINAL viewport.
      // On a 1751px page captured at 900px tall that is a solid band straight across
      // the MIDDLE of the document image. Any heading or control whose document
      // position happens to land in that band is then measured against the overlay's
      // own fill and reported as illegible text, which is an artifact of the capture
      // rather than a property of the page. It bit Axel: an 18px footer heading
      // declared at 21:1 measured 2.87 because the call bar was painted over it.
      //
      // So: capture the DOCUMENT with fixed overlays hidden, and capture the
      // OVERLAYS from a second, viewport-sized shot in which they are painted
      // exactly where a reader sees them. Pages with no fixed element take the
      // same path they always did -- the hide step is a no-op and the second shot
      // is never consulted.
      const hasFixed = targets.some((t) => t.fixed);
      if (hasFixed) {
        await page.evaluate(() => {
          for (const el of document.querySelectorAll('body *')) {
            if (getComputedStyle(el).position === 'fixed') el.setAttribute('data-rt-fixed', '');
          }
          const st = document.createElement('style');
          st.id = 'rt-hide-fixed';
          st.textContent = '[data-rt-fixed]{visibility:hidden!important}';
          document.head.appendChild(st);
        });
      }
      const shot = await page.screenshot({ fullPage: true });
      const meta = await sharp(shot).metadata();

      let overlayShot = null;
      let overlayMeta = null;
      if (hasFixed) {
        await page.evaluate(() => document.getElementById('rt-hide-fixed')?.remove());
        overlayShot = await page.screenshot({ fullPage: false });
        overlayMeta = await sharp(overlayShot).metadata();
      }

      const scored = [];
      for (const t of targets) {
        const useOverlay = t.fixed && overlayShot;
        const src = useOverlay ? overlayShot : shot;
        const m = useOverlay ? overlayMeta : meta;
        const b = useOverlay ? t.viewBox : t.box;
        const left = Math.max(0, Math.round(b.x));
        const top = Math.max(0, Math.round(b.y));
        const width = Math.min(Math.round(b.w), m.width - left);
        const height = Math.min(Math.round(b.h), m.height - top);
        if (width < 4 || height < 4) continue;
        let sep = null;
        try {
          const { data, info } = await sharp(src).extract({ left, top, width, height }).raw().toBuffer({ resolveWithObject: true });
          sep = dominantPair(data, info.channels);
        } catch {
          continue;
        }
        scored.push({ ...t, sep: Math.round(sep.sep * 100) / 100, tones: sep.tones });
      }

      // ---- check 1: text legibility (headings + CTAs; controls are often icon-only)
      for (const s of scored) {
        if (s.kind === 'control') continue;
        if (s.sep < MIN_TEXT_SEPARATION) {
          findings.push({
            route, bp, check: 'text-legibility', status: 'FAIL',
            text: s.text, tag: s.tag, separation: s.sep, need: MIN_TEXT_SEPARATION,
            note: s.tones <= 2 ? 'box is effectively one flat tone: no visible text' : 'painted text does not separate from its background',
          });
        }
      }

      // ---- check 2: tel: CTA primacy, RANKED AMONG INTERACTIVE ELEMENTS ONLY.
      //
      // This originally ranked the tel: CTA against every text box on the page, which is
      // unsatisfiable by construction: near-black body copy on white is ~18:1 and no
      // branded button colour can beat it. The only way to "pass" was to wash out the
      // headings -- one site downgraded its heading token from neutral-950 to neutral-700,
      // and dark-band headings from neutral-100 to neutral-500, to satisfy this check.
      // That is a real typographic regression caused by a bad gate, which is worse than
      // the defect the gate was written to catch.
      //
      // The actual requirement (Prompt 9) is that the call CTA leads among things a
      // visitor can ACT on -- it must not recede behind other buttons and links. Body text
      // and headings are not competitors for a click, so they are not in the ranking.
      const interactive = scored.filter((s) => s.kind === 'cta' || s.kind === 'control');
      const tels = interactive.filter((s) => s.isTel);
      if (!interactive.length) {
        // nothing actionable on the page at all; the tel: check below still applies
      }
      if (tels.length) {
        const ranked = [...interactive].sort((a, b) => b.sep - a.sep);
        const bestTel = Math.max(...tels.map((t) => t.sep));
        const rank = ranked.findIndex((r) => r.sep === bestTel) / Math.max(1, ranked.length);
        if (rank > CTA_PRIMACY_RANK) {
          findings.push({
            route, bp, check: 'cta-primacy', status: 'FAIL',
            text: tels[0].text, separation: bestTel,
            note: `tel: CTA ranks ${Math.round(rank * 100)}% down the page among INTERACTIVE elements by painted contrast; it is the conversion path and must lead the things a visitor can act on`,
          });
        }
      } else {
        findings.push({ route, bp, check: 'cta-primacy', status: 'FAIL', note: 'no tel: CTA found on this route' });
      }

      // ---- check 3: tap targets, mobile only.
      // Gated on the site's configured smallest width, NOT the min of whatever subset was
      // requested -- otherwise `--bp 1440` makes desktop "the smallest" and every inline
      // link reports. WCAG 2.5.8 also exempts targets inline in a sentence, so anchors
      // flowing inside body text are excluded rather than counted as violations.
      if (bp === tapBp) {
        for (const s of scored) {
          if (s.kind !== 'control' && s.kind !== 'cta') continue;
          if (s.inlineInText) continue;
          if (s.box.w < MIN_TAP || s.box.h < MIN_TAP) {
            findings.push({
              route, bp, check: 'tap-target', status: 'FAIL',
              text: s.text, size: `${Math.round(s.box.w)}x${Math.round(s.box.h)}`, need: `${MIN_TAP}x${MIN_TAP}`,
              note: 'interactive control below WCAG 2.2 target size minimum',
            });
          }
        }
      }

      await page.close();
    }
    await ctx.close();
  }
  await b.close();
  return findings;
}

async function main() {
  const cfg = await loadConfig();
  const args = process.argv.slice(2);
  const pick = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
  const routes = pick('--route') ? [pick('--route')] : cfg.ourRoutes;
  const breakpoints = pick('--bp') ? [Number(pick('--bp'))] : cfg.breakpoints.diff;

  const findings = await runRenderTruth({
    base: cfg.local,
    routes,
    breakpoints,
    ctaSelector: cfg.ctaSelector,
    tapBp: Math.min(...cfg.breakpoints.diff),
  });

  const byCheck = findings.reduce((m, f) => ((m[f.check] = (m[f.check] || 0) + 1), m), {});

  if (args.includes('--json')) {
    console.log(JSON.stringify({ total: findings.length, byCheck, findings }, null, 2));
  } else {
    console.log(`\nrender-truth gate -- ${findings.length} findings ` + JSON.stringify(byCheck) + '\n');
    console.log('check           route      bp   detail');
    console.log('--------------- ---------- ---- ------------------------------------------------');
    const seen = new Set();
    for (const f of findings) {
      const k = f.check + '|' + f.route + '|' + (f.text || '');
      if (seen.has(k)) continue;
      seen.add(k);
      const detail = f.separation != null ? `sep ${f.separation} (need ${f.need}) ${JSON.stringify(f.text || '').slice(0, 40)}`
        : f.size ? `${f.size} (need ${f.need}) ${JSON.stringify(f.text || '').slice(0, 34)}`
        : f.note;
      console.log(`${f.check.padEnd(15)} ${f.route.padEnd(10)} ${String(f.bp).padEnd(4)} ${detail}`);
    }
  }

  const out = path.join(cfg.harnessDir, 'rendertruth.json');
  await mkdir(path.dirname(out), { recursive: true });
  await writeFile(out, JSON.stringify({ generated: new Date().toISOString(), findings }, null, 2), 'utf8');
  console.log(`\n${findings.length ? 'FAIL' : 'PASS'} -- full result: ${out}`);
  process.exit(findings.length ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith('rendertruth.mjs')) {
  main().catch((e) => { console.error(e); process.exit(2); });
}
