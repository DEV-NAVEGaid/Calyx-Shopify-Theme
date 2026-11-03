/*
 * Expanding panels: exactly one panel is open. A closed panel opens when
 * clicked; the arrows and progress bars move between panels. In the theme
 * editor, selecting a panel block opens it.
 */
class ExpandingPanels extends HTMLElement {
  #index = 0;

  get #panels() {
    return [...this.querySelectorAll("[data-panel]")];
  }

  connectedCallback() {
    this.addEventListener("click", this.#onClick);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
    this.#open(0);
  }

  disconnectedCallback() {
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
  }

  #open(index) {
    const panels = this.#panels;
    if (panels.length === 0) {
      return;
    }

    this.#index = (index + panels.length) % panels.length;
    panels.forEach((panel, i) => {
      const active = i === this.#index;
      panel.classList.toggle("is-active", active);
      panel.querySelector("[data-panel-open]")?.setAttribute("aria-expanded", String(active));
      const content = panel.querySelector(".panel__content");
      if (content) {
        content.inert = !active;
      }
    });

    this.querySelectorAll("[data-panel-to]").forEach((bar, i) => {
      bar.toggleAttribute("aria-current", i === this.#index);
    });

    const current = this.querySelector("[data-panel-current]");
    if (current) {
      current.textContent = String(this.#index + 1).padStart(2, "0");
    }
  }

  #onClick = (event) => {
    const toggle = event.target.closest("[data-panel-open]");
    const step = event.target.closest("[data-panel-step]");
    const bar = event.target.closest("[data-panel-to]");

    if (toggle) {
      this.#open(this.#panels.indexOf(toggle.closest("[data-panel]")));
    } else if (step) {
      this.#open(this.#index + Number(step.dataset.panelStep));
    } else if (bar) {
      this.#open(Number(bar.dataset.panelTo));
    }
  };

  #onBlockSelect = (event) => {
    const index = this.#panels.findIndex((panel) => panel.contains(event.target));
    if (index >= 0) {
      this.#open(index);
    }
  };
}

if (!customElements.get("expanding-panels")) {
  customElements.define("expanding-panels", ExpandingPanels);
}
