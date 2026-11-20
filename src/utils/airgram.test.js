import { beforeEach, describe, expect, it } from "vitest";
import { setLocale } from "../i18n/index.js";
import {
  buildAirgramFilename,
  buildAirgramModel,
  getAirgramDimensions,
  normalizeAirgramFormat,
} from "./airgram.js";

function makeView(overrides = {}) {
  return {
    location: {
      id: "geo:1",
      name: "Palangkaraya",
      admin1: "Kalimantan Tengah",
      country: "Indonesia",
      latitude: -2.208,
      longitude: 113.916,
    },
    unit: "c",
    timezoneAbbreviation: "WIB",
    current: {
      temperature: 31.4,
      apparentTemperature: 35.1,
      weatherCode: 1,
      humidity: 78,
      windSpeed: 8,
      windDirection: 135,
      pressure: 1008,
      visibility: 7000,
      timestamp: "2026-11-20T08:42",
    },
    airQuality: {
      aqi: 84,
      pm25: 17.5,
      pm10: 30,
      co: 500,
      no2: 12,
      o3: 70,
    },
    airHourly: [
      { time: "2026-11-20T08:00", aqi: 90, pm25: 20 },
      { time: "2026-11-20T09:00", aqi: 70, pm25: 16 },
      { time: "2026-11-20T10:00", aqi: 60, pm25: 14 },
    ],
    ...overrides,
  };
}

beforeEach(() => {
  setLocale("id");
});

describe("buildAirgramModel", () => {
  it("merangkum lokasi, AQI, masker, paparan, dan jam terbaik", () => {
    const model = buildAirgramModel(makeView());

    expect(model.location).toBe("Palangkaraya");
    expect(model.tone).toBe("moderate");
    expect(model.aqi).toBe(84);
    expect(model.aqiBadge).toBe("SEDANG");
    expect(model.pm25).toBe("17.5");
    expect(model.mask).toBe("Tanpa Masker");
    expect(model.cigarette).toBe(0.8);
    expect(model.bestWindow).toBe("08.00 – 10.00");
    expect(model.bestAverage).toBe(73.3);
    expect(model.coordinates).toBe("-2.208, 113.916");
    expect(model.dateKey).toBe("2026-11-20");
  });

  it("mengembalikan null bila cuaca saat ini belum tersedia", () => {
    expect(buildAirgramModel(makeView({ current: null }))).toBeNull();
  });

  it("tidak memalsukan AQI/PM2.5 saat data tidak tersedia", () => {
    const model = buildAirgramModel(
      makeView({ airQuality: { aqi: null, pm25: null }, airHourly: [] })
    );

    expect(model.aqi).toBeNull();
    expect(model.pm25).toBe("—");
    expect(model.mask).toBe("Data AQI tidak tersedia");
    expect(model.cigarette).toBeNull();
    expect(model.bestWindow).toBeNull();
  });
});

describe("format Airgram", () => {
  it("menormalkan format dan menyediakan dimensi yang stabil", () => {
    expect(normalizeAirgramFormat("post")).toBe("post");
    expect(normalizeAirgramFormat("lainnya")).toBe("story");
    expect(getAirgramDimensions("story")).toMatchObject({ width: 1080, height: 1920 });
    expect(getAirgramDimensions("post")).toMatchObject({ width: 1080, height: 1350 });
  });

  it("membuat nama file aman dari nama lokasi", () => {
    const model = buildAirgramModel(
      makeView({ location: { ...makeView().location, name: "Kota/Khusus: Uji!" } })
    );
    expect(buildAirgramFilename(model, "post")).toBe(
      "atmos-airgram-kota-khusus-uji-2026-11-20-post.png"
    );
  });
});
