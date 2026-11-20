/**
 * Pemetaan kode WMO ke label kondisi (SPEC §4.2, R9).
 * Label diambil dari kamus bahasa aktif; kode tak dikenal memakai fallback,
 * tidak melempar error.
 */

import { t } from "../i18n/index.js";

const WEATHER_KEYS = Object.freeze({
  0: "weather.clear",
  1: "weather.mainlyClear",
  2: "weather.partlyCloudy",
  3: "weather.overcast",
  45: "weather.fog",
  48: "weather.rimeFog",
  51: "weather.drizzleLight",
  53: "weather.drizzleModerate",
  55: "weather.drizzleDense",
  56: "weather.freezingDrizzleLight",
  57: "weather.freezingDrizzleDense",
  61: "weather.rainLight",
  63: "weather.rainModerate",
  65: "weather.rainHeavy",
  66: "weather.freezingRainLight",
  67: "weather.freezingRainHeavy",
  71: "weather.snowLight",
  73: "weather.snowModerate",
  75: "weather.snowHeavy",
  77: "weather.snowGrains",
  80: "weather.showersLight",
  81: "weather.showersModerate",
  82: "weather.showersHeavy",
  85: "weather.snowShowersLight",
  86: "weather.snowShowersHeavy",
  95: "weather.thunderstorm",
  96: "weather.thunderstormHailLight",
  99: "weather.thunderstormHailHeavy",
});

/** @deprecated gunakan `getWeatherConditionLabel()`; dipertahankan untuk share. */
export const UNKNOWN_WEATHER_LABEL = "weather.unknown";

const WEATHER_CATEGORIES = Object.freeze({
  0: "clear",
  1: "clear",
  2: "cloud",
  3: "cloud",
  45: "fog",
  48: "fog",
  51: "rain",
  53: "rain",
  55: "rain",
  56: "rain",
  57: "rain",
  61: "rain",
  63: "rain",
  65: "rain",
  66: "rain",
  67: "rain",
  71: "snow",
  73: "snow",
  75: "snow",
  77: "snow",
  80: "rain",
  81: "rain",
  82: "rain",
  85: "snow",
  86: "snow",
  95: "storm",
  96: "storm",
  99: "storm",
});

/**
 * Kategori visual untuk ilustrasi lokal.
 * @returns {"clear"|"cloud"|"rain"|"storm"|"snow"|"fog"|"unknown"}
 */
export function getWeatherConditionCategory(code) {
  if (typeof code !== "number" || !Number.isFinite(code)) return "unknown";
  return WEATHER_CATEGORIES[Math.trunc(code)] ?? "unknown";
}

/**
 * @param {number|null|undefined} code
 * @returns {string} label kondisi terlokalisasi; fallback untuk kode kosong
 */
export function getWeatherConditionLabel(code) {
  if (typeof code !== "number" || !Number.isFinite(code)) return t("weather.unknown");
  const key = WEATHER_KEYS[Math.trunc(code)];
  return key ? t(key) : t("weather.unknown");
}
