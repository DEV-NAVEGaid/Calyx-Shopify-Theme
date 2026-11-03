/*
 * Product guide modal (sizes, ingredients): a `[data-guide-open]` button
 * opens the dialog it names; the close button, Escape, or a click on the
 * backdrop closes it. Listens on the document, so triggers keep working
 * after the variant picker re-renders the section.
 */
document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-guide-open]");
  if (trigger) {
    document.getElementById(trigger.dataset.guideOpen)?.showModal();
    return;
  }

  const dialog = event.target.closest(".guide-modal");
  if (!dialog) return;
  // A click on the backdrop lands on the dialog itself.
  if (event.target === dialog || event.target.closest("[data-guide-close]")) {
    dialog.close();
  }
});
