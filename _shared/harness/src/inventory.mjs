// Prompt 2 — build assets/INVENTORY.md source data and generate placeholder SVGs.
// Reads .harness/assets/*.json (slot geometry) and .harness/cap/ref/**/sec-*.png
// (already on disk from Prompt 1) to sample dominant colour. Downloads nothing.
//   node src/inventory.mjs [--route <r>] [--all] [--json]
//
// Slot classification (which reference asset maps to which of OUR slot ids, and its
// provenance) is entirely cfg-driven — cfg.slotRules and cfg.badgePatterns — so this
// module carries zero site-specific asset names. See config.mjs / harness.config.mjs.
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { readJson, ensure, parseArgs } from './lib.mjs';
import { loadConfig, slug } from './config.mjs';

// WordPress-style srcset variants: foo-480x281.png / foo-980x574.png / foo.png are ONE
// slot. The base name is the slot; the largest natural size is "highest resolution served".
const baseName = (src) => {
  const f = src.split('/').pop().replace(/\.[a-z0-9]+$/i, '');
  return f.replace(/-\d{2,4}x\d{2,4}$/, '').replace(/-e\d{10,}$/, '');
};
const ext = (src) => (src.split('/').pop().match(/\.([a-z0-9]+)$/i) || [, ''])[1].toLowerCase();

