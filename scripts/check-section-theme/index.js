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

  function initCheckSectionThemeScroll(container) {
    whenGsapReady(function(){
      var gsap = window.gsap;
      var root = container || document;
      var navbar = document.querySelector("[data-menu-wrap]");
      var lastScrollY = window.scrollY;
      var navbarHidden = false;

      // Reset navbar position on re-init (Barba navigation)
      if (navbar) {
        gsap.set(navbar, { yPercent: 0 });
        navbarHidden = false;
      }

      function getTopLevelThemeSections() {
        return Array.from(root.querySelectorAll("[data-theme-section]")).filter(
          function(el) { return !el.parentElement.closest("[data-theme-section]"); }
        );
      }

      function checkThemeSection() {
        const themeSections = getTopLevelThemeSections();
        if (!themeSections || !themeSections.length || !ENABLE) return;

        // Get detection offset, in this case the navbar
        const navBarHeightEl = document.querySelector("[data-nav-bar-height]");
        const themeObserverOffset = navBarHeightEl ? navBarHeightEl.offsetHeight / 2 : 0;

        const firstSection = themeSections[0];
        const lastSection = themeSections[themeSections.length - 1];
        let firstSectionIsActive = false;

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

            if (themeSection === firstSection) {
              firstSectionIsActive = themeSection !== lastSection;
            }
          }
        });

        // Transparent navbar background when first section is active
        if (navbar) {
          const currentlyTransparent = navbar.getAttribute("data-nav-transparent") === "true";
          if (firstSectionIsActive !== currentlyTransparent) {
            navbar.setAttribute("data-nav-transparent", firstSectionIsActive ? "true" : "false");
          }
        }
      }

      function checkNavbarVisibility() {
        if (!navbar || !ENABLE) return;

        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;

        // First section "in view" = its bottom edge is still visible in the viewport
        const themeSections = getTopLevelThemeSections();
        let firstSectionInView = false;
        if (themeSections.length) {
          firstSectionInView = themeSections[0].getBoundingClientRect().bottom > 0;
        }

        if (scrollingDown && !firstSectionInView && !navbarHidden) {
          gsap.to(navbar, { yPercent: -100, duration: 0.3, ease: "power2.inOut" });
          navbarHidden = true;
        } else if ((!scrollingDown || firstSectionInView) && navbarHidden) {
          gsap.to(navbar, { yPercent: 0, duration: 0.3, ease: "power2.inOut" });
          navbarHidden = false;
        }

        lastScrollY = currentScrollY;
      }

      function onScroll() {
        checkThemeSection();
        checkNavbarVisibility();
      }

      function startThemeCheck() {
        document.addEventListener("scroll", onScroll);
      }

      // Initial check and start listening for scroll
      checkThemeSection();
      startThemeCheck();
    });
  }

  window.initCheckSectionThemeScroll = initCheckSectionThemeScroll;

})();
