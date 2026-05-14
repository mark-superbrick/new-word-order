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

        function setActiveStep(activeIndex) {
          items.forEach((item, index) => {
            let status = "active";

            if (index < activeIndex) status = "before";
            if (index > activeIndex) status = "after";

            item.setAttribute("data-sticky-steps-item-status", status);
          });
        }

        items.forEach((item, index) => {
          const anchor = item.querySelector("[data-sticky-steps-anchor]");
          if (!anchor) return;

          ScrollTrigger.create({
            trigger: anchor,
            start: "top center",
            onEnter: () => setActiveStep(index),
            onEnterBack: () => setActiveStep(index)
          });
        });

        setActiveStep(0);
      });
      
    });
  }




  window.initStickyStepsBasic = initStickyStepsBasic;


})();
