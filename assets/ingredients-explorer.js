/*
 * Ingredients explorer: choosing an ingredient's photo or name highlights
 * both and shows its description. In the theme editor, selecting an
 * ingredient block shows it.
 */
class IngredientsExplorer extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.#onClick);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
  }

  disconnectedCallback() {
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
  }

  #select(index) {
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
