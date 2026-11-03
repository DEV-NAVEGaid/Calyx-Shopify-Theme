/*
 * Predictive search: links marked `data-search-open` open the search panel
 * instead of the search page. Typing fetches the predictive-search section
 * from Shopify's predictive search route (debounced, older requests
 * aborted) and shows it in the panel; clearing the field brings back the
 * popular products it opened with. Escape, the close button, or a click on
 * the dimmed page closes it.
 */
const DELAY = 250;

class PredictiveSearch extends HTMLElement {
  #controller = null;
  #timer = 0;
  #initial = "";

  get #dialog() {
    return this.querySelector("[data-search-dialog]");
  }

  get #input() {
    return this.querySelector("[data-search-input]");
  }

  get #results() {
    return this.querySelector("[data-search-results]");
  }

  connectedCallback() {
    this.#initial = this.#results.innerHTML;
    document.addEventListener("click", this.#onDocumentClick);
    this.#input.addEventListener("input", this.#onInput);
    this.querySelector("[data-search-close]").addEventListener("click", () => this.#dialog.close());
    this.#dialog.addEventListener("click", (event) => {
      if (event.target === this.#dialog) {
        this.#dialog.close();
      }
    });
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.#onDocumentClick);
  }

  #onDocumentClick = (event) => {
    const opener = event.target.closest("[data-search-open]");
    if (!opener) {
      return;
    }
    event.preventDefault();
    this.#dialog.showModal();
    this.#input.focus();
  };

  #onInput = () => {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#search(this.#input.value.trim()), DELAY);
  };

  async #search(terms) {
    this.#controller?.abort();
    if (!terms) {
      this.#results.innerHTML = this.#initial;
      return;
    }

    this.#controller = new AbortController();
    const url = new URL(this.dataset.url, window.location.origin);
    url.searchParams.set("q", terms);
    url.searchParams.set("section_id", this.dataset.section);
    url.searchParams.set("resources[type]", "query,product,collection,page,article");
    url.searchParams.set("resources[limit]", "4");
    url.searchParams.set("resources[limit_scope]", "each");
    url.searchParams.set("resources[options][prefix]", "last");

    this.setAttribute("aria-busy", "true");
    try {
      const response = await fetch(url, { signal: this.#controller.signal });
      if (!response.ok) {
        return;
      }
      const html = new DOMParser().parseFromString(await response.text(), "text/html");
      const section = html.querySelector(".shopify-section") ?? html.body;
      this.#results.replaceChildren(...section.childNodes);
    } catch (error) {
      if (error.name !== "AbortError") {
        throw error;
      }
    } finally {
      this.removeAttribute("aria-busy");
    }
  }
}

if (!customElements.get("predictive-search")) {
  customElements.define("predictive-search", PredictiveSearch);
}
