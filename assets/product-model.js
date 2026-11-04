/*
 * A product's 3D model (`<product-model>` around the `<model-viewer>` that
 * Liquid's model_viewer_tag prints). The first time a model comes into view,
 * Shopify's model viewer and its controls (play, zoom, full screen) load
 * through Shopify.loadFeatures, the way Shopify serves them to themes; a
 * model in a hidden gallery slide waits until its slide is shown.
 */
let modelViewerUI = null;

function loadModelViewerUI() {
  modelViewerUI ??= new Promise((resolve, reject) => {
    if (!window.Shopify?.loadFeatures) {
      reject(new Error("Shopify.loadFeatures is unavailable"));
      return;
    }

    window.Shopify.loadFeatures([
      {
        name: "model-viewer-ui",
        version: "1.0",
        onLoad: (error) => (error ? reject(error) : resolve()),
      },
    ]);
  });

  return modelViewerUI;
}

class ProductModel extends HTMLElement {
  #observer = null;
  #ui = null;

  connectedCallback() {
    this.#observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.#observer.disconnect();
          this.#load();
        }
      },
      { rootMargin: "200px" },
    );
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  /* Stops the model's animation, e.g. when its gallery slide is left. */
  pause() {
    this.#ui?.pause();
  }

  async #load() {
    try {
      await loadModelViewerUI();
    } catch {
      return;
    }

    const viewer = this.querySelector("model-viewer");
    if (viewer && !this.#ui && this.isConnected) {
      this.#ui = new window.Shopify.ModelViewerUI(viewer);
    }
  }
}

if (!customElements.get("product-model")) {
  customElements.define("product-model", ProductModel);
}
