/*
 * Transition into a product page: when a product card is clicked, its image
 * takes the name the product page's main image also has, so the browser grows
 * one into the other (styles in assets/page-transition.css). Clicks that open
 * a new tab or window are left alone. Turned on in Theme settings > Animations.
 */
const NAME = "product-media";
let named = null;

function clear() {
  if (named) named.style.removeProperty("view-transition-name");
  named = null;
  delete document.documentElement.dataset.transitionSource;
}

document.addEventListener("click", (event) => {
  const link = event.target.closest(".product-card__link");
  if (!link || event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target === "_blank") return;

  clear();
  const media = link.closest(".product-card")?.querySelector(".card-gallery");
  if (!media) return;

  media.style.setProperty("view-transition-name", NAME);
  named = media;
  document.documentElement.dataset.transitionSource = "card";
});

// Coming back with the browser's back button restores the page as it was left.
window.addEventListener("pageshow", clear);
