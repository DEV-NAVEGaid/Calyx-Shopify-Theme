/*
 * Updates the cart in place: quantities and removals go to the Cart change
 * API, discount codes to the Cart update API. Each request carries the
 * `sections` parameter, so the response holds the freshly rendered cart
 * section. After each update it fires `cart:updated` on the document with
 * the new cart, so other sections (You may also like) can follow. Without
 * JavaScript the cart form still submits normally.
 */
class CartItems extends HTMLElement {
  #controller = null;

  connectedCallback() {
    this.addEventListener("change", this.#onChange);
    this.addEventListener("click", this.#onClick);
    this.addEventListener("submit", this.#onSubmit);
  }

  disconnectedCallback() {
    this.removeEventListener("change", this.#onChange);
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("submit", this.#onSubmit);
    this.#controller?.abort();
  }

  get #appliedCodes() {
    return [...this.querySelectorAll("[data-discount-remove]")].map((button) => button.dataset.discountRemove);
  }

  #onChange = (event) => {
    const input = event.target.closest('input[name="updates[]"]');
    if (input) {
      this.#change(input.dataset.line, input.value, input.id);
    }
  };

  #onClick = (event) => {
    const remove = event.target.closest(".cart-item__remove");
    const removeCode = event.target.closest("[data-discount-remove]");

    if (remove) {
      event.preventDefault();
      this.#change(remove.dataset.line, 0);
    } else if (removeCode) {
      const codes = this.#appliedCodes.filter((code) => code !== removeCode.dataset.discountRemove);
      this.#request(this.dataset.cartUpdateUrl, { discount: codes.join(",") });
    }
  };

  #onSubmit = (event) => {
    const form = event.target.closest("[data-cart-discount]");
    if (!form) {
      return;
    }
    event.preventDefault();

    const code = form.elements.discount.value.trim();
    if (code && !this.#appliedCodes.includes(code)) {
      this.#request(this.dataset.cartUpdateUrl, { discount: [...this.#appliedCodes, code].join(",") }, form.elements.discount.id);
    }
  };

  #change(line, quantity, focusId) {
    return this.#request(this.dataset.cartChangeUrl, { line: Number(line), quantity: Number(quantity) }, focusId);
  }

  async #request(url, body, focusId) {
    const { sectionId } = this.dataset;

    this.#controller?.abort();
    this.#controller = new AbortController();
    this.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(`${url}.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...body,
          sections: [sectionId],
          sections_url: window.location.pathname,
        }),
        signal: this.#controller.signal,
      });
      const cart = await response.json();

      if (!response.ok) {
        this.#showError(cart.description ?? cart.message);
        return;
      }

      const html = new DOMParser().parseFromString(cart.sections[sectionId], "text/html");
      const fresh = html.querySelector("cart-items");
      if (fresh) {
        this.replaceChildren(...fresh.childNodes);
      }

      for (const count of document.querySelectorAll("[data-cart-count]")) {
        count.textContent = cart.item_count;
        count.hidden = cart.item_count === 0;
      }

      document.dispatchEvent(new CustomEvent("cart:updated", { detail: { cart } }));

      if (focusId) {
        document.getElementById(focusId)?.focus();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    } finally {
      this.removeAttribute("aria-busy");
    }
  }

  #showError(message) {
    let alert = this.querySelector(".cart-items__error");
    if (!alert) {
      alert = document.createElement("p");
      alert.className = "cart-items__error";
      alert.setAttribute("role", "alert");
      this.prepend(alert);
    }
    alert.textContent = message;
  }
}

if (!customElements.get("cart-items")) {
  customElements.define("cart-items", CartItems);
}
