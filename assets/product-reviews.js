/*
 * Product reviews: shows the first three written reviews and a button that
 * reveals three more at a time. In the theme editor every review shows.
 */
const STEP = 3;

class ProductReviews extends HTMLElement {
  connectedCallback() {
    if (window.Shopify?.designMode) {
      return;
    }
    this.#reviews.forEach((review, i) => (review.hidden = i >= STEP));
    this.#button.hidden = this.#reviews.length <= STEP;
    this.#button.addEventListener("click", this.#onMore);
  }

  get #reviews() {
    return [...this.querySelectorAll("[data-review]")];
  }

  get #button() {
    return this.querySelector("[data-reviews-more]");
  }

  #onMore = () => {
    const hidden = this.#reviews.filter((review) => review.hidden);
    hidden.slice(0, STEP).forEach((review) => (review.hidden = false));
    this.#button.hidden = hidden.length <= STEP;
  };
}

if (!customElements.get("product-reviews")) {
  customElements.define("product-reviews", ProductReviews);
}
