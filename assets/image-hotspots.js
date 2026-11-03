/*
 * Image hotspots: a dot opens its card and closes any other; clicking
 * outside the cards or pressing Escape closes the open one.
 */
class ImageHotspots extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeydown);
    document.addEventListener("click", this.#onDocumentClick);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.#onDocumentClick);
  }

  #onClick = (event) => {
    const toggle = event.target.closest("[data-hotspot-toggle]");
    if (!toggle) return;
    const open = toggle.getAttribute("aria-expanded") !== "true";
    this.#closeAll();
    if (open) this.#set(toggle, true);
  };

  #onKeydown = (event) => {
    if (event.key !== "Escape") return;
    const open = this.querySelector('[data-hotspot-toggle][aria-expanded="true"]');
    if (!open) return;
    this.#set(open, false);
    open.focus();
  };

  #onDocumentClick = (event) => {
    if (!event.target.closest(".hotspot")) this.#closeAll();
  };

  #closeAll() {
    for (const toggle of this.querySelectorAll('[data-hotspot-toggle][aria-expanded="true"]')) {
      this.#set(toggle, false);
    }
  }

  #set(toggle, open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.closest(".hotspot").classList.toggle("hotspot--open", open);
    document.getElementById(toggle.getAttribute("aria-controls")).hidden = !open;
  }
}

if (!customElements.get("image-hotspots")) {
  customElements.define("image-hotspots", ImageHotspots);
}
