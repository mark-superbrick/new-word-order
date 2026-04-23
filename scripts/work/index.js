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
  

  // Featured image scale: zoomed in at top, scales down as user scrolls.
  function animateFeaturedImage(container) {
    whenGsapReady(function () {
      var gsap = window.gsap;
      var root = container || document;
      var image = root.querySelector('[data-featured-image]');
      if (!image || !ENABLE) return;

      gsap.set(image, { scale: 1.2 });

      gsap.to(image, {
        scale: 0.9,
        ease: 'none',
        scrollTrigger: {
          trigger: image,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
  }

  window.animateFeaturedImage = animateFeaturedImage;

})();
