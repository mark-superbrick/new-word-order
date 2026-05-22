(function() {

  let DEBUG = false;
  const ENABLE = true;

  function whenGsapReady(cb) {
    if (window.gsap) return cb();
    var t = setInterval(function() {
      if (window.gsap) { clearInterval(t); cb(); }
    }, 50);
  }

  function initVimeoBGVideo(container) {
    whenGsapReady(function() {
      var gsap = window.gsap;

      var root = container || document;

      // Select all elements that have [data-vimeo-bg-init]
      const vimeoPlayers = root.querySelectorAll('[data-vimeo-bg-init]');
      if (!vimeoPlayers.length || !ENABLE) return;

      vimeoPlayers.forEach(function(vimeoElement, index) {
        
        // Add Vimeo URL ID to the iframe [src]
        // Looks like: https://player.vimeo.com/video/1019191082
        const vimeoVideoID = vimeoElement.getAttribute('data-vimeo-video-id');
        if (!vimeoVideoID) return;
        const vimeoVideoURL = `https://player.vimeo.com/video/${vimeoVideoID}?api=1&background=1&autoplay=1&loop=1&muted=1`;
        vimeoElement.querySelector('iframe').setAttribute('src', vimeoVideoURL);

        // Assign an ID to each element
        const videoIndexID = 'vimeo-bg-basic-index-' + index;
        vimeoElement.setAttribute('id', videoIndexID);

        const iframeID = vimeoElement.id;
        const player = new Vimeo.Player(iframeID);

        player.setVolume(0);
        
        player.on('bufferend', function() {
          vimeoElement.setAttribute('data-vimeo-activated', 'true');
          vimeoElement.setAttribute('data-vimeo-loaded', 'true');
        });
        
        // Update Aspect Ratio if [data-vimeo-update-size="true"]
        let videoAspectRatio;
        if (vimeoElement.getAttribute('data-vimeo-update-size') === 'true') {
          player.getVideoWidth().then(function(width) {
            player.getVideoHeight().then(function(height) {
              videoAspectRatio = height / width;
              const beforeEl = vimeoElement.querySelector('.vimeo-bg__before');
              if (beforeEl) {
                beforeEl.style.paddingTop = videoAspectRatio * 100 + '%';
              }
            });
          });
        }

        // Function to adjust video sizing
        function adjustVideoSizing() {
          const containerAspectRatio = (vimeoElement.offsetHeight / vimeoElement.offsetWidth) * 100;

          const iframeWrapper = vimeoElement.querySelector('.vimeo-bg__iframe-wrapper');
          if (iframeWrapper && videoAspectRatio) {
            if (containerAspectRatio > videoAspectRatio * 100) {
              iframeWrapper.style.width = `${(containerAspectRatio / (videoAspectRatio * 100)) * 100}%`;
            } else {
              iframeWrapper.style.width = '';
            }
          }
        }
        // Adjust video sizing initially
        if (vimeoElement.getAttribute('data-vimeo-update-size') === 'true') {
          adjustVideoSizing();
          player.getVideoWidth().then(function() {
            player.getVideoHeight().then(function() {
              adjustVideoSizing();
            });
          });
        } else {
          adjustVideoSizing();
        }
        // Adjust video sizing on resize
        window.addEventListener('resize', adjustVideoSizing);
      });
    });
  }

  window.initVimeoBGVideo = initVimeoBGVideo;

})();
