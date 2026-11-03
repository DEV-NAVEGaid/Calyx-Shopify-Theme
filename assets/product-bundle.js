/*
 * Product bundle: unticking a card leaves its fields out of the form and
 * updates the total, the compare-at total, and the button's count. Prices
 * are in the shop currency's minor units, as Liquid prints them.
 */
class ProductBundle extends HTMLElement {
  #wholeAmounts = false;

  connectedCallback() {
    // Follow the server's format: when it prints "$132" rather than
    // "$132.00", whole amounts drop their cents here too.
    this.#wholeAmounts = !/[.,]\d{2}\b/.test(this.querySelector("[data-bundle-total]")?.textContent ?? "");
    this.addEventListener("change", this.#update);
  }

  #format(cents) {
    const whole = this.#wholeAmounts && cents % 100 === 0;
    return new Intl.NumberFormat(document.documentElement.lang || undefined, {
      style: "currency",
      currency: window.Shopify?.currency?.active || "USD",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2,
    }).format(cents / 100);
  }

  #update = () => {
    let total = 0;
    let compare = 0;
    let count = 0;

    for (const item of this.querySelectorAll("[data-bundle-item]")) {
      const ticked = item.querySelector("[data-bundle-check]").checked;
      item.querySelectorAll("[data-bundle-field]").forEach((field) => (field.disabled = !ticked));
      if (ticked) {
        total += Number(item.dataset.price);
        compare += Number(item.dataset.compare);
        count += 1;
      }
    }

    const fill = (element, value) => {
      if (element) {
        element.textContent = element.dataset.template.replace("[count]", value);
      }
    };

    this.querySelector("[data-bundle-total]").textContent = this.#format(total);
    const compareElement = this.querySelector("[data-bundle-compare]");
    compareElement.textContent = this.#format(compare);
    compareElement.hidden = compare <= total;
    fill(this.querySelector("[data-bundle-count-label]"), count);
    fill(this.querySelector("[data-bundle-button]"), count);
    this.querySelector("[data-bundle-button]").disabled = count === 0;
  };
}

if (!customElements.get("product-bundle")) {
  customElements.define("product-bundle", ProductBundle);
}
