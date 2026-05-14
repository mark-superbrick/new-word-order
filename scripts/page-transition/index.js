
// -----------------------------------------
// OSMO PAGE TRANSITION BOILERPLATE
// -----------------------------------------

const host = window.location.host;
const mainDomain = host.split('.')[1];
let DEBUG = mainDomain == 'webflow';
// let DEBUG = false;

gsap.registerPlugin(CustomEase);

history.scrollRestoration = "manual";

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", e => (reducedMotion = e.matches));
rmMQ.addListener?.(e => (reducedMotion = e.matches)); 

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });



// -----------------------------------------
// FUNCTION REGISTRY
// -----------------------------------------

function initOnceFunctions() {
  initLenis();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;
  
  // Runs before the enter animation
  // if (has('[data-something]')) initSomething();
  
}

function reinitFinsweetAttributes() {
  var existing = document.querySelector('script[src*="@finsweet"]');
  if (!existing) return;
  var src = existing.src;
  existing.remove();
  window.fsAttributes = [];
  var script = document.createElement('script');
  script.type = 'module';
  script.src = src;
  document.head.appendChild(script);
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  // Runs after the enter animation completes
  // if (has('[data-something]')) initSomething();

  reinitFinsweetAttributes();

  // Page-specific animations that should run on every page can be called here, or within their own init functions that are called here. For example:
  initPageAnimations();

  // update the current nav item based on URL
  updateCurrentNav();
}




// -----------------------------------------
// PAGE TRANSITIONS
// -----------------------------------------

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionDark = transitionWrap.querySelector("[data-transition-dark]");

  const tl = gsap.timeline({
    onComplete: () => {
      current.remove(); 
    }
  })
  
  CustomEase.create("parallax", "0.7, 0.05, 0.13, 1");
  
  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    return tl.set(current, { autoAlpha: 0 });
  }
  
  tl.set(transitionWrap, {
    zIndex: 2
  });
  
  tl.fromTo(transitionDark, {
    autoAlpha: 0
  },{
    autoAlpha: 0.8,
    duration: 1.2,
    ease: "parallax"
  }, 0);
  
  tl.fromTo(current,{
    y: "0vh"
  },{
    y: "-25vh",
    duration: 1.2,
    ease: "parallax",
  }, 0);
  
  tl.set(transitionDark, {
    autoAlpha: 0,
  });

  return tl;
}

function runPageEnterAnimation(next){
  const tl = gsap.timeline();
  
  if (reducedMotion) {
    // Immediate swap behavior if user prefers reduced motion
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady")
    tl.call(resetPage, [next], "pageReady");
    return new Promise(resolve => tl.call(resolve, null, "pageReady"));
  }
  
  tl.add("startEnter", 0);
  
  tl.set(next, {
    zIndex: 3
  });
  
  tl.fromTo(next, {
    y: "100vh"
  }, {
    y: "0vh",
    duration: 1.2,
    clearProps: "all",
    ease: "parallax"
  }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");

  return new Promise(resolve => {
    tl.call(resolve, null, "pageReady");
  });
}

// -----------------------------------------
// BARBA HOOKS + INIT
// -----------------------------------------

barba.hooks.beforeEnter(data => {
  // Position new container on top
  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });
  
  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }
  
  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
});

barba.hooks.afterLeave(() => {
  if(hasScrollTrigger){
    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
  }
});

barba.hooks.enter(data => {
  initBarbaNavUpdate(data);
})

barba.hooks.afterEnter(data => {
  initAfterEnterFunctions(data.next.container);
  
  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  // Force layout recalc after resetPage clears position:fixed, then refresh triggers
  data.next.container.getBoundingClientRect();
  if (hasScrollTrigger) ScrollTrigger.refresh();



});

barba.init({
  debug: DEBUG, // Set to 'false' in production
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,
      
      // First load
      async once(data) {
        initOnceFunctions();

        return runPageOnceAnimation(data.next.container);
      },

      // Current page leaves
      async leave(data) {
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      // New page enters
      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      }
    }
  ],
});



// -----------------------------------------
// GENERIC + HELPERS
// -----------------------------------------

