/*
 * Hero slideshow: one slide visible at a time, with arrows, clickable
 * progress bars, and autoplay every `data-autoplay` seconds (0 turns it
 * off). Autoplay pauses on hover and focus and never runs for reduced
 * motion. In the theme editor, selecting a slide block shows that slide.
 */
class HeroSlideshow extends HTMLElement {
  #index = 0;
  #timer = null;

  get #slides() {
    return [...this.querySelectorAll(".hero-slide")];
  }

  connectedCallback() {
    this.addEventListener("click", this.#onClick);
    this.addEventListener("mouseenter", this.#stop);
    this.addEventListener("mouseleave", this.#start);
    this.addEventListener("focusin", this.#stop);
    this.addEventListener("focusout", this.#start);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
    this.#show(0);
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
      const active = i === this.#index;
      slide.setAttribute("aria-hidden", String(!active));
      slide.inert = !active;
    });

    this.querySelectorAll("[data-slide-to]").forEach((bar, i) => {
      bar.toggleAttribute("aria-current", i === this.#index);
    });

    const current = this.querySelector("[data-slide-current]");
    if (current) {
      current.textContent = String(this.#index + 1).padStart(2, "0");
    }
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
    const step = event.target.closest("[data-slide-step]");
    const bar = event.target.closest("[data-slide-to]");
    if (step) {
      this.#show(this.#index + Number(step.dataset.slideStep));
    } else if (bar) {
      this.#show(Number(bar.dataset.slideTo));
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

if (!customElements.get("hero-slideshow")) {
  customElements.define("hero-slideshow", HeroSlideshow);
}
