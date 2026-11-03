/*
 * Before / after: the range input under each comparison moves the divider
 * (drag, click, or arrow keys), and the thumbnails switch between pairs.
 * In the theme editor, selecting a comparison block shows it.
 */
class BeforeAfter extends HTMLElement {
  connectedCallback() {
    this.addEventListener("input", this.#onInput);
    this.addEventListener("click", this.#onClick);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
  }

  disconnectedCallback() {
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
  }

  #select(comparison) {
    for (const candidate of this.querySelectorAll("[data-comparison]")) {
      const active = candidate === comparison;
      candidate.classList.toggle("is-active", active);
      candidate.querySelector("[data-comparison-select]")?.setAttribute("aria-pressed", String(active));
    }
  }

  #onInput = (event) => {
    const range = event.target.closest("[data-comparison-range]");
    if (range) {
      range.closest(".comparison__stage").style.setProperty("--position", `${range.value}%`);
    }
  };

  #onClick = (event) => {
    const thumb = event.target.closest("[data-comparison-select]");
    if (thumb) {
      this.#select(thumb.closest("[data-comparison]"));
    }
  };

  #onBlockSelect = (event) => {
    const comparison = event.target.closest?.("[data-comparison]");
    if (comparison && this.contains(comparison)) {
      this.#select(comparison);
    }
  };
}

if (!customElements.get("before-after")) {
  customElements.define("before-after", BeforeAfter);
}
