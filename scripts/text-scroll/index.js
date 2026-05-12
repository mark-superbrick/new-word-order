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

  function initTextScroll(container) {
    whenGsapReady(function(){
      var gsap = window.gsap;
      var root = container || document;

      const wrappers = root.querySelectorAll('[data-text-scroll-wrap]');
      if (!wrappers || wrappers.length === 0 || !ENABLE) return;

      const reduceBlur = window.matchMedia('(max-width: 991px)').matches;
      const blurFull   = reduceBlur ? 'blur(0px)' : 'blur(40px)';

      wrappers.forEach((wrapper, wrapIndex) => {
        const items = wrapper.querySelectorAll('[data-text-scroll-item]');
        if (!items || items.length === 0) return;

        // All items start blurred and hidden
        gsap.set(items, { opacity: 0, filter: blurFull });

        items.forEach((item, i) => {
          ScrollTrigger.create({
            trigger: item,
            start: 'top center',
            markers: DEBUG,
            id: 'text-' + wrapIndex + '-' + i,
            onEnter: () => {
              items.forEach(el => el.classList.remove('is-active'));
              item.classList.add('is-active');
              gsap.to(item, { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' });
            },
            onEnterBack: () => {
              items.forEach(el => el.classList.remove('is-active'));
              item.classList.add('is-active');
              gsap.to(item, { opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' });
            },
          });
        });
      });
    });
  }



  window.initTextScroll = initTextScroll;

})();
