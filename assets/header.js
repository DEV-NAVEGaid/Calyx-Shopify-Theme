/*
 * Header behavior:
 * - Drop-downs and mega menus open on hover as well as click, one at a time,
 *   and close on Escape or a click elsewhere.
 * - Mega menu promo blocks move into the mega menu they name.
 * - The mobile drawer's close button closes it; Back closes a drawer panel.
 * - A transparent header turns solid once the page scrolls, and
 *   `--header-height` stays current for layouts that sit under it.
 * - "Show when scrolling up" hides the sticky header on the way down and
 *   brings it back on the way up.
 */
class HeaderComponent extends HTMLElement {
  #resizeObserver = null;
  #closeTimer = null;
  #lastScrollY = window.scrollY;

  get #dropdowns() {
    return [...this.querySelectorAll(".header-nav__dropdown")];
  }

  connectedCallback() {
    this.#placePromos();
    this.#deferAccount();

    for (const dropdown of this.#dropdowns) {
      dropdown.addEventListener("mouseenter", this.#onEnter);
      dropdown.addEventListener("mouseleave", this.#onLeave);
      dropdown.addEventListener("toggle", this.#onToggle);
    }

    this.addEventListener("click", this.#onClick);
    this.addEventListener("keydown", this.#onKeydown);
    document.addEventListener("click", this.#onDocumentClick);

    this.#resizeObserver = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--header-height", `${this.offsetHeight}px`);
    });
    this.#resizeObserver.observe(this);

    if (this.classList.contains("header--transparent") || this.classList.contains("header--sticky-up")) {
      window.addEventListener("scroll", this.#onScroll, { passive: true });
      this.#onScroll();
    }
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.#onDocumentClick);
    window.removeEventListener("scroll", this.#onScroll);
    this.#resizeObserver?.disconnect();
  }

  // Promo blocks name a menu item; their handle matches `data-mega-promos`.
  #placePromos() {
    for (const promo of this.querySelectorAll(".header__promos .mega-promo")) {
      const target = this.querySelector(`[data-mega-promos="${promo.dataset.menuItem}"]`);
      target?.append(promo);
    }
  }

  // Signed out, the account starts as a plain link. Shopify's account sheet
  // (a sign-in iframe and its scripts) replaces it on the visitor's first
  // interaction, so none of that runs during the page load. Interacting with
  // the link itself never swaps it (that would drop the tap or the focus):
  // it just follows through to the account page.
  #deferAccount() {
    const template = this.querySelector("template[data-account-template]");
    const link = this.querySelector("[data-account-link]");
    if (!template || !link) return;

    const events = ["pointerdown", "pointermove", "keydown", "focusin", "scroll", "wheel", "touchstart"];
    const swap = (event) => {
      if (event.target instanceof Node && link.contains(event.target)) return;
      events.forEach((type) => window.removeEventListener(type, swap, true));
      link.replaceWith(template.content.cloneNode(true));
      template.remove();
    };
    events.forEach((type) => window.addEventListener(type, swap, { capture: true, passive: true }));
  }

  #onEnter = (event) => {
    if (!window.matchMedia("(hover: hover)").matches) {
      return;
    }
    clearTimeout(this.#closeTimer);
    event.currentTarget.open = true;
  };

  #onLeave = (event) => {
    if (!window.matchMedia("(hover: hover)").matches) {
      return;
    }
    const dropdown = event.currentTarget;
    this.#closeTimer = setTimeout(() => {
      dropdown.open = false;
    }, 150);
  };

  #onToggle = (event) => {
    if (!event.currentTarget.open) {
      return;
    }
    for (const dropdown of this.#dropdowns) {
      if (dropdown !== event.currentTarget) {
        dropdown.open = false;
      }
    }
  };

  #onClick = (event) => {
    if (event.target.closest("[data-submenu-close]")) {
      const submenu = event.target.closest(".header-drawer__submenu");
      submenu.open = false;
      submenu.querySelector("summary").focus();
    }
    if (event.target.closest("[data-drawer-close]")) {
      this.querySelector(".header-drawer").open = false;
      for (const submenu of this.querySelectorAll(".header-drawer__submenu[open]")) {
        submenu.open = false;
      }
    }
  };

  #onKeydown = (event) => {
    if (event.key !== "Escape") {
      return;
    }
    const open = event.target.closest("details[open]");
    if (open) {
      open.open = false;
      open.querySelector("summary")?.focus();
    }
  };

  #onDocumentClick = (event) => {
    if (this.contains(event.target)) {
      return;
    }
    for (const dropdown of this.#dropdowns) {
      dropdown.open = false;
    }
  };

  #onScroll = () => {
    const y = window.scrollY;
    this.classList.toggle("is-scrolled", y > 10);

    if (this.classList.contains("header--sticky-up")) {
      const delta = y - this.#lastScrollY;
      if (y <= this.offsetHeight) {
        this.classList.remove("is-hidden");
      } else if (delta > 4) {
        this.classList.add("is-hidden");
      } else if (delta < -4) {
        this.classList.remove("is-hidden");
      }
    }
    this.#lastScrollY = y;
  };
}

if (!customElements.get("header-component")) {
  customElements.define("header-component", HeaderComponent);
}
