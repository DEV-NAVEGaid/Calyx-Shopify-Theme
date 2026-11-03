/*
 * The cart drawer. It opens from any `[data-cart-drawer-trigger]` link,
 * catches add-to-cart form submissions, and updates line quantities. Every
 * cart request asks for the `cart-drawer` section, so the drawer is always
 * re-rendered by the server instead of being rebuilt in JavaScript.
 * Without JavaScript, the trigger links and forms fall back to the cart page.
 */
class CartDrawer extends HTMLElement {
  #controller = null;

  get #dialog() {
    return this.querySelector("dialog");
  }

  get #sectionId() {
    return this.dataset.sectionId;
  }

  connectedCallback() {
    document.addEventListener("click", this.#onDocumentClick);
    document.addEventListener("submit", this.#onDocumentSubmit);
    this.addEventListener("click", this.#onClick);
    this.addEventListener("change", this.#onChange);
    this.#loadRecommendations();
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.#onDocumentClick);
    document.removeEventListener("submit", this.#onDocumentSubmit);
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("change", this.#onChange);
    this.#controller?.abort();
  }

  open() {
    if (!this.#dialog.open) {
      this.#dialog.showModal();
    }
  }

  close() {
    this.#dialog.close();
  }

  #onDocumentClick = (event) => {
    if (event.target.closest("[data-cart-drawer-trigger]")) {
      event.preventDefault();
      this.open();
    }
  };

  #onClick = (event) => {
    // A click on the dialog element itself lands on its backdrop.
    if (event.target === this.#dialog || event.target.closest("[data-cart-drawer-close]")) {
      this.close();
      return;
    }

    const remove = event.target.closest(".cart-drawer-item__remove");
    if (remove) {
      this.#change(remove.dataset.line, 0);
    }
  };

  #onChange = (event) => {
    const input = event.target.closest('input[name="updates[]"]');
    if (input) {
      this.#change(input.dataset.line, input.value, input.id);
    }
  };

  #onDocumentSubmit = async (event) => {
    const form = event.target;
    if (!form.matches('[data-type="add-to-cart-form"]')) {
      return;
    }
    event.preventDefault();

    const submitter = event.submitter;
    submitter?.setAttribute("aria-busy", "true");

    const body = new FormData(form);
    body.append("sections", this.#sectionId);
    body.append("sections_url", window.location.pathname);

    try {
      const response = await fetch(`${this.dataset.cartAddUrl}.js`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body,
      });
      const data = await response.json();

      if (!response.ok) {
        this.#showError(form, data.description ?? data.message);
        return;
      }

      this.#showError(form, "");
      this.#render(data.sections?.[this.#sectionId]);
      this.#announce(this.dataset.addedMessage);

      // Lets other dialogs (such as quick shop) close before the drawer opens.
      document.dispatchEvent(new CustomEvent("cart:added", { detail: { item: data } }));

      if (this.dataset.autoOpen === "true") {
        this.open();
      }
    } finally {
      submitter?.removeAttribute("aria-busy");
    }
  };

  async #change(line, quantity, focusId) {
    this.#controller?.abort();
    this.#controller = new AbortController();
    this.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(`${this.dataset.cartChangeUrl}.js`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          line: Number(line),
          quantity: Number(quantity),
          sections: [this.#sectionId],
          sections_url: window.location.pathname,
        }),
        signal: this.#controller.signal,
      });
      const data = await response.json();

      if (!response.ok) {
        this.#showError(this.querySelector(".cart-drawer__body"), data.description ?? data.message);
        return;
      }

      this.#render(data.sections?.[this.#sectionId]);
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

  #render(html) {
    if (!html) {
      return;
    }

    const fresh = new DOMParser().parseFromString(html, "text/html").querySelector(".cart-drawer__content");
    const current = this.querySelector(".cart-drawer__content");
    if (!fresh || !current) {
      return;
    }

    current.replaceWith(fresh);

    const count = fresh.dataset.cartCountValue;
    for (const element of document.querySelectorAll("[data-cart-count]")) {
      element.textContent = count;
      element.hidden = count === "0";
    }

    this.#loadRecommendations();
  }

  async #loadRecommendations() {
    const container = this.querySelector("[data-recommendations-url]");
    const list = container?.querySelector("[data-recommendations-list]");
    if (!container || !list) {
      return;
    }

    try {
      const response = await fetch(container.dataset.recommendationsUrl);
      const fresh = new DOMParser().parseFromString(await response.text(), "text/html").querySelector(".cart-recommendations");
      container.hidden = !fresh?.children.length;
      if (fresh) {
        list.replaceChildren(fresh);
      }
    } catch {
      container.hidden = true;
    }
  }

  #showError(container, message) {
    if (!container) {
      return;
    }

    let alert = container.querySelector(".form-error");
    if (!message) {
      alert?.remove();
      return;
    }

    if (!alert) {
      alert = document.createElement("p");
      alert.className = "form-error";
      alert.setAttribute("role", "alert");
      container.append(alert);
    }
    alert.textContent = message;
  }

  #announce(message) {
    const status = this.querySelector("[data-cart-drawer-status]");
    if (status && message) {
      status.textContent = "";
      requestAnimationFrame(() => {
        status.textContent = message;
      });
    }
  }
}

if (!customElements.get("cart-drawer")) {
  customElements.define("cart-drawer", CartDrawer);
}
