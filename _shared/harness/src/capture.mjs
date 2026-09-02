// STEP B — capture one side, one route, one breakpoint.
//   node src/capture.mjs --side ref|ours --route / --bp 1440
//   node src/capture.mjs --side ref --all      (every route, every cfg.allBp width)
// Writes .harness/cap/<side>/<route>-<bp>/{meta.json, page.png, sec-*.png} and prints
// a single summary line. Safe for a subagent: touches only its own output directory.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runProbe } from './probe.mjs';
import { browser, newPage, settle, writeJson, summary, ensure, parseArgs } from './lib.mjs';
import { loadConfig, slug } from './config.mjs';

export { parseArgs as args }; // back-compat alias for callers importing `args` from this module

export function capDir(cfg, side, route, bp) {
  return path.join(cfg.harnessDir, 'cap', side, `${slug(route)}-${bp}`);
}

// Section-relative capture: scroll each section into view and clip to its own box.
// Absolute scrollY is meaningless across two pages of different height, so we never use it.
export async function captureSide(b, cfg, { side, route, bp, states = true }) {
  const isRef = side === 'ref';
  const target = isRef ? cfg.referenceOrigin + (cfg.refForRoute(route) ?? '/') : cfg.local + route;
  const dir = await ensure(capDir(cfg, side, route, bp));
  const { ctx, page } = await newPage(b, bp, cfg);

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 160)); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message.slice(0, 160)));

  const resp = await page.goto(target, { waitUntil: 'domcontentloaded' });
  const status = resp ? resp.status() : 0;
  await settle(page);

  const data = await runProbe(page, cfg);

  const shots = [];
  for (const sec of data.sections) {
    const name = `sec-${String(sec.idx).padStart(2, '0')}.png`;
    const file = path.join(dir, name);
    try {
      // clip in page coordinates — full-page shot cropped, so no scroll-position artifacts
      await page.screenshot({
        path: file,
        clip: { x: 0, y: sec.box.docTop, width: bp, height: Math.max(1, Math.min(sec.box.h, cfg.maxClipHeight)) },
        fullPage: true,
        animations: 'disabled',
      });
      shots.push({ idx: sec.idx, id: sec.id, file: name, w: bp, h: Math.round(sec.box.h) });
    } catch (e) {
      shots.push({ idx: sec.idx, id: sec.id, file: null, error: e.message.slice(0, 90) });
    }
  }

  // Interactive state captures — each state is its own reference, not just the default render.
  const stateShots = {};
  if (states) {
    // hover + active on every CTA (skipped below cfg.hoverMinBp)
    if (bp >= cfg.hoverMinBp) {
      const ctas = await page.$$(cfg.ctaSelector);
      const cta = ctas[0];
      if (cta) {
        try {
          stateShots.ctaRest = await cta.evaluate((e) => {
            const s = getComputedStyle(e);
            return { bg: s.backgroundColor, color: s.color, border: s.borderTopColor, transform: s.transform, shadow: s.boxShadow.slice(0, 80) };
          });
          await cta.hover({ timeout: 3000 });
          await page.waitForTimeout(320);
          stateShots.ctaHover = await cta.evaluate((e) => {
            const s = getComputedStyle(e);
            return { bg: s.backgroundColor, color: s.color, border: s.borderTopColor, transform: s.transform, shadow: s.boxShadow.slice(0, 80) };
          });
        } catch { /* not hoverable */ }
      }
    }
    // mobile nav drawer open/closed
    if (bp < cfg.drawerMaxBp) {
      const t = await page.$(cfg.navToggleSelector);
      if (t) {
        try {
          await t.click({ timeout: 3000 });
          await page.waitForTimeout(600);
          stateShots.navOpen = await page.evaluate((drawerSel) => {
            const m = document.querySelector(drawerSel);
            const r = m ? m.getBoundingClientRect() : null;
            const s = m ? getComputedStyle(m) : null;
            return {
              present: !!m,
              box: r ? { w: Math.round(r.width), h: Math.round(r.height), t: Math.round(r.top) } : null,
              display: s ? s.display : null, transform: s ? s.transform : null,
              bg: s ? s.backgroundColor : null,
              items: m ? m.querySelectorAll('li,a').length : 0,
              bodyOverflow: getComputedStyle(document.body).overflow,
              bodyPosition: getComputedStyle(document.body).position,
            };
          }, cfg.drawerSelector);
          await page.screenshot({ path: path.join(dir, 'state-nav-open.png'), animations: 'disabled' });
        } catch { /* ignore */ }
      }
    }
    // sticky header: at-top vs engaged
    const hSel = cfg.headerSelector;
    stateShots.headerAtTop = await page.evaluate((sel) => {
      const h = document.querySelector(sel); if (!h) return null;
      const s = getComputedStyle(h), r = h.getBoundingClientRect();
      return { position: s.position, h: Math.round(r.height), top: Math.round(r.top), bg: s.backgroundColor, shadow: s.boxShadow.slice(0, 80), transform: s.transform };
    }, hSel);
    await page.evaluate((px) => window.scrollTo(0, Math.min(px, document.documentElement.scrollHeight)), cfg.stickyEngageScrollPx);
    await page.waitForTimeout(500);
    stateShots.headerEngaged = await page.evaluate((sel) => {
      const h = document.querySelector(sel); if (!h) return null;
      const s = getComputedStyle(h), r = h.getBoundingClientRect();
      return { position: s.position, h: Math.round(r.height), top: Math.round(r.top), bg: s.backgroundColor, shadow: s.boxShadow.slice(0, 80), transform: s.transform };
    }, hSel);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);

    // form states: pristine / focused / error / submitted
    const form = await page.$('form');
    if (form) {
      stateShots.form = await page.evaluate(() => {
        const f = document.querySelector('form');
        const first = f.querySelector('input:not([type=hidden]),select,textarea');
        const s = first ? getComputedStyle(first) : null;
        return {
          fields: f.querySelectorAll('input:not([type=hidden]),select,textarea').length,
          firstField: s ? { h: Math.round(first.getBoundingClientRect().height), border: s.borderTopColor, bw: s.borderTopWidth, radius: s.borderRadius, bg: s.backgroundColor, fs: s.fontSize } : null,
        };
      });
      const fld = await page.$('form input:not([type=hidden]), form textarea');
      if (fld) {
        try {
          await fld.focus();
          await page.waitForTimeout(250);
          stateShots.formFocused = await fld.evaluate((e) => {
            const s = getComputedStyle(e);
            return { outline: s.outline, outlineWidth: s.outlineWidth, outlineColor: s.outlineColor, border: s.borderTopColor, shadow: s.boxShadow.slice(0, 90) };
          });
        } catch { /* ignore */ }
      }
    }
  }

  const meta = {
    side, route, bp, target, status, consoleErrors: consoleErrors.slice(0, 20),
    capturedAt: new Date().toISOString(),
    ...data, shots, stateShots,
  };
  await writeJson(path.join(dir, 'meta.json'), meta);
  await ctx.close();
  return {
    pass: `${side} ${route} @${bp}`, status,
    height: data.page.scrollHeight, sections: data.page.sectionCount,
    shots: shots.filter((s) => s.file).length, errors: consoleErrors.length,
    dir: path.relative(process.cwd(), dir),
  };
}

async function main() {
  const cfg = await loadConfig();
  const a = parseArgs();
  const routes = a.route && a.route !== 'true' ? [a.route] : cfg.ourRoutes;
  const bps = a.bp && a.bp !== 'true' ? [Number(a.bp)] : (a.all ? cfg.allBp : cfg.breakpoints.diff);
  const sides = a.side && a.side !== 'true' ? [a.side] : ['ref', 'ours'];

  const jobs = [];
  for (const side of sides) for (const route of routes) for (const bp of bps) jobs.push({ side, route, bp });

  const b = await browser();
  const MAX = cfg.concurrency; // hard concurrency cap
  const out = [];
  for (let i = 0; i < jobs.length; i += MAX) {
    const batch = jobs.slice(i, i + MAX);
    const r = await Promise.all(batch.map((j) =>
      captureSide(b, cfg, j).catch((e) => ({ pass: `${j.side} ${j.route} @${j.bp}`, error: e.message.slice(0, 140) }))));
    r.forEach((x) => { summary(x); out.push(x); });
  }
  await b.close();
  if (a.json) console.log(JSON.stringify(out));
  console.log(`CAPTURE DONE ${out.length} passes`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
