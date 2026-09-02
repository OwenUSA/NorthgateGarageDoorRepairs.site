// The in-page probe. Runs in the browser context; returns plain JSON.
// One source of truth for BOTH sides (reference and ours) so metrics are comparable.
//
// Site-specific selectors (section candidates, chrome, icon fonts, identity attribute...)
// come from cfg (see config.mjs) and are passed in as an argument — nothing here is
// hardcoded to any one reference's markup.
//
// IMPORTANT — Playwright mechanics: page.evaluate(fn, arg) serializes fn.toString() only.
// It does NOT carry Node-side closures, so a function that calls another top-level function
// by name only works in-page if that other function's source is stitched in alongside it.
// segmentSections() is the ONE section-segmentation implementation in this codebase; every
// caller (PROBE here, and assets.mjs / refcopy.mjs's own in-page extractors) shares it via
// evalWithSegmentation() below rather than re-implementing it. Do not add a second copy.

// ---- section segmentation --------------------------------------------------------------
// A "section" is a top-level banded block. We take the outermost wrapper in the page flow,
// so a page-builder tree and a hand-rolled Next tree segment alike. cfg.sectionCandidates
// is tried in order; the first selector that yields >=2 outer bands wins.
export const segmentSections = (cfg) => {
  let nodes = [];
  let segMode = 'fallback';
  for (const sel of cfg.sectionCandidates) {
    const hit = Array.from(document.querySelectorAll(sel))
      .filter((n) => { const r = n.getBoundingClientRect(); return r.height > cfg.minBandHeight && r.width > cfg.minBandHeight; });
    const outer = hit.filter((n) => !hit.some((m) => m !== n && m.contains(n)));
    if (outer.length >= 2) { nodes = outer; segMode = sel; break; }
  }
  // Header / footer / sticky call bar are sections in their own right. Any element
  // carrying the identity attribute outside <main> counts too — that is how our own
  // shell declares its bands. BODY and HTML are never sections.
  const main = document.querySelector('main');
  const declaredOutside = Array.from(document.querySelectorAll(`[${cfg.identityAttr}]`))
    .filter((n) => !main || !main.contains(n));
  // Chrome that sits OUTSIDE the main content flow and must still be measured as sections.
  // NOTE: this deliberately does NOT use substring class matching. `[class*=callbar]` used
  // to be here and matched <body class="... pb-callbar ...">, which pulled BODY into the
  // chrome set; the containment dedup below then dropped HEADER and FOOTER because BODY
  // contains them, and dropped BODY because it contains every main > section. Net effect:
  // the header and footer silently vanished from every "ours" capture. cfg.chromeSelectors
  // is validated in config.mjs to hold only exact tag/id/class selectors for this reason.
  const chromeSel = cfg.chromeSelectors.join(', ');
  const chrome = [...new Set([...Array.from(document.querySelectorAll(chromeSel)), ...declaredOutside])]
    .filter((n) => n !== document.body && n !== document.documentElement)
    .filter((n) => { const r = n.getBoundingClientRect(); return r.height > cfg.minBandHeight; });
  const outerChrome = chrome.filter((n) => !chrome.some((m) => m !== n && m.contains(n)));
  for (const c of outerChrome) if (!nodes.some((n) => n === c || n.contains(c) || c.contains(n))) nodes.push(c);

  if (!nodes.length) {
    nodes = Array.from(document.body.children).filter(
      (n) => n.nodeType === 1 && !['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK'].includes(n.tagName)
    );
  }
  // Drop the scroll-to-top pip and other sub-threshold chrome artifacts.
  nodes = nodes.filter((n) => {
    const r = n.getBoundingClientRect();
    return !(r.height < cfg.chromeArtifact.h && r.width < cfg.chromeArtifact.w);
  });
  nodes.sort((a, b) => {
    const A = a.getBoundingClientRect(), B = b.getBoundingClientRect();
    return (A.top + window.scrollY) - (B.top + window.scrollY);
  });
  return { nodes, segMode };
};

