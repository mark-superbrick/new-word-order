(function() {

  let DEBUG = false;
  const ENABLE = true;

  function whenGsapReady(cb) {
    if (window.gsap) return cb();
    var t = setInterval(function() {
      if (window.gsap) { clearInterval(t); cb(); }
    }, 50);
  }

  function initPurposeHeroAnimations(container) {
    whenGsapReady(function() {
      var gsap = window.gsap;

      var root = container || document;
      const heroMain = root.querySelector(".purpose_hero_wrap");
      if (!heroMain || !ENABLE) return;

      const heroImg = heroMain.querySelector('img');
      const spark = heroMain.querySelector(".home_hero_spark");
      const content = heroMain.querySelector(".home_hero_content");
      const mediaOverlay = heroMain.querySelector(".media_overlay");

      if (spark) spark.style.transform = 'translateZ(0)';
      if (content) content.style.transform = 'translateZ(0)';

      // Initial states
      const sparkStartScale = 6;
      // if (mediaOverlay) gsap.set(mediaOverlay, { autoAlpha: 0 });
      if (spark) gsap.set(spark, { scale: sparkStartScale, transformOrigin: "50% 50%" });
      if (content) gsap.set(content, { xPercent: 100, autoAlpha: 1 });

      // Entry animation
      const entry = gsap.timeline({ defaults: { duration: 1, ease: "power3.out" } });
      // entry.to(mediaOverlay || {}, { autoAlpha: 1 }, 0);
      entry.to(spark || {}, { scale: sparkStartScale, transformOrigin: "50% 50%" }, 0);
      entry.to(content || {}, { xPercent: 0 }, 0.05);

      // Idle mouse parallax — heroImg: deep, spark: mid, content: shallow
      if (window._purposeParallaxHandler) {
        document.removeEventListener("mousemove", window._purposeParallaxHandler);
      }
      function handleMouseMove(e) {
        const nx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        const ny = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        if (heroImg) gsap.to(heroImg, { x: nx * 8, y: ny * 5, duration: 1.4, ease: "power2.out", overwrite: "auto" });
        if (spark) gsap.to(spark, { x: nx * 16, y: ny * 10, duration: 1.0, ease: "power2.out", overwrite: "auto" });
        if (content) gsap.to(content, { x: nx * 24, duration: 0.8, ease: "power2.out", overwrite: "auto" });
      }
      document.addEventListener("mousemove", handleMouseMove);
      window._purposeParallaxHandler = handleMouseMove;

      // Scroll timeline
      if (heroImg && heroImg.complete && heroImg.naturalWidth !== 0) {
        heroTL();
      } else if (heroImg) {
        heroImg.addEventListener("load", heroTL, { once: true });
      } else {
        heroTL();
      }

      function heroTL() {
        const totalScroll = window.innerHeight * 1.5;
        let lastValue = -1;
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: heroMain,
            start: "top top",
            end: () => `+=${totalScroll}`,
            scrub: true,
            pin: true,
            pinSpacing: true,
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
            { scale: sparkStartScale, rotation: 0 },
            { scale: 0.1, yPercent: -8, rotation: 180, opacity: 0, transformOrigin: "50% 50%", ease: "power2.out" },
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
      }
    });
  }

  window.initPurposeHeroAnimations = initPurposeHeroAnimations;

})();
