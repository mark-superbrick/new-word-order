(function() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;
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

  function initRotateScrollDirection(container) {
    const instances = [];
    var gsap = window.gsap;

    whenGsapReady(function(){


      var root = container || document;
      
      const collections = root.querySelectorAll('[data-rotate-collection-target]');
      if (!collections || collections.length === 0 || !ENABLE) return;


      // Find all rotate collections and create a continuous rotation tween for each.
      collections.forEach((collection) => {
        // scrollTarget is expected to be an ancestor with data-rotate-scroll-target
        const scrollTarget = collection.closest('[data-rotate-scroll-target]') || collection;

        // directionTarget can be used to store config attributes if present
        const directionTarget = collection.closest('[data-rotate-scroll-direction-target]') || scrollTarget || collection;

        // Resolve default speeds and direction from dataset (fallbacks applied)
        const rotateSpeedAttr = (
          directionTarget?.dataset?.rotateSpeed ||
          scrollTarget?.dataset?.rotateSpeed ||
          collection?.dataset?.rotateSpeed
        );
        const rotateSpeed = parseFloat(rotateSpeedAttr) || 15; // seconds for one revolution by default

        const defaultDirection = (
          directionTarget?.dataset?.rotateDirection ||
          scrollTarget?.dataset?.rotateDirection ||
          collection?.dataset?.rotateDirection ||
          'clockwise'
        ).toLowerCase();

        const baseSign = defaultDirection === 'counterclockwise' ? -1 : 1;

        // The element to rotate: prefer an inline svg inside the collection
        const svg = collection.querySelector('svg') || collection;
        if (!svg) return;

        // Create an infinite rotation tween. We rotate by +=360 so direction flipping works via timeScale sign.
        const tween = gsap.to(svg, {
          rotation: '+=360',
          repeat: -1,
          ease: 'none',
          duration: rotateSpeed,
          transformOrigin: '50% 50%'
        });

        // Initialize with the base direction (1 or -1)
        try { tween.timeScale(baseSign); } catch (e) { /* defensive */ }

        const instance = {
          collection,
          scrollTarget,
          directionTarget,
          svg,
          tween,
          baseSign,
          // lastSign keeps track of the most recent scroll direction so we can return to that
          lastSign: baseSign,
          isVisible: true,
          decayTimer: null
        };

        // Observe visibility so behavior only runs while in view
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            instance.isVisible = entry.isIntersecting;
            if (!instance.isVisible) {
              // When out of view, gently return to the default rotation speed & direction
              gsap.to(instance.tween, { timeScale: instance.baseSign * 1, duration: 0.6, ease: 'power3.out' });
            }
          });
        }, { threshold: 0.12 });
        io.observe(scrollTarget || collection);
        instance._io = io;

        // Use ScrollTrigger to flip direction while the section is in the viewport based on scroll direction
        try {
          ScrollTrigger.create({
            trigger: scrollTarget || collection,
            start: 'top bottom',
            end: 'bottom top',
            refreshPriority: 1,
            onUpdate(self) {
              if (!instance.isVisible) return;
              const desiredSign = self.direction === 1 ? 1 : -1; // 1 => scrolling down, -1 => scrolling up
              // remember the most recent direction so we can return to it when scrolling stops
              instance.lastSign = desiredSign;
              // preserve current magnitude, just change sign smoothly
              const curMag = Math.max(Math.abs(instance.tween.timeScale() || 1), 0.001);
              gsap.to(instance.tween, { timeScale: desiredSign * curMag, duration: 0.45, ease: 'power3.out' });
            }
          });
        } catch (err) {
          // fail quietly if ScrollTrigger config isn't supported here
        }

        instances.push(instance);
      });
    });
    

    // Helper to apply an instantaneous acceleration to visible instances
    function applyAcceleration(desiredSign, magnitude, immediateDuration = 0.12, decayDelay = 250) {
      if (!instances.length) return;
      instances.forEach((instance) => {
        if (!instance.isVisible) return;
        instance.lastSign = desiredSign;
        const targetMag = 1 + magnitude;
        gsap.to(instance.tween, { timeScale: desiredSign * targetMag, duration: immediateDuration, ease: 'power2.out' });
        clearTimeout(instance.decayTimer);
        instance.decayTimer = setTimeout(() => {
          if (!instance.isVisible) return;
          const keepSign = instance.lastSign || instance.baseSign;
          gsap.to(instance.tween, { timeScale: keepSign * 1, duration: 1.2, ease: 'power3.out' });
        }, decayDelay);
      });
    }

    // Wheel handler: increase rotation speed proportional to wheel delta, direct rotation to match scroll direction.
    // Applies only to visible instances.
    window.addEventListener('wheel', function (ev) {
      // If no instances, skip
      if (!instances.length) return;

      const delta = ev.deltaY || 0;
      if (!delta) return;

      const scrollDir = delta > 0 ? 1 : -1; // positive deltaY = scroll down

      // Map delta magnitude to an amplifier. Tweak divisor to adjust sensitivity.
      // Use a slightly tuned mapping so trackpad and mouse wheel both feel good.
      const amp = Math.min(Math.abs(delta) / 120, 6); // baseline mapping (unchanged)

      applyAcceleration(scrollDir, amp, 0.12, 250);
    }, { passive: true });

    // Touch handling: derive a fling-like velocity from touchmove and apply acceleration
    let lastTouchY = null;
    let lastTouchTime = null;
    let touchActive = false;

    window.addEventListener('touchstart', function (ev) {
      const t = ev.touches && ev.touches[0];
      if (!t) return;
      touchActive = true;
      lastTouchY = t.clientY;
      lastTouchTime = performance.now();
      // cancel any global scroll-stop reset while actively touching
    }, { passive: true });

    window.addEventListener('touchmove', function (ev) {
      const t = ev.touches && ev.touches[0];
      if (!t || lastTouchY === null) return;

      const now = performance.now();
      const dy = t.clientY - lastTouchY; // positive when moving down (finger moving down -> page scroll down)
      const dt = Math.max(1, now - lastTouchTime);
      const velocity = dy / dt; // px per ms

      lastTouchY = t.clientY;
      lastTouchTime = now;

      // Convert velocity to a magnitude roughly comparable to wheel amp.
      // Tune factor so a typical swipe produces a noticeable but not insane speed-up.
      const velocityAbs = Math.abs(velocity);
      const amp = Math.min(velocityAbs * 18, 8); // tuned multiplier and clamp

      if (amp < 0.02) return; // ignore micro-movements

      const desiredSign = velocity > 0 ? 1 : -1; // finger moving down => content moves down => positive

      applyAcceleration(desiredSign, amp, 0.12, 300);
    }, { passive: true });

    window.addEventListener('touchend', function () {
      touchActive = false;
      // Let the per-instance decay timers handle returning to base speed.
    }, { passive: true });

    // When a user stops scrolling/touchpad, return to base speed after a short delay but keep the direction
    let scrollStopTimer;
    window.addEventListener('scroll', function () {
      clearTimeout(scrollStopTimer);
      scrollStopTimer = setTimeout(() => {
        instances.forEach((instance) => {
          if (!instance.isVisible) return;
          const keepSign = instance.lastSign || instance.baseSign;
          // return to base magnitude (1) but preserve the last direction sign
          gsap.to(instance.tween, { timeScale: keepSign * 1, duration: 0.9, ease: 'power3.out' });
        });
      }, 350);
    }, { passive: true });
  }

  



  // Run on initial load
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    // small timeout to let other initialisation complete
    setTimeout(function(){ initRotateScrollDirection(document); }, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ initRotateScrollDirection(document); }, 60);
    });
  }

  // Hook into Barba if present so animations run after page enter
  function attachBarbaHook(){
    if(window.barba && window.barba.hooks){
      // afterEnter gives us access to the new container
      window.barba.hooks.afterEnter(function(data){
        // animate items within the new container
        initRotateScrollDirection(data.next.container || document);
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
