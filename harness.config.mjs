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

  // `[data-section]` first: OUR OWN build tags every real section (including header/
  // footer) with this attribute (identityAttr below), so it reliably yields >=2 matches
  // even on a route with only one content section (/about, /privacy -- header+footer+1
  // content section = 3) where 'main > section' alone never reaches the >=2 threshold a
  // candidate needs to win. Harmless on the reference side: it has zero data-section
  // attributes, so this candidate always yields 0 there and falls through to the
  // reference-shaped candidates below, unchanged. This theme has no <section> tags and
  // no <main>. Home/services pages use bespoke "<page>-section-<n>" siblings directly
  // under .wrapper; about/contact/privacy are single WP article blobs (content-area)
  // with no repeating band class. Try the specific pattern first, then generic fallbacks.
  sectionCandidates: [
    '[data-section]',
    '.wrapper > div[class*="-section-"]',
    '[role="main"] > *',
    'main > section',
    'section',
    'main > div',
  ],
  // Exact class selectors only (no substring matchers). The reference theme has no
  // <header>/<footer> elements (role-bearing divs instead), but OUR OWN build (Prompt 5)
  // uses plain semantic <header>/<footer> tags -- both are listed so chrome is
  // recognized correctly on either side of every diff.
  chromeSelectors: ['.header-one', '.mobile-sticky-header', '.footer', 'header', 'footer'],
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
  // Prompt 5: the one real token source. Kept as a one-entry list (not the multi-path
  // default) since there is exactly one @theme block on this site, in app/globals.css.
  tokenSources: ['app/globals.css'],

  // --- Prompt 2: asset provenance ------------------------------------------
  // Checked in order, first match wins. Everything photographic/branded belonging to
  // Fraser Roofing is REPLACE per D-09 — never downloaded. The few TAKE/DELETED cases are
  // named exactly (one base per rule); the long tail of one-off badge/background/CTA
  // photos is handled by badgePatterns below with a dynamic per-base id.
  slotRules: [
    { match: /^logo$/, id: 'logo', sec: 'header', prov: 'REPLACE',
      note: 'Business wordmark. Ours: wordmark set in the extracted display font (Russo One) until a real file lands. TODO(fact): logo asset.' },
    { match: /^fraser-favicon/, id: 'favicon', sec: 'meta', prov: 'REPLACE',
      note: "Their favicon; ours is generated from our own wordmark, not theirs." },
    { match: /^close-icon$/, id: 'icon-close', sec: 'nav', prov: 'TAKE',
      note: 'Generic UI close glyph, no branding — reproduced via lucide-react (X), not downloaded.' },
    { match: /^%23/, id: 'svg-fragment-ref', sec: '?', prov: 'DELETED',
      note: 'SVG filter/gradient fragment identifier (url(#id)) picked up by the probe — not a real image asset.' },
    { match: /^roofle-logo-progress/, id: 'roofle-widget', sec: 'services', prov: 'DELETED',
      note: 'Third-party "Instant Quote" widget branding (Roofle). Not one of our routes/features — D-12 bans prices/instant-quote CTAs.' },
    { match: /^fraser_map/, id: 'ref-map-image', sec: 'contact', prov: 'DELETED',
      note: 'Static map graphic on their site; ours is a live keyless Google Maps iframe per D-07/D-08, not an image.' },
  ],
  badgePatterns: [
    { match: /^(Top-100-02|best-of-gwinett-2025|logo-bbb-1|logo-nwr|logo-spartanburg-chamber-of-commerce|logo-prac|logo-eric-compton-foundation|GAF-logo|ShingleMaster-PREMIER|nextdoor-|faith-family)/,
      idPrefix: 'badge', sec: 'trust-badges',
      note: 'Certification/award/community-affiliation badge. Not a fact we can verify — TODO(fact) placeholder chip per D-14, listed in docs/facts-needed.md.' },
    { match: /^(footer-bg-|postscript-contact-bg-|section-\d+-(bg|transition|content-box-bg|top-image|bottom-image)|Section-\d+-BG|hero-bg-|Testimonial-BG|Page-Title-BG|roofing-city_)/,
      idPrefix: 'bg', sec: 'decorative',
      note: "Decorative section background photo/graphic (incl. wave/transition dividers) — this is their art direction, not ours to reuse. Neutral placeholder now; real photo commissioned in Prompt 10." },
    { match: /^cta-/, idPrefix: 'cta-tile', sec: 'services-grid',
      note: 'Service-category tile photo behind a CTA card.' },
  ],
  sharedSlots: { logo: true, favicon: true, 'icon-close': true },

  // --- Prompt 3: content divergence ----------------------------------------
  // Exempt from n-gram/trigram stripping so they can never manufacture a shared n-gram
  // or inflate overlap between a roofing site's copy and a garage-door site's copy.
  industryAllowlist: [
    'garage door', 'torsion spring', 'extension spring', 'opener', 'cable', 'roller',
    'track', 'panel', 'off-track', 'remote', 'keypad', 'sensor', 'weather seal',
    'residential', 'commercial', 'same-day', 'free estimate', 'repair', 'installation',
    'replacement',
  ],
  // Sections where a length-parity percentage against the reference would be
  // meaningless or actively misleading — always reported EXEMPT, never PASS/FAIL. See
  // docs/content-divergence.md for the full reasoning per row.
  lengthExempt: {
    '/about::intro-body':
      "reference /about-us/ segments as header+footer chrome only under our sectionCandidates (segMode: fallback) -- the real body content isn't isolated as its own band, so there's no reliable reference length to size against. Sized to about-page convention instead.",
    '/services::symptom-prompt':
      'reference band (s01) carries no paragraph/list text -- icons and short labels only, bodyChars=0. No text length to size against.',
    '/services::services-list':
      'reference band (s03) is a widget-driven list the probe cannot cleanly separate from surrounding chrome; sized to a working symptom-first services page instead.',
    '/contact::info-band':
      'reference band (s02) carries no paragraph/list text -- icon/hours chips only, bodyChars=0. A percentage delta against a zero-char baseline is undefined.',
    '/contact::map':
      'reference band (s03) is five Google Maps iframes with no body copy -- the D-02 city-grid pattern being deleted. Not a text-length comparison; ours is one coords-only embed per D-07/D-08.',
  },
};
