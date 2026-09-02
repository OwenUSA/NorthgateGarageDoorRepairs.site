// Per-site config loader for the shared harness.
//
// The package is site-agnostic. EVERYTHING reference-specific lives in a
// `harness.config.mjs` at the consuming site's root. Run harness scripts with the
// site directory as cwd; this module finds and validates that file.
//
// Governing rule: share the instrument, never the output. If you are tempted to add a
// selector, a route, a colour or a slot rule to the package, it belongs here instead.

import path from 'node:path';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const SITE_ROOT = process.cwd();
export const HARNESS_DIR = path.join(SITE_ROOT, '.harness');

const DEFAULTS = {
  // --- server / capture -----------------------------------------------------
  devPort: 3000,
  headless: true,
  locale: 'en-US',
  timezone: 'America/Chicago',
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  concurrency: 2,

  // --- breakpoints ----------------------------------------------------------
  // diff: the only widths that carry a threshold. extra: geometry-only, never a target.
  // canonical: the width whose section ids are the identity everything else pairs back to.
  breakpoints: { diff: [390, 768, 1440], extra: [430], canonical: 1440 },

  // --- routes ---------------------------------------------------------------
  // ONE map, referenced everywhere. Atlas duplicated this four times and the copies
  // drifted; do not reintroduce a second one.
  routeMap: {},

  // --- segmentation ---------------------------------------------------------
  // Framework-specific. Atlas's list was Divi-biased; profile each reference first.
  sectionCandidates: ['main > section', 'section', 'main > div'],
  // EXACT tag/id/class selectors ONLY. A `[class*=...]` here matched <body class="pb-callbar">
  // on Atlas and containment-dedup then deleted HEADER and FOOTER from every capture.
  chromeSelectors: ['header', 'footer'],
  headerSelector: 'header',
  navToggleSelector: 'button[aria-controls], .menu-toggle',
  drawerSelector: '[data-drawer], .mobile-menu',
  ctaSelector: 'a[href^="tel:"], button, [class*=btn], [class*=button]',
  logoSelector: 'header img, #logo',
  iconFontFamilies: /FontAwesome|dashicons|ETmodules|Material Icons/,
  identityAttr: 'data-section',

  // minimum boxes below which a node is chrome artefact / not a band
  minBandHeight: 8,
  chromeArtifact: { h: 60, w: 120 },
  maxClipHeight: 8000,
  hoverMinBp: 768,
  drawerMaxBp: 980,
  stickyEngageScrollPx: 900,

  // --- thresholds -----------------------------------------------------------
  thresholds: { fidelity: 2, struct: 5, token: 0 },
  fidelityMode: 'auto', // 'pixel' | 'structural' | 'auto'
  rootFontPx: 16,

  // --- paths ----------------------------------------------------------------
  tokenSources: ['src/app/globals.css', 'src/app/tokens.css', 'app/globals.css', 'styles/tokens.css'],
  contractPath: 'docs/sections.md',
  reportPath: 'docs/divergence.md',
  copyModulePath: 'content/copy.ts',

  // --- similarity gate ------------------------------------------------------
  industryAllowlist: [],
  gramN: 5,
  trigramMax: 0.15,
  lengthTolerance: 0.1,
  lengthExempt: {},

  // --- palette --------------------------------------------------------------
  referenceRamp: {},
  // Each entry may be a flat token OR { gradient: [stopA, stopB] }. Gradient entries are
  // sampled at N points and scored on the WORST stop -- a flat model of a ramp is how
  // Atlas shipped an invisible CTA that passed AA.
  pairsInUse: [],
  gradientSamples: 5,
  masterSeed: 1,
  semantic: {},

  // --- assets ---------------------------------------------------------------
  slotRules: [],
  badgePatterns: [],
  sharedSlots: {},

  // --- selftest fixture -----------------------------------------------------
  selftestFixture: null,
};

const REQUIRED = ['referenceOrigin', 'devPort', 'routeMap'];

function deepMerge(base, over) {
  const out = { ...base };
  for (const [k, v] of Object.entries(over ?? {})) {
    out[k] = v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof RegExp)
      ? deepMerge(base[k] ?? {}, v)
      : v;
  }
  return out;
}

let cached = null;

export async function loadConfig() {
  if (cached) return cached;
  const file = path.join(SITE_ROOT, 'harness.config.mjs');
  if (!existsSync(file)) {
    throw new Error(
      `No harness.config.mjs in ${SITE_ROOT}.\n` +
        `The shared harness carries no site data by design. Create one -- see _shared/harness/README.md.`
    );
  }
  const mod = await import(pathToFileURL(file).href);
  const cfg = deepMerge(DEFAULTS, mod.default ?? mod.config ?? mod);

  const missing = REQUIRED.filter((k) => cfg[k] == null || (typeof cfg[k] === 'object' && !Object.keys(cfg[k]).length));
  if (missing.length) throw new Error(`harness.config.mjs is missing required field(s): ${missing.join(', ')}`);

  for (const s of cfg.chromeSelectors) {
    if (/\[class\*=/.test(s)) {
      throw new Error(
        `chromeSelectors contains a substring matcher (${s}). This is the Atlas defect #1: ` +
          `[class*=callbar] matched <body class="pb-callbar"> and containment-dedup deleted HEADER and FOOTER ` +
          `from every capture. Use exact tag/id/class selectors.`
      );
    }
  }

  cfg.siteRoot = SITE_ROOT;
  cfg.harnessDir = HARNESS_DIR;
  cfg.local = `http://127.0.0.1:${cfg.devPort}`;
  // Routes are normally the values of routeMap, but a route can legitimately have NO
  // reference page -- /privacy usually does, and is NOVEL by definition. Such a route has
  // nothing to pair against and so cannot be keyed by a reference path, yet it still has
  // to be built, token-checked and render-truth gated. Declare `ourRoutes` explicitly in
  // that case; `refForRoute()` returns null for the unmapped ones, which the diff already
  // treats as "no pixel/structural target".
  cfg.ourRoutes = Array.isArray(cfg.ourRoutes) && cfg.ourRoutes.length
    ? cfg.ourRoutes
    : Object.values(cfg.routeMap);
  cfg.allBp = [...new Set([...cfg.breakpoints.diff, ...cfg.breakpoints.extra])].sort((a, b) => a - b);
  cfg.refForRoute = (r) => Object.entries(cfg.routeMap).find(([, v]) => v === r)?.[0] ?? null;

  cached = cfg;
  return cfg;
}

export const slug = (s) =>
  s === '/' ? 'home' : String(s).replace(/^\/|\/$/g, '').replace(/[^a-z0-9]+/gi, '-');
