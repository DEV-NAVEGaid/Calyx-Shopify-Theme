/*
 * Text roll on hover for link-style buttons: each letter carries a copy above
 * it, and on hover the letters slide down one after another as the copies
 * drop in. Only the link's own text is split; icons and live counts inside it
 * stay as they are. Screen readers keep reading the original text.
 *
 * Links added later (cart drawer, quick view, re-rendered sections) are
 * picked up too. Turned on in Theme settings > Animations.
 */
const SELECTOR = [
  ".arrow-link",
  ".header-nav__link",
  ".header__text-link",
  ".mega-menu__link",
  ".mega-promo__link",
  ".menu-block__list a",
  ".footer__policies a",
  ".related-stories__link",
  ".journal-featured__link",
  ".quick-view__full-details",
  ".predictive-search__all",
].join(", ");

const DONE = "textRoll";

function rollWord(word, start) {
  const wordEl = document.createElement("span");
  wordEl.className = "text-roll__word";
  [...word].forEach((char, i) => {
    const cell = document.createElement("span");
    cell.className = "text-roll__char";
    cell.style.setProperty("--i", start + i);
    const face = document.createElement("span");
    face.textContent = char;
    cell.append(face, face.cloneNode(true));
    wordEl.append(cell);
  });
  return wordEl;
}

function split(link) {
  if (link.dataset[DONE]) return;
  link.dataset[DONE] = "true";

  let index = 0;
  for (const node of [...link.childNodes]) {
    if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;

    const text = node.textContent;
    const roll = document.createElement("span");
    roll.className = "text-roll";

    const label = document.createElement("span");
    label.className = "visually-hidden";
    label.textContent = text;

    const letters = document.createElement("span");
    letters.setAttribute("aria-hidden", "true");
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        letters.append(document.createTextNode(" "));
      } else {
        letters.append(rollWord(part, index));
        index += part.length;
      }
    }

    roll.append(label, letters);
    node.replaceWith(roll);
  }
}

function splitWithin(root) {
  if (root.matches?.(SELECTOR)) split(root);
  root.querySelectorAll?.(SELECTOR).forEach(split);
}

// A hover effect: touch screens skip it and keep the plain markup.
if (window.matchMedia("(hover: hover)").matches) {
  splitWithin(document);

  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) splitWithin(node);
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}
