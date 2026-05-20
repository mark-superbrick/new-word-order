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
      const content = heroMain.querySelector(".home_hero_content h1");
      const contentChildren = content ? Array.from(content.children) : [];

      if (spark) spark.style.transform = 'translateZ(0)';
      if (content) content.style.transform = 'translateZ(0)';

      // Initial states — heroImg and content children enter from right, spark scales in
      const sparkStartScale = 6;
      // if (heroImg) gsap.set(heroImg, { xPercent: 1, autoAlpha: 0 });
      // if (spark) gsap.set(spark, { scale: sparkStartScale, transformOrigin: "50% 50%" });
      if (contentChildren.length) gsap.set(contentChildren, { xPercent: 40, autoAlpha: 0 });

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
        // Dirty-check: avoid setAttribute DOM write when value hasn't changed
        let lastValue = -1;
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: heroMain,
            start: "top top",
            end: () => `+=${totalScroll}`,
            scrub: true,
            pin: true,
            pinSpacing: false,
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

        // Spark: scale + rotate out from landed state
        if (spark) {
          scrollTl.fromTo(spark,
            { scale: sparkStartScale, rotation: 0 },
            { scale: 0.1, yPercent: -8, rotation: 180, opacity: 0, transformOrigin: "50% 50%", ease: "power2.out" },
            0
          );
        }
        // heroImg: slow parallax drift (deepest layer)
        // if (heroImg) {
        //   scrollTl.to(heroImg, { y: 80, ease: "none" }, 0);
        // }
        // Content: slide left + rise (foreground layer)
        if (content) {
          scrollTl.fromTo(content,
            { xPercent: 0, opacity: 1 },
            { xPercent: -30, opacity: 0, ease: "none" },
            0
          );
          // scrollTl.to(content, { y: 0, ease: "none" }, 0);
        }
      }
    });
  }

  window.initHeroAnimations = initHeroAnimations;

})();