// ---- the full probe ----------------------------------------------------------------------
// Signature is (cfg, segmentSections) — see the Playwright note at the top of this file for
// why segmentSections is a parameter rather than a free reference.
export const PROBE = (cfg, segmentSections) => {
  const px = (v) => (v == null ? null : Math.round(parseFloat(v) * 100) / 100);
  const cs = (el) => getComputedStyle(el);

  const { nodes: segNodes, segMode } = segmentSections(cfg);
  let nodes = segNodes;

  const idOf = (el, i) => {
    const explicit = el.id || el.getAttribute(cfg.identityAttr) || el.getAttribute('data-id') || '';
    const h = el.querySelector('h1,h2,h3');
    const txt = (h ? h.textContent : '' || '').trim().toLowerCase().replace(/\s+/g, '-').slice(0, 34);
    let out = 's' + String(i).padStart(2, '0');
    if (explicit) out += '-' + explicit;
    if (txt) out += '-' + txt;
    return out.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').replace(/-+$/, '');
  };

  // ---- appearance: everything a geometry-only audit is blind to -------------
  const appearance = (el) => {
    const s = cs(el);
    return {
      color: s.color, backgroundColor: s.backgroundColor,
      backgroundImage: s.backgroundImage.slice(0, 240),
      backgroundSize: s.backgroundSize, backgroundPosition: s.backgroundPosition,
      fontFamily: s.fontFamily, fontSize: px(s.fontSize), fontWeight: s.fontWeight,
      lineHeight: s.lineHeight === 'normal' ? 'normal' : px(s.lineHeight),
      letterSpacing: s.letterSpacing === 'normal' ? 0 : px(s.letterSpacing),
      textTransform: s.textTransform, opacity: parseFloat(s.opacity),
      borderTopWidth: px(s.borderTopWidth), borderBottomWidth: px(s.borderBottomWidth),
      borderLeftWidth: px(s.borderLeftWidth), borderRightWidth: px(s.borderRightWidth),
      borderColor: s.borderTopColor, borderStyle: s.borderTopStyle,
      borderRadius: s.borderRadius, boxShadow: s.boxShadow.slice(0, 200),
      paddingTop: px(s.paddingTop), paddingBottom: px(s.paddingBottom),
      paddingLeft: px(s.paddingLeft), paddingRight: px(s.paddingRight),
      marginTop: px(s.marginTop), marginBottom: px(s.marginBottom),
      display: s.display, position: s.position, zIndex: s.zIndex, overflow: s.overflow,
      gridTemplateColumns: s.gridTemplateColumns, gap: s.gap,
      flexDirection: s.flexDirection, flexWrap: s.flexWrap,
      alignItems: s.alignItems, justifyContent: s.justifyContent, textAlign: s.textAlign,
    };
  };

  const geometry = (el) => {
    const r = el.getBoundingClientRect();
    const sy = window.scrollY, sx = window.scrollX;
    return {
      x: px(r.left + sx), y: px(r.top + sy), w: px(r.width), h: px(r.height),
      docTop: px(r.top + sy), docBottom: px(r.bottom + sy),
    };
  };

  // Inner grid geometry: the child boxes that define the section's rhythm.
  const innerGrid = (el) => {
    const kids = Array.from(el.querySelectorAll(':scope > *, :scope > * > *'))
      .filter((k) => { const r = k.getBoundingClientRect(); return r.width > 24 && r.height > 24; })
      .slice(0, 24);
    return kids.map((k) => {
      const g = geometry(k);
      return { tag: k.tagName.toLowerCase(), x: g.x, y: g.y, w: g.w, h: g.h };
    });
  };

  const isHidden = (n) => {
    const s = cs(n);
    return s.clip === 'rect(0px, 0px, 0px, 0px)' || s.clipPath === 'inset(100%)' ||
      parseFloat(s.height) <= 1 || s.visibility === 'hidden';
  };

  // ---- headings + split-text signature -------------------------------------
  const headings = Array.from(document.querySelectorAll('h1,h2,h3')).map((h) => {
    const t = (h.textContent || '').trim();
    return {
      tag: h.tagName.toLowerCase(),
      text: t.slice(0, 180),
      chars: t.length,
      spanCount: h.querySelectorAll('span').length,
      splitCount: h.querySelectorAll('[class*=char],[class*=word],[class*=line]').length,
      // a visually-hidden duplicate of the same text = split-library signature
      hiddenDupe: !!Array.from(h.querySelectorAll('*')).find(
        (n) => isHidden(n) && (n.textContent || '').trim() === t && t.length > 0
      ),
      appearance: appearance(h),
      box: geometry(h),
      outerHTML: h.outerHTML.slice(0, 900),
    };
  });

  // ---- state / interactivity inventory -------------------------------------
  const q = (s) => document.querySelectorAll(s).length;
  const state = {
    forms: Array.from(document.querySelectorAll('form')).map((f) => ({
      action: f.getAttribute('action') || '', method: f.method,
      fields: Array.from(f.querySelectorAll('input,select,textarea')).map((i) => ({
        tag: i.tagName.toLowerCase(), type: i.type || null, name: i.name || null,
        required: i.required, placeholder: i.placeholder || null,
      })),
    })),
    navToggles: q(cfg.navToggleSelector),
    // TODO(config): accordion/tab/carousel markers have no dedicated cfg field (they are
    // framework-generic, not tied to one reference's markup); kept as broad, non-framework-
    // specific substring matchers rather than adding fields to config.mjs for a low-signal
    // inventory count.
    accordions: q('details,[class*=accordion],[class*=toggle-title]'),
    tabs: q('[role=tab],[class*=tabs__]'),
    carousels: q('[class*=swiper],[class*=slick],[class*=carousel],[class*=glide],[class*=splide]'),
    videos: q('video'), iframes: q('iframe'),
    stickyEls: Array.from(document.querySelectorAll('header,nav,[class*=sticky],[class*=fixed]'))
      .filter((e) => ['sticky', 'fixed'].includes(cs(e).position))
      .map((e) => ({
        tag: e.tagName.toLowerCase(), cls: (e.className || '').toString().slice(0, 90),
        position: cs(e).position, z: cs(e).zIndex, h: px(e.getBoundingClientRect().height),
      })),
    telLinks: Array.from(document.querySelectorAll('a[href^="tel:"]')).map((a) => a.getAttribute('href')),
    mailtoLinks: Array.from(document.querySelectorAll('a[href^="mailto:"]')).map((a) => a.getAttribute('href')),
    emailInputs: q('input[type=email]'),
    maps: Array.from(document.querySelectorAll('iframe'))
      .map((f) => (f.src || f.getAttribute('data-src') || '').slice(0, 160))
      .filter((s) => /map/i.test(s)),
  };

  // ---- motion signature: scroll-linked, time-driven, or neither? ------------
  const libs = {
    gsap: !!window.gsap,
    ScrollTrigger: !!(window.ScrollTrigger || (window.gsap && window.gsap.ScrollTrigger)),
    lenis: !!(window.Lenis || window.lenis),
    locomotive: !!window.LocomotiveScroll,
    aos: !!window.AOS, wow: !!window.WOW, swiper: !!window.Swiper,
    slick: !!(window.jQuery && window.jQuery.fn && window.jQuery.fn.slick),
    aosAttrs: q('[data-aos]'),
    parallaxAttrs: q('[data-parallax],[class*=parallax],[data-speed]'),
    cssAnimatedEls: Array.from(document.querySelectorAll('*')).filter((e) => {
      const s = cs(e); return s.animationName && s.animationName !== 'none';
    }).length,
    willChangeTransform: Array.from(document.querySelectorAll('*'))
      .filter((e) => /transform/.test(cs(e).willChange)).length,
    inlineOnScroll: !!window.onscroll,
  };

  const sections = nodes.map((el, i) => ({
    idx: i,
    id: idOf(el, i),
    tag: el.tagName.toLowerCase(),
    cls: (el.className || '').toString().slice(0, 140),
    box: geometry(el),
    appearance: appearance(el),
    innerGrid: innerGrid(el),
    headingText: ((el.querySelector('h1,h2,h3') || {}).textContent || '').trim().slice(0, 120),
    textChars: (el.textContent || '').replace(/\s+/g, ' ').trim().length,
    imgs: Array.from(el.querySelectorAll('img')).map((im) => ({
      src: (im.currentSrc || im.src || '').slice(0, 200),
      w: px(im.getBoundingClientRect().width), h: px(im.getBoundingClientRect().height),
      natW: im.naturalWidth, natH: im.naturalHeight,
      fit: cs(im).objectFit, loading: im.loading,
    })),
    listCounts: (() => {
      // Count only what is actually laid out. A display:none control is DOM, not layout,
      // and counting it makes a responsive shell diverge from a reference that hides the
      // same control a different way.
      const vis = (sel) => Array.from(el.querySelectorAll(sel))
        .filter((n) => { const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0; }).length;
      // TODO(config): "card" has no dedicated cfg selector (framework-generic); kept as a
      // broad, non-framework-specific substring matcher.
      return {
        cards: vis('[class*=card],article'),
        links: vis('a'),
        listItems: vis('li'),
        buttons: vis(cfg.ctaSelector),
      };
    })(),
  }));

  return {
    url: location.href,
    title: document.title,
    viewport: { w: window.innerWidth, h: window.innerHeight },
    page: {
      scrollHeight: px(document.documentElement.scrollHeight),
      sectionCount: sections.length,
      segMode,
      bodyBg: cs(document.body).backgroundColor,
      bodyFont: cs(document.body).fontFamily,
      bodyFontSize: px(cs(document.body).fontSize),
      textChars: (document.body.textContent || '').replace(/\s+/g, ' ').trim().length,
    },
    sections, headings, state, libs,
  };
};

