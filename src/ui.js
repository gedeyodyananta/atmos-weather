/**
 * Lapisan tampilan sederhana: membangun kerangka UI sekali, lalu
 * memperbarui bagian yang bergantung pada state.
 *
 * Semua teks dinamis ditulis lewat textContent (bukan innerHTML).
 */

import { getProducts } from "./products.js";

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

  const hero = el("section", "hero");
  const heroTitle = el("h1", "hero__title", "ATMOS WEATHER EXPLORER");
  const heroText = el(
    "p",
    "hero__text",
    "Kerangka aplikasi siap. Data cuaca, prakiraan, dan kualitas udara dihubungkan pada milestone berikutnya."
  );
  const heroNote = el("p", "hero__note", "Belum ada data cuaca yang ditampilkan.");
  hero.append(heroTitle, heroText, heroNote);

  const catalog = el("section", "catalog");
  const catalogTitle = el("h2", "section-title", "01 /// KATALOG");
  const catalogBody = el("div", "catalog__body");
  catalog.append(catalogTitle, catalogBody);

  const footer = el("footer", "app-footer");
  footer.append(
    el(
      "p",
      "app-footer__text",
      "Data cuaca: Open-Meteo (CC BY 4.0) · Peta: OpenStreetMap contributors"
    )
  );

  const main = el("main", "app-main");
  main.id = "app-main";
  main.append(hero, catalog);

  root.append(header, main, footer);

  function renderCatalog() {
    const products = getProducts();
    catalogBody.replaceChildren();

    if (products.length === 0) {
      const empty = el("div", "empty-state");
      empty.append(
        el("p", "empty-state__title", "Belum ada produk"),
        el("p", "empty-state__text", "Katalog akan diisi pada milestone berikutnya.")
      );
      catalogBody.append(empty);
      return;
    }

    const list = el("ul", "catalog__list");
    for (const product of products) {
      const item = el("li", "catalog__item", product.name ?? "Tanpa nama");
      list.append(item);
    }
    catalogBody.append(list);
  }

  function render(state) {
    unitBadge.textContent = `Satuan: ${UNIT_LABEL[state.unit] ?? UNIT_LABEL.c}`;
    renderCatalog();
  }

  return { render };
}
