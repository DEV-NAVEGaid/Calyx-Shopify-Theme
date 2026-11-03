/*
 * Smooth page scrolling: mouse wheel and touchpad scrolling glide to a stop
 * instead of jumping, and in-page anchor links glide to their target.
 *
 * Left to the browser: touch screens, "reduce motion", zoom (ctrl + wheel),
 * scroll-locked pages (an open drawer or modal), and anything that scrolls
 * on its own — drawers, modals, sliders — when it can still scroll that way.
 * Keyboard and scrollbar scrolling stay native; the glide picks up from there.
 * Turned on in Theme settings > Animations.
 */
const EASE = 0.1;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");

let target = window.scrollY;
let current = window.scrollY;
let frame = null;

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;
const clamp = (value) => Math.min(Math.max(value, 0), maxScroll());

function isLocked() {
  return getComputedStyle(document.documentElement).overflowY === "hidden" || getComputedStyle(document.body).overflowY === "hidden";
}

// True when an element between the pointer and the page can still scroll in this direction.
function canScrollInside(element, deltaX, deltaY) {
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (deltaY && /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight) {
      if ((deltaY < 0 && node.scrollTop > 0) || (deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1)) return true;
    }
    if (deltaX && /(auto|scroll)/.test(style.overflowX) && node.scrollWidth > node.clientWidth) return true;
    if (node.matches("dialog[open], [data-mobile-open], details[open] > *")) return true;
  }
  return false;
}

function tick() {
  current += (target - current) * EASE;
  if (Math.abs(target - current) < 0.5) current = target;
  window.scrollTo({ top: current, behavior: "instant" });
  frame = current === target ? null : requestAnimationFrame(tick);
}

function glideTo(position) {
  target = clamp(position);
  if (!frame) {
    current = window.scrollY;
    frame = requestAnimationFrame(tick);
  }
}

function onWheel(event) {
  if (event.ctrlKey || event.defaultPrevented || isLocked()) return;
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
  if (canScrollInside(event.target, event.deltaX, event.deltaY)) return;

  event.preventDefault();
  const lineHeight = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? window.innerHeight : 1;
  if (!frame) target = window.scrollY;
  glideTo(target + event.deltaY * lineHeight);
}

// Keyboard, scrollbar, or code moved the page: continue from where it is.
function onScroll() {
  if (!frame) target = current = window.scrollY;
}

function onClick(event) {
  const link = event.target.closest('a[href*="#"]');
  if (!link || event.defaultPrevented || link.origin !== location.origin || link.pathname !== location.pathname) return;

  const id = decodeURIComponent(link.hash.slice(1));
  const destination = id && document.getElementById(id);
  if (!destination) return;

  event.preventDefault();
  const offset = parseFloat(getComputedStyle(destination).scrollMarginTop) || 0;
  glideTo(window.scrollY + destination.getBoundingClientRect().top - offset);
  history.pushState(null, "", link.hash);
}

if (!reduceMotion.matches && finePointer.matches) {
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("click", onClick);
}
