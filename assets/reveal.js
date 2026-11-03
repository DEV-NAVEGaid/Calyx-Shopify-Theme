/*
 * Scroll reveal (Theme settings > Animations), after React Bits' "Animated
 * Content" with the Blur preset: as a section's content scrolls into view,
 * each part rises from below, sharpens from a blur, and fades in, one after
 * another. Scrolling back up past a part hides it again, so it plays again on
 * the way down.
 *
 * The parts are the children of a section's innermost wrapper; a grid or
 * list among them (cards, products) is split into its items. The first
 * section is left alone so the first screen never waits. Animations use the
 * Web Animations API and leave no styles behind when they finish, so they
 * never clash with an element's own hover transitions. Skipped in the theme
 * editor and for reduced motion.
 *
 * Distance, blur, duration and stagger come from CSS variables set in
 * snippets/theme-styles-variables.liquid.
 */
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const EASING = "cubic-bezier(0.25, 0.46, 0.45, 0.94)"; // power2.out
const THRESHOLD = 0.1;
const MAX_ITEMS = 24;

function settings() {
  const root = getComputedStyle(document.documentElement);
  const number = (name, fallback) => {
    const value = parseFloat(root.getPropertyValue(name));
    return Number.isFinite(value) ? value : fallback;
  };
  return {
    distance: number("--reveal-distance", 40),
    blur: number("--reveal-blur", 12),
    duration: number("--reveal-duration", 1000),
    stagger: number("--reveal-stagger", 80),
  };
}

// A grid or flex container whose children are the real items (cards, products).
// Cheap checks first: `getAnimations({ subtree: true })` walks every descendant.
function isCollection(element) {
  if (element.children.length < 3) return false;
  if (/^(P|H[1-6]|A|BUTTON|SPAN)$/.test(element.tagName)) return false;
  if (!/grid|flex/.test(getComputedStyle(element).display)) return false;
  // A moving band (marquee) stays whole.
  return element.getAnimations({ subtree: true }).length === 0;
}

function partsOf(section) {
  let wrapper = section;
  while (wrapper.children.length === 1 && wrapper.firstElementChild.children.length) {
    wrapper = wrapper.firstElementChild;
  }

  const parts = [];
  for (const child of wrapper.children) {
    if (/^(SCRIPT|STYLE|TEMPLATE|DIALOG)$/.test(child.tagName)) continue;
    const position = getComputedStyle(child).position;
    if (position === "fixed" || position === "absolute") continue;
    if (isCollection(child)) parts.push(...child.children);
    else parts.push(child);
  }
  return parts.slice(0, MAX_ITEMS);
}

if (!reducedMotion && !window.Shopify?.designMode && "animate" in Element.prototype) {
  const { distance, blur, duration, stagger } = settings();
  const hiddenStyle = { opacity: "0", translate: `0 ${distance}px`, filter: `blur(${blur}px)` };
  const keyframes = [
    { opacity: 0, translate: `0 ${distance}px`, filter: `blur(${blur}px)` },
    { opacity: 1, translate: "0 0", filter: "blur(0px)" },
  ];

  const hide = (part) => {
    part.getAnimations().forEach((animation) => animation.id === "reveal" && animation.cancel());
    Object.assign(part.style, hiddenStyle);
    part.dataset.reveal = "hidden";
  };

  const show = (part, order) => {
    part.style.removeProperty("opacity");
    part.style.removeProperty("translate");
    part.style.removeProperty("filter");
    part.dataset.reveal = "shown";
    const animation = part.animate(keyframes, { duration, delay: order * stagger, easing: EASING, fill: "backwards" });
    animation.id = "reveal";
  };

  const parts = [];
  for (const section of [...document.querySelectorAll("main > .shopify-section")].slice(1)) {
    for (const part of partsOf(section)) {
      hide(part);
      parts.push(part);
    }
  }

  // A part shows once THRESHOLD of it is inside the viewport; parts that enter
  // together play in reading order. The translate offset is left out of the
  // measurement so a hidden part counts from where it will land.
  const check = () => {
    const entering = [];
    for (const part of parts) {
      const box = part.getBoundingClientRect();
      const offset = part.dataset.reveal === "hidden" ? distance : 0;
      const top = box.top - offset;
      const bottom = box.bottom - offset;
      const visible = Math.min(bottom, window.innerHeight) - Math.max(top, 0);
      const inView = box.height > 0 && visible >= Math.min(box.height, window.innerHeight) * THRESHOLD;

      if (inView && part.dataset.reveal === "hidden") entering.push({ part, top, left: box.left });
      // Reverse: a part that drops back below the viewport hides again.
      else if (!inView && part.dataset.reveal === "shown" && top > window.innerHeight) hide(part);
    }

    entering.sort((a, b) => a.top - b.top || a.left - b.left);
    entering.forEach(({ part }, order) => show(part, order));
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    setTimeout(() => {
      queued = false;
      check();
    }, 16);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  // Content that appears without scrolling (tabs, slides) is picked up too.
  document.addEventListener("click", () => setTimeout(check, 50));
  check();
}
