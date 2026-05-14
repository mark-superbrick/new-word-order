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

  function initTextBackgroundScroll(container) {
    whenGsapReady(function(){
      var gsap = window.gsap;
      var root = container || document;

      const wrappers = root.querySelectorAll('[data-text-bg-scroll-wrap]');
      if (!wrappers || wrappers.length === 0 || !ENABLE) return;

      const reduceBlur = window.matchMedia('(max-width: 991px)').matches;
      const blurFull   = reduceBlur ? 'blur(0px)' : 'blur(40px)';

      wrappers.forEach((wrapper, wrapIndex) => {
        const bgList   = wrapper.querySelector('[data-text-bg-scroll-list].is-bg-list');
        const textList = wrapper.querySelector('[data-text-bg-scroll-list].is-text-list');
        if (!bgList || !textList) return;

        const bgItems   = [...bgList.querySelectorAll('[data-text-bg-scroll-item]')];
        const textItems = [...textList.querySelectorAll('[data-text-bg-scroll-item]')];
        if (!bgItems.length || !textItems.length) return;

        // bg list: pinned for the full text-list scroll duration
        bgList.style.height        = '100vh';
        bgList.style.pointerEvents = 'none';
        bgList.style.zIndex        = '0';

        ScrollTrigger.create({
          trigger:          bgList,
          start:            'top top',
          endTrigger:       textItems[textItems.length - 1],
          end:              'bottom bottom',
          pin:              true,
          pinSpacing:       false,
          invalidateOnRefresh: true,
          markers:          DEBUG,
          id:               'bg-pin-' + wrapIndex,
        });

        // text list: pulls back up to overlap the pinned bg list (pin-spacer keeps the 100vh gap)
        textList.style.marginTop = '-100vh';
        textList.style.position  = 'relative';
        textList.style.zIndex    = '1';

        // bg items: stacked absolutely, first one visible
        bgItems.forEach((item, i) => {
          item.style.position = 'absolute';
          item.style.inset    = '0';
          item.style.width    = '100%';
          item.style.height   = '100%';
          gsap.set(item, {
            opacity: i === 0 ? 1 : 0,
            filter:  i === 0 ? 'blur(0px)' : blurFull,
          });
        });

        // text items: start hidden below
        gsap.set(textItems, { opacity: 0, filter: blurFull, y: 60 });

        function activateBg(index) {
          bgItems.forEach((item, i) => {
            gsap.to(item, {
              opacity:  i === index ? 1 : 0,
              filter:   i === index ? 'blur(0px)' : blurFull,
              duration: i === index ? 0.6 : 0.4,
              ease:     i === index ? 'power3.out' : 'power3.in',
            });
          });
        }

        textItems.forEach((textItem, i) => {
          ScrollTrigger.create({
            trigger: textItem,
            start:   'top center',
            markers: DEBUG,
            // pin:    true,
            // pinSpacing: true,
            id:      'text-bg-' + wrapIndex + '-' + i,
            onEnter: () => {
              activateBg(i);
              textItems.forEach(el => el.classList.remove('is-active'));
              textItem.classList.add('is-active');
              gsap.to(textItem, { opacity: 1, filter: 'blur(0px)', y: 0, duration: 0.6, ease: 'power3.out' });
            },
            onEnterBack: () => {
              activateBg(i);
              textItems.forEach(el => el.classList.remove('is-active'));
              textItem.classList.add('is-active');
            },
          });
        });
      });
    });
  }



  window.initTextBackgroundScroll = initTextBackgroundScroll;


})();
