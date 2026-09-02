// Prompt 9 — generate a contact sheet per palette candidate: 3 crops (home hero,
// services grid, footer) at 1440 and 390, assembled into one image per seed. Does NOT
// modify the committed app/globals.css: it patches the 8 rotated colour custom
// properties in place, screenshots, then restores the file from the backup this script
// makes on its own first run. Never applies a candidate permanently -- Prompt 9 stops
// at candidate generation; the human picks next turn.
//
//   node scripts/palette-contact-sheet.mjs
import path from 'node:path';
import { readFile, writeFile, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import sharp from '../_shared/harness/node_modules/sharp/lib/index.js';
import { chromium } from '../_shared/harness/node_modules/playwright/index.mjs';
import { generate } from '../_shared/harness/src/palette.mjs';
import { loadConfig } from '../_shared/harness/src/config.mjs';

const SITE_ROOT = path.resolve(import.meta.dirname, '..');
const CSS_PATH = path.join(SITE_ROOT, 'app/globals.css');
const BACKUP_PATH = path.join(SITE_ROOT, '.harness/globals.css.orig-backup');
const OUT_DIR = path.join(SITE_ROOT, 'docs/palette-candidates');

// candidate.tokens (palette.mjs's canonical names) -> our real CSS custom properties.
function patchedCss(original, tokens) {
  const map = {
    '--color-ink': tokens.primary,
    '--color-ink-strong': tokens.primaryDeep,
    '--color-primary': tokens.accent,
    '--color-primary-strong': tokens.accentDeep,
    '--color-surface': tokens.neutral0,
    '--color-surface-muted': tokens.neutral200,
    '--color-border': tokens.neutral400,
    '--color-border-strong': tokens.borderStrong,
    '--color-ink-soft': tokens.neutral600,
    '--color-focus': tokens.focus,
  };
  let css = original;
  for (const [prop, hex] of Object.entries(map)) {
    // First occurrence only (the @theme declaration line, e.g. "  --color-ink: #1f2933;").
    const re = new RegExp(`(${prop}:\\s*)#[0-9a-fA-F]{3,8}(;)`);
    css = css.replace(re, `$1${hex}$2`);
  }
  return css;
}

async function waitForCss(page, expectedHex) {
  // Poll until the live stylesheet reflects the patched value (dev-server HMR is async).
  for (let i = 0; i < 40; i++) {
    const got = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim()
    );
    if (got.toLowerCase().includes(expectedHex.toLowerCase().replace('#', ''))) return;
    await page.waitForTimeout(250);
  }
}

async function cropSection(page, selector, outFile) {
  const el = await page.$(selector);
  if (!el) { console.warn('  missing section', selector); return null; }
  await el.screenshot({ path: outFile });
  return outFile;
}

async function main() {
  const cfg = await loadConfig();
  if (!existsSync(BACKUP_PATH)) {
    await copyFile(CSS_PATH, BACKUP_PATH);
  }
  const original = await readFile(BACKUP_PATH, 'utf8');

  const seeds = process.argv.includes('--seeds')
    ? process.argv[process.argv.indexOf('--seeds') + 1].split(',').map(Number)
    : null;

  let candidates;
  if (seeds) {
    candidates = seeds.map((seed) => generate(seed, cfg));
  } else {
    const { selectPalette } = await import('../_shared/harness/src/palette.mjs');
    candidates = selectPalette(cfg).candidates;
  }

  const b = await chromium.launch();
  const sheets = [];

  for (const cand of candidates) {
    console.log(`seed ${cand.seed} (${cand.schemeName}, primary hue ${cand.primaryHue})`);
    const patched = patchedCss(original, cand.tokens);
    await writeFile(CSS_PATH, patched, 'utf8');

    const crops = [];
    for (const bp of [1440, 390]) {
      const page = await (await b.newContext({ viewport: { width: bp, height: 900 } })).newPage();
      await page.goto(`${cfg.local}/`, { waitUntil: 'domcontentloaded' });
      await waitForCss(page, cand.tokens.accent);
      await page.waitForTimeout(300);
      for (const [label, sel] of [
        ['hero', '[data-section="hero"]'],
        ['services-grid', '[data-section="services-grid"]'],
        ['footer', '[data-section="footer"]'],
      ]) {
        const file = path.join(OUT_DIR, `_tmp-${cand.seed}-${label}-${bp}.png`);
        const got = await cropSection(page, sel, file);
        if (got) crops.push(got);
      }
      await page.close();
    }

    // Assemble: two rows (1440, 390), three columns (hero, services-grid, footer).
    const metas = await Promise.all(crops.map((f) => sharp(f).metadata()));
    const colW = Math.max(...metas.filter((_, i) => i < 3).map((m) => m.width));
    const rowH1440 = Math.max(...metas.slice(0, 3).map((m) => m.height));
    const rowH390 = Math.max(...metas.slice(3, 6).map((m) => m.height));
    const pad = 16;
    const sheetW = colW * 3 + pad * 4;
    const sheetH = rowH1440 + rowH390 + pad * 3 + 40;

    const composite = crops.map((f, i) => ({
      input: f,
      left: pad + (i % 3) * (colW + pad),
      top: i < 3 ? pad + 40 : pad * 2 + 40 + rowH1440,
    }));

    const label = Buffer.from(
      `<svg width="${sheetW}" height="30"><text x="8" y="20" font-size="16" font-family="sans-serif">seed ${cand.seed} — ${cand.schemeName}, primary hue ${cand.primaryHue}, accent hue ${cand.accentHue}</text></svg>`
    );

    const outFile = path.join(OUT_DIR, `candidate-${cand.seed}.png`);
    await sharp({ create: { width: sheetW, height: sheetH, channels: 3, background: '#ffffff' } })
      .composite([{ input: label, left: 0, top: 0 }, ...composite])
      .png()
      .toFile(outFile);
    sheets.push(outFile);
    console.log('  ->', outFile);
  }

  await b.close();
  // Restore the original file -- never leave a candidate applied.
  await writeFile(CSS_PATH, original, 'utf8');
  console.log('\nrestored app/globals.css to the committed original.');
  console.log('sheets:', sheets.join('\n'));
}

main();
