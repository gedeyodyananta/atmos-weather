import { describe, expect, it } from "vitest";
import { buildTemperatureChart } from "./chartGeometry.js";

function hour(offset, temperature, feels, rain) {
  return {
    time: `2026-06-01T${String(offset).padStart(2, "0")}:00`,
    temperature,
    apparentTemperature: feels,
    precipitationProbability: rain,
  };
}

const HOURS = [
  hour(0, 24, 26, 10),
  hour(1, 25, 27, 40),
  hour(2, 27, 29, 80),
  hour(3, 26, 28, 0),
];

describe("buildTemperatureChart", () => {
  it("mengembalikan null bila data kurang dari dua jam", () => {
    expect(buildTemperatureChart([])).toBeNull();
    expect(buildTemperatureChart([HOURS[0]])).toBeNull();
  });

  it("membangun path, titik, dan rentang suhu", () => {
    const chart = buildTemperatureChart(HOURS, { width: 400, height: 200 });
    expect(chart.tempPoints).toHaveLength(4);
    expect(chart.feelsPoints).toHaveLength(4);
    expect(chart.tempPath.startsWith("M")).toBe(true);
    expect(chart.tempPath.split("L")).toHaveLength(4);
    expect(chart.minTemp).toBe(24);
    expect(chart.maxTemp).toBe(27);
    expect(chart.yTicks).toHaveLength(4);
  });

  it("menjaga titik tetap di dalam area plot", () => {
    const chart = buildTemperatureChart(HOURS);
    const x = chart.tempPoints.map((point) => point.x);
    expect(x).toEqual([...x].sort((a, b) => a - b));
    for (const point of chart.tempPoints) {
      expect(point.x).toBeGreaterThanOrEqual(chart.plot.left);
      expect(point.x).toBeLessThanOrEqual(chart.plot.right);
      expect(point.y).toBeGreaterThanOrEqual(chart.plot.top);
      expect(point.y).toBeLessThanOrEqual(chart.plot.bottom);
    }
  });

  it("mengubah nilai ke Fahrenheit sesuai unit", () => {
    const celsius = buildTemperatureChart(HOURS, { unit: "c" });
    const fahrenheit = buildTemperatureChart(HOURS, { unit: "f" });
    expect(fahrenheit.minTemp).toBeCloseTo(75.2, 1);
    expect(fahrenheit.maxTemp).toBeCloseTo(80.6, 1);
    expect(fahrenheit.tempPoints[0].value).toBeCloseTo(75.2, 1);
    expect(celsius.tempPoints[0].value).toBe(24);
  });

  it("membuat bar hujan proporsional dan menangani nilai kosong", () => {
    const chart = buildTemperatureChart([
      ...HOURS,
      { ...hour(4, 25, 26, null) },
    ]);
    expect(chart.rainBars[2].height).toBeCloseTo(20.8, 5);
    expect(chart.rainBars[4].height).toBe(0);
  });
});
