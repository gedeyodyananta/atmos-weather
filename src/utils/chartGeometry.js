/**
 * Geometri grafik suhu 24 jam untuk SVG native (fungsi murni, tanpa DOM).
 * Skala dihitung dari suhu + feels-like agar kedua garis selalu terlihat.
 */

import { convertTemperature } from "./format.js";

const DEFAULT_PADDING = Object.freeze({ left: 44, right: 14, top: 16, bottom: 58 });

function paddedDomain(min, max) {
  if (min === max) {
    const pad = Math.max(1, Math.abs(min) * 0.1);
    return { min: min - pad, max: max + pad };
  }
  const pad = Math.max(0.8, (max - min) * 0.12);
  return { min: min - pad, max: max + pad };
}

/**
 * @param {Array<{time:string,temperature:number|null,apparentTemperature:number|null,precipitationProbability:number|null}>} hours
 * @param {{ width?: number, height?: number, unit?: string, padding?: object }} [options]
 */
export function buildTemperatureChart(hours, options = {}) {
  const list = Array.isArray(hours) ? hours.slice(0, 24) : [];
  if (list.length < 2) return null;

  const width = options.width ?? 640;
  const height = options.height ?? 250;
  const padding = { ...DEFAULT_PADDING, ...(options.padding ?? {}) };
  const unit = options.unit ?? "c";

  const values = [];
  for (const hour of list) {
    const temp = convertTemperature(hour.temperature, unit);
    const feels = convertTemperature(hour.apparentTemperature, unit);
    if (typeof temp === "number" && Number.isFinite(temp)) values.push(temp);
    if (typeof feels === "number" && Number.isFinite(feels)) values.push(feels);
  }
  if (values.length === 0) return null;

  const domain = paddedDomain(Math.min(...values), Math.max(...values));
  const plot = {
    left: padding.left,
    right: width - padding.right,
    top: padding.top,
    bottom: height - padding.bottom,
  };
  const plotWidth = Math.max(1, plot.right - plot.left);
  const plotHeight = Math.max(1, plot.bottom - plot.top);

  const xFor = (index) => plot.left + (index / (list.length - 1)) * plotWidth;
  const yFor = (value) => plot.top + ((domain.max - value) / (domain.max - domain.min)) * plotHeight;

  const toPoints = (key) =>
    list
      .map((hour, index) => {
        const value = convertTemperature(hour[key], unit);
        if (typeof value !== "number" || !Number.isFinite(value)) return null;
        return { x: xFor(index), y: yFor(value), value, time: hour.time };
      })
      .filter(Boolean);

  const tempPoints = toPoints("temperature");
  const feelsPoints = toPoints("apparentTemperature");

  const pathOf = (points) =>
    points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");

  const rainBars = list.map((hour, index) => {
    const probability =
      typeof hour.precipitationProbability === "number" &&
      Number.isFinite(hour.precipitationProbability)
        ? Math.max(0, Math.min(100, hour.precipitationProbability))
        : null;
    return {
      x: xFor(index),
      value: probability,
      time: hour.time,
      height: probability === null ? 0 : (probability / 100) * 26,
    };
  });

  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount }, (_, index) => {
    const value = domain.min + ((domain.max - domain.min) * index) / (tickCount - 1);
    return { value, y: yFor(value) };
  });

  const tempValues = tempPoints.map((point) => point.value);
  const minTemp = tempValues.length > 0 ? Math.min(...tempValues) : null;
  const maxTemp = tempValues.length > 0 ? Math.max(...tempValues) : null;

  return {
    width,
    height,
    plot,
    domain,
    tempPath: pathOf(tempPoints),
    feelsPath: pathOf(feelsPoints),
    tempPoints,
    feelsPoints,
    rainBars,
    yTicks,
    xFor,
    minTemp,
    maxTemp,
    unit,
  };
}
