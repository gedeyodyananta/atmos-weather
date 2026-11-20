import { describe, expect, it } from "vitest";
import { findBestAirWindow } from "./bestAirWindow.js";

const hours = [
  { time: "2026-08-01T10:00", aqi: 90 },
  { time: "2026-08-01T11:00", aqi: 70 },
  { time: "2026-08-01T12:00", aqi: 60 },
  { time: "2026-08-01T13:00", aqi: 40 },
  { time: "2026-08-01T14:00", aqi: 42 },
  { time: "2026-08-01T15:00", aqi: 45 },
  { time: "2026-08-01T16:00", aqi: 80 },
];

describe("findBestAirWindow", () => {
  it("menemukan tiga jam berurutan dengan rata-rata AQI terendah", () => {
    expect(findBestAirWindow(hours, 3)).toEqual({
      startIndex: 3,
      endIndex: 5,
      startTime: "2026-08-01T13:00",
      endTime: "2026-08-01T15:00",
      averageAqi: 42.3,
      hours: 3,
    });
  });

  it("mendukung ukuran jendela lain", () => {
    const result = findBestAirWindow(hours, 2);
    expect(result.startTime).toBe("2026-08-01T13:00");
    expect(result.endTime).toBe("2026-08-01T14:00");
    expect(result.averageAqi).toBe(41);
  });

  it("melewati jendela yang memiliki AQI kosong", () => {
    const withGap = [
      { time: "a", aqi: 10 },
      { time: "b", aqi: null },
      { time: "c", aqi: 20 },
      { time: "d", aqi: 30 },
      { time: "e", aqi: 40 },
    ];
    expect(findBestAirWindow(withGap, 2).startTime).toBe("c");
  });

  it("mengembalikan null bila data kurang atau tidak lengkap", () => {
    expect(findBestAirWindow([], 3)).toBeNull();
    expect(findBestAirWindow([{ time: "a", aqi: null }], 1)).toBeNull();
    expect(findBestAirWindow(null, 3)).toBeNull();
  });
});
