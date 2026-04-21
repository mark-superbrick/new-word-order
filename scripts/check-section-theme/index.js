
function initCheckSectionThemeScroll() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  let DEBUG = mainDomain == 'webflow';
//   let DEBUG = false;
  const ENABLE = true;


  // Get detection offset, in this case the navbar
  const navBarHeight = document.querySelector("[data-nav-bar-height]")
  const themeObserverOffset = navBarHeight ? navBarHeight.offsetHeight / 2 : 0;

  function checkThemeSection() {
    const themeSections = document.querySelectorAll("[data-theme-section]");
    if (!themeSections || !themeSections.length || !ENABLE) return;

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
}

// Initialize Check Section Theme on Scroll
document.addEventListener('DOMContentLoaded', () => {
  initCheckSectionThemeScroll();
});