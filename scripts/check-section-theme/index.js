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

  function initCheckSectionThemeScroll(container) {
    const instances = [];
    
    whenGsapReady(function(){
      var gsap = window.gsap;

      var root = container || document;


      function checkThemeSection() {
        const themeSections = root.querySelectorAll("[data-theme-section]");
        if (!themeSections || !themeSections.length || !ENABLE) return;
        
        // Get detection offset, in this case the navbar
        const navBarHeight = document.querySelector("[data-nav-bar-height]")
        const themeObserverOffset = navBarHeight ? navBarHeight.offsetHeight / 2 : 0;

        themeSections.forEach(function(themeSection) {
          const rect = themeSection.getBoundingClientRect();
          const themeSectionTop = rect.top;
          const themeSectionBottom = rect.bottom;

          // If the offset is between the top & bottom of the current section
          if (themeSectionTop <= themeObserverOffset && themeSectionBottom >= themeObserverOffset) {
            // Check [data-theme-section]
            const themeSectionActive = themeSection.getAttribute("data-theme-section");
            document.querySelectorAll("[data-theme-nav]").forEach(function(elem) {
              if (elem.getAttribute("data-theme-nav") !== themeSectionActive) {
                elem.setAttribute("data-theme-nav", themeSectionActive);
              }
            });

            // // Check [data-bg-section]
            // const bgSectionActive = themeSection.getAttribute("data-bg-section");
            // document.querySelectorAll("[data-bg-nav]").forEach(function(elem) {
            //   if (elem.getAttribute("data-bg-nav") !== bgSectionActive) {
            //     elem.setAttribute("data-bg-nav", bgSectionActive);
            //   }
            // });
          }
        });
      }

      function startThemeCheck() {
        document.addEventListener("scroll", checkThemeSection);
      }

      // Initial check and start listening for scroll
      checkThemeSection();
      startThemeCheck();
    });
  }

  // Run on initial load
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    // small timeout to let other initialisation complete
    setTimeout(function(){ initCheckSectionThemeScroll(document); }, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ initCheckSectionThemeScroll(document); }, 60);
    });
  }

  // Hook into Barba if present so animations run after page enter
  function attachBarbaHook(){
    if(window.barba && window.barba.hooks){
      // afterEnter gives us access to the new container
      window.barba.hooks.afterEnter(function(data){
        // animate items within the new container
        initCheckSectionThemeScroll(data.next.container || document);
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
