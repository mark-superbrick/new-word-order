(function() {

  const host = window.location.host;
  const mainDomain = host.split('.')[1];
  // let DEBUG = mainDomain == 'webflow';
  let DEBUG = false;
  const ENABLE = true;

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

  function initStackingImageHover(container) {
    whenGsapReady(function(){
      var gsap = window.gsap;
      var root = container || document;

      const wrappers = root.querySelectorAll('.mwg_effect036');
      if (!wrappers || wrappers.length === 0 || !ENABLE) return;

      wrappers.forEach((wrapper) => {
        const hovers = wrapper.querySelectorAll('.sentence strong');
        if (!hovers.length) return;

        let interval, incr = 0;
        let activeImages = [];

        function displayImages(distX, distY, urls) {
          clearInterval(interval);
          activeImages.forEach(image => {
            gsap.killTweensOf(image);
            if (image.parentNode) wrapper.removeChild(image);
          });
          activeImages = [];
          incr = 0;

          interval = setInterval(() => {
            if (incr >= urls.length) { clearInterval(interval); return; }
            let image = document.createElement('img');
            image.src = urls[incr];
            wrapper.appendChild(image);
            activeImages.push(image);

            gsap.fromTo(image, {
              xPercent: -50,
              yPercent: -50,
              x: distX + (Math.random() - 0.5) * 50,
              y: distY,
              scale: 0,
            }, {
              scale: 1,
              ease: 'back.out(3)',
              duration: 0.4,
            });

            incr++;
          }, 150);
        }

        function stopImages() {
          clearInterval(interval);
          activeImages.forEach(image => {
            gsap.to(image, {
              opacity: 0,
              duration: 0.3,
              onComplete: () => {
                if (image.parentNode) wrapper.removeChild(image);
                activeImages = activeImages.filter(img => img !== image);
              },
            });
          });
          // activeImages is NOT cleared here — displayImages will kill any still-fading images
        }

        // Images are position:absolute inside wrapper — coords must be wrapper-relative
        wrapper.style.position = 'relative';

        // Set each item to full viewport height
        wrapper.querySelectorAll('[data-stacking-image-item]').forEach(item => {
          item.style.height = '100vh';
        });

        hovers.forEach(el => {
          const item = el.closest('[data-stacking-image-item]');
          const itemUrls = item
            ? [...item.querySelectorAll('.medias img')].map(img => img.getAttribute('src'))
            : [];

          el.addEventListener('mouseenter', () => {
            if (!itemUrls.length) return;
            const wrapBound = wrapper.getBoundingClientRect();
            const bound = el.getBoundingClientRect();
            const distX = bound.left + bound.width / 2 - wrapBound.left;
            const distY = bound.top + bound.height / 2 - wrapBound.top;
            displayImages(distX, distY, itemUrls);
          });
          el.addEventListener('mouseleave', () => {
            stopImages();
          });
        });
      });
    });
  }



  window.initStackingImageHover = initStackingImageHover;


})();
