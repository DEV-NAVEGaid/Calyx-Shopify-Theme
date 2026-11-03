/*
 * Collection cards with product slides: while the pointer is over a card,
 * its product images slide past one by one; leaving the card resets them.
 */
const INTERVAL = 1400;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const timers = new WeakMap();

function start(card) {
  const track = card.querySelector(".collection-card__track");
  const count = track?.children.length ?? 0;
  if (count < 2 || timers.has(card)) return;

  let index = 0;
  timers.set(
    card,
    setInterval(() => {
      index = (index + 1) % count;
      track.style.translate = `${-index * 100}% 0`;
    }, reducedMotion ? INTERVAL * 2 : INTERVAL)
  );
}

function stop(card) {
  clearInterval(timers.get(card));
  timers.delete(card);
  const track = card.querySelector(".collection-card__track");
  if (track) track.style.translate = "";
}

if (window.matchMedia("(hover: hover)").matches) {
  document.addEventListener("pointerover", (event) => {
    const card = event.target.closest?.(".collection-card");
    if (card?.querySelector("[data-collection-slides]")) start(card);
  });
  document.addEventListener("pointerout", (event) => {
    const card = event.target.closest?.(".collection-card");
    if (card && !card.contains(event.relatedTarget)) stop(card);
  });
}
