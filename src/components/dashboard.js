/**
 * Hero "kondisi cuaca saat ini" (SPEC F1, UI-SPEC §7).
 * Menampilkan lokasi aktif, suhu utama, kondisi, feels-like, dan 4 metrik
 * atmosfer singkat: kelembapan, angin, indeks UV, serta kualitas udara.
 */

import { AQI_SCALE_LABEL, getAqiCategory } from "../utils/aqi.js";
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
  getUvCategory,
} from "../utils/format.js";
import { getWeatherConditionLabel } from "../utils/wmo.js";
import { createWeatherGlyph } from "./weatherGlyph.js";

const ERROR_MESSAGES = {
  NETWORK: "Periksa koneksi internet, lalu coba lagi.",
  TIMEOUT: "Permintaan melebihi waktu tunggu. Coba lagi.",
  HTTP_4XX: "Permintaan ditolak server cuaca. Coba lagi nanti.",
  HTTP_5XX: "Server cuaca sedang bermasalah. Coba beberapa saat lagi.",
  PARSE: "Respons cuaca tidak dapat dibaca.",
  EMPTY_DATA: "Data cuaca tidak tersedia untuk lokasi ini.",
};

function createMetric(label, value, caption) {
  const item = el("li", "metric");
  item.append(el("p", "metric__label", label));
  item.append(el("p", "metric__value", value));
  if (caption) item.append(el("p", "metric__caption", caption));
  return item;
}

function createAqiMetric(view) {
  const item = el("li", "metric metric--aqi");
  item.append(el("p", "metric__label", "Kualitas Udara"));

  if (view.airQualityStatus === "error") {
    item.append(el("p", "metric__value", "—"));
    item.append(el("p", "metric__caption", "gagal dimuat"));
    item.append(el("p", "metric__tag", AQI_SCALE_LABEL));
    return item;
  }

  const raw = view.airQuality?.aqi;
  const value = typeof raw === "number" && Number.isFinite(raw) ? raw : null;

  if (value === null) {
    item.append(el("p", "metric__value", "—"));
    item.append(
      el("p", "metric__caption", view.airQualityStatus === "unavailable" ? "tidak tersedia" : "memuat…")
    );
    item.append(el("p", "metric__tag", AQI_SCALE_LABEL));
    return item;
  }

  const category = getAqiCategory(value);
  item.append(el("p", "metric__value", formatNumber(value)));
  item.append(el("p", "metric__caption", category?.label ?? "tidak tersedia"));
  item.append(el("p", "metric__tag", AQI_SCALE_LABEL));

  if (category) {
    item.style.background = category.color;
    item.style.color = category.textColor;
  }
  return item;
}

function createMeta(view, current) {
  const bits = [];
  const date = formatDateLabel(current.timestamp);
  if (date) bits.push(date);

  const clock = formatClock(current.timestamp);
  if (clock) {
    bits.push(`${clock}${view.timezoneAbbreviation ? ` ${view.timezoneAbbreviation}` : ""}`);
  }

  return el("p", "weather-hero__meta", bits.length > 0 ? bits.join(" · ") : "Waktu lokal tidak tersedia");
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
    el("p", "weather-hero__feels", `terasa ${formatTemperature(current.apparentTemperature, view.unit)}`)
  );

  const art = el("div", "weather-hero__art");
  art.append(createWeatherGlyph(current.weatherCode, { size: 176, label: `Ilustrasi cuaca ${condition}` }));

  body.append(readout, art);
  return body;
}

function createMetrics(view, current) {
  const list = el("ul", "weather-hero__metrics");

  list.append(
    createMetric("Kelembapan", formatPercent(current.humidity), getHumidityCaption(current.humidity))
  );

  const windDirection = formatWindDirection(current.windDirection);
  list.append(createMetric("Angin", formatWind(current.windSpeed), windDirection ?? "arah tidak tersedia"));

  const uv = getUvCategory(current.uvIndex);
  list.append(createMetric("Indeks UV", formatNumber(current.uvIndex), uv?.label ?? "tidak tersedia"));

  list.append(createAqiMetric(view));
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
  block.append(el("p", "panel-error__title", "Data cuaca tidak dapat dimuat"));
  block.append(
    el("p", "panel-error__text", ERROR_MESSAGES[error?.code] ?? "Terjadi kesalahan saat memuat data cuaca.")
  );

  const retry = el("button", "button", "Coba lagi");
  retry.type = "button";
  retry.addEventListener("click", () => onRetry?.());
  block.append(retry);

  return block;
}

export function createHero() {
  const element = el("article", "weather-hero");

  function update(view) {
    clear(element);
    element.classList.toggle("weather-hero--error", Boolean(view.error) && !view.weather?.current);

    const head = el("header", "weather-hero__head");
    const titles = el("div", "weather-hero__titles");
    titles.append(el("h1", "weather-hero__name", view.location?.name ?? "Lokasi belum dipilih"));

    const place = [view.location?.admin1, view.location?.country].filter(Boolean).join(" · ");
    if (place) titles.append(el("p", "weather-hero__place", place));

    head.append(titles);
    if (view.isSample) head.append(el("span", "weather-hero__badge", "Lokasi contoh"));
    element.append(head);

    const current = view.weather?.current ?? null;

    if (current) {
      element.append(createMeta(view, current));
      element.append(createBody(view, current));
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
