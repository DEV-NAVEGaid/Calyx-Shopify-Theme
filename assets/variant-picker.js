/*
 * Re-renders the product section when the shopper picks another option
 * value. The section is fetched with the Section Rendering API and the
 * `option_values` parameter, so the server resolves the variant and every
 * block (price, media, buy buttons) comes back in sync.
 */
class VariantPicker extends HTMLElement {
  #controller = null;

  connectedCallback() {
    this.addEventListener("change", this.#onChange);
  }

  disconnectedCallback() {
    this.removeEventListener("change", this.#onChange);
    this.#controller?.abort();
  }

  get #selectedOptionValueIds() {
    const ids = [];

    for (const control of this.querySelectorAll("select, input:checked")) {
      const source = control.tagName === "SELECT" ? control.selectedOptions[0] : control;
      if (source?.dataset.optionValueId) {
        ids.push(source.dataset.optionValueId);
      }
    }

    return ids;
  }

  #onChange = async (event) => {
    const { sectionId, productUrl } = this.dataset;
    const section = document.getElementById(`shopify-section-${sectionId}`);
    if (!section) {
      return;
    }

    const url = new URL(productUrl, window.location.origin);
    url.searchParams.set("option_values", this.#selectedOptionValueIds.join(","));
    url.searchParams.set("section_id", sectionId);

    this.#controller?.abort();
    this.#controller = new AbortController();
    section.setAttribute("aria-busy", "true");

    try {
      const response = await fetch(url, { signal: this.#controller.signal });
      const html = new DOMParser().parseFromString(await response.text(), "text/html");
      const fresh = html.getElementById(`shopify-section-${sectionId}`);
      if (!fresh) {
        return;
      }

      const focusedId = event.target.id;
      section.replaceChildren(...fresh.childNodes);
      document.getElementById(focusedId)?.focus();

      // Keep the URL shareable: it points at the variant now on screen.
      // Pickers outside the product page (quick view) leave the URL alone.
      const variantId = section.querySelector('input[name="id"]')?.value;
      if (variantId && this.dataset.updateUrl !== "false") {
        const pageUrl = new URL(window.location.href);
        pageUrl.searchParams.set("variant", variantId);
        window.history.replaceState(null, "", pageUrl);
      }

      window.Shopify?.PaymentButton?.init();
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    } finally {
      section.removeAttribute("aria-busy");
    }
  };
}

if (!customElements.get("variant-picker")) {
  customElements.define("variant-picker", VariantPicker);
}
