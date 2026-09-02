// Executable assertions for the seven bug fixes this harness exists to protect.
// Synthetic fixtures only — small hand-built meta objects and a tiny local HTML fixture
// served via page.setContent(). NOT a live site, NOT Atlas capture files.
//   node test/selftest.mjs
import { chromium } from 'playwright';
import { segmentSections, PROBE, evalWithSegmentation } from '../src/probe.mjs';
import {
  structuralDiff, shadowGeometry, borderStyleOf, tokenViolations,
  pairSections, buildClassResolver,
} from '../src/diff.mjs';

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { console.log(`PASS  ${name}`); pass++; }
  else { console.log(`FAIL  ${name}${detail ? '  -- ' + detail : ''}`); fail++; }
}

// A minimal cfg — only the fields segmentSections / PROBE actually read.
const cfg = {
  sectionCandidates: ['main > section', 'section'],
  chromeSelectors: ['header', 'footer'],       // EXACT selectors only — see defect #1
  identityAttr: 'data-section',
  minBandHeight: 8,
  chromeArtifact: { h: 60, w: 120 },
  ctaSelector: 'button, a[href^="tel:"]',
  navToggleSelector: 'button[aria-controls]',
};

// ---------------------------------------------------------------------------------------
// Defect #1 — chrome-set construction must use EXACT selectors, never `[class*=...]`, and
// must filter out document.body/documentElement before the containment dedup. A substring
// matcher on Atlas matched <body class="pb-callbar">, which pulled BODY into the chrome
// set; containment-dedup then deleted HEADER and FOOTER because BODY contains them.
async function testDefect1(browser) {
  const page = await browser.newPage();
  await page.setContent(`
    <body class="pb-callbar">
      <header style="height:80px">HEADER</header>
      <main>
        <section style="height:400px">A</section>
        <section style="height:400px">B</section>
      </main>
      <footer style="height:80px">FOOTER</footer>
    </body>`);
  const { tags, segMode } = await evalWithSegmentation(page, (cfg, segmentSections) => {
    const { nodes, segMode } = segmentSections(cfg);
    return { tags: nodes.map((n) => n.tagName.toLowerCase()), segMode };
  }, cfg);
  await page.close();
  check(
    'defect #1: <body class="pb-callbar"> does not delete HEADER/FOOTER from the chrome set',
    tags.includes('header') && tags.includes('footer'),
    `segMode=${segMode} tags=${JSON.stringify(tags)}`
  );
}

// ---------------------------------------------------------------------------------------
// Defect #2 — pairSections() PASS 1 must pair on DECLARED IDENTITY, not position. A
// reordered build (Prompt 3 deliberately moves four bands) must still pair correctly.
function testDefect2() {
  const refMeta = {
    page: { scrollHeight: 900 },
    sections: [
      { idx: 0, id: 's00-hero', box: { docTop: 0, h: 300 } },
      { idx: 1, id: 's01-services', box: { docTop: 300, h: 300 } },
      { idx: 2, id: 's02-cta', box: { docTop: 600, h: 300 } },
    ],
  };
  // Reordered on purpose: CTA first, hero second, services third — position join would
  // pair ref hero -> ours[0] (which is actually CTA). Identity join must not.
  const ourMeta = {
    page: { scrollHeight: 900 },
    sections: [
      { idx: 0, id: 's00-s02-cta-book-now', box: { docTop: 0, h: 300 } },
      { idx: 1, id: 's01-s00-hero-welcome', box: { docTop: 300, h: 300 } },
      { idx: 2, id: 's02-s01-services-list', box: { docTop: 600, h: 300 } },
    ],
  };
  const pairs = pairSections(refMeta, ourMeta, null);
  const byRefId = Object.fromEntries(pairs.map((p) => [p.ref.id, p]));
  check('defect #2: hero pairs to its own declared identity despite reordering',
    byRefId['s00-hero'].ours.id === 's01-s00-hero-welcome' && byRefId['s00-hero'].pairedVia === 'id',
    JSON.stringify(byRefId['s00-hero']));
  check('defect #2: services pairs to its own declared identity despite reordering',
    byRefId['s01-services'].ours.id === 's02-s01-services-list' && byRefId['s01-services'].pairedVia === 'id',
    JSON.stringify(byRefId['s01-services']));
  check('defect #2: cta pairs to its own declared identity despite reordering',
    byRefId['s02-cta'].ours.id === 's00-s02-cta-book-now' && byRefId['s02-cta'].pairedVia === 'id',
    JSON.stringify(byRefId['s02-cta']));
}

