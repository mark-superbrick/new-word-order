
function initScrollColors() {
  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
  // let DEBUG = false;
  const ENABLE = true;  // <-- master toggle for hero scroll animations; set to false to disable all related code, including ScrollTrigger creation and entry animation


  // Ensure GSAP + ScrollTrigger are available before proceeding.
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Retry shortly if scripts haven't loaded yet.
    setTimeout(initScrollColors, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Prefer explicit #main if present, otherwise fall back to common wrappers.
  const mainWrapper = document.getElementById('main') || document.querySelector('main') || document.querySelector('.main-wrapper') || document.querySelector('.page-wrapper') || document.body;
  if (!mainWrapper || !ENABLE) {
    return;
  }

  // Animate background-color on a dedicated child layer instead of mainWrapper directly.
  // Strategy: read mainWrapper's current background, clear it to transparent, then paint
  // on an absolutely-positioned child. The child is bounded to mainWrapper's area so its
  // repaint rect never reaches the scrollbar track.
  const existingBg = getComputedStyle(mainWrapper).backgroundColor;
  mainWrapper.style.backgroundColor = 'transparent';
  if (getComputedStyle(mainWrapper).position === 'static') {
    mainWrapper.style.position = 'relative';
  }
  const bgLayer = document.createElement('div');
  // bgLayer.style.cssText = `position:absolute;inset:0;pointer-events:none;will-change:background-color,text-color;background-color:${existingBg};`;
  bgLayer.style.position = "absolute";
  bgLayer.style.inset = 0;
  bgLayer.style.zIndex = 0;
  bgLayer.style.pointerEvents = "none";
  bgLayer.style.transform = "translateZ(0)"; // promote to its own layer for smoother color transitions
  // bgLayer.style.willChange = "background-color, color";
  bgLayer.style.backgroundColor = `${existingBg}`;
  mainWrapper.prepend(bgLayer);

  // Reduce unnecessary ScrollTrigger callback firings.
  ScrollTrigger.config({ limitCallbacks: true });

  const rootStyles  = getComputedStyle(document.documentElement);

  const colorMap = {
    'offwhite':  '--base-color--offwhite',
    'black':     '--base-color-neutral--black',
    'purple':    '--base-color--purple',
    'orange':    '--base-color--orange',
    'blue':      '--base-color--blue',
    'lime':      '--base-color--lime',
    'violet':    '--base-color--violet',
    'cobalt':    '--base-color--cobalt',
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
      if (bgColor)   gsap.set(bgLayer,     { backgroundColor: bgColor });
      if (textColor) gsap.set(mainWrapper, { color: textColor });
    }

    // Pre-build tween vars at setup time — avoids object allocation inside scroll callbacks.
    // backgroundColor goes to bgLayer (fixed overlay); color goes to mainWrapper (text).
    // overwrite: 'auto' kills any in-flight tween on the same property before starting the new one.
    const enterBgVars    = bgColor      ? { duration: 0.6, overwrite: 'auto', backgroundColor: bgColor }      : null;
    const enterTextVars  = textColor    ? { duration: 0.6, overwrite: 'auto', color: textColor }               : null;
    const leaveBgVars    = prevBgColor  ? { duration: 0.6, overwrite: 'auto', backgroundColor: prevBgColor }  : null;
    const leaveTextVars  = prevTextColor ? { duration: 0.6, overwrite: 'auto', color: prevTextColor }          : null;

    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      markers: DEBUG,
      id: 'color-' + index,
      onEnter() {
        if (enterBgVars)   gsap.to(bgLayer,     enterBgVars);
        if (enterTextVars) gsap.to(mainWrapper, enterTextVars);
      },
      onLeaveBack() {
        if (leaveBgVars)   gsap.to(bgLayer,     leaveBgVars);
        if (leaveTextVars) gsap.to(mainWrapper, leaveTextVars);
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