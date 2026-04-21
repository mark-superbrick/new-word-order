function initRotateScrollDirection() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;
  const ENABLE = true;

  const instances = [];
  const targets = document.querySelectorAll('[data-rotate-collection-target]');
  if (!targets || !ENABLE) return;

  // Find all rotate collections and create a continuous rotation tween for each.
  targets.forEach((collection) => {
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
        onUpdate(self) {
          if (!instance.isVisible) return;
          const desiredSign = self.direction === 1 ? 1 : -1; // 1 => scrolling down, -1 => scrolling up
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

  // Wheel handler: increase rotation speed proportional to wheel delta, direct rotation to match scroll direction.
  // Applies only to visible instances.
  window.addEventListener('wheel', function (ev) {
    // If no instances, skip
    if (!instances.length) return;

    instances.forEach((instance) => {
      if (!instance.isVisible) return;

      const delta = ev.deltaY || 0;
      if (!delta) return;

      const scrollDir = delta > 0 ? 1 : -1; // positive deltaY = scroll down

      // Map delta magnitude to an amplifier. Tweak divisor to adjust sensitivity.
      const amp = Math.min(Math.abs(delta) / 120, 6); // typical mouse wheel ~100-120 units
      const targetMag = 1 + amp; // timeScale magnitude: 1 => default speed, larger => faster

      // Desired sign is the scroll direction while the wheel is moving
      const desiredSign = scrollDir;

      // Apply immediate acceleration (short tween so it feels snappy)
      gsap.to(instance.tween, { timeScale: desiredSign * targetMag, duration: 0.12, ease: 'power2.out' });

      // Clear previous decay timer
      clearTimeout(instance.decayTimer);

      // Schedule decay back to base after wheel inactivity
      instance.decayTimer = setTimeout(() => {
        if (!instance.isVisible) return;
        gsap.to(instance.tween, { timeScale: instance.baseSign * 1, duration: 1.2, ease: 'power3.out' });
      }, 250);
    });
  }, { passive: true });

  // When a user stops scrolling/touchpad, return to base speed/direction after a short delay.
  let scrollStopTimer;
  window.addEventListener('scroll', function () {
    clearTimeout(scrollStopTimer);
    scrollStopTimer = setTimeout(() => {
      instances.forEach((instance) => {
        if (!instance.isVisible) return;
        gsap.to(instance.tween, { timeScale: instance.baseSign * 1, duration: 0.9, ease: 'power3.out' });
      });
    }, 350);
  }, { passive: true });
}


document.addEventListener("DOMContentLoaded", () => {
  // Initialize Rotate with Scroll Direction
  initRotateScrollDirection();
});
