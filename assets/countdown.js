/*
 * Countdown block: counts down to `data-end` (an ISO date with the store's
 * UTC offset) once a second. When the time has passed it shows the
 * "after it ends" text, or hides the block if there is none.
 */
const SECOND = 1000;
const UNITS = [
  ["days", 86400],
  ["hours", 3600],
  ["minutes", 60],
  ["seconds", 1],
];

class CountdownTimer extends HTMLElement {
  #timer = null;

  connectedCallback() {
    this.end = Date.parse(this.dataset.end);
    if (Number.isNaN(this.end)) {
      this.hidden = true;
      return;
    }
    this.#tick();
    this.#timer = setInterval(() => this.#tick(), SECOND);
  }

  disconnectedCallback() {
    clearInterval(this.#timer);
  }

  #tick() {
    let left = Math.max(0, Math.floor((this.end - Date.now()) / SECOND));

    for (const [unit, size] of UNITS) {
      const value = Math.floor(left / size);
      left -= value * size;
      const field = this.querySelector(`[data-unit="${unit}"]`);
      if (field) field.textContent = String(value).padStart(2, "0");
    }

    if (this.end <= Date.now()) {
      clearInterval(this.#timer);
      const expired = this.querySelector(".countdown__expired");
      if (expired) {
        expired.hidden = false;
        this.querySelector(".countdown__units").hidden = true;
      } else {
        this.hidden = true;
      }
    }
  }
}

if (!customElements.get("countdown-timer")) {
  customElements.define("countdown-timer", CountdownTimer);
}
