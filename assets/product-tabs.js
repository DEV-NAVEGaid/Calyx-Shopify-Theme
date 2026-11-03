/*
 * Product tabs: each tab block renders its pill and its products; the
 * products are moved under the row of pills. The pills show one panel at a
 * time (arrow keys move between pills), and the round arrows scroll the
 * visible row by one card. In the theme editor, selecting a tab block opens
 * its panel.
 */
class ProductTabs extends HTMLElement {
  get #tabs() {
    return [...this.querySelectorAll("[data-tab]")];
  }

  connectedCallback() {
    const panels = this.querySelector("[data-tab-panels]");
    if (panels) {
      for (const panel of this.querySelectorAll(".product-tabs__tab-block [data-tab-panel]")) {
        panels.append(panel);
      }
    }

    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeydown);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
  }

  disconnectedCallback() {
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
  }

  #select(id, focus = false) {
    for (const tab of this.#tabs) {
      const selected = tab.dataset.tab === id;
      tab.setAttribute("aria-pressed", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && focus) {
        tab.focus();
      }
    }
    for (const panel of this.querySelectorAll("[data-tab-panel]")) {
      panel.hidden = panel.dataset.tabPanel !== id;
    }
  }

  #onClick = (event) => {
    const tab = event.target.closest("[data-tab]");
    const arrow = event.target.closest("[data-scroll-step]");

    if (tab) {
      this.#select(tab.dataset.tab);
    } else if (arrow) {
      const row = this.querySelector("[data-tab-panel]:not([hidden]) [data-scroller]");
      const card = row?.firstElementChild;
      if (row && card) {
        const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
        row.scrollBy({ left: Number(arrow.dataset.scrollStep) * (card.offsetWidth + gap), behavior: "smooth" });
      }
    }
  };

  #onKeydown = (event) => {
    const tab = event.target.closest("[data-tab]");
    if (!tab || !["ArrowLeft", "ArrowRight"].includes(event.key)) {
      return;
    }
    const tabs = this.#tabs;
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = tabs[(tabs.indexOf(tab) + step + tabs.length) % tabs.length];
    this.#select(next.dataset.tab, true);
  };

  #onBlockSelect = (event) => {
    const tab = this.#tabs.find((candidate) => candidate === event.target || candidate.contains(event.target));
    if (tab) {
      this.#select(tab.dataset.tab);
    }
  };
}

if (!customElements.get("product-tabs")) {
  customElements.define("product-tabs", ProductTabs);
}
