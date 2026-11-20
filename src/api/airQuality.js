/**
 * Ambil kualitas udara dari endpoint terpisah (SPEC §3.2, §4.2).
 * Kategori dihitung di klien lewat `utils/aqi.js`; API hanya menyuplai angka.
 */

import {
  AIR_QUALITY_CURRENT_FIELDS,
  AIR_QUALITY_HOURLY_FIELDS,
  AIR_QUALITY_TREND_HOURS,
  API_ENDPOINTS,
} from "../config/constants.js";
import { getAqiCategory, isAqiValue } from "../utils/aqi.js";
import {
  ApiError,
  ERROR_CODES,
  assertObjectPayload,
  buildUrl,
  requestJson,
} from "./http.js";

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const text = (value) => (typeof value === "string" && value !== "" ? value : null);

export function buildAirQualityUrl(location) {
  return buildUrl(API_ENDPOINTS.airQuality, {
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: "auto",
    domains: "auto",
    forecast_days: 2,
    current: AIR_QUALITY_CURRENT_FIELDS,
    hourly: AIR_QUALITY_HOURLY_FIELDS,
  });
}

function at(array, index) {
  return Array.isArray(array) ? array[index] : undefined;
}

/** Indeks jam berjalan; jam API selalu di awal jam. */
function findHourIndex(times, currentTime) {
  if (!Array.isArray(times) || times.length === 0) return -1;
  if (!currentTime) return 0;
  const prefix = currentTime.slice(0, 13);
  return times.findIndex((time) => typeof time === "string" && time.slice(0, 13) === prefix);
}

function mapHourly(hourly, currentTime) {
  if (!hourly || !Array.isArray(hourly.time)) return [];
  const start = Math.max(0, findHourIndex(hourly.time, currentTime));
  const end = Math.min(hourly.time.length, start + AIR_QUALITY_TREND_HOURS);
  const entries = [];

  for (let index = start; index < end; index += 1) {
    const time = text(at(hourly.time, index));
    if (!time) continue;
    entries.push({
      time,
      aqi: isAqiValue(at(hourly.us_aqi, index)) ? Math.round(at(hourly.us_aqi, index)) : null,
      pm25: num(at(hourly.pm2_5, index)),
    });
  }

  return entries;
}

/**
 * Petakan payload ke `AirQualityCurrent`.
 * `us_aqi: null` dipertahankan sebagai `null` + `category: null` (status
 * `unavailable` ditentukan service), dan PM tidak diganti dengan 0.
 */
export function mapAirQualityResponse(payload, location) {
  const data = assertObjectPayload(payload, API_ENDPOINTS.airQuality);
  const currentRaw = data.current;

  if (!currentRaw || typeof currentRaw !== "object") {
    throw new ApiError(ERROR_CODES.EMPTY_DATA, {
      url: API_ENDPOINTS.airQuality,
      message: "Data kualitas udara tidak tersedia untuk lokasi ini.",
    });
  }

  const aqi = isAqiValue(currentRaw.us_aqi) ? Math.round(currentRaw.us_aqi) : null;
  const category = aqi === null ? null : getAqiCategory(aqi);

  return {
    aqi,
    category: category?.key ?? null,
    pm25: num(currentRaw.pm2_5),
    pm10: num(currentRaw.pm10),
    co: num(currentRaw.carbon_monoxide),
    no2: num(currentRaw.nitrogen_dioxide),
    o3: num(currentRaw.ozone),
    hourly: mapHourly(data.hourly, text(currentRaw.time)),
    dominantPollutant: null,
    timestamp: text(currentRaw.time),
    scale: "us",
    timezone: text(data.timezone) ?? location?.timezone ?? "auto",
    timezoneAbbreviation: text(data.timezone_abbreviation),
    utcOffsetSeconds: num(data.utc_offset_seconds),
    fetchedAt: new Date().toISOString(),
  };
}

/** `true` bila model AQI punya angka yang bisa ditampilkan. */
export function hasAqiValue(airQuality) {
  return isAqiValue(airQuality?.aqi);
}

/**
 * @param {{ latitude: number, longitude: number, timezone?: string }} location
 * @param {{ signal?: AbortSignal, timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 */
export async function getAirQuality(location, options = {}) {
  const url = buildAirQualityUrl(location);
  const payload = await requestJson(url, options);
  return mapAirQualityResponse(payload, location);
}