// ---- dominant colour, sampled from the Prompt 1 section screenshots ----
const colourCache = new Map();
async function dominantColour(cfg, capSlug, bp, docBox) {
  const key = `${capSlug}-${bp}`;
  if (!colourCache.has(key)) {
    const meta = await readJson(path.join(cfg.harnessDir, 'cap', 'ref', `${capSlug}-${bp}`, 'meta.json'));
    colourCache.set(key, meta);
  }
  const meta = colourCache.get(key);
  if (!meta || !docBox || docBox.w < 2 || docBox.h < 2) return null;
  // Pick the section with the greatest vertical overlap, not the first that matches.
  // A full-bleed background can start a pixel above its own band and would otherwise
  // be attributed to the section above it, producing a 1px crop and no sample.
  let sec = null, bestOverlap = 0;
  for (const cand of meta.sections) {
    const ov = Math.min(docBox.y + docBox.h, cand.box.docBottom) - Math.max(docBox.y, cand.box.docTop);
    if (ov > bestOverlap) { bestOverlap = ov; sec = cand; }
  }
  if (!sec) return null;
  const png = path.join(cfg.harnessDir, 'cap', 'ref', `${capSlug}-${bp}`, `sec-${String(sec.idx).padStart(2, '0')}.png`);
  if (!existsSync(png)) return null;
  try {
    const img = sharp(png);
    const m = await img.metadata();
    const left = Math.max(0, Math.round(docBox.x));
    const top = Math.max(0, Math.round(docBox.y - sec.box.docTop));
    const width = Math.min(Math.round(docBox.w), m.width - left);
    const height = Math.min(Math.round(docBox.h), m.height - top);
    if (width < 2 || height < 2) return null;
    const st = await img.extract({ left, top, width, height }).stats();
    const [r, g, b] = st.channels.slice(0, 3).map((c) => Math.round(c.mean));
    return { hex: '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''), rgb: [r, g, b], from: 'slot-crop' };
  } catch {
    // crop fell outside the section shot (full-bleed background taller than its band):
    // fall back to the average of the whole section, which is still a real sample.
    try {
      const st = await sharp(png).stats();
      const [r, g, b] = st.channels.slice(0, 3).map((c) => Math.round(c.mean));
      return { hex: '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join(''), rgb: [r, g, b], from: 'section-average' };
    } catch { return null; }
  }
}

// ---- collect every slot across pages x breakpoints ----
async function collect(cfg, pages, bps) {
  const slots = new Map(); // key -> slot
  for (const { pageSlug, route, capSlug } of pages) {
    for (const bp of bps) {
      const f = path.join(cfg.harnessDir, 'assets', `${pageSlug}-${bp}.json`);
      const d = await readJson(f);
      if (!d) continue;

      const put = (kind, src, box, extra) => {
        if (!src) return;
        if (/mejs-controls/.test(src)) return;           // MediaElement.js player chrome
        if (/^data:/.test(src)) return;
        const base = baseName(src);
        const key = `${route}::${kind}::${base}`;
        if (!slots.has(key)) {
          slots.set(key, {
            route, pageSlug, capSlug, kind, base, ext: ext(src),
            files: new Set(), bps: {}, extra: {}, sectionTops: new Set(),
          });
        }
        const s = slots.get(key);
        s.files.add(src.split('/').pop());
        Object.assign(s.extra, extra);
        if (box && box.w > 0 && box.h > 0) {
          const prev = s.bps[bp];
          if (!prev || box.w * box.h > prev.w * prev.h) {
            s.bps[bp] = { w: Math.round(box.w), h: Math.round(box.h), x: box.x, y: box.y };
          }
        }
        if (extra && extra.sectionTop != null) s.sectionTops.add(extra.sectionTop);
      };

      for (const im of d.imgs) {
        put('img', im.src, im.rendered, {
          objectFit: im.objectFit, objectPosition: im.objectPosition, alt: im.alt,
          loading: im.loading, sectionIdx: im.section.idx, sectionHeading: im.section.heading,
          sectionTop: im.section.top,
          natural: im.natural.w ? `${im.natural.w}x${im.natural.h}` : null,
        });
      }
      for (const bgAsset of d.bg) {
        put('bg', bgAsset.src, bgAsset.rendered, {
          objectFit: bgAsset.backgroundSize, objectPosition: bgAsset.backgroundPosition,
          repeat: bgAsset.backgroundRepeat, attachment: bgAsset.backgroundAttachment,
          sectionIdx: bgAsset.section.idx, sectionHeading: bgAsset.section.heading, sectionTop: bgAsset.section.top,
        });
      }
      for (const v of d.videos) {
        put('video', v.src, v.rendered, {
          objectFit: v.objectFit, poster: v.poster, autoplay: v.autoplay, loop: v.loop,
          sectionIdx: v.section.idx, sectionHeading: v.section.heading, sectionTop: v.section.top,
        });
      }
    }
  }
  return slots;
}

// ---- our slot IDs and provenance decisions ----
// Every photographic / brand asset belonging to the reference business is REPLACE (D-09).
// Nothing REPLACE is downloaded, here or anywhere. Rules come from cfg.slotRules /
// cfg.badgePatterns (harness.config.mjs) — this module holds no site-specific asset names.
//   cfg.slotRules:     [{ match: RegExp, id, sec, prov, note }, ...]  (checked in order)
//   cfg.badgePatterns: [{ match: RegExp, idPrefix, sec, note }, ...] (fallback, badge grids)
function classify(cfg, base) {
  for (const rule of cfg.slotRules) {
    if (rule.match.test(base)) return { id: rule.id, sec: rule.sec, prov: rule.prov, note: rule.note };
  }
  for (const rule of cfg.badgePatterns) {
    if (rule.match.test(base)) {
      return {
        id: `${rule.idPrefix}-${base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}`,
        sec: rule.sec, prov: 'REPLACE', note: rule.note,
      };
    }
  }
  return { id: 'unclassified-' + base.toLowerCase().replace(/[^a-z0-9]+/g, '-'), sec: '?', prov: 'REPLACE',
           note: 'Unclassified reference asset; treated as theirs by default.' };
}

const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function aspectOf(w, h) {
  if (!w || !h) return '-';
  const g = gcd(w, h) || 1;
  let rw = w / g, rh = h / g;
  if (rw > 40 || rh > 40) { const r = w / h; return `${r.toFixed(2)}:1`; }
  return `${rw}:${rh}`;
}

// ---- placeholder SVG: dominant colour fill, slot ID + pixel dimensions as text ----
function placeholderSVG(slotId, w, h, hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const fg = lum > 0.55 ? '#111111' : '#ffffff';
  const fs = Math.max(11, Math.min(Math.round(Math.min(w, h) / 12), 28));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${slotId} placeholder">
  <rect width="${w}" height="${h}" fill="${hex}"/>
  <text x="50%" y="50%" fill="${fg}" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${fs}" font-weight="600" text-anchor="middle" dominant-baseline="middle">${slotId}</text>
  <text x="50%" y="50%" dy="${fs + 6}" fill="${fg}" fill-opacity="0.75" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="${Math.max(10, Math.round(fs * 0.72))}" text-anchor="middle" dominant-baseline="middle">${w}x${h}</text>
</svg>
`;
}

async function main() {
  const cfg = await loadConfig();
  const a = parseArgs();
  const bps = a.bp && a.bp !== 'true' ? [Number(a.bp)] : (a.all ? cfg.allBp : cfg.breakpoints.diff);
  const pages = Object.entries(cfg.routeMap)
    .filter(([refPath, route]) => !(a.route && a.route !== 'true') || route === a.route)
    .map(([refPath, route]) => ({ pageSlug: slug(refPath), route, refPath, capSlug: slug(route) }));

  const slots = await collect(cfg, pages, bps);
  const rows = [];

  for (const [, s] of slots) {
    const c = classify(cfg, s.base);
    const bpDims = {};
    for (const bp of bps) bpDims[bp] = s.bps[bp] || null;
    const largest = bps.map((b) => s.bps[b]).filter(Boolean)
      .sort((x, y) => y.w * y.h - x.w * x.h)[0] || null;

    // dominant colour at the breakpoint where the slot is biggest, largest bp first
    let colour = null, colourBp = null;
    for (const bp of [...bps].sort((x, y) => y - x)) {
      const box = s.bps[bp];
      if (!box) continue;
      const got = await dominantColour(cfg, s.capSlug, bp, box);
      if (got) { colour = got; colourBp = bp; break; }
    }
    if (!colour) colour = { hex: '#9aa0a6', rgb: [154, 160, 166] };

    // aspect per bp, and whether it changes across breakpoints
    const aspects = {};
    for (const bp of bps) aspects[bp] = bpDims[bp] ? aspectOf(bpDims[bp].w, bpDims[bp].h) : '-';
    const distinct = [...new Set(Object.values(aspects).filter((v) => v !== '-'))];
    const aspectChanges = distinct.length > 1;

    rows.push({
      slotId: c.id, route: s.route, section: c.sec, kind: s.kind, base: s.base, ext: s.ext,
      files: [...s.files], natural: s.extra.natural || null,
      objectFit: s.extra.objectFit || '-', objectPosition: s.extra.objectPosition || '-',
      loading: s.extra.loading || null,
      bps: bpDims, aspects, aspectChanges, largest,
      colour, colourBp, provenance: c.prov, note: c.note,
      refSectionIdx: s.extra.sectionIdx, refSectionHeading: s.extra.sectionHeading,
    });
  }

  // Collapse to one row per slot ID (cfg.sharedSlots — e.g. a header logo that repeats on
  // every route is one slot, not one per route).
  const merged = [];
  const seen = new Map();
  for (const r of rows) {
    const prior = seen.get(r.slotId);
    if (prior) {
      prior.files = [...new Set([...prior.files, ...r.files])];
      prior.count = (prior.count || 1) + 1;
      // keep the widest measurement seen for each breakpoint
      for (const bp of bps) {
        if (r.bps[bp] && (!prior.bps[bp] || r.bps[bp].w * r.bps[bp].h > prior.bps[bp].w * prior.bps[bp].h)) {
          prior.bps[bp] = r.bps[bp];
        }
      }
      if (!prior.colourBp && r.colourBp) { prior.colour = r.colour; prior.colourBp = r.colourBp; }
      if (cfg.sharedSlots[r.slotId]) prior.route = 'all';
      continue;
    }
    seen.set(r.slotId, r);
    merged.push(r);
  }
  for (const r of merged) if (cfg.sharedSlots[r.slotId]) r.route = 'all';
  // recompute aspect + largest after the merge
  for (const r of merged) {
    for (const bp of bps) r.aspects[bp] = r.bps[bp] ? aspectOf(r.bps[bp].w, r.bps[bp].h) : '-';
    const dis = [...new Set(Object.values(r.aspects).filter((v) => v !== '-'))];
    r.aspectChanges = dis.length > 1;
    r.largest = bps.map((b) => r.bps[b]).filter(Boolean).sort((x, y) => y.w * y.h - x.w * x.h)[0] || null;
  }

  merged.sort((x, y) => (x.route + x.slotId).localeCompare(y.route + y.slotId));

  // ---- generate placeholders for everything we actually build ----
  const outDir = await ensure(path.join(cfg.siteRoot, 'public', 'placeholders'));
  const generated = [];
  for (const r of merged) {
    if (r.provenance === 'DELETED') continue;
    const variants = [];
    const big = r.largest;
    if (!big) continue;
    variants.push({ w: big.w, h: big.h, suffix: '' });
    if (r.aspectChanges) {
      // second crop only where the slot changes aspect between breakpoints
      const alt = bps.map((b) => r.bps[b]).filter(Boolean)
        .find((d) => aspectOf(d.w, d.h) !== aspectOf(big.w, big.h));
      if (alt) variants.push({ w: alt.w, h: alt.h, suffix: '-alt' });
    }
    for (const v of variants) {
      const name = `${r.slotId}${v.suffix}.svg`;
      await writeFile(path.join(outDir, name), placeholderSVG(r.slotId + v.suffix, v.w, v.h, r.colour.hex), 'utf8');
      generated.push({ slotId: r.slotId, file: `public/placeholders/${name}`, w: v.w, h: v.h, hex: r.colour.hex });
    }
  }

  await writeFile(path.join(cfg.harnessDir, 'inventory.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), rows: merged, generated }, null, 2), 'utf8');

  if (a.json) console.log(JSON.stringify({ rows: merged, generated }));
  console.log(`SLOTS ${merged.length}  PLACEHOLDERS ${generated.length}  -> .harness/inventory.json`);
  const byProv = {};
  merged.forEach((r) => { byProv[r.provenance] = (byProv[r.provenance] || 0) + 1; });
  console.log('provenance:', JSON.stringify(byProv));
  console.log('aspect changes across bp:', merged.filter((r) => r.aspectChanges).map((r) => r.slotId).join(', ') || 'none');
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
