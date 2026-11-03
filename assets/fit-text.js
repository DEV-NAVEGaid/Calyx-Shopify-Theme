/*
 * Shrinks a single line of text until it fits its box. The CSS gives a first
 * size from the character count (`--wordmark-chars`); this only corrects it
 * when wide letters still overflow, and again whenever the box resizes.
 *
 * Measuring forces a layout, so instances share one frame: every element is
 * reset and read first, then written. Nothing is measured until the text is
 * near the viewport — a footer wordmark is far below the fold at load, and
 * fitting it there costs a full-document layout for text nobody can see.
 */
const pending = new Set();
let frame = 0;

function flush() {
  frame = 0;
  const measured = [];
  for (const element of pending) {
    element.style.removeProperty("font-size");
    const width = element.clientWidth;
    measured.push({ element, overflow: width ? element.scrollWidth / width : 1 });
  }
  pending.clear();
  // Read every size before writing any, so the batch costs one layout.
  for (const item of measured) {
    item.size = parseFloat(getComputedStyle(item.element).fontSize);
  }
  for (const { element, overflow, size } of measured) {
    if (overflow > 1) {
      element.style.fontSize = `${Math.floor((size / overflow) * 100) / 100}px`;
    }
  }
}

function schedule(element) {
  pending.add(element);
  if (!frame) frame = requestAnimationFrame(flush);
}

class FitText extends HTMLElement {
  #observer = null;
  #visibility = null;
  #width = 0;

  connectedCallback() {
    this.#visibility = new IntersectionObserver(
      ([entry], observer) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        this.#visibility = null;
        this.#watch();
      },
      { rootMargin: "300px" },
    );
    this.#visibility.observe(this);
  }

  disconnectedCallback() {
    this.#visibility?.disconnect();
    this.#observer?.disconnect();
  }

  #watch() {
    // Watch the parent: resizing the text itself changes its own height.
    this.#observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width === this.#width) return;
      this.#width = entry.contentRect.width;
      schedule(this);
    });
    this.#observer.observe(this.parentElement);
    document.fonts?.ready.then(() => schedule(this));
    schedule(this);
  }
}

if (!customElements.get("fit-text")) {
  customElements.define("fit-text", FitText);
}
