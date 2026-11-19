import { describe, expect, it } from "vitest";
import { buildWeatherShareMessage, buildWeatherShareUrl } from "./weatherShare.js";

const validWeather = {
  name: "Kuta Selatan",
  temperature: 29.9,
  condition: "Gerimis Ringan",
  aqi: 51,
};

describe("buildWeatherShareUrl — data valid", () => {
  it("menghasilkan URL WhatsApp dengan pesan ter-encode", () => {
    const url = buildWeatherShareUrl(validWeather, "c");
    expect(url.startsWith("https://wa.me/?text=")).toBe(true);

    const encoded = url.slice("https://wa.me/?text=".length);
    expect(encoded).not.toMatch(/[\s&]/);

    const message = decodeURIComponent(encoded);
    expect(message).toBe(buildWeatherShareMessage(validWeather, "c"));
    expect(message).toContain("Kuta Selatan");
    expect(message).toContain("30°C");
    expect(message).toContain("Gerimis Ringan");
    expect(message).toContain("AQI: 51");
  });

  it("meng-encode karakter khusus (derajat, spasi, simbol) dengan benar", () => {
    const url = buildWeatherShareUrl(
      {
        name: "Kota & Co / #1 (Panas) 100%",
        temperature: 26.3,
        condition: "Hujan & Petir",
        aqi: 154,
      },
      "f"
    );
    const encoded = url.slice("https://wa.me/?text=".length);

    expect(encoded).toContain("%C2%B0F");
    expect(encoded).toContain("%26");
    expect(encoded).toContain("%2F");
    expect(encoded).toContain("%23");
    expect(encoded).toContain("%25");
    expect(encoded).toContain("%20");

    const message = decodeURIComponent(encoded);
    expect(message).toContain("Kota & Co / #1 (Panas) 100%");
    expect(message).toContain("Hujan & Petir");
    expect(message).toContain("79°F");
  });

  it("memakai satuan Celsius sebagai default", () => {
    expect(buildWeatherShareUrl(validWeather)).toContain(encodeURIComponent("30°C"));
  });
});

describe("buildWeatherShareUrl — data tidak siap", () => {
  it("mengembalikan null saat data null, loading, atau error", () => {
    expect(buildWeatherShareUrl(null)).toBeNull();
    expect(buildWeatherShareUrl(undefined)).toBeNull();
    expect(buildWeatherShareUrl({ status: "loading" })).toBeNull();
    expect(buildWeatherShareUrl({ status: "error", error: { code: "NETWORK" } })).toBeNull();
    expect(buildWeatherShareUrl("bukan objek")).toBeNull();
  });

  it("mengembalikan null saat field wajib hilang atau tidak terbatas", () => {
    expect(buildWeatherShareUrl({ ...validWeather, name: "   " })).toBeNull();
    expect(buildWeatherShareUrl({ ...validWeather, temperature: Number.NaN })).toBeNull();
    expect(buildWeatherShareUrl({ ...validWeather, temperature: "29.9" })).toBeNull();
    expect(buildWeatherShareUrl({ ...validWeather, condition: "" })).toBeNull();
    expect(buildWeatherShareUrl({ ...validWeather, aqi: null })).toBeNull();
    expect(buildWeatherShareUrl({ ...validWeather, aqi: -1 })).toBeNull();
  });

  it("memakai label WMO bila condition tidak diisi", () => {
    const url = buildWeatherShareUrl({
      name: "Bandung",
      temperature: 26.3,
      weatherCode: 0,
      aqi: 154,
    });
    expect(url).not.toBeNull();
    expect(decodeURIComponent(url.slice("https://wa.me/?text=".length))).toContain("Cerah");
  });
});
