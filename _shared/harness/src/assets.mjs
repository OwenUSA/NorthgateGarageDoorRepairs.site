// Prompt 2 — asset slot inventory. Enumerates every slot the reference actually renders:
// <img> + srcset, <source>, CSS url() on any element, preload tags, @font-face sources,
// video/poster. Records RENDERED geometry per breakpoint, not just the file.
// Writes .harness/assets/<page>-<bp>.json. Never downloads a REPLACE asset.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { evalWithSegmentation } from './probe.mjs';
import { browser, newPage, settle, writeJson, summary, parseArgs } from './lib.mjs';
import { loadConfig, slug } from './config.mjs';

// Section segmentation is probe.mjs's segmentSections(cfg) — this module does NOT
// re-implement it. See probe.mjs's Playwright note for why this has to be composed via
// evalWithSegmentation() rather than imported and called directly in-page.
const PROBE_ASSETS = (cfg, segmentSections) => {
  const px = (v) => Math.round(parseFloat(v) * 100) / 100;
  const cs = (el) => getComputedStyle(el);

  // which banded section does this node live in?
  const { nodes: SECS } = segmentSections(cfg);
  const sectionOf = (el) => {
    for (let i = 0; i < SECS.length; i++) {
      if (SECS[i].contains(el)) {
        const h = SECS[i].querySelector('h1,h2,h3');
        return {
          idx: i, heading: (h ? h.textContent : '').trim().slice(0, 40),
          top: px(SECS[i].getBoundingClientRect().top + scrollY),
        };
      }
    }
    return { idx: -1, heading: '', top: 0 };
  };
  const boxOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: px(r.left + scrollX), y: px(r.top + scrollY), w: px(r.width), h: px(r.height) };
  };

  // ---- <img>, including srcset and the resolution actually served ----
  const imgs = Array.from(document.querySelectorAll('img')).map((im) => ({
    kind: 'img',
    src: (im.currentSrc || im.src || '').split('?')[0],
    srcset: (im.getAttribute('srcset') || '').slice(0, 400),
    sizes: im.getAttribute('sizes') || null,
    alt: (im.alt || '').slice(0, 90),
    rendered: boxOf(im),
    natural: { w: im.naturalWidth, h: im.naturalHeight },
    objectFit: cs(im).objectFit, objectPosition: cs(im).objectPosition,
    loading: im.loading || null, decoding: im.decoding || null,
    section: sectionOf(im),
  }));

  // ---- <picture><source> ----
  const sources = Array.from(document.querySelectorAll('source')).map((s) => ({
    kind: 'source', srcset: (s.getAttribute('srcset') || s.src || '').slice(0, 400),
    media: s.media || null, type: s.type || null, section: sectionOf(s),
  }));

  // ---- CSS url() on ANY element: backgrounds, masks, list markers, border images ----
  const urlRe = /url\((['"]?)([^'")]+)\1\)/g;
  const bg = [];
  for (const el of Array.from(document.querySelectorAll('*'))) {
    const s = cs(el);
    for (const prop of ['backgroundImage', 'maskImage', 'webkitMaskImage', 'borderImageSource', 'listStyleImage']) {
      const v = s[prop];
      if (!v || v === 'none') continue;
      let m; urlRe.lastIndex = 0;
      while ((m = urlRe.exec(v))) {
        const u = m[2];
        if (u.startsWith('data:')) continue;
        bg.push({
          kind: 'css-' + prop, src: u.split('?')[0],
          rendered: boxOf(el),
          backgroundSize: s.backgroundSize, backgroundPosition: s.backgroundPosition,
          backgroundRepeat: s.backgroundRepeat, backgroundAttachment: s.backgroundAttachment,
          tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 70),
          section: sectionOf(el),
        });
      }
    }
  }

  // ---- gradients are token material for Prompt 5, not files ----
  const gradients = Array.from(new Set(
    Array.from(document.querySelectorAll('*'))
      .map((el) => cs(el).backgroundImage)
      .filter((v) => v && v.includes('gradient'))
      .map((v) => v.slice(0, 160))
  )).slice(0, 25);

  // ---- video + poster ----
  const videos = Array.from(document.querySelectorAll('video')).map((v) => {
    const inner = v.querySelector('source');
    return {
      kind: 'video',
      src: (v.currentSrc || v.src || (inner ? inner.src : '') || '').split('?')[0],
      poster: v.poster || null, rendered: boxOf(v),
      autoplay: v.autoplay, loop: v.loop, muted: v.muted,
      objectFit: cs(v).objectFit, section: sectionOf(v),
    };
  });

  // ---- inline SVG (icon sprites / decorative) ----
  const svgs = Array.from(document.querySelectorAll('svg')).map((s) => {
    const u = s.querySelector('use');
    return {
      kind: 'svg-inline', rendered: boxOf(s),
      stroke: cs(s).stroke, strokeWidth: cs(s).strokeWidth, fill: cs(s).fill,
      use: !!u, useHref: u ? u.getAttribute('href') : null,
      section: sectionOf(s),
    };
  }).filter((s) => s.rendered.w > 0);

  // ---- icon FONTS rendered as glyphs ----
  const iconGlyphs = Array.from(document.querySelectorAll('*')).filter((el) => {
    const fam = cs(el).fontFamily || '';
    return cfg.iconFontFamilies.test(fam) && el.getBoundingClientRect().width > 0;
  }).map((el) => {
    const s = cs(el);
    const before = getComputedStyle(el, '::before').content;
    return {
      kind: 'icon-font', family: s.fontFamily.split(',')[0].replace(/["']/g, ''),
      glyph: before && before !== 'none' ? before.slice(0, 12) : null,
      fontSize: px(s.fontSize), color: s.color,
      rendered: boxOf(el), section: sectionOf(el),
    };
  }).slice(0, 60);

  // ---- preload / prefetch / preconnect ----
  const preloads = Array.from(document.querySelectorAll('link[rel=preload],link[rel=prefetch],link[rel=preconnect]'))
    .map((l) => ({ rel: l.rel, as: l.getAttribute('as'), href: (l.href || '').split('?')[0], type: l.type || null }));

  // ---- @font-face: the font files themselves ----
  const fontFaces = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules; try { rules = sheet.cssRules; } catch { continue; }
    if (!rules) continue;
    for (const r of Array.from(rules)) {
      const isFace = r.constructor && r.constructor.name === 'CSSFontFaceRule';
      if (!isFace) continue;
      const st = r.style;
      fontFaces.push({
        family: (st.getPropertyValue('font-family') || '').replace(/["']/g, '').trim(),
        weight: st.getPropertyValue('font-weight') || 'normal',
        style: st.getPropertyValue('font-style') || 'normal',
        display: st.getPropertyValue('font-display') || null,
        src: (st.getPropertyValue('src') || '').slice(0, 320),
        unicodeRange: (st.getPropertyValue('unicode-range') || '').slice(0, 120) || null,
      });
    }
  }

  // ---- families actually USED on rendered text ----
  const usedFamilies = {};
  for (const el of Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,a,li,span,button,input,label,div'))) {
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    const s = cs(el);
    const fam = s.fontFamily.split(',')[0].replace(/["']/g, '').trim();
    usedFamilies[fam] = usedFamilies[fam] || { family: fam, count: 0, weights: {}, sizes: {} };
    usedFamilies[fam].count++;
    usedFamilies[fam].weights[s.fontWeight] = (usedFamilies[fam].weights[s.fontWeight] || 0) + 1;
    usedFamilies[fam].sizes[px(s.fontSize)] = (usedFamilies[fam].sizes[px(s.fontSize)] || 0) + 1;
  }

  // ---- the logo slot specifically ----
  const logoEl = document.querySelector(cfg.logoSelector);
  const logo = logoEl ? {
    src: (logoEl.currentSrc || logoEl.src || '').split('?')[0],
    rendered: boxOf(logoEl), natural: { w: logoEl.naturalWidth, h: logoEl.naturalHeight },
    alt: (logoEl.alt || '').slice(0, 80), objectFit: cs(logoEl).objectFit,
  } : null;

  return {
    imgs, sources, bg, gradients, videos, svgs, iconGlyphs, preloads,
    fontFaces, usedFamilies, logo, sectionCount: SECS.length,
  };
};

async function run(b, cfg, { side, refPath, route, bp }) {
  const { ctx, page } = await newPage(b, bp, cfg);
  const net = [];
  page.on('response', (r) => {
    const u = r.url();
    if (/\.(jpe?g|png|webp|avif|svg|gif|ico|woff2?|ttf|otf|eot|mp4|webm|glb|gltf)(\?|$)/i.test(u)) {
      net.push({
        url: u.split('?')[0], status: r.status(),
        type: r.headers()['content-type'] || '',
        bytes: Number(r.headers()['content-length'] || 0),
      });
    }
  });
  const target = side === 'ours' ? cfg.local + route : cfg.referenceOrigin + refPath;
  await page.goto(target, { waitUntil: 'domcontentloaded' });
  await settle(page);
  const data = await evalWithSegmentation(page, PROBE_ASSETS, cfg);
  const file = path.join(cfg.harnessDir, 'assets', `${slug(side === 'ours' ? route : refPath)}-${bp}.json`);
  await writeJson(file, { side, refPath, route, bp, ...data, network: net });
  await ctx.close();
  return {
    pass: `assets ${side === 'ours' ? route : refPath} @${bp}`, imgs: data.imgs.length, bg: data.bg.length,
    icons: data.iconGlyphs.length, faces: data.fontFaces.length, net: net.length,
  };
}

async function main() {
  const cfg = await loadConfig();
  const a = parseArgs();
  const side = a.side && a.side !== 'true' ? a.side : 'ref';
  const refPaths = a.route && a.route !== 'true'
    ? [cfg.refForRoute(a.route) ?? a.route]
    : Object.keys(cfg.routeMap);
  const bps = a.bp && a.bp !== 'true' ? [Number(a.bp)] : (a.all ? cfg.allBp : cfg.breakpoints.diff);

  const b = await browser();
  const jobs = [];
  for (const refPath of refPaths) for (const bp of bps) jobs.push({ refPath, route: cfg.routeMap[refPath] ?? refPath, bp });
  const out = [];
  for (let i = 0; i < jobs.length; i += cfg.concurrency) {
    const r = await Promise.all(jobs.slice(i, i + cfg.concurrency).map((j) =>
      run(b, cfg, { side, ...j }).catch((e) => ({ pass: `assets ${j.refPath} @${j.bp}`, error: e.message.slice(0, 110) }))));
    r.forEach(summary);
    out.push(...r);
  }
  await b.close();
  if (a.json) console.log(JSON.stringify(out));
  console.log('ASSET PROBE DONE -> .harness/assets/');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
