/*
 * Stockists section:
 * - Numbers the store cards and shows each store's opening hours for today.
 * - Filters the list by the search text and the filter chips.
 * - "Use my location" sorts the stores by distance and shows how far each is.
 * - Draws a numbered pin per store on the map, placed from its latitude and
 *   longitude; selecting a card or a pin selects both and opens the pin's
 *   label. The + / − buttons zoom in on the selected store.
 */
const EARTH_RADIUS_KM = 6371;
const KM_PER_MILE = 1.609344;
const MAX_ZOOM = 3;

class StockistsLocator extends HTMLElement {
  #stores = [];
  #filter = "all";
  #query = "";
  #origin = null;
  #selected = null;
  #zoom = 0;
  #resizeObserver = null;

  connectedCallback() {
    this.#stores = [...this.querySelectorAll("[data-stockist]")].map((element) => this.#readStore(element));

    this.querySelector("[data-stockists-search]")?.addEventListener("input", this.#onSearch);
    this.querySelector("[data-stockists-locate]")?.addEventListener("click", this.#onLocate);
    for (const chip of this.querySelectorAll("[data-filter]")) {
      chip.addEventListener("click", this.#onFilter);
    }
    for (const button of this.querySelectorAll("[data-stockists-zoom]")) {
      button.addEventListener("click", this.#onZoom);
    }
    this.addEventListener("click", this.#onSelect);

    this.#resizeObserver = new ResizeObserver(() => this.#drawMap());
    this.#resizeObserver.observe(this.querySelector("[data-stockists-map]"));

    this.#render();
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
  }

  #readStore(element) {
    const lat = parseFloat(element.dataset.lat);
    const lng = parseFloat(element.dataset.lng);
    const today = (element.dataset.hours || "").split("|")[new Date().getDay()]?.trim();
    const hours = element.querySelector("[data-stockist-hours]");
    hours.textContent = today
      ? this.dataset.openToday.replace("[hours]", today)
      : this.dataset.closedToday;
    hours.classList.toggle("stockist__hours--open", Boolean(today));

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "stockists__pin";
    pin.setAttribute("aria-label", element.dataset.name);
    pin.hidden = Number.isNaN(lat) || Number.isNaN(lng);

    return {
      element,
      pin,
      lat,
      lng,
      name: element.dataset.name,
      category: element.dataset.category,
      text: element.textContent.toLowerCase(),
      status: hours.textContent,
      distance: null,
    };
  }

  get #visible() {
    return this.#stores.filter(
      (store) =>
        (this.#filter === "all" || store.category === this.#filter) &&
        (!this.#query || store.text.includes(this.#query))
    );
  }

  #onSearch = (event) => {
    this.#query = event.target.value.trim().toLowerCase();
    this.#render();
  };

  #onFilter = (event) => {
    this.#filter = event.currentTarget.dataset.filter;
    for (const chip of this.querySelectorAll("[data-filter]")) {
      const active = chip === event.currentTarget;
      chip.classList.toggle("mood-filters__chip--active", active);
      chip.setAttribute("aria-pressed", String(active));
    }
    this.#render();
  };

  #onLocate = (event) => {
    const button = event.currentTarget;
    if (!navigator.geolocation) return this.#showMessage(this.dataset.locationError);

    button.setAttribute("aria-busy", "true");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        button.removeAttribute("aria-busy");
        this.#showMessage("");
        this.#origin = { lat: position.coords.latitude, lng: position.coords.longitude };
        for (const store of this.#stores) store.distance = this.#distanceTo(store);
        this.#selected = null;
        this.#render();
      },
      () => {
        button.removeAttribute("aria-busy");
        this.#showMessage(this.dataset.locationError);
      },
      { timeout: 10000 }
    );
  };

