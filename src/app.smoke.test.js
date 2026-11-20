/**
 * Smoke test integrasi UI di DOM virtual (linkedom).
 * Memastikan seluruh dashboard benar-benar ter-render dari respons API tiruan,
 * bukan hanya lolos build. Bukan pengganti uji visual di browser.
 */

import { beforeAll, describe, expect, it } from "vitest";
import { parseHTML } from "linkedom";

const CURRENT_TIME = "2026-11-20T12:00";

function forecastPayload() {
  const hours = Array.from({ length: 6 }, (_, index) => {
    const hour = 12 + index;
    return {
      time: `2026-11-20T${String(hour).padStart(2, "0")}:00`,
      temperature: 29 + index,
      feels: 31 + index,
      rain: 20 + index * 10,
    };
  });

  return {
    latitude: -8.65,
    longitude: 115.21,
    timezone: "Asia/Makassar",
    timezone_abbreviation: "WITA",
    current: {
      time: CURRENT_TIME,
      temperature_2m: 30,
      apparent_temperature: 33,
      weather_code: 1,
      relative_humidity_2m: 70,
      wind_speed_10m: 12,
      wind_direction_10m: 135,
      wind_gusts_10m: 20,
      surface_pressure: 1010,
      is_day: 1,
      cloud_cover: 25,
      precipitation: 0,
      dew_point_2m: 24,
    },
    hourly: {
      time: hours.map((hour) => hour.time),
      temperature_2m: hours.map((hour) => hour.temperature),
      apparent_temperature: hours.map((hour) => hour.feels),
      precipitation_probability: hours.map((hour) => hour.rain),
      weather_code: hours.map(() => 1),
      wind_speed_10m: hours.map(() => 12),
      precipitation: hours.map(() => 0),
      uv_index: hours.map(() => 5),
      visibility: hours.map(() => 10000),
    },
    daily: {
      time: Array.from({ length: 7 }, (_, index) => `2026-11-${20 + index}`),
      weather_code: Array.from({ length: 7 }, () => 2),
      temperature_2m_max: Array.from({ length: 7 }, () => 31),
      temperature_2m_min: Array.from({ length: 7 }, () => 24),
      precipitation_probability_max: Array.from({ length: 7 }, () => 40),
      sunrise: Array.from({ length: 7 }, () => `2026-11-20T05:58`),
      sunset: Array.from({ length: 7 }, () => `2026-11-20T18:21`),
      uv_index_max: Array.from({ length: 7 }, () => 8),
    },
  };
}

function airQualityPayload() {
  const hourlyTime = Array.from({ length: 24 }, (_, index) =>
    `2026-11-20T${String(index).padStart(2, "0")}:00`
  );
  return {
    timezone: "Asia/Makassar",
    current: {
      time: CURRENT_TIME,
      us_aqi: 72,
      pm2_5: 18.4,
      pm10: 26.1,
      carbon_monoxide: 1200,
      nitrogen_dioxide: 18,
      ozone: 75,
    },
    hourly: {
      time: hourlyTime,
      us_aqi: Array.from({ length: 24 }, (_, index) =>
        index >= 13 && index <= 15 ? 42 : 72 + (index % 5)
      ),
      pm2_5: Array.from({ length: 24 }, (_, index) =>
        index >= 13 && index <= 15 ? 12.5 : 18.4 + (index % 4)
      ),
    },
  };
}

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  };
}

beforeAll(async () => {
  const { window, document } = parseHTML(
    '<!doctype html><html lang="id"><body><a class="skip-link" href="#app-main">Lewati</a><div id="app"></div></body></html>'
  );

  const storage = new Map();
  const localStorage = {
    getItem: (key) => (storage.has(key) ? storage.get(key) : null),
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  };

  /* linkedom belum punya setter `select.value`; lengkapi agar perilaku
     komponen (yang valid di browser) dapat diuji. */
  const selectProto = window.HTMLSelectElement?.prototype;
  const valueDescriptor = selectProto && Object.getOwnPropertyDescriptor(selectProto, "value");
  if (selectProto && valueDescriptor && !valueDescriptor.set) {
    Object.defineProperty(selectProto, "value", {
      configurable: true,
      get: valueDescriptor.get,
      set(value) {
        for (const option of this.options) option.selected = option.value === value;
      },
    });
  }

  Object.defineProperties(globalThis, {
    window: { value: window, configurable: true, writable: true },
    document: { value: document, configurable: true, writable: true },
    localStorage: { value: localStorage, configurable: true, writable: true },
    navigator: { value: window.navigator, configurable: true, writable: true },
  });

  globalThis.fetch = async (url) =>
    String(url).includes("air-quality")
      ? jsonResponse(airQualityPayload())
      : jsonResponse(forecastPayload());

  await import("./main.js");
  await new Promise((resolve) => setTimeout(resolve, 20));
});

