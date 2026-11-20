/**
 * Orkestrasi data cuaca & kualitas udara (SPEC §4.4, §5.3, §5.4).
 *
 * - Cache in-memory: forecast 10 menit, AQI 15 menit, kunci koordinat 3 desimal.
 * - Permintaan untuk lokasi sama yang masih berjalan digabung (tanpa request ganda).
 * - Forecast dan AQI diminta paralel via `Promise.allSettled`; kegagalan salah satu
 *   tidak mengubah status panel lainnya.
 * - Snapshot + subscribe tersedia agar UI bisa menampilkan status loading/error
 *   tanpa mengambil data sendiri.
 */

import { getAirQuality, hasAqiValue } from "../api/airQuality.js";
import { getForecast } from "../api/forecast.js";
import {
  AIR_QUALITY_CACHE_TTL_MS,
  FORECAST_CACHE_TTL_MS,
} from "../config/constants.js";
import { ERROR_CODES, combineSignals, toApiError } from "../api/http.js";

export function locationCacheKey(location) {
  const lat = Math.round(Number(location?.latitude) * 1000) / 1000;
  const lon = Math.round(Number(location?.longitude) * 1000) / 1000;
  return `${lat},${lon}`;
}

function assertLocation(location) {
  if (
    !location ||
    typeof location !== "object" ||
    !Number.isFinite(location.latitude) ||
    !Number.isFinite(location.longitude)
  ) {
    throw new TypeError("weatherService membutuhkan lokasi dengan latitude & longitude numerik.");
  }
}

function createSnapshot() {
  return {
    location: null,
    weather: null,
    status: "idle",
    error: null,
    airQuality: null,
    airQualityStatus: "idle",
    airQualityError: null,
    fromCache: { forecast: false, airQuality: false },
    updatedAt: null,
  };
}

