/**
 * Akses LocalStorage yang aman (SPEC §4.3).
 * Semua kegagalan (mode privat, kuota penuh, JSON rusak) ditangani senyap;
 * data tidak valid dihapus dan pemanggil memakai nilai default.
 */

import { MAX_SAVED_LOCATIONS, STORAGE_KEYS } from "../config/constants.js";

function getStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

/** @returns {string|null} */
export function safeRead(key) {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

/** @returns {boolean} `true` bila nilai tersimpan */
export function safeWrite(key, value) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemove(key) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function isFiniteCoordinate(value, limit) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;
}

/** Validasi bentuk `Location` sebelum dipakai di state / ditulis kembali. */
export function isValidLocation(value) {
  if (!value || typeof value !== "object") return false;
  if (typeof value.name !== "string" || value.name.trim() === "") return false;
  if (typeof value.country !== "string") return false;
  if (!isFiniteCoordinate(value.latitude, 90)) return false;
  if (!isFiniteCoordinate(value.longitude, 180)) return false;
  return true;
}

/** Normalisasi bentuk Location; mengembalikan `null` bila tidak valid. */
export function normalizeLocation(value) {
  if (!isValidLocation(value)) return null;

  const latitude = value.latitude;
  const longitude = value.longitude;
  const id =
    typeof value.id === "string" && value.id.trim() !== ""
      ? value.id
      : `custom:${latitude},${longitude}`;

  return {
    id,
    name: value.name.trim(),
    admin1: typeof value.admin1 === "string" ? value.admin1 : "",
    country: value.country,
    latitude,
    longitude,
    timezone:
      typeof value.timezone === "string" && value.timezone.trim() !== ""
        ? value.timezone
        : "auto",
    ...(value.isSample === true ? { isSample: true } : {}),
  };
}

/** Baca `lastLocation`; JSON rusak / bentuk tidak valid → hapus key, `null`. */
export function readLastLocation() {
  const raw = safeRead(STORAGE_KEYS.lastLocation);
  if (raw === null) return null;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safeRemove(STORAGE_KEYS.lastLocation);
    return null;
  }

  const location = normalizeLocation(parsed);
  if (!location) {
    safeRemove(STORAGE_KEYS.lastLocation);
    return null;
  }
  return location;
}

function normalizeSavedLocation(value) {
  const location = normalizeLocation(value);
  if (!location) return null;
  return { ...location, isFavorite: value.isFavorite === true };
}

/**
 * Baca daftar lokasi tersimpan; entri tidak valid dilewati, duplikat `id`
 * dibuang, dan jumlah dibatasi `MAX_SAVED_LOCATIONS`.
 */
export function readSavedLocations() {
  const raw = safeRead(STORAGE_KEYS.savedLocations);
  if (raw === null) return [];

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    safeRemove(STORAGE_KEYS.savedLocations);
    return [];
  }

  if (!Array.isArray(parsed)) {
    safeRemove(STORAGE_KEYS.savedLocations);
    return [];
  }

  const locations = [];
  const seen = new Set();

  for (const entry of parsed) {
    const location = normalizeSavedLocation(entry);
    if (!location || seen.has(location.id)) continue;
    seen.add(location.id);
    locations.push(location);
    if (locations.length >= MAX_SAVED_LOCATIONS) break;
  }

  return locations;
}

/** Simpan daftar lokasi (tanpa snapshot cuaca/AQI, sesuai SPEC §4.4). */
export function writeSavedLocations(locations) {
  if (!Array.isArray(locations)) return false;

  const payload = [];
  const seen = new Set();

  for (const entry of locations) {
    const location = normalizeSavedLocation(entry);
    if (!location || seen.has(location.id)) continue;
    seen.add(location.id);
    payload.push({
      id: location.id,
      name: location.name,
      admin1: location.admin1,
      country: location.country,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone,
      isFavorite: location.isFavorite,
    });
    if (payload.length >= MAX_SAVED_LOCATIONS) break;
  }

  return safeWrite(STORAGE_KEYS.savedLocations, JSON.stringify(payload));
}

/** @returns {boolean} `true` bila lokasi valid dan berhasil disimpan */
export function writeLastLocation(location) {
  const normalized = normalizeLocation(location);
  if (!normalized) return false;
  const payload = { ...normalized };
  delete payload.isSample;
  return safeWrite(STORAGE_KEYS.lastLocation, JSON.stringify(payload));
}
