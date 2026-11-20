/**
 * Overlay dialog bersama untuk Airgram, Battle Mode, dan Command Deck.
 * Satu overlay aktif pada satu waktu; fokus dikembalikan ke pemicu saat tutup.
 */

import { t } from "../i18n/index.js";

let activeOverlay = null;
let overlaySequence = 0;

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function createOverlay({
  className = "",
  eyebrow = "",
  title = "",
  size = "md",
  onClose = null,
} = {}) {
  if (!document.body) throw new Error("Overlay membutuhkan document.body.");

  overlaySequence += 1;
  const titleId = `overlay-title-${overlaySequence}`;
  const root = element("div", `overlay${className ? ` ${className}` : ""}`);
  root.hidden = true;

  const backdrop = element("div", "overlay__backdrop");
  backdrop.setAttribute("aria-hidden", "true");

  const dialog = element("section", `overlay__dialog overlay__dialog--${size}`);
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", titleId);

  const head = element("header", "overlay__head");
  const heading = element("div", "overlay__heading");
  const eyebrowNode = element("p", "overlay__eyebrow", eyebrow);
  const titleNode = element("h2", "overlay__title", title);
  titleNode.id = titleId;
  heading.append(eyebrowNode, titleNode);

  const closeButton = element("button", "overlay__close", "×");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", t("overlay.close"));
  head.append(heading, closeButton);

  const body = element("div", "overlay__body");
  dialog.append(head, body);
  root.append(backdrop, dialog);
  document.body.append(root);

  let previousFocus = null;

  const api = {
    root,
    body,
    titleNode,
    open(options = {}) {
      if (activeOverlay && activeOverlay !== api) activeOverlay.close();
      activeOverlay = api;
      previousFocus = document.activeElement;
      closeButton.setAttribute("aria-label", t("overlay.close"));
      root.hidden = false;
      document.body.classList.add("overlay-open");

      const target =
        (typeof options.focus === "function" && options.focus()) ||
        options.focus ||
        closeButton;
      if (target && typeof target.focus === "function") target.focus();
    },
    close() {
      if (root.hidden) return;
      root.hidden = true;
      document.body.classList.remove("overlay-open");
      if (activeOverlay === api) activeOverlay = null;
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
      onClose?.();
    },
    setTitle(value) {
      titleNode.textContent = value;
    },
    setEyebrow(value) {
      eyebrowNode.textContent = value;
    },
    isOpen() {
      return !root.hidden;
    },
  };

  closeButton.addEventListener("click", () => api.close());
  backdrop.addEventListener("click", () => api.close());

  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      api.close();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter(
      (node) => !node.hidden && node.getAttribute("aria-hidden") !== "true"
    );
    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  return api;
}

export function closeActiveOverlay() {
  activeOverlay?.close();
}

export function isOverlayOpen() {
  return Boolean(activeOverlay);
}
