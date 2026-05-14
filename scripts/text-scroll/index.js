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

      wrappers.forEach((wrapper, index) => {
        const items = wrapper.querySelectorAll('[data-text-scroll-item]');
        if (!items || items.length === 0) return;

        if (wrapper.hasAttribute('data-text-scroll-jacking')) {
          // Scroll-jacking: pin the wrapper and scrub through slides
          wrapper.style.height = "100vh";
          wrapper.style.overflow = "hidden";
          wrapper.style.position = "relative";

          items.forEach((el, idx) => {
            el.style.position = "absolute";
            el.style.height = "100vh";
            el.style.opacity = 0;
            el.style.zIndex = idx + 1;
            if (idx !== 0) {
              el.style.transform = "translateZ(0)";
            }
          });

          const totalItems = items.length;
          let lastSegment = -1;
          const isOnlyItem = totalItems === 1;

          gsap.set(items, { yPercent: 100, opacity: 0, filter: blurFull, overwrite: true });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: wrapper,
              start: 'top top',
              end: () => `+=${totalItems * window.innerHeight}`,
              scrub: true,
              pin: true,
              pinSpacing: true,
              invalidateOnRefresh: true,
              markers: DEBUG,
              id: 'text-' + index,
              onUpdate(self) {
                const progress = Math.max(0, Math.min(1, self.progress || 0));
                const segment = Math.min(totalItems - 1, Math.floor(progress * totalItems));
                if (segment === lastSegment) return;
                lastSegment = segment;
                items.forEach((el, i) => el.classList.toggle('is-active', i === segment));
              }
            }
          });

          if (items.length > 1) {
            gsap.set(items[0], { yPercent: 0, opacity: 1, filter: 'blur(0px)', overwrite: true });
          }

          const lastIndex = items.length - 1;
          items.forEach((item, i) => {
            const inTime = i;
            const outTime = i + 0.6;

            if (i !== 0 || isOnlyItem) {
              tl.to(item, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.6, ease: 'power3.out' }, inTime);
            } else {
              tl.set(item, { yPercent: 0, opacity: 1, filter: 'blur(0px)' }, inTime);
            }

            if (i !== lastIndex) {
              tl.to(item, { yPercent: -20, opacity: 0, filter: blurFull, duration: 0.6, ease: 'power3.in' }, outTime);
            } else {
              tl.set(item, { yPercent: 0, opacity: 1, filter: 'blur(0px)' }, outTime);
            }
          });

        } else {
          // Simple fade-in: ScrollTrigger per item
          gsap.set(items, { opacity: 0, filter: blurFull });

          items.forEach((item, i) => {
            ScrollTrigger.create({
              trigger: item,
              start: 'top center',
              markers: DEBUG,
              id: 'text-' + index + '-' + i,
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
        }
      });
    });
  }



  window.initTextScroll = initTextScroll;

})();