// ---------------------------------------------------------------------------------------
// Defect #3 — a band that splits at a narrower breakpoint must still resolve to its
// CANONICAL id (heading-match pass, heaviest band first), and a genuinely unpaired
// section must come back with ours:null (never a fabricated 100).
function testDefect3() {
  const refMetaCanonical = {
    page: { scrollHeight: 900 },
    sections: [
      { idx: 0, id: 's00-a', headingText: 'Section A', box: { docTop: 0, h: 300 }, textChars: 400 },
      { idx: 1, id: 's01-b', headingText: 'Section B', box: { docTop: 300, h: 300 }, textChars: 400 },
      { idx: 2, id: 's02-c', headingText: 'Section C', box: { docTop: 600, h: 300 }, textChars: 400 },
    ],
  };
  // At mobile, band A splits into a thin stub (no heading, low weight) followed by the
  // real content band (heading intact, high weight).
  const refMetaMobile = {
    page: { scrollHeight: 1100 },
    sections: [
      { idx: 0, id: 's00-a-stub', headingText: '', box: { docTop: 0, h: 40 }, textChars: 5 },
      { idx: 1, id: 's01-a-real', headingText: 'Section A', box: { docTop: 40, h: 360 }, textChars: 400 },
      { idx: 2, id: 's02-b', headingText: 'Section B', box: { docTop: 400, h: 300 }, textChars: 400 },
      { idx: 3, id: 's03-c', headingText: 'Section C', box: { docTop: 700, h: 300 }, textChars: 400 },
    ],
  };
  const resolve = buildClassResolver({}, '/', refMetaMobile, refMetaCanonical);
  const realA = resolve(refMetaMobile.sections[1]);
  check('defect #3: the substantive split band claims the canonical id via heading match',
    realA.canonical === 's00-a' && realA.via === 'heading',
    JSON.stringify(realA));

  // Genuinely unpaired: our build has fewer sections than the reference at this bp.
  const ourMetaShort = {
    page: { scrollHeight: 700 },
    sections: [
      { idx: 0, id: 's00-s00-a-x', box: { docTop: 0, h: 350 } },
      { idx: 1, id: 's01-s01-b-x', box: { docTop: 350, h: 350 } },
      // no counterpart for 's02-c'
    ],
  };
  const pairs = pairSections(refMetaCanonical, ourMetaShort, (r) => r.id);
  const cPair = pairs.find((p) => p.ref.id === 's02-c');
  check('defect #3: a genuinely unpaired section reports ours=null (never a fake 100)',
    cPair.ours === null && cPair.pairedVia === 'unpaired',
    JSON.stringify(cPair));
}

