/**
 * Hero "kondisi cuaca saat ini" (SPEC F1, UI-SPEC §7).
 * Warna blok mengikuti `data-tone` (cerah/hujan/malam/…), bukan inline style,
 * dan semua label memakai kamus bahasa aktif.
 */

import { t } from "../i18n/index.js";
import { clear, el } from "../utils/dom.js";
import {
  formatClock,
  formatDateLabel,
  formatNumber,
  formatPercent,
  formatTemperature,
  formatTemperatureParts,
  formatWind,
  formatWindDirection,
  getHumidityCaption,
  getPressureCaption,
  getUvCategory,
} from "../utils/format.js";
import { getLocationDisplayName } from "../utils/locationName.js";
import { getWeatherConditionLabel } from "../utils/wmo.js";
import { createWeatherGlyph } from "./weatherGlyph.js";

function errorMessage(code) {
  const map = {
    NETWORK: "error.network",
    TIMEOUT: "error.timeout",
    HTTP_4XX: "error.http4xx",
    HTTP_5XX: "error.http5xx",
    PARSE: "error.parse",
    EMPTY_DATA: "error.emptyData",
  };
  return t(map[code] ?? "error.generic");
}

function createMetric(label, value, caption) {
  const item = el("li", "metric");
  item.append(el("p", "metric__label", label));
  item.append(el("p", "metric__value", value));
  if (caption) item.append(el("p", "metric__caption", caption));
  return item;
}

function createChip(label, value, tone) {
  const chip = el("li", `hero-chip${tone ? ` hero-chip--${tone}` : ""}`);
  chip.append(el("span", "hero-chip__label", label));
  chip.append(el("span", "hero-chip__value", value));
  return chip;
}

function createMeta(view, current) {
  const bits = [];
  const date = formatDateLabel(current.timestamp);
  if (date) bits.push(date);

  const clock = formatClock(current.timestamp);
  if (clock) {
    bits.push(`${clock}${view.timezoneAbbreviation ? ` ${view.timezoneAbbreviation}` : ""}`);
  }

  return el("p", "weather-hero__meta", bits.length > 0 ? bits.join(" · ") : t("hero.timeUnavailable"));
}

function createBody(view, current) {
  const body = el("div", "weather-hero__body");
  const readout = el("div", "weather-hero__readout");

  const temp = el("p", "weather-hero__temp");
  const parts = formatTemperatureParts(current.temperature, view.unit);
  if (parts) {
    temp.append(el("span", "weather-hero__temp-value", parts.value));
    temp.append(el("sup", "weather-hero__temp-unit", parts.unit));
  } else {
    temp.textContent = "—";
  }
  readout.append(temp);

  const condition = getWeatherConditionLabel(current.weatherCode);
  readout.append(el("p", "weather-hero__condition", condition));
  readout.append(
    el(
      "p",
      "weather-hero__feels",
      t("hero.feelsLike", { value: formatTemperature(current.apparentTemperature, view.unit) })
    )
  );

  const art = el("div", "weather-hero__art");
  art.append(
    createWeatherGlyph(current.weatherCode, {
      size: 196,
      label: t("hero.conditionAria", { condition }),
      isDay: view.isDay,
    })
  );

  body.append(readout, art);
  return body;
}

function createChips(view, current) {
  const list = el("ul", "weather-hero__chips");
  const uv = getUvCategory(current.uvIndex);
  const wind = formatWindDirection(current.windDirection);

  list.append(
    createChip(t("metric.uv"), uv?.badgeLabel ?? "—", "uv"),
    createChip(t("metric.wind"), formatWind(current.windSpeed), "wind")
  );

  const sunset = formatClock(current.sunset);
  if (sunset !== "—") list.append(createChip(t("sun.sunset"), sunset, "sun"));

  const pressure = current.pressure;
  list.append(
    createChip(
      t("metric.pressure"),
      typeof pressure === "number" ? `${formatNumber(pressure)} hPa` : "—",
      "pressure"
    )
  );

  return list;
}

function createMetrics(view, current) {
  const list = el("ul", "weather-hero__metrics");
  const uv = getUvCategory(current.uvIndex);

  list.append(
    createMetric(t("metric.humidity"), formatPercent(current.humidity), getHumidityCaption(current.humidity))
  );

  list.append(
    createMetric(
      t("metric.wind"),
      formatWind(current.windSpeed),
      formatWindDirection(current.windDirection) ?? "—"
    )
  );

  list.append(
    createMetric(t("metric.uv"), formatNumber(current.uvIndex), uv?.label ?? "—")
  );

  list.append(
    createMetric(
      t("metric.pressure"),
      typeof current.pressure === "number" ? formatNumber(current.pressure) : "—",
      getPressureCaption(current.pressure)
    )
  );

  return list;
}

function createSkeleton() {
  const wrapper = el("div", "weather-hero__skeleton");
  wrapper.append(
    el("div", "skeleton skeleton--temp"),
    el("div", "skeleton skeleton--line"),
    el("div", "skeleton skeleton--line skeleton--short")
  );
  return wrapper;
}

function createErrorBlock(error, onRetry) {
  const block = el("div", "panel-error");
  block.append(el("p", "panel-error__title", t("hero.loadErrorTitle")));
  block.append(el("p", "panel-error__text", errorMessage(error?.code)));

  const retry = el("button", "button", t("hero.retry"));
  retry.type = "button";
  retry.addEventListener("click", () => onRetry?.());
  block.append(retry);

  return block;
}

export function createHero() {
  const element = el("article", "weather-hero");

  function update(view) {
    clear(element);
    element.classList.toggle("weather-hero--error", Boolean(view.error) && !view.current);
    element.dataset.tone = view.tone;

    const head = el("header", "weather-hero__head");
    const titles = el("div", "weather-hero__titles");
    titles.append(el("h1", "weather-hero__name", getLocationDisplayName(view.location)));

    const place = [view.location?.admin1, view.location?.country].filter(Boolean).join(" · ");
    if (place) titles.append(el("p", "weather-hero__place", place));

    head.append(titles);
    if (view.isSample) head.append(el("span", "weather-hero__badge", t("hero.sample")));
    element.append(head);

    const current = view.current;

    if (current) {
      element.append(createMeta(view, current));
      element.append(createBody(view, current));
      element.append(createChips(view, current));
      element.append(createMetrics(view, current));
      return;
    }

    if (view.status === "error" && view.error) {
      element.append(createErrorBlock(view.error, view.onRetry));
      return;
    }

    element.append(createSkeleton());
  }

  return { element, update };
}
