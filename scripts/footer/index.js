
function initFooterParallax() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;
  const ENABLE = true;  // <-- master toggle for hero scroll animations; set to false to disable all related code, including ScrollTrigger creation and entry animation


  // Ensure GSAP + ScrollTrigger are available before proceeding.
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Retry shortly if scripts haven't loaded yet.
    setTimeout(initFooterParallax, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const parallaxSections = document.querySelectorAll('[data-footer-parallax]');
  if (!parallaxSections || parallaxSections.length === 0 || !ENABLE) return;

  parallaxSections.forEach(el => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'clamp(top bottom)',
        end: 'clamp(top top)',
        scrub: true
      }
    });
  
    const inner = el.querySelector('[data-footer-parallax-inner]');
    const dark  = el.querySelector('[data-footer-parallax-dark]');
  
    if (inner) {
      tl.from(inner, {
        yPercent: -25,
        ease: 'linear'
      });
    }
  
    if (dark) {
      tl.from(dark, {
        opacity: 0.5,
        ease: 'linear'
      }, '<');
    }
  });
}


document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready.then(() => {
    initFooterParallax();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
});