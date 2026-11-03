/*
 * Sticky add to cart: shows the bar once the product form's own submit
 * button has scrolled up out of view, and hides it while that button (or
 * anything above it) is on screen. Checked on every scroll and resize; it
 * reads one position, so it stays cheap. The bar's button submits the same
 * product form, so it follows the selected variant.
 */
class StickyAddToCart extends HTMLElement {
  #button = null;

  connectedCallback() {
    this.#button = document.querySelector(
      `button[type="submit"][form="${this.dataset.form}"]:not(sticky-add-to-cart *)`
    );
    if (!this.#button) {
      return;
    }
    window.addEventListener("scroll", this.#update, { passive: true });
    window.addEventListener("resize", this.#update);
    this.#update();
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this.#update);
    window.removeEventListener("resize", this.#update);
  }

  #update = () => {
    // The button's bottom edge above the top of the screen: scrolled past.
    this.hidden = this.#button.getBoundingClientRect().bottom > 0;
  };
}

if (!customElements.get("sticky-add-to-cart")) {
  customElements.define("sticky-add-to-cart", StickyAddToCart);
}
