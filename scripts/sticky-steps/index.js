/**
 * sticky-steps
 *
 * Two modes on the same markup, driven by attributes on [data-sticky-steps-init]:
 *
 * 1. Anchor mode (default, unchanged): each [data-sticky-steps-item] has a
 *    [data-sticky-steps-anchor]; a ScrollTrigger toggles
 *    data-sticky-steps-item-status (before|active|after) and CSS does the rest.
 *
 * 2. Scroll-jack mode (opt-in): add data-sticky-steps-scroll-jacking to the
 *    container. The section pins, all items are grid-stacked in one cell so the
 *    text + image positions stay identical, and a snap-per-step timeline
 *    crossfades each step (outgoing copy moves up + fades, image crossfades,
 *    incoming copy fades up into place).
 *
 * Attributes (on [data-sticky-steps-init]):
 *   data-sticky-steps-scroll-jacking="mobile|desktop|all"  where to scroll-jack.
 *       The non-matching viewport keeps anchor mode. Empty value = "all".
 *   data-sticky-steps-breakpoint="767"   px split between mobile/desktop (default 767).
 *   data-sticky-steps-start="top top"    ScrollTrigger start for the pin. Default
 *       offsets the pin down by the .mega-nav height so the fixed nav never covers
 *       the pinned content; setting this attribute overrides that entirely.
 *
 * Per-item fade targets (first match wins):
 *   copy  -> [data-sticky-steps-copy]  || [data-sticky-steps-anchor]
 *   image -> [data-sticky-steps-image] || .sticky-steps__media || .sticky-steps__visual
 *
 * Staging:    https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/sticky-steps/index.js
 * Production: https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@main/scripts/sticky-steps/index.js
 */
