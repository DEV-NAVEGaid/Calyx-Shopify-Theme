/*
 * Newsletter popup: opens once, after the section's delay, unless the
 * shopper closed it or signed up in the last 30 days (remembered in this
 * browser only). It opens straight away after a sign-up or a form error,
 * so the shopper sees the result. In the theme editor it opens while its
 * section is selected and never on its own.
 */
const KEY = "calyx:newsletter-popup";
const DAYS = 30;

const remember = () => {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Storage can be blocked; the popup then just shows again next visit.
  }
};

const recentlySeen = () => {
  try {
    const seen = Number(localStorage.getItem(KEY));
    return seen > 0 && Date.now() - seen < DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

class NewsletterPopup extends HTMLElement {
  get #dialog() {
    return this.querySelector("[data-popup-dialog]");
  }

  connectedCallback() {
    this.querySelectorAll("[data-popup-close]").forEach((button) => button.addEventListener("click", this.#close));
    this.#dialog.addEventListener("click", (event) => {
      if (event.target === this.#dialog) {
        this.#close();
      }
    });
    this.#dialog.addEventListener("cancel", remember);

    if (window.Shopify?.designMode) {
      document.addEventListener("shopify:section:select", this.#onSelect);
      document.addEventListener("shopify:section:deselect", this.#onDeselect);
      return;
    }

    if (this.querySelector("[data-popup-success], [data-popup-error]")) {
      remember();
      this.#open();
    } else if (!recentlySeen()) {
      setTimeout(this.#open, Number(this.dataset.delay) * 1000);
    }
  }

  disconnectedCallback() {
    document.removeEventListener("shopify:section:select", this.#onSelect);
    document.removeEventListener("shopify:section:deselect", this.#onDeselect);
  }

  #open = () => {
    if (!this.#dialog.open && !document.querySelector("dialog[open]")) {
      this.#dialog.showModal();
    }
  };

  #close = () => {
    remember();
    this.#dialog.close();
  };

  #onSelect = (event) => {
    if (event.detail.sectionId === this.dataset.sectionId) {
      this.#dialog.showModal();
    }
  };

  #onDeselect = (event) => {
    if (event.detail.sectionId === this.dataset.sectionId) {
      this.#dialog.close();
    }
  };
}

if (!customElements.get("newsletter-popup")) {
  customElements.define("newsletter-popup", NewsletterPopup);
}
