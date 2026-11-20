import { describe, expect, it } from "vitest";
import { POLLUTANT_LIMITS, getPollutantStatus } from "./pollutants.js";

describe("getPollutantStatus", () => {
  it("menghitung rasio PM2.5 terhadap ambang WHO", () => {
    expect(getPollutantStatus("pm25", 15)).toMatchObject({
      value: 15,
      limit: 15,
      percent: 100,
      level: "watch",
    });
    expect(getPollutantStatus("pm25", 7.5).level).toBe("safe");
    expect(getPollutantStatus("pm25", 30)).toMatchObject({ percent: 100, level: "over" });
    expect(getPollutantStatus("pm25", 30).ratio).toBeCloseTo(2, 5);
  });

  it("mengonversi CO dari µg/m³ ke mg/m³", () => {
    const status = getPollutantStatus("co", 2000);
    expect(status.value).toBe(2);
    expect(status.unit).toBe("mg/m³");
    expect(status.percent).toBe(50);
    expect(status.level).toBe("safe");
  });

  it("memakai batas WHO yang berbeda untuk PM10, NO2, dan O3", () => {
    expect(POLLUTANT_LIMITS.pm10.limit).toBe(45);
    expect(POLLUTANT_LIMITS.no2.limit).toBe(25);
    expect(POLLUTANT_LIMITS.o3.limit).toBe(100);
    expect(getPollutantStatus("no2", 12.5).level).toBe("safe");
    expect(getPollutantStatus("no2", 30).level).toBe("over");
  });

  it("membalik penilaian untuk visibilitas (semakin tinggi semakin baik)", () => {
    expect(getPollutantStatus("visibility", 12000)).toMatchObject({
      value: 12,
      level: "safe",
      percent: 100,
    });
    expect(getPollutantStatus("visibility", 6000)).toMatchObject({
      value: 6,
      level: "watch",
      percent: 60,
    });
    expect(getPollutantStatus("visibility", 2000)).toMatchObject({
      value: 2,
      level: "over",
      percent: 20,
    });
  });

  it("mengembalikan status unknown untuk nilai kosong", () => {
    expect(getPollutantStatus("pm25", null)).toMatchObject({
      value: null,
      level: "unknown",
      percent: 0,
    });
    expect(getPollutantStatus("tidak-ada", 5)).toBeNull();
  });

  it("tidak pernah menghasilkan persentase di luar 0–100", () => {
    expect(getPollutantStatus("pm10", 500).percent).toBe(100);
    expect(getPollutantStatus("pm10", -1).percent).toBe(0);
  });
});
