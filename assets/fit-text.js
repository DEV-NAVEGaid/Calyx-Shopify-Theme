/*
 * Shrinks a single line of text until it fits its box. The CSS gives a first
 * size from the character count (`--wordmark-chars`); this only corrects it
 * when wide letters still overflow, and again whenever the box resizes.
 */
class FitText extends HTMLElement {
  #observer = null;

  connectedCallback() {
    // Watch the parent: resizing the text itself changes its own height.
    let width = 0;
    this.#observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width !== width) {
        width = entry.contentRect.width;
        this.#fit();
      }
    });
    this.#observer.observe(this.parentElement);
    document.fonts?.ready.then(() => this.#fit());
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  #fit() {
    // Start from the CSS size, then scale down by how much the text overflows.
    this.style.removeProperty("font-size");
    const overflow = this.scrollWidth / this.clientWidth;
    if (overflow > 1) {
      const size = parseFloat(getComputedStyle(this).fontSize);
      this.style.fontSize = `${Math.floor((size / overflow) * 100) / 100}px`;
    }
  }
}

if (!customElements.get("fit-text")) {
  customElements.define("fit-text", FitText);
}
