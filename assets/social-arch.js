/*
 * Social arch: the row of cards runs from edge to edge of the section and
 * slides sideways without end, while the arch stays where it is: each card's
 * photo is tallest at the middle of the row and steps down 50px per card
 * away from it (to 160px), so cards rise and fall as they pass through.
 *
 * The cards are repeated to fill the row (the copies are hidden from
 * assistive technology and the keyboard). The section's seconds set how long
 * a card takes to move one place (0 keeps the row still); Direction picks
 * right to left or left to right. The row pauses on hover or focus, while
 * off screen, and in the theme editor while one of its cards is selected;
 * it stays still when reduced motion is preferred.
 *
 * The photo height is drawn with a clip and the title moved with a transform
 * (`--cut`), so the motion never triggers a layout.
 */
const TALLEST = 300;
const SHORTEST = 160;
const STEP = 50;

class SocialArch extends HTMLElement {
  #track = null;
  #viewport = null;
  #originals = [];
  #cards = [];
  #slot = 0;
  #setWidth = 0;
  #offset = 0;
  #speed = 0;
  #frame = 0;
  #last = 0;
  #visible = false;
  #hovered = false;
  #selected = false;
  #resizeObserver = null;
  #intersectionObserver = null;

  connectedCallback() {
    this.#track = this.querySelector("[data-arch-track]");
    if (!this.#track) return;
    this.#viewport = this.#track.parentElement;
    this.#originals = [...this.#track.querySelectorAll(":scope > [data-arch-card]")];
    if (this.#originals.length === 0) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seconds = Number(this.dataset.autoplay || 0);
    this.#speed = reduced || seconds <= 0 ? 0 : 1 / seconds; // places per second
    if (this.dataset.direction === "to_right") this.#speed *= -1;

    this.#resizeObserver = new ResizeObserver(() => this.#measure());
    this.#resizeObserver.observe(this.#viewport);

    this.#intersectionObserver = new IntersectionObserver(([entry]) => {
      this.#visible = entry.isIntersecting;
      this.#play();
    });
    this.#intersectionObserver.observe(this);

    this.addEventListener("pointerenter", this.#onEnter);
    this.addEventListener("pointerleave", this.#onLeave);
    this.addEventListener("focusin", this.#onEnter);
    this.addEventListener("focusout", this.#onLeave);
    document.addEventListener("shopify:block:select", this.#onBlockSelect);
    document.addEventListener("shopify:block:deselect", this.#onBlockDeselect);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this.#frame);
    this.#resizeObserver?.disconnect();
    this.#intersectionObserver?.disconnect();
    document.removeEventListener("shopify:block:select", this.#onBlockSelect);
    document.removeEventListener("shopify:block:deselect", this.#onBlockDeselect);
  }

  // Card size and gap, then enough copies of the set to cover the row twice over.
  #measure() {
    const first = this.#originals[0];
    const gap = parseFloat(getComputedStyle(this.#track).columnGap) || 0;
    const slot = first.offsetWidth + gap;
    if (!slot) return;

    const firstRun = this.#slot === 0;
    this.#slot = slot;
    this.#setWidth = slot * this.#originals.length;

    const needed = Math.ceil((this.#viewport.clientWidth + this.#setWidth) / this.#setWidth) + 1;
    const sets = Math.max(needed, 2);
    this.#track.querySelectorAll("[data-arch-copy]").forEach((copy) => copy.remove());
    for (let set = 1; set < sets; set++) {
      for (const card of this.#originals) {
        const copy = card.cloneNode(true);
        copy.dataset.archCopy = "";
        copy.setAttribute("aria-hidden", "true");
        copy.inert = true;
        copy.removeAttribute("data-shopify-editor-block");
        this.#track.append(copy);
      }
    }
    this.#cards = [...this.#track.children];

    // Start with the middle card of the first set in the middle of the row.
    if (firstRun) {
      const middle = Math.floor(this.#originals.length / 2);
      this.#offset = this.#wrap(this.#setWidth + middle * slot + slot / 2 - this.#viewport.clientWidth / 2);
    }
    this.#draw();
  }

  // Keeps the offset within the second set, so there are cards on both sides.
  #wrap(offset) {
    const width = this.#setWidth;
    return ((((offset - width) % width) + width) % width) + width;
  }

  #draw() {
    this.#track.style.transform = `translateX(${-this.#offset}px)`;
    const middle = this.#viewport.clientWidth / 2;
    this.#cards.forEach((card, index) => {
      const center = index * this.#slot + this.#slot / 2 - this.#offset;
      const distance = Math.abs(center - middle) / this.#slot;
      const height = Math.max(SHORTEST, TALLEST - distance * STEP);
      card.style.setProperty("--cut", `${(TALLEST - height).toFixed(1)}px`);
    });
  }

  #play() {
    cancelAnimationFrame(this.#frame);
    if (!this.#speed || !this.#visible || this.#hovered || this.#selected) return;
    this.#last = performance.now();
    const tick = (now) => {
      const seconds = Math.min((now - this.#last) / 1000, 0.1);
      this.#last = now;
      this.#offset = this.#wrap(this.#offset + this.#speed * this.#slot * seconds);
      this.#draw();
      this.#frame = requestAnimationFrame(tick);
    };
    this.#frame = requestAnimationFrame(tick);
  }

  #onEnter = () => {
    this.#hovered = true;
    this.#play();
  };

  #onLeave = (event) => {
    if (event.type === "focusout" && this.contains(event.relatedTarget)) return;
    this.#hovered = false;
    this.#play();
  };

  // Theme editor: bring the selected card to the middle and hold it there.
  #onBlockSelect = (event) => {
    const index = this.#originals.indexOf(event.target);
    if (index === -1) return;
    this.#selected = true;
    this.#offset = this.#wrap(this.#setWidth + index * this.#slot + this.#slot / 2 - this.#viewport.clientWidth / 2);
    this.#draw();
    this.#play();
  };

  #onBlockDeselect = (event) => {
    if (!this.#originals.includes(event.target)) return;
    this.#selected = false;
    this.#play();
  };
}

if (!customElements.get("social-arch")) {
  customElements.define("social-arch", SocialArch);
}
