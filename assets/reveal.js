/*
 * Fades sections in as they scroll into view (Theme settings > Animations).
 * Only sections that start below the fold are hidden, so the first screen
 * never flashes. A section is shown once its top passes 90% of the viewport,
 * which also covers jumps past it (anchors, the End key). Skipped in the
 * theme editor and for reduced motion.
 */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!reducedMotion && !window.Shopify?.designMode) {
  const hidden = new Set();

  for (const section of document.querySelectorAll("main > .shopify-section")) {
    if (section.getBoundingClientRect().top > window.innerHeight) {
      section.dataset.reveal = "hidden";
      hidden.add(section);
    }
  }

  const revealInView = () => {
    for (const section of hidden) {
      if (section.getBoundingClientRect().top < window.innerHeight * 0.9) {
        section.dataset.reveal = "shown";
        hidden.delete(section);
      }
    }

    if (hidden.size === 0) {
      window.removeEventListener("scroll", revealInView);
      window.removeEventListener("resize", revealInView);
    }
  };

  window.addEventListener("scroll", revealInView, { passive: true });
  window.addEventListener("resize", revealInView, { passive: true });
}
