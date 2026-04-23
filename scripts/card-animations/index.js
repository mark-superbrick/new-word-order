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

  function initCardAnimation(container) {
    const instances = [];
    
    whenGsapReady(function(){
      var gsap = window.gsap;

      var root = container || document;
      
      var cards = root.querySelectorAll("[data-card]");
      if (!cards.length) {
        // console.log("[card-animations] initialized on 0 element(s)");
        return;
      }
      // Disable blur on tablet and smaller — blur is expensive to paint and visually distracting
      // at smaller sizes. Webflow tablet breakpoint is 991px.
      const reduceBlur = window.matchMedia('(max-width: 991px)').matches;
      const blurFull   = reduceBlur ? 'blur(0px)' : 'blur(20px)'; 

      // --- Scroll-in: slide up on enter, stay ---
      gsap.set(cards, { filter: blurFull, y: 40, opacity: 0 });

      cards.forEach(function (card) {
        var image = card.querySelector("[data-card-visual] .image_component");
        if (image) gsap.set(image, { scale: 1.2 });
      });

      ScrollTrigger.batch(cards, {
        start: "top 90%",
        once: true,
        onEnter: function (batch) {
          gsap.to(batch, {
            y: 0,
            opacity: 1,
            filter: 'blur(0px)',
            duration: 1.5,
            ease: "power3.out",
            stagger: 0.1,
            overwrite: true,
          });
          batch.forEach(function (card) {
            var image = card.querySelector("[data-card-visual] .image_component");
            if (image) {
              gsap.to(image, { scale: 1, duration: 1.5, ease: "power3.out", overwrite: true });
            }
          });
        },
      });

      // --- Hover effects ---
      cards.forEach(function (card) {
        var image = card.querySelector("[data-card-visual] .image_component");
        var arrow = card.querySelector("[data-card-icon]");

        card.addEventListener("mouseenter", function () {
          // gsap.to(card, { y: -6, duration: 0.35, ease: "power2.out", overwrite: "auto" });
          if (image) {
            gsap.to(image, { scale: 1.04, duration: 0.45, ease: "power2.out", overwrite: "auto" });
          }
          if (arrow) {
            gsap.to(arrow, { x: 4, duration: 0.3, ease: "power2.out", overwrite: "auto" });
          }
        });

        card.addEventListener("mouseleave", function () {
          // gsap.to(card, { y: 0, duration: 0.4, ease: "power2.inOut", overwrite: "auto" });
          if (image) {
            gsap.to(image, { scale: 1, duration: 0.45, ease: "power2.inOut", overwrite: "auto" });
          }
          if (arrow) {
            gsap.to(arrow, { x: 0, duration: 0.3, ease: "power2.inOut", overwrite: "auto" });
          }
        });
      });

      // console.log("[card-animations] initialized on", cards.length, "element(s)");
    });
  }




  // Run on initial load
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    // small timeout to let other initialisation complete
    setTimeout(function(){ initCardAnimation(document); }, 60);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ initCardAnimation(document); }, 60);
    });
  }

  // Hook into Barba if present so animations run after page enter
  function attachBarbaHook(){
    if(window.barba && window.barba.hooks){
      // afterEnter gives us access to the new container
      window.barba.hooks.afterEnter(function(data){
        // animate items within the new container
        initCardAnimation(data.next.container || document);
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
