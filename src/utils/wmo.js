/**
 * Pemetaan kode WMO ke label kondisi Bahasa Indonesia (SPEC §4.2, R9).
 * Kode tidak dikenal memakai fallback, tidak melempar error.
 */

const WEATHER_LABELS = Object.freeze({
  0: "Cerah",
  1: "Cerah Berawan",
  2: "Berawan",
  3: "Mendung",
  45: "Kabut",
  48: "Kabut Membeku",
  51: "Gerimis Ringan",
  53: "Gerimis Sedang",
  55: "Gerimis Lebat",
  56: "Gerimis Membeku Ringan",
  57: "Gerimis Membeku Lebat",
  61: "Hujan Ringan",
  63: "Hujan Sedang",
  65: "Hujan Lebat",
  66: "Hujan Membeku Ringan",
  67: "Hujan Membeku Lebat",
  71: "Salju Ringan",
  73: "Salju Sedang",
  75: "Salju Lebat",
  77: "Butiran Salju",
  80: "Hujan Lokal Ringan",
  81: "Hujan Lokal Sedang",
  82: "Hujan Lokal Lebat",
  85: "Hujan Salju Ringan",
  86: "Hujan Salju Lebat",
  95: "Badai Petir",
  96: "Badai Petir dengan Hujan Es Ringan",
  99: "Badai Petir dengan Hujan Es Lebat",
});

export const UNKNOWN_WEATHER_LABEL = "Cuaca tidak diketahui";

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
 * @returns {string} label kondisi; fallback untuk kode kosong/tidak dikenal
 */
export function getWeatherConditionLabel(code) {
  if (typeof code !== "number" || !Number.isFinite(code)) return UNKNOWN_WEATHER_LABEL;
  return WEATHER_LABELS[Math.trunc(code)] ?? UNKNOWN_WEATHER_LABEL;
}
