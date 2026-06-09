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

  function initQuaternarySwiperSlider(container) {
    whenSwiperReady(function(){
      var root = container || document;

      const swiperSliderGroups = root.querySelectorAll(".is-quaternary-swiper[data-swiper-group]");
      if (!swiperSliderGroups.length) {
        return;
      }

      swiperSliderGroups.forEach((swiperGroup) => {
        const swiperSliderWrap = swiperGroup.querySelector("[data-swiper-wrap]");
        if(!swiperSliderWrap) return;

        // const prevButton = swiperGroup.querySelector("[data-swiper-prev]");
        // const nextButton = swiperGroup.querySelector("[data-swiper-next]");

        // destroy any existing instance on this element first
        if (swiperSliderWrap.swiper) {
          swiperSliderWrap.swiper.destroy(true, true);
        }

        const swiper = new Swiper(swiperSliderWrap, {
          slidesPerView: "auto",
          speed: 600,
          mousewheel: false,
          grabCursor: true,
          spaceBetween: 32,
          breakpoints: {
            // when window width is >= 480px
            // 480: {
            //   slidesPerView: 1.25,
            // },
            // when window width is >= 992px
            992: {
              slidesPerView: 4,
            }
          },
          // navigation: {
          //   nextEl: nextButton,
          //   prevEl: prevButton,
          // },
          // pagination: {
          //   el: '.swiper-pagination',
          //   type: 'bullets',
          //   clickable: true
          // },
          // keyboard: {
          //   enabled: true,
          //   onlyInViewport: false,
          // },
        });

      });

    });
  }




  window.initQuaternarySwiperSlider = initQuaternarySwiperSlider;


})();
