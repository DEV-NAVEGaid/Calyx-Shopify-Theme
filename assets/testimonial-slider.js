/*
 * Testimonial slider: Previous / Next show one testimonial at a time,
 * wrapping around, and update the "01 / 05" counter. In the theme editor,
 * selecting a testimonial block shows it.
 */
class TestimonialSlider extends HTMLElement {
  #index = 0;

  get #slides() {
    return [...this.querySelectorAll("[data-slider-slide]")];
  }

  connectedCallback() {
    this.addEventListener("click", this.#onClick);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
  }

  disconnectedCallback() {
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
  }

  #show(index) {
    const slides = this.#slides;
    this.#index = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => (slide.hidden = i !== this.#index));
    const current = this.querySelector("[data-slider-current]");
    if (current) {
      current.textContent = String(this.#index + 1).padStart(2, "0");
    }
  }

  #onClick = (event) => {
    const step = event.target.closest("[data-slider-step]");
    if (step) {
      this.#show(this.#index + Number(step.dataset.sliderStep));
    }
  };

  #onBlockSelect = (event) => {
    const slide = event.target.closest?.("[data-slider-slide]");
    if (slide && this.contains(slide)) {
      this.#show(this.#slides.indexOf(slide));
    }
  };
}

if (!customElements.get("testimonial-slider")) {
  customElements.define("testimonial-slider", TestimonialSlider);
}
