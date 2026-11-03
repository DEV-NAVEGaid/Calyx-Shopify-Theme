/*
 * Steps a quantity input with its minus and plus buttons, then fires a
 * `change` event on the input so the cart or product form reacts the same
 * way as when the shopper types a number.
 */
class QuantitySelector extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.#onClick);
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#onClick);
  }

  #onClick = (event) => {
    const button = event.target.closest("button[name]");
    const input = this.querySelector("input");
    if (!button || !input) {
      return;
    }

    const before = input.value;
    if (button.name === "plus") {
      input.stepUp();
    } else {
      input.stepDown();
    }

    if (input.value !== before) {
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };
}

if (!customElements.get("quantity-selector")) {
  customElements.define("quantity-selector", QuantitySelector);
}
