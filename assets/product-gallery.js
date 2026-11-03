/*
 * Product gallery: one large media at a time, switched by the thumbnails
 * beneath it. Leaving a slide pauses its video. Choosing another variant
 * re-renders the section, so the variant's media is shown by the server.
 */
class ProductGallery extends HTMLElement {
  connectedCallback() {
    this.addEventListener("click", this.#onClick);
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
