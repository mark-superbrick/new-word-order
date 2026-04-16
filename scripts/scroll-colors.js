
function initScrollColors() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;

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
      if (bgColor)   gsap.set(mainWrapper, { backgroundColor: bgColor });
      if (textColor) gsap.set(mainWrapper, { color: textColor });
    }

    // Pre-build tween vars at setup time — avoids object allocation inside scroll callbacks.
    // overwrite: 'auto' kills any in-flight tween on the same properties so fast scrolling
    // through multiple sections never leaves competing tweens fighting over the same target.
    const enterVars    = { duration: 0.6, overwrite: 'auto' };
    const leaveBackVars = { duration: 0.6, overwrite: 'auto' };
    if (bgColor)      enterVars.backgroundColor    = bgColor;
    if (textColor)    enterVars.color               = textColor;
    if (prevBgColor)  leaveBackVars.backgroundColor = prevBgColor;
    if (prevTextColor) leaveBackVars.color          = prevTextColor;

    const hasEnter    = !!(bgColor || textColor);
    const hasLeaveBack = !!(prevBgColor || prevTextColor);

    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      markers: DEBUG,
      id: 'color-' + index,
      onEnter()     { if (hasEnter)     gsap.to(mainWrapper, enterVars); },
      onLeaveBack() { if (hasLeaveBack) gsap.to(mainWrapper, leaveBackVars); },
    });
  });
}



document.addEventListener("DOMContentLoaded", () => {
  document.fonts.ready.then(() => {
    initScrollColors();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });
});