// ---------------------------------------------------------------------------------------
// Defect #4 — token conformance: a conformant set is 0 violations, a wrong one is >0, and
// font-weight 400 must NOT be run through normLength (or it becomes "400px" and never
// matches a bare weight token like "400").
function testDefect4() {
  const tokens = {
    found: true,
    vals: {
      color: new Set(['rgb(255, 255, 255)', 'rgb(17, 17, 17)']),
      size: new Set(['16px']),
      weight: new Set(['400', '700']),
      radius: new Set(['4px']),
      shadow: new Set(),
      space: new Set(),
    },
  };
  const cfg2 = { rootFontPx: 16 };
  const conformant = {
    appearance: {
      color: 'rgb(17, 17, 17)', backgroundColor: 'rgb(255, 255, 255)', borderColor: 'none',
      fontSize: 16, fontWeight: '400', borderRadius: '4px', boxShadow: 'none',
    },
  };
  const r1 = tokenViolations(conformant, tokens, cfg2);
  check('defect #4: a conformant section yields 0 token violations', r1.violations === 0, JSON.stringify(r1));

  const nonconformant = { appearance: { ...conformant.appearance, color: 'rgb(1, 2, 3)' } };
  const r2 = tokenViolations(nonconformant, tokens, cfg2);
  check('defect #4: a wrong colour yields > 0 token violations', r2.violations > 0, JSON.stringify(r2));

  // The bug: weight run through normLength turns "400" into "400px", which never matches
  // a bare weight token set containing "400". Assert the CONFORMANT case (r1) truly has
  // no weight violation specifically.
  const weightViol = r1.items.find((i) => i.kind === 'weight');
  check('defect #4: font-weight 400 is not turned into "400px"', !weightViol, JSON.stringify(weightViol));
}

// ---------------------------------------------------------------------------------------
// Defect #5 — identity comparison is 0%, an empty-ring box-shadow normalises to 'none',
// border-style at zero width normalises to 'none', and a display:none control is excluded
// from listCounts.
function testDefect5Structural() {
  const sec = {
    box: { w: 400, h: 200 },
    appearance: {
      paddingTop: 10, paddingBottom: 10, paddingLeft: 10, paddingRight: 10,
      fontSize: 16, fontWeight: '400', letterSpacing: 0, lineHeight: 24,
      fontFamily: 'Inter, sans-serif', display: 'flex', textAlign: 'left',
      borderRadius: '4px', boxShadow: 'none', gridTemplateColumns: 'none', gap: '8px',
      flexDirection: 'row', textTransform: 'none',
      borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0,
      borderStyle: 'solid', overflow: 'visible', position: 'static',
    },
    innerGrid: [], listCounts: { cards: 2, buttons: 1 },
  };
  const identical = structuralDiff(sec, sec);
  check('defect #5: identity comparison yields 0% structural deviation', identical.structPct === 0, JSON.stringify(identical.structPct));

  const emptyRing = shadowGeometry('0px 0px 0px 0px rgba(0, 0, 0, 0), 0px 0px 0px 0px rgba(0, 0, 0, 0)');
  check('defect #5: an empty-ring box-shadow normalises to "none"', emptyRing === 'none', emptyRing);

  const zeroWidthBorder = borderStyleOf({ appearance: { borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, borderRightWidth: 0, borderStyle: 'solid' } });
  check('defect #5: border-style at zero width normalises to "none"', zeroWidthBorder === 'none', zeroWidthBorder);
}

async function testDefect5ListCounts(browser) {
  const page = await browser.newPage();
  await page.setContent(`
    <body>
      <header style="height:80px">HEADER</header>
      <main>
        <section style="height:400px" data-section="s00-buttons">
          <button>Visible one</button>
          <button>Visible two</button>
          <button style="display:none">Hidden control</button>
        </section>
        <section style="height:400px" data-section="s01-filler">filler band</section>
      </main>
      <footer style="height:80px">FOOTER</footer>
    </body>`);
  const data = await evalWithSegmentation(page, PROBE, cfg);
  await page.close();
  const found = data.sections.find((s) => /buttons/.test(s.id));
  check('defect #5: a display:none control is excluded from listCounts',
    !!found && found.listCounts.buttons === 2,
    JSON.stringify(found ? found.listCounts : data.sections.map((s) => s.id)));
}

async function main() {
  const browser = await chromium.launch();
  await testDefect1(browser);
  testDefect2();
  testDefect3();
  testDefect4();
  testDefect5Structural();
  await testDefect5ListCounts(browser);
  await browser.close();

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exitCode = 1;
}

main();
