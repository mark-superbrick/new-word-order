/**
 * example — attribute-driven starter script
 *
 * Usage in Webflow:
 *   Add data-example="true" to any element to log its text content on click.
 *
 * Staging CDN:
 *   https://cdn.jsdelivr.net/gh/YOUR_ORG/YOUR_REPO@staging/scripts/example/index.js
 *
 * Production CDN:
 *   https://cdn.jsdelivr.net/gh/YOUR_ORG/YOUR_REPO@main/scripts/example/index.js
 */

(function () {
  "use strict";

  function init() {
    var elements = document.querySelectorAll("[data-example]");

    elements.forEach(function (el) {
      el.addEventListener("click", function () {
        console.log("[example script]", el.textContent.trim());
      });
    });

    console.log("[example script] initialized on", elements.length, "element(s)");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
