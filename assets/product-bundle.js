/*
 * Product bundle: unticking a card leaves its fields out of the form and
 * updates the total, the compare-at total, and the button's count. Prices
 * are in the shop currency's minor units, as Liquid prints them.
 *
 * The first card is the product's selected variant. When the shopper picks
 * another variant on the product page (`variant:change` from
 * assets/variant-picker.js), the section is fetched again for that variant
 * with the Section Rendering API and swapped in, keeping unticked cards
 * unticked. Bundles register by section, so one that rendered empty (the
 * variant sold out) still comes back for an available variant.
 */
const bundles = new Map();

async function refresh(sectionId, variantId) {
  const bundle = bundles.get(sectionId);
  const section = document.getElementById(`shopify-section-${sectionId}`);
  if (!bundle || !section) {
    return;
  }

  const url = new URL(bundle.productUrl, window.location.origin);
  url.searchParams.set("variant", variantId);
  url.searchParams.set("section_id", sectionId);

  bundle.controller?.abort();
  bundle.controller = new AbortController();

  try {
    const response = await fetch(url, { signal: bundle.controller.signal });
    const html = new DOMParser().parseFromString(await response.text(), "text/html");
    const fresh = html.getElementById(`shopify-section-${sectionId}`);
    if (!fresh) {
      return;
    }

    const unticked = new Set(
      [...section.querySelectorAll("[data-bundle-item]")]
        .filter((item) => !item.querySelector("[data-bundle-check]").checked)
        .map((item) => item.querySelector("[data-bundle-field]")?.value),
    );
    section.replaceChildren(...fresh.childNodes);

    const items = section.querySelectorAll("[data-bundle-item]");
    items.forEach((item) => {
      if (unticked.has(item.querySelector("[data-bundle-field]")?.value)) {
        item.querySelector("[data-bundle-check]").checked = false;
      }
    });
    items[0]?.querySelector("[data-bundle-check]").dispatchEvent(new Event("change", { bubbles: true }));
  } catch (error) {
    if (error.name !== "AbortError") {
      throw error;
    }
  }
}

document.addEventListener("variant:change", ({ detail }) => {
  // Only the product page's own picker (it keeps ?variant= in the URL);
  // a quick view of the same product leaves the bundle alone.
  if (!detail.updateUrl) {
    return;
  }

  const path = new URL(detail.productUrl, window.location.origin).pathname;
  for (const [sectionId, bundle] of bundles) {
    if (bundle.path === path && bundle.variantId !== detail.variantId) {
      bundle.variantId = detail.variantId;
      refresh(sectionId, detail.variantId);
    }
  }
});

class ProductBundle extends HTMLElement {
  #wholeAmounts = false;

  connectedCallback() {
    // Follow the server's format: when it prints "$132" rather than
    // "$132.00", whole amounts drop their cents here too.
    this.#wholeAmounts = !/[.,]\d{2}\b/.test(this.querySelector("[data-bundle-total]")?.textContent ?? "");
    this.addEventListener("change", this.#update);
    this.#register();
  }

  disconnectedCallback() {
    this.removeEventListener("change", this.#update);
  }

  #register() {
    const { sectionId, productUrl, variantId } = this.dataset;
    if (!sectionId || !productUrl) {
      return;
    }

    const known = bundles.get(sectionId);
    bundles.set(sectionId, {
      productUrl,
      path: new URL(productUrl, window.location.origin).pathname,
      variantId: known?.variantId ?? variantId,
      controller: known?.controller,
    });

    // This module loads when the bundle scrolls near, so a variant may have
    // been picked before that: the page URL names it.
    const selected = new URL(window.location.href).searchParams.get("variant");
    if (!known && selected && selected !== variantId) {
      bundles.get(sectionId).variantId = selected;
      refresh(sectionId, selected);
    }
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
