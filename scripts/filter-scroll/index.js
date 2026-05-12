
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

        // --- Drag to scroll ---
        var dragStartX = 0;
        var dragScrollLeft = 0;
        var isDragging = false;
        var dragMoved = false;
        var pendingPointerId = null;
        var DRAG_THRESHOLD = 5;

        scroller.addEventListener('pointerdown', function (e) {
          if (e.button !== 0) return;
          dragMoved = false;
          dragStartX = e.clientX;
          dragScrollLeft = scroller.scrollLeft;
          pendingPointerId = e.pointerId;
          scroller.style.scrollBehavior = 'auto';
          hideHint();
        });

        scroller.addEventListener('pointermove', function (e) {
          if (pendingPointerId === null || e.pointerId !== pendingPointerId) return;
          var dx = e.clientX - dragStartX;
          if (!isDragging && Math.abs(dx) > DRAG_THRESHOLD) {
            // Only capture the pointer once we're sure this is a drag,
            // so clicks on checkboxes/buttons still fire normally.
            isDragging = true;
            dragMoved = true;
            scroller.setPointerCapture(e.pointerId);
            scroller.classList.add('is-dragging');
          }
          if (!isDragging) return;
          scroller.scrollLeft = dragScrollLeft - dx;
          update();
        });

        function endDrag() {
          if (!isDragging && pendingPointerId === null) return;
          isDragging = false;
          pendingPointerId = null;
          scroller.classList.remove('is-dragging');
          scroller.style.scrollBehavior = '';
        }

        scroller.addEventListener('pointerup', endDrag);
        scroller.addEventListener('pointercancel', endDrag);

        // Swallow click if the pointer actually moved (prevents filter misfires)
        scroller.addEventListener('click', function (e) {
          if (dragMoved) {
            e.stopPropagation();
            e.preventDefault();
            dragMoved = false;
          }
        }, true);

        // --- Scroll hint ---
        var hint = document.createElement('div');
        hint.setAttribute('data-filter-scroll-hint', '');
        var arrowL = document.createElement('span'); arrowL.className = 'hint-arrow'; arrowL.textContent = '←';
        var arrowR = document.createElement('span'); arrowR.className = 'hint-arrow'; arrowR.textContent = '→';
        hint.appendChild(arrowL);
        hint.appendChild(document.createTextNode(' Drag / Scroll '));
        hint.appendChild(arrowR);
        wrap.style.position = wrap.style.position || 'relative';
        wrap.appendChild(hint);

        function showHint() {
          var maxScroll = scroller.scrollWidth - scroller.clientWidth;
          if (maxScroll > DRAG_THRESHOLD) hint.classList.add('is-visible');
        }

        function hideHint() {
          hint.classList.remove('is-visible');
        }

        requestAnimationFrame(function () {
          showHint();
          scroller.addEventListener('scroll', hideHint, { once: true, passive: true });
        });

        // Initialize gradient state after layout
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
