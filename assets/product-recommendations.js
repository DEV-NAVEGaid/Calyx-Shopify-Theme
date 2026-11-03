/*
 * Product recommendations: fetches this section from the product
 * recommendations route once and swaps in its content. Stays empty when
 * Shopify has nothing to recommend.
 */
class ProductRecommendations extends HTMLElement {
  async connectedCallback() {
    if (this.children.length > 0 || !this.dataset.url) {
      return;
    }

    const response = await fetch(this.dataset.url);
    if (!response.ok) {
      return;
    }

    const html = new DOMParser().parseFromString(await response.text(), "text/html");
    const fresh = html.querySelector("product-recommendations");
    if (fresh?.children.length) {
      this.replaceChildren(...fresh.childNodes);
    }
  }
}

if (!customElements.get("product-recommendations")) {
  customElements.define("product-recommendations", ProductRecommendations);
}
