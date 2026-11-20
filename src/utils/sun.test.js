import { describe, expect, it } from "vitest";
import { formatDayLength, getSunProgress, isTimeNight } from "./sun.js";

const RISE = "2026-06-01T06:00";
const SET = "2026-06-01T18:00";

describe("getSunProgress", () => {
  it("menghitung progres di tengah hari", () => {
    const result = getSunProgress("2026-06-01T12:00", RISE, SET);
    expect(result.state).toBe("day");
    expect(result.progress).toBeCloseTo(0.5, 5);
    expect(result.dayLengthMinutes).toBe(720);
  });

  it("menandai sebelum terbit dan sesudah terbenam sebagai malam", () => {
    expect(getSunProgress("2026-06-01T05:00", RISE, SET)).toMatchObject({
      state: "night",
      progress: 0,
    });
    expect(getSunProgress("2026-06-01T20:00", RISE, SET)).toMatchObject({
      state: "night",
      progress: 1,
    });
  });

  it("mengembalikan unknown saat data tidak lengkap", () => {
    expect(getSunProgress(null, RISE, SET).state).toBe("unknown");
    expect(getSunProgress("2026-06-01T12:00", null, SET).progress).toBeNull();
    expect(getSunProgress("2026-06-01T12:00", SET, RISE).state).toBe("unknown");
  });
});

describe("isTimeNight", () => {
  it("membedakan jam siang dan malam", () => {
    expect(isTimeNight("2026-06-01T12:00", RISE, SET)).toBe(false);
    expect(isTimeNight("2026-06-01T04:00", RISE, SET)).toBe(true);
  });

  it("mengembalikan null bila data matahari tidak valid", () => {
    expect(isTimeNight("2026-06-01T12:00", null, null)).toBeNull();
  });
});

describe("formatDayLength", () => {
  it("memecah menit menjadi jam dan menit", () => {
    expect(formatDayLength(750)).toEqual({ hours: 12, minutes: 30 });
    expect(formatDayLength(0)).toEqual({ hours: 0, minutes: 0 });
  });

  it("menolak nilai tidak valid", () => {
    expect(formatDayLength(-1)).toBeNull();
    expect(formatDayLength(null)).toBeNull();
    expect(formatDayLength(Number.NaN)).toBeNull();
  });
});
