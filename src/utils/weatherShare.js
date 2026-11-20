/**
 * Penyusunan pesan & URL berbagi cuaca (fungsi murni).
 *
 * `buildWeatherShareUrl()` memvalidasi kelengkapan data lebih dulu
 * (nama kota, suhu, kondisi, AQI). Data tidak lengkap → `null`, sehingga
 * komponen wajib menonaktifkan tombol bagikan.
 */

import { SHARE_CONFIG } from "../config/share.js";
import { getLocale } from "../i18n/index.js";
import { getAqiCategory } from "./aqi.js";
import { getWeatherConditionLabel } from "./wmo.js";

const MESSAGES = Object.freeze({
  INVALID_DATA: "Data cuaca belum tersedia",
  MISSING_NAME: "Nama lokasi belum tersedia",
  MISSING_TEMPERATURE: "Suhu belum tersedia",
  MISSING_CONDITION: "Kondisi cuaca belum tersedia",
  MISSING_AQI: "Data kualitas udara belum tersedia",
});

function failure(code) {
  return { ok: false, code, message: MESSAGES[code] ?? "Data cuaca belum lengkap" };
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function resolveCondition(weatherData) {
  if (typeof weatherData.condition === "string" && weatherData.condition.trim() !== "") {
    return weatherData.condition.trim();
  }
  if (isFiniteNumber(weatherData.weatherCode)) {
    return getWeatherConditionLabel(weatherData.weatherCode);
  }
  return null;
}

/**
 * @param {object} weatherData
 * @param {string} [unit] "c" (default) atau "f"
 * @returns {{ ok: boolean, code: string|null, message: string|null, data?: object }}
 */
export function validateWeatherShareData(weatherData, unit = "c") {
  if (!weatherData || typeof weatherData !== "object") return failure("INVALID_DATA");

  const name = typeof weatherData.name === "string" ? weatherData.name.trim() : "";
  if (name === "") return failure("MISSING_NAME");

  if (!isFiniteNumber(weatherData.temperature)) return failure("MISSING_TEMPERATURE");

  const condition = resolveCondition(weatherData);
  if (!condition) return failure("MISSING_CONDITION");

  if (!isFiniteNumber(weatherData.aqi) || weatherData.aqi < 0) return failure("MISSING_AQI");

  return {
    ok: true,
    code: null,
    message: null,
    data: {
      name,
      temperature: weatherData.temperature,
      condition,
      aqi: Math.round(weatherData.aqi),
      unit: unit === "f" ? "f" : "c",
    },
  };
}

function formatTemperature(celsius, unit) {
  const value = unit === "f" ? celsius * (9 / 5) + 32 : celsius;
  return `${Math.round(value)}°${unit === "f" ? "F" : "C"}`;
}

function fillTemplate(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );
}

/**
 * Ringkasan teks siap kirim, contoh:
 * "Cuaca di Denpasar saat ini: 30°C (Cerah Berawan), AQI: 42 (Baik) — dipantau via ATMOS"
 *
 * @returns {string|null} `null` bila data tidak lengkap
 */
export function buildWeatherShareMessage(weatherData, unit = "c", locale = getLocale()) {
  const validation = validateWeatherShareData(weatherData, unit);
  if (!validation.ok) return null;

  const { name, temperature, condition, aqi, unit: safeUnit } = validation.data;
  const category = getAqiCategory(aqi);
  const template =
    locale === "en" ? SHARE_CONFIG.messageTemplateEn : SHARE_CONFIG.messageTemplate;

  return fillTemplate(template, {
    location: name,
    temperature: formatTemperature(temperature, safeUnit),
    condition,
    aqi,
    aqiCategory:
      (locale === "en" ? category?.labelEn : category?.label) ?? "—",
    appName: SHARE_CONFIG.appName,
  });
}

/**
 * URL WhatsApp dengan pesan ter-encode. Tanpa API key atau SDK pihak ketiga.
 *
 * @param {object} weatherData
 * @param {string} [unit] "c" atau "f"
 * @returns {string|null} `null` bila data tidak lengkap
 */
export function buildWeatherShareUrl(weatherData, unit = "c", locale = getLocale()) {
  const message = buildWeatherShareMessage(weatherData, unit, locale);
  if (!message) return null;
  return `${SHARE_CONFIG.whatsappBaseUrl}${encodeURIComponent(message)}`;
}
