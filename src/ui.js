/**
 * Kerangka aplikasi: header (brand, pencarian, bahasa, satuan, geolokasi),
 * status strip, ticker, konten utama, dan footer.
 * Semua teks dinamis ditulis lewat textContent (bukan innerHTML).
 */

import { LOCALE_OPTIONS, t } from "./i18n/index.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const UNIT_OPTIONS = Object.freeze([
  { value: "c", label: "°C", nameKey: "unit.celsius" },
  { value: "f", label: "°F", nameKey: "unit.fahrenheit" },
]);

export function createUI(root, { onUnitChange, onLanguageChange, onLocate, onCommand } = {}) {
  const header = el("header", "app-header");

  const brand = el("div", "brand");
  brand.append(el("span", "brand__mark", "☀"), el("span", "brand__name", "ATMOS"));
  const tagline = el("span", "brand__tagline", t("brand.tagline"));
  brand.append(tagline);

  const searchSlot = el("div", "header-search");

  const controls = el("div", "header-controls");

  const langToggle = el("div", "lang-toggle");
  langToggle.setAttribute("role", "group");
  langToggle.setAttribute("aria-label", t("a11y.language"));
  const langStatus = el("span", "sr-only");
  langStatus.setAttribute("aria-live", "polite");

  const languageButtons = LOCALE_OPTIONS.map((option) => {
    const button = el("button", "lang-toggle__option", t(option.labelKey));
    button.type = "button";
    button.dataset.locale = option.value;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      onLanguageChange?.(option.value);
      langStatus.textContent = t("a11y.langChange", { name: t(option.nameKey) });
    });
    langToggle.append(button);
    return button;
  });

  const unitToggle = el("div", "unit-toggle");
  unitToggle.setAttribute("role", "group");
  unitToggle.setAttribute("aria-label", t("a11y.tempUnit"));

  const unitStatus = el("span", "sr-only");
  unitStatus.setAttribute("aria-live", "polite");

  const unitButtons = UNIT_OPTIONS.map((option) => {
    const button = el("button", "unit-toggle__option", option.label);
    button.type = "button";
    button.dataset.unit = option.value;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      onUnitChange?.(option.value);
      unitStatus.textContent = t("a11y.unitChange", { name: t(option.nameKey) });
    });
    unitToggle.append(button);
    return button;
  });

  const geoButton = el("button", "geo-button");
  geoButton.type = "button";
  const geoIcon = el("span", "geo-button__icon", "◎");
  geoIcon.setAttribute("aria-hidden", "true");
  const geoLabel = el("span", "geo-button__label", t("geo.button"));
  geoButton.append(geoIcon, geoLabel);
  geoButton.setAttribute("aria-label", t("geo.aria"));
  geoButton.addEventListener("click", () => onLocate?.());

  const commandButton = el("button", "command-button");
  commandButton.type = "button";
  const commandIcon = el("span", "command-button__icon", ">_");
  commandIcon.setAttribute("aria-hidden", "true");
  const commandLabel = el("span", "command-button__label", t("command.trigger"));
  commandButton.append(commandIcon, commandLabel);
  commandButton.setAttribute("aria-label", t("command.open"));
  commandButton.title = t("command.open");
  commandButton.addEventListener("click", () => onCommand?.());

  controls.append(langToggle, unitToggle, geoButton, commandButton, langStatus, unitStatus);
  header.append(brand, searchSlot, controls);

  const statusHost = el("div", "status-host");
  const tickerHost = el("div", "ticker-host");

  const main = el("main", "app-main");
  main.id = "app-main";

  const externalLink = (href, label) => {
    const link = el("a", "app-footer__link", label);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    return link;
  };

  const footer = el("footer", "app-footer");
  const attribution = el("p", "app-footer__text");
  const footerPrefix = document.createTextNode(t("footer.weatherData"));
  const licenseLink = externalLink(
    "https://creativecommons.org/licenses/by/4.0/",
    t("footer.license")
  );
  attribution.append(
    footerPrefix,
    externalLink("https://open-meteo.com/", "Open-Meteo"),
    document.createTextNode(" ("),
    licenseLink,
    document.createTextNode(")")
  );
  footer.append(attribution);

  const toast = el("div", "app-toast");
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  toast.hidden = true;
  let toastTimer = null;

  root.append(header, statusHost, tickerHost, main, footer, toast);

  const skipLink = document.querySelector(".skip-link");

  function render(state) {
    const active = state.unit === "f" ? "f" : "c";
    for (const button of unitButtons) {
      button.setAttribute("aria-pressed", button.dataset.unit === active ? "true" : "false");
    }

    const locale = state.locale === "en" ? "en" : "id";
    for (const button of languageButtons) {
      button.setAttribute("aria-pressed", button.dataset.locale === locale ? "true" : "false");
    }

    tagline.textContent = t("brand.tagline");
    geoLabel.textContent = t("geo.button");
    geoButton.setAttribute("aria-label", t("geo.aria"));
    commandLabel.textContent = t("command.trigger");
    commandButton.setAttribute("aria-label", t("command.open"));
    commandButton.title = t("command.open");
    unitToggle.setAttribute("aria-label", t("a11y.tempUnit"));
    langToggle.setAttribute("aria-label", t("a11y.language"));
    document.documentElement.dataset.theme = state.theme === "blackout" ? "blackout" : "paper";
    footerPrefix.nodeValue = t("footer.weatherData");
    licenseLink.textContent = t("footer.license");

    if (skipLink) skipLink.textContent = t("a11y.skip");
  }

  function setLocating(value) {
    geoButton.disabled = Boolean(value);
    geoLabel.textContent = value ? t("geo.locating") : t("geo.button");
  }

  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("app-toast--visible");
    toastTimer = setTimeout(() => {
      toast.classList.remove("app-toast--visible");
      toast.hidden = true;
    }, 5000);
  }

  return { render, main, searchSlot, statusHost, tickerHost, setLocating, notify };
}
