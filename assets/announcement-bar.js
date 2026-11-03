/*
 * Shows one announcement at a time. The arrows step through them, and the
 * bar rotates on its own every `data-autoplay` seconds (0 turns that off).
 * Rotation pauses while the bar is hovered or focused, and never runs for
 * reduced motion. In the theme editor, selecting a block shows it.
 */
class AnnouncementBar extends HTMLElement {
  #index = 0;
  #timer = null;

  get #slides() {
    return [...this.querySelectorAll(".announcement")];
  }

  connectedCallback() {
    this.#show(0);
    this.addEventListener("click", this.#onClick);
    this.addEventListener("mouseenter", this.#stop);
    this.addEventListener("mouseleave", this.#start);
    this.addEventListener("focusin", this.#stop);
    this.addEventListener("focusout", this.#start);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
    this.#start();
  }

  disconnectedCallback() {
    this.#stop();
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
  }

  #show(index) {
    const slides = this.#slides;
    if (slides.length === 0) {
      return;
    }

    this.#index = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== this.#index;
    });
  }

  #start = () => {
    const seconds = Number(this.dataset.autoplay);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!seconds || reducedMotion || this.#slides.length < 2) {
      return;
    }

    this.#stop();
    this.#timer = setInterval(() => this.#show(this.#index + 1), seconds * 1000);
  };

  #stop = () => {
    clearInterval(this.#timer);
    this.#timer = null;
  };

  #onClick = (event) => {
    const arrow = event.target.closest("[data-announcement-step]");
    if (arrow) {
      this.#show(this.#index + Number(arrow.dataset.announcementStep));
    }
  };

  #onBlockSelect = (event) => {
    const index = this.#slides.findIndex((slide) => slide.contains(event.target));
    if (index >= 0) {
      this.#stop();
      this.#show(index);
    }
  };
}

if (!customElements.get("announcement-bar")) {
  customElements.define("announcement-bar", AnnouncementBar);
}
