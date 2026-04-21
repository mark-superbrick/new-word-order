(function() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;
  const ENABLE = false;
  
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
  
  //Hero items entrance animation: fade in from bottom + blur to neutral, staggered.
  function animateHeroItems(container){
    var gsap = window.gsap;
    const instances = [];
        
    whenGsapReady(function(){

      var root = container || document;
      var items = root.querySelectorAll('[data-hero-item]');
      if(!items || items.length === 0 || !ENABLE) return;

      // Disable blur on tablet and smaller — blur is expensive to paint and visually distracting
      // at smaller sizes. Webflow tablet breakpoint is 991px.
      const reduceBlur = window.matchMedia('(max-width: 991px)').matches;
      const blurFull   = reduceBlur ? 'blur(0px)' : 'blur(40px)'; 

      // Ensure starting visual state
      gsap.set(items, { yPercent: 100, autoAlpha: 0, filter: blurFull });

      // Animate into place, staggered
      gsap.to(items, {
        yPercent: 0,
        autoAlpha: 1,
        filter: 'blur(0px)',
        duration: 0.9,
        stagger: 0.12,
        ease: 'power3.out'
      });
    });
  }

  // Run on initial load
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    // small timeout to let other initialisation complete
    setTimeout(function(){ animateHeroItems(document); }, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ animateHeroItems(document); }, 60);
    });
  }

  // Hook into Barba if present so animations run after page enter
  function attachBarbaHook(){
    if(window.barba && window.barba.hooks){
      // afterEnter gives us access to the new container
      window.barba.hooks.afterEnter(function(data){
        // animate items within the new container
        animateHeroItems(data.next.container || document);
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
