
function initRotateScrollDirection() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  // let DEBUG = mainDomain == 'webflow';
  let DEBUG = false;
  const ENABLE = true;

  gsap.registerPlugin(ScrollTrigger);
  
  const rotates = document.querySelectorAll('[data-rotate-scroll-direction-target]');
  if (!rotates || rotates.length === 0 || !ENABLE) return;
  
  rotates.forEach((rotate) => {
    // Query rotate elements
    const rotateContent = rotate.querySelector('[data-rotate-collection-target]');
    const rotateScroll = rotate.querySelector('[data-rotate-scroll-target]');
    if (!rotateContent || !rotateScroll) return;

    // Get data attributes
    const { rotateSpeed: speed, rotateDirection: direction, rotateDuplicate: duplicate, rotateScrollSpeed: scrollSpeed } = rotate.dataset;

    // Convert data attributes to usable types
    const rotateSpeedAttr = parseFloat(speed);
    const rotateDirectionAttr = direction === 'clockwise' ? 1 : -1; // 1 for clockwise, -1 for counter-clockwise
    const duplicateAmount = parseInt(duplicate || 0);
    const scrollSpeedAttr = parseFloat(scrollSpeed);
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let rotateSpeed = rotateSpeedAttr * (rotateContent.offsetWidth / window.innerWidth) * speedMultiplier;

    // Precompute styles for the scroll container
    rotateScroll.style.rotate = `${scrollSpeedAttr * -1}deg`;
    // rotateScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

    // Duplicate rotate content
    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(rotateContent.cloneNode(true));
      }
      rotateScroll.appendChild(fragment);
    }

    // GSAP animation for rotate content
    const rotateItems = rotate.querySelectorAll('[data-rotate-collection-target]');
    const animation = gsap.to(rotateItems, {
      rotate: -100, // Move completely out of view
      repeat: -1,
      duration: rotateSpeed,
      ease: 'linear'
    }).totalProgress(0.5);

    // Initialize rotate in the correct direction
    gsap.set(rotateItems, { rotate: rotateDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(rotateDirectionAttr); // Set correct direction
    animation.play(); // Start animation immediately

    // Set initial rotate status
    rotate.setAttribute('data-rotate-status', 'normal');

    // ScrollTrigger logic for direction inversion
    ScrollTrigger.create({
      trigger: rotate,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const isInverted = self.direction === 1; // Scrolling down
        const currentDirection = isInverted ? -rotateDirectionAttr : rotateDirectionAttr;

        // Update animation direction and rotate status
        animation.timeScale(currentDirection);
        rotate.setAttribute('data-rotate-status', isInverted ? 'normal' : 'inverted');
      }
    });

    // Extra speed effect on scroll
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: rotate,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0
      }
    });

    const scrollStart = rotateDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;

    tl.fromTo(rotateScroll, { rotate: `${scrollStart}deg` }, { x: `${scrollEnd}deg`, ease: 'none' });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize rotate with Scroll Direction
  initRotateScrollDirection();

  requestAnimationFrame(() => ScrollTrigger.refresh());
});