  #onZoom = (event) => {
    this.#zoom = Math.min(MAX_ZOOM, Math.max(0, this.#zoom + Number(event.currentTarget.dataset.stockistsZoom)));
    this.#drawMap();
  };

  #onSelect = (event) => {
    const target = event.target.closest("[data-stockist-select], .stockists__pin");
    if (!target) return;
    const store = this.#stores.find((item) => item.pin === target || item.element.contains(target));
    if (!store) return;
    this.#selected = store;
    this.#render();
    if (target.classList.contains("stockists__pin")) {
      store.element.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  };

  #showMessage(text) {
    const message = this.querySelector("[data-stockists-message]");
    message.textContent = text;
    message.hidden = !text;
  }

  // Great-circle distance in the section's unit.
  #distanceTo(store) {
    if (!this.#origin || Number.isNaN(store.lat)) return null;
    const rad = (degrees) => (degrees * Math.PI) / 180;
    const dLat = rad(store.lat - this.#origin.lat);
    const dLng = rad(store.lng - this.#origin.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(this.#origin.lat)) * Math.cos(rad(store.lat)) * Math.sin(dLng / 2) ** 2;
    const km = 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
    return this.dataset.unit === "km" ? km : km / KM_PER_MILE;
  }

  #formatDistance(distance) {
    return this.dataset.distance.replace("[distance]", distance < 10 ? distance.toFixed(1) : Math.round(distance));
  }

  #render() {
    const visible = this.#visible;
    if (this.#origin) visible.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    if (!visible.includes(this.#selected)) this.#selected = visible[0] ?? null;

    const list = this.querySelector("[data-stockists-list]");
    for (const store of this.#stores) {
      const index = visible.indexOf(store);
      store.element.hidden = index < 0;
      store.element.classList.toggle("stockist--selected", store === this.#selected);
      store.element.querySelector("[data-stockist-select]").setAttribute("aria-pressed", String(store === this.#selected));
      store.element.querySelector("[data-stockist-number]").textContent = index + 1;
      store.pin.textContent = index + 1;
      store.element.querySelector("[data-stockist-distance]").textContent =
        store.distance == null ? "" : this.#formatDistance(store.distance);
    }
    for (const store of visible) list.append(store.element);

    const count = this.querySelector("[data-stockists-count]");
    const template = this.#origin
      ? this.dataset.countNear
      : visible.length === 1
        ? this.dataset.countOne
        : this.dataset.countOther;
    count.textContent = template.replace("[count]", visible.length);
    this.querySelector("[data-stockists-empty]").hidden = visible.length > 0;

    this.#drawMap();
  }

  // Equirectangular projection of the visible stores into the map, with a
  // margin so edge pins stay clear of the frame. Zooming narrows the view
  // around the selected store.
  #drawMap() {
    const map = this.querySelector("[data-stockists-map]");
    const layer = this.querySelector("[data-stockists-pins]");
    const placed = this.#visible.filter((store) => !store.pin.hidden);
    const width = map.clientWidth || 1;
    const height = map.clientHeight || 1;

    for (const store of this.#stores) {
      if (!placed.includes(store)) store.pin.remove();
    }
    if (!placed.length) {
      this.querySelector("[data-stockists-popup]").hidden = true;
      return;
    }

    const lats = placed.map((store) => store.lat);
    const lngs = placed.map((store) => store.lng);
    const midLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const xScale = Math.cos((midLat * Math.PI) / 180);
    const focus = this.#zoom && this.#selected && placed.includes(this.#selected) ? this.#selected : null;
    const center = focus
      ? { x: focus.lng * xScale, y: focus.lat }
      : { x: ((Math.min(...lngs) + Math.max(...lngs)) / 2) * xScale, y: midLat };
    const spanX = Math.max((Math.max(...lngs) - Math.min(...lngs)) * xScale, 0.01);
    const spanY = Math.max(Math.max(...lats) - Math.min(...lats), 0.01);
    const scale = Math.min((width * 0.76) / spanX, (height * 0.76) / spanY) * 2 ** this.#zoom;

    for (const store of placed) {
      const x = width / 2 + (store.lng * xScale - center.x) * scale;
      const y = height / 2 - (store.lat - center.y) * scale;
      store.pin.style.left = `${(x / width) * 100}%`;
      store.pin.style.top = `${(y / height) * 100}%`;
      store.pin.classList.toggle("stockists__pin--selected", store === this.#selected);
      store.pin.setAttribute("aria-pressed", String(store === this.#selected));
      if (!store.pin.isConnected) layer.append(store.pin);
    }
    map.style.setProperty("--map-grid", `${48 * 2 ** this.#zoom}px`);

    const popup = this.querySelector("[data-stockists-popup]");
    const selected = this.#selected && placed.includes(this.#selected) ? this.#selected : null;
    popup.hidden = !selected;
    if (selected) {
      popup.querySelector("[data-stockists-popup-name]").textContent = selected.name;
      popup.querySelector("[data-stockists-popup-meta]").textContent = [
        selected.distance == null ? null : this.#formatDistance(selected.distance),
        selected.status,
      ]
        .filter(Boolean)
        .join(" · ");
      popup.style.left = selected.pin.style.left;
      popup.style.top = selected.pin.style.top;
    }
  }
}

if (!customElements.get("stockists-locator")) {
  customElements.define("stockists-locator", StockistsLocator);
}
