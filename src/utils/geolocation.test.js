import { afterEach, describe, expect, it, vi } from "vitest";
import { GEO_ERROR_KEYS, getCurrentPosition, mapGeolocationError } from "./geolocation.js";

const originalNavigator = globalThis.navigator;

afterEach(() => {
  Object.defineProperty(globalThis, "navigator", {
    value: originalNavigator,
    configurable: true,
    writable: true,
  });
});

function stubGeolocation(geolocation) {
  Object.defineProperty(globalThis, "navigator", {
    value: { geolocation },
    configurable: true,
    writable: true,
  });
}

describe("mapGeolocationError", () => {
  it("memetakan kode error browser ke key kamus", () => {
    expect(mapGeolocationError({ code: 1 })).toBe(GEO_ERROR_KEYS.PERMISSION_DENIED);
    expect(mapGeolocationError({ code: 2 })).toBe(GEO_ERROR_KEYS.POSITION_UNAVAILABLE);
    expect(mapGeolocationError({ code: 3 })).toBe(GEO_ERROR_KEYS.TIMEOUT);
    expect(mapGeolocationError(null)).toBe(GEO_ERROR_KEYS.UNSUPPORTED);
  });
});

describe("getCurrentPosition", () => {
  it("menolak dengan key unsupported bila API tidak ada", async () => {
    stubGeolocation(undefined);
    await expect(getCurrentPosition()).rejects.toMatchObject({
      key: GEO_ERROR_KEYS.UNSUPPORTED,
    });
  });

  it("mengembalikan koordinat dari browser", async () => {
    stubGeolocation({
      getCurrentPosition: vi.fn((success) =>
        success({ coords: { latitude: -8.65, longitude: 115.21, accuracy: 12 } })
      ),
    });
    await expect(getCurrentPosition()).resolves.toEqual({
      latitude: -8.65,
      longitude: 115.21,
      accuracy: 12,
    });
  });

  it("menolak dengan key hasil pemetaan saat browser gagal", async () => {
    stubGeolocation({
      getCurrentPosition: vi.fn((_, failure) => failure({ code: 1 })),
    });
    await expect(getCurrentPosition()).rejects.toMatchObject({
      key: GEO_ERROR_KEYS.PERMISSION_DENIED,
      code: 1,
    });
  });
});
