/**
 * Prakiraan per jam hari ini (SPEC F2, UI-SPEC §8).
 * Strip horizontal 24 entri dengan scroll-snap; entri pertama = "Sekarang".
 */

import { clear, el } from "../utils/dom.js";
import { formatHour, formatTemperature, formatWind } from "../utils/format.js";
import { getWeatherConditionLabel } from "../utils/wmo.js";
import { createRainIcon, createWeatherGlyph } from "./weatherGlyph.js";

function createItem(hour, index, unit) {
  const isNow = index === 0;
  const timeLabel = isNow ? "SEKARANG" : formatHour(hour.time);
  const condition = getWeatherConditionLabel(hour.weatherCode);
  const temperature = formatTemperature(hour.temperature, unit);

  const item = el("li", `hourly-item${isNow ? " hourly-item--now" : ""}`);

  item.append(el("p", "hourly-item__time", timeLabel));
  item.append(createWeatherGlyph(hour.weatherCode, { size: 34, label: condition }));
  item.append(el("p", "hourly-item__temp", temperature));

  const rain = el("p", "hourly-item__rain");
  rain.append(
    createRainIcon(12),
    el("span", null, typeof hour.precipitationProbability === "number"
      ? `${Math.round(hour.precipitationProbability)}%`
      : "—")
  );
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
    const title = el("h2", "section-title", "01 /// PER JAM");
    title.id = "hourly-title";
    head.append(title, el("p", "panel__hint", "geser →"));
    element.append(head);

    const hours = (view.weather?.hourly ?? []).slice(0, 24);

    if (hours.length === 0 && view.status === "loading") {
      const skeleton = el("ol", "hourly-strip");
      skeleton.setAttribute("aria-hidden", "true");
      for (let index = 0; index < 8; index += 1) {
        const item = el("li", "hourly-skeleton skeleton");
        skeleton.append(item);
      }
      element.append(skeleton);
      return;
    }

    if (hours.length === 0) {
      element.append(el("p", "panel__empty", "Data prakiraan per jam tidak tersedia."));
      return;
    }

    const strip = el("ol", "hourly-strip");
    hours.forEach((hour, index) => strip.append(createItem(hour, index, view.unit)));
    element.append(strip);
  }

  return { element, update };
}
