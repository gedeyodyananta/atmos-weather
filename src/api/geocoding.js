/**
 * Pencarian lokasi via Open-Meteo Geocoding (SPEC §4.2).
 * Respons tanpa `results` adalah hasil kosong, bukan error.
 */

import {
  API_ENDPOINTS,
  GEOCODING_CACHE_TTL_MS,
  GEOCODING_LANGUAGE,
  GEOCODING_MAX_RESULTS,
  GEOCODING_MIN_QUERY_LENGTH,
} from "../config/constants.js";
import { assertObjectPayload, buildUrl, requestJson } from "./http.js";

const num = (value) => (typeof value === "number" && Number.isFinite(value) ? value : null);
const text = (value) => (typeof value === "string" && value.trim() !== "" ? value.trim() : null);

/** Cache in-memory pencarian: kunci `query.toLowerCase()` + bahasa, TTL 10 menit. */
const searchCache = new Map();

function cacheKey(query, language) {
  return `${language}:${query.toLowerCase()}`;
}

function readCache(key, nowMs) {
  const entry = searchCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= nowMs) {
    searchCache.delete(key);
    return null;
  }
  return entry.value;
}

function writeCache(key, value, nowMs) {
  searchCache.set(key, { value, expiresAt: nowMs + GEOCODING_CACHE_TTL_MS });
}

export function buildGeocodingUrl(query, language = GEOCODING_LANGUAGE) {
  return buildUrl(API_ENDPOINTS.geocoding, {
    name: query,
    count: GEOCODING_MAX_RESULTS,
    language,
    format: "json",
  });
}

export function mapGeocodingResponse(payload) {
  const data = assertObjectPayload(payload, API_ENDPOINTS.geocoding);
  if (!Array.isArray(data.results)) return [];

  const locations = [];
  for (const result of data.results) {
    if (!result || typeof result !== "object") continue;

    const latitude = num(result.latitude);
    const longitude = num(result.longitude);
    const name = text(result.name);
    if (latitude === null || longitude === null || !name) continue;

    const id = result.id !== undefined && result.id !== null ? `geo:${result.id}` : `custom:${latitude},${longitude}`;

    locations.push({
      id,
      name,
      admin1: text(result.admin1) ?? "",
      country: text(result.country) ?? "",
      latitude,
      longitude,
      timezone: text(result.timezone) ?? "auto",
    });

    if (locations.length >= GEOCODING_MAX_RESULTS) break;
  }

  return locations;
}

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal, language?: string, force?: boolean, fetchImpl?: typeof fetch, timeoutMs?: number }} [options]
 * @returns {Promise<Array<object>>} maksimal 8 lokasi; array kosong bila tidak ada hasil
 */
export async function searchLocations(query, options = {}) {
  const trimmed = typeof query === "string" ? query.trim() : "";
  if (trimmed.length < GEOCODING_MIN_QUERY_LENGTH) return [];

  const { language = GEOCODING_LANGUAGE, force = false } = options;
  const key = cacheKey(trimmed, language);

  if (!force) {
    const cached = readCache(key, Date.now());
    if (cached) return cached;
  }

  const payload = await requestJson(buildGeocodingUrl(trimmed, language), options);
  const locations = mapGeocodingResponse(payload);
  writeCache(key, locations, Date.now());
  return locations;
}

export function clearGeocodingCache() {
  searchCache.clear();
}
