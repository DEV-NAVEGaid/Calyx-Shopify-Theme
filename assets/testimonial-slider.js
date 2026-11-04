/*
 * Testimonial slider: Previous / Next show one testimonial at a time,
 * wrapping around, and update the "01 / 05" counter. Each slide's small
 * frame gets the previous slide's photo from that slide's template (the
 * last one's for the first), again whenever the theme editor re-renders a
 * slide. In the theme editor, selecting a testimonial block shows it.
 */
class TestimonialSlider extends HTMLElement {
  #index = 0;
  #observer = null;

  get #slides() {
    return [...this.querySelectorAll("[data-slider-slide]")];
  }

  connectedCallback() {
    this.#fillPrevious();
    this.addEventListener("click", this.#onClick);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);

    const slides = this.#slides[0]?.parentElement;
    if (slides) {
      this.#observer = new MutationObserver(() => this.#fillPrevious());
      this.#observer.observe(slides, { childList: true });
    }
  }

  disconnectedCallback() {
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
    this.#observer?.disconnect();
  }

  #fillPrevious() {
    const slides = this.#slides;
    slides.forEach((slide, i) => {
      const previous = slides[(i - 1 + slides.length) % slides.length];
      const thumb = previous.querySelector("template[data-slide-thumb]");
      const frame = slide.querySelector("[data-slide-previous]");
      if (thumb && frame) {
        frame.replaceChildren(thumb.content.cloneNode(true));
      }
    });
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