(function() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  // let DEBUG = mainDomain == 'webflow';
  let DEBUG = false;
  const ENABLE = true;

  // Scroll-jack tunables
  const DEFAULT_BREAKPOINT = 767; // px split between mobile/desktop
  const COPY_OUT_Y = -40;         // outgoing copy travels up this many px while fading out
  const COPY_IN_Y = 24;           // incoming copy starts this many px below, settles to 0

  // Utility to wait for GSAP + ScrollTrigger if not loaded yet
  function whenGsapReady(cb){
    if(window.gsap && window.ScrollTrigger){
      return cb();
    }
    var t = setInterval(function(){
      if(window.gsap && window.ScrollTrigger){
        clearInterval(t);
        cb();
      }
    }, 50);
  }

  // Single matchMedia instance per init. Reverting it kills every ScrollTrigger,
  // timeline and inline style created inside its callbacks — so a Barba re-init or
  // a viewport change cleans up without leaking triggers from the previous DOM.
  var mm = null;

  function getCopy(item){
    return item.querySelector('[data-sticky-steps-copy]') ||
           item.querySelector('[data-sticky-steps-anchor]');
  }

  function getImage(item){
    return item.querySelector('[data-sticky-steps-image]') ||
           item.querySelector('.sticky-steps__media') ||
           item.querySelector('.sticky-steps__visual');
  }

  // Height of the fixed nav bar — used to offset the pin so the nav doesn't
  // cover the pinned content. Re-queried so it survives Barba DOM swaps.
  function getNavOffset(){
    const el = document.querySelector('.mega-nav');
    return el ? el.offsetHeight : 0;
  }

  // ── Mode 1: existing anchor-driven status toggling ───────────────────────────
  function setupAnchorLogic(contain){
    const ST = window.ScrollTrigger;
    const items = [...contain.querySelectorAll('[data-sticky-steps-item]')];
    if (!items.length) return;

    function setActiveStep(activeIndex) {
      items.forEach((item, index) => {
        let status = "active";
        if (index < activeIndex) status = "before";
        if (index > activeIndex) status = "after";
        item.setAttribute("data-sticky-steps-item-status", status);
      });
    }

    items.forEach((item, index) => {
      const anchor = item.querySelector("[data-sticky-steps-anchor]");
      if (!anchor) return;

      ST.create({
        trigger: anchor,
        start: "top center",
        onEnter: () => setActiveStep(index),
        onEnterBack: () => setActiveStep(index)
      });
    });

    setActiveStep(0);
  }

  // ── Mode 2: pinned, snap-per-step crossfade ──────────────────────────────────
  function setupScrollJack(contain){
    const gsap = window.gsap;
    const items = [...contain.querySelectorAll('[data-sticky-steps-item]')];
    if (items.length < 2) { setupAnchorLogic(contain); return; }

    const list = items[0].parentElement;

    // CSS hook + neutralise any status-based hiding so GSAP fully owns visibility.
    contain.setAttribute('data-sticky-steps-mode', 'scroll-jacking');
    items.forEach(item => item.setAttribute('data-sticky-steps-item-status', 'active'));

    // Stack every item in a single grid cell: positions stay identical, list
    // auto-sizes to the tallest item, items are top-aligned (image stays put).
    gsap.set(list, { display: 'grid', alignItems: 'start' });
    items.forEach(item => gsap.set(item, { gridArea: '1 / 1' }));

    // Only the first step visible to start.
    items.forEach((item, i) => {
      gsap.set(getImage(item), { autoAlpha: i === 0 ? 1 : 0 });
      gsap.set(getCopy(item),  { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : COPY_IN_Y });
    });

    // Pin starts offset down by the nav-bar height so the fixed nav never covers
    // the pinned content. A custom data-sticky-steps-start fully overrides this.
    const customStart = contain.getAttribute('data-sticky-steps-start');

    const tl = gsap.timeline({
      defaults: { duration: 1, ease: 'none' },
      scrollTrigger: {
        trigger: contain,
        start: customStart || (() => 'top top+=' + getNavOffset()),
        end: () => '+=' + (window.innerHeight * (items.length - 1)),
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        // snap: {
        //   snapTo: 1 / (items.length - 1),
        //   duration: { min: 0.2, max: 0.5 },
        //   ease: 'power1.inOut'
        // }
      }
    });

    // Each transition is one timeline unit. The image crossfades across the whole
    // unit, but the copy is sequenced: outgoing copy fully fades out in the first
    // half, incoming copy fades in during the second half — so the text never overlaps.
    for (let i = 1; i < items.length; i++) {
      const prevCopy  = getCopy(items[i - 1]);
      const prevImage = getImage(items[i - 1]);
      const curCopy   = getCopy(items[i]);
      const curImage  = getImage(items[i]);

      const segStart = i - 1;
      const half = 0.5;

      tl.to(prevImage, { autoAlpha: 0, duration: 1 }, segStart)                        // outgoing image: fade out
        .to(curImage,  { autoAlpha: 1, duration: 1 }, segStart)                        // incoming image: fade in
        .to(prevCopy,  { y: COPY_OUT_Y, autoAlpha: 0, duration: half, ease: 'power2.in' }, segStart)         // outgoing copy: up + fade (first half)
        .fromTo(curCopy, { y: COPY_IN_Y, autoAlpha: 0 },
                         { y: 0, autoAlpha: 1, duration: half, ease: 'power2.out' }, segStart + half);       // incoming copy: fade up (second half)
    }

    if (DEBUG) console.log('[sticky-steps] scroll-jack initialized on ' + items.length + ' step(s)');
  }

  function initStickyStepsBasic(container) {
    whenGsapReady(function(){
      const gsap = window.gsap;

      // Tear down the previous init (Barba navigation / re-run) before rebuilding.
      if (mm) { mm.revert(); mm = null; }

      const containers = document.querySelectorAll("[data-sticky-steps-init]");
      if (!containers.length || !ENABLE) return;

      mm = gsap.matchMedia();

      containers.forEach((contain) => {
        const sjAttr = contain.getAttribute('data-sticky-steps-scroll-jacking');

        // No opt-in → existing anchor behaviour everywhere.
        if (sjAttr === null) {
          mm.add('all', () => { setupAnchorLogic(contain); });
          return;
        }

        const where = (sjAttr || 'all').trim().toLowerCase();
        const bp = parseInt(contain.getAttribute('data-sticky-steps-breakpoint'), 10) || DEFAULT_BREAKPOINT;
        const mobileQ  = '(max-width: ' + bp + 'px)';
        const desktopQ = '(min-width: ' + (bp + 1) + 'px)';

        const withMode = (setupFn) => () => {
          setupFn(contain);
          return () => { contain.removeAttribute('data-sticky-steps-mode'); };
        };

        if (where === 'mobile') {
          mm.add(mobileQ,  withMode(setupScrollJack));
          mm.add(desktopQ, () => { setupAnchorLogic(contain); });
        } else if (where === 'desktop') {
          mm.add(desktopQ, withMode(setupScrollJack));
          mm.add(mobileQ,  () => { setupAnchorLogic(contain); });
        } else if (where === 'all') {
          mm.add('all', withMode(setupScrollJack));
        } else {
          // Unknown value → safe fallback to existing behaviour.
          mm.add('all', () => { setupAnchorLogic(contain); });
        }
      });
    });
  }

  window.initStickyStepsBasic = initStickyStepsBasic;

})();
