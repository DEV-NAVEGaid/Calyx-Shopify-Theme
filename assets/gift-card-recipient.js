/*
 * Gift card recipient: ticking "send as a gift" shows the recipient fields
 * and enables them, so they are sent with the product form; unticking
 * hides and disables them again. Also sends the shopper's time zone offset
 * so a chosen send date is read in their time.
 */
class GiftCardRecipient extends HTMLElement {
  connectedCallback() {
    this.querySelector("[data-recipient-toggle]")?.addEventListener("change", this.#onToggle);
  }

  #onToggle = (event) => {
    const on = event.target.checked;
    const fields = this.querySelector("[data-recipient-fields]");
    fields.hidden = !on;
    fields.querySelectorAll("input, textarea").forEach((field) => (field.disabled = !on));

    const offset = this.querySelector("[data-recipient-offset]");
    if (offset) {
      offset.value = new Date().getTimezoneOffset().toString();
    }
  };
}

if (!customElements.get("gift-card-recipient")) {
  customElements.define("gift-card-recipient", GiftCardRecipient);
}
