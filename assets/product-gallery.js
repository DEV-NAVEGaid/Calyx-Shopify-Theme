/*
 * Product gallery: one large media at a time, switched by the thumbnails
 * beneath it. Leaving a slide pauses its video or 3D model. Choosing another
 * variant re-renders the section, so the variant's media is shown by the
 * server. On small screens every slide sits in a swipeable track, so the
 * track is scrolled to that media (on load and after each re-render).
 */
class ProductGallery extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.#onClick);
    this.#scrollToSelected();
  }

  disconnectedCallback() {
    this.removeEventListener("click", this.#onClick);
  }

  // Wide screens show only the selected slide, so the offset is 0 there.
  #scrollToSelected() {
    const track = this.querySelector("[data-gallery-slide]")?.parentElement;
    const slide = this.querySelector("[data-gallery-slide]:not([hidden])");
    if (!track || !slide) {
      return;
    }

    const offset = slide.getBoundingClientRect().left - track.getBoundingClientRect().left;
    if (offset !== 0) {
      track.scrollBy({ left: offset, behavior: "instant" });
    }
  }

  #onClick = (event) => {
    const thumb = event.target.closest("[data-gallery-thumb]");
    if (!thumb) {
      return;
    }

    const index = Number(thumb.dataset.galleryThumb);
    this.querySelectorAll("[data-gallery-slide]").forEach((slide, i) => {
      slide.hidden = i !== index;
      if (slide.hidden) {
        slide.querySelector("video")?.pause();
        slide.querySelector("product-model")?.pause?.();
      }
    });
    this.querySelectorAll("[data-gallery-thumb]").forEach((button) => {
      if (button === thumb) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  };
}

if (!customElements.get("product-gallery")) {
  customElements.define("product-gallery", ProductGallery);
}
