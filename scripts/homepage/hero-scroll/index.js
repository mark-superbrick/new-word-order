(function() {

  let DEBUG = false;
  const ENABLE = true;

  function whenGsapReady(cb) {
    if (window.gsap) return cb();
    var t = setInterval(function() {
      if (window.gsap) { clearInterval(t); cb(); }
    }, 50);
  }

  function initHeroAnimations(container) {
    whenGsapReady(function() {
      var gsap = window.gsap;
      var root = container || document;
      const heroMain = root.querySelector(".home_hero_wrap");
      if (!heroMain || !ENABLE) return;

      const heroImg = heroMain.querySelector('img');
      const spark = heroMain.querySelector(".home_hero_spark");
      const mediaOverlay = heroMain.querySelector(".media_overlay");
      const content = heroMain.querySelector(".home_hero_content");
      const contentChildren = content ? Array.from(content.children) : [];

      if (spark) spark.style.transform = 'translateZ(0)';
      if (content) content.style.transform = 'translateZ(0)';

      // Initial states — heroImg and content children enter from right, spark scales in
      const sparkStartScale = 3;
      // if (heroImg) gsap.set(heroImg, { xPercent: 1, autoAlpha: 0 });
      // if (spark) gsap.set(spark, { scale: sparkStartScale, transformOrigin: "50% 50%" });
      if (contentChildren[0]) gsap.set(contentChildren[0], { xPercent: -40, autoAlpha: 0 });
      if (contentChildren[1]) gsap.set(contentChildren[1], { xPercent: 40, autoAlpha: 0 });

      // Entry — 3.2s expo.out: visually lands ~2.2s, fully settled by 3.2s
      const entry = gsap.timeline({ defaults: { ease: "power3.out", duration: 3.2 } });
      if (heroImg) entry.to(heroImg, { xPercent: 0, autoAlpha: 1 }, 0);
      if (spark) entry.to(spark, { scale: sparkStartScale }, 0);
      if (contentChildren.length) {
        entry.to(contentChildren, { xPercent: 0, autoAlpha: 1, duration: 1.4, ease: "power3.out", stagger: 0.18 }, 0.5);
      }

      // Idle mouse parallax — heroImg: deep, spark: mid, content: shallow
      if (window._heroParallaxHandler) {
        document.removeEventListener("mousemove", window._heroParallaxHandler);
      }
      function handleMouseMove(e) {
        const nx = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
        const ny = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
        if (heroImg) gsap.to(heroImg, { x: nx * 8, y: ny * 5, duration: 1.4, ease: "power2.out", overwrite: "auto" });
        if (spark) gsap.to(spark, { x: nx * 16, y: ny * 10, duration: 1.0, ease: "power2.out", overwrite: "auto" });
        if (content) gsap.to(content, { x: nx * 24, duration: 0.8, ease: "power2.out", overwrite: "auto" });
      }
      document.addEventListener("mousemove", handleMouseMove);
      window._heroParallaxHandler = handleMouseMove;

      // Scroll timeline
      if (heroImg && heroImg.complete && heroImg.naturalWidth !== 0) {
        heroTL();
      } else if (heroImg) {
        heroImg.addEventListener("load", heroTL, { once: true });
      } else {
        heroTL();
      }

      function heroTL() {
        const totalScroll = window.innerHeight * 2;
        let lastValue = -1;
        const overlayProxy = { n: 0 };

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
          },
        });

        // Phase 1 [0→1]: content fades out, no position change
        if (content) {
          scrollTl.fromTo(content,
            { opacity: 1 },
            { opacity: 0, ease: "none", duration: 1 },
            0
          );
        }

        // Phase 2 [1→2]: data-number ticks to 100
        scrollTl.to(overlayProxy, {
          n: 100,
          ease: "none",
          duration: 1,
          onUpdate() {
            const v = Math.round(overlayProxy.n);
            if (v === lastValue) return;
            lastValue = v;
            if (mediaOverlay) mediaOverlay.setAttribute("data-number", String(v));
          }
        }, 1);

        // Phase 3 [2→3]: spark scales down
        if (spark) {
          scrollTl.fromTo(spark,
            { scale: sparkStartScale, rotation: 0 },
            { scale: 0.1, rotation: 180, transformOrigin: "50% 50%", ease: "power2.out", duration: 2 },
            0.5
          );
        }
      }
    });
  }

  window.initHeroAnimations = initHeroAnimations;

})();
