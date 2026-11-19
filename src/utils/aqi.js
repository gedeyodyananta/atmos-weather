/**
 * Satu sumber kebenaran ambang US AQI (SPEC §3.2).
 * Komponen UI tidak boleh menduplikasi ambang atau memakai `european_aqi`.
 * Warna tidak boleh menjadi satu-satunya pembeda: `pattern` + label selalu ada.
 */

export const AQI_SCALE_LABEL = "US AQI";

export const AQI_CATEGORIES = Object.freeze([
  Object.freeze({
    key: "good",
    label: "Baik",
    labelEn: "Good",
    badgeLabel: "BAIK",
    description: "Udara baik untuk aktivitas luar.",
    color: "var(--lime)",
    textColor: "var(--ink)",
    pattern: "none",
    min: 0,
    max: 50,
  }),
  Object.freeze({
    key: "moderate",
    label: "Sedang",
    labelEn: "Moderate",
    badgeLabel: "SEDANG",
    description: "Udara dapat diterima untuk sebagian besar orang.",
    color: "var(--solar)",
    textColor: "var(--ink)",
    pattern: "none",
    min: 51,
    max: 100,
  }),
  Object.freeze({
    key: "sensitive",
    label: "Tidak Sehat (Grup Sensitif)",
    labelEn: "Unhealthy for Sensitive Groups",
    badgeLabel: "GRUP SENSITIF",
    description: "Kelompok sensitif sebaiknya membatasi aktivitas luar yang berat.",
    color: "var(--coral)",
    textColor: "var(--ink)",
    pattern: "diagonal",
    min: 101,
    max: 150,
  }),
  Object.freeze({
    key: "unhealthy",
    label: "Tidak Sehat",
    labelEn: "Unhealthy",
    badgeLabel: "TIDAK SEHAT",
    description: "Semua orang sebaiknya mengurangi aktivitas luar yang berat.",
    color: "var(--coral)",
    textColor: "var(--ink)",
    pattern: "cross",
    min: 151,
    max: 200,
  }),
  Object.freeze({
    key: "very_unhealthy",
    label: "Sangat Tidak Sehat",
    labelEn: "Very Unhealthy",
    badgeLabel: "SANGAT TIDAK SEHAT",
    description: "Udara berisiko; batasi aktivitas di luar ruang.",
    color: "var(--ink)",
    textColor: "var(--cream)",
    pattern: "none",
    icon: "warning",
    min: 201,
    max: 300,
  }),
  Object.freeze({
    key: "hazardous",
    label: "Berbahaya",
    labelEn: "Hazardous",
    badgeLabel: "BERBAHAYA",
    description: "Kualitas udara berbahaya; hindari aktivitas di luar ruang.",
    color: "var(--ink)",
    textColor: "var(--solar)",
    pattern: "cross",
    icon: "warning",
    min: 301,
    max: Infinity,
  }),
]);

const CATEGORY_BY_KEY = new Map(AQI_CATEGORIES.map((category) => [category.key, category]));

export function isAqiValue(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Kategori US AQI dari nilai mentah. Batas 50/51, 100/101, 150/151,
 * 200/201, 300/301 mengikuti tabel §3.2.
 *
 * @param {number|null|undefined} value
 * @returns {object|null} kategori, atau `null` bila nilai tidak valid
 */
export function getAqiCategory(value) {
  if (!isAqiValue(value)) return null;
  const rounded = Math.round(value);

  if (rounded <= 50) return CATEGORY_BY_KEY.get("good");
  if (rounded <= 100) return CATEGORY_BY_KEY.get("moderate");
  if (rounded <= 150) return CATEGORY_BY_KEY.get("sensitive");
  if (rounded <= 200) return CATEGORY_BY_KEY.get("unhealthy");
  if (rounded <= 300) return CATEGORY_BY_KEY.get("very_unhealthy");
  return CATEGORY_BY_KEY.get("hazardous");
}

export function getAqiCategoryByKey(key) {
  return CATEGORY_BY_KEY.get(key) ?? null;
}
