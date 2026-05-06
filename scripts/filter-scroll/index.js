
(function() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  // let DEBUG = mainDomain == 'webflow';
  let DEBUG = false;
  const ENABLE = true;
    

  function initFilterScroll(container) {
    const instances = [];
    
    // whenGsapReady(function(){
      // var gsap = window.gsap;

      var root = container || document;
      
      const wraps = root.querySelectorAll('[data-filter-list-wrap]');
      if (!wraps.length || !ENABLE) {
        return;
      }
      console.log(`[filter-scroll] initialized on ${wraps.length} wrap(s)`);


      wraps.forEach(wrap => {

        const scroller = wrap.querySelector('[data-filter-scroll]');
        if (!scroller) return;

        // Update gradient visibility depending on scroll position
        function update() {
          var scrollLeft = scroller.scrollLeft;
          var maxScroll = scroller.scrollWidth - scroller.clientWidth;

          // Add small tolerance to avoid sub-pixel issues
          var tol = 1;

          if (scrollLeft > tol) wrap.classList.add('show-left'); else wrap.classList.remove('show-left');
          if (scrollLeft < maxScroll - tol) wrap.classList.add('show-right'); else wrap.classList.remove('show-right');
        }

        // Keyboard scrolling: allow arrow keys to nudge the scroller
        scroller.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowRight') { scroller.scrollBy({ left: 120, behavior: 'smooth' }); e.preventDefault(); }
          if (e.key === 'ArrowLeft')  { scroller.scrollBy({ left: -120, behavior: 'smooth' }); e.preventDefault(); }
        });

        scroller.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);

        // Allow focus so keyboard users can hit arrow keys
        scroller.tabIndex = scroller.tabIndex || 0;

        // Initialize after a tick to allow layout
        requestAnimationFrame(update);
      });
    // });
  }




  // Wait for Finsweet Attributes list/nest to finish before initialising
  window.fsAttributes = window.fsAttributes || [];
  window.fsAttributes.push(['list', function() {
    initFilterScroll(document);
  }]);

  // Hook into Barba if present so animations run after page enter
  function attachBarbaHook(){
    if(window.barba && window.barba.hooks){
      // afterEnter gives us access to the new container
      window.barba.hooks.afterEnter(function(data){
        // animate items within the new container
        initFilterScroll(data.next.container || document);
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
