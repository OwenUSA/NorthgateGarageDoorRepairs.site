// Shared harness primitives. Node 22, ESM, no hosted services.
// Site-specific facts (routes, ports, breakpoints, selectors...) never live here — they
// come from `loadConfig()` in config.mjs. This module is pure mechanism.
import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export async function ensure(dir) {
  await mkdir(dir, { recursive: true });
  return dir;
}
export async function writeJson(file, data) {
  await ensure(path.dirname(file));
  await writeFile(file, JSON.stringify(data, null, 2), 'utf8');
  return file;
}
export async function readJson(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, 'utf8'));
}

export async function browser({ headed = false } = {}) {
  return chromium.launch({
    headless: !headed,
    args: ['--disable-blink-features=AutomationControlled', '--force-color-profile=srgb', '--font-render-hinting=none'],
  });
}

export async function newPage(b, width, cfg, { height = 900, motion = 'reduce' } = {}) {
  const ctx = await b.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    userAgent: cfg.userAgent,
    locale: cfg.locale,
    timezoneId: cfg.timezone,
    reducedMotion: motion, // deterministic captures; motion is profiled separately
    hasTouch: width < 768,
    isMobile: width < 768,
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(45000);
  return { ctx, page };
}

// Deterministic settle: fonts, lazy images, animation freeze. No scrollTo() stepping.
export async function settle(page, { freeze = true } = {}) {
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(async () => {
    // Force every lazy/offscreen asset to commit before we measure.
    const H = document.documentElement.scrollHeight;
    for (let y = 0; y < H; y += Math.round(window.innerHeight * 0.8)) {
      window.scrollTo(0, y); // eslint-disable-line -- asset warm-up only, not a motion sample
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  try { await page.evaluate(() => document.fonts.ready); } catch {}
  if (freeze) {
    await page.addStyleTag({
      content: `*,*::before,*::after{animation-play-state:paused!important;animation-delay:-1ms!important;animation-duration:1ms!important;transition-duration:0s!important;transition-delay:0s!important;caret-color:transparent!important;scroll-behavior:auto!important}`,
    });
  }
  await page.waitForTimeout(200);
}

export function pct(n) { return Math.round(n * 10000) / 100; }
export const summary = (o) => console.log(JSON.stringify(o));

// ---------------------------------------------------------------------------------------
// Consistent CLI across capture.mjs, diff.mjs, profile-reference.mjs, refcopy.mjs,
// assets.mjs, inventory.mjs: `--route <r>` `--bp <n>` `--side ref|ours` `--all` `--json`.
// One parser, one scheme. Atlas's diff.mjs/capture.mjs parsed no flags at all and every
// site that copied this harness invented its own; that stops here.
export function parseArgs(argv = process.argv.slice(2)) {
  const o = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      o[k] = v;
    }
  }
  return o;
}
