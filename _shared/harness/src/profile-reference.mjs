// STEP A — profile the reference. Writes .harness/profile/*.json, prints summary lines only.
// Concurrency ceiling: cfg.concurrency passes at a time.
//   node src/profile-reference.mjs [--route <r>] [--bp <n>] [--all] [--json]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { runProbe } from './probe.mjs';
import { browser, newPage, settle, writeJson, summary, parseArgs } from './lib.mjs';
import { loadConfig, slug } from './config.mjs';

// Pull every stylesheet the page loads and mine the real @media breakpoints.
async function cssBreakpoints(page) {
  return page.evaluate(async () => {
    const texts = [];
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        if (sheet.cssRules) {
          texts.push(Array.from(sheet.cssRules).map((r) => r.cssText).join('\n'));
          continue;
        }
      } catch { /* cross-origin, fetch it below */ }
      if (sheet.href) {
        try { texts.push(await (await fetch(sheet.href)).text()); } catch { /* ignore */ }
      }
    }
    const all = texts.join('\n');
    const hits = {};
    const re = /@media[^{]*?\(\s*(min|max)-width\s*:\s*([\d.]+)(px|em|rem)\s*\)/g;
    let m;
    while ((m = re.exec(all))) {
      const unit = m[3];
      const val = unit === 'px' ? parseFloat(m[2]) : Math.round(parseFloat(m[2]) * 16);
      const key = `${m[1]}-${val}`;
      hits[key] = (hits[key] || 0) + 1;
    }
    // font-face families actually declared
    const fonts = Array.from(new Set((all.match(/font-family\s*:\s*([^;}]+)/g) || [])
      .map((s) => s.split(':')[1].trim().replace(/["']/g, '').split(',')[0]))).slice(0, 40);
    return { hits, fonts, bytes: all.length, sheets: document.styleSheets.length };
  });
}

async function profilePage(b, cfg, refPath, bp) {
  const { ctx, page } = await newPage(b, bp, cfg);
  const netImgs = [];
  page.on('response', (r) => {
    const u = r.url();
    if (/\.(jpe?g|png|webp|avif|svg|gif|woff2?|mp4|webm)(\?|$)/i.test(u)) {
      netImgs.push({ url: u.slice(0, 220), type: r.headers()['content-type'] || '', status: r.status() });
    }
  });
  const url = cfg.referenceOrigin + refPath;
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded' });
  const status = resp ? resp.status() : 0;
  await settle(page);
  const data = await runProbe(page, cfg);
  const css = bp === cfg.breakpoints.canonical ? await cssBreakpoints(page) : null;

  // Interactive-state captures: only where the state exists at this width.
  const states = {};
  const toggle = await page.$(cfg.navToggleSelector);
  if (toggle && bp < cfg.drawerMaxBp) {
    try {
      await toggle.click({ timeout: 4000 });
      await page.waitForTimeout(500);
      states.navOpen = await page.evaluate((drawerSel) => {
        const open = document.querySelector('[aria-expanded="true"], [class*=open]');
        const panel = document.querySelector(drawerSel);
        const r = panel ? panel.getBoundingClientRect() : null;
        return {
          opened: !!open,
          panel: r ? { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) } : null,
          bodyOverflow: getComputedStyle(document.body).overflow,
          bodyPosition: getComputedStyle(document.body).position,
        };
      }, cfg.drawerSelector);
      await toggle.click({ timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(300);
    } catch { states.navOpen = { error: 'toggle not clickable' }; }
  }

  // Sticky header engaged vs at-top — a real state, captured as its own reference.
  states.headerAtTop = await page.evaluate((sel) => {
    const h = document.querySelector(sel);
    if (!h) return null;
    const s = getComputedStyle(h);
    const r = h.getBoundingClientRect();
    return { position: s.position, h: Math.round(r.height), bg: s.backgroundColor, shadow: s.boxShadow.slice(0, 80), transform: s.transform };
  }, cfg.headerSelector);
  await page.evaluate((px) => window.scrollTo(0, px), cfg.stickyEngageScrollPx);
  await page.waitForTimeout(600);
  states.headerScrolled = await page.evaluate((sel) => {
    const h = document.querySelector(sel);
    if (!h) return null;
    const s = getComputedStyle(h);
    const r = h.getBoundingClientRect();
    return { position: s.position, h: Math.round(r.height), bg: s.backgroundColor, shadow: s.boxShadow.slice(0, 80), transform: s.transform, topOffset: Math.round(r.top) };
  }, cfg.headerSelector);
  await page.evaluate(() => window.scrollTo(0, 0));

  const rec = { refPath, bp, url, status, ...data, states, css, network: netImgs.slice(0, 200) };
  const file = path.join(cfg.harnessDir, 'profile', `ref-${slug(refPath)}-${bp}.json`);
  await writeJson(file, rec);
  await ctx.close();
  return {
    pass: `ref ${refPath} @${bp}`,
    status,
    height: data.page.scrollHeight,
    sections: data.page.sectionCount,
    headings: data.headings.length,
    file: path.relative(process.cwd(), file),
  };
}

async function main() {
  const cfg = await loadConfig();
  const a = parseArgs();
  const refPaths = a.route && a.route !== 'true'
    ? [cfg.refForRoute(a.route) ?? a.route]
    : Object.keys(cfg.routeMap);
  const bps = a.bp && a.bp !== 'true' ? [Number(a.bp)] : cfg.allBp;

  const b = await browser();
  const jobs = [];
  for (const refPath of refPaths) for (const bp of bps) jobs.push({ refPath, bp });

  const results = [];
  for (let i = 0; i < jobs.length; i += cfg.concurrency) {
    const batch = jobs.slice(i, i + cfg.concurrency);
    const out = await Promise.all(batch.map((j) =>
      profilePage(b, cfg, j.refPath, j.bp).catch((e) => ({ pass: `ref ${j.refPath} @${j.bp}`, error: e.message.slice(0, 120) }))));
    out.forEach((r) => { summary(r); results.push(r); });
  }
  await b.close();
  await writeJson(path.join(cfg.harnessDir, 'profile', 'index.json'), { generated: new Date().toISOString(), results });
  if (a.json) console.log(JSON.stringify(results));
  console.log(`PROFILE DONE ${results.length} passes -> .harness/profile/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
