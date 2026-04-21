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

  function initScrollColors(container) {
    const instances = [];
    var gsap = window.gsap;
    whenGsapReady(function(){
          

      var root = container || document;

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
      bgLayer.style.inset = "0px";
      bgLayer.style.zIndex = 0;
      bgLayer.style.pointerEvents = "none";
      bgLayer.style.transform = "translateZ(0)"; // promote to its own layer for smoother color transitions
      // bgLayer.style.willChange = "background-color, color";
      bgLayer.style.backgroundColor = `${existingBg}`;
      mainWrapper.prepend(bgLayer);

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
        if (!value || !value.trim()) return null;
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

      // On reload mid-page, ScrollTrigger won't fire onEnter for sections already
      // scrolled past. Find the last section whose trigger point is above the
      // current scroll position and apply its colors immediately.
      ScrollTrigger.refresh();
      const scrollY = window.scrollY;
      let activeBgColor   = null;
      let activeTextColor = null;
      sections.forEach((section) => {
        const triggerY = section.getBoundingClientRect().top + scrollY - window.innerHeight * 0.5;
        if (scrollY >= triggerY) {
          const bg   = resolveColor(section.dataset.bgColor);
          const text = resolveColor(section.dataset.textColor);
          if (bg)   activeBgColor   = bg;
          if (text) activeTextColor = text;
        }
      });
      if (activeBgColor)   gsap.set(bgLayer,     { backgroundColor: activeBgColor });
      if (activeTextColor) gsap.set(mainWrapper, { color: activeTextColor });
    })
  }



  // Run on initial load
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    // small timeout to let other initialisation complete
    setTimeout(function(){ initScrollColors(document); }, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ initScrollColors(document); }, 60);
    });
  }

  // Hook into Barba if present so animations run after page enter
  function attachBarbaHook(){
    if(window.barba && window.barba.hooks){
      // afterEnter gives us access to the new container
      window.barba.hooks.afterEnter(function(data){
        // animate items within the new container
        initScrollColors(data.next.container || document);
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
