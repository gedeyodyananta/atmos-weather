import { describe, expect, it } from "vitest";
import { mapAirQualityResponse } from "./airQuality.js";
import { mapForecastResponse } from "./forecast.js";
import { mapGeocodingResponse } from "./geocoding.js";
import { ApiError, assertObjectPayload, buildUrl, requestJson } from "./http.js";

const location = { latitude: -8.65, longitude: 115.21667 };
const LOCATION_URL = "https://api.open-meteo.com/v1/forecast";

function codeOf(fn) {
  try {
    fn();
  } catch (error) {
    return error?.code ?? "UNKNOWN";
  }
  return null;
}

describe("validasi respons forecast", () => {
  it("menolak payload bukan objek", () => {
    expect(codeOf(() => mapForecastResponse([], location))).toBe("PARSE");
    expect(codeOf(() => mapForecastResponse(null, location))).toBe("PARSE");
  });

  it("menolak struktur tanpa current/hourly/daily", () => {
    expect(codeOf(() => mapForecastResponse({ current: {} }, location))).toBe("EMPTY_DATA");
    expect(
      codeOf(() =>
        mapForecastResponse({ current: {}, hourly: { time: [] }, daily: { time: ["2026-11-19"] } }, location)
      )
    ).toBe("EMPTY_DATA");
    expect(
      codeOf(() =>
        mapForecastResponse({ current: {}, hourly: { time: ["2026-11-19T10:00"] }, daily: { time: [] } }, location)
      )
    ).toBe("EMPTY_DATA");
  });

  it("mengubah field non-angka menjadi null, bukan 0/NaN", () => {
    const data = mapForecastResponse(
      {
        current: {
          time: "2026-11-19T10:00",
          temperature_2m: "30",
          relative_humidity_2m: 80,
          weather_code: "0",
        },
        hourly: { time: ["2026-11-19T10:00"], temperature_2m: [29] },
        daily: { time: ["2026-11-19"], sunrise: ["2026-11-19T05:50"] },
      },
      location
    );

    expect(data.current.temperature).toBeNull();
    expect(data.current.weatherCode).toBeNull();
    expect(data.current.humidity).toBe(80);
    expect(data.hourly[0].temperature).toBe(29);
  });
});

describe("validasi respons kualitas udara", () => {
  it("mempertahankan AQI/PM null dan menolak nilai negatif", () => {
    const unavailable = mapAirQualityResponse(
      { current: { us_aqi: null, pm2_5: null, pm10: null } },
      location
    );
    expect(unavailable.aqi).toBeNull();
    expect(unavailable.category).toBeNull();
    expect(unavailable.pm25).toBeNull();

    const negative = mapAirQualityResponse({ current: { us_aqi: -5 } }, location);
    expect(negative.aqi).toBeNull();
    expect(negative.category).toBeNull();
  });

  it("menolak payload tanpa blok current", () => {
    expect(codeOf(() => mapAirQualityResponse({}, location))).toBe("EMPTY_DATA");
  });
});

describe("validasi respons geocoding", () => {
  it("melewati entri tanpa nama/koordinat valid dan membatasi 8 hasil", () => {
    const payload = {
      results: [
        { name: "", latitude: 1, longitude: 2 },
        { name: "Tanpa koordinat", latitude: "x", longitude: 2 },
        { name: "Bandung", latitude: -6.9175, longitude: 107.6191, country: "Indonesia" },
        ...Array.from({ length: 9 }, (_, index) => ({
          name: `Kota ${index}`,
          latitude: index,
          longitude: index,
          country: "Indonesia",
        })),
      ],
    };

    const results = mapGeocodingResponse(payload);
    expect(results).toHaveLength(8);
    expect(results[0].name).toBe("Bandung");
    expect(results.every((entry) => Number.isFinite(entry.latitude))).toBe(true);
  });
});

describe("pembentukan URL API", () => {
  it("meng-encode nilai agar tidak bisa menambah/menimpa parameter", () => {
    const url = buildUrl(LOCATION_URL, {
      latitude: "-6.9&timezone=evil",
      name: "a b#c",
    });
    const parsed = new URL(url);

    expect(parsed.origin + parsed.pathname).toBe(LOCATION_URL);
    expect(parsed.searchParams.get("latitude")).toBe("-6.9&timezone=evil");
    expect(parsed.searchParams.get("timezone")).toBeNull();
    expect(parsed.searchParams.get("name")).toBe("a b#c");
  });
});

describe("requestJson — penanganan respons tidak valid", () => {
  const response = (body, { ok = true, status = 200 } = {}) => ({
    ok,
    status,
    text: async () => body,
  });

  it("mengubah body non-JSON menjadi ApiError PARSE", async () => {
    await expect(
      requestJson("https://example.test/x", { fetchImpl: async () => response("bukan json") })
    ).rejects.toMatchObject({ name: "ApiError", code: "PARSE" });
  });

  it("mengubah status 5xx menjadi ApiError HTTP_5XX yang retryable", async () => {
    await expect(
      requestJson("https://example.test/x", {
        fetchImpl: async () => response("", { ok: false, status: 500 }),
      })
    ).rejects.toMatchObject({ code: "HTTP_5XX", retryable: true });
  });

  it("menolak body JSON yang bukan objek di lapisan pemetaan", () => {
    expect(() => assertObjectPayload([], "https://example.test/x")).toThrowError(ApiError);
    expect(codeOf(() => assertObjectPayload("teks", "https://example.test/x"))).toBe("PARSE");
  });
});
