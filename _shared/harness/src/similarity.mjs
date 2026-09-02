// Lexical gate — copy must not have been lifted from the reference.
//   node src/similarity.mjs            full table
//   node src/similarity.mjs --json     machine-readable
//
// Two measures, per section:
//   1. shared cfg.gramN-grams — our copy vs the ENTIRE reference corpus. Must be 0.
//      Checked corpus-wide, not just against the paired section, so an accidental lift
//      from any other reference page is still caught.
//   2. trigram Jaccard — our copy vs the PAIRED reference section, after stopwords and
//      the industry allowlist are removed. Must be <= cfg.trigramMax.
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { parseArgs } from './lib.mjs';
import { loadConfig } from './config.mjs';

const STOPWORDS = new Set(`a about above after again against all am an and any are as at be because been
before being below between both but by can cannot could did do does doing down during each few for from
further had has have having he her here hers herself him himself his how i if in into is it its itself
me more most my myself no nor not of off on once only or other ought our ours ourselves out over own
same she should so some such than that the their theirs them themselves then there these they this those
through to too under until up very was we were what when where which while who whom why with would you
your yours yourself yourselves will just dont cant wont thats weve youre isnt its im`.split(/\s+/));

const norm = (s) => String(s || '')
  .toLowerCase()
  .replace(/[‘’ʼ]/g, "'")
  .replace(/[“”]/g, '"')
  .replace(/[–—]/g, ' ')
  .replace(/&[a-z]+;/g, ' ')
  .replace(/[^a-z0-9'\-\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Remove allowlisted phrases as PHRASES, longest first, so an allowlisted span can never
// manufacture a shared n-gram or inflate the Jaccard overlap.
const stripAllowlist = (s, allowlist) => {
  let out = ' ' + s + ' ';
  for (const term of [...allowlist].sort((a, b) => b.length - a.length)) {
    const t = norm(term);
    out = out.split(' ' + t + ' ').join(' ');
  }
  return out.replace(/\s+/g, ' ').trim();
};

const words = (s) => s.split(' ').filter(Boolean);

export function ngrams(text, n, allowlist) {
  const w = words(stripAllowlist(norm(text), allowlist));
  const out = new Set();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(' '));
  return out;
}

export function contentTrigrams(text, allowlist) {
  const w = words(stripAllowlist(norm(text), allowlist)).filter((t) => !STOPWORDS.has(t));
  const out = new Set();
  for (let i = 0; i + 3 <= w.length; i++) out.add(w.slice(i, i + 3).join(' '));
  return out;
}

export function jaccard(a, b) {
  if (!a.size && !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

// ---- our copy, flattened to one text blob per section ----
// Structural keys are bookkeeping, not copy. Counting them inflates every short section.
const STRUCTURAL_KEYS = new Set(['id', 'refSection', 'cls']);
function flatten(node, acc = []) {
  if (node == null) return acc;
  if (typeof node === 'string') { acc.push(node); return acc; }
  if (Array.isArray(node)) { for (const x of node) flatten(x, acc); return acc; }
  if (typeof node === 'object') {
    for (const k of Object.keys(node)) if (!STRUCTURAL_KEYS.has(k)) flatten(node[k], acc);
    return acc;
  }
  return acc;
}

export async function ourSections(cfg) {
  const mod = await import(pathToFileURL(path.join(cfg.siteRoot, cfg.copyModulePath)).href);
  const copy = mod.copy ?? mod.default;
  const out = [];
  for (const [route, page] of Object.entries(copy.routes)) {
    for (const sec of page.sections) {
      out.push({
        route, id: sec.id, refSection: sec.refSection ?? null, cls: sec.cls,
        headings: flatten(sec.heading ?? '').concat(flatten(sec.subheading ?? '')),
        text: flatten(sec).join(' '),
      });
    }
    out.push({
      route, id: '(metadata)', refSection: 'metadata', cls: 'ADAPTED',
      headings: [page.meta.title],
      text: `${page.meta.title} ${page.meta.description}`,
    });
  }
  return out;
}

async function refCorpus(cfg) {
  const f = path.join(cfg.harnessDir, 'refcopy.json');
  const raw = JSON.parse(await readFile(f, 'utf8'));
  // ONE route map — cfg.routeMap, refPath -> our route — not a private copy of it.
  const byRoute = Object.fromEntries(
    Object.entries(cfg.routeMap).map(([refPath, route]) => [route, raw[refPath]])
  );
  const all = Object.values(raw).flat().map((s) => s.text).join(' ');
  return { byRoute, all };
}

export const exemptReason = (cfg, route, section) =>
  cfg.lengthExempt[`${route}::${section}`] ?? cfg.lengthExempt[`*::${section}`] ?? null;

// map our section id -> reference section index, via docs/sections.md ids (sNN-...)
const refIdx = (refSection) => {
  const m = String(refSection || '').match(/^s(\d+)/);
  return m ? Number(m[1]) : null;
};

export async function run(cfg) {
  const ours = await ourSections(cfg);
  const ref = await refCorpus(cfg);
  const refAllGrams = ngrams(ref.all, cfg.gramN, cfg.industryAllowlist);

  const rows = [];
  for (const s of ours) {
    const idx = refIdx(s.refSection);
    const refSec = idx != null && ref.byRoute[s.route] ? ref.byRoute[s.route].find((x) => x.idx === idx) : null;
    // A route with no entry in cfg.routeMap (e.g. a NOVEL-only page composed from
    // vocabulary, never paired to a reference URL) has no ref.byRoute[route] at all.
    // That's a real, valid state -- not an error -- so the metadata corpus is empty
    // rather than throwing on `undefined.map`.
    const refText = refSec ? refSec.text : (s.refSection === 'metadata' && ref.byRoute[s.route] ? ref.byRoute[s.route].map((x) => x.text).join(' ') : '');

    const ourGrams = ngrams(s.text, cfg.gramN, cfg.industryAllowlist);
    const shared = [...ourGrams].filter((g) => refAllGrams.has(g));

    const tri = jaccard(
      contentTrigrams(s.text, cfg.industryAllowlist),
      contentTrigrams(refText, cfg.industryAllowlist)
    );

    rows.push({
      route: s.route, section: s.id, cls: s.cls,
      refSection: s.refSection,
      ourChars: s.text.length,
      refChars: refSec ? refSec.chars : null,
      charDeltaPct: refSec ? Math.round(((s.text.length - refSec.chars) / refSec.chars) * 1000) / 10 : null,
      lengthExempt: exemptReason(cfg, s.route, s.id),
      sharedGrams: shared.length,
      sharedGramExamples: shared.slice(0, 3),
      trigram: Math.round(tri * 1000) / 1000,
      passGram: shared.length === 0,
      passTri: tri <= cfg.trigramMax,
    });
  }
  return rows;
}

function table(rows, cfg) {
  const head = `route | section | ref | our chars | ref chars | Δ% | ${cfg.gramN}-grams | trigram | status`;
  const sep = '------|---------|-----|-----------|-----------|----|---------|---------|-------';
  const body = rows.map((r) => {
    const ok = r.passGram && r.passTri;
    const exempt = !!r.lengthExempt;
    return [
      r.route, r.section.slice(0, 26), (r.refSection || '-').slice(0, 22),
      r.ourChars, r.refChars ?? '-',
      r.charDeltaPct == null ? '-' : (r.charDeltaPct > 0 ? '+' : '') + r.charDeltaPct,
      r.sharedGrams, r.trigram.toFixed(3),
      (ok ? 'PASS' : [!r.passGram ? 'GRAM' : null, !r.passTri ? 'TRIGRAM' : null].filter(Boolean).join('+'))
        + (exempt ? ' (EXEMPT)' : (r.charDeltaPct != null && Math.abs(r.charDeltaPct) > cfg.lengthTolerance * 100 ? ' (LEN)' : '')),
    ].join(' | ');
  });
  return [head, sep, ...body].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const cfg = await loadConfig();
  const argv = parseArgs();
  const rows = await run(cfg);
  if (argv.json) {
    console.log(JSON.stringify(rows, null, 2));
  } else {
    console.log(table(rows, cfg));
    const fails = rows.filter((r) => !r.passGram || !r.passTri);
    const lenTolerancePct = cfg.lengthTolerance * 100;
    const measured = rows.filter((r) => r.charDeltaPct != null && !r.lengthExempt);
    const charFails = measured.filter((r) => Math.abs(r.charDeltaPct) > lenTolerancePct);
    const exempt = rows.filter((r) => r.lengthExempt);
    console.log(`\nsections: ${rows.length}`);
    console.log(`${cfg.gramN}-gram gate : ${rows.filter((r) => r.passGram).length}/${rows.length} pass (zero shared ${cfg.gramN}-grams with the entire reference corpus)`);
    console.log(`trigram gate : ${rows.filter((r) => r.passTri).length}/${rows.length} pass (Jaccard <= ${cfg.trigramMax} vs paired section)`);
    console.log(`length gate  : ${measured.length - charFails.length}/${measured.length} measured sections within +/-${lenTolerancePct}% (${exempt.length} exempt, see cfg.lengthExempt — always reported EXEMPT, never PASS)`);
    if (charFails.length) console.log('  outside tolerance: ' + charFails.map((r) => `${r.route}:${r.section}(${r.charDeltaPct > 0 ? '+' : ''}${r.charDeltaPct}%)`).join(', '));
    if (exempt.length) {
      console.log('  exempt:');
      for (const e of exempt) console.log(`    ${e.route}:${e.section} (${e.charDeltaPct > 0 ? '+' : ''}${e.charDeltaPct}%) — ${e.lengthExempt.slice(0, 96)}...`);
    }
    if (fails.length) {
      console.log('\nFAILING:');
      for (const f of fails) {
        console.log(`  ${f.route} ${f.section}: ${cfg.gramN}grams=${f.sharedGrams} trigram=${f.trigram}`);
        if (f.sharedGramExamples.length) console.log('     shared: ' + f.sharedGramExamples.map((x) => `"${x}"`).join(', '));
      }
      process.exitCode = 1;
    }
  }
}
