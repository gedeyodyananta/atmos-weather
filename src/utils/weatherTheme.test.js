import { describe, expect, it } from "vitest";
import { getWeatherTone, resolveIsDay } from "./weatherTheme.js";

describe("getWeatherTone", () => {
  it("memetakan cuaca cerah ke tema siang/malam", () => {
    expect(getWeatherTone(0, true)).toBe("clear-day");
    expect(getWeatherTone(0, false)).toBe("clear-night");
  });

  it("memetakan kategori berawan, hujan, badai, salju, dan kabut", () => {
    expect(getWeatherTone(3, true)).toBe("cloud-day");
    expect(getWeatherTone(3, false)).toBe("cloud-night");
    expect(getWeatherTone(63, true)).toBe("rain");
    expect(getWeatherTone(95, true)).toBe("storm");
    expect(getWeatherTone(75, true)).toBe("snow");
    expect(getWeatherTone(45, true)).toBe("fog");
  });

  it("memberi fallback aman untuk kode tidak dikenal", () => {
    expect(getWeatherTone(null, true)).toBe("cloud-day");
    expect(getWeatherTone(null, false)).toBe("cloud-night");
  });
});

describe("resolveIsDay", () => {
  it("membaca flag API 1/0", () => {
    expect(resolveIsDay(1, false)).toBe(true);
    expect(resolveIsDay(0, true)).toBe(false);
  });

  it("memakai fallback bila flag tidak tersedia", () => {
    expect(resolveIsDay(null, true)).toBe(true);
    expect(resolveIsDay(undefined, false)).toBe(false);
  });
});
