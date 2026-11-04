/*
 * Product recommendations: fetches this section from the product
 * recommendations route and swaps in its content. Stays empty when Shopify
 * has nothing to recommend. On the cart page (`data-cart-url`) it loads
 * again on `cart:updated` (assets/cart-items.js) and `cart:added`: it first
 * renders itself for the current cart, since the product the
 * recommendations start from and the products to leave out may have
 * changed.
 */
class ProductRecommendations extends HTMLElement {
  #controller = null;

  connectedCallback() {
    if (this.dataset.cartUrl) {
      document.addEventListener("cart:updated", this.#onCartChange);
      document.addEventListener("cart:added", this.#onCartChange);
    }

    if (this.children.length === 0 && this.dataset.url) {
      this.#load(this.dataset.url);
    }
  }

  disconnectedCallback() {
    document.removeEventListener("cart:updated", this.#onCartChange);
    document.removeEventListener("cart:added", this.#onCartChange);
    this.#controller?.abort();
  }

  async #fetchFresh(url, signal) {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return undefined;
    }
    const html = new DOMParser().parseFromString(await response.text(), "text/html");
    return html.querySelector("product-recommendations");
  }

  async #load(url, signal) {
    const fresh = await this.#fetchFresh(url, signal);
    if (fresh?.children.length) {
      this.replaceChildren(...fresh.childNodes);
    } else if (fresh !== undefined) {
      this.replaceChildren();
    }
  }

  #onCartChange = async () => {
    this.#controller?.abort();
    this.#controller = new AbortController();
    const { signal } = this.#controller;

    try {
      const url = new URL(this.dataset.cartUrl, window.location.origin);
      url.searchParams.set("section_id", this.dataset.sectionId);
      // Empty when the cart is: there is no product to start from.
      const shell = await this.#fetchFresh(url, signal);
      if (shell === undefined) {
        return;
      }
      if (shell?.dataset.url) {
        await this.#load(shell.dataset.url, signal);
      } else {
        this.replaceChildren();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    }
  };
}

if (!customElements.get("product-recommendations")) {
  customElements.define("product-recommendations", ProductRecommendations);
}
