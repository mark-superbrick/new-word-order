/**
 * card-animations — scroll-in and hover effects for primary cards
 *
 * Usage in Webflow:
 *   Add data-card to any .primary_card element to opt in.
 *   Expected inner elements:
 *     .primary_card_visual  — image wrapper (overflow: hidden)
 *     .image_component      — image inside the wrapper (gets scale on hover)
 *     .primary_card_icon    — arrow icon (slides right on hover)
 *
 * Staging CDN:
 *   https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@staging/scripts/card-animations/index.js
 *
 * Production CDN:
 *   https://cdn.jsdelivr.net/gh/mark-superbrick/new-word-order@main/scripts/card-animations/index.js
 */

(function () {
  "use strict";

  function init() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      console.warn("[card-animations] GSAP or ScrollTrigger not found — skipping.");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    var cards = document.querySelectorAll("[data-card]");
    if (!cards.length) {
      console.log("[card-animations] initialized on 0 element(s)");
      return;
    }

    // --- Scroll-in: slide up on enter, stay ---
    gsap.set(cards, { y: 40, opacity: 0 });

    ScrollTrigger.batch(cards, {
      start: "top 90%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          y: 0,
          opacity: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          overwrite: true,
        });
      },
    });

    // --- Hover effects ---
    cards.forEach(function (card) {
      var image = card.querySelector(".primary_card_visual .image_component");
      var arrow = card.querySelector(".primary_card_icon");

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

    console.log("[card-animations] initialized on", cards.length, "element(s)");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
