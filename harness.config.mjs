// Site config for @garage/harness. See _shared/harness/README.md for the full contract.
// Reference: Fraser Roofing, LLC (https://www.fraserroofingllc.com/) — a roofing
// business, adapted here to Northgate Garage Door Repairs. No business facts, copy, or
// imagery from the reference are reused; only its layout/structure is being profiled.

export default {
  referenceOrigin: 'https://www.fraserroofingllc.com',
  devPort: 3102,
  headless: true,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  concurrency: 2,

  breakpoints: { diff: [390, 768, 1440], extra: [430, 992], canonical: 1440 },

  // THE ONE route map: reference path -> our route. /privacy has no reference
  // counterpart in kind (NOVEL, generated per D-16) but the reference does publish a
  // privacy-policy page, so it's mapped for layout/typography profiling only.
  routeMap: {
    '/': '/',
    '/about-us/': '/about',
    '/roofing-services/': '/services',
    '/contact-us/': '/contact',
    '/privacy-policy/': '/privacy',
  },

  // This theme has no <section> tags and no <main>. Home/services pages use bespoke
  // "<page>-section-<n>" siblings directly under .wrapper; about/contact/privacy are
  // single WP article blobs (content-area) with no repeating band class. Try the
  // specific pattern first, then generic fallbacks.
  sectionCandidates: [
    '.wrapper > div[class*="-section-"]',
    '[role="main"] > *',
    'main > section',
    'section',
    'main > div',
  ],
  // Exact class selectors only (no substring matchers) — this theme has no <header>/
  // <footer> elements, it uses role-bearing divs instead.
  chromeSelectors: ['.header-one', '.mobile-sticky-header', '.footer'],
  headerSelector: '.header-one',
  navToggleSelector: '#hamburger, .js-hamburger',
  drawerSelector: '.nav-bar',
  ctaSelector: 'a[href^="tel:"], button, [class*=btn], [class*=button]',
  logoSelector: '.header-one img, .mobile-header__logo img',
  identityAttr: 'data-section',

  thresholds: { fidelity: 2, struct: 5, token: 0 },
  fidelityMode: 'auto',

  contractPath: 'docs/sections.md',
  reportPath: 'docs/divergence.md',
  copyModulePath: 'content/copy.ts',
};
