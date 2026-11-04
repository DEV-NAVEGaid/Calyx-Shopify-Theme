/*
 * Video carousel: the arrows scroll the row by one card and the counter
 * follows the first visible card. That card's video plays (muted) while the
 * others pause; its button pauses it, and a paused video stays paused until
 * its button is pressed again. No autoplay when reduced motion is preferred.
 */
class VideoCarousel extends HTMLElement {
  #index = 0;
  #frame = 0;
  #paused = new WeakSet();

  get #track() {
    return this.querySelector("[data-scroller]");
  }

  get #cards() {
    return [...this.querySelectorAll("[data-video-card]")];
  }

  connectedCallback() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.#cards.forEach((card) => card.querySelector("video") && this.#paused.add(card));
    }
    this.addEventListener("click", this.#onClick);
    this.#track?.addEventListener("scroll", this.#onScroll, { passive: true });
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
    // Measure on the next frame, not while the page is still being parsed.
    this.#frame = requestAnimationFrame(() => this.#update());
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#frame);
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
  }

  #step() {
    const card = this.#cards[0];
    const gap = parseFloat(getComputedStyle(this.#track).columnGap) || 0;
    return card ? card.offsetWidth + gap : 0;
  }

  #update() {
    const track = this.#track;
    const cards = this.#cards;
    if (!track || cards.length === 0) {
      return;
    }

    // Read all the layout first, then write, so the browser lays out once.
    const step = this.#step();
    const scrollLeft = track.scrollLeft;
    const end = scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    const first = step ? Math.round(scrollLeft / step) : 0;
    this.#index = end ? cards.length - 1 : first;

    const current = this.querySelector("[data-carousel-current]");
    if (current) {
      current.textContent = String(this.#index + 1);
    }
    this.querySelector('[data-scroll-step="-1"]')?.toggleAttribute("disabled", scrollLeft <= 2);
    this.querySelector('[data-scroll-step="1"]')?.toggleAttribute("disabled", end);

    // Only the first visible card plays.
    const active = cards[first];
    for (const card of cards) {
      this.#play(card, card === active && !this.#paused.has(card));
    }
  }

  #play(card, play) {
    const video = card.querySelector("video");
    if (!video) {
      return;
    }
    if (play) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
    card.querySelector("[data-video-toggle]")?.setAttribute("aria-pressed", String(play));
  }

  #onScroll = () => {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#update());
  };

  #onClick = (event) => {
    const arrow = event.target.closest("[data-scroll-step]");
    const toggle = event.target.closest("[data-video-toggle]");

    if (arrow) {
      this.#track.scrollBy({ left: Number(arrow.dataset.scrollStep) * this.#step(), behavior: "smooth" });
    } else if (toggle) {
      const card = toggle.closest("[data-video-card]");
      const playing = toggle.getAttribute("aria-pressed") === "true";
      if (playing) {
        this.#paused.add(card);
      } else {
        this.#paused.delete(card);
      }
      this.#play(card, !playing);
    }
  };

  #onBlockSelect = (event) => {
    const card = event.target.closest?.("[data-video-card]");
    if (card && this.contains(card)) {
      this.#track.scrollTo({ left: this.#cards.indexOf(card) * this.#step(), behavior: "smooth" });
    }
  };
}

if (!customElements.get("video-carousel")) {
  customElements.define("video-carousel", VideoCarousel);
}
