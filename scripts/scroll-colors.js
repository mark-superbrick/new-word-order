
function initScrollColors() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;

  gsap.registerPlugin(ScrollTrigger);

  // Ensure GSAP + ScrollTrigger are available before proceeding.
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Retry shortly if scripts haven't loaded yet.
    setTimeout(initScrollColors, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Prefer explicit #main if present, otherwise fall back to common wrappers.
  const mainWrapper = document.getElementById('main') || document.querySelector('main') || document.querySelector('.main-wrapper') || document.querySelector('.page-wrapper') || document.body;
  if (!mainWrapper) {
    // Defensive: if there's truly nothing to animate, bail out to avoid "GSAP target null not found".
    console.warn('initScrollColors: no main wrapper found — aborting color-sync.');
    return;
  }

  const rootStyles  = getComputedStyle(document.documentElement);

  const colorMap = {
    'offwhite':  '--base-color--offwhite',
    'black':     '--base-color-neutral--black',
    'purple':    '--base-color--purple',
    'orange':    '--base-color--orange',
    'blue':      '--base-color--blue',
    'lime':      '--base-color--lime',
  };

  function resolveColor(value) {
    if (!value) return null;
    const key = value.trim().toLowerCase();

    // Friendly name → CSS variable name → computed value
    if (colorMap[key]) {
      return rootStyles.getPropertyValue(colorMap[key]).trim();
    }

    // Raw var() syntax → extract and resolve
    const varMatch = value.match(/var\((--[^)]+)\)/);
    if (varMatch) {
      return rootStyles.getPropertyValue(varMatch[1]).trim();
    }

    // Already a real color value (hex, rgb, etc.)
    return value;
  }

  const sections = gsap.utils.toArray('[data-bg-color], [data-text-color]');

  sections.forEach((section, index) => {
    const bgColor   = resolveColor(section.dataset.bgColor);
    const textColor = resolveColor(section.dataset.textColor);

    const prevSection   = sections[index - 1] || null;
    const prevBgColor   = prevSection ? resolveColor(prevSection.dataset.bgColor)   : null;
    const prevTextColor = prevSection ? resolveColor(prevSection.dataset.textColor) : null;

    if (index === 0) {
      const initialProps = {};
      if (bgColor)   initialProps.backgroundColor = bgColor;
      if (textColor) initialProps.color = textColor;
      if (Object.keys(initialProps).length > 0) {
        gsap.set(mainWrapper, initialProps);
      }
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      markers: DEBUG,
      id: 'color-' + index,
      onEnter: function() {
        const props = {};
        if (bgColor)   props.backgroundColor = bgColor;
        if (textColor) props.color = textColor;
        if (Object.keys(props).length > 0) {
          gsap.to(mainWrapper, { duration: 0.6, ...props });
        }
      },
      onLeaveBack: function() {
        const props = {};
        if (prevBgColor)   props.backgroundColor = prevBgColor;
        if (prevTextColor) props.color = prevTextColor;
        if (Object.keys(props).length > 0) {
          gsap.to(mainWrapper, { duration: 0.6, ...props });
        }
      },
    });
  });
}



document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready.then(() => {
    initScrollColors();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
});