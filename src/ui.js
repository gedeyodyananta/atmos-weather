/**
 * Lapisan tampilan kerangka aplikasi: header, wadah konten utama, dan footer.
 * Semua teks dinamis ditulis lewat textContent (bukan innerHTML).
 */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const UNIT_OPTIONS = Object.freeze([
  { value: "c", label: "°C", name: "Celsius" },
  { value: "f", label: "°F", name: "Fahrenheit" },
]);

export function createUI(root, { onUnitChange } = {}) {
  const header = el("header", "app-header");
  const brand = el("div", "brand");
  brand.append(el("span", "brand__mark", "☀"), el("span", "brand__name", "ATMOS"));
  brand.append(el("span", "brand__tagline", "WEATHER EXPLORER"));

  const unitToggle = el("div", "unit-toggle");
  unitToggle.setAttribute("role", "group");
  unitToggle.setAttribute("aria-label", "Satuan suhu");

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
      unitStatus.textContent = `Satuan diubah ke ${option.name}`;
    });
    unitToggle.append(button);
    return button;
  });

  header.append(brand, unitToggle, unitStatus);

  const main = el("main", "app-main");
  main.id = "app-main";

  const footer = el("footer", "app-footer");
  footer.append(
    el("p", "app-footer__text", "Data cuaca: Open-Meteo (CC BY 4.0)")
  );

  root.append(header, main, footer);

  function render(state) {
    const active = state.unit === "f" ? "f" : "c";
    for (const button of unitButtons) {
      button.setAttribute("aria-pressed", button.dataset.unit === active ? "true" : "false");
    }
  }

  return { render, main };
}
