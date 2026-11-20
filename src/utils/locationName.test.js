import { afterAll, describe, expect, it } from "vitest";
import { setLocale } from "../i18n/index.js";
import { getLocationDisplayName } from "./locationName.js";

afterAll(() => setLocale("id"));

describe("getLocationDisplayName", () => {
  it("mengganti nama lokasi perangkat mengikuti bahasa aktif", () => {
    setLocale("id");
    expect(getLocationDisplayName({ name: "Lokasi saya" })).toBe("Lokasi saya");
    expect(getLocationDisplayName({ name: "My location" })).toBe("Lokasi saya");

    setLocale("en");
    expect(getLocationDisplayName({ name: "Lokasi saya" })).toBe("My location");
    expect(getLocationDisplayName({ name: "My location" })).toBe("My location");
  });

  it("memakai penanda eksplisit bila ada", () => {
    setLocale("en");
    expect(getLocationDisplayName({ name: "Apa saja", isDeviceLocation: true })).toBe(
      "My location"
    );
  });

  it("tidak mengubah nama kota biasa", () => {
    setLocale("en");
    expect(getLocationDisplayName({ name: "Kota Denpasar" })).toBe("Kota Denpasar");
  });

  it("aman untuk lokasi kosong", () => {
    expect(getLocationDisplayName(null)).toBe("—");
  });
});
