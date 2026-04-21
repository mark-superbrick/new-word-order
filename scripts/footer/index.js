(function() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;
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


  // Run on initial load
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    // small timeout to let other initialisation complete
    setTimeout(function(){ initFooterParallax(document); }, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ initFooterParallax(document); }, 60);
    });
  }

  // Hook into Barba if present so animations run after page enter
  function attachBarbaHook(){
    if(window.barba && window.barba.hooks){
      // afterEnter gives us access to the new container
      window.barba.hooks.afterEnter(function(data){
        // animate items within the new container
        initFooterParallax(data.next.container || document);
      });
      return true;
    }
    return false;
  }

  if(!attachBarbaHook()){
    // If Barba not ready yet, poll until available and then attach
    var poll = setInterval(function(){
      if(attachBarbaHook()){
        clearInterval(poll);
      }
    }, 50);
  }

})();
