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

  function initMarqueeSwiperSlider(container) {  
    const instances = [];
    
    whenSwiperReady(function(){
      // var swiper = window.Swiper;

      var root = container || document;
      
      var cards = root.querySelectorAll(".swiper-slide.is-marquee-swiper");
      if (!cards.length) {
        // console.log("[card-animations] initialized on 0 element(s)");
        return;
      }
        
      const swiperSliderGroups = document.querySelectorAll(".is-marquee-swiper[data-swiper-group]");
      
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
          
          speed: 600,
          centeredSlides: true,
          slideActiveClass: 'is-active',    
          effect: "coverflow",
          
          
          slidesPerView: "auto",
          coverflowEffect: {
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 1,
            slideShadows: true,
          },
          spaceBetween: 60,
          loop: true,
          duration: 600,
          autoplay: {
            delay: 3000,
            disableOnInteraction: false,
          },
          mousewheel: false,
          grabCursor: true,
          scrollbar: {
            el: '.swiper-scrollbar',
            hide: false,
          },
          // breakpoints: {
          //   // when window width is >= 480px
          //   480: {
          //     slidesPerView: 1.8,
          //   },
          //   // when window width is >= 992px
          //   992: {
          //     slidesPerView: 3,
          //   },
          //   1200: {
          //     slidesPerView: 4,
          //     spaceBetween: 80,
          //   }
          // },
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




  window.initMarqueeSwiperSlider = initMarqueeSwiperSlider;


})();
