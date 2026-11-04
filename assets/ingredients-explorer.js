/*
 * Ingredients explorer: builds the list of names and the descriptions from
 * the templates each ingredient block carries (the section cannot read its
 * blocks' settings), and rebuilds them when the theme editor re-renders a
 * block. Choosing an ingredient's photo or name highlights both and shows
 * its description. In the theme editor, selecting an ingredient block
 * shows it.
 */
class IngredientsExplorer extends HTMLElement {
  #index = 0;
  #observer = null;

  connectedCallback() {
    this.#build();
    this.addEventListener("click", this.#onClick);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);

    const thumbs = this.querySelector("[data-ingredient-thumbs]");
    if (thumbs) {
      this.#observer = new MutationObserver(() => this.#build());
      this.#observer.observe(thumbs, { childList: true });
    }
  }

  disconnectedCallback() {
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
    this.#observer?.disconnect();
  }

  #build() {
    const detail = this.querySelector("[data-ingredient-detail]");
    const list = this.querySelector("[data-ingredient-list]");
    if (!detail || !list) {
      return;
    }

    const copies = (selector) =>
      [...this.querySelectorAll(selector)].map((template) => template.content.cloneNode(true));

    list.replaceChildren(...copies("template[data-ingredient-item-template]"));
    detail.replaceChildren(list, ...copies("template[data-ingredient-description-template]"));

    const count = list.children.length;
    this.#select(Math.min(this.#index, Math.max(count - 1, 0)));
  }

  #select(index) {
    this.#index = index;
    for (const control of this.querySelectorAll("[data-ingredient-select]")) {
      control.setAttribute("aria-pressed", String(Number(control.dataset.ingredientSelect) === index));
    }
    this.querySelectorAll("[data-ingredient-description]").forEach((description, i) => {
      description.hidden = i !== index;
    });
  }

  #onClick = (event) => {
    const control = event.target.closest("[data-ingredient-select]");
    if (control) {
      this.#select(Number(control.dataset.ingredientSelect));
    }
  };

  #onBlockSelect = (event) => {
    const control = event.target.querySelector?.("[data-ingredient-select]");
    if (control && this.contains(control)) {
      this.#select(Number(control.dataset.ingredientSelect));
    }
  };
}

if (!customElements.get("ingredients-explorer")) {
  customElements.define("ingredients-explorer", IngredientsExplorer);
}
