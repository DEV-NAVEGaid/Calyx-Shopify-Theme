/*
 * Password page: "Enter using password" opens the password dialog, and
 * the dialog opens by itself when the page comes back with a wrong
 * password, so the shopper sees the error.
 */
const dialog = document.querySelector("[data-password-dialog]");

if (dialog) {
  document.querySelector("[data-password-open]")?.addEventListener("click", () => {
    dialog.showModal();
    dialog.querySelector('input[type="password"]')?.focus();
  });
  dialog.querySelector("[data-password-close]")?.addEventListener("click", () => dialog.close());

  // A click on the backdrop (outside the dialog box) closes it too.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  if (dialog.hasAttribute("data-open-on-load")) {
    dialog.showModal();
  }
}
