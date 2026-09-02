// Extract reference body copy per section, for the Prompt 3 lexical gate.
// Text only, at cfg.breakpoints.canonical. Writes .harness/refcopy.json.
//   node src/refcopy.mjs [--route <r>] [--all] [--json]
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { evalWithSegmentation } from './probe.mjs';
import { browser, newPage, settle, writeJson, parseArgs } from './lib.mjs';
import { loadConfig } from './config.mjs';

// Section segmentation is probe.mjs's segmentSections(cfg) — this module does NOT
// re-implement it. See probe.mjs's Playwright note for why this has to be composed via
// evalWithSegmentation() rather than imported and called directly in-page.
const EXTRACT = (cfg, segmentSections) => {
  const { nodes: all } = segmentSections(cfg);
  const clean = (t) => (t || '').replace(/\s+/g, ' ').trim();
  return all.map((el, i) => {
    const h = el.querySelector('h1,h2,h3');
    const heads = Array.from(el.querySelectorAll('h1,h2,h3,h4')).map((x) => clean(x.textContent)).filter(Boolean);
    const paras = Array.from(el.querySelectorAll('p,li')).map((x) => clean(x.textContent)).filter(Boolean);
    const btns = Array.from(el.querySelectorAll(cfg.ctaSelector)).map((x) => clean(x.textContent)).filter(Boolean);
    return {
      idx: i,
      heading: clean(h ? h.textContent : ''),
      headings: heads, paragraphs: paras, buttons: btns,
      text: clean(el.textContent),
      chars: clean(el.textContent).length,
      headingChars: heads.join(' ').length,
      bodyChars: paras.join(' ').length,
      h: Math.round(el.getBoundingClientRect().height),
    };
  });
};

async function main() {
  const cfg = await loadConfig();
  const a = parseArgs();
  const refPaths = a.route && a.route !== 'true'
    ? [cfg.refForRoute(a.route) ?? a.route]
    : Object.keys(cfg.routeMap);
  const bp = cfg.breakpoints.canonical;

  const b = await browser();
  const out = {};
  for (const refPath of refPaths) {
    const { ctx, page } = await newPage(b, bp, cfg);
    await page.goto(cfg.referenceOrigin + refPath, { waitUntil: 'domcontentloaded' });
    await settle(page);
    out[refPath] = await evalWithSegmentation(page, EXTRACT, cfg);
    console.log(refPath, out[refPath].length, 'sections,', out[refPath].reduce((acc, s) => acc + s.chars, 0), 'chars');
    await ctx.close();
  }
  await b.close();
  const file = path.join(cfg.harnessDir, 'refcopy.json');
  await writeJson(file, out);
  if (a.json) console.log(JSON.stringify(out));
  console.log('-> .harness/refcopy.json');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
