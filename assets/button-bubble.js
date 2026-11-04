/*
 * Bubble up + text rotate on buttons: on hover a circle of the hover color
 * grows from above until it fills the button, while the label drops out and
 * comes back in from the top. Styles live in assets/base.css (.button--bubble).
 *
 * The label is wrapped in a clipping span so it can move; buttons added later
 * or whose text a script replaces are wrapped again. Turned on in
 * Theme settings > Animations.
 */
// The skip link keeps its own off-screen positioning.
const SELECTOR = ":is(.button, .button-dark, .button-secondary, .button-light):not(.skip-to-content)";

function wrap(button) {
  button.classList.add("button--bubble");
  if (button.firstElementChild?.classList.contains("button__clip") && button.childNodes.length === 1) return;

  const clip = document.createElement("span");
  clip.className = "button__clip";
  const label = document.createElement("span");
  label.className = "button__label";
  label.append(...button.childNodes);
  clip.append(label);
  button.append(clip);
}

function wrapWithin(root) {
  if (root.matches?.(SELECTOR)) wrap(root);
  root.querySelectorAll?.(SELECTOR).forEach(wrap);
}

// A hover effect: touch screens skip it and keep the plain markup.
if (window.matchMedia("(hover: hover)").matches) {
  wrapWithin(document);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // A script replaced a button's text: wrap the new label.
      if (mutation.target.matches?.(".button--bubble") && !mutation.target.querySelector(":scope > .button__clip")) {
        wrap(mutation.target);
      }
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) wrapWithin(node);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}
