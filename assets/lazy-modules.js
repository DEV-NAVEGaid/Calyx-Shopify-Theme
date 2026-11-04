/*
 * Loads the script modules that snippets/lazy-script.liquid marks with
 * `<template data-lazy-module>`, when they're needed rather than with the page:
 * - `visible`: once the marker's section comes within a screen of the viewport;
 * - `idle`: once the page has loaded and the browser is idle, or on the
 *   visitor's first interaction, whichever comes first.
 *
 * The components are custom elements, so the ones already on the page upgrade
 * as soon as their module arrives. Markers added later (re-rendered sections,
 * drawers) are picked up too. In the theme editor everything loads right away.
 */
const imported = new Set();
const load = (url) => {
  if (imported.has(url)) return;
  imported.add(url);
  import(url);
};

const waiting = new Map();
const near = new IntersectionObserver(
  (entries) => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      near.unobserve(target);
      waiting.get(target)?.forEach(load);
      waiting.delete(target);
    }
  },
  { rootMargin: "100% 0px" },
);

const idle = new Set();
let ready = false;
const flushIdle = () => {
  ready = true;
  idle.forEach(load);
  idle.clear();
};

function register(marker) {
  const url = marker.dataset.lazyModule;
  if (!url || imported.has(url)) return;

  if (window.Shopify?.designMode) {
    load(url);
  } else if (marker.dataset.loadOn === "idle") {
    if (ready) load(url);
    else idle.add(url);
  } else {
    const target = marker.closest(".shopify-section") ?? marker.parentElement;
    if (!waiting.has(target)) {
      waiting.set(target, new Set());
      near.observe(target);
    }
    waiting.get(target).add(url);
  }
}

function registerWithin(root) {
  if (root.matches?.("template[data-lazy-module]")) register(root);
  root.querySelectorAll?.("template[data-lazy-module]").forEach(register);
}

registerWithin(document);

new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) registerWithin(node);
    });
  }
}).observe(document.body, { childList: true, subtree: true });

// Idle modules: after the page has loaded and gone quiet, or on the first interaction.
const events = ["pointerdown", "keydown", "touchstart", "scroll", "wheel"];
const start = () => {
  events.forEach((type) => window.removeEventListener(type, start, true));
  if (!ready) flushIdle();
};
events.forEach((type) => window.addEventListener(type, start, { capture: true, passive: true }));

const whenIdle = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 2000 }) : setTimeout(start, 500));
if (document.readyState === "complete") whenIdle();
else window.addEventListener("load", whenIdle, { once: true });
