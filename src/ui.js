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

const UNIT_LABEL = { c: "°C", f: "°F" };

export function createUI(root) {
  const header = el("header", "app-header");
  const brand = el("div", "brand");
  brand.append(el("span", "brand__mark", "☀"), el("span", "brand__name", "ATMOS"));
  brand.append(el("span", "brand__tagline", "WEATHER EXPLORER"));

  const unitBadge = el("span", "unit-badge");
  unitBadge.setAttribute("aria-live", "polite");

  header.append(brand, unitBadge);

  const main = el("main", "app-main");
  main.id = "app-main";

  const footer = el("footer", "app-footer");
  footer.append(
    el("p", "app-footer__text", "Data cuaca: Open-Meteo (CC BY 4.0)")
  );

  root.append(header, main, footer);

  function render(state) {
    unitBadge.textContent = `Satuan: ${UNIT_LABEL[state.unit] ?? UNIT_LABEL.c}`;
  }

  return { render, main };
}
