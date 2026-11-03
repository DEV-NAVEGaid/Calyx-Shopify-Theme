/*
 * Social arch: keeps the active card in the middle of the row and gives
 * every card its distance from it (`--distance`, which sets the photo
 * height), so the cards step down like an arch. A timer moves the arch one
 * card on (the section's seconds; 0 stops it), pausing on hover or focus
 * and when reduced motion is preferred.
 */
class SocialArch extends HTMLElement {
  #active = 0;
  #timer = 0;

  get #cards() {
    return [...this.querySelectorAll("[data-arch-card]")];
  }

  connectedCallback() {
    this.#active = Math.floor(this.#cards.length / 2);
    this.#layout();
    this.addEventListener("pointerenter", this.#stop);
    this.addEventListener("pointerleave", this.#start);
    this.addEventListener("focusin", this.#stop);
    this.addEventListener("focusout", this.#start);
    this.#start();
  }

  disconnectedCallback() {
    this.#stop();
  }

  #layout() {
    const cards = this.#cards;
    const count = cards.length;
    const half = Math.floor(count / 2);
    cards.forEach((card, i) => {
      // Offset from the middle slot: -half … +half.
      const offset = ((i - this.#active + count + half) % count) - half;
      card.style.order = String(offset + half);
      card.style.setProperty("--distance", String(Math.abs(offset)));
    });
  }

  #start = () => {
    this.#stop();
    const seconds = Number(this.dataset.autoplay || 0);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seconds > 0 && !reduced && this.#cards.length > 1 && !window.Shopify?.designMode) {
      this.#timer = setInterval(() => {
        this.#active = (this.#active + 1) % this.#cards.length;
        this.#layout();
      }, seconds * 1000);
    }
  };

  #stop = () => {
    clearInterval(this.#timer);
  };
}

if (!customElements.get("social-arch")) {
  customElements.define("social-arch", SocialArch);
}
