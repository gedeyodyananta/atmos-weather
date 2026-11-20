/**
 * Model data untuk poster Airgram (fungsi murni).
 * Renderer canvas tinggal menggambar model ini; tidak ada fetch atau DOM di sini.
 */

import { t } from "../i18n/index.js";
import { getAqiCategory, getAqiDisplay } from "./aqi.js";
import { findBestAirWindow } from "./bestAirWindow.js";
import { getCigaretteEquivalent } from "./exposure.js";
import {
  formatClock,
  formatDateKey,
  formatDateLabel,
  formatHour,
  formatNumber,
  formatTemperatureParts,
} from "./format.js";
import { getHealthAdvisory } from "./healthAdvisory.js";
import { getLocationDisplayName } from "./locationName.js";
import { getWeatherConditionLabel } from "./wmo.js";

export const AIRGRAM_FORMATS = Object.freeze({
  story: Object.freeze({ width: 1080, height: 1920, labelKey: "airgram.format.story" }),
  post: Object.freeze({ width: 1080, height: 1350, labelKey: "airgram.format.post" }),
});

export const AIRGRAM_COLORS = Object.freeze({
  good: "#b8e06a",
  moderate: "#f5c445",
  sensitive: "#f39a4b",
  unhealthy: "#ef6b55",
  very_unhealthy: "#8b5aa6",
  hazardous: "#4a2b5c",
  unknown: "#f4f0e6",
});

export function normalizeAirgramFormat(format) {
  return format === "post" ? "post" : "story";
}

export function getAirgramDimensions(format) {
  return AIRGRAM_FORMATS[normalizeAirgramFormat(format)];
}

function finite(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function coordinateLabel(location) {
  if (!finite(location?.latitude) || !finite(location?.longitude)) return "—";
  return `${location.latitude.toFixed(3)}, ${location.longitude.toFixed(3)}`;
}

/**
 * @param {object} view hasil `buildWeatherView(store)`
 * @returns {object|null} null bila belum ada kondisi cuaca saat ini
 */
export function buildAirgramModel(view) {
  const current = view?.current;
  if (!current) return null;

  const location = view.location ?? {};
  const aqi = finite(view.airQuality?.aqi) ? Math.round(view.airQuality.aqi) : null;
  const category = aqi === null ? null : getAqiCategory(aqi);
  const display = category ? getAqiDisplay(category) : null;
  const advisory = aqi === null ? null : getHealthAdvisory(aqi);
  const pm25 = finite(view.airQuality?.pm25) ? view.airQuality.pm25 : null;
  const best = findBestAirWindow(view.airHourly ?? [], 3);
  const temperature = formatTemperatureParts(current.temperature, view.unit);

  return {
    location: getLocationDisplayName(location),
    region: [location.admin1, location.country].filter(Boolean).join(" · "),
    coordinates: coordinateLabel(location),
    date: formatDateLabel(current.timestamp),
    dateKey: formatDateKey(current.timestamp) ?? "today",
    time: formatClock(current.timestamp),
    zone: view.timezoneAbbreviation ?? "",
    temperature,
    condition: getWeatherConditionLabel(current.weatherCode),
    tone: category?.key ?? "unknown",
    color: AIRGRAM_COLORS[category?.key ?? "unknown"],
    aqi,
    aqiBadge: display?.badge ?? t("aqi.na"),
    aqiCategory: display?.label ?? t("aqi.na"),
    pm25: pm25 === null ? "—" : formatNumber(pm25, 1),
    pm25Available: pm25 !== null,
    mask: advisory ? t(advisory.maskKey) : t("airgram.noAqi"),
    cigarette: getCigaretteEquivalent(pm25),
    bestWindow: best
      ? `${formatHour(best.startTime)} – ${formatHour(best.endTime)}`
      : null,
    bestAverage: best?.averageAqi ?? null,
    scale: t("airgram.scale"),
    disclaimer: t("airgram.disclaimer"),
    footer: t("airgram.footer"),
  };
}

/** Nama file aman untuk diunduh; tidak memakai karakter path. */
export function buildAirgramFilename(model, format) {
  const city = (model?.location ?? "atmos")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "atmos";
  const date = model?.dateKey ?? "today";
  return `atmos-airgram-${city}-${date}-${normalizeAirgramFormat(format)}.png`;
}
