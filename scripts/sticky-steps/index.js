(function() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  // let DEBUG = mainDomain == 'webflow';
  let DEBUG = false;
  const ENABLE = true;
    
  // Utility to wait for Swiper if not loaded yet
  function whenSwiperReady(cb){
    if(window.Swiper){
      return cb();
    }
    var t = setInterval(function(){
      if(window.Swiper){
        clearInterval(t);
        cb();
      }
    }, 50);
  }

  function initStickyStepsBasic(container) {  
    const instances = [];
    
    whenSwiperReady(function(){
      // var swiper = window.Swiper;

      var root = container || document;
          
      const containers = document.querySelectorAll("[data-sticky-steps-init]");
      if (!containers.length) return;
            
      containers.forEach((contain) => {
        const items = [...contain.querySelectorAll("[data-sticky-steps-item]")];
        if (!items.length) return;

        function updateSteps() {
          const viewportCenter = window.innerHeight / 2;

          let closestIndex = 0;
          let closestDistance = Infinity;

          items.forEach((item, index) => {
            const anchor = item.querySelector("[data-sticky-steps-anchor]");
            if (!anchor) return;

            const rect = anchor.getBoundingClientRect();
            const anchorCenter = rect.top + rect.height / 2;
            const distance = Math.abs(viewportCenter - anchorCenter);

            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          });

          items.forEach((item, index) => {
            let status = "active";

            if (index < closestIndex) status = "before";
            if (index > closestIndex) status = "after";

            item.setAttribute("data-sticky-steps-item-status", status);
          });
        }

        window.addEventListener("scroll", updateSteps);
        window.addEventListener("resize", updateSteps);

        requestAnimationFrame(updateSteps);
      });
      
    });
  }




  window.initStickyStepsBasic = initStickyStepsBasic;

  // Run on initial load
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(function(){ initStickyStepsBasic(document); }, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ initStickyStepsBasic(document); }, 60);
    });
  }

  // Hook into Barba if present so animations run after page enter
  function attachBarbaHook(){
    if(window.barba && window.barba.hooks){
      window.barba.hooks.afterEnter(function(data){
        initStickyStepsBasic(data.next.container || document);
      });
      return true;
    }
    return false;
  }

  if(!attachBarbaHook()){
    var poll = setInterval(function(){
      if(attachBarbaHook()){
        clearInterval(poll);
      }
    }, 50);
  }

})();
