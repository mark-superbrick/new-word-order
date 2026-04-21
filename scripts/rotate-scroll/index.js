
function initRotateScrollDirection() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  // let DEBUG = mainDomain == 'webflow';
  let DEBUG = false;
  DEBUG ? console.log('initRotateScrollDirection') : '';
  const ENABLE = true;  // <-- master toggle; set to false to disable all related code, including ScrollTrigger creation

  gsap.registerPlugin(ScrollTrigger);

  const rotates = document.querySelectorAll('[data-rotate-scroll-direction-target]');
  // console.log('rotates', rotates);
  // console.log('rotates.length', rotates.length);
  if (!rotates || rotates.length === 0 || !ENABLE) return;

  document.querySelectorAll('[data-rotate-scroll-direction-target]').forEach((rotate) => {
    // Query rotate elements
    const rotateScroll = rotate.querySelector('[data-rotate-scroll-target]');
    // console.log('rotate', rotate);
    if (!rotateScroll) return;

    // Get data attributes
    const { rotateSpeed: speed, rotateDirection: direction, rotateScrollSpeed: scrollSpeed } = rotate.dataset;

    // Convert data attributes to usable types
    const rotateSpeedAttr = parseFloat(speed);
    const rotateDirectionAttr = direction === 'clockwise' ? 1 : -1;
    const scrollSpeedAttr = parseFloat(scrollSpeed);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    const rotateDuration = rotateSpeedAttr * speedMultiplier;

    // GSAP animation for rotate content
    const rotateItems = rotate.querySelectorAll('[data-rotate-collection-target]');
    const animation = gsap.to(rotateItems, {
      rotate: 100,
      repeat: -1,
      duration: rotateDuration,
      ease: 'linear'
    }).totalProgress(0.5);

    animation.timeScale(rotateDirectionAttr); // Set correct direction
    animation.play(); // Start animation immediately

    // Set initial rotate status
    rotate.setAttribute('data-rotate-status', 'normal');
    gsap.set(rotate, { transformOrigin: 'center' });

    // ScrollTrigger logic for direction inversion
    ScrollTrigger.create({
      trigger: rotate,
      start: 'top bottom',
      end: 'bottom top',
      markers: DEBUG,
      id: 'rotate',
      onUpdate: (self) => {
        const dir = self.direction === 1 ? 1 : -1; // scroll down = clockwise (1), scroll up = counter-clockwise (-1)
        animation.timeScale(dir);
        rotate.setAttribute('data-rotate-status', dir === 1 ? 'clockwise' : 'counter-clockwise');
      },
      onEnter: () => {
        animation.timeScale(rotateDirectionAttr);
        rotate.setAttribute('data-rotate-status', 'clockwise');
        // console.log('enter', rotateDirectionAttr);
      },
      onLeave: () => {
        animation.timeScale(rotateDirectionAttr);
        rotate.setAttribute('data-rotate-status', 'clockwise');
        // console.log('leave', rotateDirectionAttr);
      },
      onEnterBack: () => {
        animation.timeScale(-rotateDirectionAttr);
        rotate.setAttribute('data-rotate-status', 'counter-clockwise');
        // console.log('enterBack', -rotateDirectionAttr);
      },
      onLeaveBack: () => {
        animation.timeScale(-rotateDirectionAttr);
        rotate.setAttribute('data-rotate-status', 'counter-clockwise');
        // console.log('leaveBack', -rotateDirectionAttr);
      }
    });

    // Extra rotation effect on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: rotate,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0,
        markers: DEBUG,
        id: 'scroll'
      }
    });

    const scrollStart = rotateDirectionAttr === 1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = scrollStart * rotateDuration/2;

    tl.fromTo(rotateScroll, { rotateZ: scrollStart }, { rotateZ: scrollEnd, ease: 'none' });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Rotate with Scroll Direction
  initRotateScrollDirection();

  // requestAnimationFrame(() => ScrollTrigger.refresh());
});
