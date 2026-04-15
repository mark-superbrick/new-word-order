// Hero entry + scroll animations
function initHeroAnimations() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    // Wait for GSAP + ScrollTrigger to be available
    console.warn("GSAP or ScrollTrigger not available yet. Retrying...");
    setTimeout(initHeroAnimations, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const heroMain = document.querySelector(".home_hero_wrap");
  if (!heroMain) { 
    return;
  } else {
    const heroImg = heroMain.querySelector('img');
    const background = heroMain.querySelector(".background_overlay");
    const spark = heroMain.querySelector(".home_hero_spark");
    const content = heroMain.querySelector(".home_hero_content");
    // Fallback: look for any element with a data-number attribute inside hero
    const mediaOverlay = heroMain.querySelector(".media_overlay");
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
        const scrollTl = gsap.timeline({
          scrollTrigger: {
            trigger: heroMain,
            start: "top top",
            end: () => `+=${window.innerHeight * 2}`,
            // end: "bottom top",
            scrub: true,
            pin: true,
            pinSpacing: true,         // <-- was false; now reserves scroll distance so alt_wrap no longer overlaps
            invalidateOnRefresh: true,
            markers: DEBUG,
            id: "main",
            refreshPriority: 1,
            onUpdate(self) {
              const progress = Math.max(0, Math.min(1, self.progress || 0));
              const value = Math.round(progress * 100);
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
        ScrollTrigger.refresh();
      }
    // });
  }





  /** /
  // Alt stack — also created IMMEDIATELY, AFTER scrollTl so creation order matches DOM order.
  const heroAlt = document.querySelector(".home_hero_alt_wrap");
  if (!heroAlt) {
    return;
  } else {
    const altItems = heroAlt.querySelectorAll(".home_hero_alt_item");
    const totalAlt = altItems.length;
    if (altItems && altItems.length) {
      // altItems.forEach((el, idx) => {
      //   el.style.position = "absolute";
      //   el.style.inset = "0";
      //   el.style.width = "100%";
      //   el.style.height = "100vh";
      //   el.style.top = "0";
      //   el.style.left = "0";
      //   el.style.willChange = "transform, opacity, filter";
      //   el.style.zIndex = idx + 1;
      // });

      heroAlt.style.height = "100vh";
      heroAlt.style.overflow = "hidden";   // clip absolute children to wrapper bounds
      heroAlt.style.position = "relative"; // ensure absolute children are relative to wrapper

      // // Initial state: only item 0 centered. Others parked below viewport.
      // gsap.set(altItems, { yPercent: 100, opacity: 1, filter: "blur(0px)" });
      // gsap.set(altItems[0], { yPercent: 0, opacity: 1, filter: "blur(0px)" });
      
      // AFTER (all items parked below, including item 0):
      gsap.set(altItems, { yPercent: 100, opacity: 0, filter: "blur(40px)" });

      const altTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroAlt,
          start: "top top",
          end: () => `+=${totalAlt * window.innerHeight}`, // <-- was (totalAlt + 2); now exactly one viewport per item
          scrub: true,
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
          markers: DEBUG,
          id: "alt",
          refreshPriority: 2,
          onUpdate(self) {
            const progress = Math.max(0, Math.min(1, self.progress || 0));
            const segment = Math.min(totalAlt - 1, Math.floor(progress * totalAlt));
            altItems.forEach((el, i) => el.classList.toggle("is-active", i === segment));
          },
        },
      });

      // Newsfeed stack-and-push (Mark confirmed this works):
      const stackOffset = 18;
      const fadePerStep = 0.35;
      const blurPerStep = 8;
      // Item 0 enters from below (same as every other item)
      altTl.fromTo(altItems[0],
        { yPercent: 100, opacity: 0, filter: "blur(40px)" },
        { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power3.out" },
        0
      );
      
      for (let step = 1; step < totalAlt; step++) {
        for (let j = 0; j < step; j++) {
          const distance = step - j;
          altTl.to(altItems[j], {
            yPercent: -stackOffset * distance,
            opacity: Math.max(0, 1 - fadePerStep * distance),
            filter: `blur(${blurPerStep * distance}px)`,
            duration: 1,
            ease: "power3.inOut",
          }, step);
        }
        altTl.fromTo(altItems[step],
          { yPercent: 100, opacity: 0, filter: "blur(40px)" },
          { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power3.out" },
          step
        );
      }
    }
  }
  /**/

}

document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready.then(() => {
    initHeroAnimations();   // creates hero (priority 1) + alt (priority 2)
    // initHeroAltAnimations();   // creates hero (priority 1) + alt (priority 2)
    // initSectionScroller();  // creates text scrollers (priority 3)
    // One refresh after all triggers exist — recomputes start/end against final layout
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
});
