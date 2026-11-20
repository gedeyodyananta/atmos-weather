/**
 * Rekomendasi masker & kesehatan berdasarkan kategori US AQI.
 * Fungsi murni: hanya mengembalikan key kamus, tanpa memanggil `t()` atau DOM,
 * sehingga rekomendasi dapat diuji tanpa bahasa aktif.
 */

import { getAqiCategory } from "./aqi.js";

const ADVISORY_BY_LEVEL = Object.freeze({
  good: Object.freeze({
    maskKey: "health.mask.none",
    maskLevel: "none",
    activityKey: "health.activity.good",
    sensitiveKey: "health.sensitive.good",
  }),
  moderate: Object.freeze({
    maskKey: "health.mask.none",
    maskLevel: "none",
    activityKey: "health.activity.moderate",
    sensitiveKey: "health.sensitive.moderate",
  }),
  sensitive: Object.freeze({
    maskKey: "health.mask.medical",
    maskLevel: "medical",
    activityKey: "health.activity.sensitive",
    sensitiveKey: "health.sensitive.sensitive",
  }),
  unhealthy: Object.freeze({
    maskKey: "health.mask.n95",
    maskLevel: "n95",
    activityKey: "health.activity.unhealthy",
    sensitiveKey: "health.sensitive.unhealthy",
  }),
  very_unhealthy: Object.freeze({
    maskKey: "health.mask.n95",
    maskLevel: "n95",
    activityKey: "health.activity.veryUnhealthy",
    sensitiveKey: "health.sensitive.veryUnhealthy",
  }),
  hazardous: Object.freeze({
    maskKey: "health.mask.n95",
    maskLevel: "n95",
    activityKey: "health.activity.hazardous",
    sensitiveKey: "health.sensitive.hazardous",
  }),
});

/**
 * @param {number|null|undefined} aqi
 * @returns {{ level: string, maskKey: string, maskLevel: string, activityKey: string, sensitiveKey: string }|null}
 */
export function getHealthAdvisory(aqi) {
  const category = getAqiCategory(aqi);
  if (!category) return null;
  const advisory = ADVISORY_BY_LEVEL[category.key];
  if (!advisory) return null;
  return { level: category.key, ...advisory };
}
