/**
 * Ambang aman WHO dan status per polutan (fungsi murni).
 * Nilai CO dari Open-Meteo masih µg/m³; UI menampilkan mg/m³ lewat `scale`.
 * Visibilitas memakai referensi 10 km dan bersifat "semakin tinggi semakin baik".
 */

export const POLLUTANT_LIMITS = Object.freeze({
  pm25: Object.freeze({ limit: 15, unit: "µg/m³", scale: 1 }),
  pm10: Object.freeze({ limit: 45, unit: "µg/m³", scale: 1 }),
  co: Object.freeze({ limit: 4, unit: "mg/m³", scale: 0.001 }),
  no2: Object.freeze({ limit: 25, unit: "µg/m³", scale: 1 }),
  o3: Object.freeze({ limit: 100, unit: "µg/m³", scale: 1 }),
  visibility: Object.freeze({
    limit: 10,
    unit: "km",
    scale: 0.001,
    higherIsBetter: true,
  }),
});

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * @param {keyof POLLUTANT_LIMITS} key
 * @param {number|null|undefined} rawValue nilai mentah dari API
 */
export function getPollutantStatus(key, rawValue) {
  const config = POLLUTANT_LIMITS[key];
  if (!config) return null;
  if (typeof rawValue !== "number" || !Number.isFinite(rawValue) || rawValue < 0) {
    return {
      key,
      value: null,
      rawValue,
      unit: config.unit,
      limit: config.limit,
      ratio: null,
      percent: 0,
      level: "unknown",
      higherIsBetter: config.higherIsBetter === true,
    };
  }

  const value = rawValue * config.scale;
  const ratio = value / config.limit;
  const percent = clamp(ratio * 100, 0, 100);
  let level;

  if (config.higherIsBetter) {
    level = ratio >= 1 ? "safe" : ratio >= 0.5 ? "watch" : "over";
  } else {
    level = ratio <= 0.5 ? "safe" : ratio <= 1 ? "watch" : "over";
  }

  return {
    key,
    value,
    rawValue,
    unit: config.unit,
    limit: config.limit,
    ratio,
    percent,
    level,
    higherIsBetter: config.higherIsBetter === true,
  };
}