function text(selector) {
  return document.querySelector(selector)?.textContent?.trim() ?? null;
}

describe("ATMOS app smoke", () => {
  it("merender hero dan seluruh panel dashboard dari data API", () => {
    expect(text(".weather-hero__name")).toBe("Kuta Selatan");
    expect(text(".weather-hero__condition")).toBeTruthy();
    expect(document.querySelectorAll(".hourly-item").length).toBe(6);
    expect(document.querySelectorAll(".daily-row").length).toBe(7);
    expect(document.querySelector(".temp-chart")).not.toBeNull();
    expect(document.querySelectorAll(".atmos-tile").length).toBe(6);
    expect(document.querySelector(".wind-dial")).not.toBeNull();
    expect(document.querySelector(".sun-arc")).not.toBeNull();
    expect(text(".aqi-panel__value")).toBe("72");
  });

  it("merender hero kabut asap, polutan, tren, preset, dan leaderboard", () => {
    expect(text(".haze-hero__value")).toBe("72");
    expect(text(".haze-mask__value")).toBe("Tanpa Masker");
    expect(text(".haze-smoke__number")).toBe("0.8");
    expect(document.querySelectorAll(".pollutant-card").length).toBe(6);
    expect(text(".pollutant-card[data-pollutant='co'] .pollutant-card__number")).toBe("1.20");
    expect(document.querySelector(".air-chart")).not.toBeNull();
    expect(text(".air-trend__best-value")).toContain("–");
    expect(document.querySelectorAll(".location-preset").length).toBe(4);
    expect(document.querySelector(".air-leaderboard__empty")).not.toBeNull();
  });

  it("mengganti bahasa dan satuan tanpa memuat ulang halaman", async () => {
    document.querySelector('[data-locale="en"]').click();
    expect(document.documentElement.lang).toBe("en");
    expect(text(".aqi-panel .section-title")).toBe("AIR QUALITY");
    expect(text(".haze-hero__title")).toBe("Haze Status");
    expect(text(".haze-mask__value")).toBe("No Mask Needed");
    expect(text(".pollutant-panel .section-title")).toBe("POLLUTANTS & VISIBILITY");

    document.querySelector('[data-unit="f"]').click();
    expect(text(".weather-hero__temp-unit")).toBe("°F");
    expect(document.querySelector('[data-unit="f"]').getAttribute("aria-pressed")).toBe("true");
  });

  it("membangun ticker dari data nyata dan menyimpan preferensi", () => {
    expect(document.querySelectorAll(".ticker__item").length).toBeGreaterThan(0);
    const saved = JSON.parse(localStorage.getItem("atmos.v1.preferences"));
    expect(saved).toMatchObject({ unit: "f", locale: "en" });
  });

  it("membuka Command Deck, mengganti tema, dan menyimpan pilihan", () => {
    document.querySelector(".command-button").click();
    const overlay = document.querySelector(".overlay--command");
    expect(overlay.hidden).toBe(false);
    expect(text(".overlay--command .overlay__title")).toBe("Command Deck");
    expect(document.body.classList.contains("overlay-open")).toBe(true);

    const themeCommand = [...document.querySelectorAll(".overlay--command .command__item")].find(
      (item) => item.textContent.includes("Enable Blackout")
    );
    expect(themeCommand).toBeTruthy();
    themeCommand.click();
    expect(document.documentElement.dataset.theme).toBe("blackout");
    expect(localStorage.getItem("atmos.v1.theme")).toBe("blackout");
  });

  it("membuka Airgram dan Battle Mode setelah bahasa diganti", async () => {
    document.querySelector(".haze-hero__card-button").click();
    expect(document.querySelector(".overlay--airgram").hidden).toBe(false);
    expect(text(".overlay--airgram .overlay__title")).toBe("Airgram");
    expect(text(".overlay--airgram .airgram__format")).toBe("Story 9:16");
    document.querySelector(".overlay--airgram .overlay__close").click();
    expect(document.querySelector(".overlay--airgram").hidden).toBe(true);

    document.querySelector(".location-panel__battle").click();
    expect(document.querySelector(".overlay--battle").hidden).toBe(false);
    expect(text(".overlay--battle .overlay__title")).toBe("Air Battle");
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(document.querySelectorAll(".overlay--battle .duel__side").length).toBe(2);
    document.querySelector(".overlay--battle .overlay__close").click();
  });
});