export function createWeatherService(options = {}) {
  const {
    now = () => Date.now(),
    fetchImpl,
    timeoutMs,
  } = options;

  const requestOptions = { fetchImpl, timeoutMs };
  const forecastCache = new Map();
  const airQualityCache = new Map();
  const inflightForecast = new Map();
  const inflightAirQuality = new Map();

  let snapshot = createSnapshot();
  const listeners = new Set();
  let loadSequence = 0;
  let activeLoad = null;

  function notify(patch) {
    snapshot = { ...snapshot, ...patch };
    for (const listener of listeners) listener(snapshot);
  }

  function subscribe(listener) {
    if (typeof listener !== "function") return () => {};
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function getSnapshot() {
    return snapshot;
  }

  function readCache(cache, key, ttlMs) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= now()) {
      cache.delete(key);
      return null;
    }
    return entry.value;
  }

  function writeCache(cache, key, value, ttlMs) {
    cache.set(key, { value, expiresAt: now() + ttlMs });
  }

  /**
   * Ambil forecast dengan cache + penggabungan request berjalan.
   * @returns {Promise<{ data: object, fromCache: boolean }>}
   */
  async function fetchForecast(location, { signal, force = false } = {}) {
    const key = locationCacheKey(location);

    if (!force) {
      const cached = readCache(forecastCache, key, FORECAST_CACHE_TTL_MS);
      if (cached) return { data: cached, fromCache: true };
    }

    let entry = inflightForecast.get(key);
    if (!entry) {
      const promise = (async () => {
        const data = await getForecast(location, { ...requestOptions, signal });
        writeCache(forecastCache, key, data, FORECAST_CACHE_TTL_MS);
        return data;
      })().finally(() => {
        if (inflightForecast.get(key)?.promise === promise) inflightForecast.delete(key);
      });
      entry = { promise };
      inflightForecast.set(key, entry);
    }

    return { data: await entry.promise, fromCache: false };
  }

  /** Sama seperti forecast, dengan TTL AQI 15 menit. */
  async function fetchAirQuality(location, { signal, force = false } = {}) {
    const key = locationCacheKey(location);

    if (!force) {
      const cached = readCache(airQualityCache, key, AIR_QUALITY_CACHE_TTL_MS);
      if (cached) return { data: cached, fromCache: true };
    }

    let entry = inflightAirQuality.get(key);
    if (!entry) {
      const promise = (async () => {
        const data = await getAirQuality(location, { ...requestOptions, signal });
        writeCache(airQualityCache, key, data, AIR_QUALITY_CACHE_TTL_MS);
        return data;
      })().finally(() => {
        if (inflightAirQuality.get(key)?.promise === promise) inflightAirQuality.delete(key);
      });
      entry = { promise };
      inflightAirQuality.set(key, entry);
    }

    return { data: await entry.promise, fromCache: false };
  }

  /** Muat forecast saja. Tidak melempar error API; hasilnya objek terstruktur. */
  async function loadForecast(location, options = {}) {
    assertLocation(location);
    try {
      const { data, fromCache } = await fetchForecast(location, options);
      return { weather: data, error: null, fromCache, aborted: false };
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === ERROR_CODES.ABORTED) {
        return { weather: null, error: null, fromCache: false, aborted: true };
      }
      return { weather: null, error: apiError, fromCache: false, aborted: false };
    }
  }

  /** Muat AQI saja (dipakai tombol "Coba lagi" panel AQI). */
  async function loadAirQuality(location, options = {}) {
    assertLocation(location);
    try {
      const { data, fromCache } = await fetchAirQuality(location, options);
      return {
        airQuality: data,
        error: null,
        fromCache,
        aborted: false,
        unavailable: !hasAqiValue(data),
      };
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.code === ERROR_CODES.ABORTED) {
        return { airQuality: null, error: null, fromCache: false, aborted: true, unavailable: false };
      }
      return { airQuality: null, error: apiError, fromCache: false, aborted: false, unavailable: false };
    }
  }

  function applyForecast(location, result) {
    if (result.aborted) {
      notify({ status: "idle", error: null });
      return;
    }
    if (result.error) {
      notify({ status: "error", error: result.error, weather: null });
      return;
    }
    notify({
      status: "ready",
      weather: result.weather,
      error: null,
      updatedAt: result.weather?.fetchedAt ?? new Date(now()).toISOString(),
      fromCache: { ...snapshot.fromCache, forecast: result.fromCache },
    });
  }

  function applyAirQuality(result) {
    if (result.aborted) {
      notify({ airQualityStatus: "idle", airQualityError: null });
      return;
    }
    if (result.error) {
      notify({ airQualityStatus: "error", airQualityError: result.error, airQuality: null });
      return;
    }
    notify({
      airQualityStatus: result.unavailable ? "unavailable" : "ready",
      airQuality: result.airQuality,
      airQualityError: null,
      fromCache: { ...snapshot.fromCache, airQuality: result.fromCache },
    });
  }

  /**
   * Muat forecast + AQI untuk satu lokasi.
   * Permintaan lama untuk lokasi berbeda otomatis dibatalkan.
   *
   * @param {object} location
   * @param {{ signal?: AbortSignal, force?: boolean }} [options]
   * @returns {Promise<object>} snapshot akhir (tidak pernah melempar error API)
   */
  async function load(location, options = {}) {
    assertLocation(location);
    const { signal, force = false } = options;
    const key = locationCacheKey(location);

    if (activeLoad && activeLoad.key !== key) activeLoad.controller.abort();

    const controller = new AbortController();
    activeLoad = { key, controller };
    const requestSignal = combineSignals([signal, controller.signal]);
    const token = ++loadSequence;

    notify({
      location,
      status: "loading",
      error: null,
      airQualityStatus: "loading",
      airQualityError: null,
      fromCache: { forecast: false, airQuality: false },
    });

    const forecastPromise = loadForecast(location, { signal: requestSignal, force }).then(
      (result) => {
        if (token === loadSequence) applyForecast(location, result);
        return result;
      }
    );

    const airQualityPromise = loadAirQuality(location, { signal: requestSignal, force }).then(
      (result) => {
        if (token === loadSequence) applyAirQuality(result);
        return result;
      }
    );

    await Promise.allSettled([forecastPromise, airQualityPromise]);

    if (activeLoad?.controller === controller) activeLoad = null;

    return snapshot;
  }

  /** Muat ulang AQI saja (tombol retry terisolasi) dan perbarui snapshot. */
  async function reloadAirQuality(location, options = {}) {
    assertLocation(location);
    const result = await loadAirQuality(location, { ...options, force: true });
    applyAirQuality(result);
    return result;
  }

  /** Muat ulang forecast saja dan perbarui snapshot. */
  async function reloadForecast(location, options = {}) {
    assertLocation(location);
    const result = await loadForecast(location, { ...options, force: true });
    applyForecast(location, result);
    return result;
  }

  function clearCache() {
    forecastCache.clear();
    airQualityCache.clear();
  }

  function reset() {
    clearCache();
    inflightForecast.clear();
    inflightAirQuality.clear();
    loadSequence += 1;
    activeLoad?.controller.abort();
    activeLoad = null;
    snapshot = createSnapshot();
    for (const listener of listeners) listener(snapshot);
  }

  return {
    load,
    loadForecast,
    loadAirQuality,
    reloadForecast,
    reloadAirQuality,
    getSnapshot,
    subscribe,
    clearCache,
    reset,
  };
}

/** Instance tunggal untuk aplikasi. */
export const weatherService = createWeatherService();

export { ERROR_CODES };
