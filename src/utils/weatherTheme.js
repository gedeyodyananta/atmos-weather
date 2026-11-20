/**
 * Tema visual hero berdasarkan kondisi WMO + fase hari (fungsi murni).
 * Hasilnya dipasang sebagai `data-tone` di CSS, bukan warna inline, supaya
 * kontras tiap tema bisa diaudit di satu tempat.
 */

import { getWeatherConditionCategory } from "./wmo.js";

export const WEATHER_TONES = Object.freeze([
  "clear-day",
  "clear-night",
  "cloud-day",
  "cloud-night",
  "rain",
  "storm",
  "snow",
  "fog",
  "unknown",
]);

/**
 * @param {number|null|undefined} weatherCode
 * @param {boolean} isDay
 * @returns {string} salah satu `WEATHER_TONES`
 */
export function getWeatherTone(weatherCode, isDay = true) {
  const category = getWeatherConditionCategory(weatherCode);

  switch (category) {
    case "clear":
      return isDay ? "clear-day" : "clear-night";
    case "cloud":
      return isDay ? "cloud-day" : "cloud-night";
    case "rain":
      return "rain";
    case "storm":
      return "storm";
    case "snow":
      return "snow";
    case "fog":
      return "fog";
    default:
      return isDay ? "cloud-day" : "cloud-night";
  }
}

/**
 * Fase hari dari `is_day` API (1/0), fallback ke perbandingan jam.
 * @param {number|null|undefined} isDay 1 = siang, 0 = malam
 * @param {boolean} fallback
 */
export function resolveIsDay(isDay, fallback = true) {
  if (isDay === 1) return true;
  if (isDay === 0) return false;
  return fallback;
}
