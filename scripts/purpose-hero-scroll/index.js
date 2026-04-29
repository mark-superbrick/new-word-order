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

  // Wait for GSAP + ScrollTrigger, then refresh before calling cb.
  // Two rAFs ensure layout is fully painted before trigger positions are calculated.

  // Hero entry + scroll animations
  function initPurposeHeroAnimations(container) {
    const instances = [];
    
    whenGsapReady(function(){
      var gsap = window.gsap;

      var root = container || document;
      const heroMain = root.querySelector(".purpose_hero_wrap");
      if (!heroMain || heroMain.length === 0 ||  !ENABLE) return;

      const heroImg = heroMain.querySelector('img');
      const background = heroMain.querySelector(".background_overlay");
      const spark = heroMain.querySelector(".home_hero_spark");
      const content = heroMain.querySelector(".home_hero_content");
      // Fallback: look for any element with a data-number attribute inside hero
      const mediaOverlay = heroMain.querySelector(".media_overlay");
      // Promote scrubbed elements to compositor layers before animation starts —
      // without this, every scroll tick forces a repaint of the entire home_hero_wrap.
      // if (spark) spark.style.willChange = 'transform, opacity';
      if (spark) spark.style.transform = 'translateZ(0)';
      // if (content) content.style.willChange = 'transform, opacity';
      if (content) content.style.transform = 'translateZ(0)';

      // Ensure initial states
      if (background) gsap.set(background, { autoAlpha: 0 });
      if (spark) gsap.set(spark, { scale: 5, transformOrigin: "50% 50%" });
      if (content) gsap.set(content, { xPercent: 100, autoAlpha: 1 });
      if (mediaOverlay && mediaOverlay.dataset)
        mediaOverlay.setAttribute(
          "data-number",
          mediaOverlay.dataset.number || "0",
        );

      // Entry animation — runs once on load, independent of scroll.
      const entry = gsap.timeline({ defaults: { duration: 1, ease: "power3.out" } });
      entry.to(background || {}, { autoAlpha: 1 }, 0);
      entry.to(spark || {}, { scale: 3, transformOrigin: "50% 50%" }, 0);
      entry.to(content || {}, { xPercent: 0 }, 0.05);

      // Hero scroll-scrubbed timeline — created IMMEDIATELY (not inside entry.call).
      // Uses .fromTo() with the post-entry state as the "from" so the scrub
      // picks up cleanly where the entry leaves off, even though it's created
      // before the entry has visibly played.
      // let ctx = gsap.context(() => {
        if (heroImg.complete && heroImg.naturalWidth !== 0) {
          // Image already loaded
          heroTL();
        } else {
          // Wait for image to load
          heroImg.addEventListener("load", heroTL, { once: true });
        }


        function heroTL() {
          const totalScroll = window.innerHeight * 2;
          // Dirty-check: avoid setAttribute DOM write when value hasn't changed
          let lastValue = -1;
          const scrollTl = gsap.timeline({
            scrollTrigger: {
              trigger: heroMain,
              start: "top top",
              end: () => `+=${totalScroll}`,
              // end: "bottom top",
              scrub: true,
              pin: true,
              pinSpacing: false,         // <-- was false; now reserves scroll distance so alt_wrap no longer overlaps
              invalidateOnRefresh: true,
              markers: DEBUG,
              id: "main",
              refreshPriority: 1,
              onUpdate(self) {
                const progress = Math.max(0, Math.min(1, self.progress || 0));
                const value = Math.round(progress * 100);
                if (value === lastValue) return;
                lastValue = value;
                if (mediaOverlay && mediaOverlay.setAttribute) mediaOverlay.setAttribute("data-number", String(value));
              },
            },
          });
          if (spark) {
            scrollTl.fromTo(spark,
              { scale: 3, rotation: 0 },
              { scale: 0.1, rotation: 180, opacity: 0, transformOrigin: "50% 50%", ease: "none" },
              0
            );
          }
          if (content) {
            scrollTl.fromTo(content,
              { xPercent: 0, opacity: 1 },
              { xPercent: -30, opacity: 0, ease: "none" },
              0
            );
          }
          // Refresh handled by the outer requestAnimationFrame in DOMContentLoaded
        }
      // });
    });
  }




  window.initPurposeHeroAnimations = initPurposeHeroAnimations;

})();
