import { describe, expect, it } from "vitest";
import { buildAirQualityChart } from "./airChartGeometry.js";

const HOURS = [
  { time: "2026-08-01T10:00", aqi: 120, pm25: 45 },
  { time: "2026-08-01T11:00", aqi: 80, pm25: 30 },
  { time: "2026-08-01T12:00", aqi: 60, pm25: 22 },
  { time: "2026-08-01T13:00", aqi: 40, pm25: 14 },
  { time: "2026-08-01T14:00", aqi: 42, pm25: 15 },
  { time: "2026-08-01T15:00", aqi: 45, pm25: 17 },
  { time: "2026-08-01T16:00", aqi: 95, pm25: 38 },
];

describe("buildAirQualityChart", () => {
  it("mengembalikan null bila data kurang dari dua jam", () => {
    expect(buildAirQualityChart([])).toBeNull();
    expect(buildAirQualityChart([HOURS[0]])).toBeNull();
    expect(buildAirQualityChart(null)).toBeNull();
  });

  it("membangun batang AQI, garis PM2.5, dan penanda jendela terbaik", () => {
    const chart = buildAirQualityChart(HOURS, { width: 400, height: 200 });
    expect(chart.bars).toHaveLength(7);
    expect(chart.pmPoints).toHaveLength(7);
    expect(chart.linePath.startsWith("M")).toBe(true);
    expect(chart.best.startTime).toBe("2026-08-01T13:00");
    expect(chart.best.endTime).toBe("2026-08-01T15:00");
    expect(chart.best.width).toBeGreaterThan(0);
  });

  it("mempertahankan tinggi batang tidak negatif dan di dalam plot", () => {
    const chart = buildAirQualityChart(HOURS);
    for (const bar of chart.bars) {
      expect(bar.height).toBeGreaterThanOrEqual(0);
      expect(bar.y).toBeLessThanOrEqual(chart.plot.bottom);
      expect(bar.y).toBeGreaterThanOrEqual(chart.plot.top);
    }
  });

  it("menandai level kategori tiap batang dan puncak AQI", () => {
    const chart = buildAirQualityChart(HOURS);
    expect(chart.bars[0].level).toBe("sensitive");
    expect(chart.bars[3].level).toBe("good");
    expect(chart.peakAqi).toBe(120);
    expect(chart.peakTime).toBe("2026-08-01T10:00");
  });

  it("menoleransi nilai AQI/PM2.5 kosong", () => {
    const chart = buildAirQualityChart([
      { time: "a", aqi: null, pm25: null },
      { time: "b", aqi: 60, pm25: 20 },
      { time: "c", aqi: 50, pm25: null },
    ]);
    expect(chart.bars[0]).toMatchObject({ aqi: null, height: 0, level: "unknown" });
    expect(chart.pmPoints).toHaveLength(1);
    expect(chart.best).toBeNull();
  });
});
