/**
 * Geometri grafik tren AQI & PM2.5 24 jam sebagai SVG native (fungsi murni).
 * AQI digambar sebagai batang, PM2.5 sebagai garis; keduanya memakai skala
 * vertikal terpisah agar fluktuasi kecil tetap terbaca.
 */

import { getAqiCategory } from "./aqi.js";
import { findBestAirWindow } from "./bestAirWindow.js";

const DEFAULT_PADDING = Object.freeze({ left: 38, right: 42, top: 18, bottom: 40 });
const MIN_AQI_DOMAIN = 100;
const MIN_PM_DOMAIN = 35;

const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * @param {Array<{ time: string, aqi: number|null, pm25: number|null }>} hours
 * @param {{ width?: number, height?: number, windowSize?: number }} [options]
 */
export function buildAirQualityChart(hours, options = {}) {
  const list = Array.isArray(hours) ? hours.slice(0, 24) : [];
  if (list.length < 2) return null;

  const width = options.width ?? 560;
  const height = options.height ?? 240;
  const padding = { ...DEFAULT_PADDING };
  const plot = {
    left: padding.left,
    right: width - padding.right,
    top: padding.top,
    bottom: height - padding.bottom,
  };
  const plotWidth = Math.max(1, plot.right - plot.left);
  const plotHeight = Math.max(1, plot.bottom - plot.top);
  const step = plotWidth / list.length;
  const barWidth = Math.max(4, step * 0.58);

  const aqiValues = list.map((hour) => hour?.aqi).filter(isNumber);
  const pmValues = list.map((hour) => hour?.pm25).filter(isNumber);
  const maxAqi = Math.max(MIN_AQI_DOMAIN, ...aqiValues);
  const maxPm = Math.max(MIN_PM_DOMAIN, ...pmValues);

  const bars = list.map((hour, index) => {
    const aqi = isNumber(hour?.aqi) ? hour.aqi : null;
    const category = aqi === null ? null : getAqiCategory(aqi);
    const normalized = aqi === null ? 0 : clamp(aqi / maxAqi, 0, 1);
    return {
      time: hour?.time ?? null,
      aqi,
      pm25: isNumber(hour?.pm25) ? hour.pm25 : null,
      x: plot.left + step * index + step / 2,
      y: plot.bottom - normalized * plotHeight,
      height: normalized * plotHeight,
      width: barWidth,
      level: category?.key ?? "unknown",
    };
  });

  const pmPoints = list
    .map((hour, index) => {
      if (!isNumber(hour?.pm25)) return null;
      return {
        time: hour.time,
        value: hour.pm25,
        x: plot.left + step * index + step / 2,
        y: plot.bottom - clamp(hour.pm25 / maxPm, 0, 1) * plotHeight,
      };
    })
    .filter(Boolean);

  const linePath = pmPoints
    .map(
      (point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    )
    .join(" ");

  const best = findBestAirWindow(list, options.windowSize ?? 3);
  const bestRange = best
    ? {
        ...best,
        x: plot.left + best.startIndex * step,
        width: step * (best.endIndex - best.startIndex + 1),
      }
    : null;

  const aqiTicks = [0, 0.5, 1].map((fraction) => ({
    value: Math.round(maxAqi * fraction),
    y: plot.bottom - fraction * plotHeight,
  }));
  const pmTicks = [0, 0.5, 1].map((fraction) => ({
    value: Math.round(maxPm * fraction),
    y: plot.bottom - fraction * plotHeight,
  }));

  const peakAqi = aqiValues.length > 0 ? Math.max(...aqiValues) : null;
  const peakBar = peakAqi === null ? null : bars.find((bar) => bar.aqi === peakAqi) ?? null;

  return {
    width,
    height,
    plot,
    step,
    bars,
    pmPoints,
    linePath,
    best: bestRange,
    aqiTicks,
    pmTicks,
    maxAqi,
    maxPm,
    peakAqi,
    peakTime: peakBar?.time ?? null,
  };
}
