/**
 * Ambil & petakan prakiraan cuaca Open-Meteo ke model domain (SPEC §4.2).
 * Tidak ada konversi satuan di lapisan ini: semuanya Celsius, km/j, meter.
 */

import {
  API_ENDPOINTS,
  DAILY_FORECAST_DAYS,
  FORECAST_CURRENT_FIELDS,
  FORECAST_DAILY_FIELDS,
  FORECAST_HOURLY_FIELDS,
  HOURLY_FORECAST_HOURS,
} from "../config/constants.js";
import {
  ApiError,
  ERROR_CODES,
  assertObjectPayload,
  buildUrl,
  requestJson,
} from "./http.js";

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const text = (value) => (typeof value === "string" && value !== "" ? value : null);

function at(array, index) {
  return Array.isArray(array) ? array[index] : undefined;
}

export function buildForecastUrl(location) {
  return buildUrl(API_ENDPOINTS.forecast, {
    latitude: location.latitude,
    longitude: location.longitude,
    timezone: "auto",
    forecast_days: DAILY_FORECAST_DAYS,
    current: FORECAST_CURRENT_FIELDS,
    hourly: FORECAST_HOURLY_FIELDS,
    daily: FORECAST_DAILY_FIELDS,
    wind_speed_unit: "kmh",
    temperature_unit: "celsius",
  });
}

/**
 * Cari indeks jam berjalan. `current.time` bisa memuat menit (mis. 08:30)
 * sedangkan `hourly.time` selalu di awal jam, jadi cocokkan prefiks jamnya.
 */
function findHourIndex(times, currentTime) {
  if (!Array.isArray(times) || times.length === 0) return -1;
  if (!currentTime) return 0;

  const hourPrefix = currentTime.slice(0, 13);
  const exact = times.findIndex(
    (time) => typeof time === "string" && time.slice(0, 13) === hourPrefix
  );
  if (exact !== -1) return exact;

  const next = times.findIndex((time) => typeof time === "string" && time >= currentTime);
  return next;
}

function mapHourly(hourly, startIndex) {
  if (!hourly || !Array.isArray(hourly.time)) return [];

  const start = startIndex >= 0 ? startIndex : 0;
  const end = Math.min(hourly.time.length, start + HOURLY_FORECAST_HOURS);
  const entries = [];

  for (let index = start; index < end; index += 1) {
    const time = text(at(hourly.time, index));
    if (!time) continue;
    entries.push({
      time,
      temperature: num(at(hourly.temperature_2m, index)),
      apparentTemperature: num(at(hourly.apparent_temperature, index)),
      precipitationProbability: num(at(hourly.precipitation_probability, index)),
      weatherCode: num(at(hourly.weather_code, index)),
      windSpeed: num(at(hourly.wind_speed_10m, index)),
      precipitation: num(at(hourly.precipitation, index)),
      uvIndex: num(at(hourly.uv_index, index)),
    });
  }

  return entries;
}

function mapDaily(daily) {
  if (!daily || !Array.isArray(daily.time)) return [];

  const count = Math.min(daily.time.length, DAILY_FORECAST_DAYS);
  const entries = [];

  for (let index = 0; index < count; index += 1) {
    const date = text(at(daily.time, index));
    if (!date) continue;
    entries.push({
      date,
      weatherCode: num(at(daily.weather_code, index)),
      temperatureMax: num(at(daily.temperature_2m_max, index)),
      temperatureMin: num(at(daily.temperature_2m_min, index)),
      precipitationProbability: num(at(daily.precipitation_probability_max, index)),
      sunrise: text(at(daily.sunrise, index)),
      sunset: text(at(daily.sunset, index)),
      uvIndexMax: num(at(daily.uv_index_max, index)),
    });
  }

  return entries;
}

/**
 * Petakan payload mentah ke `{ current, hourly[], daily[] }`.
 * Nilai yang hilang dipertahankan sebagai `null` (bukan 0).
 */
export function mapForecastResponse(payload, location) {
  const data = assertObjectPayload(payload, API_ENDPOINTS.forecast);

  const currentRaw = data.current;
  const hourlyRaw = data.hourly;
  const dailyRaw = data.daily;

  if (!currentRaw || typeof currentRaw !== "object") {
    throw new ApiError(ERROR_CODES.EMPTY_DATA, {
      url: API_ENDPOINTS.forecast,
      message: "Data cuaca saat ini tidak tersedia untuk lokasi ini.",
    });
  }

  if (!hourlyRaw || !Array.isArray(hourlyRaw.time) || hourlyRaw.time.length === 0) {
    throw new ApiError(ERROR_CODES.EMPTY_DATA, {
      url: API_ENDPOINTS.forecast,
      message: "Prakiraan per jam tidak tersedia untuk lokasi ini.",
    });
  }

  if (!dailyRaw || !Array.isArray(dailyRaw.time) || dailyRaw.time.length === 0) {
    throw new ApiError(ERROR_CODES.EMPTY_DATA, {
      url: API_ENDPOINTS.forecast,
      message: "Prakiraan harian tidak tersedia untuk lokasi ini.",
    });
  }

  const timestamp = text(currentRaw.time);
  const hourIndex = findHourIndex(hourlyRaw.time, timestamp);
  const daily = mapDaily(dailyRaw);
  const firstDay = daily[0] ?? null;

  const current = {
    temperature: num(currentRaw.temperature_2m),
    apparentTemperature: num(currentRaw.apparent_temperature),
    weatherCode: num(currentRaw.weather_code),
    humidity: num(currentRaw.relative_humidity_2m),
    windSpeed: num(currentRaw.wind_speed_10m),
    windDirection: num(currentRaw.wind_direction_10m),
    windGusts: num(currentRaw.wind_gusts_10m),
    uvIndex: hourIndex >= 0 ? num(at(hourlyRaw.uv_index, hourIndex)) : null,
    pressure: num(currentRaw.surface_pressure),
    visibility: hourIndex >= 0 ? num(at(hourlyRaw.visibility, hourIndex)) : null,
    isDay: num(currentRaw.is_day),
    cloudCover: num(currentRaw.cloud_cover),
    precipitation: num(currentRaw.precipitation),
    dewPoint: num(currentRaw.dew_point_2m),
    sunrise: firstDay?.sunrise ?? null,
    sunset: firstDay?.sunset ?? null,
    timestamp,
  };

  return {
    current,
    hourly: mapHourly(hourlyRaw, hourIndex),
    daily,
    timezone: text(data.timezone) ?? location?.timezone ?? "auto",
    timezoneAbbreviation: text(data.timezone_abbreviation),
    utcOffsetSeconds: num(data.utc_offset_seconds),
    latitude: num(data.latitude) ?? location?.latitude ?? null,
    longitude: num(data.longitude) ?? location?.longitude ?? null,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * @param {{ latitude: number, longitude: number, timezone?: string }} location
 * @param {{ signal?: AbortSignal, timeoutMs?: number, fetchImpl?: typeof fetch }} [options]
 */
export async function getForecast(location, options = {}) {
  const url = buildForecastUrl(location);
  const payload = await requestJson(url, options);
  return mapForecastResponse(payload, location);
}
