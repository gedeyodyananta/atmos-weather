/**
 * Proyeksi state store + snapshot cuaca menjadi satu objek tampilan.
 * Semua panel membaca objek yang sama agar lokasi, satuan, bahasa, dan status
 * tidak pernah berbeda antar panel.
 */

import { weatherService } from "../services/weatherService.js";
import { getWeatherTone, resolveIsDay } from "../utils/weatherTheme.js";

export function hasCoordinates(location) {
  return Boolean(
    location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude)
  );
}

export function sameLocation(a, b) {
  if (!hasCoordinates(a) || !hasCoordinates(b)) return false;
  return (
    Math.abs(a.latitude - b.latitude) < 1e-6 && Math.abs(a.longitude - b.longitude) < 1e-6
  );
}

export function buildWeatherView(store) {
  const state = store.getState();
  const snapshot = weatherService.getSnapshot();
  const matches = sameLocation(snapshot.location, state.location);
  const weather = matches ? snapshot.weather : null;
  const current = weather?.current ?? null;
  const isDay = resolveIsDay(current?.isDay, true);

  return {
    location: state.location,
    isSample: state.isSampleLocation === true,
    unit: state.unit ?? "c",
    locale: state.locale ?? "id",
    status: matches ? snapshot.status : "loading",
    error: matches ? snapshot.error : null,
    weather,
    current,
    hourly: weather?.hourly ?? [],
    daily: weather?.daily ?? [],
    airQuality: matches ? snapshot.airQuality : null,
    airHourly: matches ? snapshot.airQuality?.hourly ?? [] : [],
    airQualityStatus: matches ? snapshot.airQualityStatus : "loading",
    airQualityError: matches ? snapshot.airQualityError : null,
    timezoneAbbreviation: matches ? weather?.timezoneAbbreviation ?? null : null,
    isDay,
    tone: getWeatherTone(current?.weatherCode, isDay),
    updatedAt: matches ? snapshot.updatedAt : null,
    fromCache: matches ? snapshot.fromCache : { forecast: false, airQuality: false },
  };
}

export function retryForecast() {
  const location = weatherService.getSnapshot().location;
  if (location) weatherService.load(location, { force: true });
}

export function retryAirQuality() {
  const location = weatherService.getSnapshot().location;
  if (location) weatherService.reloadAirQuality(location);
}
