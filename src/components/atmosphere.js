/**
 * Grid metrik atmosfer (SPEC F4, T6.2).
 * Semua nilai berasal dari model forecast; nilai `null` tampil sebagai "—",
 * bukan 0. Tile disusun padat agar mudah dipindai.
 */

import { t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";
import {
  formatNumber,
  formatPercent,
  formatTemperature,
  formatVisibility,
  getCloudCaption,
  getHumidityCaption,
  getPressureCaption,
  getUvCategory,
  getVisibilityCaption,
} from "../utils/format.js";

function createTile(label, value, caption) {
  const tile = el("li", "atmos-tile");
  tile.append(el("p", "atmos-tile__label", label));
  tile.append(el("p", "atmos-tile__value", value));
  tile.append(el("p", "atmos-tile__caption", caption));
  return tile;
}

export function createAtmosphere() {
  const element = el("section", "panel atmos-panel");
  element.setAttribute("aria-labelledby", "atmos-title");

  function update(view) {
    clear(element);

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", t("atmos.title"));
    title.id = "atmos-title";
    head.append(title);
    element.append(head);

    const current = view.current;

    if (!current) {
      if (view.status === "loading") {
        const skeleton = el("div", "atmos-grid");
        skeleton.setAttribute("aria-hidden", "true");
        for (let index = 0; index < 6; index += 1) {
          skeleton.append(el("div", "atmos-skeleton skeleton"));
        }
        element.append(skeleton);
      } else {
        element.append(el("p", "panel__empty", t("error.emptyData")));
      }
      return;
    }

    const uv = getUvCategory(current.uvIndex);
    const uvMax = view.daily?.[0]?.uvIndexMax;
    const list = el("ul", "atmos-grid");

    list.append(
      createTile(
        t("atmos.humidity"),
        formatPercent(current.humidity),
        getHumidityCaption(current.humidity)
      ),
      createTile(
        t("atmos.pressure"),
        typeof current.pressure === "number" ? `${formatNumber(current.pressure)} hPa` : "—",
        getPressureCaption(current.pressure)
      ),
      createTile(
        t("atmos.visibility"),
        formatVisibility(current.visibility),
        getVisibilityCaption(current.visibility)
      ),
      createTile(
        t("atmos.uv"),
        formatNumber(current.uvIndex),
        uv
          ? typeof uvMax === "number"
            ? t("atmos.uvCaption", { value: formatNumber(uvMax) })
            : uv.label
          : t("atmos.na")
      ),
      createTile(
        t("atmos.dewPoint"),
        formatTemperature(current.dewPoint, view.unit, { decimals: 0 }),
        t("atmos.dewPointCaption")
      ),
      createTile(
        t("atmos.cloudCover"),
        formatPercent(current.cloudCover),
        getCloudCaption(current.cloudCover)
      )
    );

    element.append(list);
  }

  return { element, update };
}
