import { describe, expect, it } from "vitest";
import { buildWeatherAlerts } from "./alerts.js";

function weather(overrides = {}) {
  return {
    current: {
      uvIndex: 3,
      windSpeed: 10,
      windGusts: 15,
      ...overrides.current,
    },
    hourly: overrides.hourly ?? [
      { precipitationProbability: 10, weatherCode: 1 },
      { precipitationProbability: 20, weatherCode: 2 },
    ],
    daily: overrides.daily ?? [{ temperatureMin: 24, temperatureMax: 30 }],
  };
}

describe("buildWeatherAlerts", () => {
  it("tidak menghasilkan peringatan pada kondisi biasa", () => {
    expect(buildWeatherAlerts(weather(), { aqi: 40 })).toEqual([]);
  });

  it("mendeteksi hujan lebat dalam enam jam", () => {
    const alerts = buildWeatherAlerts(
      weather({ hourly: [{ precipitationProbability: 85, weatherCode: 61 }] }),
      { aqi: 40 }
    );
    expect(alerts).toContainEqual({
      key: "alerts.rain",
      tone: "rain",
      params: { probability: 85, hours: 6 },
    });
  });

  it("mendeteksi badai, UV tinggi, angin kencang, AQI, dan selisih suhu", () => {
    const alerts = buildWeatherAlerts(
      weather({
        current: { uvIndex: 9, windSpeed: 40, windGusts: 55 },
        hourly: [{ precipitationProbability: 10, weatherCode: 95 }],
        daily: [{ temperatureMin: 15, temperatureMax: 33 }],
      }),
      { aqi: 140 }
    );
    const keys = alerts.map((alert) => alert.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "alerts.storm",
        "alerts.uv",
        "alerts.wind",
        "alerts.aqi",
        "alerts.swing",
      ])
    );
  });

  it("membatasi jumlah peringatan menjadi enam", () => {
    const alerts = buildWeatherAlerts(
      weather({
        current: { uvIndex: 12, windSpeed: 60, windGusts: 80 },
        hourly: [{ precipitationProbability: 100, weatherCode: 99 }],
        daily: [{ temperatureMin: 5, temperatureMax: 40 }],
      }),
      { aqi: 320 }
    );
    expect(alerts.length).toBeLessThanOrEqual(6);
  });

  it("aman untuk data kosong", () => {
    expect(buildWeatherAlerts(null, null)).toEqual([]);
  });
});
