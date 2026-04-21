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

  // Module-level instances array so window listeners always reference the current set.
  // Cleared on each re-init so stale tweens from previous pages don't keep running.
  var instances = [];

  function initRotateScrollDirection(container) {
    // Kill tweens, ScrollTriggers, disconnect observers, and clear previous instances before re-init
    instances.forEach(function(inst) {
      if (inst.tween) inst.tween.kill();
      if (inst._st) inst._st.kill();
      if (inst._io) inst._io.disconnect();
      clearTimeout(inst.decayTimer);
    });
    instances.length = 0;

    whenGsapReady(function(){
      var gsap = window.gsap;


      var root = container || document;
      
      const collections = root.querySelectorAll('[data-rotate-collection-target]');
      if (!collections || collections.length === 0 || !ENABLE) return;


      // Find all rotate collections and create a continuous rotation tween for each.
      collections.forEach((collection) => {
        // scrollTarget is expected to be an ancestor with data-rotate-scroll-target.
        // If that ancestor is inside a ScrollTrigger pin (position:fixed), climb to its
        // pin-spacer instead — pin-spacer has correct document offsets for trigger math.
        let scrollTarget = collection.closest('[data-rotate-scroll-target]') || collection;
        const pinSpacer = scrollTarget.closest('.pin-spacer');
        if (pinSpacer) scrollTarget = pinSpacer;

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
          instance._st = ScrollTrigger.create({
            trigger: scrollTarget || collection,
            start: 'top bottom',
            end: 'bottom top',
            refreshPriority: 1,
            onUpdate(self) {
              const desiredSign = self.direction === 1 ? 1 : -1;
              instance.lastSign = desiredSign;
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
  }

  // Window listeners registered once at module level — reference module-scoped `instances`
  // so they always act on the current page's set without re-registration on navigation.
  function applyAcceleration(desiredSign, magnitude, immediateDuration, decayDelay) {
    if (!window.gsap || !instances.length) return;
    immediateDuration = immediateDuration || 0.12;
    decayDelay = decayDelay || 250;
    instances.forEach(function(instance) {
      if (!instance.isVisible) return;
      instance.lastSign = desiredSign;
      const targetMag = 1 + magnitude;
      window.gsap.to(instance.tween, { timeScale: desiredSign * targetMag, duration: immediateDuration, ease: 'power2.out' });
      clearTimeout(instance.decayTimer);
      instance.decayTimer = setTimeout(function() {
        if (!instance.isVisible) return;
        const keepSign = instance.lastSign || instance.baseSign;
        window.gsap.to(instance.tween, { timeScale: keepSign * 1, duration: 1.2, ease: 'power3.out' });
      }, decayDelay);
    });
  }

  window.addEventListener('wheel', function(ev) {
    if (!instances.length) return;
    const delta = ev.deltaY || 0;
    if (!delta) return;
    applyAcceleration(delta > 0 ? 1 : -1, Math.min(Math.abs(delta) / 120, 6), 0.12, 250);
  }, { passive: true });

  var lastTouchY = null;
  var lastTouchTime = null;

  window.addEventListener('touchstart', function(ev) {
    var t = ev.touches && ev.touches[0];
    if (!t) return;
    lastTouchY = t.clientY;
    lastTouchTime = performance.now();
  }, { passive: true });

  window.addEventListener('touchmove', function(ev) {
    var t = ev.touches && ev.touches[0];
    if (!t || lastTouchY === null) return;
    var now = performance.now();
    var dy = t.clientY - lastTouchY;
    var dt = Math.max(1, now - lastTouchTime);
    var velocity = dy / dt;
    lastTouchY = t.clientY;
    lastTouchTime = now;
    var amp = Math.min(Math.abs(velocity) * 18, 8);
    if (amp < 0.02) return;
    applyAcceleration(velocity > 0 ? 1 : -1, amp, 0.12, 300);
  }, { passive: true });

  window.addEventListener('touchend', function() {
    lastTouchY = null;
  }, { passive: true });

  var scrollStopTimer;
  window.addEventListener('scroll', function() {
    if (!instances.length) return;
    clearTimeout(scrollStopTimer);
    scrollStopTimer = setTimeout(function() {
      instances.forEach(function(instance) {
        if (!instance.isVisible || !window.gsap) return;
        var keepSign = instance.lastSign || instance.baseSign;
        window.gsap.to(instance.tween, { timeScale: keepSign * 1, duration: 0.9, ease: 'power3.out' });
      });
    }, 350);
  }, { passive: true });

  



  window.initRotateScrollDirection = initRotateScrollDirection;

})();
