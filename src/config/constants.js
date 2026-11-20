/**
 * Kontrak data & endpoint ATMOS (SPEC §4.2, §4.3, §4.4).
 * Semua nilai yang dipakai bersama lapisan api/service/utilitas ada di sini.
 */

export const API_ENDPOINTS = Object.freeze({
  geocoding: "https://geocoding-api.open-meteo.com/v1/search",
  forecast: "https://api.open-meteo.com/v1/forecast",
  airQuality: "https://air-quality-api.open-meteo.com/v1/air-quality",
});

export const REQUEST_TIMEOUT_MS = 10_000;

export const FORECAST_CACHE_TTL_MS = 10 * 60 * 1000;
export const AIR_QUALITY_CACHE_TTL_MS = 15 * 60 * 1000;
export const GEOCODING_CACHE_TTL_MS = 10 * 60 * 1000;

export const HOURLY_FORECAST_HOURS = 24;
export const DAILY_FORECAST_DAYS = 7;
export const GEOCODING_MAX_RESULTS = 8;
export const GEOCODING_MIN_QUERY_LENGTH = 2;
export const GEOCODING_LANGUAGE = "id";
export const MAX_SAVED_LOCATIONS = 20;

/** Batas ukuran string LocalStorage yang boleh di-JSON.parse (pertahanan DoS). */
export const MAX_STORAGE_VALUE_LENGTH = 256 * 1024;

export const FORECAST_CURRENT_FIELDS = [
  "temperature_2m",
  "relative_humidity_2m",
  "apparent_temperature",
  "weather_code",
  "wind_speed_10m",
  "wind_direction_10m",
  "wind_gusts_10m",
  "surface_pressure",
  "is_day",
  "cloud_cover",
  "precipitation",
  "dew_point_2m",
].join(",");

export const FORECAST_HOURLY_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation_probability",
  "weather_code",
  "wind_speed_10m",
  "uv_index",
  "visibility",
  "precipitation",
].join(",");

export const FORECAST_DAILY_FIELDS = [
  "weather_code",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "sunrise",
  "sunset",
  "uv_index_max",
].join(",");

export const AIR_QUALITY_CURRENT_FIELDS = [
  "us_aqi",
  "pm2_5",
  "pm10",
  "carbon_monoxide",
  "nitrogen_dioxide",
  "ozone",
].join(",");

export const AIR_QUALITY_HOURLY_FIELDS = ["us_aqi", "pm2_5"].join(",");

/** Waktu yang dibutuhkan untuk mencari jam udara terbaik di grafik tren. */
export const AIR_QUALITY_TREND_HOURS = 24;

/** Kota rawan karhutla untuk pemantauan cepat. Koordinat dibulatkan 4 desimal. */
export const KARHUTLA_PRESETS = Object.freeze([
  Object.freeze({
    id: "karhutla:palangkaraya",
    name: "Palangkaraya",
    admin1: "Kalimantan Tengah",
    country: "Indonesia",
    latitude: -2.208,
    longitude: 113.916,
    timezone: "auto",
  }),
  Object.freeze({
    id: "karhutla:pontianak",
    name: "Pontianak",
    admin1: "Kalimantan Barat",
    country: "Indonesia",
    latitude: -0.0263,
    longitude: 109.3425,
    timezone: "auto",
  }),
  Object.freeze({
    id: "karhutla:pekanbaru",
    name: "Pekanbaru",
    admin1: "Riau",
    country: "Indonesia",
    latitude: 0.5071,
    longitude: 101.4478,
    timezone: "auto",
  }),
  Object.freeze({
    id: "karhutla:jambi",
    name: "Jambi",
    admin1: "Jambi",
    country: "Indonesia",
    latitude: -1.6101,
    longitude: 103.6131,
    timezone: "auto",
  }),
]);

/**
 * Lokasi contoh bawaan: Kuta Selatan, Bali.
 * Dipakai hanya saat belum ada `lastLocation` yang valid; UI wajib memberi
 * label "Lokasi contoh" dan aplikasi tidak boleh memakai data statis.
 */
export const DEFAULT_LOCATION = Object.freeze({
  id: "custom:-8.7833,115.1667",
  name: "Kuta Selatan",
  admin1: "Bali",
  country: "Indonesia",
  latitude: -8.7833,
  longitude: 115.1667,
  timezone: "Asia/Makassar",
  isSample: true,
});

export const STORAGE_VERSION = "v1";

export const STORAGE_KEYS = Object.freeze({
  preferences: `atmos.${STORAGE_VERSION}.preferences`,
  favorites: `atmos.${STORAGE_VERSION}.favorites`,
  lastLocation: `atmos.${STORAGE_VERSION}.lastLocation`,
  savedLocations: `atmos.${STORAGE_VERSION}.locations`,
  theme: `atmos.${STORAGE_VERSION}.theme`,
});
