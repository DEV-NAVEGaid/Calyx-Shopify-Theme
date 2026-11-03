/*
 * Dots for a horizontally scrolling row: `<scroll-dots data-for="row-id">`
 * holds one button per item of the row. A dot scrolls to its item, and the
 * dot of the item nearest the row's start is marked current.
 */
class ScrollDots extends HTMLElement {
  #scroller = null;

  get #dots() {
    return [...this.querySelectorAll("button")];
  }

  connectedCallback() {
    this.#scroller = document.getElementById(this.dataset.for);
    if (!this.#scroller) return;

    this.addEventListener("click", this.#onClick);
    this.#scroller.addEventListener("scroll", this.#onScroll, { passive: true });
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#onClick);
    this.#scroller?.removeEventListener("scroll", this.#onScroll);
  }

  #onClick = (event) => {
    const index = this.#dots.indexOf(event.target.closest("button"));
    const item = this.#scroller.children[index];
    if (!item) return;

    const offset = item.getBoundingClientRect().left - this.#scroller.getBoundingClientRect().left;
    this.#scroller.scrollBy({ left: offset, behavior: "smooth" });
  };

  #onScroll = () => {
    const start = this.#scroller.getBoundingClientRect().left;
    let current = 0;
    let nearest = Infinity;
    [...this.#scroller.children].forEach((item, index) => {
      const distance = Math.abs(item.getBoundingClientRect().left - start);
      if (distance < nearest) {
        nearest = distance;
        current = index;
      }
    });

    this.#dots.forEach((dot, index) => {
      dot.toggleAttribute("aria-current", index === current);
    });
  };
}

if (!customElements.get("scroll-dots")) {
  customElements.define("scroll-dots", ScrollDots);
}
