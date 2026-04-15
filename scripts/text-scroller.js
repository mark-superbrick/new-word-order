// Initialize a pinned timeline that animates full-screen .section_scroller_item slides
function initTextScroller() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';

  gsap.registerPlugin(ScrollTrigger);
  
  const wrappers = document.querySelectorAll('[data-text-scroller-wrap]');
  if (!wrappers || wrappers.length === 0) return;

  wrappers.forEach((wrapper, index) => {
    const items = wrapper.querySelectorAll('[data-text-scroller-item]');
    if (!items || items.length === 0) return;
      
    // wrapper.style.height = "100vh";
    // wrapper.style.overflow = "hidden";   // clip absolute children to wrapper bounds
    // wrapper.style.position = "relative"; // ensure absolute children are relative to wrapper

    // Ensure the wrapper is positioned for absolute children and pinning
    // if (getComputedStyle(wrapper).position === 'static') {
      // wrapper.style.position = 'relative';
    // }
    wrapper.style.height = "100vh";
    wrapper.style.overflow = "hidden";   // clip absolute children to wrapper bounds
    wrapper.style.position = "relative"; // ensure absolute children are relative to wrapper
  

    // Give each slide a z-index so incoming slides appear above previous
    items.forEach((el, idx) => {
      el.style.zIndex = idx + 1;
      // Ensure hardware acceleration and that filter will be animatable
      el.style.willChange = 'transform, opacity, filter';
    });

    // Set initial states: offscreen below and invisible for all except first
    gsap.set(items, { y: '100%', opacity: 0, filter: 'blur(40px)', overwrite: true });

    // Compute total scroll distance: one viewport per slide.
    // Add an extra viewport's worth of scroll so the section remains pinned
    // until the very last item finishes its exit animation and leaves with the section.
    const totalScroll = (items.length + 1) * window.innerHeight;

    // Build a timeline where each slide animates in (from bottom) and then out (fade up)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrapper,
        start: 'top top',
        end: () => `+=${totalScroll}`,
        scrub: true,
        // Pin the wrapper for the full timeline so the section stays fixed
        // until the last item has left with it.
        pin: true,
        pinSpacing: true,
        // Keep measurements fresh if the viewport or content changes
        invalidateOnRefresh: true,
        // refreshPriority: 1,   // runs after hero (1) and alt (2)
        markers: DEBUG,
        id: 'text-' + index,
        onUpdate(self) {
          // Set an "is-active" class for the currently scrolled segment
          const progress = self.progress || 0;
          const segment = Math.min(items.length - 1, Math.floor(progress * items.length));
          items.forEach((el, i) => el.classList.toggle('is-active', i === segment));
        }
      }
    });

    /**
    * Option 1:
    * All items have their enter and leave animations
    */
    /** /
    // For each item, schedule an "in" tween at its index and an "out" tween shortly after
    items.forEach((item, i) => {
      const inTime = i; // start time in timeline units
      const outTime = i + 0.6; // when to start fading out

      tl.to(item, { y: '0%', opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, inTime);
      tl.to(item, { y: '-20%', opacity: 0, filter: 'blur(40px)', duration: 0.6, ease: 'power3.in' }, outTime);
    });
    /**/

    /**
    * Option 2: 
    * The first item doesn't have an enter animation. The last item doesn't have a leave animation
    */
    /**/
    // First item should NOT have an enter effect: make it visible immediately
    gsap.set(items[0], { y: '0%', opacity: 1, filter: 'blur(0px)', overwrite: true });
    // Ensure first item is considered active at start
    // if (items[0].classList) items[0].classList.add('is-active');
    // For each item, schedule an "in" tween at its index and an "out" tween shortly after
    const lastIndex = items.length - 1;
    items.forEach((item, i) => {
      const inTime = i; // start time in timeline units
      const outTime = i + 0.6; // when to start fading out

      // Skip enter animation for first item (no "in" tween)
      if (i !== 0) {
        tl.to(item, { y: '0%', opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, inTime);
      } else {
        // make sure timeline keeps the first item visible at this point
        tl.set(item, { y: '0%', opacity: 1, filter: 'blur(0px)', }, inTime);
      }

      // Skip leave animation for last item (no "out" tween)
      if (i !== lastIndex) {
        tl.to(item, { y: '-20%', opacity: 0, filter: 'blur(40px)', duration: 0.6, ease: 'power3.in' }, outTime);
      } else {
        // ensure the last item remains visible through the end of its segment
        tl.set(item, { y: '0%', opacity: 1, filter: 'blur(0px)', }, outTime);
      }
    });
    /**/
  });
  
  // Ensure ScrollTrigger recalculates on resize
  window.addEventListener('resize', () => {
    ScrollTrigger.refresh();
  });
}


document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready.then(() => {
    // initHeroAnimations();   // creates hero (priority 1) + alt (priority 2)
    // initHeroAltAnimations();   // creates hero (priority 1) + alt (priority 2)
    initTextScroller();  // creates text scrollers (priority 3)
    // One refresh after all triggers exist — recomputes start/end against final layout
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
});
