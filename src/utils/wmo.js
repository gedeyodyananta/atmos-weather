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

/**
 * @param {number|null|undefined} code
 * @returns {string} label kondisi; fallback untuk kode kosong/tidak dikenal
 */
export function getWeatherConditionLabel(code) {
  if (typeof code !== "number" || !Number.isFinite(code)) return UNKNOWN_WEATHER_LABEL;
  return WEATHER_LABELS[Math.trunc(code)] ?? UNKNOWN_WEATHER_LABEL;
}
