/**
 * Bento polutan karhutla & visibilitas. Setiap kartu membandingkan nilai
 * dengan ambang WHO; nilai mentah CO/visibilitas dikonversi oleh utilitas
 * `pollutants.js` sehingga komponen hanya mengurus tampilan.
 */

import { t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";
import { formatNumber } from "../utils/format.js";
import { getPollutantStatus } from "../utils/pollutants.js";

const CARDS = [
  { key: "pm25", field: "pm25" },
  { key: "pm10", field: "pm10" },
  { key: "co", field: "co" },
  { key: "no2", field: "no2" },
  { key: "o3", field: "o3" },
  { key: "visibility", field: "visibility", source: "current" },
];

function createCard(config, view) {
  const status = getPollutantStatus(
    config.key,
    config.source === "current" ? view.current?.[config.field] : view.airQuality?.[config.field]
  );
  const name = t(`air.${config.key}`);

  const card = el("article", `pollutant-card pollutant-card--${status.level}`);
  card.dataset.pollutant = config.key;

  const head = el("div", "pollutant-card__head");
  head.append(
    el("h3", "pollutant-card__name", name),
    el("span", "pollutant-card__status", t(`air.status.${status.level}`))
  );
  card.append(head);

  const value = el("p", "pollutant-card__value");
  value.append(
    el(
      "strong",
      "pollutant-card__number",
      status.value === null ? "—" : formatNumber(status.value, config.key === "co" ? 2 : 1)
    ),
    el("span", "pollutant-card__unit", status.unit)
  );
  card.append(value);

  const limitText =
    config.key === "visibility"
      ? t("air.visibilityReference", { limit: status.limit })
      : t("air.whoLimit", { limit: status.limit, unit: status.unit });
  card.append(el("p", "pollutant-card__limit", limitText));

  const meter = el("div", "pollutant-card__meter");
  meter.setAttribute("role", "progressbar");
  meter.setAttribute("aria-valuemin", "0");
  meter.setAttribute("aria-valuemax", "100");
  meter.setAttribute("aria-valuenow", String(Math.round(status.percent)));
  meter.setAttribute(
    "aria-label",
    t("air.pollutantAria", {
      name,
      value: status.value === null ? t("air.na") : formatNumber(status.value, 1),
      unit: status.unit,
      percent: Math.round(status.percent),
      limit: status.limit,
    })
  );

  const fill = el("span", "pollutant-card__fill");
  fill.style.width = `${status.percent}%`;
  meter.append(fill);
  card.append(meter);

  return card;
}

export function createPollutantPanel() {
  const element = el("section", "panel pollutant-panel");
  element.setAttribute("aria-labelledby", "pollutant-title");

  function update(view) {
    clear(element);

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", t("air.pollutantsTitle"));
    title.id = "pollutant-title";
    head.append(title, el("span", "panel__hint", t("air.pollutantsHint")));
    element.append(head);

    const hasData = Boolean(view.airQuality || view.current);
    if (!hasData) {
      element.append(el("p", "panel__empty", t("haze.unavailable")));
      return;
    }

    const grid = el("div", "pollutant-grid");
    for (const config of CARDS) grid.append(createCard(config, view));
    element.append(grid);
  }

  return { element, update };
}