const themeConfig = {
  light: {
    nav: "dark",
    transition: "light"
  },
  dark: {
    nav: "light",
    transition: "dark"
  }
};

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;
  
  document.body.dataset.pageTheme = pageTheme;
  const transitionEl = document.querySelector('[data-theme-transition]');
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector('[data-theme-nav]');
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function initLenis() {
  if (lenis) return; // already created
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.165,
    wheelMultiplier: 1.25,
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function resetPage(container){
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });
  
  if(hasLenis){
    lenis.resize();
    lenis.start();    
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth,
    timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  var tpl = document.createElement('template');
  tpl.innerHTML = data.next.html.trim();
  var nextNodes = tpl.content.querySelectorAll('[data-barba-update]');
  var currentNodes = document.querySelectorAll('nav [data-barba-update]');

  currentNodes.forEach(function (curr, index) {
    var next = nextNodes[index];
    if (!next) return;

    // Aria-current sync
    var newStatus = next.getAttribute('aria-current');
    if (newStatus !== null) {
      curr.setAttribute('aria-current', newStatus);
    } else {
      curr.removeAttribute('aria-current');
    }

    // Class list sync
    var newClassList = next.getAttribute('class') || '';
    curr.setAttribute('class', newClassList);
  });
}



// -----------------------------------------
// YOUR FUNCTIONS GO BELOW HERE
// -----------------------------------------

function initPageAnimations() {
  if (has('.home_hero_wrap') && window.initHeroAnimations) window.initHeroAnimations(nextPage);
  if (has('.home_hero_alt_wrap') && window.initHeroAltAnimations) window.initHeroAltAnimations(nextPage);
  if (has('[data-text-scroll-wrap]') && window.initTextScroll) window.initTextScroll(nextPage);
  if (has('[data-text-bg-scroll-wrap]') && window.initTextBackgroundScroll) window.initTextBackgroundScroll(nextPage);
  if (has('[data-rotate-collection-target]') && window.initRotateScrollDirection) window.initRotateScrollDirection(nextPage);
  if (has('[data-footer-parallax]') && window.initFooterParallax) window.initFooterParallax(nextPage);
  if (has('[data-hero-item]') && window.animateHeroItems) window.animateHeroItems(nextPage);
  if (has('[data-featured-image]') && window.animateFeaturedImage) window.animateFeaturedImage(nextPage);
  if (has('.is-marquee-swiper') && window.initMarqueeSwiperSlider) window.initMarqueeSwiperSlider(nextPage);
  if (has('.purpose_hero_wrap') && window.initPurposeHeroAnimations) window.initPurposeHeroAnimations(nextPage);
  if (has('.purpose_hero_alt_wrap') && window.initPurposeHeroAltAnimations) window.initPurposeHeroAltAnimations(nextPage);
  if (has('[data-sticky-steps-init]') && window.initStickyStepsBasic) window.initStickyStepsBasic(nextPage);
  if (has('[data-filter-scroll]') && window.initFilterScroll) window.initFilterScroll(nextPage);
  if (has('.mwg_effect036') && window.initStackingImageHover) window.initStackingImageHover(nextPage);
  if (has('[data-bg-color], [data-text-color]') && window.initScrollColors) window.initScrollColors(nextPage);
  if (has('[data-theme-section]') && window.initCheckSectionThemeScroll) window.initCheckSectionThemeScroll(nextPage);
  if (has('[data-card]') && window.initCardAnimation) window.initCardAnimation(nextPage);
  if (has('[data-marquee-scroll-direction-target]') && window.initMarqueeScrollDirection) window.initMarqueeScrollDirection(nextPage);
}

// update the current nav item based on URL
function updateCurrentNav() {
  // 1. Get current URL path
  const currentPath = window.location.pathname;
  if(DEBUG) console.log('[updateCurrentNav] currentPath:', currentPath);

  // 2. Remove w--current from all links
  document.querySelectorAll('.mega-nav__bar-link').forEach(link => {
    link.classList.remove('w--current');
  });

  // 3. Add w--current to the link matching the current URL
  document.querySelectorAll('.mega-nav__bar-link').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('w--current');
    }
  });
}
