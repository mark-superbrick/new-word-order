// Hero entry + scroll animations
function initHeroAltAnimations() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;
  const ENABLE = true;
  // Disable blur on tablet and smaller — Webflow tablet breakpoint is 991px.
  const reduceBlur  = window.matchMedia('(max-width: 991px)').matches;
  const blurMax     = reduceBlur ? 0 : 40;  // <-- master toggle for hero scroll animations; set to false to disable all related code, including ScrollTrigger creation and entry animation


  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    // Wait for GSAP + ScrollTrigger to be available
    console.warn("GSAP or ScrollTrigger not available yet. Retrying...");
    setTimeout(initHeroAltAnimations, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Alt stack — also created IMMEDIATELY, AFTER scrollTl so creation order matches DOM order.
  // let ctxAlt = gsap.context(() => {
    const heroAlt = document.querySelector(".home_hero_alt_wrap");
    if (!heroAlt || !ENABLE) 
      return;
  
    // const altItems = gsap.utils.toArray(".home_hero_alt_item");
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

      // Promote all items to compositor layers before animation starts — all items receive
      // transform, opacity, and filter tweens during the stack effect, so without this the
      // browser must repaint the parent heroAlt on every scroll tick.
      altItems.forEach(el => { el.style.willChange = 'transform, opacity, filter'; });

      // // Initial state: only item 0 centered. Others parked below viewport.
      // gsap.set(altItems, { yPercent: 100, opacity: 1, filter: "blur(0px)" });
      // gsap.set(altItems[0], { yPercent: 0, opacity: 1, filter: "blur(0px)" });

      // AFTER (all items parked below, including item 0):
      gsap.set(altItems, { yPercent: 100, opacity: 0, filter: `blur(${blurMax}px)` });

      // Dirty-check: skip classList writes when segment hasn't changed
      let lastAltSegment = -1;
      const altTl = gsap.timeline({
        scrollTrigger: {
          trigger: heroAlt,
          start: "top top",
          end: () => `+=${totalAlt * window.innerHeight}`, // <-- was (totalAlt + 2); now exactly one viewport per item
          // end: () => `+=${window.innerHeight * 1}`,
          scrub: true,
          pin: true,
          pinSpacing: true,
          invalidateOnRefresh: true,
          markers: DEBUG,
          id: "alt",
          refreshPriority: 1,
          onUpdate(self) {
            const progress = Math.max(0, Math.min(1, self.progress || 0));
            const segment = Math.min(totalAlt - 1, Math.floor(progress * totalAlt));
            if (segment === lastAltSegment) return;
            lastAltSegment = segment;
            altItems.forEach((el, i) => el.classList.toggle("is-active", i === segment));
          },
        },
      });
      // altTl.to('body',{ duration: 1 });

      // Newsfeed stack-and-push (Mark confirmed this works):
      const stackOffset = 18;
      const fadePerStep = 0.35;
      const blurPerStep = reduceBlur ? 0 : 8;
      // Item 0 enters from below (same as every other item)
      altTl.fromTo(altItems[0],
        { yPercent: 100, opacity: 0, filter: `blur(${blurMax}px)` },
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
          { yPercent: 100, opacity: 0, filter: `blur(${blurMax}px)` },
          { yPercent: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power3.out" },
          step
        );
      }

      // altTl.to('body',{ duration: 1 });
    }
  
  // });
}

document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready.then(() => {
    // initHeroAnimations();   // creates hero (priority 1) + alt (priority 2)
    initHeroAltAnimations();   // creates hero (priority 1) + alt (priority 2)
    // initTextScroller();  // creates text scrollers (priority 3)
    // One refresh after all triggers exist — recomputes start/end against final layout
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
});
