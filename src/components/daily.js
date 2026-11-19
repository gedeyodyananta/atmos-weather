/**
 * Prakiraan 7 hari (SPEC F3, UI-SPEC §9).
 * Baris dengan bar rentang suhu min–maks yang diskalakan dari seluruh minggu;
 * hari ini ditandai.
 */

import { clear, el } from "../utils/dom.js";
import {
  formatDayLabel,
  formatDayMonth,
  formatTemperature,
  isSameDate,
} from "../utils/format.js";
import { getWeatherConditionLabel } from "../utils/wmo.js";
import { createRainIcon, createWeatherGlyph } from "./weatherGlyph.js";

function numericValues(values) {
  return values.filter((value) => typeof value === "number" && Number.isFinite(value));
}

function getWeekRange(days) {
  const mins = numericValues(days.map((day) => day.temperatureMin));
  const maxs = numericValues(days.map((day) => day.temperatureMax));
  if (mins.length === 0 || maxs.length === 0) return null;

  return { min: Math.min(...mins), max: Math.max(...maxs) };
}

function createBar(day, weekRange) {
  const bar = el("span", "daily-row__bar");
  if (!weekRange) return bar;

  const { temperatureMin, temperatureMax } = day;
  if (
    typeof temperatureMin !== "number" ||
    typeof temperatureMax !== "number" ||
    !Number.isFinite(temperatureMin) ||
    !Number.isFinite(temperatureMax)
  ) {
    return bar;
  }

  const span = weekRange.max - weekRange.min || 1;
  const left = ((temperatureMin - weekRange.min) / span) * 100;
  const width = Math.max(((temperatureMax - temperatureMin) / span) * 100, 8);

  const range = el("span", "daily-row__range");
  range.style.left = `${left.toFixed(1)}%`;
  range.style.width = `${Math.min(width, 100 - left).toFixed(1)}%`;
  bar.append(range);
  return bar;
}

function createRow(day, view, weekRange, todayKey) {
  const isToday = todayKey !== null && isSameDate(day.date, todayKey);
  const row = el("li", `daily-row${isToday ? " daily-row--today" : ""}`);
  row.setAttribute("aria-label", `${isToday ? "Hari ini, " : ""}${getWeatherConditionLabel(day.weatherCode)}`);

  const dayCell = el("span", "daily-row__day");
  dayCell.append(el("span", "daily-row__dayname", formatDayLabel(day.date)));
  dayCell.append(el("span", "daily-row__date", formatDayMonth(day.date)));
  if (isToday) dayCell.append(el("span", "daily-row__today", "Hari ini"));

  row.append(dayCell);
  row.append(createWeatherGlyph(day.weatherCode, { size: 30, decorative: true }));
  row.append(createBar(day, weekRange));

  const temps = el("span", "daily-row__temps");
  temps.append(
    el(
      "span",
      null,
      `${formatTemperature(day.temperatureMax, view.unit, { decimals: 0 })} / ${formatTemperature(
        day.temperatureMin,
        view.unit,
        { decimals: 0 }
      )}`
    )
  );

  if (typeof day.precipitationProbability === "number") {
    const rain = el("span", "daily-row__rain");
    rain.append(createRainIcon(11), el("span", null, `${Math.round(day.precipitationProbability)}%`));
    temps.append(rain);
  }

  row.append(temps);
  return row;
}

export function createDaily() {
  const element = el("section", "panel daily-panel");
  element.setAttribute("aria-labelledby", "daily-title");

  function update(view) {
    clear(element);

    const head = el("div", "panel__head");
    const title = el("h2", "section-title", "02 /// 7 HARI");
    title.id = "daily-title";
    head.append(title);
    element.append(head);

    const days = (view.weather?.daily ?? []).slice(0, 7);

    if (days.length === 0 && view.status === "loading") {
      const skeleton = el("div", "daily-list");
      skeleton.setAttribute("aria-hidden", "true");
      for (let index = 0; index < 7; index += 1) {
        const row = el("div", "daily-skeleton skeleton");
        skeleton.append(row);
      }
      element.append(skeleton);
      return;
    }

    if (days.length === 0) {
      element.append(el("p", "panel__empty", "Data prakiraan 7 hari tidak tersedia."));
      return;
    }

    const weekRange = getWeekRange(days);
    const todayKey = view.weather?.current?.timestamp ?? null;

    const list = el("ol", "daily-list");
    for (const day of days) list.append(createRow(day, view, weekRange, todayKey));
    element.append(list);
  }

  return { element, update };
}
