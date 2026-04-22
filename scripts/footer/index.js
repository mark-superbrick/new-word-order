(function() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  // let DEBUG = mainDomain == 'webflow';
  let DEBUG = false;
  const ENABLE = true;
    
  // Utility to wait for GSAP if not loaded yet
  function whenGsapReady(cb){
    if(window.gsap){
      return cb();
    }
    var t = setInterval(function(){
      if(window.gsap){
        clearInterval(t);
        cb();
      }
    }, 50);
  }

  function initFooterParallax(container) {
    whenGsapReady(function(){
      var gsap = window.gsap;

      var root = container || document;

      const parallaxSections = root.querySelectorAll('[data-footer-parallax]');
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
    });
  }


  window.initFooterParallax = initFooterParallax;

})();
