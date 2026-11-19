/**
 * Satu tempat konversi & format tampilan (SPEC §5.4 butir 3, NFR-7).
 *
 * Waktu Open-Meteo datang sebagai string waktu lokal lokasi ("YYYY-MM-DDTHH:mm"),
 * jadi komponen tanggal/jam diparse langsung dari string tersebut. Tidak ada
 * konversi ke zona waktu perangkat, sehingga jam selalu mengikuti zona lokasi.
 */

export const EMPTY_VALUE = "—";

const FALLBACK = EMPTY_VALUE;

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const dateWithYearFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dayFormatter = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: "UTC" });

function isNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

/** @returns {number|null} suhu dalam satuan terpilih */
export function convertTemperature(celsius, unit = "c") {
  if (!isNumber(celsius)) return null;
  return unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
}

/** Pisahkan angka dan label satuan agar derajat bisa ditata sebagai superscript. */
export function formatTemperatureParts(celsius, unit = "c", { decimals = 1 } = {}) {
  const converted = convertTemperature(celsius, unit);
  if (converted === null) return null;
  return {
    value: converted.toFixed(decimals),
    unit: unit === "f" ? "°F" : "°C",
  };
}

export function formatTemperature(celsius, unit = "c", { decimals = 1, withUnit = true } = {}) {
  const parts = formatTemperatureParts(celsius, unit, { decimals });
  if (!parts) return FALLBACK;
  return withUnit ? `${parts.value}${parts.unit}` : parts.value;
}

export function formatNumber(value, decimals = 0) {
  if (!isNumber(value)) return FALLBACK;
  return value.toFixed(decimals);
}

export function formatPercent(value) {
  if (!isNumber(value)) return FALLBACK;
  return `${Math.round(value)}%`;
}

export function formatWind(kmh) {
  if (!isNumber(kmh)) return FALLBACK;
  return `${kmh.toFixed(1)} km/j`;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

/** Arah mata angin 8 titik + derajat, mis. "NE · 45°". */
export function formatWindDirection(degrees) {
  if (!isNumber(degrees)) return null;
  const normalized = ((degrees % 360) + 360) % 360;
  const index = Math.round(normalized / 45) % COMPASS.length;
  return `${COMPASS[index]} · ${Math.round(normalized)}°`;
}

/** Meter → km dengan 1 desimal. */
export function formatVisibility(meters) {
  if (!isNumber(meters)) return FALLBACK;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Parse string waktu lokal Open-Meteo tanpa menggeser zona waktu.
 * @returns {{year:number,month:number,day:number,hour:number,minute:number}|null}
 */
export function parseLocalIso(iso) {
  if (typeof iso !== "string") return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: match[4] ? Number(match[4]) : 0,
    minute: match[5] ? Number(match[5]) : 0,
  };
}

function asUtcDate(parts) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

/** "08.42" */
export function formatClock(iso) {
  const parts = parseLocalIso(iso);
  if (!parts) return FALLBACK;
  return `${pad(parts.hour)}.${pad(parts.minute)}`;
}

/** "08.00" — label jam pada strip prakiraan. */
export function formatHour(iso) {
  const parts = parseLocalIso(iso);
  if (!parts) return FALLBACK;
  return `${pad(parts.hour)}.00`;
}

/** "Kam, 19 Nov 2026" */
export function formatDateLabel(iso, { withYear = true } = {}) {
  const parts = parseLocalIso(iso);
  if (!parts) return FALLBACK;
  const formatter = withYear ? dateWithYearFormatter : dateFormatter;
  return formatter.format(asUtcDate(parts));
}

/** "Kam" */
export function formatDayLabel(iso) {
  const parts = parseLocalIso(iso);
  if (!parts) return FALLBACK;
  return dayFormatter.format(asUtcDate(parts));
}

/** "19/11" */
export function formatDayMonth(iso) {
  const parts = parseLocalIso(iso);
  if (!parts) return FALLBACK;
  return `${pad(parts.day)}/${pad(parts.month)}`;
}

/** "2026-11-19" — dipakai untuk membandingkan hari. */
export function formatDateKey(iso) {
  const parts = parseLocalIso(iso);
  if (!parts) return null;
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function isSameDate(a, b) {
  const left = formatDateKey(a);
  const right = formatDateKey(b);
  return Boolean(left) && left === right;
}

const UV_LEVELS = [
  { max: 2, label: "Rendah", badgeLabel: "RENDAH" },
  { max: 5, label: "Sedang", badgeLabel: "SEDANG" },
  { max: 7, label: "Tinggi", badgeLabel: "TINGGI" },
  { max: 10, label: "Sangat Tinggi", badgeLabel: "SANGAT TINGGI" },
  { max: Infinity, label: "Ekstrem", badgeLabel: "EKSTREM" },
];

export function getUvCategory(value) {
  if (!isNumber(value) || value < 0) return null;
  const rounded = Math.round(value);
  return UV_LEVELS.find((level) => rounded <= level.max) ?? UV_LEVELS[UV_LEVELS.length - 1];
}

export function getHumidityCaption(value) {
  if (!isNumber(value)) return "tidak tersedia";
  if (value < 30) return "Kering";
  if (value > 70) return "Lembap";
  return "Nyaman";
}
