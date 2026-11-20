/**
 * Prakiraan per jam hari ini (SPEC F2, UI-SPEC §8).
 * Strip horizontal 24 entri dengan scroll-snap; entri pertama = "Sekarang".
 */

import { t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";
import { formatHour, formatTemperature, formatWind } from "../utils/format.js";
import { isTimeNight } from "../utils/sun.js";
import { getWeatherConditionLabel } from "../utils/wmo.js";
import { createRainIcon, createWeatherGlyph } from "./weatherGlyph.js";

function createItem(hour, index, view) {
  const isNow = index === 0;
  const timeLabel = isNow ? t("hourly.now") : formatHour(hour.time);
  const condition = getWeatherConditionLabel(hour.weatherCode);
  const temperature = formatTemperature(hour.temperature, view.unit);
  const night = isTimeNight(hour.time, view.current?.sunrise, view.current?.sunset);
  const isDay = night === null ? view.isDay : !night;

  const item = el("li", `hourly-item${isNow ? " hourly-item--now" : ""}`);
  item.title = `${formatHour(hour.time)} · ${condition} · ${temperature}`;

  item.append(el("p", "hourly-item__time", timeLabel));
  item.append(createWeatherGlyph(hour.weatherCode, { size: 36, decorative: true, isDay }));
  item.append(el("p", "hourly-item__temp", temperature));

  const probability =
    typeof hour.precipitationProbability === "number"
      ? `${Math.round(hour.precipitationProbability)}%`
      : "—";

  const rain = el("p", "hourly-item__rain");
  rain.append(createRainIcon(12), el("span", null, probability));
  rain.setAttribute("aria-label", t("hourly.rain", { value: probability }));
  item.append(rain);

  item.append(el("p", "hourly-item__wind", formatWind(hour.windSpeed)));
  return item;
}

export function createHourly() {
  const element = el("section", "panel hourly-panel");
  element.setAttribute("aria-labelledby", "hourly-title");

  function update(view) {
    clear(element);

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", t("hourly.title"));
    title.id = "hourly-title";
    head.append(title, el("p", "panel__hint", t("hourly.hint")));
    element.append(head);

    const hours = view.hourly.slice(0, 24);

    if (hours.length === 0 && view.status === "loading") {
      const skeleton = el("ol", "hourly-strip");
      skeleton.setAttribute("aria-hidden", "true");
      for (let index = 0; index < 8; index += 1) {
        skeleton.append(el("li", "hourly-skeleton skeleton"));
      }
      element.append(skeleton);
      return;
    }

    if (hours.length === 0) {
      element.append(el("p", "panel__empty", t("hourly.empty")));
      return;
    }

    const strip = el("ol", "hourly-strip");
    hours.forEach((hour, index) => strip.append(createItem(hour, index, view)));
    element.append(strip);
  }

  return { element, update };
}
