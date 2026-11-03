/*
 * Quick shop. A `[data-quick-add-url]` button opens this modal and loads
 * the product's `quick-view` section into it. The add-to-cart form inside is
 * handled by the cart drawer, which fires `cart:added` on success; the modal
 * closes then so the drawer can take over.
 */
class QuickAddModal extends HTMLElement {
  #controller = null;

  get #dialog() {
    return this.querySelector("dialog");
  }

  get #content() {
    return this.querySelector("[data-quick-add-content]");
  }

  connectedCallback() {
    document.addEventListener("click", this.#onDocumentClick);
    document.addEventListener("cart:added", this.#onCartAdded);
    this.addEventListener("click", this.#onClick);
    this.addEventListener("scroll", this.#onScroll, true);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.#onDocumentClick);
    document.removeEventListener("cart:added", this.#onCartAdded);
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("scroll", this.#onScroll, true);
    this.#controller?.abort();
  }

  async open(productUrl) {
    this.#controller?.abort();
    this.#controller = new AbortController();

    this.#content.replaceChildren();
    this.setAttribute("aria-busy", "true");
    this.#dialog.showModal();

    const url = new URL(productUrl, window.location.origin);
    url.searchParams.set("section_id", "quick-view");

    try {
      const response = await fetch(url, { signal: this.#controller.signal });
      const html = new DOMParser().parseFromString(await response.text(), "text/html");
      const section = html.getElementById("shopify-section-quick-view");
      if (section) {
        this.#content.replaceChildren(section);
        window.Shopify?.PaymentButton?.init();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    } finally {
      this.removeAttribute("aria-busy");
    }
  }

  close() {
    this.#controller?.abort();
    this.#dialog.close();
  }

  #onDocumentClick = (event) => {
    const trigger = event.target.closest("[data-quick-add-url]");
    if (trigger) {
      event.preventDefault();
      this.open(trigger.dataset.quickAddUrl);
    }
  };

  #onCartAdded = () => {
    if (this.#dialog.open) {
      this.close();
    }
  };

  #onClick = (event) => {
    // A click on the dialog element itself lands on its backdrop.
    if (event.target === this.#dialog || event.target.closest("[data-quick-add-close]")) {
      this.close();
      return;
    }

    const dot = event.target.closest("[data-slide]");
    const slides = this.querySelector("[data-quick-view-slides]");
    if (dot && slides) {
      slides.scrollTo({ left: slides.clientWidth * Number(dot.dataset.slide), behavior: "smooth" });
    }
  };

  // Keeps the active dot in step with the image scrolled into view.
  #onScroll = (event) => {
    const slides = event.target;
    if (!(slides instanceof Element) || !slides.matches("[data-quick-view-slides]")) {
      return;
    }

    const index = Math.round(slides.scrollLeft / slides.clientWidth);
    for (const dot of this.querySelectorAll("[data-slide]")) {
      dot.toggleAttribute("aria-current", Number(dot.dataset.slide) === index);
    }
  };
}

if (!customElements.get("quick-add-modal")) {
  customElements.define("quick-add-modal", QuickAddModal);
}
