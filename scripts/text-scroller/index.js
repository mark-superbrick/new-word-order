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

  // Initialize a pinned timeline that animates full-screen .section_scroller_item slides
  function initTextScroller(container) {
    const instances = [];

    whenGsapReady(function(){
      var gsap = window.gsap;

      var root = container || document;


      const wrappers = root.querySelectorAll('[data-text-scroller-wrap]');
      if (!wrappers || wrappers.length === 0 || !ENABLE) return;
      
      // Disable blur on tablet and smaller — blur is expensive to paint and visually distracting
      // at smaller sizes. Webflow tablet breakpoint is 991px.
      const reduceBlur = window.matchMedia('(max-width: 991px)').matches;
      const blurFull   = reduceBlur ? 'blur(0px)' : 'blur(40px)';  // <-- master toggle for hero scroll animations; set to false to disable all related code, including ScrollTrigger creation and entry animation



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
          el.style.position = "absolute";
          el.style.height = "100svh";
          el.style.opacity = 0;
          el.style.zIndex = idx + 1;
          // will-change set only on items that will actually animate (not item 0 which starts visible)
          if (idx !== 0) {
            // el.style.willChange = 'transform, opacity, filter';
            el.style.transform = "translateZ(0)";
          }
        });

        // Set initial states: offscreen below and invisible for all except first
        gsap.set(items, { yPercent: 100, opacity: 0, filter: blurFull, overwrite: true });

        // Compute total scroll distance: one viewport per slide.
        // Add an extra viewport's worth of scroll so the section remains pinned
        // until the very last item finishes its exit animation and leaves with the section.
        const totalScroll = (items.length + 1) * window.innerHeight;

        // Dirty-check: skip classList writes when segment hasn't changed
        let lastSegment = -1;
        const isOnlyItem = items.length === 1;

        // Build a timeline where each slide animates in (from bottom) and then out (fade up)
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapper,
            start: 'bottom bottom',
            end: () => `+=${totalScroll}`,
            scrub: true,
            // Pin the wrapper for the full timeline so the section stays fixed
            // until the last item has left with it.
            pin: true,
            pinSpacing: true,
            // Keep measurements fresh if the viewport or content changes
            invalidateOnRefresh: true,
            // refreshPriority: 1,
            markers: DEBUG,
            id: 'text-' + index,
            onUpdate(self) {
              // Set an "is-active" class for the currently scrolled segment
              const progress = self.progress || 0;
              const segment = Math.min(items.length - 1, Math.floor(progress * items.length));
              if (segment === lastSegment) return;
              lastSegment = segment;
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
        // Skip when it's the only item — it should animate in like any other item
        if (items.length > 1) {
          gsap.set(items[0], { yPercent: 0, opacity: 1, filter: 'blur(0px)', overwrite: true });
        }
        // Ensure first item is considered active at start
        // if (items[0].classList) items[0].classList.add('is-active');
        // For each item, schedule an "in" tween at its index and an "out" tween shortly after
        const lastIndex = items.length - 1;
        items.forEach((item, i) => {
          const inTime = i; // start time in timeline units
          const outTime = i + 0.6; // when to start fading out


          // Skip enter animation for first item (no "in" tween), unless it's also the only item
          if (i !== 0 || isOnlyItem) {
            tl.to(item, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, inTime);
          } else {
            // make sure timeline keeps the first item visible at this point
            tl.set(item, { yPercent: 0, opacity: 1, filter: 'blur(0px)' }, inTime);
          }

          // Skip leave animation for last item (no "out" tween), unless it's also the only item
          if (i !== lastIndex) {
            tl.to(item, { yPercent: -20, opacity: 0, filter: blurFull, duration: 0.6, ease: 'power3.in' }, outTime);
          } else {
            // ensure the last item remains visible through the end of its segment
            tl.set(item, { yPercent: 0, opacity: 1, filter: 'blur(0px)' }, outTime);
          }
        });
        /**/
      });

      // ScrollTrigger handles resize internally via invalidateOnRefresh: true on each trigger
    });
  }



  window.initTextScroller = initTextScroller;

})();
