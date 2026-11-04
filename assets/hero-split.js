/*
 * Hero split: cycles the product panel's slides on a timer (the section's
 * autoplay seconds; 0 turns it off), pausing while hovered or focused and
 * when reduced motion is preferred. The dots jump to a slide. In the theme
 * editor, selecting a slide block shows it.
 */
// Rotation waits for the visitor's first interaction, so nothing on the first
// screen changes on its own while the page is still loading.
const firstInteraction = new Promise((resolve) => {
  const events = ["pointerdown", "pointermove", "keydown", "scroll", "wheel", "touchstart"];
  const done = () => {
    events.forEach((type) => window.removeEventListener(type, done, true));
    resolve();
  };
  events.forEach((type) => window.addEventListener(type, done, { capture: true, passive: true }));
});

class HeroSplit extends HTMLElement {
  #index = 0;
  #timer = 0;

  get #slides() {
    return [...this.querySelectorAll("[data-hero-slide]")];
  }

  connectedCallback() {
    this.addEventListener("click", this.#onClick);
    this.addEventListener("pointerenter", this.#stop);
    this.addEventListener("pointerleave", this.#start);
    this.addEventListener("focusin", this.#stop);
    this.addEventListener("focusout", this.#start);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
    firstInteraction.then(this.#start);
  }

  disconnectedCallback() {
    this.#stop();
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
  }

  #show(index) {
    const slides = this.#slides;
    this.#index = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => (slide.hidden = i !== this.#index));
    this.querySelectorAll("[data-hero-dot]").forEach((dot, i) => {
      dot.setAttribute("aria-selected", String(i === this.#index));
    });
  }

  #start = () => {
    this.#stop();
    const seconds = Number(this.dataset.autoplay || 0);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (seconds > 0 && !reduced && this.#slides.length > 1 && !window.Shopify?.designMode) {
      this.#timer = setInterval(() => this.#show(this.#index + 1), seconds * 1000);
    }
  };

  #stop = () => {
    clearInterval(this.#timer);
  };

  #onClick = (event) => {
    const dot = event.target.closest("[data-hero-dot]");
    if (dot) {
      this.#show(Number(dot.dataset.heroDot));
    }
  };

  #onBlockSelect = (event) => {
    const slide = event.target.closest?.("[data-hero-slide]");
    if (slide && this.contains(slide)) {
      this.#show(this.#slides.indexOf(slide));
    }
  };
}

if (!customElements.get("hero-split")) {
  customElements.define("hero-split", HeroSplit);
}