// ---- Node-side composition helpers -------------------------------------------------------
// Playwright's page.evaluate(fn, arg) only serializes fn.toString(); it cannot see fn's
// closure over other module-level functions. To let PROBE (and assets.mjs's asset probe,
// and refcopy.mjs's copy extractor) all call the ONE segmentSections implementation, we
// stitch the two function sources into one script and eval it in-page. This is the
// "import and call probe.mjs's segmentation" contract: nobody else re-implements it.
// cfg carries derived, non-serializable members (cfg.refForRoute is a closure, and
// cfg.iconFontFamilies is a RegExp). Playwright throws on the first function it meets, so
// the in-page copy is reduced to structured-cloneable values here. RegExps are re-hydrated
// as {source, flags} because the in-page probes only ever call .test() on them.
function serializableCfg(cfg) {
  const out = {};
  for (const [k, v] of Object.entries(cfg)) {
    if (typeof v === 'function') continue;
    if (v instanceof RegExp) { out[k] = { __regexp: true, source: v.source, flags: v.flags }; continue; }
    out[k] = v;
  }
  return out;
}

export async function evalWithSegmentation(page, fn, cfg) {
  return page.evaluate(
    ({ segSrc, fnSrc, cfg }) => {
      for (const [k, v] of Object.entries(cfg)) {
        if (v && typeof v === 'object' && v.__regexp) cfg[k] = new RegExp(v.source, v.flags);
      }
      // eslint-disable-next-line no-eval -- composing two in-page function sources by design
      const segmentSectionsInPage = (0, eval)(`(${segSrc})`);
      // eslint-disable-next-line no-eval
      const target = (0, eval)(`(${fnSrc})`);
      return target(cfg, segmentSectionsInPage);
    },
    { segSrc: segmentSections.toString(), fnSrc: fn.toString(), cfg: serializableCfg(cfg) }
  );
}

export async function runProbe(page, cfg) {
  return evalWithSegmentation(page, PROBE, cfg);
}
