/*
 * Submits the filters form as soon as a filter or the sort order changes,
 * leaving out empty fields so the resulting URL stays short and shareable.
 * Without JavaScript the form keeps its "Apply" button.
 *
 * On small screens the filters open as a full-screen drawer
 * (`[data-mobile-drawer]`): changes wait for its "Show results" button.
 */
const mobileQuery = window.matchMedia("(max-width: 989px)");

class FacetFilters extends HTMLElement {
  connectedCallback() {
    this.addEventListener("change", this.#onChange);
    this.addEventListener("submit", this.#onSubmit);
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeydown);
    mobileQuery.addEventListener("change", this.#onMediaChange);
    this.#onMediaChange();
  }

  disconnectedCallback() {
    this.removeEventListener("change", this.#onChange);
    this.removeEventListener("submit", this.#onSubmit);
    this.removeEventListener("click", this.#onClick);
    this.removeEventListener("keydown", this.#onKeydown);
    mobileQuery.removeEventListener("change", this.#onMediaChange);
  }

  get #toggle() {
    return this.querySelector("[data-facets-toggle]");
  }

  get #drawer() {
    const toggle = this.#toggle;
    return toggle ? document.getElementById(toggle.getAttribute("aria-controls")) : null;
  }

  get #usesMobileDrawer() {
    return mobileQuery.matches && this.#drawer?.hasAttribute("data-mobile-drawer");
  }

  #setExpanded(expanded) {
    const toggle = this.#toggle;
    if (!toggle) return;

    toggle.setAttribute("aria-expanded", String(expanded));
    const label = toggle.querySelector("[data-facets-toggle-label]");
    if (!label) return;

    if (this.#usesMobileDrawer) {
      label.textContent = toggle.dataset.labelDrawer;
    } else {
      label.textContent = expanded ? toggle.dataset.labelHide : toggle.dataset.labelShow;
    }
  }

  #setMobileOpen(open) {
    this.#drawer.toggleAttribute("data-mobile-open", open);
    this.#setExpanded(open);
    if (open) {
      this.#drawer.querySelector("[data-facets-close]")?.focus();
    } else {
      this.#toggle.focus();
    }
  }

  #onMediaChange = () => {
    const drawer = this.#drawer;
    if (!drawer) return;

    if (this.#usesMobileDrawer) {
      drawer.open = true;
      this.#setExpanded(drawer.hasAttribute("data-mobile-open"));
    } else {
      drawer.removeAttribute("data-mobile-open");
      this.#setExpanded(drawer.open);
    }
  };

  #onClick = (event) => {
    if (event.target.closest("[data-facets-close]")) {
      this.#setMobileOpen(false);
      return;
    }

    if (!event.target.closest("[data-facets-toggle]")) return;

    const drawer = this.#drawer;
    if (!drawer) return;

    if (this.#usesMobileDrawer) {
      this.#setMobileOpen(true);
      return;
    }

    drawer.open = !drawer.open;
    this.#setExpanded(drawer.open);
  };

  #onKeydown = (event) => {
    if (event.key === "Escape" && this.#drawer?.hasAttribute("data-mobile-open")) {
      this.#setMobileOpen(false);
    }
  };

  #onChange = (event) => {
    const field = event.target;

    // The toolbar select and the drawer's sort chips share the `sort_by` name.
    if (field.name === "sort_by") {
      for (const other of this.querySelectorAll('[name="sort_by"]')) {
        if (other === field) continue;
        if (other.type === "radio") {
          other.checked = other.value === field.value;
        } else {
          other.value = field.value;
        }
      }
    }

    if (this.#drawer?.hasAttribute("data-mobile-open")) {
      const apply = this.#drawer.querySelector("[data-label-pending]");
      if (apply) apply.textContent = apply.dataset.labelPending;
      return;
    }

    field.form?.requestSubmit();
  };

  #onSubmit = (event) => {
    event.preventDefault();

    const form = event.target;
    const params = new URLSearchParams();
    const seen = new Set();
    for (const [name, value] of new FormData(form)) {
      const key = `${name}=${value}`;
      if (value !== "" && !seen.has(key)) {
        seen.add(key);
        params.append(name, value);
      }
    }

    const url = new URL(form.action, window.location.origin);
    url.search = params.toString();
    window.location.assign(url);
  };
}

if (!customElements.get("facet-filters")) {
  customElements.define("facet-filters", FacetFilters);
}
